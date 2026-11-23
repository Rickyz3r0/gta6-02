// 100% Procedural Web Audio Synthesizer & Solaria FM Radio Engine (zero external audio files).
// Synthesizes gunshots, explosions, sirens, carjack latch, UI glass clicks, and synthwave basslines.

import { RADIO_STATIONS } from './config.js';

export function createAudioEngine() {
  let ctx = null;
  let stationIndex = 0;
  let beatTimer = 0;
  let stepIndex = 0;

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      ctx = new AudioCtx();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function playTone(freq, duration, type = 'sine', gainPeak = 0.08, slideTo = null) {
    const audio = ensureContext();
    if (!audio || audio.state !== 'running') return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playSfx(kind) {
    if (kind === 'gunshot') {
      playTone(210, 0.09, 'sawtooth', 0.09, 55);
    } else if (kind === 'launcher') {
      playTone(140, 0.24, 'square', 0.11, 38);
    } else if (kind === 'explosion') {
      playTone(92, 0.52, 'sawtooth', 0.16, 24);
      playTone(62, 0.45, 'triangle', 0.14, 22);
    } else if (kind === 'mission_complete') {
      playTone(523.25, 0.18, 'triangle', 0.1);
      setTimeout(() => playTone(659.25, 0.2, 'triangle', 0.1), 110);
      setTimeout(() => playTone(783.99, 0.32, 'triangle', 0.12), 220);
    } else if (kind === 'ui_click') {
      playTone(740, 0.06, 'sine', 0.05, 980);
    }
  }

  function cycleRadioStation() {
    stationIndex = (stationIndex + 1) % RADIO_STATIONS.length;
    playSfx('ui_click');
    return RADIO_STATIONS[stationIndex];
  }

  function getStation() {
    return RADIO_STATIONS[stationIndex];
  }

  function stepAudio(dt) {
    const station = RADIO_STATIONS[stationIndex];
    if (!ctx || ctx.state !== 'running' || station.bpm <= 0) return;
    const stepDur = 60 / station.bpm / 2;
    beatTimer += dt;
    if (beatTimer >= stepDur) {
      beatTimer -= stepDur;
      const pattern = station.style === 'synthwave'
        ? [1, 1, 1.25, 1.5, 1, 1.25, 1.33, 1.125]
        : station.style === 'latin'
          ? [1, 1.2, 1, 1.5, 1.2, 1.33, 1, 1.5]
          : [1, 1.125, 1.25, 1.5, 1.25, 1, 0.89, 1];
      const mult = pattern[stepIndex % pattern.length];
      playTone(station.rootFreq * mult, stepDur * 0.85, station.style === 'chill' ? 'triangle' : 'sawtooth', 0.028);
      stepIndex += 1;
    }
  }

  return {
    ensureContext,
    playSfx,
    cycleRadioStation,
    getStation,
    stepAudio,
  };
}
