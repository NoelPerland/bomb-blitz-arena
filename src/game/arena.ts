import { GAME_CONFIG, GRID_HEIGHT, GRID_WIDTH } from './config';
import type { GridPosition, TileType } from './types';

export interface ArenaData {
  tiles: TileType[][];
  spawns: GridPosition[];
}

export function buildArena(random: Phaser.Math.RandomDataGenerator): ArenaData {
  const tiles: TileType[][] = Array.from({ length: GRID_HEIGHT }, () =>
    Array.from({ length: GRID_WIDTH }, () => 'floor' as TileType),
  );

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    for (let col = 0; col < GRID_WIDTH; col += 1) {
      const isBorder = row === 0 || col === 0 || row === GRID_HEIGHT - 1 || col === GRID_WIDTH - 1;
      const isPillar = row % 2 === 0 && col % 2 === 0;

      if (isBorder || isPillar) {
        tiles[row][col] = 'solid';
      }
    }
  }

  const spawns: GridPosition[] = [
    { col: 1, row: 1 },
    { col: GRID_WIDTH - 2, row: 1 },
    { col: 1, row: GRID_HEIGHT - 2 },
    { col: GRID_WIDTH - 2, row: GRID_HEIGHT - 2 },
  ];

  const safeTiles = new Set<string>();
  for (const spawn of spawns) {
    markSafePocket(safeTiles, spawn);
  }

  for (let row = 1; row < GRID_HEIGHT - 1; row += 1) {
    for (let col = 1; col < GRID_WIDTH - 1; col += 1) {
      if (tiles[row][col] !== 'floor') {
        continue;
      }

      if (safeTiles.has(key(col, row))) {
        continue;
      }

      if (random.frac() < GAME_CONFIG.arena.crateFillChance) {
        tiles[row][col] = 'crate';
      }
    }
  }

  return { tiles, spawns };
}

function markSafePocket(safeTiles: Set<string>, spawn: GridPosition): void {
  safeTiles.add(key(spawn.col, spawn.row));

  const horizontalDirection = spawn.col <= GRID_WIDTH / 2 ? 1 : -1;
  const verticalDirection = spawn.row <= GRID_HEIGHT / 2 ? 1 : -1;

  for (let step = 1; step <= GAME_CONFIG.arena.safePocketRadius; step += 1) {
    const horizontalCol = spawn.col + horizontalDirection * step;
    if (horizontalCol > 0 && horizontalCol < GRID_WIDTH - 1) {
      safeTiles.add(key(horizontalCol, spawn.row));
    }

    const verticalRow = spawn.row + verticalDirection * step;
    if (verticalRow > 0 && verticalRow < GRID_HEIGHT - 1) {
      safeTiles.add(key(spawn.col, verticalRow));
    }
  }
}

export function key(col: number, row: number): string {
  return `${col},${row}`;
}
