// ======================== CG 过场（视频画进 canvas，跟随整体缩放） ========================
// 用法：G.CGScene 作为流程步骤整段播放；G.CGPlayer 可嵌进别的场景（如终章真相）。
// 跳过：J/点击 两段式确认；视频缺失或加载失败时自动放行，不卡流程。

class CGPlayer {
  constructor(src, onDone) {
    this.onDone = onDone;
    this.done = false;
    this.t = 0;
    this.skipAskT = 0;
    const v = this.video = document.createElement('video');
    v.playsInline = true;
    v.preload = 'auto';
    v.addEventListener('ended', () => this.finish());
    v.addEventListener('error', () => this.finish());
    v.src = src;
    const p = v.play();
    if (p && p.catch) p.catch(() => {
      v.muted = true; // 自动播放被浏览器拦下时静音重试（Electron 里不会走到这）
      const p2 = v.play();
      if (p2 && p2.catch) p2.catch(() => this.finish());
    });
  }
  finish() {
    if (this.done) return;
    this.done = true;
    try { this.video.pause(); this.video.removeAttribute('src'); this.video.load(); } catch (e) { }
    if (this.onDone) this.onDone();
  }
  update(dt) {
    if (this.done) return;
    this.t += dt;
    this.skipAskT = Math.max(0, this.skipAskT - dt);
    if (G.Input.just.attack || G.Input.mouse.just) {
      if (this.skipAskT > 0) this.finish();
      else this.skipAskT = 1.5;
    }
    // 保险：8 秒还读不出画面（文件损坏/编码不支持），直接放行
    if (this.t > 8 && this.video.readyState < 2) this.finish();
  }
  draw(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, G.W, G.H);
    const v = this.video;
    if (v.readyState >= 2 && v.videoWidth) {
      const s = Math.min(G.W / v.videoWidth, G.H / v.videoHeight);
      const w = v.videoWidth * s, h = v.videoHeight * s;
      ctx.drawImage(v, (G.W - w) / 2, (G.H - h) / 2, w, h);
      const fade = Math.min(1, this.t / 0.6); // 开场淡入
      if (fade < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - fade})`; ctx.fillRect(0, 0, G.W, G.H); }
    } else {
      ctx.fillStyle = '#5a7684';
      ctx.font = G.font(24);
      ctx.textAlign = 'center';
      ctx.fillText('…' + '…'.repeat(Math.floor(this.t * 2) % 3 + 1), G.W / 2, G.H / 2);
    }
    ctx.textAlign = 'right';
    ctx.font = G.font(20);
    if (this.skipAskT > 0) { ctx.fillStyle = '#e8c170'; ctx.fillText('再按一次【J】跳过', G.W - 60, G.H - 40); }
    else if (this.t > 2) { ctx.fillStyle = 'rgba(138,151,165,0.45)'; ctx.fillText('【J】跳过', G.W - 60, G.H - 40); }
  }
}
G.CGPlayer = CGPlayer;

class CGScene {
  constructor(src, onDone) {
    this.src = src;
    this.onDone = onDone;
    this.player = null;
    this.music = 'cg';   // 静音 BGM，让位给 CG 自己的声音
  }
  enter() { this.player = new CGPlayer(this.src, this.onDone); }
  exit() { if (this.player) { this.player.onDone = null; this.player.finish(); } }
  update(dt) { this.player.update(dt); }
  draw(ctx) { this.player.draw(ctx); }
}
G.CGScene = CGScene;
