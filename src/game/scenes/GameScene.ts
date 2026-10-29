import Phaser from 'phaser';
import { arcadeAudio } from '../../audio/ArcadeAudio';
import { Hud } from '../../ui/Hud';
import { MuteToggle } from '../../ui/MuteToggle';
import { OverlayPanel } from '../../ui/OverlayPanel';
import { buildArena, key } from '../arena';
import { createBotDirector } from '../botHooks';
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH, GRID_HEIGHT, GRID_WIDTH, HUD_HEIGHT, TILE_SIZE } from '../config';
import { ActorAvatar } from '../entities/ActorAvatar';
import {
  clampWorldX,
  clampWorldY,
  DIRECTION_VECTORS,
  isActorCentered,
  snapAxisToGrid,
  tileToWorld,
  worldToTile,
} from '../grid';
import type {
  ActorState,
  BombState,
  Direction,
  ExplosionTile,
  GridPosition,
  PowerupState,
  PowerupType,
  RoundOutcome,
  TileType,
} from '../types';

interface ActorRuntime {
  state: ActorState;
  avatar: ActorAvatar;
  currentDirection: Direction;
  desiredDirection: Direction;
}

interface BombRuntime {
  state: BombState;
  sprite: Phaser.GameObjects.Image;
  fuseEvent: Phaser.Time.TimerEvent;
  pulseTween: Phaser.Tweens.Tween;
  passThroughActors: Set<string>;
}

interface ExplosionRuntime {
  tiles: ExplosionTile[];
  sprites: Phaser.GameObjects.Image[];
  expireEvent: Phaser.Time.TimerEvent;
}

interface PowerupRuntime {
  state: PowerupState;
  sprite: Phaser.GameObjects.Image;
}

export class GameScene extends Phaser.Scene {
  private rng = new Phaser.Math.RandomDataGenerator(['core-loop']);
  private arenaTiles: TileType[][] = [];
  private floorLayer!: Phaser.GameObjects.Container;
  private solidLayer!: Phaser.GameObjects.Container;
  private crateLayer!: Phaser.GameObjects.Container;
  private pickupLayer!: Phaser.GameObjects.Container;
  private bombLayer!: Phaser.GameObjects.Container;
  private flameLayer!: Phaser.GameObjects.Container;
  private actorLayer!: Phaser.GameObjects.Container;
  private crates = new Map<string, Phaser.GameObjects.Image>();
  private hud!: Hud;
  private overlay!: OverlayPanel;
  private actors: ActorRuntime[] = [];
  private bombs = new Map<string, BombRuntime>();
  private powerups = new Map<string, PowerupRuntime>();
  private activeFlames: ExplosionRuntime[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private roundOutcome: RoundOutcome | null = null;
  private resultEvent: Phaser.Time.TimerEvent | null = null;
  private botDirector = createBotDirector();
  private lastBombId = 0;
  private lastPowerupId = 0;

  constructor() {
    super('game');
  }

  create(): void {
    arcadeAudio.startGameMusic(this);
    this.cameras.main.setBackgroundColor('#17345b');
    this.rng = new Phaser.Math.RandomDataGenerator([Date.now().toString()]);
    this.botDirector = createBotDirector(() => this.rng.frac());

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,ENTER,R,T,ESC,M') as Record<string, Phaser.Input.Keyboard.Key>;

    this.createBackdrop();
    this.createLayers();
    this.createHud();
    this.registerInput();
    this.resetRound();
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;

    if (!this.roundOutcome) {
      const botState = this.buildBotState();
      for (const actor of this.actors) {
        if (!actor.state.alive) {
          continue;
        }

        const intent = actor.state.isHuman
          ? this.resolveHumanIntent()
          : this.botDirector.resolveIntent(actor.state.id, botState);
        actor.desiredDirection = intent.direction;

        if (intent.placeBomb) {
          this.tryPlaceBomb(actor);
        }

        this.updateActorMovement(actor, deltaSeconds);
      }

      this.updateBombPassThrough();
      this.collectPowerups();
      this.checkFlameCollisions();
      this.checkRoundOutcome();
    }

    this.updateHud();
  }

  private createBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x6ac4ff, 0x6ac4ff, 0x24527f, 0x17345b, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.fillStyle(0x0b1323, 0.18).fillRoundedRect(12, 80, GAME_WIDTH - 24, GRID_HEIGHT * TILE_SIZE + 28, 24);
    graphics.fillStyle(0xffffff, 0.09).fillRoundedRect(20, 88, GAME_WIDTH - 40, GRID_HEIGHT * TILE_SIZE + 12, 20);

    for (let i = 0; i < 20; i += 1) {
      const spark = this.add
        .image(Phaser.Math.Between(12, GAME_WIDTH - 12), Phaser.Math.Between(16, GAME_HEIGHT - 16), 'spark')
        .setAlpha(Phaser.Math.FloatBetween(0.18, 0.45))
        .setScale(Phaser.Math.FloatBetween(0.4, 0.9));
      this.tweens.add({
        targets: spark,
        alpha: 0.1,
        duration: Phaser.Math.Between(900, 1500),
        repeat: -1,
        yoyo: true,
      });
    }
  }

  private createLayers(): void {
    this.floorLayer = this.add.container();
    this.solidLayer = this.add.container();
    this.crateLayer = this.add.container();
    this.pickupLayer = this.add.container();
    this.bombLayer = this.add.container();
    this.flameLayer = this.add.container();
    this.actorLayer = this.add.container();
  }

  private createHud(): void {
    this.hud = new Hud(this, 0, 0, { bombs: 1, fire: 2, speed: 1, rivals: 3 });
    this.overlay = new OverlayPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
    this.overlay.setDepth(100);
    this.overlay.hide();
    const muteToggle = new MuteToggle(this, 72, 50);
    muteToggle.setName('mute-toggle');
  }

  private registerInput(): void {
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.roundOutcome) {
        const player = this.actors.find((actor) => actor.state.isHuman);
        if (player) {
          this.tryPlaceBomb(player);
        }
      } else {
        this.scene.restart();
      }
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.roundOutcome) {
        this.scene.restart();
      }
    });

    this.input.keyboard?.on('keydown-R', () => this.scene.restart());
    this.input.keyboard?.on('keydown-ESC', () => {
      arcadeAudio.stopMusic();
      this.scene.start('title');
    });
    this.input.keyboard?.on('keydown-T', () => {
      arcadeAudio.stopMusic();
      this.scene.start('title');
    });
    this.input.keyboard?.on('keydown-M', () => {
      const toggle = this.children.getByName('mute-toggle');
      toggle?.emit('pointerdown');
    });
    const place = () => { if(this.roundOutcome) return; const player=this.actors.find(a=>a.state.isHuman); if(player) this.tryPlaceBomb(player); };
    window.addEventListener('bomb-place',place);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>window.removeEventListener('bomb-place',place));
  }

  private resetRound(): void {
    this.roundOutcome = null;
    this.resultEvent?.remove(false);
    this.resultEvent = null;
    this.overlay.hide();
    this.botDirector = createBotDirector(() => this.rng.frac());
    this.lastBombId = 0;
    this.lastPowerupId = 0;

    for (const bomb of this.bombs.values()) {
      bomb.fuseEvent.remove(false);
      bomb.pulseTween.stop();
      bomb.sprite.destroy();
    }
    this.bombs.clear();

    for (const flame of this.activeFlames) {
      flame.expireEvent.remove(false);
      flame.sprites.forEach((sprite) => sprite.destroy());
    }
    this.activeFlames = [];

    for (const pickup of this.powerups.values()) {
      pickup.sprite.destroy();
    }
    this.powerups.clear();

    this.crates.forEach((crate) => crate.destroy());
    this.crates.clear();
    this.floorLayer.removeAll(true);
    this.solidLayer.removeAll(true);
    this.crateLayer.removeAll(true);
    this.pickupLayer.removeAll(true);
    this.bombLayer.removeAll(true);
    this.flameLayer.removeAll(true);
    this.actorLayer.removeAll(true);

    this.actors.forEach((actor) => actor.avatar.destroy());
    this.actors = [];

    const arena = buildArena(this.rng);
    this.arenaTiles = arena.tiles;
    this.drawArena();
    this.spawnActors(arena.spawns);
  }

  private drawArena(): void {
    for (let row = 0; row < GRID_HEIGHT; row += 1) {
      for (let col = 0; col < GRID_WIDTH; col += 1) {
        const { x, y } = tileToWorld(col, row);
        this.floorLayer.add(this.add.image(x, y, 'floorTile'));

        if (this.arenaTiles[row][col] === 'solid') {
          this.solidLayer.add(this.add.image(x, y, 'solidTile'));
        } else if (this.arenaTiles[row][col] === 'crate') {
          const crate = this.add.image(x, y, 'crateTile');
          this.crates.set(key(col, row), crate);
          this.crateLayer.add(crate);
        }
      }
    }
  }

  private spawnActors(spawns: GridPosition[]): void {
    const definitions = [
      { id: 'player', name: 'You', tint: 0x5dc8ff, isHuman: true, spawn: spawns[0], crown: true },
      { id: 'bot-1', name: 'Byte', tint: 0xff7a7a, isHuman: false, spawn: spawns[1], crown: false },
      { id: 'bot-2', name: 'Nova', tint: 0xffd166, isHuman: false, spawn: spawns[2], crown: false },
      { id: 'bot-3', name: 'Spark', tint: 0xba8cff, isHuman: false, spawn: spawns[3], crown: false },
    ];

    this.actors = definitions.map((definition) => {
      const { x, y } = tileToWorld(definition.spawn.col, definition.spawn.row);
      const avatar = new ActorAvatar(this, x, y - 8, definition.tint, definition.crown);
      this.actorLayer.add(avatar);
      return {
        state: {
          id: definition.id,
          name: definition.name,
          tint: definition.tint,
          isHuman: definition.isHuman,
          alive: true,
          col: definition.spawn.col,
          row: definition.spawn.row,
          activeBombs: 0,
          stats: {
            bombLimit: definition.isHuman
              ? GAME_CONFIG.player.initialBombLimit
              : GAME_CONFIG.enemy.baseBombLimit,
            blastRange: definition.isHuman
              ? GAME_CONFIG.player.initialBlastRange
              : GAME_CONFIG.enemy.baseBlastRange,
            moveSpeed: definition.isHuman
              ? GAME_CONFIG.player.baseMoveSpeed
              : GAME_CONFIG.enemy.baseMoveSpeed,
          },
        },
        avatar,
        currentDirection: 'none',
        desiredDirection: 'none',
      };
    });
  }

  private resolveHumanIntent(): { direction: Direction; placeBomb: boolean } {
    let direction: Direction = ((window as any).__BOMB_TOUCH__?.direction || 'none') as Direction;
    if (this.cursors.left.isDown || this.keys.A.isDown) {
      direction = 'left';
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      direction = 'right';
    } else if (this.cursors.up.isDown || this.keys.W.isDown) {
      direction = 'up';
    } else if (this.cursors.down.isDown || this.keys.S.isDown) {
      direction = 'down';
    }

    return {
      direction,
      placeBomb: false,
    };
  }

  private updateActorMovement(actor: ActorRuntime, deltaSeconds: number): void {
    const speed = actor.state.stats.moveSpeed;
    const canTurn = isActorCentered(actor.avatar.x, actor.avatar.y + 8);

    if (canTurn) {
      const tile = worldToTile(actor.avatar.x, actor.avatar.y + 8);
      actor.state.col = tile.col;
      actor.state.row = tile.row;

      const desired = actor.desiredDirection;
      if (desired !== 'none' && this.canMoveFromTile(actor, tile, desired)) {
        actor.currentDirection = desired;
      } else if (actor.currentDirection !== 'none' && !this.canMoveFromTile(actor, tile, actor.currentDirection)) {
        actor.currentDirection = 'none';
      }
    }

    if (actor.currentDirection === 'none') {
      actor.avatar.x = snapAxisToGrid(actor.avatar.x);
      actor.avatar.y = snapAxisToGrid(actor.avatar.y + 8, HUD_HEIGHT) - 8;
      return;
    }

    if (actor.currentDirection === 'left' || actor.currentDirection === 'right') {
      actor.avatar.y = snapAxisToGrid(actor.avatar.y + 8, HUD_HEIGHT) - 8;
    } else {
      actor.avatar.x = snapAxisToGrid(actor.avatar.x);
    }

    const vector = DIRECTION_VECTORS[actor.currentDirection];
    const movement = speed * deltaSeconds;
    actor.avatar.x = clampWorldX(actor.avatar.x + vector.col * movement);
    actor.avatar.y = clampWorldY(actor.avatar.y + 8 + vector.row * movement) - 8;

    const currentTile = worldToTile(actor.avatar.x, actor.avatar.y + 8);
    actor.state.col = currentTile.col;
    actor.state.row = currentTile.row;

    if (isActorCentered(actor.avatar.x, actor.avatar.y + 8) && !this.canStandOnTile(actor, currentTile.col, currentTile.row)) {
      actor.currentDirection = 'none';
    }
  }

  private canMoveFromTile(actor: ActorRuntime, origin: GridPosition, direction: Exclude<Direction, 'none'>): boolean {
    const vector = DIRECTION_VECTORS[direction];
    return this.canStandOnTile(actor, origin.col + vector.col, origin.row + vector.row);
  }

  private canStandOnTile(actor: ActorRuntime, col: number, row: number): boolean {
    if (col < 0 || row < 0 || col >= GRID_WIDTH || row >= GRID_HEIGHT) {
      return false;
    }

    const tile = this.arenaTiles[row][col];
    if (tile === 'solid' || tile === 'crate') {
      return false;
    }

    const bomb = this.bombs.get(key(col, row));
    if (bomb && !bomb.passThroughActors.has(actor.state.id)) {
      return false;
    }

    return true;
  }

  private tryPlaceBomb(actor: ActorRuntime): void {
    if (!actor.state.alive || actor.state.activeBombs >= actor.state.stats.bombLimit) {
      return;
    }

    const tile = worldToTile(actor.avatar.x, actor.avatar.y + 8);
    const tileKey = key(tile.col, tile.row);
    if (this.bombs.has(tileKey) || this.arenaTiles[tile.row][tile.col] !== 'floor') {
      return;
    }

    const { x, y } = tileToWorld(tile.col, tile.row);
    const sprite = this.add.image(x, y - 6, 'bomb').setDepth(15);
    this.bombLayer.add(sprite);
    const pulseTween = this.tweens.add({
      targets: sprite,
      scale: 1.08,
      duration: 240,
      yoyo: true,
      repeat: -1,
    });

    const bombState: BombState = {
      id: `bomb-${this.lastBombId += 1}`,
      ownerId: actor.state.id,
      col: tile.col,
      row: tile.row,
      blastRange: actor.state.stats.blastRange,
    };

    const bombRuntime: BombRuntime = {
      state: bombState,
      sprite,
      fuseEvent: this.time.delayedCall(GAME_CONFIG.bomb.fuseMs, () => this.detonateBomb(tileKey)),
      pulseTween,
      passThroughActors: new Set([actor.state.id]),
    };

    this.bombs.set(tileKey, bombRuntime);
    actor.state.activeBombs += 1;
    arcadeAudio.playBomb(this);
  }

  private detonateBomb(tileKey: string): void {
    const bomb = this.bombs.get(tileKey);
    if (!bomb) {
      return;
    }

    this.bombs.delete(tileKey);
    bomb.fuseEvent.remove(false);
    bomb.pulseTween.stop();
    bomb.sprite.destroy();

    const owner = this.actors.find((entry) => entry.state.id === bomb.state.ownerId);
    if (owner) {
      owner.state.activeBombs = Math.max(0, owner.state.activeBombs - 1);
    }

    const blastTiles = this.buildExplosionTiles(bomb.state);
    this.spawnExplosion(blastTiles);
    this.cameras.main.shake(140, 0.0045);

    for (const tile of blastTiles) {
      const impactedBomb = this.bombs.get(key(tile.col, tile.row));
      if (impactedBomb) {
        this.detonateBomb(key(tile.col, tile.row));
      }
    }
  }

  private buildExplosionTiles(bomb: BombState): ExplosionTile[] {
    const tiles: ExplosionTile[] = [{ col: bomb.col, row: bomb.row, stop: false }];
    const directions = Object.values(DIRECTION_VECTORS) as GridPosition[];

    for (const vector of directions) {
      for (let step = 1; step <= bomb.blastRange; step += 1) {
        const col = bomb.col + vector.col * step;
        const row = bomb.row + vector.row * step;

        if (col < 0 || row < 0 || col >= GRID_WIDTH || row >= GRID_HEIGHT) {
          break;
        }

        const tile = this.arenaTiles[row][col];
        if (tile === 'solid') {
          break;
        }

        const hitCrate = tile === 'crate';
        tiles.push({ col, row, stop: hitCrate });

        if (hitCrate) {
          this.breakCrate(col, row);
          break;
        }
      }
    }

    return tiles;
  }

  private breakCrate(col: number, row: number): void {
    this.arenaTiles[row][col] = 'floor';
    this.crates.get(key(col, row))?.destroy();
    this.crates.delete(key(col, row));
    this.trySpawnPowerup(col, row);
    arcadeAudio.playBreak(this);
  }

  private trySpawnPowerup(col: number, row: number): void {
    if (this.rng.frac() > GAME_CONFIG.powerups.dropChance) {
      return;
    }

    const type = this.rollPowerup();
    const { x, y } = tileToWorld(col, row);
    const sprite = this.add.image(x, y - 6, this.powerupTexture(type)).setDepth(10);
    this.pickupLayer.add(sprite);
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 6,
      duration: 720,
      yoyo: true,
      repeat: -1,
    });

    const state: PowerupState = {
      id: `pickup-${this.lastPowerupId += 1}`,
      type,
      col,
      row,
    };

    this.powerups.set(key(col, row), { state, sprite });
  }

  private rollPowerup(): PowerupType {
    const roll = this.rng.frac();
    const { extraBomb, fireUp } = GAME_CONFIG.powerups.weights;
    if (roll <= extraBomb) {
      return 'extraBomb';
    }
    if (roll <= extraBomb + fireUp) {
      return 'fireUp';
    }
    return 'speedUp';
  }

  private powerupTexture(type: PowerupType): string {
    if (type === 'extraBomb') {
      return 'powerup-extraBomb';
    }
    if (type === 'fireUp') {
      return 'powerup-fireUp';
    }
    return 'powerup-speedUp';
  }

  private spawnExplosion(tiles: ExplosionTile[]): void {
    const sprites = tiles.map((tile) => {
      const { x, y } = tileToWorld(tile.col, tile.row);
      const flame = this.add.image(x, y, 'explosion').setDepth(30);
      flame.setScale(tile.stop ? 0.95 : tile.col === tiles[0].col && tile.row === tiles[0].row ? 1.08 : 0.92);
      this.flameLayer.add(flame);
      return flame;
    });

    const runtime: ExplosionRuntime = {
      tiles,
      sprites,
      expireEvent: this.time.delayedCall(GAME_CONFIG.bomb.explosionDurationMs, () => {
        runtime.sprites.forEach((sprite) => sprite.destroy());
        this.activeFlames = this.activeFlames.filter((entry) => entry !== runtime);
      }),
    };
    this.activeFlames.push(runtime);
    arcadeAudio.playExplosion(this);
    this.checkFlameCollisions();
  }

  private updateBombPassThrough(): void {
    for (const bomb of this.bombs.values()) {
      for (const actorId of [...bomb.passThroughActors]) {
        const actor = this.actors.find((entry) => entry.state.id === actorId);
        if (!actor || !actor.state.alive) {
          bomb.passThroughActors.delete(actorId);
          continue;
        }

        const tile = this.getActorTile(actor);
        if (tile.col !== bomb.state.col || tile.row !== bomb.state.row) {
          bomb.passThroughActors.delete(actorId);
        }
      }
    }
  }

  private collectPowerups(): void {
    for (const actor of this.actors) {
      if (!actor.state.alive) {
        continue;
      }

      const tile = this.getActorTile(actor);
      const tileKey = key(tile.col, tile.row);
      const pickup = this.powerups.get(tileKey);
      if (!pickup) {
        continue;
      }

      switch (pickup.state.type) {
        case 'extraBomb':
          actor.state.stats.bombLimit += 1;
          break;
        case 'fireUp':
          actor.state.stats.blastRange += 1;
          break;
        case 'speedUp':
          actor.state.stats.moveSpeed = Math.min(
            actor.state.isHuman ? GAME_CONFIG.player.maxMoveSpeed : GAME_CONFIG.enemy.maxMoveSpeed,
            actor.state.stats.moveSpeed + GAME_CONFIG.player.speedPickupBonus,
          );
          break;
      }

      pickup.sprite.destroy();
      this.powerups.delete(tileKey);
      arcadeAudio.playPickup(this);
    }
  }

  private checkFlameCollisions(): void {
    for (const flame of this.activeFlames) {
      for (const actor of this.actors) {
        if (!actor.state.alive) {
          continue;
        }

        const actorTile = this.getActorTile(actor);
        if (flame.tiles.some((tile) => tile.col === actorTile.col && tile.row === actorTile.row)) {
          this.killActor(actor);
        }
      }
    }
  }

  private killActor(actor: ActorRuntime): void {
    if (!actor.state.alive) {
      return;
    }
    this.getActorTile(actor);
    actor.state.alive = false;
    actor.currentDirection = 'none';
    actor.desiredDirection = 'none';
    actor.avatar.setAlive(false);
    if (actor.state.isHuman) {
      arcadeAudio.playDefeat(this);
    } else {
      arcadeAudio.playEnemyDown(this);
    }
  }

  private checkRoundOutcome(): void {
    const livingActors = this.actors.filter((actor) => actor.state.alive);
    if (livingActors.length > 1 || this.roundOutcome) {
      return;
    }

    const winner = livingActors[0] ?? null;
    this.roundOutcome = {
      winnerId: winner?.state.id ?? null,
      winnerName: winner?.state.name ?? 'Nobody',
      playerWon: winner?.state.isHuman ?? false,
    };

    this.resultEvent = this.time.delayedCall(GAME_CONFIG.round.resultDelayMs, () => {
      if (!this.roundOutcome) {
        return;
      }
      this.overlay.show(
        this.roundOutcome.playerWon ? 'Victory!' : 'Defeat!',
        this.roundOutcome.playerWon
          ? 'You survived the arena.\nReady for another round?'
          : `${this.roundOutcome.winnerName} won the round.\nReady for a rematch?`,
        this.roundOutcome.playerWon ? 0x8cffb0 : 0xff8a78,
      );
      if (this.roundOutcome.playerWon) {
        arcadeAudio.playVictory(this);
      }
    });
  }

  private updateHud(): void {
    const player = this.actors.find((actor) => actor.state.isHuman);
    if (!player) {
      return;
    }

    const livingOpponents = this.actors.filter((actor) => !actor.state.isHuman && actor.state.alive).length;
    this.hud.setValues({
      bombs: player.state.stats.bombLimit - player.state.activeBombs,
      fire: player.state.stats.blastRange,
      speed: Math.round(player.state.stats.moveSpeed / 10),
      rivals: livingOpponents,
    });
  }

  private getActorTile(actor: ActorRuntime): GridPosition {
    const tile = worldToTile(actor.avatar.x, actor.avatar.y + 8);
    actor.state.col = tile.col;
    actor.state.row = tile.row;
    return tile;
  }

  private buildBotState() {
    return {
      nowMs: this.time.now,
      arenaTiles: this.arenaTiles.map((row) => [...row]),
      actors: this.actors.map(({ state }) => ({
        ...state,
        stats: { ...state.stats },
      })),
      bombs: Array.from(this.bombs.values()).map((bomb) => ({
        ...bomb.state,
        fuseMs: this.getRemainingMs(bomb.fuseEvent),
      })),
      explosions: this.activeFlames.flatMap((flame) =>
        flame.tiles.map((tile) => ({
          ...tile,
          remainingMs: this.getRemainingMs(flame.expireEvent),
        })),
      ),
      powerups: Array.from(this.powerups.values()).map((pickup) => ({
        ...pickup.state,
      })),
    };
  }

  private getRemainingMs(timer: Phaser.Time.TimerEvent): number {
    const elapsed = typeof timer.getElapsed === 'function' ? timer.getElapsed() : timer.elapsed;
    return Math.max(0, timer.delay - elapsed);
  }

  getDebugSnapshot(): {
    actors: Array<{ id: string; name: string; col: number; row: number; alive: boolean; isHuman: boolean; bombs: number; fire: number; speed: number }>;
    bombs: Array<{ id: string; col: number; row: number; ownerId: string; fuseMs: number }>;
    powerups: Array<{ id: string; col: number; row: number; type: PowerupType }>;
    explosions: Array<{ col: number; row: number }>;
    crateCount: number;
    roundOutcome: RoundOutcome | null;
  } {
    return {
      actors: this.actors.map((actor) => ({
        id: actor.state.id,
        name: actor.state.name,
        col: actor.state.col,
        row: actor.state.row,
        alive: actor.state.alive,
        isHuman: actor.state.isHuman,
        bombs: actor.state.stats.bombLimit,
        fire: actor.state.stats.blastRange,
        speed: actor.state.stats.moveSpeed,
      })),
      bombs: Array.from(this.bombs.values()).map((bomb) => ({
        id: bomb.state.id,
        col: bomb.state.col,
        row: bomb.state.row,
        ownerId: bomb.state.ownerId,
        fuseMs: this.getRemainingMs(bomb.fuseEvent),
      })),
      powerups: Array.from(this.powerups.values()).map((pickup) => ({
        id: pickup.state.id,
        col: pickup.state.col,
        row: pickup.state.row,
        type: pickup.state.type,
      })),
      explosions: this.activeFlames.flatMap((flame) =>
        flame.tiles.map((tile) => ({
          col: tile.col,
          row: tile.row,
        })),
      ),
      crateCount: this.arenaTiles.flat().filter((tile) => tile === 'crate').length,
      roundOutcome: this.roundOutcome,
    };
  }
}
