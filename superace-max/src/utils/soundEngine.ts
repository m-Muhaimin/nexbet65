class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVol: number = 0.8;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVolumes(sfx: number, _bgm?: number) {
    this.sfxVol = Math.max(0, Math.min(1, sfx));
  }

  // Spin Start Click
  public spinStart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2 * this.sfxVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }

  // Reel Stop Tick
  public reelStop(colIndex: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 240 + colIndex * 40;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.25 * this.sfxVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // ignore
    }
  }

  // Scatter Land Jingles
  public scatterLand(scatterCount: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      const freq = freqs[Math.min(scatterCount - 1, freqs.length - 1)] || 523.25;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.35 * this.sfxVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {
      // ignore
    }
  }

  // Golden Frame Convert / Magic Chime
  public goldFrameConvert() {
    this.goldWildMagicChime();
  }

  // Distinct Magic Chime for Golden Frame Wild reveal
  public goldWildMagicChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [1046.5, 1318.51, 1567.98, 2093.0, 2637.02, 3135.96];

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.055;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, noteTime + 0.3);

        gain.gain.setValueAtTime(0.01, noteTime);
        gain.gain.linearRampToValueAtTime(0.22 * this.sfxVol, noteTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.45);
      });
    } catch {
      // ignore
    }
  }

  // GR-1: Golden Joker Expanding Wild Reel Whoosh & Laser Beam
  public goldenJokerExpand() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const vol = this.sfxVol;

      // Deep thunder sub drop
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(300, now);
      sub.frequency.exponentialRampToValueAtTime(55, now + 0.4);
      subGain.gain.setValueAtTime(0.35 * vol, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.5);

      // Cosmic laser riser
      const laser = this.ctx.createOscillator();
      const laserGain = this.ctx.createGain();
      laser.type = 'sawtooth';
      laser.frequency.setValueAtTime(400, now);
      laser.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
      laserGain.gain.setValueAtTime(0.01, now);
      laserGain.gain.linearRampToValueAtTime(0.25 * vol, now + 0.1);
      laserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      laser.connect(laserGain);
      laserGain.connect(this.ctx.destination);
      laser.start(now);
      laser.stop(now + 0.45);

      // Royal jester sparkling chimes
      [1200, 1500, 1800, 2400, 3000].forEach((freq, i) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + 0.15 + i * 0.05);
        g.gain.setValueAtTime(0.18 * vol, now + 0.15 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(now + 0.15 + i * 0.05);
        o.stop(now + 0.55);
      });
    } catch {
      // ignore
    }
  }

  // GR-2 / 6.4: Overdrive Multiplier Surge & VIP Anthem Synthesizer
  public overdriveSurge(multiplier: number = 15) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const vol = this.sfxVol;

      // Heavy 808 Sub Kick
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(45, now + 0.3);
      subGain.gain.setValueAtTime(0.4 * vol, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.45);

      // VIP Anthem Synth Brass Stabs (C - Eb - G - Bb - High C)
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
        gain.gain.linearRampToValueAtTime(0.22 * vol, st + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(st);
        osc.stop(st + 0.4);
      });
    } catch {
      // ignore
    }
  }

  // RH-1: Vault Deposit Coin Clink & Lock sound
  public vaultDepositCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const vol = this.sfxVol;

      // Metallic coin ting
      [2400, 3200, 4100].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);
        gain.gain.setValueAtTime(0.2 * vol, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + i * 0.03 + 0.18);
      });

      // Heavy Vault Lock click
      const lockOsc = this.ctx.createOscillator();
      const lockGain = this.ctx.createGain();
      lockOsc.type = 'square';
      lockOsc.frequency.setValueAtTime(120, now + 0.12);
      lockOsc.frequency.exponentialRampToValueAtTime(40, now + 0.22);
      lockGain.gain.setValueAtTime(0.25 * vol, now + 0.12);
      lockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      lockOsc.connect(lockGain);
      lockGain.connect(this.ctx.destination);
      lockOsc.start(now + 0.12);
      lockOsc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  // GR-5: Progressive Jackpot Teaser Shower
  public jackpotTeaserDrop() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const vol = this.sfxVol;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const st = now + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, st);
        gain.gain.setValueAtTime(0.22 * vol, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(st);
        osc.stop(st + 0.35);
      });
    } catch {
      // ignore
    }
  }

  // RH-2: Tournament Overtake Riser
  public tournamentOvertake() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const vol = this.sfxVol;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.28);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2 * vol, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  // Cascade Drop: 160 Hz Sine
  public cascadeExplode() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

      gain.gain.setValueAtTime(0.3 * this.sfxVol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.12);
    } catch {
      // ignore
    }
  }

  // Energy Ripple Harmonic Shimmer when new symbols drop into columns
  public energyRipple(cascadeCount: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

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
      gain1.gain.linearRampToValueAtTime(0.22 * this.sfxVol, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 0.22);

      gain2.gain.setValueAtTime(0.01, now + 0.04);
      gain2.gain.linearRampToValueAtTime(0.16 * this.sfxVol, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.38);
    } catch {
      // ignore
    }
  }

  // Win Arpeggio
  public winChime(isHigh: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

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

        gain.gain.setValueAtTime(0.25 * this.sfxVol, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.22);
      });
    } catch {
      // ignore
    }
  }

  // Multiplier Riser
  public multiplierUpgrade(multiplier: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = 320 * (1 + (multiplier - 1) * 0.2);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.25);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.sfxVol, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  // Triumphant Orchestral Fanfare for Big Win / Mega Win celebrations
  public orchestralBigWinFanfare(tier: 'big' | 'mega' | 'super' = 'big') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const vol = this.sfxVol;

      // Timpani Drum Roll & Booms
      const timpaniHits = [
        { time: 0.0, freq: 85, vol: 0.4 },
        { time: 0.18, freq: 98, vol: 0.42 },
        { time: 0.36, freq: 110, vol: 0.45 },
        { time: 0.54, freq: 130, vol: 0.55 },
        { time: 0.9, freq: 65, vol: 0.65 },
      ];

      timpaniHits.forEach(({ time, freq, vol: tVol }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + time + 0.28);

        gain.gain.setValueAtTime(tVol * vol, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + time);
        osc.stop(now + time + 0.32);
      });

      // Brass Trumpet Fanfare Lead Arpeggios
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
        gain.gain.linearRampToValueAtTime(0.24 * vol, noteStart + 0.04);
        gain.gain.setValueAtTime(0.2 * vol, noteStart + d * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + d);
      });

      // Orchestral String Choir Chords Progression
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
          gain.gain.linearRampToValueAtTime(0.14 * vol, now + t + 0.08);
          gain.gain.setValueAtTime(0.11 * vol, now + t + d * 0.6);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + d);
        });
      });
    } catch {
      // ignore
    }
  }

  public bigWinFanfare(tier: 'big' | 'mega' | 'super' = 'big') {
    this.orchestralBigWinFanfare(tier);
  }

  public buttonClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.2 * this.sfxVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundEngine();
