import Phaser from 'phaser';

const MUTE_STORAGE_KEY = 'bomb-blitz-muted';

interface ToneOptions {
  frequency: number;
  durationMs: number;
  type?: OscillatorType;
  volume?: number;
  glideTo?: number;
  delayMs?: number;
}

class ArcadeAudio {
  private muted = false;
  private musicEvent?: Phaser.Time.TimerEvent;
  private musicStep = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMuted(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MUTE_STORAGE_KEY, this.muted ? '1' : '0');
    }
    return this.muted;
  }

  bindUnlock(scene: Phaser.Scene): void {
    const unlock = () => {
      this.getContext(scene)?.resume().catch(() => undefined);
    };

    scene.input.keyboard?.once('keydown', unlock);
    scene.input.once('pointerdown', unlock);
  }

  playMenu(scene: Phaser.Scene): void {
    this.playTone(scene, { frequency: 780, durationMs: 100, type: 'triangle', volume: 0.06, glideTo: 940 });
    this.playTone(scene, { frequency: 1180, durationMs: 70, type: 'sine', volume: 0.02, delayMs: 40 });
  }

  playBomb(scene: Phaser.Scene): void {
    this.playTone(scene, { frequency: 180, durationMs: 130, type: 'square', volume: 0.075, glideTo: 140 });
  }

  playExplosion(scene: Phaser.Scene): void {
    this.playTone(scene, { frequency: 90, durationMs: 220, type: 'sawtooth', volume: 0.09, glideTo: 38 });
    this.playTone(scene, { frequency: 210, durationMs: 180, type: 'triangle', volume: 0.04, glideTo: 120 });
  }

  playBreak(scene: Phaser.Scene): void {
    this.playTone(scene, { frequency: 320, durationMs: 120, type: 'triangle', volume: 0.05, glideTo: 170 });
  }

  playPickup(scene: Phaser.Scene): void {
    this.playTone(scene, { frequency: 520, durationMs: 120, type: 'triangle', volume: 0.045, glideTo: 710 });
    scene.time.delayedCall(75, () => {
      this.playTone(scene, { frequency: 720, durationMs: 90, type: 'triangle', volume: 0.04, glideTo: 880 });
    });
  }

  playEnemyDown(scene: Phaser.Scene): void {
    this.playTone(scene, { frequency: 230, durationMs: 140, type: 'square', volume: 0.05, glideTo: 150 });
  }

  playVictory(scene: Phaser.Scene): void {
    this.playTone(scene, { frequency: 660, durationMs: 140, type: 'triangle', volume: 0.05, glideTo: 880 });
    scene.time.delayedCall(120, () => {
      this.playTone(scene, { frequency: 880, durationMs: 180, type: 'triangle', volume: 0.055, glideTo: 1180 });
    });
  }

  playDefeat(scene: Phaser.Scene): void {
    this.playTone(scene, { frequency: 260, durationMs: 160, type: 'sine', volume: 0.05, glideTo: 180 });
    scene.time.delayedCall(140, () => {
      this.playTone(scene, { frequency: 170, durationMs: 180, type: 'sine', volume: 0.05, glideTo: 110 });
    });
  }

  startTitleMusic(scene: Phaser.Scene): void {
    this.startLoop(
      scene,
      [
        { lead: 392, bass: 196 },
        { lead: 494, bass: 247 },
        { lead: 440, bass: 220 },
        { lead: 587, bass: 294 },
      ],
      340,
    );
  }

  startGameMusic(scene: Phaser.Scene): void {
    this.startLoop(
      scene,
      [
        { lead: 330, bass: 165 },
        { lead: 392, bass: 196 },
        { lead: 440, bass: 220 },
        { lead: 392, bass: 196 },
        { lead: 349, bass: 175 },
        { lead: 392, bass: 196 },
        { lead: 294, bass: 147 },
        { lead: 392, bass: 196 },
      ],
      220,
    );
  }

  stopMusic(): void {
    this.musicEvent?.remove(false);
    this.musicEvent = undefined;
  }

  private startLoop(scene: Phaser.Scene, notes: Array<{ lead: number; bass: number }>, delay: number): void {
    this.stopMusic();
    this.musicStep = 0;
    this.musicEvent = scene.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        const note = notes[this.musicStep % notes.length];
        this.musicStep += 1;
        this.playTone(scene, {
          frequency: note.lead,
          durationMs: delay * 0.68,
          type: 'triangle',
          volume: 0.024,
          glideTo: note.lead * 1.018,
        });
        this.playTone(scene, {
          frequency: note.bass,
          durationMs: delay * 0.56,
          type: 'sine',
          volume: 0.016,
          glideTo: note.bass * 0.995,
          delayMs: 22,
        });
      },
    });
  }

  private playTone(scene: Phaser.Scene, options: ToneOptions): void {
    if (this.muted) {
      return;
    }

    const context = this.getContext(scene);
    if (!context) {
      return;
    }

    const startAt = context.currentTime + 0.005 + (options.delayMs ?? 0) / 1000;
    const endAt = startAt + options.durationMs / 1000;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = options.type ?? 'square';
    oscillator.frequency.setValueAtTime(options.frequency, startAt);
    if (options.glideTo) {
      oscillator.frequency.linearRampToValueAtTime(options.glideTo, endAt);
    }

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(options.volume ?? 0.05, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.02);
  }

  private getContext(scene: Phaser.Scene): AudioContext | null {
    const manager = scene.sound as Phaser.Sound.WebAudioSoundManager | Phaser.Sound.NoAudioSoundManager;
    if ('context' in manager && manager.context) {
      return manager.context;
    }

    return null;
  }
}

export const arcadeAudio = new ArcadeAudio();
