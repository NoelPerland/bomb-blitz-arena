import Phaser from 'phaser';
import { arcadeAudio } from '../audio/ArcadeAudio';
import { TEXT_STYLES } from '../game/theme';
import { drawPanel } from './drawables';

export class MuteToggle extends Phaser.GameObjects.Container {
  private label: Phaser.GameObjects.Text;
  private background: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.setName('mute-toggle');

    this.background = drawPanel(scene, 0, 0, 92, 34, 'muteButton', 0.5);
    this.label = scene.add.text(0, 0, this.getLabel(), {
      ...TEXT_STYLES.hudLabel,
      fontSize: '13px',
      color: '#fffdf0',
    });
    this.label.setOrigin(0.5);
    this.label.setShadow(0, 1, '#13243f', 2, false, true);

    this.add([this.background, this.label]);
    this.setSize(92, 34);
    this.setInteractive(new Phaser.Geom.Rectangle(-46, -17, 92, 34), Phaser.Geom.Rectangle.Contains);

    this.on('pointerover', () => {
      this.setScale(1.04);
      arcadeAudio.playMenu(scene);
    });

    this.on('pointerout', () => this.setScale(1));
    this.on('pointerdown', () => {
      arcadeAudio.toggleMuted();
      this.label.setText(this.getLabel());
      this.setAlpha(arcadeAudio.isMuted() ? 0.8 : 1);
      arcadeAudio.playMenu(scene);
    });

    this.setAlpha(arcadeAudio.isMuted() ? 0.8 : 1);
    scene.add.existing(this);
  }

  private getLabel(): string {
    return arcadeAudio.isMuted() ? 'MUTED' : 'AUDIO ON';
  }
}
