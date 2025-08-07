export class Sfx {
  constructor(){
    this.enabled = true;
    this.ctx = null;
    this.vibrateEnabled = true;
  }

  ensureCtx(){
    if (!this.ctx){
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  }

  click(){ this.tone(400, 0.04, 'sine', -8); }
  pop(){ this.tone(520, 0.07, 'triangle', -6); }
  merge(){ this.chirp(320, 720, 0.18, -4); }
  fail(){ this.tone(140, 0.25, 'sawtooth', -12); }

  vibrate(ms=20){
    if (!this.vibrateEnabled) return;
    try { navigator.vibrate?.(ms); } catch {}
  }

  tone(freq, dur, type='sine', gainDb=-10){
    if (!this.enabled) return;
    this.ensureCtx();
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = dbToGain(gainDb);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + dur);
    g.gain.setTargetAtTime(0.0001, t0 + dur*0.3, 0.08);
  }

  chirp(from, to, dur, gainDb=-10){
    if (!this.enabled) return;
    this.ensureCtx();
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(from, t0);
    o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.value = dbToGain(gainDb);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + dur);
    g.gain.setTargetAtTime(0.0001, t0 + dur*0.3, 0.08);
  }
}

function dbToGain(db){
  return Math.pow(10, db/20);
}