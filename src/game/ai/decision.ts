import { DEFAULT_BALANCE_CONFIG } from '../config/balance';
import type { AiDifficultyConfig } from '../config/balance';
import { buildDangerMap } from './dangerMap';
import { CARDINALS, directionToward, manhattan, sameCell, toKey } from './gridMath';
import { computeReachableCells, findSafestReachableCell } from './pathfinding';
import type {
  ActorSnapshot,
  AiDecision,
  BombOpportunity,
  DangerCell,
  GridPosition,
  MatchSnapshot,
  PowerUpSnapshot,
} from './types';

interface TargetOption {
  target: GridPosition;
  reason: AiDecision['reason'];
  score: number;
}

export function computeBotDecision(
  state: MatchSnapshot,
  self: ActorSnapshot,
  difficulty: AiDifficultyConfig,
  canDropBombAtCell: boolean,
  nextBombAllowedAtMs: number,
  rng: () => number,
): { decision: AiDecision; bombOpportunity: BombOpportunity } {
  const dangerMap = buildDangerMap(state);
  const currentDanger = dangerMap.get(toKey(self));
  const shouldEscape = isUrgentDanger(state, currentDanger, difficulty.reactionMs);

  if (shouldEscape) {
    const safeCell =
      findSafestReachableCell(state, self, dangerMap, difficulty.reactionMs) ?? {
        x: self.x,
        y: self.y,
      };
    return {
      decision: {
        direction: directionFromPath(state, self, dangerMap, safeCell, difficulty.reactionMs),
        target: safeCell,
        placeBomb: false,
        reason: 'escape-danger',
      },
      bombOpportunity: { score: 0, cratesHit: 0, opponentsHit: 0, escapeTarget: safeCell },
    };
  }

  const reachable = computeReachableCells(state, self, dangerMap, {
    avoidDangerBeforeMs: difficulty.reactionMs,
    maxDepth: Math.max(8, Math.floor(difficulty.lookaheadMs / 350)),
  });

  const target = pickTarget(state, self, difficulty, dangerMap, reachable.nodes);
  const bombOpportunity = evaluateBombPlacement(state, self, difficulty, dangerMap);
  const canBombNow =
    canDropBombAtCell &&
    self.activeBombs < self.maxBombs &&
    nextBombAllowedAtMs <= state.nowMs &&
    bombOpportunity.escapeTarget !== null &&
    bombOpportunity.score > 0;

  const commitBomb =
    canBombNow &&
    rng() >= difficulty.hesitationChance &&
    bombOpportunity.score >= difficulty.bombing.minCrateValue;

  if (commitBomb) {
    const escapeTarget = bombOpportunity.escapeTarget ?? { x: self.x, y: self.y };
    return {
      decision: {
        direction: directionFromPath(
          state,
          self,
          dangerMap,
          escapeTarget,
          difficulty.reactionMs,
        ),
        target: escapeTarget,
        placeBomb: true,
        reason: bombOpportunity.opponentsHit > 0 ? 'pressure-opponent' : 'clear-crates',
      },
      bombOpportunity,
    };
  }

  return {
    decision: {
      direction: directionFromPath(
        state,
        self,
        dangerMap,
        target.target,
        difficulty.reactionMs,
      ),
      target: target.target,
      placeBomb: false,
      reason: target.reason,
    },
    bombOpportunity,
  };
}

function isUrgentDanger(
  state: MatchSnapshot,
  danger: DangerCell | undefined,
  reactionMs: number,
): boolean {
  if (!danger) {
    return false;
  }
  if (danger.lethalAtMs === null) {
    return false;
  }
  return danger.lethalAtMs <= state.nowMs + reactionMs;
}

function directionFromPath(
  state: MatchSnapshot,
  self: ActorSnapshot,
  dangerMap: Map<string, DangerCell>,
  target: GridPosition,
  reactionMs: number,
): AiDecision['direction'] {
  if (sameCell(self, target)) {
    return 'idle';
  }
  const reachable = computeReachableCells(state, self, dangerMap, {
    avoidDangerBeforeMs: reactionMs,
    maxDepth: 8,
  });
  const path = reachable.getPathTo(target);
  if (path.length < 2) {
    return directionToward(self, target);
  }
  return directionToward(self, path[1]);
}

function pickTarget(
  state: MatchSnapshot,
  self: ActorSnapshot,
  difficulty: AiDifficultyConfig,
  dangerMap: Map<string, DangerCell>,
  reachable: Map<string, { x: number; y: number; cost: number }>,
): TargetOption {
  const options: TargetOption[] = [];

  for (const powerUp of state.powerUps) {
    const node = reachable.get(toKey(powerUp));
    if (!node) {
      continue;
    }
    options.push({
      target: powerUp,
      reason: 'collect-powerup',
      score:
        difficulty.weights.powerupBias * powerupValue(powerUp) -
        node.cost * 0.55 -
        trapPenalty(state, powerUp, difficulty) -
        dangerPenalty(state, dangerMap, powerUp, difficulty),
    });
  }

  for (const actor of state.actors) {
    if (!actor.alive || actor.id === self.id) {
      continue;
    }
    const adjacent = adjacentWalkableCells(state, actor);
    for (const tile of adjacent) {
      const node = reachable.get(toKey(tile));
      if (!node) {
        continue;
      }
      options.push({
        target: tile,
        reason: 'pressure-opponent',
        score:
          difficulty.weights.pressureBias * 2.1 +
          difficulty.weights.chaseBias / Math.max(1, manhattan(self, actor)) -
          node.cost * 0.34 -
          trapPenalty(state, tile, difficulty) -
          dangerPenalty(state, dangerMap, tile, difficulty),
      });
    }
  }

  const center = {
    x: Math.floor(state.arena.width / 2),
    y: Math.floor(state.arena.height / 2),
  };
  const centerNode = reachable.get(toKey(center));
  if (centerNode) {
    options.push({
      target: center,
      reason: 'advance-position',
      score:
        difficulty.weights.centerBias * 2 -
        centerNode.cost * 0.25 -
        trapPenalty(state, center, difficulty) -
        dangerPenalty(state, dangerMap, center, difficulty),
    });
  }

  const crateTargets = findCratePressureTargets(state, self, reachable);
  for (const target of crateTargets) {
    options.push({
      target,
      reason: 'clear-crates',
      score:
        difficulty.weights.crateBias * 1.8 -
        manhattan(self, target) * 0.28 -
        trapPenalty(state, target, difficulty) -
        dangerPenalty(state, dangerMap, target, difficulty),
    });
  }

  if (options.length === 0) {
    return {
      target: { x: self.x, y: self.y },
      reason: 'hold-line',
      score: 0,
    };
  }

  options.sort((a, b) => b.score - a.score);
  return options[0];
}

function powerupValue(powerUp: PowerUpSnapshot): number {
  if (powerUp.kind === 'fire-up') {
    return 2.2;
  }
  if (powerUp.kind === 'extra-bomb') {
    return 2;
  }
  return 1.6;
}

function adjacentWalkableCells(
  state: MatchSnapshot,
  target: GridPosition,
): GridPosition[] {
  const cells: GridPosition[] = [];
  for (const delta of CARDINALS) {
    const x = target.x + delta.x;
    const y = target.y + delta.y;
    if (state.arena.tiles[y]?.[x] === 'floor') {
      cells.push({ x, y });
    }
  }
  return cells;
}

function findCratePressureTargets(
  state: MatchSnapshot,
  self: ActorSnapshot,
  reachable: Map<string, { x: number; y: number; cost: number }>,
): GridPosition[] {
  const targets: GridPosition[] = [];
  for (const node of reachable.values()) {
    if (node.cost === 0 || node.cost > 6) {
      continue;
    }
    const position = { x: node.x, y: node.y };
    const adjacentCrates = CARDINALS.some((delta) => {
      const x = position.x + delta.x;
      const y = position.y + delta.y;
      return state.arena.tiles[y]?.[x] === 'crate';
    });
    if (adjacentCrates && !sameCell(position, self)) {
      targets.push(position);
    }
  }
  return targets;
}

function dangerPenalty(
  state: MatchSnapshot,
  dangerMap: Map<string, DangerCell>,
  position: GridPosition,
  difficulty: AiDifficultyConfig,
): number {
  const danger = dangerMap.get(toKey(position));
  if (!danger || danger.lethalAtMs === null) {
    return 0;
  }
  const timeUntil = Math.max(1, danger.lethalAtMs - state.nowMs);
  return (difficulty.weights.dangerBias * 1000) / timeUntil;
}

function trapPenalty(
  state: MatchSnapshot,
  position: GridPosition,
  difficulty: AiDifficultyConfig,
): number {
  let exits = 0;
  for (const delta of CARDINALS) {
    const x = position.x + delta.x;
    const y = position.y + delta.y;
    if (state.arena.tiles[y]?.[x] === 'floor') {
      exits += 1;
    }
  }

  if (exits >= 3) {
    return 0;
  }

  return (3 - exits) * difficulty.weights.deadEndPenalty;
}

function evaluateBombPlacement(
  state: MatchSnapshot,
  self: ActorSnapshot,
  difficulty: AiDifficultyConfig,
  _dangerMap: Map<string, DangerCell>,
): BombOpportunity {
  let cratesHit = 0;
  let opponentsHit = 0;

  for (const delta of CARDINALS) {
    for (let step = 1; step <= self.blastRange; step += 1) {
      const x = self.x + delta.x * step;
      const y = self.y + delta.y * step;
      const tile = state.arena.tiles[y]?.[x];
      if (!tile || tile === 'wall') {
        break;
      }
      if (tile === 'crate') {
        cratesHit += 1;
        break;
      }
      const threatenedOpponent = state.actors.find(
        (actor) => actor.alive && actor.id !== self.id && actor.x === x && actor.y === y,
      );
      if (threatenedOpponent) {
        opponentsHit += 1;
      }
    }
  }

  const predictedState: MatchSnapshot = {
    ...state,
    bombs: [
      ...state.bombs,
      {
        id: `predicted-${self.id}`,
        ownerId: self.id,
        x: self.x,
        y: self.y,
        fuseMs: DEFAULT_BALANCE_CONFIG.bombs.fuseMs,
        blastRange: self.blastRange,
      },
    ],
  };

  const predictedDanger = buildDangerMap(predictedState);
  const escapeTarget = findBombEscapeTarget(
    predictedState,
    self,
    predictedDanger,
    DEFAULT_BALANCE_CONFIG.bombs.fuseMs,
    difficulty.bombing.escapeBufferMs,
    difficulty.bombing.maxCommitDistance,
  );
  const unsafePlacement = !escapeTarget || sameCell(escapeTarget, self);

  const score =
    cratesHit * difficulty.weights.crateBias +
    opponentsHit * difficulty.bombing.opponentThreatValue +
    (unsafePlacement ? -5 : difficulty.aggression * 0.7);

  return {
    score,
    cratesHit,
    opponentsHit,
    escapeTarget: unsafePlacement ? null : escapeTarget,
  };
}

function findBombEscapeTarget(
  state: MatchSnapshot,
  self: ActorSnapshot,
  dangerMap: Map<string, DangerCell>,
  fuseMs: number,
  bufferMs: number,
  maxDepth: number,
): GridPosition | null {
  const reachable = computeReachableCells(state, self, dangerMap, {
    maxDepth,
  });

  let bestTarget: GridPosition | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const node of reachable.nodes.values()) {
    const danger = dangerMap.get(toKey(node));
    if (danger?.lethalAtMs !== null && danger?.lethalAtMs !== undefined) {
      if (danger.lethalAtMs <= state.nowMs + fuseMs + bufferMs) {
        continue;
      }
    }

    const score =
      (danger?.lethalAtMs ?? state.nowMs + fuseMs + bufferMs + 5000) -
      node.cost * 130 -
      manhattan(self, node) * 24;

    if (score > bestScore) {
      bestScore = score;
      bestTarget = { x: node.x, y: node.y };
    }
  }

  return bestTarget;
}
