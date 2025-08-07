export class Random {
  constructor(seed = Date.now() >>> 0){
    this.state = seed >>> 0;
  }

  reseed(seed = Date.now() >>> 0){
    this.state = seed >>> 0;
  }

  next(){
    // xorshift32
    let x = this.state;
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    this.state = x >>> 0;
    return this.state;
  }

  float(min=0, max=1){
    return min + (this.next() / 0xffffffff) * (max - min);
  }

  int(min, max){
    return Math.floor(this.float(min, max+1));
  }

  choice(arr){
    return arr[Math.floor(this.float(0, arr.length))];
  }
}