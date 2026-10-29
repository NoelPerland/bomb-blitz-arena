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
    <div class="touch-controls" aria-label="Game controls"><div class="thumb-pad" role="group" aria-label="Drag thumb pad to move"><span class="pad-up">▲</span><span class="pad-left">◀</span><span class="pad-down">▼</span><span class="pad-right">▶</span><div class="thumb-knob"></div></div><button id="drop-bomb">BOMB<span>Tap to drop</span></button></div><div class="game-actions"><button id="restart-game">Restart</button><span>WASD / arrows · Space to bomb</span><button id="menu-game">Menu</button></div>
    <p class="title-help">Drag the thumb pad to move · tap BOMB to drop<br>Keyboard: WASD / arrows + Space</p>
  </div>
`;

const game = createGame('game-root');
// CSS changes the viewport between title, play and rotation; refresh pointer mapping too.
new ResizeObserver(() => game.scale.refresh()).observe(document.querySelector('#game-root')!);
const statsBar = document.createElement('div');
statsBar.className = 'match-stats';
statsBar.hidden = true;
document.querySelector('.touch-controls')!.before(statsBar);
let previousStats = '';
game.events.on('arena-title', () => { statsBar.hidden = true; document.querySelector('.app-shell')!.classList.add('is-title'); if((window as any).__BOMB_TOUCH__) (window as any).__BOMB_TOUCH__.direction='none'; });
game.events.on('arena-stats', (stats: Record<string, number>) => {
  statsBar.hidden = false; document.querySelector('.app-shell')!.classList.remove('is-title');
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
const pad=document.querySelector<HTMLElement>('.thumb-pad')!,knob=document.querySelector<HTMLElement>('.thumb-knob')!;
let activePointer:number|null=null;
function resetPad(){activePointer=null;touch.direction='none';knob.style.transform='translate(0px,0px)';pad.classList.remove('held');}
function steer(event:PointerEvent){
 const bounds=pad.getBoundingClientRect(),dx=event.clientX-bounds.left-bounds.width/2,dy=event.clientY-bounds.top-bounds.height/2,distance=Math.hypot(dx,dy),scale=Math.min(1,44/Math.max(1,distance));
 knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;
 if(distance<12){touch.direction='none';return;}
 const horizontal=touch.direction==='left'||touch.direction==='right';
 const useX=touch.direction==='none'?Math.abs(dx)>Math.abs(dy):horizontal?Math.abs(dy)<Math.abs(dx)*1.15+4:Math.abs(dx)>Math.abs(dy)*1.15+4;
 touch.direction=useX?(dx<0?'left':'right'):(dy<0?'up':'down');
}
pad.addEventListener('pointerdown',event=>{if(activePointer!==null)return;event.preventDefault();activePointer=event.pointerId;pad.setPointerCapture(event.pointerId);pad.classList.add('held');steer(event);});
pad.addEventListener('pointermove',event=>{if(activePointer===event.pointerId)steer(event);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(name,event=>{if(activePointer===(event as PointerEvent).pointerId)resetPad();});
window.addEventListener('blur',resetPad);
game.events.on('arena-title',resetPad);
document.querySelector('#drop-bomb')!.addEventListener('pointerdown',event=>{event.preventDefault();window.dispatchEvent(new Event('bomb-place'));});
document.querySelector('#restart-game')!.addEventListener('click',()=>{touch.direction='none';game.scene.getScenes(true)[0].scene.start('game');});
document.querySelector('#menu-game')!.addEventListener('click',()=>{touch.direction='none';game.scene.getScene('game').scene.start('title');statsBar.hidden=true;});
window.addEventListener('blur',()=>{touch.direction='none';});
