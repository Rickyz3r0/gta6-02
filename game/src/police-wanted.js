// 5-Star Wanted Level & Solaria Palm Police Department (SPPD) Tactical Pursuit System:
// Patrol cruisers, siren lightbars, pit maneuvers, SWAT armored vans, and pursuit chopper searchlights.

import { angleDiff, clamp, randomRange } from './random.js';
import { createVehicle } from './vehicles.js';

const HEAT_LABELS = [
  'PATROL CLEAR · NO ACTIVE WARRANT',
  '1-STAR · SPPD PATROL RESPONDING',
  '2-STAR · DUAL INTERCEPTORS IN PURSUIT',
  '3-STAR · TACTICAL ROADBLOCKS AUTHORIZED',
  '4-STAR · SPPD SWAT ENFORCERS DEPLOYED',
  '5-STAR · CITYWIDE LOCKDOWN & CHOPPER SWEEP',
];

export function createWantedSystem(cityMap, rng) {
  const state = {
    stars: 0,
    heatPoints: 0,
    evadeTimer: 0,
    flashTimer: 0,
    radarLocked: false,
    chopper: {
      active: false,
      x: 3400,
      y: 1100,
      spotX: 3500,
      spotY: 1150,
      orbitAngle: 0,
    },
  };

  function getStatusLabel() {
    if (state.stars === 0) return HEAT_LABELS[0];
    if (!state.radarLocked && state.evadeTimer > 0) {
      return `EVADING SPPD · COOLING DOWN (${Math.ceil(state.evadeTimer)}s)`;
    }
    return HEAT_LABELS[clamp(state.stars, 0, 5)];
  }

  function setStars(level) {
    state.stars = clamp(Math.round(level), 0, 5);
    state.heatPoints = state.stars * 100;
    state.evadeTimer = state.stars > 0 ? 18 + state.stars * 4 : 0;
    state.chopper.active = state.stars >= 4;
  }

  function reportCrime(kind, x, y, starBoost = 1) {
    const nextStars = clamp(Math.max(state.stars, 1) + (state.stars === 0 ? starBoost - 1 : starBoost), 1, 5);
    state.stars = Math.max(state.stars, nextStars);
    state.evadeTimer = 18 + state.stars * 5;
    state.radarLocked = true;
    state.chopper.active = state.stars >= 4;
    if (state.chopper.active) {
      state.chopper.spotX = x;
      state.chopper.spotY = y;
    }
  }

  function clearWantedAtGarage() {
    state.stars = 0;
    state.heatPoints = 0;
    state.evadeTimer = 0;
    state.radarLocked = false;
    state.chopper.active = false;
  }

  function spawnPoliceUnitNearPlayer(world) {
    const px = world.player.x;
    const py = world.player.y;
    const angle = randomRange(rng, 0, Math.PI * 2);
    const spawnDist = randomRange(rng, 420, 640);
    const rawX = clamp(px + Math.cos(angle) * spawnDist, 260, 3920);
    const rawY = clamp(py + Math.sin(angle) * spawnDist, 280, 3300);
    const resolved = cityMap.resolveBuildingCollision(rawX, rawY, 34);
    const typeId = state.stars >= 4 && rng() > 0.45 ? 'sppd-swat' : 'sppd-interceptor';

    const unit = createVehicle(typeId, resolved.x, resolved.y, Math.atan2(py - resolved.y, px - resolved.x), {
      driver: 'police',
      sirenOn: true,
      sirenPhase: randomRange(rng, 0, Math.PI * 2),
    });
    world.vehicleSystem.vehicles.push(unit);
    return unit;
  }

  function stepWanted(dt, world) {
    state.flashTimer += dt * 6;
    if (state.stars === 0) {
      state.radarLocked = false;
      state.chopper.active = false;
      return;
    }

    const px = world.player.x;
    const py = world.player.y;
    const policeUnits = world.vehicleSystem.vehicles.filter((v) => v.isPolice && v.driver === 'police' && !v.wrecked);
    const targetUnitCount = clamp(state.stars + 1, 1, 5);

    if (policeUnits.length < targetUnitCount) {
      spawnPoliceUnitNearPlayer(world);
    }

    let seenByPolice = false;
    for (const unit of policeUnits) {
      const dx = px - unit.x;
      const dy = py - unit.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 620) seenByPolice = true;

      // Aggressive pursuit & pit-maneuver steering toward player's predicted lead position
      const leadX = px + (world.player.vehicle ? world.player.vehicle.vx * 0.4 : 0);
      const leadY = py + (world.player.vehicle ? world.player.vehicle.vy * 0.4 : 0);
      const desiredAngle = Math.atan2(leadY - unit.y, leadX - unit.x);
      const diff = angleDiff(unit.angle, desiredAngle);
      unit.angle += clamp(diff, -unit.turnRate * 1.15 * dt, unit.turnRate * 1.15 * dt);

      const pursueSpeed = dist > 110 ? unit.maxSpeed * (0.78 + state.stars * 0.045) : unit.maxSpeed * 0.45;
      unit.speed += clamp(pursueSpeed - unit.speed, -380 * dt, unit.accel * dt);
      unit.vx = Math.cos(unit.angle) * unit.speed;
      unit.vy = Math.sin(unit.angle) * unit.speed;
      unit.sirenOn = true;

      // At 2+ stars, officers fire tactical bursts when close
      if (state.stars >= 2 && dist < 340 && rng() < dt * (0.5 + state.stars * 0.25)) {
        world.combat.fireNpcShot(unit.x, unit.y, Math.atan2(py - unit.y, px - unit.x) + randomRange(rng, -0.14, 0.14), '#3a86ff', 7);
      }
    }

    // Update Pursuit Helicopter Searchlight (4–5 stars)
    state.chopper.active = state.stars >= 4;
    if (state.chopper.active) {
      state.chopper.orbitAngle += dt * 0.85;
      state.chopper.x = px + Math.cos(state.chopper.orbitAngle) * 210;
      state.chopper.y = py + Math.sin(state.chopper.orbitAngle) * 165;
      state.chopper.spotX += (px + Math.cos(state.chopper.orbitAngle * 2.1) * 55 - state.chopper.spotX) * Math.min(1, dt * 3.5);
      state.chopper.spotY += (py + Math.sin(state.chopper.orbitAngle * 1.7) * 45 - state.chopper.spotY) * Math.min(1, dt * 3.5);
      seenByPolice = true;
    }

    state.radarLocked = seenByPolice;
    if (seenByPolice) {
      state.evadeTimer = 16 + state.stars * 4;
    } else {
      state.evadeTimer -= dt;
      if (state.evadeTimer <= 0) {
        state.stars = 0;
        state.radarLocked = false;
        world.stats.policeEvaded += 1;
        world.notify('SPPD Pursuit Evaded! Heat cleared (+$1,500 reputation bonus)');
        world.player.cash += 1500;
      }
    }
  }

  return {
    get stars() { return state.stars; },
    get radarLocked() { return state.radarLocked; },
    get evadeTimer() { return state.evadeTimer; },
    get flashTimer() { return state.flashTimer; },
    get chopper() { return state.chopper; },
    getStatusLabel,
    setStars,
    reportCrime,
    clearWantedAtGarage,
    spawnPoliceUnitNearPlayer,
    stepWanted,
  };
}
