import Phaser from 'phaser';
import './style.css';
import { createGame } from './game/createGame';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root was not found.');
}

app.innerHTML = `
  <div class="app-shell">
    <div class="app-shell__frame">
      <div id="game-root" class="game-root"></div>
      <div class="app-shell__shine"></div>
      <div class="app-shell__scanlines"></div>
    </div>
    <div class="touch-controls" aria-label="Game controls"><div class="direction-pad"><button data-direction="up" aria-label="Move up">▲</button><button data-direction="left" aria-label="Move left">◀</button><button data-direction="down" aria-label="Move down">▼</button><button data-direction="right" aria-label="Move right">▶</button></div><button id="drop-bomb">BOMB<span>Drop & escape</span></button></div><div class="game-actions"><button id="restart-game">Restart</button><span>WASD / arrows · Space to bomb</span><button id="menu-game">Menu</button></div>
    <p class="app-shell__mobile-note">Touch or keyboard. Stay clear of your blast!</p>
  </div>
`;

const game = createGame('game-root');
const statsBar = document.createElement('div');
statsBar.className = 'match-stats';
statsBar.hidden = true;
document.querySelector('.touch-controls')!.before(statsBar);
let previousStats = '';
game.events.on('arena-title', () => { statsBar.hidden = true; });
game.events.on('arena-stats', (stats: Record<string, number>) => {
  statsBar.hidden = false;
  const next = JSON.stringify(stats);
  if(next === previousStats) return;
  previousStats = next;
  statsBar.innerHTML = Object.entries(stats).map(([key,value]) => `<span>${key === 'fire' ? 'BLAST' : key.toUpperCase()}<b>${value}</b></span>`).join('');
});

const debugWindow = window as Window & {
  __BOMB_BLITZ__?: {
    game: Phaser.Game;
  };
};

debugWindow.__BOMB_BLITZ__ = { game };

const touch = { direction: 'none', bomb: false };
(window as any).__BOMB_TOUCH__ = touch;
document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(button => {
 button.addEventListener('pointerdown', event => {event.preventDefault();button.setPointerCapture(event.pointerId);touch.direction=button.dataset.direction!;button.classList.add('pressed');});
 for(const name of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(name,()=>{touch.direction='none';button.classList.remove('pressed');});
});
document.querySelector('#drop-bomb')!.addEventListener('pointerdown',event=>{event.preventDefault();window.dispatchEvent(new Event('bomb-place'));});
document.querySelector('#restart-game')!.addEventListener('click',()=>{touch.direction='none';game.scene.getScenes(true)[0].scene.start('game');});
document.querySelector('#menu-game')!.addEventListener('click',()=>{touch.direction='none';game.scene.getScene('game').scene.start('title');statsBar.hidden=true;});
window.addEventListener('blur',()=>{touch.direction='none';});
