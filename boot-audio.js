// =============================================
// J.A.R.V.I.S. OS — BOOT SOUND EFFECTS
// Web Audio API synthesized sci-fi sounds
// =============================================

const BootAudio = (function() {
  'use strict';

  let ctx = null;
  let masterGain = null;
  let initialized = false;
  let bassOsc = null;
  let bassGain = null;
  let progressOsc = null;
  let progressGain = null;
  let progressFilter = null;

  function init() {
    if (initialized) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.6;
      masterGain.connect(ctx.destination);
      initialized = true;
      return true;
    } catch (e) {
      console.warn('[BootAudio] Web Audio API not available:', e);
      return false;
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') {
      return ctx.resume();
    }
    return Promise.resolve();
  }

  // 1. Deep bass hum that fades in
  function playBootHum() {
    if (!init()) return;
    const now = ctx.currentTime;

    // Sub-bass fundamental
    bassOsc = ctx.createOscillator();
    bassGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 120;
    filter.Q.value = 8;

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.value = 40;
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.25, now + 2.5);
    bassGain.gain.linearRampToValueAtTime(0.12, now + 6);

    bassOsc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start(now);

    // Harmonic overtone
    const overtone = ctx.createOscillator();
    const overtoneGain = ctx.createGain();
    overtone.type = 'sine';
    overtone.frequency.value = 80;
    overtoneGain.gain.setValueAtTime(0, now);
    overtoneGain.gain.linearRampToValueAtTime(0.06, now + 3);
    overtoneGain.gain.linearRampToValueAtTime(0.03, now + 8);
    overtoneGain.gain.linearRampToValueAtTime(0, now + 9);
    overtone.connect(overtoneGain);
    overtoneGain.connect(masterGain);
    overtone.start(now);
    overtone.stop(now + 9);

    // Schedule bass to fade out at boot end
    bassGain.gain.linearRampToValueAtTime(0, now + 9);
    bassOsc.stop(now + 9.5);
  }

  // 2. Short high-pitched blip for diagnostic lines
  function playDiagBeep() {
    if (!init()) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.03);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.15);

    // Tiny click layer
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'square';
    click.frequency.value = 4000;
    clickGain.gain.setValueAtTime(0.06, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    click.connect(clickGain);
    clickGain.connect(masterGain);
    click.start(now);
    click.stop(now + 0.03);
  }

  // 3. Rising tone that tracks progress bar (call with 0-100)
  function playProgressTone(percent) {
    if (!init()) return;
    const now = ctx.currentTime;

    if (!progressOsc) {
      progressOsc = ctx.createOscillator();
      progressGain = ctx.createGain();
      progressFilter = ctx.createBiquadFilter();

      progressOsc.type = 'sine';
      progressOsc.frequency.value = 200;
      progressFilter.type = 'lowpass';
      progressFilter.frequency.value = 600;
      progressFilter.Q.value = 2;

      progressGain.gain.value = 0.03;

      progressOsc.connect(progressFilter);
      progressFilter.connect(progressGain);
      progressGain.connect(masterGain);
      progressOsc.start(now);
    }

    // Map 0-100% to 200-800 Hz
    const freq = 200 + (percent / 100) * 600;
    progressOsc.frequency.linearRampToValueAtTime(freq, now + 0.1);
    progressFilter.frequency.linearRampToValueAtTime(400 + (percent / 100) * 1200, now + 0.1);
    progressGain.gain.linearRampToValueAtTime(0.02 + (percent / 100) * 0.04, now + 0.1);
  }

  function stopProgressTone() {
    if (progressOsc) {
      const now = ctx.currentTime;
      progressGain.gain.linearRampToValueAtTime(0, now + 0.3);
      progressOsc.stop(now + 0.4);
      progressOsc = null;
      progressGain = null;
      progressFilter = null;
    }
  }

  // 4. Quick ping for status boxes going ONLINE
  function playOnlinePing() {
    if (!init()) return;
    const now = ctx.currentTime;

    // Main ping tone (two-note chime)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(1800, now + 0.06);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1800, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.setValueAtTime(0.18, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(masterGain);

    osc1.start(now);
    osc1.stop(now + 0.08);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.4);

    // Shimmer layer
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.value = 3600;
    shimmerGain.gain.setValueAtTime(0.04, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmer.start(now);
    shimmer.stop(now + 0.25);
  }

  // 5. Power-up whoosh + chime at 100%
  function playBootComplete() {
    if (!init()) return;
    const now = ctx.currentTime;
    stopProgressTone();

    // Whoosh: filtered noise sweep
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(6000, now + 0.8);
    noiseFilter.frequency.exponentialRampToValueAtTime(800, now + 1.5);
    noiseFilter.Q.value = 1.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.3);
    noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.8);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(now);
    noise.stop(now + 2);

    // Rising chord (C5, E5, G5 → staggered)
    const chimeNotes = [523.25, 659.25, 783.99, 1046.5];
    chimeNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const offset = 0.4 + i * 0.12;
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.12 - i * 0.015, now + offset + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 1.5);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 1.8);
    });

    // Deep impact thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(80, now);
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    thudGain.gain.setValueAtTime(0.25, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    thud.connect(thudGain);
    thudGain.connect(masterGain);
    thud.start(now);
    thud.stop(now + 0.7);
  }

  // 6. Transition woosh sweep
  function playTransitionWoosh() {
    if (!init()) return;
    const now = ctx.currentTime;

    // Frequency sweep
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    const sweepFilter = ctx.createBiquadFilter();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(100, now);
    sweep.frequency.exponentialRampToValueAtTime(4000, now + 0.4);
    sweep.frequency.exponentialRampToValueAtTime(200, now + 0.8);
    sweepFilter.type = 'lowpass';
    sweepFilter.frequency.setValueAtTime(500, now);
    sweepFilter.frequency.exponentialRampToValueAtTime(8000, now + 0.3);
    sweepFilter.frequency.exponentialRampToValueAtTime(300, now + 0.8);
    sweepFilter.Q.value = 3;
    sweepGain.gain.setValueAtTime(0, now);
    sweepGain.gain.linearRampToValueAtTime(0.12, now + 0.15);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    sweep.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(masterGain);
    sweep.start(now);
    sweep.stop(now + 1);

    // White noise burst
    const bufSize = ctx.sampleRate;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) ch[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource();
    ns.buffer = buf;
    const nsFilter = ctx.createBiquadFilter();
    nsFilter.type = 'highpass';
    nsFilter.frequency.setValueAtTime(2000, now);
    nsFilter.frequency.exponentialRampToValueAtTime(8000, now + 0.3);
    const nsGain = ctx.createGain();
    nsGain.gain.setValueAtTime(0, now);
    nsGain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    nsGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    ns.connect(nsFilter);
    nsFilter.connect(nsGain);
    nsGain.connect(masterGain);
    ns.start(now);
    ns.stop(now + 0.7);
  }

  // Unified API
  function playBootSound(type, value) {
    resume().then(() => {
      switch (type) {
        case 'boot-hum':       playBootHum(); break;
        case 'diag-beep':      playDiagBeep(); break;
        case 'progress':       playProgressTone(value || 0); break;
        case 'progress-stop':  stopProgressTone(); break;
        case 'online-ping':    playOnlinePing(); break;
        case 'boot-complete':  playBootComplete(); break;
        case 'transition':     playTransitionWoosh(); break;
      }
    });
  }

  // Try to init on first user gesture
  function autoInit() {
    function handler() {
      init();
      resume();
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    }
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });
    document.addEventListener('touchstart', handler, { once: true });
  }

  autoInit();

  // Expose globally
  window.playBootSound = playBootSound;
  window.initBootAudio = function() {
    init();
    return resume();
  };

  return { play: playBootSound, init: init, resume: resume };
})();
