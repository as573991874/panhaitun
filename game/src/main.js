// ======================== 启动 / 主循环 ========================
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // 等比缩放适配窗口（letterbox）
  function resize() {
    const s = Math.min(window.innerWidth / G.W, window.innerHeight / G.H);
    canvas.style.width = G.W * s + 'px';
    canvas.style.height = G.H * s + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  G.Input.init(canvas);
  G.AgeRating.init();

  // 菜单用方向键补充映射
  Object.assign(G.Input.map, { ArrowUp: 'up', ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right' });

  G.scene = null;
  G.setScene = s => {
    if (G.scene && G.scene.exit) G.scene.exit();
    G.scene = s;
    if (s.enter) s.enter();
    G.music.set(s.music || 'story'); // 剧情/战斗 BGM 随场景切换
  };

  G.setScene(new G.TitleScene());

  const STEP = 1 / 60;
  let acc = 0, last = performance.now();

  function render() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.save();
    if (G.shake.t > 0) {
      const m = G.shake.mag * (G.shake.t / 0.35);
      ctx.translate(G.util.rand(-m, m), G.util.rand(-m, m));
    }
    G.scene.draw(ctx);
    ctx.restore();
  }

  // 调试用：直接胜利当前战斗（Ctrl+Shift+9 触发，见 input.js）
  G.debugWin = () => {
    const b = G.currentBattle;
    if (!b) return;
    if (b.startWin) {
      if (!['fight', 'bossIntro', 'curse'].includes(b.state)) return;
      b.enemies = []; b.markers = []; b.bullets = [];
      b.bossSpawned = true;          // 不再进 bossIntro
      b.wave = b.def.waves.length;   // 不再出下一波
      b.startWin();
    } else if (b.phase === 'fight') {
      b.t = 999;                     // 终章：快进整段封印剧本到真相
    }
  };

  // 调试用：后台标签页 rAF 停摆时手动推帧
  G.step = (n) => {
    for (let i = 0; i < (n || 1); i++) {
      G.time += STEP;
      G.shake.t = Math.max(0, G.shake.t - STEP);
      G.scene.update(STEP);
      G.Input.endFrame();
    }
    render();
  };
  function loop(now) {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    while (acc >= STEP) {
      acc -= STEP;
      G.time += STEP;
      G.shake.t = Math.max(0, G.shake.t - STEP);
      if (G.shake.t <= 0) G.shake.mag = 0;
      if (G.Input.just.mute) G.music.toggle();
      G.scene.update(STEP);
      G.Input.endFrame();
    }
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
