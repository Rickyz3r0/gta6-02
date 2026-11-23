// Ballistic combat system, 5-weapon arsenal, tracers, muzzle flashes, shell sparks,
// explosions, shockwave rings, and fire/smoke particles for on-foot and drive-by action.

import { WEAPON_ARSENAL } from './config.js';
import { randomRange } from './random.js';

export function createCombatSystem(cityMap, rng) {
  const projectiles = [];
  const particles = [];
  const shockwaves = [];
  const muzzleFlashes = [];

  function spawnParticles(x, y, color, count, speedMin, speedMax, lifeMin, lifeMax, sizeMin, sizeMax) {
    for (let i = 0; i < count; i += 1) {
      const a = randomRange(rng, 0, Math.PI * 2);
      const spd = randomRange(rng, speedMin, speedMax);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: randomRange(rng, lifeMin, lifeMax),
        maxLife: lifeMax,
        size: randomRange(rng, sizeMin, sizeMax),
        color,
      });
    }
  }

  function spawnSparks(x, y, count = 8) {
    spawnParticles(x, y, '#ffd166', count, 70, 240, 0.16, 0.42, 2, 4.5);
    spawnParticles(x, y, '#ff5e7e', Math.ceil(count * 0.5), 40, 160, 0.14, 0.35, 2, 3.5);
  }

  function spawnBloodOrSparks(x, y, color, count = 6) {
    spawnParticles(x, y, color, count, 45, 165, 0.18, 0.45, 2.5, 4.5);
  }

  function spawnExplosion(x, y, radius = 125, world = null) {
    shockwaves.push({ x, y, radius: 12, maxRadius: radius, life: 0.46, maxLife: 0.46 });
    spawnParticles(x, y, '#ff9f1c', 26, 60, 310, 0.25, 0.72, 4, 11);
    spawnParticles(x, y, '#ff2a55', 18, 40, 230, 0.28, 0.75, 5, 13);
    spawnParticles(x, y, '#383e56', 16, 20, 110, 0.55, 1.25, 8, 18);

    if (world) {
      world.camera.shake = Math.max(world.camera.shake, 18);
      world.pedSystem.alertDangerAt(x, y, 420);
      world.audio.playSfx('explosion');
      // Splash damage to nearby entities
      for (const ped of world.pedSystem.pedestrians) {
        if (!ped.alive) continue;
        if (Math.hypot(ped.x - x, ped.y - y) < radius) {
          world.pedSystem.damagePedestrian(ped, 140, world, true);
        }
      }
      for (const v of world.vehicleSystem.vehicles) {
        if (v.wrecked) continue;
        const d = Math.hypot(v.x - x, v.y - y);
        if (d > 4 && d < radius) {
          world.vehicleSystem.damageVehicle(v, 95, world, 'player');
        }
      }
    }
  }

  function firePlayerWeapon(world, aimAngle) {
    const player = world.player;
    const weapon = player.weapons[player.weaponIndex];
    if (!weapon || player.fireCooldown > 0) return false;
    if (weapon.ammo <= 0) {
      if (weapon.reserve > 0) {
        const refill = Math.min(weapon.clipSize, weapon.reserve);
        weapon.ammo = refill;
        weapon.reserve -= refill;
      } else {
        return false;
      }
    }

    weapon.ammo -= 1;
    player.fireCooldown = weapon.fireInterval;
    const pellets = weapon.pellets ?? 1;
    const originX = player.x + Math.cos(aimAngle) * 20;
    const originY = player.y + Math.sin(aimAngle) * 20;

    muzzleFlashes.push({ x: originX, y: originY, angle: aimAngle, color: weapon.color, life: 0.08 });
    for (let i = 0; i < pellets; i += 1) {
      const spreadAngle = aimAngle + randomRange(rng, -weapon.spread, weapon.spread);
      projectiles.push({
        x: originX,
        y: originY,
        prevX: originX,
        prevY: originY,
        vx: Math.cos(spreadAngle) * weapon.projectileSpeed,
        vy: Math.sin(spreadAngle) * weapon.projectileSpeed,
        damage: weapon.damage,
        life: weapon.range / weapon.projectileSpeed,
        color: weapon.color,
        fromPlayer: true,
        explosiveRadius: weapon.explosiveRadius ?? 0,
      });
    }

    world.pedSystem.alertDangerAt(originX, originY, 360);
    world.audio.playSfx(weapon.explosiveRadius ? 'launcher' : 'gunshot');
    world.camera.shake = Math.max(world.camera.shake, weapon.explosiveRadius ? 7 : 2.5);
    return true;
  }

  function fireNpcShot(x, y, angle, color = '#ff5e7e', damage = 8) {
    const ox = x + Math.cos(angle) * 18;
    const oy = y + Math.sin(angle) * 18;
    muzzleFlashes.push({ x: ox, y: oy, angle, color, life: 0.07 });
    projectiles.push({
      x: ox,
      y: oy,
      prevX: ox,
      prevY: oy,
      vx: Math.cos(angle) * 760,
      vy: Math.sin(angle) * 760,
      damage,
      life: 0.65,
      color,
      fromPlayer: false,
      explosiveRadius: 0,
    });
  }

  function stepCombat(dt, world) {
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const p = projectiles[i];
      p.prevX = p.x;
      p.prevY = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      let hit = false;
      // Check building hit
      const col = cityMap.resolveBuildingCollision(p.x, p.y, 2);
      if (col.hitBuilding) {
        hit = true;
        spawnSparks(p.x, p.y, 5);
      }

      if (!hit && p.fromPlayer) {
        // Hit vehicles
        for (const v of world.vehicleSystem.vehicles) {
          if (world.player.vehicle && v.id === world.player.vehicle.id) continue;
          if (Math.hypot(v.x - p.x, v.y - p.y) < Math.max(v.width, v.height) * 0.44) {
            world.vehicleSystem.damageVehicle(v, p.damage, world, 'player');
            spawnSparks(p.x, p.y, 6);
            hit = true;
            break;
          }
        }
        // Hit pedestrians / syndicate / officers
        if (!hit) {
          for (const ped of world.pedSystem.pedestrians) {
            if (!ped.alive) continue;
            if (Math.hypot(ped.x - p.x, ped.y - p.y) < 16) {
              world.pedSystem.damagePedestrian(ped, p.damage, world, true);
              hit = true;
              break;
            }
          }
        }
      } else if (!hit && !p.fromPlayer) {
        // Enemy bullet hits player or player's car
        if (Math.hypot(world.player.x - p.x, world.player.y - p.y) < (world.player.vehicle ? 32 : 16)) {
          if (world.player.vehicle) {
            world.vehicleSystem.damageVehicle(world.player.vehicle, p.damage * 0.8, world, 'npc');
            spawnSparks(p.x, p.y, 4);
          } else {
            if (world.player.armor > 0) {
              world.player.armor = Math.max(0, world.player.armor - p.damage);
            } else {
              world.player.health = Math.max(15, world.player.health - p.damage);
            }
            spawnBloodOrSparks(p.x, p.y, '#2de2e6', 4);
          }
          hit = true;
        }
      }

      if (hit || p.life <= 0) {
        if (p.explosiveRadius > 0) {
          spawnExplosion(p.x, p.y, p.explosiveRadius, world);
        }
        projectiles.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= Math.pow(0.18, dt);
      pt.vy *= Math.pow(0.18, dt);
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // Update shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i -= 1) {
      const s = shockwaves[i];
      s.life -= dt;
      const t = 1 - Math.max(0, s.life / s.maxLife);
      s.radius = 12 + (s.maxRadius - 12) * t;
      if (s.life <= 0) shockwaves.splice(i, 1);
    }

    // Update muzzle flashes
    for (let i = muzzleFlashes.length - 1; i >= 0; i -= 1) {
      muzzleFlashes[i].life -= dt;
      if (muzzleFlashes[i].life <= 0) muzzleFlashes.splice(i, 1);
    }
  }

  return {
    projectiles,
    particles,
    shockwaves,
    muzzleFlashes,
    spawnSparks,
    spawnBloodOrSparks,
    spawnExplosion,
    firePlayerWeapon,
    fireNpcShot,
    stepCombat,
  };
}

export function createPlayerLoadout() {
  return WEAPON_ARSENAL.map((w) => ({
    ...w,
    ammo: w.clipSize,
    reserve: w.reserveAmmo,
  }));
}
