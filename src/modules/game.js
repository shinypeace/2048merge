import { Random } from '../utils/random.js';
import { clamp, lerp } from '../utils/math.js';
import { FruitCatalog } from './fruit_catalog.js';
import { Particles } from './particles.js';

const GAME_STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
};

export class Game {
  constructor({ canvas, nextPreview, ui, stats, sfx }){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nextPreviewCanvas = nextPreview;
    this.nextPreviewCtx = nextPreview.getContext('2d');
    this.ui = ui;
    this.stats = stats;
    this.sfx = sfx;

    this.rng = new Random();
    this.catalog = new FruitCatalog();
    this.particles = new Particles();

    this.state = GAME_STATE.MENU;

    this.worldWidth = 720;
    this.worldHeight = 1280;
    this.groundY = this.worldHeight - 40;
    this.leftWallX = 60;
    this.rightWallX = this.worldWidth - 60;

    this.fruits = [];
    this.score = 0;
    this.bestChainMultiplier = 1;

    this.activeFruit = null; // Fruit the player is moving before drop
    this.nextFruitType = 0;

    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.comboWindow = 1.25; // seconds

    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedDt = 1/120;

    this.input = {
      isPointerDown: false,
      pointerX: this.worldWidth/2,
    };

    this.bindInput();

    this.animationFrame = null;
    this.tweenShake = 0; // screenshake intensity
    this.dangerTimer = 0;
    this.dangerThreshold = 1.2; // seconds above line before game over
  }

  onResize({ width, height, dpr }){
    this.dpr = dpr;
    this.worldWidth = width / dpr;
    this.worldHeight = height / dpr;
    this.groundY = this.worldHeight - 40;
    this.leftWallX = 40;
    this.rightWallX = this.worldWidth - 40;
  }

  bindInput(){
    const onMove = (x) => {
      this.input.pointerX = clamp(x, this.leftWallX + 20, this.rightWallX - 20);
      if (this.activeFruit){
        this.activeFruit.x = this.input.pointerX;
      }
    };

    this.canvas.addEventListener('pointerdown', (e)=>{
      this.canvas.setPointerCapture?.(e.pointerId);
      this.input.isPointerDown = true;
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / (rect.width) * this.worldWidth;
      onMove(x);
    });
    this.canvas.addEventListener('pointermove', (e)=>{
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / (rect.width) * this.worldWidth;
      onMove(x);
    });
    this.canvas.addEventListener('pointerup', ()=>{
      this.input.isPointerDown = false;
      this.dropActiveFruit();
    });

    window.addEventListener('keydown', (e)=>{
      if (this.state !== GAME_STATE.PLAYING) return;
      if (e.key === ' ' || e.key === 'ArrowDown'){
        this.dropActiveFruit();
      }
      if (e.key === 'Escape'){
        if (this.state === GAME_STATE.PLAYING) this.pause();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a'){
        this.input.pointerX = clamp(this.input.pointerX - 16, this.leftWallX + 20, this.rightWallX - 20);
        if (this.activeFruit) this.activeFruit.x = this.input.pointerX;
      }
      if (e.key === 'ArrowRight' || e.key === 'd'){
        this.input.pointerX = clamp(this.input.pointerX + 16, this.leftWallX + 20, this.rightWallX - 20);
        if (this.activeFruit) this.activeFruit.x = this.input.pointerX;
      }
    });
  }

  startNewGame(){
    this.state = GAME_STATE.PLAYING;
    this.ui.hideMainMenu();
    this.ui.hideGameOver();
    this.ui.showHud();
    this.resetWorld();
    this.spawnActiveFruit();
    this.lastTime = performance.now() / 1000;
    this.loop();
  }

  resetWorld(){
    this.rng.reseed();
    this.fruits = [];
    this.particles.items = [];
    this.score = 0;
    this.bestChainMultiplier = 1;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.ui.setScore(this.score);
    this.t0 = performance.now() / 1000;
    this.spawnQueue();
  }

  spawnQueue(){
    // Start with lower-level fruits; gradually increase difficulty over time
    this.nextFruitType = this.pickNextFruitType();
    this.drawNextPreview();
  }

  pickNextFruitType(){
    // Weighted: early game lower types are more likely
    const playTime = Math.max(0, (performance.now()/1000) - (this.t0||0));
    const difficulty = clamp(playTime / 180, 0, 1); // ramps over 3 minutes
    const maxType = Math.min(5 + Math.floor(difficulty*3), this.catalog.types.length - 3);
    const base = this.rng.int(0, Math.max(2, maxType));
    return base;
  }

  drawNextPreview(){
    const ctx = this.nextPreviewCtx;
    const c = this.nextPreviewCanvas;
    ctx.clearRect(0,0,c.width,c.height);
    ctx.save();
    ctx.scale(this.dpr||1, this.dpr||1);
    const scale = Math.min(c.width, c.height) / (this.dpr||1) / (this.catalog.getType(this.nextFruitType).radius*2+20);
    const x = (c.width/(this.dpr||1))/2;
    const y = (c.height/(this.dpr||1))/2 + 6;
    this.catalog.drawFruit(ctx, x, y, this.nextFruitType, scale);
    ctx.restore();
  }

  spawnActiveFruit(){
    const type = this.nextFruitType;
    const t = this.catalog.getType(type);
    this.activeFruit = {
      id: cryptoRandomId(),
      type,
      x: this.worldWidth/2,
      y: t.radius + 10,
      vx: 0,
      vy: 0,
      radius: t.radius,
      resting: false,
      scale: 1,
      mergeLock: false,
    };
    this.nextFruitType = this.pickNextFruitType();
    this.drawNextPreview();
  }

  dropActiveFruit(){
    if (!this.activeFruit || this.state !== GAME_STATE.PLAYING) return;
    this.fruits.push(this.activeFruit);
    this.activeFruit = null;
    this.sfx.pop();
    this.comboTimer = 0; // start combo window after action
  }

  pause(){
    if (this.state !== GAME_STATE.PLAYING) return;
    this.state = GAME_STATE.PAUSED;
    this.ui.showPauseMenu();
  }

  resume(){
    if (this.state !== GAME_STATE.PAUSED) return;
    this.state = GAME_STATE.PLAYING;
    this.ui.hidePauseMenu();
  }

  restart(){
    this.state = GAME_STATE.PLAYING;
    this.ui.hideGameOver();
    this.ui.hidePauseMenu();
    this.ui.showHud();
    this.resetWorld();
    this.spawnActiveFruit();
  }

  backToMenu(){
    this.state = GAME_STATE.MENU;
    this.ui.hideHud();
    this.ui.hidePauseMenu();
    this.ui.hideGameOver();
    this.ui.showMainMenu();
    cancelAnimationFrame(this.animationFrame);
  }

  getScore(){ return this.score; }

  update(dt){
    if (this.state !== GAME_STATE.PLAYING) return;

    // Difficulty tweaks: slowly increase gravity in long runs
    const elapsed = Math.max(0, (performance.now()/1000) - (this.t0||0));
    const gravity = 1500 + Math.min(900, elapsed*3);

    // Move active fruit with slight bobbing
    if (this.activeFruit){
      const yBase = this.catalog.getType(this.activeFruit.type).radius + 14;
      this.activeFruit.y = yBase + Math.sin(performance.now()/180) * 2;
    }

    // Physics integration
    for (const f of this.fruits){
      if (!f) continue;
      f.vy += gravity * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      // wall collisions
      if (f.x - f.radius < this.leftWallX){ f.x = this.leftWallX + f.radius; f.vx *= -0.35; }
      if (f.x + f.radius > this.rightWallX){ f.x = this.rightWallX - f.radius; f.vx *= -0.35; }
      // ground
      if (f.y + f.radius > this.groundY){ f.y = this.groundY - f.radius; f.vy *= -0.25; f.vx *= 0.98; }
    }

    // Pairwise circle collision and merge check
    for (let i=0;i<this.fruits.length;i++){
      const a = this.fruits[i]; if (!a) continue;
      for (let j=i+1;j<this.fruits.length;j++){
        const b = this.fruits[j]; if (!b) continue;
        const dx = b.x - a.x; const dy = b.y - a.y;
        const dist2 = dx*dx + dy*dy;
        const minDist = a.radius + b.radius;
        if (dist2 < minDist*minDist){
          const dist = Math.sqrt(dist2) || 0.0001;
          const nx = dx/dist; const ny = dy/dist;
          const overlap = minDist - dist;
          const totalMass = a.radius + b.radius;
          const am = b.radius/totalMass; const bm = a.radius/totalMass;
          a.x -= nx * overlap * am;
          a.y -= ny * overlap * am;
          b.x += nx * overlap * bm;
          b.y += ny * overlap * bm;
          // velocity response
          const rvx = b.vx - a.vx; const rvy = b.vy - a.vy;
          const velAlongNormal = rvx*nx + rvy*ny;
          if (velAlongNormal < 0){
            const e = 0.15;
            const jImp = -(1+e) * velAlongNormal / (am + bm);
            const ix = jImp * nx; const iy = jImp * ny;
            a.vx -= ix * am; a.vy -= iy * am;
            b.vx += ix * bm; b.vy += iy * bm;
          }

          // Merge check
          if (!a.mergeLock && !b.mergeLock && a.type === b.type){
            const relSpeed = Math.hypot(rvx, rvy);
            if (relSpeed < 320){
              this.mergeFruits(i, j);
            }
          }
        }
      }
    }

    // Combo decay timer
    if (this.comboMultiplier > 1){
      this.comboTimer += dt;
      if (this.comboTimer > this.comboWindow){
        this.comboMultiplier = 1;
        this.ui.setCombo(this.comboMultiplier);
      }
    }

    // Game over check: if any fruit above safety line
    const topLine = 130;
    let anyAbove = false;
    for (const f of this.fruits){
      if (f.y - f.radius < topLine){ anyAbove = true; break; }
    }
    if (anyAbove){
      this.dangerTimer += dt;
      if (this.dangerTimer >= this.dangerThreshold){ this.gameOver(); }
    } else {
      this.dangerTimer = Math.max(0, this.dangerTimer - dt*0.6);
    }

    // Particles
    this.particles.update(dt);
  }

  mergeFruits(i, j){
    const a = this.fruits[i];
    const b = this.fruits[j];
    if (!a || !b) return;
    const nextType = Math.min(a.type + 1, this.catalog.types.length - 1);

    // Create new fruit at weighted average position
    const total = a.radius + b.radius;
    const x = (a.x*a.radius + b.x*b.radius) / total;
    const y = (a.y*a.radius + b.y*b.radius) / total;
    const t = this.catalog.getType(nextType);
    const merged = {
      id: cryptoRandomId(),
      type: nextType,
      x, y,
      vx: (a.vx + b.vx) * 0.2,
      vy: (a.vy + b.vy) * 0.2,
      radius: t.radius,
      resting: false,
      scale: 1.15,
      mergeLock: true,
    };

    this.fruits[i] = merged;
    this.fruits.splice(j,1);

    // Score & combo
    const baseScore = t.score;
    this.comboMultiplier = Math.min(9, this.comboMultiplier + 1);
    this.bestChainMultiplier = Math.max(this.bestChainMultiplier, this.comboMultiplier);
    this.comboTimer = 0;
    const gained = Math.round(baseScore * this.comboMultiplier);
    this.score += gained;
    this.ui.setScore(this.score);
    this.ui.setCombo(this.comboMultiplier);

    // FX
    this.sfx.merge();
    this.sfx.vibrate(35);
    this.tweenShake = Math.min(1, this.tweenShake + 0.25);
    this.particles.spawnBurst({ x, y, baseHue: 20 + nextType*20, count: 12 + Math.floor(nextType*1.5), power: 160 + nextType*10 });
  }

  gameOver(){
    if (this.state !== GAME_STATE.PLAYING) return;
    this.state = GAME_STATE.GAME_OVER;
    this.sfx.fail();
    this.ui.hideHud();
    this.ui.setFinalScore(this.score);
    this.ui.showGameOver();

    const bestFruit = this.fruits.reduce((m,f)=> f.type > m.type ? f : m, { type: 0 });
    const duration = Math.max(0, (performance.now()/1000) - (this.t0||0));
    this.stats.recordGame({
      score: this.score,
      bestFruitId: bestFruit.type,
      bestFruitName: this.catalog.getType(bestFruit.type).name,
      bestCombo: this.bestChainMultiplier,
      durationSec: duration,
    });
  }

  loop(){
    const now = performance.now()/1000;
    const dt = Math.min(0.033, now - this.lastTime);
    this.lastTime = now;

    // Fixed step for stability
    this.accumulator += dt;
    while (this.accumulator >= this.fixedDt){
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    this.draw();

    if (this.state !== GAME_STATE.MENU){
      this.animationFrame = requestAnimationFrame(()=>this.loop());
    }
  }

  draw(){
    const ctx = this.ctx;
    const w = this.worldWidth; const h = this.worldHeight;
    ctx.save();
    ctx.scale(this.dpr||1, this.dpr||1);

    // Screen shake
    if (this.tweenShake > 0){
      const s = this.tweenShake * 4;
      const ox = (Math.random()*2-1) * s;
      const oy = (Math.random()*2-1) * s;
      ctx.translate(ox, oy);
      this.tweenShake = Math.max(0, this.tweenShake - 0.06);
    }

    // Clear
    ctx.clearRect(0,0,w,h);

    // Background grid subtle
    drawBackground(ctx, w, h);

    // Walls and ground
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(this.leftWallX-6, 80, 6, this.groundY-80);
    ctx.fillRect(this.rightWallX, 80, 6, this.groundY-80);
    ctx.fillRect(this.leftWallX, this.groundY, this.rightWallX - this.leftWallX, 6);

    // Top safe line
    const alpha = 0.25 + 0.4 * Math.min(1, this.dangerTimer / this.dangerThreshold);
    ctx.strokeStyle = `rgba(235,87,87,${alpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6,6]);
    ctx.beginPath();
    ctx.moveTo(this.leftWallX, 130);
    ctx.lineTo(this.rightWallX, 130);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fruits
    for (const f of this.fruits){
      if (!f) continue;
      if (f.scale > 1){ f.scale = lerp(f.scale, 1, 0.12); }
      this.catalog.drawFruit(ctx, f.x, f.y, f.type, f.scale);
      f.mergeLock = false; // unlock after draw
    }

    // Active fruit preview position
    if (this.activeFruit){
      this.catalog.drawFruit(ctx, this.activeFruit.x, this.activeFruit.y, this.activeFruit.type, 1);
      // ghost line
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#1f2a33';
      ctx.beginPath();
      ctx.moveTo(this.activeFruit.x, 0);
      ctx.lineTo(this.activeFruit.x, this.activeFruit.y - this.activeFruit.radius);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Particles
    this.particles.draw(ctx);

    ctx.restore();
  }
}

function cryptoRandomId(){
  if (crypto?.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function drawBackground(ctx, w, h){
  // soft grid
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.03)';
  ctx.lineWidth = 1;
  const step = 32;
  for (let x=0; x<w; x+=step){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
  }
  for (let y=0; y<h; y+=step){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }
  ctx.restore();
}