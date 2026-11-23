// iOS 27 Liquid Glass HUD Controller, Live GPS Radar Minimap, Campaign Mission Director UI,
// and Persistent Save Slots Drawer for Solaris Drift: Sunset Keys.

import { WORLD_BOUNDS } from './config.js';
import { clamp } from './random.js';

export function createHudController(world, callbacks) {
  const el = {
    district: document.getElementById('gps-district'),
    time: document.getElementById('gps-time'),
    street: document.getElementById('gps-street'),
    coords: document.getElementById('gps-coords'),
    chaseAlert: document.getElementById('minimap-chase-alert'),
    minimap: document.getElementById('minimap-canvas'),
    missionTitle: document.getElementById('mission-title'),
    missionObjective: document.getElementById('mission-objective'),
    missionReward: document.getElementById('mission-reward'),
    missionProgress: document.getElementById('mission-progress-fill'),
    commsAvatar: document.getElementById('comms-avatar'),
    commsSpeaker: document.getElementById('comms-speaker'),
    commsLine: document.getElementById('comms-line'),
    toastText: document.getElementById('toast-text'),
    wantedStars: [...document.querySelectorAll('#wanted-stars .star')],
    wantedSub: document.getElementById('wanted-status-line'),
    playerCash: document.getElementById('player-cash'),
    healthVal: document.getElementById('health-val'),
    healthFill: document.getElementById('health-fill'),
    armorVal: document.getElementById('armor-val'),
    armorFill: document.getElementById('armor-fill'),
    weaponName: document.getElementById('weapon-name'),
    weaponAmmo: document.getElementById('weapon-ammo'),
    weaponMode: document.getElementById('weapon-mode'),
    radioStation: document.getElementById('radio-station'),
    promptKey: document.getElementById('prompt-key'),
    promptTitle: document.getElementById('prompt-title'),
    promptDesc: document.getElementById('prompt-desc'),
    telemetryCard: document.getElementById('telemetry-card'),
    vehicleClass: document.getElementById('vehicle-class'),
    vehicleName: document.getElementById('vehicle-name'),
    vehicleGear: document.getElementById('vehicle-gear'),
    vehicleSpeed: document.getElementById('vehicle-speed'),
    driftState: document.getElementById('drift-state'),
    rpmFill: document.getElementById('rpm-fill'),
    hullVal: document.getElementById('hull-val'),
    hullFill: document.getElementById('hull-fill'),
    dossierModal: document.getElementById('dossier-modal'),
    titleModal: document.getElementById('title-modal'),
    missionList: document.getElementById('mission-list'),
    saveSlotsList: document.getElementById('save-slots-list'),
    campaignBadge: document.getElementById('campaign-progress-badge'),
    careerStats: document.getElementById('career-stats-card'),
  };

  const mapCtx = el.minimap.getContext('2d');

  // Wire interactive buttons
  document.getElementById('btn-radio')?.addEventListener('click', () => {
    const st = world.audio.cycleRadioStation();
    world.notify(`Radio Tuned: ${st.title}`);
  });
  document.getElementById('btn-resume-play')?.addEventListener('click', () => callbacks.onResume());
  document.getElementById('btn-start-game')?.addEventListener('click', () => callbacks.onStartGame());
  document.getElementById('btn-open-saves')?.addEventListener('click', () => callbacks.onOpenDossier());
  document.getElementById('btn-quick-save')?.addEventListener('click', () => {
    world.saveSystem.autoSave(world);
    renderDossierModal();
  });
  document.getElementById('btn-export-save')?.addEventListener('click', () => {
    world.saveSystem.exportActiveSave(world);
  });
  document.getElementById('input-import-save')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    world.saveSystem.importSaveText(text, world);
    renderDossierModal();
  });

  function renderMinimap() {
    const w = el.minimap.width;
    const h = el.minimap.height;
    const sx = w / WORLD_BOUNDS.width;
    const sy = h / WORLD_BOUNDS.height;

    mapCtx.fillStyle = '#091529';
    mapCtx.fillRect(0, 0, w, h);

    // Landmass
    mapCtx.fillStyle = '#182842';
    mapCtx.fillRect(140 * sx, 180 * sy, 3920 * sx, 3260 * sy);

    // Lagoon & Beach
    const lag = world.cityMap.lagoonChannel;
    mapCtx.fillStyle = '#0d4066';
    mapCtx.fillRect(lag.x * sx, 0, lag.w * sx, h);
    mapCtx.fillStyle = '#d4a674';
    mapCtx.fillRect(3950 * sx, 180 * sy, 125 * sx, 3260 * sy);
    mapCtx.fillStyle = '#0d4a6e';
    mapCtx.fillRect(4068 * sx, 0, 732 * sx, h);

    // Roads
    mapCtx.fillStyle = '#33415c';
    for (const hr of world.cityMap.horizontalRoads) {
      mapCtx.fillRect(hr.x1 * sx, (hr.y - hr.width * 0.5) * sy, (hr.x2 - hr.x1) * sx, Math.max(3, hr.width * sy));
    }
    for (const vr of world.cityMap.verticalRoads) {
      mapCtx.fillRect((vr.x - vr.width * 0.5) * sx, vr.y1 * sy, Math.max(3, vr.width * sx), (vr.y2 - vr.y1) * sy);
    }

    // Buildings
    mapCtx.fillStyle = '#253554';
    for (const b of world.cityMap.buildings) {
      mapCtx.fillRect(b.x * sx, b.y * sy, Math.max(2, b.w * sx), Math.max(2, b.h * sy));
    }

    // Garages (cyan dots)
    mapCtx.fillStyle = '#2de2e6';
    for (const g of world.cityMap.garages) {
      mapCtx.beginPath();
      mapCtx.arc(g.x * sx, g.y * sy, 3.2, 0, Math.PI * 2);
      mapCtx.fill();
    }

    // GPS Route Line to Active Mission Objective
    const mission = world.missions.getActiveMission();
    if (mission) {
      mapCtx.strokeStyle = '#ffb347';
      mapCtx.lineWidth = 2;
      mapCtx.setLineDash([4, 3]);
      mapCtx.beginPath();
      mapCtx.moveTo(world.player.x * sx, world.player.y * sy);
      mapCtx.lineTo(mission.targetX * sx, mission.targetY * sy);
      mapCtx.stroke();
      mapCtx.setLineDash([]);

      mapCtx.fillStyle = '#ffb347';
      mapCtx.beginPath();
      mapCtx.arc(mission.targetX * sx, mission.targetY * sy, 4.5, 0, Math.PI * 2);
      mapCtx.fill();
    }

    // Traffic & Flashing SPPD Police Units
    const redPhase = Math.sin(world.wanted.flashTimer) > 0;
    for (const v of world.vehicleSystem.vehicles) {
      if (v.wrecked) continue;
      if (v.isPolice && v.driver === 'police') {
        // Radar vision cone
        mapCtx.fillStyle = redPhase ? 'rgba(255, 42, 85, 0.28)' : 'rgba(58, 134, 255, 0.28)';
        mapCtx.beginPath();
        mapCtx.arc(v.x * sx, v.y * sy, 11, 0, Math.PI * 2);
        mapCtx.fill();
        mapCtx.fillStyle = redPhase ? '#ff2a55' : '#3a86ff';
        mapCtx.beginPath();
        mapCtx.arc(v.x * sx, v.y * sy, 3.2, 0, Math.PI * 2);
        mapCtx.fill();
      } else if (v.driver !== 'player') {
        mapCtx.fillStyle = 'rgba(200, 215, 240, 0.45)';
        mapCtx.fillRect(v.x * sx - 1, v.y * sy - 1, 2.2, 2.2);
      }
    }

    // Player heading chevron
    mapCtx.save();
    mapCtx.translate(world.player.x * sx, world.player.y * sy);
    mapCtx.rotate(world.player.angle);
    mapCtx.fillStyle = '#ffffff';
    mapCtx.strokeStyle = '#091326';
    mapCtx.lineWidth = 1.5;
    mapCtx.beginPath();
    mapCtx.moveTo(7, 0);
    mapCtx.lineTo(-5, -4.5);
    mapCtx.lineTo(-3, 0);
    mapCtx.lineTo(-5, 4.5);
    mapCtx.closePath();
    mapCtx.fill();
    mapCtx.stroke();
    mapCtx.restore();
  }

  function renderDossierModal() {
    el.campaignBadge.textContent = `${world.missions.completedIds.size} / ${world.missions.missions.length} COMPLETED`;

    el.missionList.replaceChildren();
    world.missions.missions.forEach((m, idx) => {
      const done = world.missions.completedIds.has(m.id);
      const isActive = world.missions.activeIndex === idx;
      const card = document.createElement('div');
      card.className = `mission-row-card${isActive ? ' active-mission' : ''}`;
      card.innerHTML = `
        <div class="mission-row-info">
          <h4>${m.title} <span style="color:${done ? '#2ee59d' : '#ffb347'}">(${done ? 'DONE' : `+$${m.reward.toLocaleString()}`})</span></h4>
          <p>${m.district} — ${m.objective}</p>
        </div>
        <button type="button" class="btn-glass">${isActive ? 'Active' : 'Launch'}</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        world.missions.selectMission(idx, world);
        renderDossierModal();
        callbacks.onResume();
      });
      el.missionList.append(card);
    });

    el.saveSlotsList.replaceChildren();
    world.saveSystem.slots.forEach((slot) => {
      const card = document.createElement('div');
      card.className = 'save-slot-card';
      const pct = Math.round(((slot.mission?.completedIds?.length ?? 0) / 6) * 100);
      card.innerHTML = `
        <div class="save-slot-info">
          <h4>${slot.label}</h4>
          <p>${slot.savedAt ? `${slot.savedAt} · ${pct}% Story · $${slot.cash.toLocaleString()}` : 'Empty Save Slot — Ready to Record Career'}</p>
        </div>
        <div style="display:flex;gap:6px;">
          <button type="button" class="btn-glass btn-save">Save</button>
          <button type="button" class="btn-glass btn-load">Load</button>
        </div>
      `;
      card.querySelector('.btn-save').addEventListener('click', () => {
        world.saveSystem.saveToSlot(slot.slot, world);
        renderDossierModal();
      });
      card.querySelector('.btn-load').addEventListener('click', () => {
        world.saveSystem.loadFromSlot(slot.slot, world);
        renderDossierModal();
        callbacks.onResume();
      });
      el.saveSlotsList.append(card);
    });

    el.careerStats.innerHTML = `
      <div class="stat-tile"><span>SYNDICATE BANK</span><strong>$${Math.round(world.player.cash).toLocaleString()}</strong></div>
      <div class="stat-tile"><span>VEHICLES BOOSTED</span><strong>${world.stats.vehiclesStolen}</strong></div>
      <div class="stat-tile"><span>SPPD PURSUITS EVADED</span><strong>${world.stats.policeEvaded}</strong></div>
      <div class="stat-tile"><span>RIVALS NEUTRALIZED</span><strong>${world.stats.rivalsNeutralized}</strong></div>
    `;
  }

  function updateHud() {
    const district = world.cityMap.getDistrictAt(world.player.x, world.player.y);
    const nearestNode = world.cityMap.findNearestIntersection(world.player.x, world.player.y);
    const mission = world.missions.getActiveMission();

    el.district.textContent = district.name;
    el.time.textContent = world.getClockString();
    el.street.textContent = nearestNode.streetLabel;
    const distKm = (Math.hypot(mission.targetX - world.player.x, mission.targetY - world.player.y) / 900).toFixed(1);
    el.coords.textContent = `${distKm} KM TO TARGET`;
    el.chaseAlert.classList.toggle('hidden', world.wanted.stars === 0);

    el.missionTitle.textContent = mission.title;
    el.missionObjective.textContent = mission.objective;
    el.missionReward.textContent = `+$${mission.reward.toLocaleString()}`;
    el.missionProgress.style.width = `${Math.round(world.missions.stageProgress * 100)}%`;
    el.commsAvatar.textContent = mission.avatar;
    el.commsSpeaker.textContent = mission.speaker;
    el.commsLine.textContent = mission.line;

    el.toastText.textContent = world.toastText;

    // 5-Star Wanted Level alternating red/blue police beacon styling
    const redPhase = Math.sin(world.wanted.flashTimer) > 0;
    el.wantedStars.forEach((starEl, i) => {
      starEl.classList.remove('active-red', 'active-blue');
      if (i < world.wanted.stars) {
        starEl.classList.add((i % 2 === 0) === redPhase ? 'active-red' : 'active-blue');
      }
    });
    el.wantedSub.textContent = world.wanted.getStatusLabel();

    el.playerCash.textContent = `$${Math.round(world.player.cash).toLocaleString()}`;
    el.healthVal.textContent = `${Math.round(world.player.health)}%`;
    el.healthFill.style.width = `${clamp(world.player.health, 0, 100)}%`;
    el.armorVal.textContent = `${Math.round(world.player.armor)}%`;
    el.armorFill.style.width = `${clamp(world.player.armor, 0, 100)}%`;

    const weapon = world.player.weapons[world.player.weaponIndex];
    el.weaponName.textContent = weapon.name;
    el.weaponAmmo.textContent = `${weapon.ammo} / ${weapon.reserve}`;
    el.weaponMode.textContent = weapon.mode;
    el.radioStation.textContent = world.audio.getStation().title;

    // Contextual action prompt & Vehicle Telemetry
    if (world.player.vehicle) {
      const v = world.player.vehicle;
      const mph = Math.round(Math.abs(v.speed) * 0.28);
      const gear = mph < 18 ? '1' : mph < 42 ? '2' : mph < 74 ? '3' : mph < 105 ? '4' : '5';
      const rpmPct = clamp(24 + (mph % 32) * 2.2 + (v.nitroBoost > 0 ? 18 : 0), 18, 100);
      const hullPct = Math.round((v.health / v.maxHealth) * 100);

      el.telemetryCard.classList.remove('hidden');
      el.vehicleClass.textContent = v.category;
      el.vehicleName.textContent = v.name;
      el.vehicleGear.textContent = v.speed < -5 ? 'R' : gear;
      el.vehicleSpeed.textContent = String(mph);
      el.driftState.textContent = v.drifting ? 'HANDBRAKE DRIFT' : v.nitroBoost > 0 ? 'NITRO SURGE' : 'TRACTION OK';
      el.rpmFill.style.width = `${rpmPct}%`;
      el.hullVal.textContent = `${hullPct}%`;
      el.hullFill.style.width = `${hullPct}%`;

      el.promptKey.textContent = 'F';
      el.promptTitle.textContent = `Exit ${v.name}`;
      el.promptDesc.textContent = world.wanted.stars > 0
        ? 'Drive into a cyan Neon Respray garage ($500) to wipe SPPD heat'
        : 'Hold Space to handbrake drift · Shift for nitro boost';
    } else {
      el.telemetryCard.classList.add('hidden');
      const cand = world.vehicleSystem.findCarjackCandidate(world.player.x, world.player.y, 135);
      el.promptKey.textContent = 'F';
      if (cand) {
        el.promptTitle.textContent = `Carjack ${cand.name}`;
        el.promptDesc.textContent = `${cand.category} within reach — press F to commandeer`;
      } else {
        el.promptTitle.textContent = 'On Foot · Palmera City';
        el.promptDesc.textContent = 'Aim & click to fire · Approach any vehicle & press F to steal';
      }
    }

    renderMinimap();
  }

  function setOverlays(mode) {
    el.titleModal.classList.toggle('hidden', mode !== 'title');
    el.dossierModal.classList.toggle('hidden', mode !== 'dossier');
    if (mode === 'dossier') renderDossierModal();
  }

  return {
    updateHud,
    renderDossierModal,
    setOverlays,
  };
}
