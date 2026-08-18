/**
 * AudioService — procedural WebAudio sound engine with channel isolation
 * and spatial panning.
 *
 * Architecture:
 *   AudioContext
 *     ├── masterGain
 *     │   ├── sfxGain → sfxPanner     (game sounds: spin, cascade, wins)
 *     │   ├── uiGain → uiPanner       (button clicks, modals)
 *     │   └── musicGain → musicPanner (reserved for future BGM)
 *     └── destination
 *
 * Each channel has its own gain + panner for independent volume/mute/pan.
 * All sounds are procedural oscillators — no audio assets loaded.
 * Active oscillators are tracked for cleanup on disposal.
 */

type Channel = 'sfx' | 'ui' | 'music';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private channels: Record<Channel, GainNode> = { sfx: null!, ui: null!, music: null! };
  private panners: Record<Channel, StereoPannerNode> = { sfx: null!, ui: null!, music: null! };
  private muted: Record<Channel, boolean> = { sfx: false, ui: false, music: false };
  private volumes: Record<Channel, number> = { sfx: 0.8, ui: 0.8, music: 0.5 };
  private activeNodes: Set<AudioNode> = new Set();

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);

        for (const ch of ['sfx', 'ui', 'music'] as Channel[]) {
          this.channels[ch] = this.ctx.createGain();
          this.channels[ch].gain.value = this.volumes[ch];
          this.panners[ch] = this.ctx.createStereoPanner();
          this.panners[ch].pan.value = 0;
          this.channels[ch].connect(this.panners[ch]);
          this.panners[ch].connect(this.masterGain);
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private ch(ch: Channel): GainNode | null {
    this.initCtx();
    if (!this.ctx || this.muted[ch]) return null;
    return this.channels[ch];
  }

  // ─── Global Controls ──────────────────────────────────────────────────────

  public setMuted(muted: boolean) {
    this.muted.sfx = muted;
    this.muted.ui = muted;
    this.muted.music = muted;
  }

  public setMutedChannel(ch: Channel, muted: boolean) {
    this.muted[ch] = muted;
  }

  public setVolume(ch: Channel, vol: number) {
    this.volumes[ch] = Math.max(0, Math.min(1, vol));
    if (this.channels[ch]) {
      this.channels[ch].gain.value = this.volumes[ch];
    }
  }

  /** Set stereo pan for a channel (-1 = left, 0 = center, 1 = right) */
  public setPan(ch: Channel, pan: number) {
    if (this.panners[ch]) {
      this.panners[ch].pan.value = Math.max(-1, Math.min(1, pan));
    }
  }

  /** Play a sound with spatial positioning based on column index (0-4) */
  public playSpatial(channel: Channel, colIndex: number, totalCols: number, fn: () => void) {
    const prev = this.panners[channel]?.pan.value;
    if (this.panners[channel]) {
      this.panners[channel].pan.value = (colIndex / (totalCols - 1)) * 2 - 1;
    }
    fn();
  }

  /** Dispose all active nodes and close the AudioContext */
  public dispose() {
    for (const node of this.activeNodes) {
      try { node.disconnect(); } catch {}
    }
    this.activeNodes.clear();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
    }
  }

  // ─── SFX: Spin & Reel ────────────────────────────────────────────────────

  public spinStart() {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  public reelStop(colIndex: number) {
    this.playSpatial('sfx', colIndex, 5, () => {
      const dest = this.ch('sfx');
      if (!dest || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const baseFreq = 240 + colIndex * 40;
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
      } catch {}
    });
  }

  public scatterLand(scatterCount: number) {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      const freq = freqs[Math.min(scatterCount - 1, freqs.length - 1)] || 523.25;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {}
  }

  // ─── SFX: Wild & Multiplier ──────────────────────────────────────────────

  public goldWildMagicChime() {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [1046.5, 1318.51, 1567.98, 2093.0, 2637.02, 3135.96];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const t = now + idx * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + 0.3);
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {}
  }

  public goldFrameConvert() {
    this.goldWildMagicChime();
  }

  public goldenJokerExpand() {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(300, now);
      sub.frequency.exponentialRampToValueAtTime(55, now + 0.4);
      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      sub.connect(subGain);
      subGain.connect(dest);
      sub.start(now);
      sub.stop(now + 0.5);

      const laser = this.ctx.createOscillator();
      const laserGain = this.ctx.createGain();
      laser.type = 'sawtooth';
      laser.frequency.setValueAtTime(400, now);
      laser.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
      laserGain.gain.setValueAtTime(0.01, now);
      laserGain.gain.linearRampToValueAtTime(0.25, now + 0.1);
      laserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      laser.connect(laserGain);
      laserGain.connect(dest);
      laser.start(now);
      laser.stop(now + 0.45);

      [1200, 1500, 1800, 2400, 3000].forEach((freq, i) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + 0.15 + i * 0.05);
        g.gain.setValueAtTime(0.18, now + 0.15 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        o.connect(g);
        g.connect(dest);
        o.start(now + 0.15 + i * 0.05);
        o.stop(now + 0.55);
      });
    } catch {}
  }

  public overdriveSurge(multiplier: number = 15) {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(45, now + 0.3);
      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      sub.connect(subGain);
      subGain.connect(dest);
      sub.start(now);
      sub.stop(now + 0.45);

      const notes = [261.63, 311.13, 392.0, 466.16, 523.25, 622.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const st = now + idx * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, st);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, st + 0.25);
        gain.gain.setValueAtTime(0.01, st);
        gain.gain.linearRampToValueAtTime(0.22, st + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.4);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(st);
        osc.stop(st + 0.4);
      });
    } catch {}
  }

  // ─── SFX: Cascade & Ripple ───────────────────────────────────────────────

  public cascadeExplode() {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(now + 0.12);
    } catch {}
  }

  public energyRipple(cascadeCount: number = 1) {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = 440 * Math.pow(1.12, Math.min(cascadeCount, 6));

      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq * 0.8, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.18);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.3);
      gain1.gain.setValueAtTime(0.01, now);
      gain1.gain.linearRampToValueAtTime(0.22, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(dest);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 0.22);
      gain2.gain.setValueAtTime(0.01, now + 0.04);
      gain2.gain.linearRampToValueAtTime(0.16, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(dest);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.38);
    } catch {}
  }

  // ─── SFX: Win & Multiplier ───────────────────────────────────────────────

  public winChime(isHigh: boolean = false) {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const notes = isHigh
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51]
        : [523.25, 659.25, 783.99, 1046.5];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.22);
      });
    } catch {}
  }

  public multiplierUpgrade(multiplier: number) {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = 320 * (1 + (multiplier - 1) * 0.2);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.25);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // ─── SFX: Retention Features ─────────────────────────────────────────────

  public vaultDepositCoin() {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [2400, 3200, 4100].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);
        gain.gain.setValueAtTime(0.2, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.18);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + i * 0.03);
        osc.stop(now + i * 0.03 + 0.18);
      });

      const lockOsc = this.ctx.createOscillator();
      const lockGain = this.ctx.createGain();
      lockOsc.type = 'square';
      lockOsc.frequency.setValueAtTime(120, now + 0.12);
      lockOsc.frequency.exponentialRampToValueAtTime(40, now + 0.22);
      lockGain.gain.setValueAtTime(0.25, now + 0.12);
      lockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      lockOsc.connect(lockGain);
      lockGain.connect(dest);
      lockOsc.start(now + 0.12);
      lockOsc.stop(now + 0.25);
    } catch {}
  }

  public jackpotTeaserDrop() {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const st = now + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, st);
        gain.gain.setValueAtTime(0.22, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(st);
        osc.stop(st + 0.35);
      });
    } catch {}
  }

  public tournamentOvertake() {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.28);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // ─── SFX: Celebration Fanfare ────────────────────────────────────────────

  public orchestralBigWinFanfare(tier: 'big' | 'mega' | 'super' = 'big') {
    const dest = this.ch('sfx');
    if (!dest || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      const timpaniHits = [
        { time: 0.0, freq: 85, vol: 0.4 },
        { time: 0.18, freq: 98, vol: 0.42 },
        { time: 0.36, freq: 110, vol: 0.45 },
        { time: 0.54, freq: 130, vol: 0.55 },
        { time: 0.9, freq: 65, vol: 0.65 },
      ];
      timpaniHits.forEach(({ time, freq, vol }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + time + 0.28);
        gain.gain.setValueAtTime(vol, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.32);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + time);
        osc.stop(now + time + 0.32);
      });

      const trumpetNotes = [
        { f: 523.25, t: 0.0, d: 0.16 },
        { f: 659.25, t: 0.16, d: 0.16 },
        { f: 783.99, t: 0.32, d: 0.16 },
        { f: 1046.5, t: 0.48, d: 0.38 },
        { f: 880.0, t: 0.9, d: 0.18 },
        { f: 987.77, t: 1.08, d: 0.18 },
        { f: 1046.5, t: 1.26, d: 0.22 },
        { f: 1318.51, t: 1.48, d: 0.24 },
        { f: 1567.98, t: 1.72, d: 0.65 },
      ];
      trumpetNotes.forEach(({ f, t, d }) => {
        if (!this.ctx) return;
        const noteStart = now + t;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, noteStart);
        gain.gain.setValueAtTime(0.01, noteStart);
        gain.gain.linearRampToValueAtTime(0.24, noteStart + 0.04);
        gain.gain.setValueAtTime(0.2, noteStart + d * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + d);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(noteStart);
        osc.stop(noteStart + d);
      });

      const chordSections = [
        { t: 0.0, freqs: [261.63, 392.0, 659.25], d: 0.45 },
        { t: 0.48, freqs: [349.23, 440.0, 523.25, 698.46], d: 0.4 },
        { t: 0.9, freqs: [392.0, 493.88, 587.33, 783.99], d: 0.55 },
        { t: 1.48, freqs: [261.63, 523.25, 659.25, 783.99, 1046.5, 1174.66], d: 1.1 },
      ];
      chordSections.forEach(({ t, freqs, d }) => {
        freqs.forEach((freq) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + t);
          gain.gain.setValueAtTime(0.01, now + t);
          gain.gain.linearRampToValueAtTime(0.14, now + t + 0.08);
          gain.gain.setValueAtTime(0.11, now + t + d * 0.6);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now + t);
          osc.stop(now + t + d);
        });
      });
    } catch {}
  }

  public bigWinFanfare(tier: 'big' | 'mega' | 'super' = 'big') {
    this.orchestralBigWinFanfare(tier);
  }

  // ─── UI: Button Click ─────────────────────────────────────────────────────

  public buttonClick() {
    const dest = this.ch('ui');
    if (!dest || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }
}

export const sound = new AudioService();
