// 极简 WebAudio 合成音效（无外部资源）
G.audio = {
  ctx: null,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* 无声环境 */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  // 基础音：type 波形 / freq 起止频率 / dur 时长 / vol 音量
  tone(type, f0, f1, dur, vol, delay) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },
  noise(dur, vol, delay) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const n = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    s.buffer = buf;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(g); g.connect(this.ctx.destination);
    s.start(t0);
  },
  hit()      { this.tone('square', 220, 110, 0.08, 0.15); },
  hit3()     { this.tone('square', 330, 90, 0.14, 0.2); this.noise(0.08, 0.1); },
  dash()     { this.tone('sine', 700, 200, 0.15, 0.12); },
  boom()     { this.tone('sawtooth', 160, 40, 0.4, 0.25); this.noise(0.3, 0.2); },
  heal()     { this.tone('sine', 400, 800, 0.35, 0.12); },
  hurt()     { this.tone('sawtooth', 140, 60, 0.18, 0.2); },
  punish()   { this.noise(0.45, 0.35); this.tone('sawtooth', 90, 30, 0.5, 0.3); this.tone('square', 1200, 200, 0.2, 0.1); },
  lock()     { this.tone('square', 150, 150, 0.1, 0.2); this.tone('square', 100, 100, 0.15, 0.2, 0.12); },
  select()   { this.tone('sine', 500, 650, 0.08, 0.12); },
  confirm()  { this.tone('sine', 520, 1040, 0.18, 0.15); },
  talk()     { this.tone('sine', G.util.rand(300, 420), 300, 0.03, 0.05); },
  thatkey()  { this.tone('sine', 60, 55, 0.5, 0.25); this.tone('triangle', 880, 870, 0.1, 0.08); },
  wave()     { this.tone('triangle', 200, 500, 0.2, 0.12); },
  die()      { this.tone('sawtooth', 300, 40, 0.8, 0.25); this.noise(0.5, 0.2); },
  win()      { [523, 659, 784, 1046].forEach((f, i) => this.tone('sine', f, f, 0.22, 0.14, i * 0.11)); },
};
