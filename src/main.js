import { Game } from './modules/game.js';
import { UI } from './modules/ui.js';
import { Stats } from './modules/stats.js';
import { Sfx } from './modules/sfx.js';

const canvas = document.getElementById('game-canvas');
const nextPreview = document.getElementById('next-preview');

const ui = new UI();
const stats = new Stats();
const sfx = new Sfx();

const game = new Game({ canvas, nextPreview, ui, stats, sfx });

ui.bindMainMenu({
  onPlay: () => game.startNewGame(),
  onRules: () => ui.showRules(),
  onStats: () => ui.showStats(stats),
  onSettings: () => ui.showSettings({ sfx })
});

ui.bindInGame({
  onPause: () => game.pause(),
});

ui.bindPauseMenu({
  onResume: () => game.resume(),
  onRestart: () => game.restart(),
  onMenu: () => game.backToMenu(),
});

ui.bindGameOver({
  onRetry: () => game.restart(),
  onShare: () => ui.shareScore(game.getScore()),
  onMenu: () => game.backToMenu(),
});

function resizeCanvas() {
  // Maintain 9:16 aspect for a vertical game, and scale to device pixel ratio
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const containerW = window.innerWidth;
  const containerH = window.innerHeight;
  const targetAspect = 9/16;
  let width = containerW;
  let height = Math.round(width / 9 * 16);
  if (height > containerH){
    height = containerH;
    width = Math.round(height / 16 * 9);
  }
  const cssW = width;
  const cssH = height;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  game.onResize({ width: canvas.width, height: canvas.height, dpr });
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

ui.showMainMenu();