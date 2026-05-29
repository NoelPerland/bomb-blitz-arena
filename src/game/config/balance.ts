export type PowerUpKind = 'extra-bomb' | 'fire-up' | 'speed-up';

export interface ArenaBalanceConfig {
  width: number;
  height: number;
  crateFillRate: number;
  safeSpawnRadius: number;
}

export interface BombBalanceConfig {
  fuseMs: number;
  explosionDurationMs: number;
  initialBlastRange: number;
  initialBombCapacity: number;
  chainReactionWindowMs: number;
}

export interface MovementBalanceConfig {
  playerSpeed: number;
  enemyBaseSpeed: number;
  speedUpStep: number;
  maxSpeedUps: number;
}

export interface PowerUpDropConfig {
  overallDropRate: number;
  extraBombWeight: number;
  fireUpWeight: number;
  speedUpWeight: number;
}

export interface AiWeightsConfig {
  powerupBias: number;
  centerBias: number;
  crateBias: number;
  pressureBias: number;
  chaseBias: number;
  dangerBias: number;
  deadEndPenalty: number;
}

export interface AiBombingConfig {
  baseCooldownMs: number;
  escapeBufferMs: number;
  maxCommitDistance: number;
  minCrateValue: number;
  opponentThreatValue: number;
}

export interface AiDifficultyConfig {
  reactionMs: number;
  lookaheadMs: number;
  repathIntervalMs: number;
  hesitationChance: number;
  aggression: number;
  greed: number;
  bravery: number;
  weights: AiWeightsConfig;
  bombing: AiBombingConfig;
}

export interface AudioBalanceConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export interface GameBalanceConfig {
  arena: ArenaBalanceConfig;
  bombs: BombBalanceConfig;
  movement: MovementBalanceConfig;
  powerUps: PowerUpDropConfig;
  ai: {
    cautious: AiDifficultyConfig;
    balanced: AiDifficultyConfig;
    aggressive: AiDifficultyConfig;
  };
  audio: AudioBalanceConfig;
}

const sharedWeights: AiWeightsConfig = {
  powerupBias: 1.25,
  centerBias: 0.45,
  crateBias: 1.1,
  pressureBias: 1.35,
  chaseBias: 0.8,
  dangerBias: 3.5,
  deadEndPenalty: 0.95,
};

export const DEFAULT_BALANCE_CONFIG: GameBalanceConfig = {
  arena: {
    width: 13,
    height: 11,
    crateFillRate: 0.62,
    safeSpawnRadius: 2,
  },
  bombs: {
    fuseMs: 2200,
    explosionDurationMs: 550,
    initialBlastRange: 2,
    initialBombCapacity: 1,
    chainReactionWindowMs: 100,
  },
  movement: {
    playerSpeed: 108,
    enemyBaseSpeed: 100,
    speedUpStep: 10,
    maxSpeedUps: 4,
  },
  powerUps: {
    overallDropRate: 0.33,
    extraBombWeight: 1.05,
    fireUpWeight: 1.1,
    speedUpWeight: 0.85,
  },
  ai: {
    cautious: {
      reactionMs: 140,
      lookaheadMs: 2800,
      repathIntervalMs: 140,
      hesitationChance: 0.06,
      aggression: 0.56,
      greed: 0.78,
      bravery: 0.38,
      weights: {
        ...sharedWeights,
        powerupBias: 1.45,
        pressureBias: 0.9,
        dangerBias: 4.4,
      },
      bombing: {
        baseCooldownMs: 1200,
        escapeBufferMs: 360,
        maxCommitDistance: 5,
        minCrateValue: 1,
        opponentThreatValue: 1.3,
      },
    },
    balanced: {
      reactionMs: 110,
      lookaheadMs: 3000,
      repathIntervalMs: 110,
      hesitationChance: 0.04,
      aggression: 0.74,
      greed: 0.68,
      bravery: 0.52,
      weights: {
        ...sharedWeights,
      },
      bombing: {
        baseCooldownMs: 980,
        escapeBufferMs: 320,
        maxCommitDistance: 6,
        minCrateValue: 1,
        opponentThreatValue: 1.7,
      },
    },
    aggressive: {
      reactionMs: 95,
      lookaheadMs: 3200,
      repathIntervalMs: 95,
      hesitationChance: 0.02,
      aggression: 0.96,
      greed: 0.52,
      bravery: 0.75,
      weights: {
        ...sharedWeights,
        pressureBias: 1.9,
        chaseBias: 1.18,
        dangerBias: 3.1,
      },
      bombing: {
        baseCooldownMs: 780,
        escapeBufferMs: 280,
        maxCommitDistance: 7,
        minCrateValue: 1,
        opponentThreatValue: 2.2,
      },
    },
  },
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.35,
    sfxVolume: 0.65,
  },
};
