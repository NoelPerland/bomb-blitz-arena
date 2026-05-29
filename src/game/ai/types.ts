import type { AiDifficultyConfig, PowerUpKind } from '../config/balance';

export type TileType = 'floor' | 'wall' | 'crate';
export type Direction = 'up' | 'down' | 'left' | 'right' | 'idle';

export interface GridPosition {
  x: number;
  y: number;
}

export interface ArenaTile extends GridPosition {
  type: TileType;
}

export interface ActorSnapshot extends GridPosition {
  id: string;
  alive: boolean;
  maxBombs: number;
  activeBombs: number;
  blastRange: number;
  speed: number;
  shielded?: boolean;
}

export interface BombSnapshot extends GridPosition {
  id: string;
  ownerId: string;
  fuseMs: number;
  blastRange: number;
}

export interface ExplosionSnapshot extends GridPosition {
  remainingMs: number;
}

export interface PowerUpSnapshot extends GridPosition {
  id: string;
  kind: PowerUpKind;
}

export interface ArenaSnapshot {
  width: number;
  height: number;
  tiles: TileType[][];
}

export interface MatchSnapshot {
  nowMs: number;
  arena: ArenaSnapshot;
  actors: ActorSnapshot[];
  bombs: BombSnapshot[];
  explosions: ExplosionSnapshot[];
  powerUps: PowerUpSnapshot[];
}

export interface AiPersonality {
  key: 'cautious' | 'balanced' | 'aggressive';
  label: string;
  config: AiDifficultyConfig;
}

export interface AiDecision {
  direction: Direction;
  target: GridPosition;
  placeBomb: boolean;
  reason:
    | 'escape-danger'
    | 'collect-powerup'
    | 'pressure-opponent'
    | 'clear-crates'
    | 'advance-position'
    | 'hold-line';
}

export interface DangerCell {
  lethalAtMs: number | null;
  sourceBombId?: string;
}

export interface PathNode {
  x: number;
  y: number;
  cost: number;
  previous?: string;
}

export interface BombOpportunity {
  score: number;
  cratesHit: number;
  opponentsHit: number;
  escapeTarget: GridPosition | null;
}

