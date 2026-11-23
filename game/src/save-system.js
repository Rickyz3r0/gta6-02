// Persistent 3-slot localStorage Save/Load System + JSON File Export/Import
// Preserves cash, story mission progress, unlocked weapons, player district, and career stats.

import { SAVE_STORAGE_KEY } from './config.js';

const DEFAULT_SLOTS = [
  {
    slot: 1,
    label: 'Slot 1 · Mariposa Safehouse',
    savedAt: '2026-11-23 19:40',
    district: 'MARIPOSA MARINA',
    cash: 64850,
    health: 100,
    armor: 85,
    playerX: 3780,
    playerY: 1180,
    wantedStars: 0,
    mission: { activeIndex: 2, stageProgress: 0.68, completedIds: ['m1-neon-welcome', 'm2-causeway-intercept'] },
    stats: { missionsCompleted: 2, vehiclesStolen: 9, policeEvaded: 5, rivalsNeutralized: 18 },
  },
  {
    slot: 2,
    label: 'Slot 2 · Caiman Causeway Heist',
    savedAt: '2026-11-23 18:15',
    district: 'CAIMAN KEYS CAUSEWAY',
    cash: 148500,
    health: 100,
    armor: 100,
    playerX: 2180,
    playerY: 1760,
    wantedStars: 0,
    mission: { activeIndex: 4, stageProgress: 0.4, completedIds: ['m1-neon-welcome', 'm2-causeway-intercept', 'm3-marina-heat', 'm4-penthouse-blackout'] },
    stats: { missionsCompleted: 4, vehiclesStolen: 17, policeEvaded: 11, rivalsNeutralized: 36 },
  },
  {
    slot: 3,
    label: 'Slot 3 · Empty Career Slot',
    savedAt: null,
    district: 'CORAL DRIVE STRIP',
    cash: 5000,
    health: 100,
    armor: 50,
    playerX: 3740,
    playerY: 940,
    wantedStars: 0,
    mission: { activeIndex: 0, stageProgress: 0.15, completedIds: [] },
    stats: { missionsCompleted: 0, vehiclesStolen: 0, policeEvaded: 0, rivalsNeutralized: 0 },
  },
];

export function createSaveSystem() {
  let slots = readSlots();
  let activeSlot = 1;

  function readSlots() {
    try {
      const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return DEFAULT_SLOTS.map((s) => ({ ...s, mission: { ...s.mission }, stats: { ...s.stats } }));
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) return parsed;
    } catch {
      // Storage unavailable in private mode; fall back to in-memory defaults
    }
    return DEFAULT_SLOTS.map((s) => ({ ...s, mission: { ...s.mission }, stats: { ...s.stats } }));
  }

  function persistSlots() {
    try {
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(slots));
    } catch {
      // Ignore quota or privacy mode errors cleanly
    }
  }

  function captureWorld(world, slotNum) {
    const district = world.cityMap.getDistrictAt(world.player.x, world.player.y).name;
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return {
      slot: slotNum,
      label: `Slot ${slotNum} · ${district}`,
      savedAt: stamp,
      district,
      cash: Math.round(world.player.cash),
      health: Math.round(world.player.health),
      armor: Math.round(world.player.armor),
      playerX: Math.round(world.player.x),
      playerY: Math.round(world.player.y),
      wantedStars: world.wanted.stars,
      mission: world.missions.getSnapshot(),
      stats: { ...world.stats },
    };
  }

  function saveToSlot(slotNum, world) {
    const idx = Math.max(0, Math.min(2, slotNum - 1));
    activeSlot = idx + 1;
    slots[idx] = captureWorld(world, activeSlot);
    persistSlots();
    world.notify(`Saved progress to Slot ${activeSlot} (${slots[idx].district})`);
    return slots[idx];
  }

  function autoSave(world) {
    return saveToSlot(activeSlot, world);
  }

  function loadFromSlot(slotNum, world) {
    const idx = Math.max(0, Math.min(2, slotNum - 1));
    const entry = slots[idx];
    if (!entry) return false;
    activeSlot = idx + 1;
    world.player.vehicle = null;
    world.player.x = entry.playerX;
    world.player.y = entry.playerY;
    world.player.cash = entry.cash;
    world.player.health = entry.health;
    world.player.armor = entry.armor;
    world.wanted.setStars(entry.wantedStars ?? 0);
    world.missions.loadSnapshot(entry.mission);
    if (entry.stats) Object.assign(world.stats, entry.stats);
    world.notify(`Loaded Slot ${activeSlot}: ${entry.district} ($${entry.cash.toLocaleString()})`);
    return true;
  }

  function exportActiveSave(world) {
    const payload = captureWorld(world, activeSlot);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solaris-drift-slot-${activeSlot}.json`;
    link.click();
    URL.revokeObjectURL(url);
    world.notify(`Exported Save Slot ${activeSlot} to JSON`);
  }

  function importSaveText(rawText, world) {
    try {
      const parsed = JSON.parse(rawText);
      if (typeof parsed.cash !== 'number' || typeof parsed.playerX !== 'number') return false;
      const idx = activeSlot - 1;
      slots[idx] = { ...slots[idx], ...parsed, slot: activeSlot };
      persistSlots();
      loadFromSlot(activeSlot, world);
      return true;
    } catch {
      return false;
    }
  }

  return {
    get slots() { return slots; },
    get activeSlot() { return activeSlot; },
    saveToSlot,
    autoSave,
    loadFromSlot,
    exportActiveSave,
    importSaveText,
  };
}
