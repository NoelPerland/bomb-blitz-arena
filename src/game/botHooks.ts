import { EnemyAiController } from './ai/EnemyAiController';
import type { PowerUpKind } from './config/balance';
import type { ActorState, BombState, Direction, ExplosionTile, PowerupState, TileType } from './types';

export interface BotIntent {
  direction: Direction;
  placeBomb: boolean;
  reason?: string;
}

export interface RuntimeBombState extends BombState {
  fuseMs: number;
}

export interface RuntimeExplosionTile extends ExplosionTile {
  remainingMs: number;
}

export interface BotRuntimeState {
  nowMs: number;
  arenaTiles: TileType[][];
  actors: ActorState[];
  bombs: RuntimeBombState[];
  explosions: RuntimeExplosionTile[];
  powerups: PowerupState[];
}

type PersonalityKey = 'cautious' | 'balanced' | 'aggressive';

const BOT_PERSONALITIES: Record<string, PersonalityKey> = {
  'bot-1': 'cautious',
  'bot-2': 'balanced',
  'bot-3': 'aggressive',
};

export class BotDirector {
  private readonly controllers = new Map<string, EnemyAiController>();

  constructor(private readonly rng: () => number = Math.random) {}

  resolveIntent(botId: string, state: BotRuntimeState): BotIntent {
    const actor = state.actors.find((entry) => entry.id === botId && entry.alive);
    if (!actor) {
      return { direction: 'none', placeBomb: false };
    }

    const controller = this.getController(botId);
    const decision = controller.decide(toAiSnapshot(state), {
      id: actor.id,
      x: actor.col,
      y: actor.row,
      alive: actor.alive,
      maxBombs: actor.stats.bombLimit,
      activeBombs: actor.activeBombs,
      blastRange: actor.stats.blastRange,
      speed: actor.stats.moveSpeed,
    });

    return {
      direction: decision.direction === 'idle' ? 'none' : decision.direction,
      placeBomb: decision.placeBomb,
      reason: decision.reason,
    };
  }

  private getController(botId: string): EnemyAiController {
    const existing = this.controllers.get(botId);
    if (existing) {
      return existing;
    }

    const personality = BOT_PERSONALITIES[botId] ?? 'balanced';
    const controller = new EnemyAiController(personality, this.rng);
    this.controllers.set(botId, controller);
    return controller;
  }
}

export function createBotDirector(rng?: () => number): BotDirector {
  return new BotDirector(rng);
}

function toAiSnapshot(state: BotRuntimeState) {
  return {
    nowMs: state.nowMs,
    arena: {
      width: state.arenaTiles[0]?.length ?? 0,
      height: state.arenaTiles.length,
      tiles: state.arenaTiles.map((row) =>
        row.map((tile) => {
          if (tile === 'solid') {
            return 'wall';
          }
          return tile;
        }),
      ),
    },
    actors: state.actors.map((actor) => ({
      id: actor.id,
      x: actor.col,
      y: actor.row,
      alive: actor.alive,
      maxBombs: actor.stats.bombLimit,
      activeBombs: actor.activeBombs,
      blastRange: actor.stats.blastRange,
      speed: actor.stats.moveSpeed,
    })),
    bombs: state.bombs.map((bomb) => ({
      id: bomb.id,
      ownerId: bomb.ownerId,
      x: bomb.col,
      y: bomb.row,
      fuseMs: bomb.fuseMs,
      blastRange: bomb.blastRange,
    })),
    explosions: state.explosions.map((tile) => ({
      x: tile.col,
      y: tile.row,
      remainingMs: tile.remainingMs,
    })),
    powerUps: state.powerups.map((powerup) => ({
      id: powerup.id,
      x: powerup.col,
      y: powerup.row,
      kind: toAiPowerUp(powerup.type),
    })),
  };
}

function toAiPowerUp(type: PowerupState['type']): PowerUpKind {
  switch (type) {
    case 'extraBomb':
      return 'extra-bomb';
    case 'fireUp':
      return 'fire-up';
    case 'speedUp':
      return 'speed-up';
  }
}
