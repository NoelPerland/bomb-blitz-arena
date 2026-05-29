import type { AiDifficultyConfig } from '../config/balance';
import { DEFAULT_BALANCE_CONFIG } from '../config/balance';
import { buildDangerMap } from './dangerMap';
import { computeBotDecision } from './decision';
import { toKey } from './gridMath';
import type {
  ActorSnapshot,
  AiDecision,
  AiPersonality,
  MatchSnapshot,
} from './types';

const PERSONALITIES: Record<AiPersonality['key'], AiPersonality> = {
  cautious: {
    key: 'cautious',
    label: 'Careful Collector',
    config: DEFAULT_BALANCE_CONFIG.ai.cautious,
  },
  balanced: {
    key: 'balanced',
    label: 'Arena Tactician',
    config: DEFAULT_BALANCE_CONFIG.ai.balanced,
  },
  aggressive: {
    key: 'aggressive',
    label: 'Corner Hunter',
    config: DEFAULT_BALANCE_CONFIG.ai.aggressive,
  },
};

export class EnemyAiController {
  readonly personality: AiPersonality;
  private nextDecisionAtMs = 0;
  private nextBombAllowedAtMs = 0;
  private lastDecision: AiDecision = {
    direction: 'idle',
    target: { x: 0, y: 0 },
    placeBomb: false,
    reason: 'hold-line',
  };

  constructor(
    personalityKey: AiPersonality['key'],
    private readonly rng: () => number = Math.random,
  ) {
    this.personality = PERSONALITIES[personalityKey];
  }

  get config(): AiDifficultyConfig {
    return this.personality.config;
  }

  decide(state: MatchSnapshot, self: ActorSnapshot): AiDecision {
    if (!self.alive) {
      return {
        direction: 'idle',
        target: { x: self.x, y: self.y },
        placeBomb: false,
        reason: 'hold-line',
      };
    }

    if (state.nowMs < this.nextDecisionAtMs && !isUrgentDanger(state, self, this.personality.config.reactionMs)) {
      return {
        ...this.lastDecision,
        placeBomb: false,
      };
    }

    const canDropBombAtCell = !state.bombs.some((bomb) => bomb.x === self.x && bomb.y === self.y);
    const { decision, bombOpportunity } = computeBotDecision(
      state,
      self,
      this.personality.config,
      canDropBombAtCell,
      this.nextBombAllowedAtMs,
      this.rng,
    );

    if (decision.placeBomb) {
      this.nextBombAllowedAtMs =
        state.nowMs +
        this.personality.config.bombing.baseCooldownMs +
        Math.max(0, 2 - bombOpportunity.cratesHit) * 90;
    }

    this.nextDecisionAtMs = state.nowMs + this.personality.config.repathIntervalMs;
    this.lastDecision = {
      ...decision,
      placeBomb: false,
    };
    return decision;
  }
}

export function createDefaultEnemyControllers(): EnemyAiController[] {
  return [
    new EnemyAiController('cautious'),
    new EnemyAiController('balanced'),
    new EnemyAiController('aggressive'),
  ];
}

function isUrgentDanger(
  state: MatchSnapshot,
  self: ActorSnapshot,
  reactionMs: number,
): boolean {
  const danger = buildDangerMap(state).get(toKey(self));
  if (!danger || danger.lethalAtMs === null) {
    return false;
  }

  return danger.lethalAtMs <= state.nowMs + reactionMs;
}
