// Central open-world simulation state for Solaris Drift: Sunset Keys.
// Orchestrates Palmera City map, player on-foot & driving controls, traffic, pedestrians,
// 5-star SPPD police response, ballistic combat, story missions, audio, and persistent saves.

import { createAudioEngine } from './audio.js';
import { createCityMap } from './city-map.js';
import { createCombatSystem, createPlayerLoadout } from './combat.js';
import { createMissionDirector } from './missions.js';
import { createPedestrianSystem } from './pedestrians.js';
import { createWantedSystem } from './police-wanted.js';
import { clamp, createRandom } from './random.js';
import { createSaveSystem } from './save-system.js';
import { createVehicleSystem } from './vehicles.js';

export function createOpenWorld(seed = 2026) {
  const rng = createRandom(seed);
  const cityMap = createCityMap(77);
  const vehicleSystem = createVehicleSystem(cityMap, rng);
  const pedSystem = createPedestrianSystem(cityMap, rng);
  const wanted = createWantedSystem(cityMap, rng);
  const combat = createCombatSystem(cityMap, rng);
  const missions = createMissionDirector();
  const audio = createAudioEngine();
  const saveSystem = createSaveSystem();

  const player = {
    name: 'Mateo Vance',
    x: 3740,
    y: 940,
    angle: -Math.PI * 0.5,
    aimAngle: -Math.PI * 0.5,
    walkPhase: 0,
    speed: 175,
    health: 100,
    maxHealth: 100,
    armor: 85,
    maxArmor: 100,
    cash: 64850,
    vehicle: null,
    weapons: createPlayerLoadout(),
    weaponIndex: 1,
    fireCooldown: 0,
  };

  const camera = {
    x: player.x,
    y: player.y,
    zoom: 1.0,
    shake: 0,
  };

  const stats = {
    missionsCompleted: 2,
    vehiclesStolen: 9,
    policeEvaded: 5,
    rivalsNeutralized: 18,
  };

  let elapsed = 0;
  let timeOfDayMinutes = 19 * 60 + 42; // 19:42 Golden-Neon Sunset
  let toastText = 'PALMERA CITY · STATE OF SOLARIA';
  let toastTimer = 4.0;
  let resprayCooldown = 0;

  function notify(message, duration = 4.5) {
    toastText = message;
    toastTimer = duration;
  }

  function resetWorld() {
    elapsed = 0;
    timeOfDayMinutes = 19 * 60 + 42;
    vehicleSystem.spawnInitialTraffic();
    pedSystem.spawnInitialCrowds();
    player.vehicle = null;
    player.x = 3740;
    player.y = 940;
    player.angle = -Math.PI * 0.5;
    player.aimAngle = -Math.PI * 0.5;
    player.health = 100;
    player.armor = 85;
    player.cash = 64850;
    player.weapons = createPlayerLoadout();
    player.weaponIndex = 1;
    player.fireCooldown = 0;
    wanted.setStars(0);
    camera.x = player.x;
    camera.y = player.y;
    camera.zoom = 1.0;
    camera.shake = 0;
    toastText = 'CORAL DRIVE STRIP · PALMERA CITY';
    toastTimer = 4.0;
  }

  function stepPlayerOnFoot(dt, inputState, screenWidth, screenHeight) {
    const moveX = (inputState.right ? 1 : 0) - (inputState.left ? 1 : 0);
    const moveY = (inputState.down ? 1 : 0) - (inputState.up ? 1 : 0);
    const len = Math.hypot(moveX, moveY);
    const moveSpeed = inputState.sprint ? 235 : 165;

    if (len > 0.01) {
      const nx = player.x + (moveX / len) * moveSpeed * dt;
      const ny = player.y + (moveY / len) * moveSpeed * dt;
      const resolved = cityMap.resolveBuildingCollision(nx, ny, 12);
      player.x = resolved.x;
      player.y = resolved.y;
      player.walkPhase += moveSpeed * dt * 0.13;
      player.angle = Math.atan2(moveY, moveX);
    }

    // Compute world-space aim angle from mouse screen position
    const worldMouseX = camera.x + (inputState.mouseX - screenWidth * 0.5) / camera.zoom;
    const worldMouseY = camera.y + (inputState.mouseY - screenHeight * 0.5) / camera.zoom;
    player.aimAngle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
  }

  function step(dt, inputState, oneShots, screenWidth = 1280, screenHeight = 800) {
    elapsed += dt;
    timeOfDayMinutes = (timeOfDayMinutes + dt * 0.35) % (24 * 60);
    if (toastTimer > 0) toastTimer = Math.max(0, toastTimer - dt);
    if (resprayCooldown > 0) resprayCooldown = Math.max(0, resprayCooldown - dt);
    if (player.fireCooldown > 0) player.fireCooldown = Math.max(0, player.fireCooldown - dt);

    if (oneShots.weaponSlot !== null) {
      if (oneShots.weaponSlot === 'next') {
        player.weaponIndex = (player.weaponIndex + 1) % player.weapons.length;
      } else if (oneShots.weaponSlot === 'prev') {
        player.weaponIndex = (player.weaponIndex + player.weapons.length - 1) % player.weapons.length;
      } else if (typeof oneShots.weaponSlot === 'number') {
        player.weaponIndex = clamp(oneShots.weaponSlot, 0, player.weapons.length - 1);
      }
      audio.playSfx('ui_click');
      notify(`Equipped ${player.weapons[player.weaponIndex].name}`);
    }

    if (oneShots.carjack) {
      vehicleSystem.attemptCarjack(worldApi);
      audio.playSfx('ui_click');
    }

    if (oneShots.cycleRadio) {
      const st = audio.cycleRadioStation();
      notify(`Radio Tuned: ${st.title}`);
    }

    if (oneShots.quickSave) {
      saveSystem.autoSave(worldApi);
      audio.playSfx('ui_click');
    }

    if (!player.vehicle) {
      stepPlayerOnFoot(dt, inputState, screenWidth, screenHeight);
    }

    vehicleSystem.stepVehicles(dt, inputState, worldApi);

    if (player.vehicle) {
      player.x = player.vehicle.x;
      player.y = player.vehicle.y;
      player.angle = player.vehicle.angle;
      const worldMouseX = camera.x + (inputState.mouseX - screenWidth * 0.5) / camera.zoom;
      const worldMouseY = camera.y + (inputState.mouseY - screenHeight * 0.5) / camera.zoom;
      player.aimAngle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    }

    if (inputState.firing) {
      combat.firePlayerWeapon(worldApi, player.aimAngle);
    }

    wanted.stepWanted(dt, worldApi);
    pedSystem.stepPedestrians(dt, worldApi);
    combat.stepCombat(dt, worldApi);
    missions.stepMission(dt, worldApi);
    audio.stepAudio(dt);

    // Smooth camera tracking with speed-adaptive zoom & lead offset
    const leadX = player.vehicle ? player.vehicle.vx * 0.24 : Math.cos(player.aimAngle) * 32;
    const leadY = player.vehicle ? player.vehicle.vy * 0.24 : Math.sin(player.aimAngle) * 32;
    const targetCamX = player.x + leadX;
    const targetCamY = player.y + leadY;
    const camLerp = 1 - Math.pow(0.015, dt);
    camera.x += (targetCamX - camera.x) * camLerp;
    camera.y += (targetCamY - camera.y) * camLerp;

    const speedRatio = player.vehicle ? clamp(Math.abs(player.vehicle.speed) / 480, 0, 1) : 0;
    const targetZoom = player.vehicle ? 0.98 - speedRatio * 0.16 : 1.08;
    camera.zoom += (targetZoom - camera.zoom) * (1 - Math.pow(0.08, dt));
    camera.shake *= Math.pow(0.01, dt);
    if (camera.shake < 0.15) camera.shake = 0;
  }

  function getClockString() {
    const hrs = Math.floor(timeOfDayMinutes / 60) % 24;
    const mins = Math.floor(timeOfDayMinutes % 60);
    const label = hrs >= 17 && hrs <= 20 ? 'SUNSET' : hrs >= 21 || hrs < 5 ? 'NEON NIGHT' : 'COASTAL DAY';
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} · ${label}`;
  }

  const worldApi = {
    cityMap,
    vehicleSystem,
    pedSystem,
    wanted,
    combat,
    missions,
    audio,
    saveSystem,
    player,
    camera,
    stats,
    get elapsed() { return elapsed; },
    get toastText() { return toastText; },
    get resprayCooldown() { return resprayCooldown; },
    set resprayCooldown(v) { resprayCooldown = v; },
    notify,
    resetWorld,
    step,
    getClockString,
  };

  resetWorld();
  return worldApi;
}
