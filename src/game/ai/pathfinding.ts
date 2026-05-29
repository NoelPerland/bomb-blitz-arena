import { buildBombBlockers, CARDINALS, isWalkableTile, manhattan, toKey } from './gridMath';
import type {
  ActorSnapshot,
  DangerCell,
  GridPosition,
  MatchSnapshot,
  PathNode,
} from './types';

export interface ReachableOptions {
  avoidDangerBeforeMs?: number;
  maxDepth?: number;
}

export interface ReachableResult {
  nodes: Map<string, PathNode>;
  getPathTo(target: GridPosition): GridPosition[];
}

export function computeReachableCells(
  state: MatchSnapshot,
  self: ActorSnapshot,
  dangerMap: Map<string, DangerCell>,
  options: ReachableOptions = {},
): ReachableResult {
  const nodes = new Map<string, PathNode>();
  const queue: PathNode[] = [{ x: self.x, y: self.y, cost: 0 }];
  const visited = new Set<string>();
  const bombBlockers = buildBombBlockers(state.bombs, self);
  const actorBlockers = new Set(
    state.actors
      .filter((actor) => actor.alive && actor.id !== self.id)
      .map((actor) => toKey(actor)),
  );
  const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = toKey(current);
    if (visited.has(currentKey) || current.cost > maxDepth) {
      continue;
    }

    visited.add(currentKey);
    nodes.set(currentKey, current);

    for (const delta of CARDINALS) {
      const next = {
        x: current.x + delta.x,
        y: current.y + delta.y,
        cost: current.cost + 1,
        previous: currentKey,
      };
      const nextKey = toKey(next);
      if (visited.has(nextKey)) {
        continue;
      }
      if (!isWalkableTile(state.arena, next.x, next.y)) {
        continue;
      }
      if (bombBlockers.has(nextKey) || actorBlockers.has(nextKey)) {
        continue;
      }

      const danger = dangerMap.get(nextKey);
      if (
        options.avoidDangerBeforeMs !== undefined &&
        danger?.lethalAtMs !== null &&
        danger?.lethalAtMs !== undefined &&
        danger.lethalAtMs <= state.nowMs + options.avoidDangerBeforeMs
      ) {
        continue;
      }

      queue.push(next);
    }
  }

  return {
    nodes,
    getPathTo(target: GridPosition): GridPosition[] {
      const path: GridPosition[] = [];
      let cursor = nodes.get(toKey(target));
      while (cursor) {
        path.unshift({ x: cursor.x, y: cursor.y });
        cursor = cursor.previous ? nodes.get(cursor.previous) : undefined;
      }
      return path;
    },
  };
}

export function findSafestReachableCell(
  state: MatchSnapshot,
  self: ActorSnapshot,
  dangerMap: Map<string, DangerCell>,
  reactionWindowMs: number,
): GridPosition | null {
  const reachable = computeReachableCells(state, self, dangerMap, {
    avoidDangerBeforeMs: reactionWindowMs,
    maxDepth: 8,
  });

  let best: GridPosition | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const node of reachable.nodes.values()) {
    const key = toKey(node);
    const danger = dangerMap.get(key);
    const lethalAt = danger?.lethalAtMs ?? null;
    const timeBuffer = lethalAt === null ? 9999 : lethalAt - state.nowMs;
    const score = timeBuffer - node.cost * 120 - manhattan(node, self) * 18;
    if (score > bestScore) {
      bestScore = score;
      best = { x: node.x, y: node.y };
    }
  }

  return best;
}

