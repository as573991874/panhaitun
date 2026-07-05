// ======================== 场景：标题 / 对话 / 三选一 / 章末 + 流程管理 ========================

// ---------------- 流程 ----------------
G.flow = {
  steps: [], i: -1,
  start() {
    G.run = {
      mods: { dmgMul: 1, healMul: 1, channelTime: 1.0, dashCharges: 1, speedMul: 1 },
      tempCurses: [],   // {rule, left, cardName}
      pickedCard: null,
    };
    const D = G.DATA.DIALOGS, L = G.DATA.LEVELS;
    const next = () => this.next();
    this.steps = [
      () => new DialogScene(D.prologue, next),
      () => new G.Battle(L.tutorial, next),
      () => new DialogScene(D.afterTutorial, next),
      () => new DialogScene(D.lv1Intro, next),
      () => new G.Battle(L.lv1, () => { this.decayCurses(); next(); }),
      () => new DialogScene(D.lv1Win, next),
      () => new CardPickScene(next),
      () => new DialogScene(D.sliceEnd, next),
      () => new SliceEndScene(),
    ];
    this.i = -1;
    this.next();
  },
  next() {
    this.i++;
    if (this.i >= this.steps.length) { G.setScene(new TitleScene()); return; }
    G.setScene(this.steps[this.i]());
  },
  // 残誓按关卡衰减
  decayCurses() {
    for (const c of G.run.tempCurses) { c.left--; c.rule.levelsLeft = c.left; }
    G.run.tempCurses = G.run.tempCurses.filter(c => c.left > 0);
  },
};

// ---------------- 标题 ----------------
class TitleScene {
  constructor() { this.t = 0; this.dolphinX = -100; }
  update(dt) {
    this.t += dt;
    this.dolphinX += dt * 120;
    if (this.dolphinX > G.W + 150) this.dolphinX = -150;
    G.ThatKey.update(dt);
    if (G.Input.just.attack) { G.audio.confirm(); G.flow.start(); }
  }
  draw(ctx) {
    // 背景：深海墨色
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#0a1018'); g.addColorStop(1, '#101c28');
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
    // 游过的胖海豚
    ctx.save();
    ctx.translate(this.dolphinX, 300 + Math.sin(this.t * 2) * 30);
    G.drawPortrait(ctx, 'tuntun', 0, 0, 0.9);
    ctx.restore();
    // 标题
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8eef4';
    ctx.font = G.font(130);
    ctx.fillText('别 按 那 个', G.W / 2 - 110, 560);
    // "键"字做成一颗红键帽
    const kx = G.W / 2 + 330, ky = 505;
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(Math.sin(this.t * 1.5) * 0.05);
    ctx.shadowColor = 'rgba(255,60,50,0.7)'; ctx.shadowBlur = 40;
    ctx.fillStyle = '#c22f2f';
    G.rr(ctx, -85, -85, 170, 170, 22); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e04545';
    G.rr(ctx, -72, -75, 144, 130, 16); ctx.fill();
    ctx.fillStyle = '#ffe9e6';
    ctx.font = G.font(110);
    ctx.fillText('键', 0, 30);
    ctx.restore();
    // 副标题
    ctx.fillStyle = '#8a97a5';
    ctx.font = G.font(30);
    ctx.fillText('—— 一只胖海豚的修键逆袭 ——', G.W / 2, 650);
    // 开始提示
    if (Math.sin(this.t * 4) > -0.3) {
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(36);
      ctx.fillText('按【J】开始修键', G.W / 2, 790);
    }
    ctx.fillStyle = '#4a5866';
    ctx.font = G.font(20);
    ctx.fillText('WASD 移动 · J 尾拍 · K 音爆 · L 吐纳 · 空格 豚跃', G.W / 2, 850);
    ctx.fillText('GameJam 纵切版 · 第一章', G.W / 2, 1040);
    G.ThatKey.draw(ctx);
  }
}
G.TitleScene = TitleScene;

// ---------------- 对话 ----------------
class DialogScene {
  constructor(script, onDone) {
    this.script = script;
    this.onDone = onDone;
    this.i = 0;
    this.chars = 0;
    this.talkT = 0;
  }
  get line() { return this.script.lines[this.i]; }
  update(dt) {
    G.ThatKey.update(dt);
    const full = this.line.text.length;
    if (this.chars < full) {
      this.chars += dt * (this.line.big ? 12 : 34);
      this.talkT -= dt;
      if (this.talkT <= 0 && this.line.who !== 'narrator') { G.audio.talk(); this.talkT = 0.07; }
    }
    if (G.Input.just.attack || G.Input.just.dash || G.Input.mouse.just) {
      if (this.chars < full) this.chars = full;
      else {
        this.i++;
        this.chars = 0;
        G.audio.select();
        if (this.i >= this.script.lines.length) this.onDone();
      }
    }
  }
  draw(ctx) {
    // 背景
    if (this.script.bg === 'arena') {
      const g = ctx.createLinearGradient(0, 0, 0, G.H);
      g.addColorStop(0, '#161019'); g.addColorStop(1, '#241a20');
      ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
      // 键台平台
      ctx.fillStyle = '#1d242e';
      G.rr(ctx, 360, 620, 1200, 260, 30); ctx.fill();
      ctx.strokeStyle = '#3a2f3a'; ctx.lineWidth = 4;
      G.rr(ctx, 360, 620, 1200, 260, 30); ctx.stroke();
      // 火把光
      for (const fx of [300, 1620]) {
        ctx.fillStyle = `rgba(255,150,60,${0.5 + Math.sin(G.time * 8 + fx) * 0.15})`;
        ctx.beginPath(); ctx.arc(fx, 480, 16 + Math.sin(G.time * 10 + fx) * 3, 0, 7); ctx.fill();
        ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(fx, 500); ctx.lineTo(fx, 620); ctx.stroke();
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, G.H);
      g.addColorStop(0, '#0c121a'); g.addColorStop(1, '#141e28');
      ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
      // 月亮 + 院墙
      ctx.fillStyle = '#c9d3dd';
      ctx.beginPath(); ctx.arc(1560, 200, 70, 0, 7); ctx.fill();
      ctx.fillStyle = '#0c121a';
      ctx.beginPath(); ctx.arc(1590, 180, 62, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a2430';
      ctx.fillRect(0, 700, G.W, 380);
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = '#151d27';
        G.rr(ctx, 60 + i * 200, 640, 150, 70, 8); ctx.fill();
      }
    }

    const line = this.line;
    const who = G.DATA.CHARS[line.who];
    // 大字台词（键誓级）
    if (line.big) {
      const shown = line.text.substring(0, Math.floor(this.chars));
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(5,5,8,0.6)';
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.fillStyle = '#ff3b30';
      ctx.font = G.font(110);
      ctx.shadowColor = 'rgba(255,60,40,0.8)'; ctx.shadowBlur = 30;
      ctx.fillText(shown, G.W / 2, G.H / 2 - 60);
      ctx.shadowBlur = 0;
    } else {
      // 立绘
      if (line.who !== 'narrator') G.drawPortrait(ctx, line.who, 260, 700, 2.2);
    }

    // 对话框
    const by = 840;
    ctx.fillStyle = 'rgba(12,16,22,0.92)';
    G.rr(ctx, 120, by, 1680, 190, 18); ctx.fill();
    ctx.strokeStyle = line.big ? '#c22f2f' : '#3a4a5a'; ctx.lineWidth = 3;
    G.rr(ctx, 120, by, 1680, 190, 18); ctx.stroke();
    ctx.textAlign = 'left';
    if (who.name) {
      ctx.fillStyle = who.color;
      ctx.font = G.font(30);
      ctx.fillText(who.name, 170, by + 52);
    }
    // 正文（手动换行）
    const shown = line.text.substring(0, Math.floor(this.chars));
    ctx.fillStyle = line.who === 'narrator' ? '#8a97a5' : '#e8eef4';
    ctx.font = G.font(30, line.who === 'narrator' ? 400 : 600);
    const maxW = 1480;
    let lx = 170, ly = by + (who.name ? 106 : 80);
    for (const ch of shown) {
      const w = ctx.measureText(ch).width;
      if (lx + w > 170 + maxW) { lx = 170; ly += 44; }
      ctx.fillText(ch, lx, ly);
      lx += w;
    }
    // 继续提示
    if (this.chars >= line.text.length && Math.sin(G.time * 5) > 0) {
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(24);
      ctx.textAlign = 'right';
      ctx.fillText('▼ J', 1760, by + 160);
    }
    ctx.fillStyle = '#4a5866';
    ctx.font = G.font(17);
    ctx.textAlign = 'right';
    ctx.fillText(`${this.i + 1}/${this.script.lines.length}`, 1760, by + 30);
    G.ThatKey.draw(ctx);
  }
}
G.DialogScene = DialogScene;

// ---------------- 键契三选一 ----------------
class CardPickScene {
  constructor(onDone) {
    this.onDone = onDone;
    this.cards = G.DATA.CARDS.slice(0, 3);
    this.sel = 1;
    this.t = 0;
    this.confirmed = -1;
    this.confT = 0;
  }
  cardRect(i) {
    const cw = 440, ch = 590, gap = 60;
    const total = 3 * cw + 2 * gap;
    return { x: G.W / 2 - total / 2 + i * (cw + gap), y: 300, w: cw, h: ch };
  }
  update(dt) {
    this.t += dt;
    G.ThatKey.update(dt);
    if (this.confirmed >= 0) {
      this.confT -= dt;
      if (this.confT <= 0) this.onDone();
      return;
    }
    if (G.Input.just.left) { this.sel = (this.sel + 2) % 3; G.audio.select(); }
    if (G.Input.just.right) { this.sel = (this.sel + 1) % 3; G.audio.select(); }
    // 鼠标悬停
    const m = G.Input.mouse;
    for (let i = 0; i < 3; i++) {
      const r = this.cardRect(i);
      if (m.x > r.x && m.x < r.x + r.w && m.y > r.y && m.y < r.y + r.h) {
        if (this.sel !== i) { this.sel = i; }
        if (m.just) this.confirm();
      }
    }
    if (G.Input.just.attack) this.confirm();
  }
  confirm() {
    const card = this.cards[this.sel];
    card.apply();
    if (card.curse) {
      const rule = G.Curses.create(card.curse);
      rule.levelsLeft = card.dur;
      G.run.tempCurses.push({ rule, left: card.dur, cardName: card.name });
    }
    G.run.pickedCard = card;
    this.confirmed = this.sel;
    this.confT = 1.2;
    G.audio.confirm();
  }
  draw(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#0e0b14'); g.addColorStop(1, '#181226');
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8c170';
    ctx.font = G.font(56);
    ctx.fillText('键 契 · 三 选 一', G.W / 2, 140);
    ctx.fillStyle = '#8a97a5';
    ctx.font = G.font(24);
    ctx.fillText('帽婆婆：「每一份神通，都有代价。挑吧。」', G.W / 2, 200);

    for (let i = 0; i < 3; i++) {
      const r = this.cardRect(i);
      const card = this.cards[i];
      const hot = i === this.sel;
      const done = this.confirmed === i;
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      const sc = done ? 1.08 + Math.sin(this.t * 20) * 0.02 : hot ? 1.05 : 1;
      ctx.scale(sc, sc);
      ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
      if (this.confirmed >= 0 && !done) ctx.globalAlpha = 0.3;
      // 卡底
      ctx.fillStyle = hot ? '#1e2836' : '#161d28';
      G.rr(ctx, r.x, r.y, r.w, r.h, 20); ctx.fill();
      ctx.strokeStyle = done ? '#7ddf8e' : hot ? '#e8c170' : '#33404f';
      ctx.lineWidth = hot ? 4 : 2;
      G.rr(ctx, r.x, r.y, r.w, r.h, 20); ctx.stroke();
      // 键帽图示
      ctx.fillStyle = '#2a3648';
      G.rr(ctx, r.x + r.w / 2 - 55, r.y + 46, 110, 90, 14); ctx.fill();
      ctx.fillStyle = '#e8eef4';
      ctx.font = G.font(44);
      ctx.textAlign = 'center';
      ctx.fillText(card.key, r.x + r.w / 2, r.y + 108);
      // 名称
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(42);
      ctx.fillText(card.name, r.x + r.w / 2, r.y + 210);
      // 能力（正面）
      ctx.fillStyle = '#7ddf8e';
      ctx.font = G.font(28);
      ctx.fillText('◆ ' + card.ability, r.x + r.w / 2, r.y + 280);
      // 分割线
      ctx.strokeStyle = '#33404f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(r.x + 50, r.y + 330); ctx.lineTo(r.x + r.w - 50, r.y + 330); ctx.stroke();
      ctx.fillStyle = '#6a5560';
      ctx.font = G.font(20);
      ctx.fillText('—— 代价（残誓 · ' + card.dur + ' 关）——', r.x + r.w / 2, r.y + 372);
      // 限制（背面，红）
      ctx.fillStyle = '#ff8a80';
      ctx.font = G.font(24);
      // 简单换行
      const words = card.restrict;
      let lineStr = '', ly = r.y + 420;
      for (const ch of words) {
        lineStr += ch;
        if (ctx.measureText(lineStr).width > r.w - 90) {
          ctx.fillText(lineStr, r.x + r.w / 2, ly);
          lineStr = ''; ly += 36;
        }
      }
      if (lineStr) ctx.fillText(lineStr, r.x + r.w / 2, ly);
      if (done) {
        ctx.fillStyle = '#7ddf8e';
        ctx.font = G.font(34);
        ctx.fillText('✓ 已缔结', r.x + r.w / 2, r.y + r.h - 40);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    if (this.confirmed < 0) {
      ctx.fillStyle = '#5a7684';
      ctx.font = G.font(24);
      ctx.textAlign = 'center';
      ctx.fillText('【A/D】选择　【J】缔结键契', G.W / 2, 990);
    }
    G.ThatKey.draw(ctx);
  }
}
G.CardPickScene = CardPickScene;

// ---------------- 章末 ----------------
class SliceEndScene {
  constructor() { this.t = 0; }
  update(dt) {
    this.t += dt;
    G.ThatKey.update(dt);
    if (this.t > 1 && G.Input.just.attack) { G.audio.confirm(); G.setScene(new TitleScene()); }
  }
  draw(ctx) {
    ctx.fillStyle = '#08090c';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8eef4';
    ctx.font = G.font(80);
    ctx.fillText('第一章 · 完', G.W / 2, 380);
    ctx.fillStyle = '#8a97a5';
    ctx.font = G.font(30);
    ctx.fillText('外门比试、内门夺位、宗主的阴谋、天道的注视……', G.W / 2, 500);
    ctx.fillText('还有九道键誓，等着豚豚。', G.W / 2, 560);
    if (G.run && G.run.pickedCard) {
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(26);
      ctx.fillText(`本局键契：${G.run.pickedCard.name}`, G.W / 2, 660);
    }
    const n = G.ThatKey.count;
    if (n > 0) {
      ctx.fillStyle = '#c22f2f';
      ctx.font = G.font(24);
      ctx.fillText(`（你已经手贱按了那个键 ${n} 次。帽婆婆都记着呢。）`, G.W / 2, 730);
    }
    if (this.t > 1 && Math.sin(this.t * 4) > 0) {
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(30);
      ctx.fillText('【J】回到标题', G.W / 2, 880);
    }
    G.ThatKey.draw(ctx);
  }
}
G.SliceEndScene = SliceEndScene;
