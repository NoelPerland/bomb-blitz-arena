import Phaser from 'phaser';
import { arcadeAudio } from '../../audio/ArcadeAudio';
import { MuteToggle } from '../../ui/MuteToggle';
import { createActor, createCrate, drawFloorTile, drawPanel, drawWallTile } from '../../ui/drawables';
import { GAME_HEIGHT, GAME_WIDTH, GRID_HEIGHT, GRID_WIDTH, TILE_SIZE } from '../config';
import { PALETTE, TEXT_STYLES } from '../theme';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create(): void {
    arcadeAudio.bindUnlock(this);
    arcadeAudio.startTitleMusic(this);
    this.cameras.main.setBackgroundColor('#16365d');

    this.drawBackdrop();
    this.drawHeroCard();
    this.drawMiniArena();

    const startButton = this.makeButton(GAME_WIDTH / 2, 338, 'START MATCH', () => {
      arcadeAudio.playMenu(this);
      arcadeAudio.stopMusic();
      this.scene.start('game');
    });

    const supportText = this.add
      .text(GAME_WIDTH / 2, 379, 'Press Enter or Space to begin', {
        ...TEXT_STYLES.hudLabel,
        fontSize: '14px',
        color: '#d7efff',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [startButton, supportText],
      y: '+=4',
      duration: 920,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });

    const muteToggle = new MuteToggle(this, GAME_WIDTH - 62, 42);
    muteToggle.setDepth(20);

    this.input.keyboard?.on('keydown-SPACE', () => startButton.emit('pointerdown'));
    this.input.keyboard?.on('keydown-ENTER', () => startButton.emit('pointerdown'));
    this.input.keyboard?.on('keydown-M', () => muteToggle.emit('pointerdown'));
  }

  private drawBackdrop(): void {
    const background = this.add.graphics();
    background.fillGradientStyle(PALETTE.skyTop, PALETTE.skyTop, PALETTE.skyBottom, PALETTE.skyBottom, 1);
    background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    background.fillStyle(0xffffff, 0.08).fillEllipse(GAME_WIDTH / 2, 90, 420, 140);
    background.fillStyle(0x0b1323, 0.12).fillEllipse(GAME_WIDTH / 2, GAME_HEIGHT - 46, GAME_WIDTH - 26, 92);

    for (let i = 0; i < 28; i += 1) {
      const sparkle = this.add
        .image(
          Phaser.Math.Between(20, GAME_WIDTH - 20),
          Phaser.Math.Between(18, GAME_HEIGHT - 24),
          i % 3 === 0 ? 'sparkleDiamond' : 'spark',
        )
        .setAlpha(Phaser.Math.FloatBetween(0.12, 0.34))
        .setScale(i % 3 === 0 ? Phaser.Math.FloatBetween(0.48, 0.78) : Phaser.Math.FloatBetween(0.4, 0.9))
        .setAngle(Phaser.Math.Between(-20, 20));
      this.tweens.add({
        targets: sparkle,
        alpha: Phaser.Math.FloatBetween(0.06, 0.18),
        scale: sparkle.scale * Phaser.Math.FloatBetween(0.9, 1.15),
        duration: Phaser.Math.Between(850, 1600),
        repeat: -1,
        yoyo: true,
        delay: Phaser.Math.Between(0, 500),
      });
    }
  }

  private drawHeroCard(): void {
    drawPanel(this, GAME_WIDTH / 2, 184, 476, 260, 'titleCard', 0.5).setDepth(1);

    const badge = this.add
      .text(GAME_WIDTH / 2, 82, 'FLASH-ERA ARENA SHOWDOWN', {
        ...TEXT_STYLES.hudLabel,
        fontSize: '14px',
        color: '#16365d',
      })
      .setOrigin(0.5)
      .setDepth(2);
    badge.setBackgroundColor('#ffe3a1');
    badge.setPadding(12, 4, 12, 4);

    const title = this.add
      .text(GAME_WIDTH / 2, 132, 'BOMB BLITZ', TEXT_STYLES.title)
      .setOrigin(0.5)
      .setDepth(2)
      .setRotation(-0.012);
    title.setShadow(0, 4, '#10213b', 0, false, true);

    this.add
      .text(GAME_WIDTH / 2, 170, 'One hero. Three bots. Last one standing wins.', {
        ...TEXT_STYLES.subtitle,
        fontSize: '16px',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(
        GAME_WIDTH / 2,
        194,
        'MOVE  ·  ARROWS / WASD\nBOMB  ·  SPACE\nRESTART  ·  R     MENU  ·  ESC',
        {
          ...TEXT_STYLES.subtitle,
          fontSize: '14px',
          lineSpacing: 5,
          wordWrap: { width: 420 },
        },
      )
      .setOrigin(0.5)
      .setDepth(2);
  }

  private drawMiniArena(): void {
    const arenaRoot = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 100);
    arenaRoot.setDepth(3);

    const pedestal = this.add.image(0, 18, 'pedestal').setDisplaySize(300, 82);
    pedestal.setAlpha(0.95);
    arenaRoot.add(pedestal);

    const arena = this.add.container(0, -2);
    arenaRoot.add(arena);

    const tileScale = 0.35;
    const arenaWidth = GRID_WIDTH * (TILE_SIZE * tileScale);
    const arenaHeight = GRID_HEIGHT * (TILE_SIZE * tileScale);
    const startX = -arenaWidth / 2;
    const startY = -arenaHeight / 2;

    for (let row = 0; row < GRID_HEIGHT; row += 1) {
      for (let col = 0; col < GRID_WIDTH; col += 1) {
        const isBorder = row === 0 || col === 0 || row === GRID_HEIGHT - 1 || col === GRID_WIDTH - 1;
        const isPillar = row % 2 === 0 && col % 2 === 0;
        const x = startX + col * TILE_SIZE * tileScale;
        const y = startY + row * TILE_SIZE * tileScale;
        arena.add(
          isBorder || isPillar
            ? drawWallTile(this, x, y, TILE_SIZE * tileScale)
            : drawFloorTile(this, x, y, TILE_SIZE * tileScale),
        );

        const isSpawnPocket =
          (row <= 2 && col <= 2) ||
          (row <= 2 && col >= GRID_WIDTH - 3) ||
          (row >= GRID_HEIGHT - 3 && col <= 2) ||
          (row >= GRID_HEIGHT - 3 && col >= GRID_WIDTH - 3);

        if (!isBorder && !isPillar && !isSpawnPocket && (row + col) % 3 === 0) {
          arena.add(
            createCrate(
              this,
              x + TILE_SIZE * tileScale * 0.5,
              y + TILE_SIZE * tileScale * 0.5,
              TILE_SIZE * tileScale,
            ),
          );
        }
      }
    }

    const tokens = [
      { x: 1, y: 1, tint: 0x5dc8ff },
      { x: GRID_WIDTH - 2, y: 1, tint: 0xff7a7a },
      { x: 1, y: GRID_HEIGHT - 2, tint: 0xffd166 },
      { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2, tint: 0xba8cff },
    ];

    tokens.forEach((token, index) => {
      const actor = createActor(
        this,
        startX + token.x * TILE_SIZE * tileScale + TILE_SIZE * tileScale * 0.5,
        startY + token.y * TILE_SIZE * tileScale + TILE_SIZE * tileScale * 0.5 - 4,
        token.tint,
        tileScale * 0.94,
      );
      arena.add(actor);
      this.tweens.add({
        targets: actor,
        y: actor.y - (index % 2 === 0 ? 3 : 5),
        duration: 860 + index * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });

  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    onPress: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const background = this.add.image(0, 0, 'button').setDisplaySize(212, 48);
    const text = this.add.text(0, 0, label, TEXT_STYLES.button).setOrigin(0.5);
    text.setShadow(0, 2, '#5e2709', 0, false, true);

    container.add([background, text]);
    container.setSize(212, 48);
    container.setInteractive(new Phaser.Geom.Rectangle(-106, -24, 212, 48), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      container.setScale(1.03);
      arcadeAudio.playMenu(this);
    });
    container.on('pointerout', () => container.setScale(1));
    container.on('pointerdown', onPress);

    return container;
  }
}
