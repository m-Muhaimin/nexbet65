/**
 * WebAudio sound engine for Mines. Ported from mines-v2 src/lib/audio.ts.
 * Lazily creates an AudioContext on first play (must follow a user gesture).
 *
 * Every public method is wrapped so audio failures (autoplay policy, missing
 * AudioContext, etc.) can NEVER interrupt the game flow.
 */
class MinesAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (this.ctx) return;
    const AC =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!AC) return;
    this.ctx = new AC();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.3;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, gain = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(g);
    g.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playGem(multiplierTier: number) {
    try {
      // Rising pitch based on multiplier tier (major pentatonic).
      const pentatonicScale = [0, 2, 4, 7, 9];
      const octave = Math.floor(multiplierTier / pentatonicScale.length);
      const scaleIndex = multiplierTier % pentatonicScale.length;

      const baseFreq = 440;
      const semiTones = octave * 12 + pentatonicScale[scaleIndex];
      const freq = baseFreq * Math.pow(1.05946, semiTones);

      const duration = 0.4 + multiplierTier * 0.02;

      this.playTone(freq, "sine", duration, 0.4);
      this.playTone(freq * 2, "sine", duration * 0.6, 0.15);

      if (multiplierTier > 5) {
        this.playTone(freq * 4, "sine", 0.1, 0.1);
      }
    } catch {
      /* never block gameplay */
    }
  }

  playMine() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;

      // Deep bass impact.
      this.playTone(60, "triangle", 0.8, 1.0);
      this.playTone(40, "sine", 1.0, 1.0);

      // Noise burst for the explosion.
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);

      noiseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start();
    } catch {
      /* never block gameplay */
    }
  }

  playCashout() {
    try {
      // Coin cascade.
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          this.playTone(1000 + Math.random() * 500, "sine", 0.2, 0.3);
        }, i * 50);
      }
    } catch {
      /* never block gameplay */
    }
  }

  playClick() {
    try {
      this.playTone(800, "sine", 0.05, 0.1);
    } catch {
      /* never block gameplay */
    }
  }
}

export const minesAudio = new MinesAudioEngine();
