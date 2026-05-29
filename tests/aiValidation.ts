import assert from 'node:assert/strict';

import { DEFAULT_BALANCE_CONFIG } from '../src/game/config/balance';
import { EnemyAiController } from '../src/game/ai/EnemyAiController';
import type { MatchSnapshot, TileType } from '../src/game/ai/types';

function buildArena(layout: string[]): TileType[][] {
  return layout.map((row) =>
    row.split('').map((cell) => {
      if (cell === '#') {
        return 'wall';
      }
      if (cell === '*') {
        return 'crate';
      }
      return 'floor';
    }),
  );
}

function createState(layout: string[]): MatchSnapshot {
  const tiles = buildArena(layout);
  return {
    nowMs: 0,
    arena: {
      width: tiles[0].length,
      height: tiles.length,
      tiles,
    },
    actors: [],
    bombs: [],
    explosions: [],
    powerUps: [],
  };
}

function runEscapeValidation(): void {
  const state = createState([
    '#######',
    '#.....#',
    '#.....#',
    '#.....#',
    '#######',
  ]);

  state.actors = [
    {
      id: 'bot-a',
      x: 3,
      y: 2,
      alive: true,
      maxBombs: DEFAULT_BALANCE_CONFIG.bombs.initialBombCapacity,
      activeBombs: 0,
      blastRange: 2,
      speed: DEFAULT_BALANCE_CONFIG.movement.enemyBaseSpeed,
    },
  ];
  state.bombs = [
    {
      id: 'bomb-1',
      ownerId: 'enemy',
      x: 3,
      y: 1,
      fuseMs: 80,
      blastRange: 2,
    },
  ];

  const ai = new EnemyAiController('balanced', () => 0.5);
  const decision = ai.decide(state, state.actors[0]);
  assert.notEqual(decision.direction, 'idle');
  assert.equal(decision.placeBomb, false);
  assert.equal(decision.reason, 'escape-danger');
}

function runPowerupValidation(): void {
  const state = createState([
    '#######',
    '#.....#',
    '#.....#',
    '#.....#',
    '#######',
  ]);

  state.actors = [
    {
      id: 'bot-b',
      x: 1,
      y: 1,
      alive: true,
      maxBombs: 1,
      activeBombs: 0,
      blastRange: 2,
      speed: 100,
    },
    {
      id: 'player',
      x: 5,
      y: 3,
      alive: true,
      maxBombs: 1,
      activeBombs: 0,
      blastRange: 2,
      speed: 108,
    },
  ];
  state.powerUps = [
    {
      id: 'p1',
      kind: 'fire-up',
      x: 2,
      y: 1,
    },
  ];

  const ai = new EnemyAiController('cautious', () => 0.5);
  const decision = ai.decide(state, state.actors[0]);
  assert.equal(decision.reason, 'collect-powerup');
  assert.equal(decision.direction, 'right');
}

function runSafeBombValidation(): void {
  const state = createState([
    '#######',
    '#.....#',
    '#..*..#',
    '#.....#',
    '#######',
  ]);

  state.actors = [
    {
      id: 'bot-c',
      x: 2,
      y: 2,
      alive: true,
      maxBombs: 1,
      activeBombs: 0,
      blastRange: 2,
      speed: 100,
    },
  ];

  const ai = new EnemyAiController('aggressive', () => 0.95);
  const decision = ai.decide(state, state.actors[0]);
  assert.equal(decision.placeBomb, true);
  assert.equal(decision.reason, 'clear-crates');
}

function runNoSuicideValidation(): void {
  const state = createState([
    '#####',
    '#*.*#',
    '#...#',
    '#*.*#',
    '#####',
  ]);

  state.actors = [
    {
      id: 'bot-d',
      x: 2,
      y: 2,
      alive: true,
      maxBombs: 1,
      activeBombs: 0,
      blastRange: 2,
      speed: 100,
    },
  ];

  const ai = new EnemyAiController('aggressive', () => 0.95);
  const decision = ai.decide(state, state.actors[0]);
  assert.equal(decision.placeBomb, false);
}

function runPressureValidation(): void {
  const state = createState([
    '#######',
    '#.....#',
    '#.....#',
    '#.....#',
    '#######',
  ]);

  state.actors = [
    {
      id: 'bot-e',
      x: 3,
      y: 2,
      alive: true,
      maxBombs: 1,
      activeBombs: 0,
      blastRange: 3,
      speed: 100,
    },
    {
      id: 'player',
      x: 5,
      y: 2,
      alive: true,
      maxBombs: 1,
      activeBombs: 0,
      blastRange: 2,
      speed: 108,
    },
  ];

  const ai = new EnemyAiController('aggressive', () => 0.95);
  const decision = ai.decide(state, state.actors[0]);
  assert.equal(decision.placeBomb, true);
  assert.equal(decision.reason, 'pressure-opponent');
}

runEscapeValidation();
runPowerupValidation();
runSafeBombValidation();
runNoSuicideValidation();
runPressureValidation();

console.log('AI validation passed: escape, loot, bombing, restraint, and pressure behaviors are working.');

