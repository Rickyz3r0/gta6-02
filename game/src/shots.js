// Deterministic screenshot scene staging (?shot=cover|onfoot|causeway|hub)
// Advances the live open-world simulation and frames four distinct, multi-system scenes
// showcasing driving, police chases, on-foot combat, carjacking, missions, HUD, and saves.

import { STEP } from './config.js';
import { createVehicle } from './vehicles.js';

const NO_INPUT = {
  up: false,
  down: false,
  left: false,
  right: false,
  handbrake: false,
  sprint: false,
  firing: false,
  mouseX: 640,
  mouseY: 400,
};

const NO_ONESHOT = {
  carjack: false,
  toggleMenu: false,
  quickSave: false,
  cycleRadio: false,
  startConfirm: false,
  weaponSlot: null,
};

export function stageShotScene(shotName, world) {
  world.resetWorld();

  if (shotName === 'onfoot') {
    // Scene 2: On-foot gunfight, carjacking callout & docked luxury boats at Mariposa Marina Pier 7
    world.missions.selectMission(2, null);
    world.missions.setStageProgress(0.58);
    world.wanted.setStars(2);
    world.player.cash = 82400;
    world.player.health = 92;
    world.player.armor = 70;
    world.player.weaponIndex = 2; // Caiman Heavy Shotgun
    world.player.x = 3908;
    world.player.y = 2068;
    world.player.aimAngle = 0.04;
    world.player.angle = 0.04;

    // Clear nearby random traffic so the waterfront combat stage is crystal clear
    for (let i = world.vehicleSystem.vehicles.length - 1; i >= 0; i -= 1) {
      const v = world.vehicleSystem.vehicles[i];
      if (Math.hypot(v.x - 3908, v.y - 2068) < 220) {
        world.vehicleSystem.vehicles.splice(i, 1);
      }
    }

    // Park a stealable exotic Veloce Apex right beside Mateo for the live [F] Carjack prompt
    const exotic = createVehicle('veloce-apex', 3842, 2132, -Math.PI * 0.42, {
      driver: null,
      bodyColor: '#ff6b35',
      stripeColor: '#ffe66d',
    });
    world.vehicleSystem.vehicles.push(exotic);

    // Syndicate armored van taking fire near Pier 7 entrance + approaching SPPD cruiser
    const syndicateVan = createVehicle('aurelia-van', 4072, 2074, 0.06, {
      driver: 'syndicate',
      bodyColor: '#252a3d',
      stripeColor: '#ff2a55',
      health: 75,
    });
    const cruiser = createVehicle('sppd-interceptor', 3762, 1915, Math.PI * 0.48, {
      driver: 'police',
      sirenOn: true,
      sirenPhase: 1.1,
    });
    world.vehicleSystem.vehicles.push(syndicateVan, cruiser);

    // Spawn live combat exchange & explosion shockwave on Pier 7
    world.pedSystem.spawnPedestrian(4022, 2068, 'syndicate');
    world.pedSystem.spawnPedestrian(4128, 2096, 'syndicate');
    world.pedSystem.spawnPedestrian(4205, 2068, 'syndicate');
    world.pedSystem.spawnPedestrian(3792, 1982, 'officer');
    world.pedSystem.cashDrops.push({ x: 3965, y: 2042, amount: 450, pulse: 1.2 });

    world.camera.x = 3955;
    world.camera.y = 2070;
    world.camera.zoom = 1.06;
    world.notify('MARIPOSA MARINA · PIER 7 SYNDICATE RAID IN PROGRESS');

    for (let i = 0; i < 10; i += 1) {
      world.step(STEP, { ...NO_INPUT, firing: i === 8, mouseX: 880, mouseY: 405 }, NO_ONESHOT, 1280, 800);
    }
    world.combat.spawnExplosion(4078, 2070, 95, null);
    world.combat.firePlayerWeapon(world, 0.03);
    world.camera.x = 3955;
    world.camera.y = 2070;
    world.camera.zoom = 1.06;
    world.camera.shake = 0;
    return { overlay: 'none' };
  }

  if (shotName === 'causeway') {
    // Scene 3: Mission 2 Causeway Convoy Ambush spanning Caiman Keys Lagoon Bridge
    world.missions.selectMission(1, null);
    world.missions.setStageProgress(0.74);
    world.wanted.setStars(3);
    world.player.cash = 112600;
    world.player.weaponIndex = 3; // Aurelia Assault Carbine

    // Clear overlapping traffic on the causeway bridge deck
    for (let i = world.vehicleSystem.vehicles.length - 1; i >= 0; i -= 1) {
      const v = world.vehicleSystem.vehicles[i];
      if (Math.hypot(v.x - 2150, v.y - 1760) < 280) {
        world.vehicleSystem.vehicles.splice(i, 1);
      }
    }

    const playerTruck = createVehicle('caiman-4x4', 2108, 1786, -0.1, {
      driver: 'player',
      speed: 355,
      vx: 350,
      vy: -34,
      nitroBoost: 1.0,
      drifting: true,
    });
    const heistVan = createVehicle('aurelia-van', 2252, 1744, 0.04, {
      driver: 'syndicate',
      speed: 265,
      vx: 265,
      vy: 10,
      health: 220,
    });
    const escort = createVehicle('palmera-cruiser', 2358, 1790, -0.25, {
      driver: 'syndicate',
      bodyColor: '#a855f7',
      wrecked: true,
      fireTimer: 12,
    });
    const cop1 = createVehicle('sppd-interceptor', 1945, 1744, 0.06, {
      driver: 'police',
      sirenOn: true,
      sirenPhase: 0.8,
      speed: 380,
      vx: 375,
      vy: 24,
    });
    const cop2 = createVehicle('sppd-interceptor', 1982, 1808, -0.08, {
      driver: 'police',
      sirenOn: true,
      sirenPhase: 3.9,
      speed: 365,
      vx: 360,
      vy: -28,
    });
    world.vehicleSystem.vehicles.push(playerTruck, heistVan, escort, cop1, cop2);
    world.player.vehicle = playerTruck;
    world.player.x = playerTruck.x;
    world.player.y = playerTruck.y;

    for (let i = 0; i < 16; i += 1) {
      world.vehicleSystem.addSkidMark(2010 + i * 7, 1796 - i * 0.7, -0.1, 0.48);
      world.vehicleSystem.addSkidMark(2010 + i * 7, 1774 - i * 0.7, -0.1, 0.48);
    }

    world.camera.x = 2155;
    world.camera.y = 1762;
    world.camera.zoom = 0.94;
    world.notify('CAIMAN KEYS CAUSEWAY · INTERCEPT AURELIA HEIST VAN');

    for (let i = 0; i < 8; i += 1) {
      world.step(STEP, { ...NO_INPUT, up: true, sprint: true, firing: i === 6, mouseX: 820, mouseY: 360 }, NO_ONESHOT, 1280, 800);
    }
    world.combat.spawnExplosion(2352, 1788, 96, null);
    world.combat.spawnSparks(2205, 1762, 14);
    world.combat.firePlayerWeapon(world, -0.22);
    world.camera.x = 2165;
    world.camera.y = 1762;
    world.camera.zoom = 0.94;
    world.camera.shake = 0;
    return { overlay: 'none' };
  }

  if (shotName === 'hub') {
    // Scene 4: Live Palm-Lined Downtown & Coral Plaza behind translucent iOS 27 Liquid Glass Campaign & Save Hub
    world.missions.selectMission(3, null);
    world.missions.setStageProgress(0.45);
    world.wanted.setStars(0);
    world.player.cash = 148500;
    const gtr = createVehicle('solaria-gtr', 3020, 1120, -0.35, {
      driver: 'player',
      speed: 220,
      vx: 205,
      vy: -74,
    });
    world.vehicleSystem.vehicles.push(gtr);
    world.player.vehicle = gtr;
    world.player.x = gtr.x;
    world.player.y = gtr.y;
    world.camera.x = 3020;
    world.camera.y = 1120;
    world.camera.zoom = 0.92;
    world.notify('SOLARIA COMMAND · CAMPAIGN PROGRESSION & SAVE SLOTS');
    for (let i = 0; i < 6; i += 1) {
      world.step(STEP, NO_INPUT, NO_ONESHOT, 1280, 800);
    }
    return { overlay: 'dossier' };
  }

  // Default / Cover Scene ('cover'): 4-Star Neon-Sunset Police Pursuit on Coral Oceanfront Drive & Sunset Ave
  world.missions.selectMission(2, null);
  world.missions.setStageProgress(0.68);
  world.wanted.setStars(4);
  world.player.cash = 64850;
  world.player.health = 96;
  world.player.armor = 85;
  world.player.weaponIndex = 1; // Mariposa Tactical SMG

  // Clear random traffic overlapping the center hero drift zone so every car reads cleanly
  for (let i = world.vehicleSystem.vehicles.length - 1; i >= 0; i -= 1) {
    const v = world.vehicleSystem.vehicles[i];
    if (Math.hypot(v.x - 3782, v.y - 1148) < 210) {
      world.vehicleSystem.vehicles.splice(i, 1);
    }
  }

  const heroCar = createVehicle('solaria-gtr', 3782, 1148, -Math.PI * 0.36, {
    driver: 'player',
    speed: 445,
    vx: 165,
    vy: -410,
    drifting: true,
    nitroBoost: 1.0,
    bodyColor: '#16d9e3',
    stripeColor: '#ff2a85',
  });

  const copA = createVehicle('sppd-interceptor', 3748, 1272, -Math.PI * 0.44, {
    driver: 'police',
    sirenOn: true,
    sirenPhase: 0.9,
    speed: 425,
    vx: 85,
    vy: -415,
  });
  const copB = createVehicle('sppd-interceptor', 3628, 1126, 0.08, {
    driver: 'police',
    sirenOn: true,
    sirenPhase: 4.1,
    speed: 410,
    vx: 405,
    vy: 32,
  });
  const swat = createVehicle('sppd-swat', 3812, 978, Math.PI * 0.62, {
    driver: 'police',
    sirenOn: true,
    sirenPhase: 1.4,
    speed: 220,
    vx: -80,
    vy: 205,
  });
  const civCar = createVehicle('palmera-cruiser', 3808, 1345, -Math.PI * 0.5, {
    driver: 'ai',
    bodyColor: '#ff5e7e',
    stripeColor: '#fff1d0',
  });
  const civExotic = createVehicle('veloce-apex', 3510, 1146, 0, {
    driver: 'ai',
    bodyColor: '#ff6b35',
    stripeColor: '#ffe66d',
  });

  world.vehicleSystem.vehicles.push(heroCar, copA, copB, swat, civCar, civExotic);
  world.player.vehicle = heroCar;
  world.player.x = heroCar.x;
  world.player.y = heroCar.y;

  // Lay realistic curving drift skid marks through the Coral Drive intersection
  for (let i = 0; i < 24; i += 1) {
    const a = -Math.PI * 0.52 + i * 0.012;
    const sx = 3762 + i * 1.1;
    const sy = 1236 - i * 4.2;
    world.vehicleSystem.addSkidMark(sx - 10, sy, a, 0.5);
    world.vehicleSystem.addSkidMark(sx + 10, sy, a, 0.5);
  }

  // Position Pursuit Chopper searchlight sweeping over Coral Oceanfront Drive
  world.wanted.chopper.active = true;
  world.wanted.chopper.x = 3955;
  world.wanted.chopper.y = 1045;
  world.wanted.chopper.spotX = 3785;
  world.wanted.chopper.spotY = 1140;

  world.camera.x = 3775;
  world.camera.y = 1135;
  world.camera.zoom = 0.88;
  world.notify('4-STAR SPPD PURSUIT · CORAL OCEANFRONT DRIVE · CHOPPER LOCK');

  for (let i = 0; i < 8; i += 1) {
    world.step(STEP, { ...NO_INPUT, up: true, right: true, handbrake: true, sprint: true, firing: i === 6, mouseX: 675, mouseY: 260 }, NO_ONESHOT, 1280, 800);
  }
  // Keep dramatic framing & active combat sparks/tracers crisp for the cover shot
  world.combat.spawnSparks(3765, 1188, 12);
  world.combat.fireNpcShot(copB.x, copB.y, 0.08, '#3a86ff', 0);
  world.combat.firePlayerWeapon(world, -Math.PI * 0.62);
  world.wanted.chopper.x = 3970;
  world.wanted.chopper.y = 1030;
  world.wanted.chopper.spotX = world.player.x + 12;
  world.wanted.chopper.spotY = world.player.y - 6;
  world.camera.x = world.player.x + 15;
  world.camera.y = world.player.y - 10;
  world.camera.zoom = 0.88;
  world.camera.shake = 0;

  return { overlay: 'none' };
}
