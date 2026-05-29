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
    <p class="app-shell__caption">Local arcade showdown MVP | Arrow Keys or WASD | Space | Esc</p>
  </div>
`;

const game = createGame('game-root');

const debugWindow = window as Window & {
  __BOMB_BLITZ__?: {
    game: Phaser.Game;
  };
};

debugWindow.__BOMB_BLITZ__ = { game };
