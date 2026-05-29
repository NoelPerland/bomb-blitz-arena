import type {
  ActorSnapshot,
  ArenaSnapshot,
  BombSnapshot,
  Direction,
  GridPosition,
  TileType,
} from './types';

export const CARDINALS: ReadonlyArray<GridPosition> = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

export function toKey(position: GridPosition): string {
  return `${position.x},${position.y}`;
}

export function manhattan(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function sameCell(a: GridPosition, b: GridPosition): boolean {
  return a.x === b.x && a.y === b.y;
}

export function inBounds(arena: ArenaSnapshot, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < arena.width && y < arena.height;
}

export function getTile(arena: ArenaSnapshot, x: number, y: number): TileType {
  return arena.tiles[y]?.[x] ?? 'wall';
}

export function isHardBlocked(arena: ArenaSnapshot, x: number, y: number): boolean {
  return !inBounds(arena, x, y) || getTile(arena, x, y) === 'wall';
}

export function isWalkableTile(arena: ArenaSnapshot, x: number, y: number): boolean {
  return inBounds(arena, x, y) && getTile(arena, x, y) === 'floor';
}

export function directionToward(from: GridPosition, to: GridPosition): Direction {
  if (to.x > from.x) {
    return 'right';
  }
  if (to.x < from.x) {
    return 'left';
  }
  if (to.y > from.y) {
    return 'down';
  }
  if (to.y < from.y) {
    return 'up';
  }
  return 'idle';
}

export function buildBombBlockers(
  bombs: BombSnapshot[],
  self: ActorSnapshot,
): Set<string> {
  const blockers = new Set<string>();
  for (const bomb of bombs) {
    if (bomb.ownerId === self.id && bomb.x === self.x && bomb.y === self.y) {
      continue;
    }
    blockers.add(toKey(bomb));
  }
  return blockers;
}

