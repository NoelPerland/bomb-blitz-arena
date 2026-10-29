import Phaser from 'phaser';
import { createGeneratedAssets } from '../../assets/createGeneratedAssets';
import { arcadeAudio } from '../../audio/ArcadeAudio';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.image('hero-art', 'art/bomb-blitz-hero.png');
  }
  create(): void {
    this.cameras.main.setBackgroundColor('#16365d');
    createGeneratedAssets(this);
    arcadeAudio.bindUnlock(this);
    this.registry.set('presentationPipeline', 'generated-textures');
    this.scene.start('title');
  }
}
