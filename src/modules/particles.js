import { Random } from '../utils/random.js';

export class Particles {
  constructor(){
    this.items = [];
    this.rng = new Random();
  }

  spawnBurst({ x, y, baseHue = 20, count = 18, power = 220 }){
    for (let i=0;i<count;i++){
      const angle = this.rng.float(0, Math.PI*2);
      const speed = this.rng.float(power*0.3, power);
      this.items.push({
        x, y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        life: this.rng.float(0.5, 0.9),
        age: 0,
        size: this.rng.float(2, 6),
        color: `hsl(${Math.round(baseHue + this.rng.float(-18,18))} 80% 60%)`
      });
    }
  }

  update(dt){
    const g = 1600;
    for (const p of this.items){
      p.age += dt;
      p.vy += g*dt;
      p.x += p.vx*dt;
      p.y += p.vy*dt;
    }
    this.items = this.items.filter(p => p.age < p.life);
  }

  draw(ctx){
    for (const p of this.items){
      const t = p.age / p.life;
      const alpha = Math.max(0, 1 - t);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size*(1 + 0.2*Math.sin(t*10)), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}