import { CARDINALS, getTile, inBounds, toKey } from './gridMath';
import type { BombSnapshot, DangerCell, MatchSnapshot } from './types';

export function buildDangerMap(state: MatchSnapshot): Map<string, DangerCell> {
  const danger = new Map<string, DangerCell>();
  const detonationTimes = resolveDetonationTimes(state);

  for (const explosion of state.explosions) {
    danger.set(toKey(explosion), {
      lethalAtMs: state.nowMs,
    });
  }

  for (const bomb of state.bombs) {
    const lethalAtMs = detonationTimes.get(bomb.id) ?? state.nowMs + bomb.fuseMs;
    const register = (x: number, y: number) => {
      const key = toKey({ x, y });
      const current = danger.get(key);
      if (!current || current.lethalAtMs === null || lethalAtMs < current.lethalAtMs) {
        danger.set(key, {
          lethalAtMs,
          sourceBombId: bomb.id,
        });
      }
    };

    register(bomb.x, bomb.y);
    for (const delta of CARDINALS) {
      for (let step = 1; step <= bomb.blastRange; step += 1) {
        const x = bomb.x + delta.x * step;
        const y = bomb.y + delta.y * step;
        if (!inBounds(state.arena, x, y)) {
          break;
        }

        const tile = getTile(state.arena, x, y);
        if (tile === 'wall') {
          break;
        }

        register(x, y);
        if (tile === 'crate') {
          break;
        }
      }
    }
  }

  return danger;
}

function resolveDetonationTimes(state: MatchSnapshot): Map<string, number> {
  const detonationTimes = new Map(
    state.bombs.map((bomb) => [bomb.id, state.nowMs + bomb.fuseMs]),
  );

  let changed = true;
  while (changed) {
    changed = false;

    for (const bomb of state.bombs) {
      const sourceDetonation = detonationTimes.get(bomb.id) ?? state.nowMs + bomb.fuseMs;
      const threatenedBombs = findBombsHitByBlast(state, bomb);

      for (const threatenedBomb of threatenedBombs) {
        const current = detonationTimes.get(threatenedBomb.id) ?? state.nowMs + threatenedBomb.fuseMs;
        if (sourceDetonation < current) {
          detonationTimes.set(threatenedBomb.id, sourceDetonation);
          changed = true;
        }
      }
    }
  }

  return detonationTimes;
}

function findBombsHitByBlast(state: MatchSnapshot, source: BombSnapshot): BombSnapshot[] {
  const hits: BombSnapshot[] = [];

  for (const candidate of state.bombs) {
    if (candidate.id === source.id) {
      continue;
    }
    if (candidate.x === source.x && candidate.y === source.y) {
      hits.push(candidate);
    }
  }

  for (const delta of CARDINALS) {
    for (let step = 1; step <= source.blastRange; step += 1) {
      const x = source.x + delta.x * step;
      const y = source.y + delta.y * step;
      if (!inBounds(state.arena, x, y)) {
        break;
      }

      const tile = getTile(state.arena, x, y);
      if (tile === 'wall') {
        break;
      }

      const bombAtCell = state.bombs.find((bomb) => bomb.id !== source.id && bomb.x === x && bomb.y === y);
      if (bombAtCell) {
        hits.push(bombAtCell);
      }

      if (tile === 'crate') {
        break;
      }
    }
  }

  return hits;
}
