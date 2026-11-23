// Keyboard and mouse input controller for on-foot navigation, arcade vehicle driving,
// aiming/shooting, carjacking, weapon switching, radio cycling, quick save, and menus.

export function createInputController(canvas) {
  const keys = new Set();
  const oneShot = {
    carjack: false,
    toggleMenu: false,
    quickSave: false,
    cycleRadio: false,
    startConfirm: false,
    weaponSlot: null,
  };

  const mouse = {
    screenX: window.innerWidth * 0.5,
    screenY: window.innerHeight * 0.5,
    firing: false,
  };

  window.addEventListener('keydown', (event) => {
    keys.add(event.code);
    if (!event.repeat) {
      if (event.code === 'KeyF' || event.code === 'KeyE') oneShot.carjack = true;
      else if (event.code === 'KeyM' || event.code === 'Escape' || event.code === 'KeyP') oneShot.toggleMenu = true;
      else if (event.code === 'F5') {
        event.preventDefault();
        oneShot.quickSave = true;
      } else if (event.code === 'KeyQ') oneShot.cycleRadio = true;
      else if (event.code === 'Enter' || event.code === 'Space') oneShot.startConfirm = true;
      else if (event.code.startsWith('Digit')) {
        const slot = Number.parseInt(event.code.slice(5), 10);
        if (slot >= 1 && slot <= 5) oneShot.weaponSlot = slot - 1;
      }
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });

  window.addEventListener('blur', () => {
    keys.clear();
    mouse.firing = false;
  });

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.screenX = event.clientX - rect.left;
    mouse.screenY = event.clientY - rect.top;
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button === 0) mouse.firing = true;
  });

  window.addEventListener('pointerup', () => {
    mouse.firing = false;
  });

  window.addEventListener('wheel', (event) => {
    if (event.deltaY !== 0) {
      oneShot.weaponSlot = event.deltaY > 0 ? 'next' : 'prev';
    }
  }, { passive: true });

  function readState() {
    return {
      up: keys.has('KeyW') || keys.has('ArrowUp'),
      down: keys.has('KeyS') || keys.has('ArrowDown'),
      left: keys.has('KeyA') || keys.has('ArrowLeft'),
      right: keys.has('KeyD') || keys.has('ArrowRight'),
      handbrake: keys.has('Space'),
      sprint: keys.has('ShiftLeft') || keys.has('ShiftRight'),
      firing: mouse.firing,
      mouseX: mouse.screenX,
      mouseY: mouse.screenY,
    };
  }

  function consumeOneShots() {
    const copy = { ...oneShot };
    oneShot.carjack = false;
    oneShot.toggleMenu = false;
    oneShot.quickSave = false;
    oneShot.cycleRadio = false;
    oneShot.startConfirm = false;
    oneShot.weaponSlot = null;
    return copy;
  }

  return {
    readState,
    consumeOneShots,
  };
}
