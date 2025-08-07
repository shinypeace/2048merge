const KEY = 'fruit-merge-stats-v1';

export class Stats {
  constructor(){
    this.data = {
      bestScore: 0,
      bestFruitId: 0,
      bestFruitName: '—',
      bestCombo: 1,
      totalGames: 0,
      totalScore: 0,
      timePlayedSec: 0,
    };
    this.load();
  }

  load(){
    try{
      const raw = localStorage.getItem(KEY);
      if (raw){
        const obj = JSON.parse(raw);
        Object.assign(this.data, obj);
      }
    } catch {}
  }

  save(){
    try{ localStorage.setItem(KEY, JSON.stringify(this.data)); } catch {}
  }

  recordGame({ score, bestFruitId, bestFruitName, bestCombo, durationSec }){
    this.data.totalGames += 1;
    this.data.totalScore += score;
    this.data.timePlayedSec += Math.max(0, Math.floor(durationSec));
    if (score > this.data.bestScore) this.data.bestScore = score;
    if (bestFruitId > this.data.bestFruitId){
      this.data.bestFruitId = bestFruitId;
      this.data.bestFruitName = bestFruitName;
    }
    if (bestCombo > this.data.bestCombo) this.data.bestCombo = bestCombo;
    this.save();
  }

  getAll(){
    const avgScore = this.data.totalGames ? Math.round(this.data.totalScore / this.data.totalGames) : 0;
    return { ...this.data, avgScore };
  }
}