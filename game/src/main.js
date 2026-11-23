// Application bootstrap and fixed-timestep 60Hz game loop for Solaris Drift: Sunset Keys.
// Wires keyboard/mouse controls, open-world simulation, 2.5D perspective renderer, iOS 27 Liquid Glass HUD,
// title & campaign/save overlays, and deterministic ?shot= scene capture for screenshots.

import { STEP } from './config.js';
import { createHudController } from './hud-ui.js';
import { createInputController } from './input.js';
import { createWorldRenderer } from './renderer.js';
import { stageShotScene } from './shots.js';
import { createOpenWorld } from './world.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '2026', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 2026;

const canvas = document.getElementById('world-canvas');
const statusEl = document.getElementById('status');

const world = createOpenWorld(seed);
const renderer = createWorldRenderer(canvas);
const input = createInputController(canvas);

let uiMode = shotName ? 'none' : 'title'; // 'title' | 'dossier' | 'none'

const hud = createHudController(world, {
  onStartGame() {
    world.audio.ensureContext();
    world.audio.playSfx('ui_click');
    uiMode = 'none';
    hud.setOverlays(uiMode);
    announce('Entered Palmera City. Explore on foot or press F to steal a vehicle.');
  },
  onOpenDossier() {
    world.audio.ensureContext();
    world.audio.playSfx('ui_click');
    uiMode = 'dossier';
    hud.setOverlays(uiMode);
    announce('Campaign and Save System open.');
  },
  onResume() {
    world.audio.ensureContext();
    world.audio.playSfx('ui_click');
    uiMode = 'none';
    hud.setOverlays(uiMode);
    announce('Resumed open-world exploration.');
  },
});

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function runDeterministicShot(name) {
  const { overlay } = stageShotScene(name, world);
  uiMode = overlay;
  hud.setOverlays(uiMode);
  let frames = 0;
  function drawOnce() {
    renderer.renderFrame(world);
    hud.updateHud();
    frames += 1;
    if (frames < 3) requestAnimationFrame(drawOnce);
    else window.__shotReady = true;
  }
  requestAnimationFrame(drawOnce);
}

function runLiveLoop() {
  hud.setOverlays(uiMode);
  let lastTime = performance.now();
  let accumulator = 0;

  // Stage an exciting opening coastal scene behind the translucent title screen
  stageShotScene('cover', world);
  hud.setOverlays('title');

  function frame(now) {
    requestAnimationFrame(frame);
    const delta = Math.min((now - lastTime) / 1000, 0.25);
    lastTime = now;

    const inputState = input.readState();
    const oneShots = input.consumeOneShots();

    if (uiMode === 'title' && oneShots.startConfirm) {
      world.audio.ensureContext();
      world.resetWorld();
      uiMode = 'none';
      hud.setOverlays('none');
      announce('Playing Solaris Drift: Sunset Keys.');
    } else if (oneShots.toggleMenu) {
      uiMode = uiMode === 'dossier' ? 'none' : 'dossier';
      hud.setOverlays(uiMode);
      world.audio.playSfx('ui_click');
    }

    const size = renderer.getSize();
    if (uiMode === 'none') {
      accumulator += delta;
      while (accumulator >= STEP) {
        world.step(STEP, inputState, oneShots, size.width, size.height);
        oneShots.carjack = false;
        oneShots.quickSave = false;
        oneShots.cycleRadio = false;
        oneShots.weaponSlot = null;
        accumulator -= STEP;
      }
    } else if (uiMode === 'title') {
      // Gently animate sunset waves, traffic & lights behind the translucent title screen
      accumulator += delta * 0.4;
      while (accumulator >= STEP) {
        world.step(STEP, { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, firing: false, mouseX: 640, mouseY: 400 }, { carjack: false, toggleMenu: false, quickSave: false, cycleRadio: false, startConfirm: false, weaponSlot: null }, size.width, size.height);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }

    renderer.renderFrame(world);
    hud.updateHud();
  }

  announce('Solaris Drift: Sunset Keys loaded. Press Space or click Enter Palmera City.');
  requestAnimationFrame(frame);
}

if (shotName) runDeterministicShot(shotName);
else runLiveLoop();
