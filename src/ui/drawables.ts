import Phaser from 'phaser';
import { PowerupType } from '../game/types';

type Origin = number | { x: number; y: number };

function setImageOrigin(image: Phaser.GameObjects.Image, origin?: Origin): Phaser.GameObjects.Image {
  if (typeof origin === 'number') {
    image.setOrigin(origin);
  } else if (origin) {
    image.setOrigin(origin.x, origin.y);
  }

  return image;
}

function createImage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  texture: string,
  width?: number,
  height?: number,
  origin?: Origin,
): Phaser.GameObjects.Image {
  const image = scene.add.image(x, y, texture);
  if (width !== undefined && height !== undefined) {
    image.setDisplaySize(width, height);
  }
  return setImageOrigin(image, origin);
}

export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  texture = 'panel',
  origin: Origin = 0,
): Phaser.GameObjects.Image {
  return createImage(scene, x, y, texture, width, height, origin);
}

export function drawFloorTile(scene: Phaser.Scene, x: number, y: number, size: number): Phaser.GameObjects.Image {
  return createImage(scene, x, y, 'floorTile', size, size, 0);
}

export function drawWallTile(scene: Phaser.Scene, x: number, y: number, size: number): Phaser.GameObjects.Image {
  return createImage(scene, x, y, 'solidTile', size, size, 0);
}

export function createCrate(scene: Phaser.Scene, x: number, y: number, size: number): Phaser.GameObjects.Image {
  return createImage(scene, x, y, 'crateTile', size, size, 0.5);
}

export function createActor(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tint: number,
  scale = 1,
): Phaser.GameObjects.Container {
  const shadow = scene.add.ellipse(0, 15, 18 * scale, 7 * scale, 0x0b1221, 0.24);
  const body = createImage(scene, 0, -2, 'actor', 34 * scale, 40 * scale, 0.5).setTint(tint);
  const shine = scene.add.circle(-5 * scale, -10 * scale, 4 * scale, 0xffffff, 0.16);
  return scene.add.container(x, y, [shadow, body, shine]);
}

export function createPowerup(scene: Phaser.Scene, x: number, y: number, type: PowerupType): Phaser.GameObjects.Image {
  const texture =
    type === 'extraBomb'
      ? 'powerup-extraBomb'
      : type === 'fireUp'
        ? 'powerup-fireUp'
        : 'powerup-speedUp';
  return createImage(scene, x, y, texture, 28, 28, 0.5);
}

export function createBomb(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Image {
  return createImage(scene, x, y, 'bomb', 32, 32, 0.5);
}

export function createExplosion(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1,
): Phaser.GameObjects.Image {
  return createImage(scene, x, y, 'explosion', 48 * scale, 48 * scale, 0.5);
}
