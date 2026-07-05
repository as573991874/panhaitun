// ======================== UI：HUD / 那个键 / 立绘 ========================

// ---------------- 「那个键」：全程常驻右下角 ----------------
G.ThatKey = {
  x: 1790, y: 985, r: 46,
  bubbleT: 0, bubbleText: '',
  wiggle: 0,
  override: null,   // 终章可接管台词
  get count() { return parseInt(localStorage.getItem('btk_thatkey') || '0'); },
  set count(v) { localStorage.setItem('btk_thatkey', v); },

  update(dt) {
    this.bubbleT = Math.max(0, this.bubbleT - dt);
    this.wiggle = Math.max(0, this.wiggle - dt);
    const m = G.Input.mouse;
    const clicked = m.just && G.util.dist(m.x, m.y, this.x, this.y) < this.r + 8;
    if (G.Input.just.thatkey || clicked) this.press();
  },
  press() {
    const q = G.DATA.THATKEY_QUOTES;
    if (this.override) this.bubbleText = this.override;
    else if (G.run && G.run.act3 && this.count >= 6) this.bubbleText = q[7];
    else this.bubbleText = q[Math.min(this.count, 6)];
    this.count = this.count + 1;
    this.bubbleT = 3.5;
    this.wiggle = 0.5;
    G.audio.thatkey();
    G.addShake(4, 0.15);
  },
  draw(ctx) {
    const t = G.time;
    const breath = 1 + Math.sin(t * 2) * 0.04;
    const wx = this.wiggle > 0 ? Math.sin(t * 50) * 6 * this.wiggle : 0;
    ctx.save();
    ctx.translate(this.x + wx, this.y);
    ctx.scale(breath, breath);
    ctx.fillStyle = 'rgba(120,20,20,0.5)';
    G.rr(ctx, -this.r, -this.r + 8, this.r * 2, this.r * 2, 14); ctx.fill();
    const glow = 0.5 + Math.sin(t * 2) * 0.3;
    ctx.shadowColor = `rgba(255,60,50,${glow})`;
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#c22f2f';
    G.rr(ctx, -this.r, -this.r, this.r * 2, this.r * 2, 14); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e04545';
    G.rr(ctx, -this.r + 7, -this.r + 6, this.r * 2 - 14, this.r * 2 - 20, 10); ctx.fill();
    ctx.fillStyle = `rgba(255,200,190,${0.25 + glow * 0.2})`;
    ctx.beginPath(); ctx.ellipse(-10, -14, 12, 5, -0.6, 0, 7); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(200,120,110,0.65)';
    ctx.font = G.font(17);
    ctx.textAlign = 'center';
    ctx.fillText('别按那个键', this.x + wx, this.y + this.r + 26);
    if (this.bubbleT > 0) {
      const a = Math.min(1, this.bubbleT / 0.4);
      ctx.globalAlpha = a;
      ctx.font = G.font(26);
      const w = ctx.measureText(this.bubbleText).width + 56;
      const bx = this.x - w + 30, by = this.y - 140;
      ctx.fillStyle = 'rgba(20,26,32,0.95)';
      G.rr(ctx, bx, by, w, 62, 14); ctx.fill();
      ctx.strokeStyle = '#e8c170'; ctx.lineWidth = 2;
      G.rr(ctx, bx, by, w, 62, 14); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.x - 10, by + 62); ctx.lineTo(this.x + 4, by + 84); ctx.lineTo(this.x + 12, by + 62);
      ctx.fillStyle = 'rgba(20,26,32,0.95)'; ctx.fill();
      ctx.fillStyle = '#e8c170';
      ctx.textAlign = 'left';
      ctx.fillText('帽婆婆：' + this.bubbleText, bx + 24, by + 40);
      ctx.globalAlpha = 1;
    }
  },
};

// ---------------- 战斗 HUD ----------------
G.HUD = {
  keys: [
    { action: 'dash', key: '空格', name: '豚跃' },
    { action: 'attack', key: 'J', name: '尾拍' },
    { action: 'skill', key: 'K', name: '音爆' },
    { action: 'heal', key: 'L', name: '吐纳' },
  ],

  draw(ctx, battle) {
    const p = battle.player;
    // --- 血条 ---
    ctx.fillStyle = 'rgba(10,14,18,0.8)';
    G.rr(ctx, 60, 40, 420, 34, 10); ctx.fill();
    const hpP = Math.max(0, p.hp / p.maxhp);
    ctx.fillStyle = hpP > 0.35 ? '#7ddf8e' : '#ff6b6b';
    if (hpP > 0) { G.rr(ctx, 64, 44, 412 * hpP, 26, 7); ctx.fill(); }
    ctx.fillStyle = '#e8eef4';
    ctx.font = G.font(20);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`豚豚  ${Math.ceil(Math.max(0, p.hp))}/${p.maxhp}`, 74, 58);

    // --- 音波条 ---
    ctx.fillStyle = 'rgba(10,14,18,0.8)';
    G.rr(ctx, 60, 84, 300, 20, 8); ctx.fill();
    ctx.fillStyle = p.wave >= 40 ? '#6ee7ff' : '#3d6b7a';
    if (p.wave > 0) { G.rr(ctx, 63, 87, 294 * (p.wave / 100), 14, 6); ctx.fill(); }
    ctx.fillStyle = p.wave >= 40 ? '#bdf3ff' : '#5a7684';
    ctx.font = G.font(15);
    ctx.fillText(p.wave >= 40 ? '音波就绪【K】' : '音波', 372, 94);

    // --- 键位状态行（主视觉）---
    const kw = 118, gap = 14, total = this.keys.length * kw + (this.keys.length - 1) * gap;
    let kx = G.W / 2 - total / 2;
    for (const k of this.keys) {
      const lockRule = G.Input.lockedBy(k.action);
      // 规则可给键帽附加状态：red / warn，及功能名覆盖（键位漂移）
      let state = null, label = k.name;
      for (const r of G.Input.rules) {
        if (r.keyState) { const s = r.keyState(k.action); if (s) state = s; }
        if (r.labelFor) { const l = r.labelFor(k.action); if (l) label = l; }
      }
      const y = 36;
      let bg = 'rgba(16,22,28,0.85)', border = '#3a4a5a';
      if (lockRule) { bg = 'rgba(60,20,20,0.9)'; border = '#c22f2f'; }
      else if (state === 'red') { bg = 'rgba(120,25,20,0.95)'; border = '#ff3b30'; }
      else if (state === 'warn') { bg = Math.sin(G.time * 12) > 0 ? 'rgba(90,80,70,0.9)' : 'rgba(16,22,28,0.85)'; border = '#e8e0d0'; }
      ctx.fillStyle = bg;
      G.rr(ctx, kx, y, kw, 64, 10); ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = state === 'red' ? 4 : 2;
      if (state === 'red') { ctx.shadowColor = 'rgba(255,60,40,0.8)'; ctx.shadowBlur = 18; }
      G.rr(ctx, kx, y, kw, 64, 10); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.fillStyle = lockRule ? '#7a4a4a' : state === 'red' ? '#ffb0a8' : '#e8eef4';
      ctx.font = G.font(24);
      ctx.fillText(k.key, kx + kw / 2, y + 26);
      ctx.fillStyle = lockRule ? '#6a4040' : '#8a97a5';
      ctx.font = G.font(15);
      ctx.fillText(label, kx + kw / 2, y + 50);
      if (lockRule) {
        ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(kx - 4, y + 8); ctx.lineTo(kx + kw + 4, y + 56); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(kx + kw + 4, y + 8); ctx.lineTo(kx - 4, y + 56); ctx.stroke();
        ctx.fillStyle = '#d4a017';
        G.rr(ctx, kx + kw / 2 - 10, y + 22, 20, 18, 4); ctx.fill();
        ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(kx + kw / 2, y + 22, 7, Math.PI, 0); ctx.stroke();
      }
      kx += kw + gap;
    }

    // --- 生效中的键誓/残誓列表（右上角）---
    let cy = 44;
    ctx.textAlign = 'right';
    for (const r of G.Input.rules) {
      ctx.font = G.font(20);
      ctx.fillStyle = r.isLevel ? '#ff6b5e' : '#e8c170';
      let text = '⛓ ' + r.short;
      if (r.levelsLeft) text += `（余 ${r.levelsLeft} 关）`;
      ctx.fillText(text, G.W - 60, cy);
      const extra = r.hudText && r.hudText();
      if (extra) {
        cy += 26;
        ctx.font = G.font(18);
        ctx.fillStyle = '#ffd166';
        ctx.fillText(extra, G.W - 60, cy);
      }
      cy += 32;
    }

    // --- Boss 血条（支持多个）---
    const bosses = battle.enemies.filter(e => e.isBoss);
    bosses.forEach((boss, i) => {
      const by = G.H - 74 - i * 50;
      ctx.fillStyle = 'rgba(10,14,18,0.85)';
      G.rr(ctx, G.W / 2 - 400, by, 800, 40, 10); ctx.fill();
      const bp = Math.max(0, boss.hp / boss.maxhp);
      ctx.fillStyle = '#d08770';
      if (bp > 0) { G.rr(ctx, G.W / 2 - 395, by + 5, 790 * bp, 30, 7); ctx.fill(); }
      ctx.fillStyle = '#e8eef4';
      ctx.font = G.font(20);
      ctx.textAlign = 'center';
      ctx.fillText(boss.name, G.W / 2, by + 20);
    });

    // --- 波次指示 ---
    if (!bosses.length && battle.state === 'fight') {
      ctx.fillStyle = '#5a7684';
      ctx.font = G.font(19);
      ctx.textAlign = 'center';
      ctx.fillText(`第 ${battle.wave + 1}/${battle.def.waves.length} 波${battle.def.boss ? ' + 关主' : ''}`, G.W / 2, 130);
    }
    ctx.textBaseline = 'alphabetic';
  },
};

// ---------------- 立绘（代码绘制，风格化大头）----------------
G.drawPortrait = (ctx, id, x, y, s) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const t = G.time;
  const c = G.DATA.CHARS[id];
  if (id === 'tuntun') {
    ctx.fillStyle = '#8fb8d8';
    ctx.beginPath(); ctx.ellipse(0, 6 + Math.sin(t * 3) * 2, 60, 48, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#dcebf5';
    ctx.beginPath(); ctx.ellipse(8, 22, 40, 24, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6f9cc0';
    ctx.beginPath(); ctx.moveTo(-8, -38); ctx.quadraticCurveTo(6, -66, 20, -38); ctx.fill();
    ctx.fillStyle = '#1c2733';
    ctx.beginPath(); ctx.arc(28, -8, 8, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(31, -11, 3, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(240,150,150,0.5)';
    ctx.beginPath(); ctx.ellipse(42, 6, 9, 5, 0, 0, 7); ctx.fill();
  } else if (id === 'granny') {
    ctx.fillStyle = '#8a7a55';
    G.rr(ctx, -52, -46, 104, 96, 16); ctx.fill();
    ctx.fillStyle = '#a89468';
    G.rr(ctx, -42, -38, 84, 70, 12); ctx.fill();
    ctx.strokeStyle = '#5a4d38'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-26, -12); ctx.quadraticCurveTo(-16, -18, -6, -12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -12); ctx.quadraticCurveTo(16, -18, 26, -12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-30, -28); ctx.lineTo(-4, -30); ctx.moveTo(30, -28); ctx.lineTo(4, -30); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 8, 10, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.strokeStyle = '#e8c170'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-40, -52); ctx.lineTo(20, -64); ctx.stroke();
    ctx.fillStyle = '#e8c170';
    ctx.beginPath(); ctx.arc(24, -65, 7, 0, 7); ctx.fill();
  } else if (id === 'steward') {
    ctx.fillStyle = '#8a4a3a';
    ctx.beginPath(); ctx.moveTo(-44, 50); ctx.quadraticCurveTo(-50, -30, 0, -50); ctx.quadraticCurveTo(50, -30, 44, 50); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d08770';
    ctx.beginPath(); ctx.arc(0, -14, 30, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3a2018'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-18, -24); ctx.lineTo(-6, -18); ctx.moveTo(18, -24); ctx.lineTo(6, -18); ctx.stroke();
    ctx.fillStyle = '#3a2018';
    ctx.beginPath(); ctx.arc(-10, -14, 3.5, 0, 7); ctx.arc(10, -14, 3.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3a2018';
    ctx.beginPath(); ctx.arc(0, 2, 8, 0.2, Math.PI - 0.2, true); ctx.stroke();
  } else if (c && c.g && c.g.eye) {
    // 天道：一只悬空巨眼
    ctx.fillStyle = '#0a0a10';
    ctx.beginPath(); ctx.ellipse(0, 0, 70, 42 + Math.sin(t * 1.5) * 4, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, 0, 70, 42 + Math.sin(t * 1.5) * 4, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a0a10';
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
    // 光环
    ctx.strokeStyle = `rgba(255,209,102,${0.3 + Math.sin(t * 3) * 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 92, 0, 7); ctx.stroke();
  } else if (c && c.g) {
    // 通用修士立绘：袍子 + 脸 + 表情参数
    const g = c.g;
    const sc = g.big || 1;
    ctx.scale(sc, sc);
    if (g.twin) { drawCultivator(ctx, g, -34, 0, t); drawCultivator(ctx, g, 34, 0, t); }
    else drawCultivator(ctx, g, 0, 0, t);
  }
  ctx.restore();
};

function drawCultivator(ctx, g, ox, oy, t) {
  ctx.save();
  ctx.translate(ox, oy);
  // 袍
  ctx.fillStyle = g.robe;
  ctx.beginPath(); ctx.moveTo(-40, 50); ctx.quadraticCurveTo(-46, -28, 0, -48); ctx.quadraticCurveTo(46, -28, 40, 50); ctx.closePath(); ctx.fill();
  // 头
  ctx.fillStyle = g.skin;
  ctx.beginPath(); ctx.arc(0, -14, 27, 0, 7); ctx.fill();
  // 冠 / 发 / 须
  if (g.crown) {
    ctx.fillStyle = '#d4a017';
    ctx.beginPath(); ctx.moveTo(-18, -38); ctx.lineTo(18, -38); ctx.lineTo(12, -52); ctx.lineTo(0, -42); ctx.lineTo(-12, -52); ctx.closePath(); ctx.fill();
  }
  if (g.hair) {
    ctx.fillStyle = '#2a2030';
    ctx.beginPath(); ctx.arc(0, -22, 26, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-24, -6, 7, 20, 0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(24, -6, 7, 20, -0.2, 0, 7); ctx.fill();
  }
  if (g.beard) {
    ctx.fillStyle = '#c8c0b0';
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, 34 + Math.sin(t * 2) * 2, 12, 0); ctx.closePath(); ctx.fill();
  }
  // 表情
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3.5;
  ctx.fillStyle = '#2a1a10';
  if (g.expr === 'angry') {
    ctx.beginPath(); ctx.moveTo(-16, -24); ctx.lineTo(-5, -18); ctx.moveTo(16, -24); ctx.lineTo(5, -18); ctx.stroke();
    ctx.beginPath(); ctx.arc(-9, -13, 3, 0, 7); ctx.arc(9, -13, 3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 4, 7, 0.2, Math.PI - 0.2, true); ctx.stroke();
  } else if (g.expr === 'smug') {
    ctx.beginPath(); ctx.moveTo(-15, -20); ctx.quadraticCurveTo(-9, -25, -3, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, -20); ctx.quadraticCurveTo(9, -25, 3, -20); ctx.stroke();
    ctx.beginPath(); ctx.arc(-9, -14, 2.5, 0, 7); ctx.arc(9, -14, 2.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, 2); ctx.quadraticCurveTo(2, 8, 8, 0); ctx.stroke();
  } else { // cold
    ctx.beginPath(); ctx.moveTo(-16, -20); ctx.lineTo(-3, -20); ctx.moveTo(16, -20); ctx.lineTo(3, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, -13); ctx.lineTo(-5, -13); ctx.moveTo(12, -13); ctx.lineTo(5, -13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 3); ctx.lineTo(6, 3); ctx.stroke();
  }
  ctx.restore();
}
