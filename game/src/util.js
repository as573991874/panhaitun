// 全局命名空间 + 通用工具
window.G = {
  W: 1920, H: 1080,
  time: 0,
};

G.util = {
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  angleTo: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
  rand: (a, b) => a + Math.random() * (b - a),
  randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  // 角度差归一到 [-PI, PI]
  angDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  },
};

G.font = (size, weight) => `${weight || 700} ${size}px "Microsoft YaHei","PingFang SC",sans-serif`;

// 简易事件总线
G.events = {
  _m: {},
  on(name, fn) { (this._m[name] = this._m[name] || []).push(fn); },
  emit(name, data) { (this._m[name] || []).forEach(fn => fn(data)); },
  clear(name) { this._m[name] = []; },
};

// 圆角矩形
G.rr = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// 屏幕震动
G.shake = { t: 0, mag: 0 };
G.addShake = (mag, t) => { G.shake.mag = Math.max(G.shake.mag, mag); G.shake.t = Math.max(G.shake.t, t); };
