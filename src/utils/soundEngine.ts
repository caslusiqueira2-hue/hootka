// ============================================================
// hootka – Sound Engine  (Web Audio API, no external files)
// ============================================================

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (_ctx) return _ctx;
  try { _ctx = new AudioContext(); return _ctx; } catch { return null; }
}

async function ensureResumed(ctx: AudioContext): Promise<boolean> {
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { return false; }
  }
  return ctx.state === 'running';
}

interface OscParams {
  frequency: number;
  type: OscillatorType;
  gainValue: number;
  startTime: number;
  duration: number;
  freqRampTo?: number;
  attack?: number;
  release?: number;
}

function playOsc(ctx: AudioContext, p: OscParams): void {
  const { frequency, type, gainValue, startTime, duration, freqRampTo, attack = 0.005, release = 0.05 } = p;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  if (freqRampTo !== undefined) osc.frequency.linearRampToValueAtTime(freqRampTo, startTime + duration);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + attack);
  gain.gain.setValueAtTime(gainValue, startTime + duration - release);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

function playNoise(ctx: AudioContext, gainValue: number, startTime: number, duration: number, filterFreq = 2000): void {
  const bufferSize = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data   = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 1;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, startTime);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(startTime);
  source.stop(startTime + duration);
}

// ============================================================
export class SoundEngine {
  private _enabled: boolean;
  private _volume: number;

  constructor(enabled = true, volume = 0.7) {
    this._enabled = enabled;
    this._volume  = Math.max(0, Math.min(1, volume));
  }

  get enabled() { return this._enabled; }
  setEnabled(v: boolean) { this._enabled = v; }
  enable()      { this._enabled = true; }
  disable()     { this._enabled = false; }
  setVolume(v: number) { this._volume = Math.max(0, Math.min(1, v)); }
  private get vol() { return this._volume; }

  private async ctx(): Promise<AudioContext | null> {
    if (!this._enabled) return null;
    const ctx = getCtx();
    if (!ctx) return null;
    return (await ensureResumed(ctx)) ? ctx : null;
  }

  // Normal countdown tick
  async playTick(): Promise<void> {
    const ctx = await this.ctx(); if (!ctx) return;
    playOsc(ctx, { frequency: 880, type: 'sine', gainValue: 0.15 * this.vol, startTime: ctx.currentTime, duration: 0.06, attack: 0.002, release: 0.04 });
  }

  // Urgent tick (last 5 s)
  async playUrgentTick(): Promise<void> {
    const ctx = await this.ctx(); if (!ctx) return;
    const t = ctx.currentTime;
    playOsc(ctx, { frequency: 1200, type: 'square', gainValue: 0.18 * this.vol, startTime: t,        duration: 0.05, attack: 0.002, release: 0.02 });
    playOsc(ctx, { frequency: 1400, type: 'square', gainValue: 0.14 * this.vol, startTime: t + 0.07, duration: 0.04, attack: 0.002, release: 0.02 });
  }

  // Correct answer – rising arpeggio C5→E5→G5
  async playCorrect(): Promise<void> {
    const ctx = await this.ctx(); if (!ctx) return;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) =>
      playOsc(ctx, { frequency: freq, type: 'triangle', gainValue: 0.22 * this.vol, startTime: t + i * 0.1, duration: 0.15, attack: 0.005, release: 0.07 }));
  }

  // Wrong answer – descending buzz + noise
  async playWrong(): Promise<void> {
    const ctx = await this.ctx(); if (!ctx) return;
    const t = ctx.currentTime;
    playOsc(ctx, { frequency: 220, type: 'sawtooth', gainValue: 0.2 * this.vol, startTime: t, duration: 0.4, freqRampTo: 100, attack: 0.01, release: 0.2 });
    playNoise(ctx, 0.08 * this.vol, t, 0.3, 300);
  }

  // Overtake – swoosh glide
  async playOvertake(): Promise<void> {
    const ctx = await this.ctx(); if (!ctx) return;
    const t = ctx.currentTime;
    playOsc(ctx, { frequency: 400, type: 'sine',     gainValue: 0.25 * this.vol, startTime: t,        duration: 0.35, freqRampTo: 900, attack: 0.01, release: 0.10 });
    playOsc(ctx, { frequency: 1046, type: 'triangle', gainValue: 0.20 * this.vol, startTime: t + 0.30, duration: 0.15, attack: 0.005, release: 0.10 });
  }

  // Victory fanfare
  async playVictory(): Promise<void> {
    const ctx = await this.ctx(); if (!ctx) return;
    const t = ctx.currentTime;
    const seq = [
      { freq: 523.25, d: 0.0 }, { freq: 659.25, d: 0.1 }, { freq: 783.99, d: 0.2 },
      { freq: 1046.5, d: 0.35 }, { freq: 783.99, d: 0.5 }, { freq: 1046.5, d: 0.6 }, { freq: 1318.5, d: 0.75 },
    ];
    seq.forEach(({ freq, d }) =>
      playOsc(ctx, { frequency: freq, type: 'triangle', gainValue: 0.22 * this.vol, startTime: t + d, duration: 0.25, attack: 0.01, release: 0.10 }));
    [523.25, 659.25, 783.99].forEach((freq) =>
      playOsc(ctx, { frequency: freq, type: 'sine', gainValue: 0.15 * this.vol, startTime: t + 1.0, duration: 1.2, attack: 0.05, release: 0.5 }));
  }

  // 3-2-1-Go countdown beeps
  async playCountdown(): Promise<void> {
    const ctx = await this.ctx(); if (!ctx) return;
    const t = ctx.currentTime;
    [0, 1, 2].forEach((i) =>
      playOsc(ctx, { frequency: 660, type: 'sine', gainValue: 0.20 * this.vol, startTime: t + i, duration: 0.18, attack: 0.005, release: 0.08 }));
    playOsc(ctx, { frequency: 990, type: 'sine', gainValue: 0.28 * this.vol, startTime: t + 3.0, duration: 0.5, attack: 0.01, release: 0.20 });
  }

  // Score / answer reveal
  async playReveal(): Promise<void> {
    const ctx = await this.ctx(); if (!ctx) return;
    const t = ctx.currentTime;
    playNoise(ctx, 0.10 * this.vol, t, 0.4, 800);
    [440, 550, 660].forEach((freq, i) =>
      playOsc(ctx, { frequency: freq, type: 'triangle', gainValue: 0.20 * this.vol, startTime: t + 0.35 + i * 0.05, duration: 0.5, attack: 0.01, release: 0.20 }));
  }
}

// Singleton
export const soundEngine = new SoundEngine();

export const playTick        = (): Promise<void> => soundEngine.playTick();
export const playUrgentTick  = (): Promise<void> => soundEngine.playUrgentTick();
export const playCorrect     = (): Promise<void> => soundEngine.playCorrect();
export const playWrong       = (): Promise<void> => soundEngine.playWrong();
export const playOvertake    = (): Promise<void> => soundEngine.playOvertake();
export const playVictory     = (): Promise<void> => soundEngine.playVictory();
export const playCountdown   = (): Promise<void> => soundEngine.playCountdown();
export const playReveal      = (): Promise<void> => soundEngine.playReveal();

export default soundEngine;
