import Phaser from 'phaser';
import { TEXT_STYLES } from '../game/theme';

export class OverlayPanel extends Phaser.GameObjects.Container {
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly accent: Phaser.GameObjects.Rectangle;
  private readonly footerText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const backdrop = scene.add.rectangle(0, 0, 624, 600, 0x08111f, 0.45).setOrigin(0.5);
    backdrop.setInteractive();
    const panel = scene.add.rectangle(0, 0, 420, 260, 0x15394f, 0.98).setStrokeStyle(3, 0x8ff1cb);
    this.accent = scene.add.rectangle(0, -96, 232, 8, 0xffd86f).setOrigin(0.5);
    this.titleText = scene.add.text(0, -56, '', TEXT_STYLES.overlayTitle).setOrigin(0.5);
    this.bodyText = scene.add
      .text(0, 16, '', {
        ...TEXT_STYLES.overlayBody,
        wordWrap: { width: 286 },
        lineSpacing: 6,
      })
      .setOrigin(0.5);
    this.footerText = scene.add
      .text(-86, 86, 'PLAY AGAIN', {
        ...TEXT_STYLES.hudLabel,
        fontSize: '16px',
        color: '#ffe9ad',
        backgroundColor: '#356e72',
        padding: { x: 12, y: 10 },
      })
      .setOrigin(0.5);
    this.footerText.setInteractive({ useHandCursor: true }).on('pointerup', () => scene.scene.restart());
    const menu = scene.add.text(103, 86, 'MENU', { ...TEXT_STYLES.hudLabel, fontSize: '16px', color: '#ffe9ad', backgroundColor: '#356e72', padding: { x: 18, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerup', () => scene.scene.start('title'));

    this.add([backdrop, panel, this.accent, this.titleText, this.bodyText, this.footerText, menu]);
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
