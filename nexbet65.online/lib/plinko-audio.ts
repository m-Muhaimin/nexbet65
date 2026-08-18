/**
 * WebAudio sound engine for Plinko. Ported from Plinko-V1 src/lib/sounds.ts.
 * Lazily creates an AudioContext on first play (must follow a user gesture).
 *
 * Every public method is wrapped so audio failures (autoplay policy, missing
 * AudioContext, etc.) can NEVER interrupt the game flow.
 */
class PlinkoSoundEngine {
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

  /** Short descending "pop" as the ball pings off a peg. */
  playTick(pitch: number = 1) {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400 * pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50 * pitch, this.ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.1, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      /* never block gameplay */
    }
  }

  /** Rising chime when the ball lands — pitch scales with the multiplier. */
  playWin(multiplier: number) {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;

      const frequency = 400 + Math.min(multiplier * 50, 1000);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, this.ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.2, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
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

export const plinkoSound = new PlinkoSoundEngine();
