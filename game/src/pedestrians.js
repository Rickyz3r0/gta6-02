// Pedestrian crowd simulation, boardwalk strollers, syndicate rivals, panic/flee behavior,
// and dropped loot cash pickups across Palmera City's six coastal districts.

import { clamp, randomChoice, randomRange } from './random.js';

const CIVILIAN_OUTFITS = [
  { shirt: '#ff6b8b', pants: '#1e293b', skin: '#f1c29b', hair: '#2b1e16' },
  { shirt: '#2de2e6', pants: '#334155', skin: '#d99c72', hair: '#121218' },
  { shirt: '#ffb347', pants: '#1f2937', skin: '#a86b49', hair: '#1d1410' },
  { shirt: '#a855f7', pants: '#0f172a', skin: '#f5cfa8', hair: '#5a3820' },
  { shirt: '#2ee59d', pants: '#1e2436', skin: '#c88c65', hair: '#0f1014' },
  { shirt: '#f8fafc', pants: '#273549', skin: '#e8b38a', hair: '#3b2416' },
];

let nextPedUid = 1;

export function createPedestrianSystem(cityMap, rng) {
  const pedestrians = [];
  const cashDrops = [];

  function spawnPedestrian(x, y, role = 'civilian', overrides = {}) {
    const outfit = role === 'syndicate'
      ? { shirt: '#b91c1c', pants: '#111827', skin: '#d89b72', hair: '#141418' }
      : role === 'officer'
        ? { shirt: '#1d4ed8', pants: '#0f172a', skin: '#e5b38a', hair: '#1b1d24' }
        : randomChoice(rng, CIVILIAN_OUTFITS);

    const ped = {
      id: nextPedUid++,
      x,
      y,
      angle: randomRange(rng, 0, Math.PI * 2),
      walkPhase: randomRange(rng, 0, Math.PI * 2),
      speed: role === 'civilian' ? randomRange(rng, 42, 68) : 92,
      role, // 'civilian' | 'syndicate' | 'officer'
      health: role === 'civilian' ? 50 : role === 'officer' ? 90 : 105,
      maxHealth: role === 'civilian' ? 50 : role === 'officer' ? 90 : 105,
      alive: true,
      fleeing: false,
      fleeTimer: 0,
      fireCooldown: randomRange(rng, 0.4, 1.2),
      outfit,
      patrolOriginX: x,
      patrolOriginY: y,
      ...overrides,
    };
    pedestrians.push(ped);
    return ped;
  }

  function spawnInitialCrowds() {
    pedestrians.length = 0;
    cashDrops.length = 0;
    nextPedUid = 1;

    // Boardwalk & Coral Drive Strip pedestrians
    for (let y = 380; y < 3220; y += 110) {
      spawnPedestrian(3945 + randomRange(rng, -24, 30), y + randomRange(rng, -20, 20), 'civilian');
      if (rng() > 0.35) {
        spawnPedestrian(3675 + randomRange(rng, -18, 18), y + randomRange(rng, -30, 30), 'civilian');
      }
    }

    // Downtown, Marina, and Causeway sidewalk crowds
    for (const node of cityMap.intersections) {
      for (let k = 0; k < 2; k += 1) {
        const sx = node.x + (k === 0 ? -92 : 92) + randomRange(rng, -18, 18);
        const sy = node.y + (rng() > 0.5 ? -86 : 86) + randomRange(rng, -18, 18);
        if (cityMap.isOnBridgeOrLand(sx, sy)) {
          spawnPedestrian(sx, sy, 'civilian');
        }
      }
    }

    // Mariposa Marina Pier 7 Syndicate Crew
    spawnPedestrian(4120, 2065, 'syndicate');
    spawnPedestrian(4185, 2095, 'syndicate');
    spawnPedestrian(4255, 2070, 'syndicate');
    spawnPedestrian(4010, 2115, 'syndicate');
  }

  function alertDangerAt(x, y, radius = 340) {
    for (const p of pedestrians) {
      if (!p.alive || p.role !== 'civilian') continue;
      if (Math.hypot(p.x - x, p.y - y) < radius) {
        p.fleeing = true;
        p.fleeTimer = 7.5;
        p.angle = Math.atan2(p.y - y, p.x - x) + randomRange(rng, -0.35, 0.35);
      }
    }
  }

  function damagePedestrian(p, amount, world, fromPlayer = true) {
    if (!p.alive) return;
    p.health -= amount;
    world.combat.spawnBloodOrSparks(p.x, p.y, '#ff4d6d', 6);
    if (p.health <= 0) {
      p.alive = false;
      const cashAmount = p.role === 'syndicate' ? 450 : p.role === 'officer' ? 250 : 120;
      cashDrops.push({ x: p.x, y: p.y, amount: cashAmount, pulse: 0 });
      if (fromPlayer) {
        if (p.role === 'officer') {
          world.wanted.reportCrime('officer_down', p.x, p.y, 2);
        } else if (p.role === 'civilian') {
          world.wanted.reportCrime('assault', p.x, p.y, 1);
        } else if (p.role === 'syndicate') {
          world.stats.rivalsNeutralized += 1;
        }
      }
    } else if (p.role === 'civilian') {
      p.fleeing = true;
      p.fleeTimer = 8;
    }
  }

  function stepPedestrians(dt, world) {
    const px = world.player.x;
    const py = world.player.y;

    for (const p of pedestrians) {
      if (!p.alive) continue;

      if (p.role === 'civilian') {
        const moveSpeed = p.fleeing ? 128 : p.speed;
        if (p.fleeing) {
          p.fleeTimer -= dt;
          if (p.fleeTimer <= 0) p.fleeing = false;
        } else if (rng() < dt * 0.45) {
          p.angle += randomRange(rng, -0.9, 0.9);
        }
        const nextX = p.x + Math.cos(p.angle) * moveSpeed * dt;
        const nextY = p.y + Math.sin(p.angle) * moveSpeed * dt;
        const resolved = cityMap.resolveBuildingCollision(nextX, nextY, 10);
        if (resolved.hitBuilding || !cityMap.isOnBridgeOrLand(nextX, nextY)) {
          p.angle += Math.PI * 0.72;
        }
        p.x = resolved.x;
        p.y = resolved.y;
        p.walkPhase += moveSpeed * dt * 0.14;
      } else {
        // Hostile syndicate guards or on-foot SPPD officers engage player when nearby
        const dist = Math.hypot(px - p.x, py - p.y);
        const shouldAggro = p.role === 'syndicate'
          ? dist < 440
          : (world.wanted.stars > 0 && dist < 520);

        if (shouldAggro) {
          p.angle = Math.atan2(py - p.y, px - p.x);
          if (dist > 175) {
            const nx = p.x + Math.cos(p.angle) * p.speed * dt;
            const ny = p.y + Math.sin(p.angle) * p.speed * dt;
            const resolved = cityMap.resolveBuildingCollision(nx, ny, 11);
            p.x = resolved.x;
            p.y = resolved.y;
            p.walkPhase += p.speed * dt * 0.14;
          }
          p.fireCooldown -= dt;
          if (p.fireCooldown <= 0 && dist < 410) {
            p.fireCooldown = p.role === 'officer' ? 0.72 : 0.85;
            world.combat.fireNpcShot(p.x, p.y, p.angle + randomRange(rng, -0.1, 0.1), p.role === 'officer' ? '#3a86ff' : '#ff5e7e', 8);
          }
        } else {
          // Patrol softly near origin
          const homeDist = Math.hypot(p.patrolOriginX - p.x, p.patrolOriginY - p.y);
          if (homeDist > 120) {
            p.angle = Math.atan2(p.patrolOriginY - p.y, p.patrolOriginX - p.x);
          } else if (rng() < dt * 0.4) {
            p.angle += randomRange(rng, -1.2, 1.2);
          }
          const nx = p.x + Math.cos(p.angle) * 35 * dt;
          const ny = p.y + Math.sin(p.angle) * 35 * dt;
          const resolved = cityMap.resolveBuildingCollision(nx, ny, 11);
          p.x = resolved.x;
          p.y = resolved.y;
          p.walkPhase += 35 * dt * 0.14;
        }
      }

      // Check high-speed vehicle strike on pedestrian
      for (const v of world.vehicleSystem.vehicles) {
        if (v.wrecked || Math.abs(v.speed) < 120) continue;
        if (Math.hypot(v.x - p.x, v.y - p.y) < 30) {
          damagePedestrian(p, 120, world, v.driver === 'player');
          break;
        }
      }
    }

    // Collect dropped syndicate cash pickups
    for (let i = cashDrops.length - 1; i >= 0; i -= 1) {
      const drop = cashDrops[i];
      drop.pulse += dt * 4;
      if (Math.hypot(px - drop.x, py - drop.y) < 42) {
        world.player.cash += drop.amount;
        world.notify(`Picked up +$${drop.amount} cash`);
        cashDrops.splice(i, 1);
      }
    }
  }

  return {
    pedestrians,
    cashDrops,
    spawnPedestrian,
    spawnInitialCrowds,
    alertDangerAt,
    damagePedestrian,
    stepPedestrians,
  };
}
