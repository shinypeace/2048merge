export class FruitCatalog {
  constructor(){
    this.types = [
      { id: 0, name: 'Вишня', radius: 20, colorA: '#ff6b6b', colorB: '#ff8e8e', outline: '#b94545', score: 2 },
      { id: 1, name: 'Слива', radius: 26, colorA: '#8e5cff', colorB: '#b18bff', outline: '#6a44c0', score: 4 },
      { id: 2, name: 'Абрикос', radius: 32, colorA: '#ff9e4d', colorB: '#ffd18a', outline: '#d67a2a', score: 8 },
      { id: 3, name: 'Яблоко', radius: 38, colorA: '#6dd56d', colorB: '#b6efb6', outline: '#3f9c3f', score: 16 },
      { id: 4, name: 'Груша', radius: 44, colorA: '#b3e045', colorB: '#e2f7a8', outline: '#7a9e2d', score: 32 },
      { id: 5, name: 'Апельсин', radius: 52, colorA: '#ffa500', colorB: '#ffd27a', outline: '#d68600', score: 64 },
      { id: 6, name: 'Персик', radius: 60, colorA: '#ff8a7a', colorB: '#ffd1c7', outline: '#cc6c62', score: 128 },
      { id: 7, name: 'Кокос', radius: 72, colorA: '#c8a27e', colorB: '#efd8c1', outline: '#8b6f56', score: 256 },
      { id: 8, name: 'Дыня', radius: 86, colorA: '#c2f06f', colorB: '#eafbb9', outline: '#92b74b', score: 512 },
      { id: 9, name: 'Арбуз', radius: 104, colorA: '#5bd96e', colorB: '#c3f7cc', outline: '#2aa34c', score: 1024 },
    ];
  }

  getType(id){
    return this.types[Math.min(id, this.types.length - 1)];
  }

  drawFruit(ctx, x, y, typeId, scale = 1){
    const t = this.getType(typeId);
    const r = t.radius * scale;

    const grad = ctx.createRadialGradient(x - r*0.4, y - r*0.5, r*0.2, x, y, r);
    grad.addColorStop(0, t.colorB);
    grad.addColorStop(1, t.colorA);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fill();

    ctx.lineWidth = Math.max(2, r*0.08);
    ctx.strokeStyle = t.outline;
    ctx.stroke();

    // highlight
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.ellipse(x - r*0.35, y - r*0.45, r*0.25, r*0.15, -0.6, 0, Math.PI*2);
    ctx.fill();

    // subtle bottom shadow
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.ellipse(x + r*0.2, y + r*0.3, r*0.5, r*0.25, 0.6, 0, Math.PI*2);
    ctx.fill();
  }
}