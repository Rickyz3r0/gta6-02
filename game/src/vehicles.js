// Vehicle physics, lane-following traffic AI, handbrake drifting, skid marks, carjacking,
// damage/fire states, and Neon Respray garage repair for Palmera City.

import { VEHICLE_CATALOG } from './config.js';
import { angleDiff, clamp, randomChoice, randomRange } from './random.js';

const CIVILIAN_TYPES = ['solaria-gtr', 'veloce-apex', 'palmera-cruiser', 'caiman-4x4', 'aurelia-van'];
const PAINT_SWATCHES = ['#16d9e3', '#ff5e7e', '#ff6b35', '#2ee59d', '#ffb347', '#a855f7', '#38bdf8', '#f43f5e'];

let nextVehicleUid = 1;

export function createVehicle(typeId, x, y, angle = 0, overrides = {}) {
  const spec = VEHICLE_CATALOG[typeId] ?? VEHICLE_CATALOG['solaria-gtr'];
  return {
    id: nextVehicleUid++,
    typeId: spec.id,
    name: spec.name,
    category: spec.category,
    isPolice: Boolean(spec.isPolice),
    x,
    y,
    vx: 0,
    vy: 0,
    speed: 0,
    angle,
    steer: 0,
    width: spec.width,
    height: spec.height,
    maxSpeed: spec.maxSpeed,
    accel: spec.accel,
    brake: spec.brake,
    turnRate: spec.turnRate,
    driftGrip: spec.driftGrip,
    health: spec.maxHealth,
    maxHealth: spec.maxHealth,
    bodyColor: overrides.bodyColor ?? spec.bodyColor,
    stripeColor: overrides.stripeColor ?? spec.stripeColor,
    glassColor: spec.glassColor,
    driver: overrides.driver ?? 'ai', // 'player' | 'ai' | 'police' | 'syndicate' | null
    sirenOn: Boolean(overrides.sirenOn ?? spec.isPolice),
    sirenPhase: overrides.sirenPhase ?? 0,
    drifting: false,
    headlights: true,
    nitroBoost: 0,
    wrecked: false,
    fireTimer: 0,
    laneAxis: overrides.laneAxis ?? 'h', // 'h' or 'v'
    laneDir: overrides.laneDir ?? 1,
    targetSpeed: overrides.targetSpeed ?? (spec.maxSpeed * 0.42),
    missionRole: overrides.missionRole ?? null,
    ...overrides,
  };
}

export function createVehicleSystem(cityMap, rng) {
  const vehicles = [];
  const skidMarks = [];

  function spawnInitialTraffic() {
    vehicles.length = 0;
    skidMarks.length = 0;
    nextVehicleUid = 1;

    // Populate horizontal boulevards with bidirectional coastal traffic
    for (const road of cityMap.horizontalRoads) {
      for (let x = road.x1 + 180; x < road.x2 - 180; x += 520) {
        const dir = rng() > 0.5 ? 1 : -1;
        const laneY = road.y + (dir === 1 ? 26 : -26);
        const typeId = randomChoice(rng, CIVILIAN_TYPES);
        const color = typeId === 'aurelia-van' ? undefined : randomChoice(rng, PAINT_SWATCHES);
        vehicles.push(createVehicle(typeId, x + randomRange(rng, -90, 90), laneY, dir === 1 ? 0 : Math.PI, {
          driver: 'ai',
          bodyColor: color,
          laneAxis: 'h',
          laneDir: dir,
          targetSpeed: randomRange(rng, 145, 225),
        }));
      }
    }

    // Populate vertical avenues with traffic
    for (const road of cityMap.verticalRoads) {
      for (let y = road.y1 + 220; y < road.y2 - 220; y += 560) {
        const dir = rng() > 0.5 ? 1 : -1;
        const laneX = road.x + (dir === 1 ? -26 : 26);
        const typeId = randomChoice(rng, CIVILIAN_TYPES);
        const color = typeId === 'aurelia-van' ? undefined : randomChoice(rng, PAINT_SWATCHES);
        vehicles.push(createVehicle(typeId, laneX, y + randomRange(rng, -80, 80), dir === 1 ? Math.PI * 0.5 : -Math.PI * 0.5, {
          driver: 'ai',
          bodyColor: color,
          laneAxis: 'v',
          laneDir: dir,
          targetSpeed: randomRange(rng, 140, 215),
        }));
      }
    }

    // Parked showcase exotics near safehouses, Coral Drive Strip, and Mariposa Marina
    vehicles.push(createVehicle('solaria-gtr', 3680, 940, -Math.PI * 0.5, { driver: null, bodyColor: '#16d9e3', stripeColor: '#ff2a85' }));
    vehicles.push(createVehicle('veloce-apex', 3920, 2040, Math.PI * 0.5, { driver: null, bodyColor: '#ff6b35', stripeColor: '#ffe66d' }));
    vehicles.push(createVehicle('caiman-4x4', 1520, 1700, 0, { driver: null, bodyColor: '#2ee59d', stripeColor: '#0b1320' }));
    vehicles.push(createVehicle('palmera-cruiser', 3685, 1380, Math.PI * 0.5, { driver: null, bodyColor: '#ff5e7e', stripeColor: '#fff1d0' }));
  }

  function addSkidMark(x, y, angle, alpha = 0.42) {
    skidMarks.push({ x, y, angle, alpha });
    if (skidMarks.length > 420) skidMarks.shift();
  }

  function findCarjackCandidate(playerX, playerY, maxRange = 98) {
    let best = null;
    let bestDist = maxRange;
    for (const v of vehicles) {
      if (v.wrecked) continue;
      const d = Math.hypot(v.x - playerX, v.y - playerY);
      if (d < bestDist) {
        bestDist = d;
        best = v;
      }
    }
    return best;
  }

  function attemptCarjack(world) {
    const player = world.player;
    if (player.vehicle) {
      // Exit current vehicle onto the driver's side
      const v = player.vehicle;
      v.driver = null;
      v.drifting = false;
      player.vehicle = null;
      const sideAngle = v.angle - Math.PI * 0.5;
      const exitPos = cityMap.resolveBuildingCollision(
        v.x + Math.cos(sideAngle) * 44,
        v.y + Math.sin(sideAngle) * 44,
        14
      );
      player.x = exitPos.x;
      player.y = exitPos.y;
      world.notify(`Exited ${v.name} — On foot in ${cityMap.getDistrictAt(player.x, player.y).name}`);
      return { action: 'exited', vehicle: v };
    }

    const target = findCarjackCandidate(player.x, player.y, 105);
    if (!target) return null;

    const wasOccupied = target.driver === 'ai' || target.driver === 'police' || target.driver === 'syndicate';
    const wasPolice = target.isPolice;

    target.driver = 'player';
    target.speed *= 0.35;
    player.vehicle = target;
    player.x = target.x;
    player.y = target.y;
    world.stats.vehiclesStolen += 1;

    if (wasOccupied || wasPolice) {
      world.wanted.reportCrime(wasPolice ? 'police_theft' : 'carjacking', target.x, target.y, wasPolice ? 2 : 1);
      world.notify(`Carjacked ${target.name}! ${wasPolice ? 'SPPD Unit Compromised (+2 Heat)' : 'Witness reported grand theft auto'}`);
    } else {
      world.notify(`Entered ${target.name} (${target.category})`);
    }
    return { action: 'entered', vehicle: target, stolen: wasOccupied || wasPolice };
  }

  function stepPlayerVehicle(v, inputState, dt, world) {
    const throttle = (inputState.up ? 1 : 0) - (inputState.down ? 1 : 0);
    const steerInput = (inputState.right ? 1 : 0) - (inputState.left ? 1 : 0);
    const handbrake = Boolean(inputState.handbrake);
    const boost = Boolean(inputState.sprint) && throttle > 0;

    const topSpeed = boost ? v.maxSpeed * 1.18 : v.maxSpeed;
    const accelRate = boost ? v.accel * 1.38 : v.accel;

    if (throttle > 0) {
      v.speed = clamp(v.speed + accelRate * dt, -v.maxSpeed * 0.42, topSpeed);
    } else if (throttle < 0) {
      if (v.speed > 20) {
        v.speed = Math.max(0, v.speed - v.brake * dt);
      } else {
        v.speed = Math.max(-v.maxSpeed * 0.42, v.speed - v.accel * 0.65 * dt);
      }
    } else {
      v.speed *= Math.pow(0.28, dt);
      if (Math.abs(v.speed) < 3) v.speed = 0;
    }

    if (handbrake) {
      v.speed *= Math.pow(0.48, dt);
    }

    const speedRatio = clamp(Math.abs(v.speed) / 140, 0, 1);
    const reverseSign = v.speed >= -5 ? 1 : -1;
    const driftTurnMul = handbrake ? 1.48 : 1.0;
    v.angle += steerInput * v.turnRate * driftTurnMul * speedRatio * reverseSign * dt;

    // Lateral velocity blending for authentic arcade drift feel
    const forwardX = Math.cos(v.angle) * v.speed;
    const forwardY = Math.sin(v.angle) * v.speed;
    const grip = handbrake ? 0.16 : 0.34;
    const blend = 1 - Math.pow(1 - grip, dt * 60);
    v.vx += (forwardX - v.vx) * blend;
    v.vy += (forwardY - v.vy) * blend;

    const lateralSpeed = Math.abs(-Math.sin(v.angle) * v.vx + Math.cos(v.angle) * v.vy);
    v.drifting = (handbrake && Math.abs(v.speed) > 95) || lateralSpeed > 65;
    v.nitroBoost = boost && v.speed > 120 ? 1 : Math.max(0, v.nitroBoost - dt * 3);

    if (v.drifting) {
      const rearX = v.x - Math.cos(v.angle) * (v.width * 0.34);
      const rearY = v.y - Math.sin(v.angle) * (v.width * 0.34);
      const perpX = -Math.sin(v.angle) * (v.height * 0.34);
      const perpY = Math.cos(v.angle) * (v.height * 0.34);
      addSkidMark(rearX + perpX, rearY + perpY, v.angle, 0.46);
      addSkidMark(rearX - perpX, rearY - perpY, v.angle, 0.46);
    }

    // Check Neon Respray Garage proximity
    for (const g of cityMap.garages) {
      if (Math.hypot(v.x - g.x, v.y - g.y) < g.radius && Math.abs(v.speed) < 120) {
        if ((world.wanted.stars > 0 || v.health < v.maxHealth * 0.85) && world.player.cash >= g.cost && world.resprayCooldown <= 0) {
          world.player.cash -= g.cost;
          v.health = v.maxHealth;
          v.bodyColor = randomChoice(rng, PAINT_SWATCHES);
          world.wanted.clearWantedAtGarage(g.name);
          world.resprayCooldown = 5.0;
          world.notify(`${g.name}: Vehicle repainted, repaired & SPPD warrant wiped (-$${g.cost})`);
        }
      }
    }
  }

  function stepCivilianTraffic(v, dt) {
    // Follow horizontal or vertical boulevard lanes cleanly and wrap at city borders
    const desiredAngle = v.laneAxis === 'h'
      ? (v.laneDir === 1 ? 0 : Math.PI)
      : (v.laneDir === 1 ? Math.PI * 0.5 : -Math.PI * 0.5);

    const diff = angleDiff(v.angle, desiredAngle);
    v.angle += clamp(diff, -2.5 * dt, 2.5 * dt);

    // Check distance to nearest car ahead so traffic avoids piling up
    let blocked = false;
    const lookX = v.x + Math.cos(v.angle) * 95;
    const lookY = v.y + Math.sin(v.angle) * 95;
    for (const other of vehicles) {
      if (other.id === v.id) continue;
      if (Math.hypot(other.x - lookX, other.y - lookY) < 58) {
        blocked = true;
        break;
      }
    }

    const goalSpeed = blocked ? 0 : v.targetSpeed;
    v.speed += clamp(goalSpeed - v.speed, -320 * dt, 180 * dt);
    v.vx = Math.cos(v.angle) * v.speed;
    v.vy = Math.sin(v.angle) * v.speed;

    // Wrap cleanly along road corridors
    if (v.laneAxis === 'h') {
      if (v.laneDir === 1 && v.x > 3900) v.x = 220;
      else if (v.laneDir === -1 && v.x < 220) v.x = 3900;
    } else {
      if (v.laneDir === 1 && v.y > 3280) v.y = 260;
      else if (v.laneDir === -1 && v.y < 260) v.y = 3280;
    }
  }

  function damageVehicle(v, amount, world, source = 'combat') {
    if (v.wrecked) return;
    v.health = Math.max(0, v.health - amount);
    if (v.health <= 0) {
      v.wrecked = true;
      v.driver = null;
      v.speed *= 0.2;
      v.vx *= 0.2;
      v.vy *= 0.2;
      v.fireTimer = 18;
      world.combat.spawnExplosion(v.x, v.y, 130, world);
      if (v.isPolice) {
        world.stats.policeEvaded += 1;
      }
      if (world.player.vehicle && world.player.vehicle.id === v.id) {
        world.player.vehicle = null;
        world.player.health = Math.max(10, world.player.health - 35);
      }
      if (source === 'player') {
        world.wanted.reportCrime('vehicle_destroyed', v.x, v.y, v.isPolice ? 2 : 1);
      }
    }
  }

  function stepVehicles(dt, inputState, world) {
    for (const v of vehicles) {
      if (v.sirenOn && !v.wrecked) {
        v.sirenPhase = (v.sirenPhase + dt * 7.5) % (Math.PI * 2);
      }
      if (v.wrecked) {
        v.vx *= Math.pow(0.08, dt);
        v.vy *= Math.pow(0.08, dt);
        if (v.fireTimer > 0) v.fireTimer = Math.max(0, v.fireTimer - dt);
        continue;
      }

      if (v.driver === 'player') {
        stepPlayerVehicle(v, inputState, dt, world);
      } else if (v.driver === 'ai') {
        stepCivilianTraffic(v, dt);
      } else if (v.driver === null) {
        v.vx *= Math.pow(0.12, dt);
        v.vy *= Math.pow(0.12, dt);
        v.speed *= Math.pow(0.12, dt);
      }
      // Police and syndicate convoy vehicles are steered in police-wanted.js & missions.js

      const nextX = v.x + v.vx * dt;
      const nextY = v.y + v.vy * dt;
      const resolved = cityMap.resolveBuildingCollision(nextX, nextY, Math.max(v.width, v.height) * 0.38);
      if (resolved.hitBuilding) {
        const impactSpeed = Math.hypot(v.vx, v.vy);
        if (impactSpeed > 130) {
          damageVehicle(v, impactSpeed * 0.06, world, 'crash');
          world.combat.spawnSparks(resolved.x, resolved.y, 8);
          if (v.driver === 'player') world.camera.shake = Math.min(14, impactSpeed * 0.03);
        }
        v.vx *= -0.25;
        v.vy *= -0.25;
        v.speed *= -0.25;
      }
      v.x = resolved.x;
      v.y = resolved.y;
    }

    // Vehicle-to-vehicle collisions
    for (let i = 0; i < vehicles.length; i += 1) {
      const a = vehicles[i];
      for (let j = i + 1; j < vehicles.length; j += 1) {
        const b = vehicles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = (a.height + b.height) * 0.72;
        const distSq = dx * dx + dy * dy;
        if (distSq > 0.001 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const overlap = (minDist - dist) * 0.52;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          const relSpeed = Math.hypot(a.vx - b.vx, a.vy - b.vy);
          if (relSpeed > 110) {
            const dmg = relSpeed * 0.075;
            damageVehicle(a, dmg, world, b.driver === 'player' ? 'player' : 'crash');
            damageVehicle(b, dmg, world, a.driver === 'player' ? 'player' : 'crash');
            world.combat.spawnSparks((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 10);
            if (a.driver === 'player' || b.driver === 'player') {
              world.camera.shake = Math.min(16, relSpeed * 0.035);
              if (a.isPolice || b.isPolice) {
                world.wanted.reportCrime('police_ram', a.x, a.y, 1);
              }
            }
          }
          a.vx -= nx * relSpeed * 0.22;
          a.vy -= ny * relSpeed * 0.22;
          b.vx += nx * relSpeed * 0.22;
          b.vy += ny * relSpeed * 0.22;
        }
      }
    }
  }

  return {
    vehicles,
    skidMarks,
    spawnInitialTraffic,
    findCarjackCandidate,
    attemptCarjack,
    damageVehicle,
    stepVehicles,
    addSkidMark,
  };
}
