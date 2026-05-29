import Phaser from 'phaser';
import { PALETTE } from '../game/theme';

function finalizeTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.add.graphics({ x: 0, y: 0 });
  graphics.setVisible(false);
  draw(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

export function createGeneratedAssets(scene: Phaser.Scene): void {
  finalizeTexture(scene, 'panel', 256, 144, (graphics) => {
    graphics.fillStyle(PALETTE.panelShadow, 0.55).fillRoundedRect(10, 12, 232, 116, 24);
    graphics.fillGradientStyle(0x244a76, 0x244a76, PALETTE.panelBg, PALETTE.panelBg, 1);
    graphics.fillRoundedRect(0, 0, 232, 118, 24);
    graphics.lineStyle(6, PALETTE.panelEdge, 1).strokeRoundedRect(3, 3, 226, 112, 22);
    graphics.fillStyle(PALETTE.panelWarm, 0.24).fillRoundedRect(12, 12, 206, 20, 10);
    graphics.fillStyle(0xffffff, 0.08).fillRoundedRect(16, 42, 196, 54, 16);
  });

  finalizeTexture(scene, 'titleCard', 512, 304, (graphics) => {
    graphics.fillStyle(PALETTE.panelShadow, 0.45).fillRoundedRect(18, 18, 476, 244, 30);
    graphics.fillGradientStyle(0x325d8f, 0x325d8f, PALETTE.panelBg, PALETTE.panelBg, 1);
    graphics.fillRoundedRect(0, 0, 476, 246, 30);
    graphics.lineStyle(8, PALETTE.panelWarm, 0.95).strokeRoundedRect(4, 4, 468, 238, 28);
    graphics.lineStyle(3, PALETTE.panelEdge, 0.95).strokeRoundedRect(14, 14, 448, 218, 22);
    graphics.fillStyle(0xffffff, 0.13).fillRoundedRect(18, 18, 430, 26, 12);
    graphics.fillStyle(0x0d1c33, 0.18).fillRoundedRect(22, 58, 424, 150, 24);
  });

  finalizeTexture(scene, 'button', 240, 72, (graphics) => {
    graphics.fillStyle(0x6d2f10, 0.42).fillRoundedRect(10, 10, 208, 44, 22);
    graphics.fillGradientStyle(PALETTE.buttonTop, PALETTE.buttonTop, PALETTE.buttonBottom, PALETTE.buttonBottom, 1);
    graphics.fillRoundedRect(0, 0, 212, 48, 22);
    graphics.fillStyle(0xffffff, 0.28).fillRoundedRect(12, 7, 186, 12, 8);
    graphics.lineStyle(5, PALETTE.buttonEdge, 1).strokeRoundedRect(3, 3, 206, 42, 20);
  });

  finalizeTexture(scene, 'muteButton', 112, 48, (graphics) => {
    graphics.fillStyle(0x0f2340, 0.42).fillRoundedRect(8, 8, 88, 30, 16);
    graphics.fillGradientStyle(0x295883, 0x295883, 0x18355b, 0x18355b, 1);
    graphics.fillRoundedRect(0, 0, 92, 34, 16);
    graphics.lineStyle(4, PALETTE.panelEdge, 1).strokeRoundedRect(2, 2, 88, 30, 15);
    graphics.fillStyle(PALETTE.panelWarm, 0.18).fillRoundedRect(10, 7, 62, 8, 8);
  });

  finalizeTexture(scene, 'hudPanel', 640, 96, (graphics) => {
    graphics.fillStyle(PALETTE.panelShadow, 0.55).fillRoundedRect(12, 12, 604, 56, 20);
    graphics.fillGradientStyle(0x1f4470, 0x1f4470, 0x132947, 0x132947, 1);
    graphics.fillRoundedRect(0, 0, 604, 60, 20);
    graphics.lineStyle(5, 0x74d7ff, 1).strokeRoundedRect(3, 3, 598, 54, 18);
    graphics.fillStyle(PALETTE.panelWarm, 0.16).fillRoundedRect(14, 10, 176, 14, 8);
    graphics.fillStyle(0xffffff, 0.07).fillRoundedRect(206, 10, 372, 14, 8);
  });

  finalizeTexture(scene, 'overlayPanel', 432, 276, (graphics) => {
    graphics.fillStyle(PALETTE.panelShadow, 0.6).fillRoundedRect(16, 18, 376, 214, 26);
    graphics.fillGradientStyle(0x254971, 0x254971, 0x142b4a, 0x142b4a, 1);
    graphics.fillRoundedRect(0, 0, 380, 216, 26);
    graphics.lineStyle(6, PALETTE.panelEdge, 1).strokeRoundedRect(3, 3, 374, 210, 24);
    graphics.fillStyle(PALETTE.panelWarm, 0.2).fillRoundedRect(24, 18, 220, 12, 8);
    graphics.fillStyle(0xffffff, 0.07).fillRoundedRect(24, 48, 332, 116, 20);
  });

  finalizeTexture(scene, 'pedestal', 420, 156, (graphics) => {
    graphics.fillStyle(0x0f2038, 0.36).fillEllipse(186, 112, 284, 46);
    graphics.fillGradientStyle(0x527fb3, 0x527fb3, 0x223c62, 0x223c62, 1);
    graphics.fillRoundedRect(42, 52, 288, 42, 18);
    graphics.lineStyle(5, 0xaedfff, 0.9).strokeRoundedRect(46, 54, 280, 34, 16);
    graphics.fillStyle(PALETTE.panelWarm, 0.22).fillRoundedRect(56, 62, 258, 8, 8);
  });

  finalizeTexture(scene, 'floorTile', 48, 48, (graphics) => {
    graphics.fillStyle(PALETTE.floorLight, 1).fillRect(0, 0, 48, 48);
    graphics.fillStyle(PALETTE.floorDark, 0.45).fillRect(0, 24, 48, 24);
    graphics.fillStyle(0xffffff, 0.12).fillRect(0, 0, 48, 8);
    graphics.lineStyle(2, 0xd49349, 0.35);
    graphics.strokeRect(1, 1, 46, 46);
    graphics.lineBetween(0, 24, 48, 24);
    graphics.lineBetween(24, 0, 24, 48);
  });

  finalizeTexture(scene, 'solidTile', 48, 48, (graphics) => {
    graphics.fillStyle(PALETTE.wallShadow, 1).fillRect(0, 0, 48, 48);
    graphics.fillStyle(PALETTE.wallBase, 1).fillRoundedRect(4, 4, 40, 40, 8);
    graphics.fillStyle(0xffffff, 0.18).fillRoundedRect(8, 8, 28, 10, 6);
    graphics.fillStyle(0x254564, 0.75).fillRoundedRect(12, 24, 24, 12, 5);
    graphics.fillStyle(0x1b334f, 1);
    graphics.fillCircle(14, 14, 2);
    graphics.fillCircle(34, 14, 2);
    graphics.fillCircle(14, 34, 2);
    graphics.fillCircle(34, 34, 2);
  });

  finalizeTexture(scene, 'crateTile', 48, 48, (graphics) => {
    graphics.fillStyle(0x6d3d19, 1).fillRoundedRect(5, 7, 38, 36, 6);
    graphics.fillStyle(PALETTE.crateLight, 1).fillRoundedRect(7, 9, 34, 32, 4);
    graphics.lineStyle(3, PALETTE.crateDark, 1);
    graphics.strokeRoundedRect(7, 9, 34, 32, 4);
    graphics.lineBetween(12, 14, 36, 36);
    graphics.lineBetween(36, 14, 12, 36);
    graphics.fillStyle(0xffffff, 0.18).fillRect(11, 12, 22, 6);
  });

  finalizeTexture(scene, 'bomb', 32, 32, (graphics) => {
    graphics.fillStyle(0x12121c, 0.35).fillEllipse(18, 25, 18, 8);
    graphics.fillStyle(PALETTE.bomb, 1).fillCircle(16, 18, 11);
    graphics.fillStyle(0xffffff, 0.22).fillCircle(12, 14, 4);
    graphics.fillStyle(0x876027, 1).fillRect(14, 4, 4, 6);
    graphics.lineStyle(2, PALETTE.fuse, 1);
    graphics.beginPath();
    graphics.moveTo(16, 4);
    graphics.lineTo(19, 2);
    graphics.lineTo(22, 3);
    graphics.lineTo(25, 7);
    graphics.strokePath();
    graphics.fillStyle(0xffef8b, 1).fillCircle(25, 7, 3);
  });

  finalizeTexture(scene, 'explosion', 48, 48, (graphics) => {
    graphics.fillStyle(PALETTE.flameEdge, 1).fillCircle(24, 24, 19);
    graphics.fillStyle(PALETTE.flameMid, 1).fillCircle(24, 24, 14);
    graphics.fillStyle(PALETTE.flameCore, 1).fillCircle(24, 24, 8);
    graphics.fillTriangle(24, 3, 33, 22, 15, 22);
    graphics.fillTriangle(24, 45, 33, 26, 15, 26);
    graphics.fillTriangle(3, 24, 22, 15, 22, 33);
    graphics.fillTriangle(45, 24, 26, 15, 26, 33);
  });

  finalizeTexture(scene, 'powerup-extraBomb', 28, 28, (graphics) => {
    graphics.fillStyle(0x17365d, 0.2).fillEllipse(14, 22, 18, 8);
    graphics.fillStyle(0x69d1ff, 1).fillRoundedRect(4, 4, 20, 20, 6);
    graphics.fillStyle(0xffffff, 0.22).fillRoundedRect(6, 6, 16, 6, 4);
    graphics.fillStyle(0x083457, 1).fillRect(12, 8, 4, 12);
    graphics.fillRect(8, 12, 12, 4);
  });

  finalizeTexture(scene, 'powerup-fireUp', 28, 28, (graphics) => {
    graphics.fillStyle(0x17365d, 0.2).fillEllipse(14, 22, 18, 8);
    graphics.fillStyle(0xffb14d, 1).fillCircle(14, 15, 10);
    graphics.fillStyle(0xffecb2, 1).fillCircle(14, 14, 5);
    graphics.fillTriangle(14, 3, 20, 16, 8, 16);
  });

  finalizeTexture(scene, 'powerup-speedUp', 28, 28, (graphics) => {
    graphics.fillStyle(0x17365d, 0.2).fillEllipse(14, 22, 18, 8);
    graphics.fillStyle(0x7bffbf, 1).fillRoundedRect(4, 6, 20, 16, 8);
    graphics.fillStyle(0xffffff, 0.18).fillRoundedRect(6, 8, 16, 5, 5);
    graphics.lineStyle(3, 0x17684d, 1);
    graphics.lineBetween(8, 18, 14, 12);
    graphics.lineBetween(14, 12, 20, 18);
  });

  finalizeTexture(scene, 'actor', 34, 40, (graphics) => {
    graphics.fillStyle(0x000000, 0.22).fillEllipse(17, 36, 20, 6);
    graphics.fillStyle(0xffffff, 1).fillRoundedRect(7, 16, 20, 17, 8);
    graphics.fillStyle(0xffffff, 1).fillCircle(17, 12, 10);
    graphics.fillStyle(0x1e2432, 1).fillCircle(14, 11, 1.6);
    graphics.fillCircle(20, 11, 1.6);
    graphics.lineStyle(2, 0x1e2432, 1).lineBetween(13, 16, 21, 16);
    graphics.fillStyle(0xffffff, 0.32).fillCircle(13, 9, 3);
  });

  finalizeTexture(scene, 'spark', 12, 12, (graphics) => {
    graphics.fillStyle(0xfff5c6, 1).fillCircle(6, 6, 4);
    graphics.fillStyle(0xffffff, 0.5).fillCircle(6, 6, 2);
  });

  finalizeTexture(scene, 'sparkleDiamond', 22, 22, (graphics) => {
    graphics.fillStyle(PALETTE.starMint, 0.9);
    graphics.fillPoints(
      [
        new Phaser.Geom.Point(11, 1),
        new Phaser.Geom.Point(18, 11),
        new Phaser.Geom.Point(11, 21),
        new Phaser.Geom.Point(4, 11),
      ],
      true,
    );
    graphics.fillStyle(0xffffff, 0.55);
    graphics.fillPoints(
      [
        new Phaser.Geom.Point(11, 4),
        new Phaser.Geom.Point(15, 11),
        new Phaser.Geom.Point(11, 18),
        new Phaser.Geom.Point(7, 11),
      ],
      true,
    );
  });
}
