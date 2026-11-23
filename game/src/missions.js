// 6-Mission Story Campaign & Side Activities for Solaris Drift: Sunset Keys
// Starring Mateo Vance, Elena Vega, and fixer Victor "El Sol" Navarro in Palmera City.

export const STORY_MISSIONS = [
  {
    id: 'm1-neon-welcome',
    number: 1,
    title: 'Mission 1: Neon Welcome',
    district: 'CORAL DRIVE STRIP',
    reward: 5000,
    speaker: 'Elena Vega · Encrypted Comms',
    avatar: 'EV',
    line: '"The prototype Solaria GT-R is parked outside Hotel Solaris. Boost it and meet me at the Coral Safehouse!"',
    objective: 'Steal a sports coupe on Coral Drive Strip and deliver it to the Coral Drive Neon Safehouse.',
    targetX: 3690,
    targetY: 820,
    targetRadius: 110,
    wantedBoost: 1,
  },
  {
    id: 'm2-causeway-intercept',
    number: 2,
    title: 'Mission 2: Causeway Intercept',
    district: 'CAIMAN KEYS CAUSEWAY',
    reward: 12500,
    speaker: 'Victor "El Sol" Navarro',
    avatar: 'VN',
    line: '"Syndicate convoy crossing Solaria Bay Span right now! Ram the Aurelia Heist Van and take the vault crate!"',
    objective: 'Intercept the armored Aurelia Heist Van crossing Caiman Keys Causeway and secure the payload.',
    targetX: 2560,
    targetY: 1760,
    targetRadius: 110,
    wantedBoost: 3,
  },
  {
    id: 'm3-marina-heat',
    number: 3,
    title: 'Mission 3: Marina Heat',
    district: 'MARIPOSA MARINA',
    reward: 20000,
    speaker: 'Elena Vega · Encrypted Comms',
    avatar: 'EV',
    line: '"Choppers are sweeping Ocean Blvd! Evade the SPPD tactical units or hit the Neon Respray garage!"',
    objective: 'Secure the encrypted ledger at Mariposa Marina Pier 7 and outrun the SPPD tactical pursuit.',
    targetX: 4330,
    targetY: 2080,
    targetRadius: 95,
    wantedBoost: 4,
  },
  {
    id: 'm4-penthouse-blackout',
    number: 4,
    title: 'Mission 4: Penthouse Blackout',
    district: 'SOLARIA DOWNTOWN',
    reward: 35000,
    speaker: 'Elena Vega · Encrypted Comms',
    avatar: 'EV',
    line: '"Drop the EMP pulse at Aurelia Reserve Plaza, then grab the Veloce Apex for extraction!"',
    objective: 'Assault Aurelia Financial Plaza in Solaria Downtown and disable the syndicate relay convoy.',
    targetX: 1560,
    targetY: 1120,
    targetRadius: 120,
    wantedBoost: 3,
  },
  {
    id: 'm5-port-lockdown',
    number: 5,
    title: 'Mission 5: Port Aurelia Lockdown',
    district: 'PORT AURELIA DOCKS',
    reward: 50000,
    speaker: 'Victor "El Sol" Navarro',
    avatar: 'VN',
    line: '"SWAT Enforcers sealed Terminal Basin! Smash the blockade and torch their contraband cache!"',
    objective: 'Break the 4-star SPPD lockdown at Port Aurelia Docks and destroy the smuggler depot.',
    targetX: 700,
    targetY: 2420,
    targetRadius: 130,
    wantedBoost: 4,
  },
  {
    id: 'm6-sunset-keys-heist',
    number: 6,
    title: 'Mission 6: Sunset Keys Heist',
    district: 'FLAMINGO HEIGHTS',
    reward: 125000,
    speaker: 'Elena Vega · Finale Comms',
    avatar: 'EV',
    line: '"All five stars are lighting up Palmera City! Full throttle to the Flamingo extraction pier, Mateo!"',
    objective: 'Survive a 5-star citywide lockdown with chopper searchlights and reach the extraction point.',
    targetX: 3780,
    targetY: 1420,
    targetRadius: 130,
    wantedBoost: 5,
  },
];

export function createMissionDirector() {
  const completedIds = new Set(['m1-neon-welcome', 'm2-causeway-intercept']);
  let activeIndex = 2; // Default starts with Mission 3: Marina Heat ready for exciting play
  let stageProgress = 0.68;

  function getActiveMission() {
    return STORY_MISSIONS[activeIndex] ?? STORY_MISSIONS[0];
  }

  function selectMission(index, world = null) {
    const safeIdx = Math.max(0, Math.min(STORY_MISSIONS.length - 1, index));
    activeIndex = safeIdx;
    stageProgress = 0.25;
    const m = STORY_MISSIONS[activeIndex];
    if (world) {
      world.notify(`Mission Started: ${m.title} (+$${m.reward.toLocaleString()})`);
      if (m.wantedBoost > world.wanted.stars) {
        world.wanted.setStars(m.wantedBoost);
      }
    }
    return m;
  }

  function stepMission(dt, world) {
    const m = getActiveMission();
    const dist = Math.hypot(world.player.x - m.targetX, world.player.y - m.targetY);
    const closeness = Math.max(0, Math.min(1, 1 - dist / 2200));
    stageProgress = Math.max(stageProgress, 0.15 + closeness * 0.8);

    if (dist < m.targetRadius) {
      if (!completedIds.has(m.id)) {
        completedIds.add(m.id);
        world.player.cash += m.reward;
        world.stats.missionsCompleted = completedIds.size;
        world.audio.playSfx('mission_complete');
        world.notify(`${m.title} COMPLETE! Reward: +$${m.reward.toLocaleString()}`);
        world.saveSystem.autoSave(world);
      }
      if (activeIndex < STORY_MISSIONS.length - 1) {
        activeIndex += 1;
        stageProgress = 0.2;
      } else {
        stageProgress = 1.0;
      }
    }
  }

  function getSnapshot() {
    return {
      activeIndex,
      stageProgress,
      completedIds: [...completedIds],
    };
  }

  function loadSnapshot(snap) {
    if (!snap) return;
    completedIds.clear();
    if (Array.isArray(snap.completedIds)) {
      for (const id of snap.completedIds) completedIds.add(id);
    }
    activeIndex = typeof snap.activeIndex === 'number' ? Math.max(0, Math.min(STORY_MISSIONS.length - 1, snap.activeIndex)) : 0;
    stageProgress = typeof snap.stageProgress === 'number' ? snap.stageProgress : 0.25;
  }

  return {
    missions: STORY_MISSIONS,
    get completedIds() { return completedIds; },
    get activeIndex() { return activeIndex; },
    get stageProgress() { return stageProgress; },
    setStageProgress(v) { stageProgress = Math.max(0, Math.min(1, v)); },
    getActiveMission,
    selectMission,
    stepMission,
    getSnapshot,
    loadSnapshot,
  };
}
