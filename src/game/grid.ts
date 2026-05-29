import Phaser from 'phaser';
import { GRID_HEIGHT, GRID_WIDTH, HUD_HEIGHT, TILE_SIZE } from './config';
import type { Direction, GridPosition } from './types';

export const DIRECTION_VECTORS: Record<Exclude<Direction, 'none'>, GridPosition> = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};

export function tileToWorld(col: number, row: number): { x: number; y: number } {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: HUD_HEIGHT + row * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function worldToTile(x: number, y: number): GridPosition {
  return {
    col: Phaser.Math.Clamp(Math.floor(x / TILE_SIZE), 0, GRID_WIDTH - 1),
    row: Phaser.Math.Clamp(Math.floor((y - HUD_HEIGHT) / TILE_SIZE), 0, GRID_HEIGHT - 1),
  };
}

export function isTileAligned(value: number): boolean {
  const remainder = (value - TILE_SIZE / 2) % TILE_SIZE;
  return Math.abs(remainder) < 2 || Math.abs(remainder - TILE_SIZE) < 2;
}

export function isActorCentered(x: number, y: number): boolean {
  return isTileAligned(x) && isTileAligned(y - HUD_HEIGHT);
}

export function snapAxisToGrid(value: number, offset = 0): number {
  const shifted = value - offset - TILE_SIZE / 2;
  return Math.round(shifted / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2 + offset;
}

export function clampWorldX(x: number): number {
  return Phaser.Math.Clamp(x, TILE_SIZE / 2, GRID_WIDTH * TILE_SIZE - TILE_SIZE / 2);
}

export function clampWorldY(y: number): number {
  return Phaser.Math.Clamp(y, HUD_HEIGHT + TILE_SIZE / 2, HUD_HEIGHT + GRID_HEIGHT * TILE_SIZE - TILE_SIZE / 2);
}
