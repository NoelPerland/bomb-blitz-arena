import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:5195}});await server.listen();
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5195');await page.waitForFunction(()=>window.__BOMB_BLITZ__?.game.scene.isActive('title'));await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__BOMB_BLITZ__.game.scene.isActive('game'));
for(const win of [true,false]){
await page.evaluate(win=>{const s=window.__BOMB_BLITZ__.game.scene.getScene('game');s.actors.forEach(a=>{if(a.state.isHuman!==win)s.killActor(a)});s.checkRoundOutcome()},win);
await page.waitForFunction(win=>window.__BOMB_BLITZ__.game.scene.getScene('game').roundOutcome?.playerWon===win,win);
await page.waitForTimeout(1100);await page.keyboard.press('Enter');await page.waitForFunction(()=>!window.__BOMB_BLITZ__.game.scene.getScene('game').roundOutcome);
}
await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__BOMB_BLITZ__.game.scene.isActive('title'));await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__BOMB_BLITZ__.game.scene.isActive('game'));assert.deepEqual(errors,[]);console.log('Bomb: victory/defeat result, rematch, title/reentry pass.');
}finally{await browser.close();await server.close()}

