import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const url = process.env.SMOKE_URL ?? 'http://127.0.0.1:4174';
const artifactsDir = path.resolve('artifacts');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function cellKey(col, row) {
  return `${col},${row}`;
}

function neighbors(position) {
  return [
    { col: position.col + 1, row: position.row },
    { col: position.col - 1, row: position.row },
    { col: position.col, row: position.row + 1 },
    { col: position.col, row: position.row - 1 },
  ];
}

function keyForStep(from, to) {
  if (to.col > from.col) return 'ArrowRight';
  if (to.col < from.col) return 'ArrowLeft';
  if (to.row > from.row) return 'ArrowDown';
  return 'ArrowUp';
}

function buildBlastCells(tiles, origin, range) {
  const cells = [origin];
  const directions = [
    { col: 1, row: 0 },
    { col: -1, row: 0 },
    { col: 0, row: 1 },
    { col: 0, row: -1 },
  ];

  for (const direction of directions) {
    for (let step = 1; step <= range; step += 1) {
      const col = origin.col + direction.col * step;
      const row = origin.row + direction.row * step;
      const tile = tiles[row]?.[col];
      if (!tile || tile === 'solid') {
        break;
      }
      cells.push({ col, row });
      if (tile === 'crate') {
        break;
      }
    }
  }

  return cells;
}

function bfsPath(tiles, start, goal, blocked = new Set()) {
  const queue = [start];
  const visited = new Set([cellKey(start.col, start.row)]);
  const parent = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    if (goal(current)) {
      const path = [];
      let cursor = cellKey(current.col, current.row);
      while (cursor !== cellKey(start.col, start.row)) {
        const [col, row] = cursor.split(',').map(Number);
        path.unshift({ col, row });
        cursor = parent.get(cursor);
      }
      return path;
    }

    for (const next of neighbors(current)) {
      const nextKey = cellKey(next.col, next.row);
      const tile = tiles[next.row]?.[next.col];
      if (!tile || tile !== 'floor' || blocked.has(nextKey) || visited.has(nextKey)) {
        continue;
      }
      visited.add(nextKey);
      parent.set(nextKey, cellKey(current.col, current.row));
      queue.push(next);
    }
  }

  return null;
}

function findBombCandidate(tiles, start, range) {
  const queue = [start];
  const visited = new Set([cellKey(start.col, start.row)]);

  while (queue.length > 0) {
    const current = queue.shift();
    const adjacentCrates = neighbors(current).filter((next) => tiles[next.row]?.[next.col] === 'crate');
    if (adjacentCrates.length > 0) {
      const blastKeys = new Set(buildBlastCells(tiles, current, range).map((cell) => cellKey(cell.col, cell.row)));
      const escapePath = bfsPath(tiles, current, (cell) => !blastKeys.has(cellKey(cell.col, cell.row)));
      if (escapePath && escapePath.length > 0) {
        const path = bfsPath(tiles, start, (cell) => cell.col === current.col && cell.row === current.row) ?? [];
        return { target: current, path, escapePath, blastKeys };
      }
    }

    for (const next of neighbors(current)) {
      const nextKey = cellKey(next.col, next.row);
      const tile = tiles[next.row]?.[next.col];
      if (!tile || tile !== 'floor' || visited.has(nextKey)) {
        continue;
      }
      visited.add(nextKey);
      queue.push(next);
    }
  }

  return null;
}

async function main() {
  await fs.mkdir(artifactsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 980, height: 860 } });
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(String(error));
  });

  async function state() {
    return page.evaluate(() => {
      const bridge = window.__BOMB_BLITZ__;
      const gameScene = bridge?.game?.scene?.keys?.game;
      return {
        activeScenes: bridge?.game?.scene?.getScenes(true).map((scene) => scene.scene.key) ?? [],
        muted: window.localStorage.getItem('bomb-blitz-muted'),
        snapshot: gameScene?.getDebugSnapshot?.() ?? null,
        arenaTiles: gameScene?.arenaTiles ? gameScene.arenaTiles.map((row) => [...row]) : null,
        overlayVisible: Boolean(gameScene?.overlay?.visible),
      };
    });
  }

  async function waitForPlayerTile(col, row, timeout = 2500) {
    await page.waitForFunction(
      ([targetCol, targetRow]) => {
        const snapshot = window.__BOMB_BLITZ__?.game?.scene?.keys?.game?.getDebugSnapshot?.();
        const player = snapshot?.actors?.find((actor) => actor.isHuman);
        return player && player.col === targetCol && player.row === targetRow;
      },
      [col, row],
      { timeout },
    );
  }

  async function moveAlong(path) {
    let current = (await state()).snapshot.actors.find((actor) => actor.isHuman);
    for (const step of path) {
      const key = keyForStep(current, step);
      await page.keyboard.down(key);
      await waitForPlayerTile(step.col, step.row);
      await page.keyboard.up(key);
      current = step;
      await page.waitForTimeout(40);
    }
  }

  async function freezeBots() {
    await page.evaluate(() => {
      const gameScene = window.__BOMB_BLITZ__?.game?.scene?.keys?.game;
      if (gameScene) {
        gameScene.botDirector = {
          resolveIntent: () => ({ direction: 'none', placeBomb: false }),
        };
      }
    });
  }

  await page.goto(url);
  await page.waitForFunction(() => window.__BOMB_BLITZ__?.game?.scene?.isActive('title'));
  await page.screenshot({ path: path.join(artifactsDir, 'title.png') });

  const muteBefore = (await state()).muted;
  await page.keyboard.press('m');
  const muteAfter = (await state()).muted;
  assert(muteBefore !== muteAfter, 'Mute toggle did not change local storage state on the title screen.');
  await page.keyboard.press('m');

  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__BOMB_BLITZ__?.game?.scene?.isActive('game'));
  await freezeBots();
  let current = await state();
  await page.screenshot({ path: path.join(artifactsDir, 'game.png') });

  const initialPlayer = current.snapshot.actors.find((actor) => actor.isHuman);
  assert(initialPlayer?.alive, 'Player was not alive at match start.');
  assert(current.snapshot.actors.length === 4, 'Game did not start with four actors.');

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(450);
  await page.keyboard.up('ArrowRight');
  current = await state();
  const movedPlayer = current.snapshot.actors.find((actor) => actor.isHuman);
  assert(
    movedPlayer.col !== initialPlayer.col || movedPlayer.row !== initialPlayer.row,
    'Player movement did not change tile position.',
  );

  let powerupCollected = false;
  let crateBroken = false;
  let explosionMatched = false;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    current = await state();
    const player = current.snapshot.actors.find((actor) => actor.isHuman);
    const candidate = findBombCandidate(current.arenaTiles, { col: player.col, row: player.row }, player.fire);
    assert(candidate, 'Could not find a reachable safe bombing tile for player validation.');

    await moveAlong(candidate.path);
    const before = await state();
    const cratesBefore = before.snapshot.crateCount;
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__BOMB_BLITZ__?.game?.scene?.keys?.game?.getDebugSnapshot?.().bombs.length > 0);
    await moveAlong(candidate.escapePath);

    let explosionCells = [];
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      current = await state();
      if (current.snapshot.explosions.length > 0) {
        explosionCells = current.snapshot.explosions.map((cell) => cellKey(cell.col, cell.row)).sort();
        break;
      }
      await page.waitForTimeout(60);
    }

    const expectedExplosion = [...candidate.blastKeys].sort();
    explosionMatched = explosionMatched || JSON.stringify(explosionCells) === JSON.stringify(expectedExplosion);
    crateBroken = crateBroken || (await state()).snapshot.crateCount < cratesBefore;

    await page.waitForTimeout(2600);
    current = await state();
    if (current.snapshot.powerups.length > 0) {
      const target = current.snapshot.powerups[0];
      const playerNow = current.snapshot.actors.find((actor) => actor.isHuman);
      const pathToPowerup = bfsPath(
        current.arenaTiles,
        { col: playerNow.col, row: playerNow.row },
        (cell) => cell.col === target.col && cell.row === target.row,
      );
      const beforeStats = { bombs: playerNow.bombs, fire: playerNow.fire, speed: playerNow.speed };
      if (pathToPowerup) {
        await moveAlong(pathToPowerup);
        current = await state();
        const afterStats = current.snapshot.actors.find((actor) => actor.isHuman);
        powerupCollected =
          afterStats.bombs > beforeStats.bombs ||
          afterStats.fire > beforeStats.fire ||
          afterStats.speed > beforeStats.speed;
      }
    }

    if (crateBroken && powerupCollected) {
      break;
    }
  }

  assert(explosionMatched, 'Explosion propagation did not match the expected cross-shaped blast cells.');
  assert(crateBroken, 'No crate was destroyed during player bomb validation.');
  assert(powerupCollected, 'No spawned powerup was collected by the player during validation.');

  current = await state();
  const suicideCandidate = findBombCandidate(
    current.arenaTiles,
    { col: current.snapshot.actors.find((actor) => actor.isHuman).col, row: current.snapshot.actors.find((actor) => actor.isHuman).row },
    current.snapshot.actors.find((actor) => actor.isHuman).fire,
  );
  assert(suicideCandidate, 'Could not find a tile to validate player death.');
  await moveAlong(suicideCandidate.path);
  await page.keyboard.press('Space');
  await page.waitForFunction(
    () => {
      const snapshot = window.__BOMB_BLITZ__?.game?.scene?.keys?.game?.getDebugSnapshot?.();
      const player = snapshot?.actors?.find((actor) => actor.isHuman);
      return player && player.alive === false;
    },
    {},
    { timeout: 5000 },
  );

  await page.keyboard.press('r');
  await page.waitForFunction(() => {
    const snapshot = window.__BOMB_BLITZ__?.game?.scene?.keys?.game?.getDebugSnapshot?.();
    return snapshot && snapshot.roundOutcome === null && snapshot.actors?.some((actor) => actor.isHuman && actor.alive);
  });

  let aiMoved = false;
  let aiBombed = false;
  let aiDied = false;
  current = await state();
  const initialBots = current.snapshot.actors.filter((actor) => !actor.isHuman).map((actor) => ({ id: actor.id, col: actor.col, row: actor.row }));
  const aiDeadline = Date.now() + 45000;

  while (Date.now() < aiDeadline) {
    current = await state();
    const bots = current.snapshot.actors.filter((actor) => !actor.isHuman);
    aiMoved ||= bots.some((bot) => {
      const initial = initialBots.find((entry) => entry.id === bot.id);
      return initial && (initial.col !== bot.col || initial.row !== bot.row);
    });
    aiBombed ||= current.snapshot.bombs.some((bomb) => bomb.ownerId !== 'player');
    aiDied ||= bots.some((bot) => !bot.alive);
    if (current.snapshot.roundOutcome) {
      break;
    }
    await page.waitForTimeout(250);
  }

  assert(aiMoved, 'AI opponents did not move during the live match validation.');
  assert(aiBombed, 'AI opponents never placed a bomb during the live match validation.');
  assert(aiDied, 'No AI death was observed during the live match validation.');
  assert(current.snapshot.roundOutcome, 'Round outcome never resolved during the live match validation.');

  await page.waitForTimeout(1100);
  current = await state();
  assert(current.overlayVisible, 'Result overlay did not become visible after the round ended.');
  await page.screenshot({ path: path.join(artifactsDir, 'result.png') });

  await page.keyboard.press('r');
  await page.waitForFunction(() => {
    const snapshot = window.__BOMB_BLITZ__?.game?.scene?.keys?.game?.getDebugSnapshot?.();
    return snapshot && snapshot.roundOutcome === null && snapshot.actors?.length === 4 && snapshot.actors?.some((actor) => actor.isHuman && actor.alive);
  });

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__BOMB_BLITZ__?.game?.scene?.isActive('title'));

  assert(consoleErrors.length === 0, `Console errors were emitted: ${consoleErrors.join(' | ')}`);
  assert(pageErrors.length === 0, `Page errors were emitted: ${pageErrors.join(' | ')}`);

  await browser.close();

  console.log(
    JSON.stringify(
      {
        url,
        powerupCollected,
        aiMoved,
        aiBombed,
        aiDied,
        roundOutcome: current.snapshot.roundOutcome,
        artifactsDir,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
