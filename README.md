# Bomb Blitz Arena

Phaser arena game with bomber-style movement, bots, hazards, HUD, runtime smoke-test hooks, and AI validation.

## Install

```bash
npm ci
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Validate AI

```bash
npm run validate:ai
```

## GitHub Pages deployment

Use Node.js 24. Source lives on `main`; the public game is https://noelperland.github.io/bomb-blitz-arena/ . GitHub Pages serves built files from `gh-pages`.

```sh
npm ci
npm run build -- --base=/bomb-blitz-arena/
npm run preview -- --base=/bomb-blitz-arena/
```

Publish `dist/` contents to a separate `gh-pages` checkout, include `.nojekyll`, commit and push without force. Preserve source on `main`. Verify assets, real gameplay, touch/keyboard input, pause/restart and results at the public subfolder after deployment. Local tests do not verify the public release.

The old Liivo deployment is separate. Do not replace the hub's current Pages link with an unverified URL.

## Outcome regression

Run npm run verify:outcomes. Set CHROME_PATH to installed Chrome or run npx playwright install chromium first. This launches a local Vite server and checks controlled victory/defeat, rematch, title/reentry and page errors. Controlled actor deaths validate outcome wiring; they do not prove natural round difficulty.
