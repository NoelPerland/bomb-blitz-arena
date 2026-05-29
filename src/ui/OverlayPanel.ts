import Phaser from 'phaser';
import { TEXT_STYLES } from '../game/theme';
import { drawPanel } from './drawables';

export class OverlayPanel extends Phaser.GameObjects.Container {
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly accent: Phaser.GameObjects.Rectangle;
  private readonly footerText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const backdrop = scene.add.rectangle(0, 0, 624, 600, 0x08111f, 0.45).setOrigin(0.5);
    backdrop.setInteractive();
    const panel = drawPanel(scene, 0, 0, 380, 216, 'overlayPanel', 0.5);
    this.accent = scene.add.rectangle(0, -66, 232, 10, 0xffd86f).setOrigin(0.5);
    this.titleText = scene.add.text(0, -36, '', TEXT_STYLES.overlayTitle).setOrigin(0.5);
    this.bodyText = scene.add
      .text(0, 16, '', {
        ...TEXT_STYLES.overlayBody,
        wordWrap: { width: 286 },
        lineSpacing: 6,
      })
      .setOrigin(0.5);
    this.footerText = scene.add
      .text(0, 76, 'R or Enter restarts  |  Esc returns to title', {
        ...TEXT_STYLES.hudLabel,
        fontSize: '13px',
        color: '#ffe9ad',
      })
      .setOrigin(0.5);

    this.add([backdrop, panel, this.accent, this.titleText, this.bodyText, this.footerText]);
    this.setVisible(false);
    scene.add.existing(this);
  }

  show(title: string, body: string, accentColor: number): void {
    this.titleText.setText(title);
    this.bodyText.setText(body);
    this.accent.setFillStyle(accentColor, 1);
    this.setVisible(true);
    this.setAlpha(0);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 180,
      ease: 'Quad.Out',
    });
  }

  hide(): void {
    this.setVisible(false);
  }
}
