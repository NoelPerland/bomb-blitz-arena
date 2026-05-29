import Phaser from 'phaser';
import { TILE_SIZE } from '../config';

export class ActorAvatar extends Phaser.GameObjects.Container {
  private readonly bodyShape: Phaser.GameObjects.Rectangle;
  private readonly faceShape: Phaser.GameObjects.Rectangle;
  private readonly crownShape?: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, tint: number, crown = false) {
    super(scene, x, y);

    this.bodyShape = scene.add.rectangle(0, 4, TILE_SIZE * 0.56, TILE_SIZE * 0.58, tint, 1);
    this.bodyShape.setStrokeStyle(3, 0x1d1932, 1);

    this.faceShape = scene.add.rectangle(0, -6, TILE_SIZE * 0.4, TILE_SIZE * 0.22, 0xf8f4e6, 1);
    this.faceShape.setStrokeStyle(2, 0x1d1932, 1);

    if (crown) {
      this.crownShape = scene.add.rectangle(0, -18, TILE_SIZE * 0.3, TILE_SIZE * 0.14, 0xffe16d, 1);
      this.crownShape.setStrokeStyle(2, 0x6c4b1e, 1);
      this.add(this.crownShape);
    }

    this.add([this.bodyShape, this.faceShape]);
    this.setDepth(20);
    scene.add.existing(this);
  }

  setAlive(alive: boolean): void {
    this.setAlpha(alive ? 1 : 0.28);
    this.setScale(alive ? 1 : 0.85);
  }
}
