export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export type TileType = 'floor' | 'solid' | 'crate';

export type PowerupType = 'extraBomb' | 'fireUp' | 'speedUp';

export interface GridPosition {
  col: number;
  row: number;
}

export interface ActorStats {
  bombLimit: number;
  blastRange: number;
  moveSpeed: number;
}

export interface ActorState extends GridPosition {
  id: string;
  name: string;
  tint: number;
  isHuman: boolean;
  alive: boolean;
  stats: ActorStats;
  activeBombs: number;
}

export interface BombState extends GridPosition {
  id: string;
  ownerId: string;
  blastRange: number;
}

export interface PowerupState extends GridPosition {
  id: string;
  type: PowerupType;
}

export interface ExplosionTile extends GridPosition {
  stop: boolean;
}

export interface RoundOutcome {
  winnerId: string | null;
  winnerName: string;
  playerWon: boolean;
}
