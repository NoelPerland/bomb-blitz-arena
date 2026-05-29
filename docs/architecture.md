# Bomberman MVP Integration Contract

## Purpose

This repo is the single-player Phaser 3 + TypeScript + Vite MVP for a Bomberman / Playing With Fire style browser game.

The codebase already has a live gameplay implementation. The job of this document is to lock the canonical runtime path so later work stays coordinated and no one rebuilds the same surface in parallel.

## Canonical Runtime Map

### Boot and app shell

- `src/main.ts`
  - Browser entry.
  - Mounts the game root and app shell only.
  - Exposes the debug bridge used by smoke tests.
- `src/game/createGame.ts`
  - Creates the Phaser game.
  - Registers the active scenes only.
  - Keeps the renderer, scale, and physics defaults in one place.
- `index.html`
  - Minimal Vite host page.
  - No gameplay logic.
- `src/style.css`
  - Outer frame and canvas presentation only.

### Active scenes

- `src/game/scenes/BootScene.ts`
  - Generates shared textures before gameplay starts.
  - Performs audio unlock binding.
  - Hands off to title.
- `src/game/scenes/TitleScene.ts`
  - Title screen, controls, start affordance, mute toggle.
  - No gameplay state.
- `src/game/scenes/GameScene.ts`
  - Authoritative round loop.
  - Owns arena state, actors, bombs, explosions, pickups, HUD, overlay, restart, and return-to-title.
  - This is the only scene that should mutate match state.

### Shared gameplay modules

- `src/game/config.ts`
  - Runtime config facade.
  - Exposes `GAME_CONFIG`, `GAME_WIDTH`, `GAME_HEIGHT`, `GRID_WIDTH`, `GRID_HEIGHT`, `TILE_SIZE`, `HUD_HEIGHT`.
  - Must stay thin and read from balance config rather than duplicating tunables.
- `src/game/config/balance.ts`
  - Single source of tuning truth for arena, bombs, movement, powerups, AI, and audio.
  - If a number is gameplay-critical, it belongs here first.
- `src/game/arena.ts`
  - Fixed arena generation and spawn-safe pocket layout.
- `src/game/grid.ts`
  - Tile/world conversion and grid snapping.
- `src/game/types.ts`
  - Shared plain-data model for actors, bombs, powerups, explosions, directions, and round outcome.
- `src/game/botHooks.ts`
  - Runtime bridge from `GameScene` state snapshots to AI intents.
- `src/game/ai/*`
  - AI decision-making, danger evaluation, pathfinding, and controller orchestration.
- `src/game/entities/ActorAvatar.ts`
  - Lightweight visual wrapper for actor presentation.

### Presentation modules

- `src/assets/createGeneratedAssets.ts`
  - Canonical generated texture pipeline.
  - Every shared visual key should originate here.
- `src/audio/ArcadeAudio.ts`
  - Retro SFX and simple music loops.
  - Also owns mute persistence.
- `src/ui/drawables.ts`
  - Shared visual primitives for panels, tiles, bombs, explosions, and pickups.
- `src/ui/Hud.ts`
  - In-game stat HUD only.
- `src/ui/MuteToggle.ts`
  - Shared mute control.
- `src/ui/OverlayPanel.ts`
  - Result overlay.
- `src/game/theme.ts`
  - Typography and palette constants.

### Validation surfaces

- `tests/runtimeSmoke.mjs`
  - End-to-end browser smoke test.
  - Relies on the runtime debug bridge and `GameScene.getDebugSnapshot()`.
- `tests/aiValidation.ts`
  - AI logic validation.
  - Must remain runnable directly from the repo.

## Canonical Module Ownership

| Area | Canonical modules | Notes |
| --- | --- | --- |
| App bootstrap | `src/main.ts`, `index.html`, `src/style.css` | Do not add gameplay here. |
| Phaser setup | `src/game/createGame.ts` | Active scenes only. |
| Boot/title flow | `src/game/scenes/BootScene.ts`, `src/game/scenes/TitleScene.ts` | No alternate scene stack. |
| Match logic | `src/game/scenes/GameScene.ts` | Single source of truth for round state. |
| Arena/grid/types | `src/game/arena.ts`, `src/game/grid.ts`, `src/game/types.ts` | Shared by gameplay and AI. |
| AI | `src/game/botHooks.ts`, `src/game/ai/*`, `src/game/config/balance.ts` | AI consumes snapshots, not scene internals. |
| Presentation | `src/assets/createGeneratedAssets.ts`, `src/audio/ArcadeAudio.ts`, `src/ui/*`, `src/game/theme.ts` | Presentation only, no rule changes. |
| Validation | `tests/runtimeSmoke.mjs`, `tests/aiValidation.ts` | Treat as part of the contract. |

## Deprecated Or Duplicate Surfaces

These files are legacy scaffold artifacts or non-canonical duplicates. Do not build new gameplay paths on them.

- `src/counter.ts`
  - Vite starter leftover.
  - Dead code.
- `src/assets/hero.png`
  - Legacy starter asset.
- `src/assets/typescript.svg`
  - Legacy starter asset.
- `src/assets/vite.svg`
  - Legacy starter asset.
- `public/favicon.svg`
  - Default scaffold icon.
- `public/icons.svg`
  - Default scaffold icon.
- Any future `src/scenes/*` or `src/game/systems/*` tree
  - Not part of the current runtime layout.
  - Do not create parallel gameplay stacks unless the repo is intentionally being restructured.
- Any alternate `GameScene` replacement
  - There is one authoritative match scene.
  - Do not introduce a second game loop or presentation-only substitute.

## Integration Contract

### Match flow

1. `BootScene` generates textures and unlocks audio.
2. `TitleScene` shows the game and starts a match.
3. `GameScene` creates fresh arena state and runs the round.
4. `GameScene` shows the win/lose overlay when only one survivor remains.
5. Restart stays in `GameScene`; return-to-title goes back to `TitleScene`.

### Data flow

- Gameplay state is plain TS data inside `GameScene`.
- AI reads snapshots only through `botHooks.ts`.
- UI reads state through scene-owned values and the debug snapshot only when testing.
- Presentation modules must not become a second rules engine.

### Configuration flow

- `balance.ts` owns all gameplay tuning.
- `config.ts` is a runtime facade, not a second tuning source.
- Scene code should not hardcode balance values that already exist in config.

### Validation flow

- Smoke tests depend on:
  - `window.__BOMB_BLITZ__.game`
  - `GameScene.getDebugSnapshot()`
  - stable scene keys (`boot`, `title`, `game`)
- AI tests depend on the current `src/game/ai/*` contracts and the balance config.
- If either contract changes, update the tests in the same change.

## Integration Hazards

- `GameScene.getDebugSnapshot()` is a real test contract, not a convenience helper.
  Renaming or reshaping it without updating smoke tests will break validation.
- The runtime debug bridge on `window.__BOMB_BLITZ__` is also part of the contract.
  Do not remove it unless the smoke harness is updated at the same time.
- `botDirector` is a live runtime seam used by validation to freeze AI behavior.
  Keep a controlled way to replace or stub it during testing.
- `BootScene` must finish asset generation before any scene assumes texture keys exist.
  If scene order changes, title/game rendering can fail at startup.
- The arena is fixed and grid-first.
  Do not introduce a second arena generator or procedural branch that competes with the existing board layout.
- All mutable gameplay numbers belong in `src/game/config/balance.ts`.
  Duplicating them in scene code will cause drift and make AI tuning brittle.
- `Phaser.CANVAS` is the current safe default.
  Changing renderer or scale behavior is a cross-cutting decision and should be coordinated with validation.

## Implementation Boundary

- Agent 1 owns this contract and the runtime layout only.
- Agent 2 owns the round loop and gameplay state mutations.
- Agent 3 owns AI logic and balance tuning only.
- Agent 4 owns visuals, UI, audio, and feel only.
- Agent 5 owns runtime validation and the smallest bug fixes required by the tests.

The intent is simple: one gameplay scene, one tuning source, one asset pipeline, one validation path.
