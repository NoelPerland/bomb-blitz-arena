import { DEFAULT_BALANCE_CONFIG } from './config/balance';

export const TILE_SIZE = 48;
export const GRID_WIDTH = DEFAULT_BALANCE_CONFIG.arena.width;
export const GRID_HEIGHT = DEFAULT_BALANCE_CONFIG.arena.height;
export const HUD_HEIGHT = 72;

const powerUpWeightTotal =
  DEFAULT_BALANCE_CONFIG.powerUps.extraBombWeight +
  DEFAULT_BALANCE_CONFIG.powerUps.fireUpWeight +
  DEFAULT_BALANCE_CONFIG.powerUps.speedUpWeight;

export const GAME_CONFIG = {
  arena: {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    tileSize: TILE_SIZE,
    safePocketRadius: DEFAULT_BALANCE_CONFIG.arena.safeSpawnRadius,
    crateFillChance: DEFAULT_BALANCE_CONFIG.arena.crateFillRate,
  },
  player: {
    baseMoveSpeed: DEFAULT_BALANCE_CONFIG.movement.playerSpeed,
    speedPickupBonus: DEFAULT_BALANCE_CONFIG.movement.speedUpStep,
    maxMoveSpeed:
      DEFAULT_BALANCE_CONFIG.movement.playerSpeed +
      DEFAULT_BALANCE_CONFIG.movement.speedUpStep * DEFAULT_BALANCE_CONFIG.movement.maxSpeedUps,
    initialBombLimit: DEFAULT_BALANCE_CONFIG.bombs.initialBombCapacity,
    initialBlastRange: DEFAULT_BALANCE_CONFIG.bombs.initialBlastRange,
    bombCollisionGraceMs: 220,
  },
  enemy: {
    baseMoveSpeed: DEFAULT_BALANCE_CONFIG.movement.enemyBaseSpeed,
    maxMoveSpeed:
      DEFAULT_BALANCE_CONFIG.movement.enemyBaseSpeed +
      DEFAULT_BALANCE_CONFIG.movement.speedUpStep * DEFAULT_BALANCE_CONFIG.movement.maxSpeedUps,
    baseBombLimit: DEFAULT_BALANCE_CONFIG.bombs.initialBombCapacity,
    baseBlastRange: DEFAULT_BALANCE_CONFIG.bombs.initialBlastRange,
  },
  bomb: {
    fuseMs: DEFAULT_BALANCE_CONFIG.bombs.fuseMs,
    explosionDurationMs: DEFAULT_BALANCE_CONFIG.bombs.explosionDurationMs,
  },
  powerups: {
    dropChance: DEFAULT_BALANCE_CONFIG.powerUps.overallDropRate,
    weights: {
      extraBomb: DEFAULT_BALANCE_CONFIG.powerUps.extraBombWeight / powerUpWeightTotal,
      fireUp: DEFAULT_BALANCE_CONFIG.powerUps.fireUpWeight / powerUpWeightTotal,
      speedUp: DEFAULT_BALANCE_CONFIG.powerUps.speedUpWeight / powerUpWeightTotal,
    },
  },
  ai: DEFAULT_BALANCE_CONFIG.ai,
  round: {
    resultDelayMs: 900,
  },
} as const;

export const GAME_WIDTH = GRID_WIDTH * TILE_SIZE;
export const GAME_HEIGHT = GRID_HEIGHT * TILE_SIZE + HUD_HEIGHT;
