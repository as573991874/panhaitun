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

// ======================== 程序化修仙 BGM（五声音阶，剧情/战斗两套） ========================
// 全程 WebAudio 合成，零音频资源。剧情：慢速古筝式拨弦 + 低音持续；战斗：鼓点 + 五声快奏。
G.music = {
  mode: null,          // 'story' | 'battle' | null
  muted: false,
  timer: null,
  step: 0,
  next: 0,
  bar: 0,
  // 宫调五声（C D E G A），战斗用羽调（A C D E G）更紧
  storyScale: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.26],
  battleScale: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25],
  melodyIdx: 2,

  set(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.step = 0; this.bar = 0; this.next = 0;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 80);
  },
  toggle() { this.muted = !this.muted; },

  tick() {
    const c = G.audio.ctx;
    if (!c || !this.mode || this.muted || c.state !== 'running') return;
    const now = c.currentTime;
    if (this.next < now) this.next = now + 0.06;
    const stepDur = this.mode === 'battle' ? 0.125 : 0.24; // 战斗 120bpm 十六分 / 剧情舒缓
    while (this.next < now + 0.3) {
      if (this.mode === 'battle') this.battleStep(this.next);
      else if (this.mode === 'story') this.storyStep(this.next); // 'cg' 等其他模式静音

      this.next += stepDur;
      this.step++;
      if (this.step % 16 === 0) this.bar++;
    }
  },

  // ---- 合成器 ----
  pluck(f, t, vol, dur) { // 古筝式拨弦：双振荡微失谐
    const c = G.audio.ctx;
    for (const det of [1, 1.003]) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f * det, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (dur || 0.9));
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + (dur || 0.9) + 0.05);
    }
  },
  drone(f, t, dur, vol) { // 低音铺底
    const c = G.audio.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  },
  kick(t) {
    const c = G.audio.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.30, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.2);
  },
  hat(t, vol) {
    const c = G.audio.ctx;
    const n = c.sampleRate * 0.04;
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = buf;
    g.gain.setValueAtTime(vol, t);
    s.connect(g); g.connect(c.destination);
    s.start(t);
  },
  gong(t) { // 锣：段落感
    const c = G.audio.ctx;
    this.drone(98, t, 1.6, 0.10);
    this.drone(147.2, t, 1.4, 0.05);
    const n = c.sampleRate * 0.5;
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3) * 0.5;
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = buf;
    g.gain.setValueAtTime(0.08, t);
    s.connect(g); g.connect(c.destination);
    s.start(t);
  },

  // ---- 剧情段落：疏朗的拨弦漫步 ----
  storyStep(t) {
    const s = this.step % 16;
    // 低音铺底：每 4 小节换根音
    if (this.step % 32 === 0) {
      const roots = [130.8, 98.0, 110.0, 130.8];
      this.drone(roots[(this.bar >> 1) % 4], t, 7.5, 0.055);
    }
    // 拨弦：随机漫步，三分之一概率休止
    if (s % 2 === 0 && Math.random() < 0.62) {
      this.melodyIdx += G.util.randInt(-2, 2);
      this.melodyIdx = G.util.clamp(this.melodyIdx, 0, this.storyScale.length - 1);
      this.pluck(this.storyScale[this.melodyIdx], t, 0.05, 1.1);
      // 偶尔加一个低八度和音
      if (Math.random() < 0.2) this.pluck(this.storyScale[this.melodyIdx] / 2, t + 0.02, 0.03, 1.3);
    }
  },

  // ---- 战斗段落：鼓点驱动的五声快奏 ----
  battleStep(t) {
    const s = this.step % 16;
    // 鼓组
    if (s === 0 || s === 6 || s === 10) this.kick(t);
    if (s % 2 === 0) this.hat(t, s % 4 === 2 ? 0.05 : 0.025);
    // 低音：根音脉冲（每 2 小节换）
    const roots = [110.0, 98.0, 87.31, 110.0];
    if (s === 0 || s === 6 || s === 10) {
      const c = G.audio.ctx;
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(roots[(this.bar >> 1) % 4] / 2, t);
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + 0.2);
    }
    // 五声骑士奏：反拍高概率
    if (s % 2 === 1 && Math.random() < 0.55) {
      this.melodyIdx += G.util.randInt(-2, 3);
      this.melodyIdx = G.util.clamp(this.melodyIdx, 0, this.battleScale.length - 1);
      this.pluck(this.battleScale[this.melodyIdx], t, 0.045, 0.35);
    }
    // 每 8 小节一声锣
    if (this.step % 128 === 0) this.gong(t);
  },
};
