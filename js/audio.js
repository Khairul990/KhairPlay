"use strict";

/**
 * PlayNova Sound FX Synthesizer (Web Audio API)
 * Lightweight, zero external audio asset dependencies, crisp futuristic cyber audio.
 */
const NovaAudio = (function () {
  const STORAGE_KEY = "nova_sound_enabled";
  let ctx = null;
  let enabled = true;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) enabled = saved === "true";
  } catch (e) {}

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function isEnabled() {
    return enabled;
  }

  function toggle() {
    enabled = !enabled;
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch (e) {}
    if (enabled) playClick();
    return enabled;
  }

  function setEnabled(val) {
    enabled = !!val;
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch (e) {}
  }

  // Futuristic Click
  function playClick() {
    if (!enabled) return;
    try {
      const c = getContext();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      const now = c.currentTime;
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // Golden Arcade Coin Pick Up
  function playCoin() {
    if (!enabled) return;
    try {
      const c = getContext();
      if (!c) return;
      const now = c.currentTime;

      const osc1 = c.createOscillator();
      const osc2 = c.createOscillator();
      const gain = c.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      osc2.frequency.setValueAtTime(987.77, now);
      osc2.frequency.setValueAtTime(1318.51, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(c.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.36);
      osc2.stop(now + 0.36);
    } catch (e) {}
  }

  // Level Up / Achievement Fanfare
  function playFanfare() {
    if (!enabled) return;
    try {
      const c = getContext();
      if (!c) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      const now = c.currentTime;
      notes.forEach(function (freq, idx) {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "triangle";
        const t = now + idx * 0.09;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch (e) {}
  }

  // Fortune Wheel Tick
  function playWheelTick() {
    if (!enabled) return;
    try {
      const c = getContext();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "square";
      const now = c.currentTime;
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.02);
    } catch (e) {}
  }

  // Nitro Boost Woosh
  function playNitro() {
    if (!enabled) return;
    try {
      const c = getContext();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sawtooth";
      const now = c.currentTime;
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.35);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  // Laser Blaster
  function playLaser() {
    if (!enabled) return;
    try {
      const c = getContext();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sawtooth";
      const now = c.currentTime;
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  // Crash / Explosion
  function playExplosion() {
    if (!enabled) return;
    try {
      const c = getContext();
      if (!c) return;
      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  return {
    getContext: getContext,
    isEnabled: isEnabled,
    toggle: toggle,
    setEnabled: setEnabled,
    playClick: playClick,
    playCoin: playCoin,
    playFanfare: playFanfare,
    playWheelTick: playWheelTick,
    playNitro: playNitro,
    playLaser: playLaser,
    playExplosion: playExplosion
  };
})();

if (typeof window !== "undefined") {
  window.NovaAudio = NovaAudio;
}
