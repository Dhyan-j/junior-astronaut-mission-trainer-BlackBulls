let audioCtx: AudioContext | null = null;
let isAudioMuted = false;

export function setMuted(muted: boolean) {
  isAudioMuted = muted;
}

export function getMuted(): boolean {
  return isAudioMuted;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Procedural Apollo/Artemis NASA Quindar Beep
 */
export function playQuindarBeep(type: 'intro' | 'outro' = 'intro') {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(type === 'intro' ? 2524 : 2475, ctx.currentTime);

  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.22);
}

/**
 * Objective Complete Success Chime
 */
export function playSuccessChime() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.05, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.35);
  });
}

/**
 * Interface Button Click
 */
export function playClickBeep() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.025, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.04);
}

/**
 * Subtle Lunar Regolith Footstep
 */
let lastFootstepTime = 0;
export function playFootstepSound() {
  if (isAudioMuted) return;
  const now = performance.now();
  if (now - lastFootstepTime < 320) return; // Prevent rapid firing
  lastFootstepTime = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = Math.floor(ctx.sampleRate * 0.08);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(320 + Math.random() * 80, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(ctx.currentTime);
}

/**
 * Mechanical Latch Sound (PLSS Mount / Helmet Seal)
 */
export function playEquipmentLatchSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

/**
 * Spacesuit Equipped Confirmation
 */
export function playSuitEquippedSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chord = [329.63, 440.0, 659.25]; // E4, A4, E5

  chord.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  });
}

/**
 * Airlock Warning Alarm
 */
export function playAirlockAlarm() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now + i * 0.2);

    gain.gain.setValueAtTime(0.03, now + i * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.2 + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.2);
    osc.stop(now + i * 0.2 + 0.15);
  }
}

/**
 * Airlock Depressurization Hiss
 */
export function playAirlockHiss() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = ctx.sampleRate * 2.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 2.5);
  filter.Q.setValueAtTime(2.0, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(ctx.currentTime);
}

/**
 * Heavy Pneumatic Door Slide / Seal Sound
 */
export function playPneumaticDoorSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Servo motor whine
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.linearRampToValueAtTime(80, now + 0.6);

  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.65);

  // Pressure seal release
  const bufferSize = Math.floor(ctx.sampleRate * 0.4);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, now + 0.1);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.05, now + 0.1);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(now + 0.1);
}

/**
 * Continuous Habitat Life Support Ambient Hum
 */
let ambientHumSource: OscillatorNode | null = null;
let ambientHumGain: GainNode | null = null;

export function startHabitatAmbientHum() {
  if (isAudioMuted || ambientHumSource) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, ctx.currentTime); // Low 65Hz HVAC / ventilation drone

    gain.gain.setValueAtTime(0.015, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    ambientHumSource = osc;
    ambientHumGain = gain;
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function stopHabitatAmbientHum() {
  if (ambientHumSource) {
    try {
      ambientHumSource.stop();
      ambientHumSource.disconnect();
      if (ambientHumGain) {
        ambientHumGain.disconnect();
      }
    } catch {
      // Ignore
    }
    ambientHumSource = null;
    ambientHumGain = null;
  }
}
