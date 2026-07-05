// ======================== 场景：标题 / 选关 / 对话 / 三选一 / 终章 / 结局 + 流程 ========================

// ---------------- 流程 ----------------
G.flow = {
  steps: [], i: -1,
  newRun() {
    G.run = {
      mods: {
        dmgMul: 1, healMul: 1, channelTime: 1.0, dashCharges: 1, speedMul: 1,
        attackCdMul: 1, waveGainMul: 1, lifesteal: 0, shieldChance: 0,
        dmgTakenMul: 1, smiteMul: 1, bubble: false, echoField: false,
      },
      tempCurses: [], pickedIds: [], pickTwo: false, act3: false, deaths: 0,
    };
  },
  start() { this.startAt(0, true); },
  startAt(levelIdx, withPrologue) {
    this.newRun();
    const D = G.DATA.DIALOGS, L = G.DATA.LEVELS, order = G.DATA.LEVEL_ORDER;
    const next = () => this.next();
    this.steps = [];
    if (withPrologue) {
      this.steps.push(() => new DialogScene(D.prologue, next));
      this.steps.push(() => new G.Battle(L.tutorial, next));
      this.steps.push(() => new DialogScene(D.afterTutorial, next));
    }
    for (let i = levelIdx; i < order.length; i++) {
      const id = order[i];
      if (id === 'lv10') {
        this.steps.push(() => new FinaleScene(next));
        continue;
      }
      const nextId = order[i + 1];
      this.steps.push(() => {
        if (id === 'lv8') G.run.act3 = true;
        return new DialogScene(D[id + 'Intro'], next);
      });
      this.steps.push(() => new G.Battle(L[id], () => { this.decayCurses(); next(); }));
      this.steps.push(() => new DialogScene(D[id + 'Win'], next));
      if (id !== 'lv9') this.steps.push(() => new CardPickScene(nextId, next));
    }
    this.steps.push(() => new DialogScene(D.ending, next));
    this.steps.push(() => new EndingScene());
    this.i = -1;
    this.next();
  },
  next() {
    this.i++;
    if (this.i >= this.steps.length) { G.setScene(new TitleScene()); return; }
    G.setScene(this.steps[this.i]());
  },
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
    G.AgeRating.update();
    if (G.AgeRating.show) return;
    if (G.Input.just.attack) { G.audio.confirm(); G.flow.start(); }
    if (G.Input.just.skill) { G.audio.select(); G.setScene(new LevelSelectScene()); }
  }
  draw(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#0a1018'); g.addColorStop(1, '#101c28');
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
    ctx.save();
    ctx.translate(this.dolphinX, 300 + Math.sin(this.t * 2) * 30);
    G.drawPortrait(ctx, 'tuntun', 0, 0, 0.9);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8eef4';
    ctx.font = G.font(130);
    ctx.fillText('别 按 那 个', G.W / 2 - 110, 560);
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
    ctx.fillStyle = '#8a97a5';
    ctx.font = G.font(30);
    ctx.fillText('—— 一只胖海豚的修键逆袭 ——', G.W / 2, 650);
    if (Math.sin(this.t * 4) > -0.3) {
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(36);
      ctx.fillText('按【J】开始修键', G.W / 2, 790);
    }
    ctx.fillStyle = '#4a5866';
    ctx.font = G.font(20);
    ctx.fillText('WASD 移动 · J 尾拍 · K 音爆 · L 吐纳 · 空格 豚跃', G.W / 2, 850);
    ctx.fillText('【K】选关', G.W / 2, 890);
    ctx.fillText('全十关 · 剧情约 2 小时', G.W / 2, 1040);
    G.ThatKey.draw(ctx);
    G.AgeRating.draw(ctx);
  }
}
G.TitleScene = TitleScene;

// ---------------- 选关 ----------------
class LevelSelectScene {
  constructor() {
    this.items = [{ id: 'prologue', title: '序章 · 吞键奇遇（含教学）' }]
      .concat(G.DATA.LEVEL_ORDER.map(id => ({ id, title: G.DATA.LEVELS[id].title })));
    this.sel = 0;
  }
  update(dt) {
    G.ThatKey.update(dt);
    if (G.Input.just.up) { this.sel = (this.sel + this.items.length - 1) % this.items.length; G.audio.select(); }
    if (G.Input.just.down) { this.sel = (this.sel + 1) % this.items.length; G.audio.select(); }
    if (G.Input.just.attack) {
      G.audio.confirm();
      if (this.sel === 0) G.flow.start();
      else G.flow.startAt(this.sel - 1, false);
    }
    if (G.Input.just.dash) G.setScene(new TitleScene());
  }
  draw(ctx) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8c170';
    ctx.font = G.font(52);
    ctx.fillText('选 关', G.W / 2, 110);
    ctx.font = G.font(20);
    ctx.fillStyle = '#5a7684';
    ctx.fillText('【W/S】选择　【J】进入　【空格】返回（跳关不带键契，量力而行）', G.W / 2, 160);
    this.items.forEach((it, i) => {
      const y = 230 + i * 74;
      const hot = i === this.sel;
      ctx.fillStyle = hot ? 'rgba(232,193,112,0.14)' : 'rgba(16,22,28,0.6)';
      G.rr(ctx, G.W / 2 - 400, y - 38, 800, 60, 12); ctx.fill();
      if (hot) { ctx.strokeStyle = '#e8c170'; ctx.lineWidth = 2; G.rr(ctx, G.W / 2 - 400, y - 38, 800, 60, 12); ctx.stroke(); }
      ctx.fillStyle = hot ? '#e8c170' : '#8a97a5';
      ctx.font = G.font(28);
      ctx.fillText(it.title, G.W / 2, y + 2);
    });
    G.ThatKey.draw(ctx);
  }
}

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
  drawBg(ctx) {
    const bg = this.script.bg, t = G.time;
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    if (bg === 'arena') { g.addColorStop(0, '#161019'); g.addColorStop(1, '#241a20'); }
    else if (bg === 'hall') { g.addColorStop(0, '#100e18'); g.addColorStop(1, '#1c1826'); }
    else if (bg === 'throne') { g.addColorStop(0, '#14101c'); g.addColorStop(1, '#2a1a24'); }
    else if (bg === 'void') { g.addColorStop(0, '#05050a'); g.addColorStop(1, '#100a1a'); }
    else { g.addColorStop(0, '#0c121a'); g.addColorStop(1, '#141e28'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);

    if (bg === 'arena') {
      ctx.fillStyle = '#1d242e';
      G.rr(ctx, 360, 620, 1200, 260, 30); ctx.fill();
      ctx.strokeStyle = '#3a2f3a'; ctx.lineWidth = 4;
      G.rr(ctx, 360, 620, 1200, 260, 30); ctx.stroke();
      for (const fx of [300, 1620]) {
        ctx.fillStyle = `rgba(255,150,60,${0.5 + Math.sin(t * 8 + fx) * 0.15})`;
        ctx.beginPath(); ctx.arc(fx, 480, 16 + Math.sin(t * 10 + fx) * 3, 0, 7); ctx.fill();
        ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(fx, 500); ctx.lineTo(fx, 620); ctx.stroke();
      }
    } else if (bg === 'hall') {
      // 藏键阁：一排排发光的键帽书架
      for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `rgba(120,140,200,${0.06 + (Math.sin(t * 2 + i + r) + 1) * 0.03})`;
        G.rr(ctx, 120 + i * 145, 180 + r * 170, 90, 90, 12); ctx.fill();
      }
    } else if (bg === 'throne') {
      // 宗主大殿：高台 + 金色天键盘残片悬浮
      ctx.fillStyle = '#241a28';
      ctx.beginPath(); ctx.moveTo(660, 880); ctx.lineTo(760, 420); ctx.lineTo(1160, 420); ctx.lineTo(1260, 880); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 6; i++) {
        const a = t * 0.6 + i;
        ctx.fillStyle = `rgba(212,160,23,${0.4 + Math.sin(t * 3 + i) * 0.2})`;
        G.rr(ctx, 960 + Math.cos(a) * 320 - 20, 300 + Math.sin(a * 1.3) * 90, 40, 40, 8); ctx.fill();
      }
    } else if (bg === 'void') {
      // 天裂：一道发光的裂缝 + 巨眼
      ctx.strokeStyle = `rgba(255,209,102,${0.6 + Math.sin(t * 2) * 0.2})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(400, 80);
      for (let i = 1; i <= 6; i++) ctx.lineTo(400 + i * 190 + Math.sin(i * 7) * 60, 80 + Math.sin(i * 3) * 50);
      ctx.stroke();
      G.drawPortrait(ctx, 'heaven', G.W / 2, 200, 1.4);
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(200,215,230,${0.2 + Math.sin(t + i * 3) * 0.15})`;
        ctx.beginPath(); ctx.arc((i * 331) % G.W, (i * 173) % 500 + 60, 1.5, 0, 7); ctx.fill();
      }
    } else {
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
  }
  draw(ctx) {
    this.drawBg(ctx);
    const line = this.line;
    const who = G.DATA.CHARS[line.who];
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
      if (line.who !== 'narrator') G.drawPortrait(ctx, line.who, 260, 700, 2.2);
    }
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

// ---------------- 键契三选一（卡池抽取 + 冲突保底 + 二选一） ----------------
class CardPickScene {
  constructor(nextLevelId, onDone) {
    this.onDone = onDone;
    // 抽卡：排除已选 + 与下一关键誓死锁的卡
    let pool = G.DATA.CARDS.filter(c =>
      !G.run.pickedIds.includes(c.id) && !(c.conflicts || []).includes(nextLevelId));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const n = G.run.pickTwo ? 2 : 3;
    if (G.run.pickTwo) G.run.pickTwo = false;
    this.cards = pool.slice(0, Math.min(n, pool.length));
    this.sel = 0;
    this.t = 0;
    this.confirmed = -1;
    this.confT = 0;
  }
  cardRect(i) {
    const cw = 440, ch = 590, gap = 60;
    const n = this.cards.length;
    const total = n * cw + (n - 1) * gap;
    return { x: G.W / 2 - total / 2 + i * (cw + gap), y: 300, w: cw, h: ch };
  }
  update(dt) {
    this.t += dt;
    G.ThatKey.update(dt);
    if (!this.cards.length) { this.onDone(); return; }
    if (this.confirmed >= 0) {
      this.confT -= dt;
      if (this.confT <= 0) this.onDone();
      return;
    }
    const n = this.cards.length;
    if (G.Input.just.left) { this.sel = (this.sel + n - 1) % n; G.audio.select(); }
    if (G.Input.just.right) { this.sel = (this.sel + 1) % n; G.audio.select(); }
    const m = G.Input.mouse;
    for (let i = 0; i < n; i++) {
      const r = this.cardRect(i);
      if (m.x > r.x && m.x < r.x + r.w && m.y > r.y && m.y < r.y + r.h) {
        this.sel = i;
        if (m.just) this.confirm();
      }
    }
    if (G.Input.just.attack) this.confirm();
  }
  confirm() {
    const card = this.cards[this.sel];
    card.apply();
    G.run.pickedIds.push(card.id);
    if (card.curse) {
      const rule = G.Curses.create(card.curse);
      rule.levelsLeft = card.dur;
      G.run.tempCurses.push({ rule, left: card.dur, cardName: card.name });
    }
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
    ctx.fillText(this.cards.length === 2 ? '键 契 · 二 选 一' : '键 契 · 三 选 一', G.W / 2, 140);
    ctx.fillStyle = '#8a97a5';
    ctx.font = G.font(24);
    ctx.fillText('帽婆婆：「每一份神通，都有代价。挑吧。」', G.W / 2, 200);

    for (let i = 0; i < this.cards.length; i++) {
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
      ctx.fillStyle = hot ? '#1e2836' : '#161d28';
      G.rr(ctx, r.x, r.y, r.w, r.h, 20); ctx.fill();
      ctx.strokeStyle = done ? '#7ddf8e' : hot ? '#e8c170' : '#33404f';
      ctx.lineWidth = hot ? 4 : 2;
      G.rr(ctx, r.x, r.y, r.w, r.h, 20); ctx.stroke();
      ctx.fillStyle = '#2a3648';
      G.rr(ctx, r.x + r.w / 2 - 55, r.y + 42, 110, 84, 14); ctx.fill();
      ctx.fillStyle = '#e8eef4';
      ctx.font = G.font(40);
      ctx.textAlign = 'center';
      ctx.fillText(card.key, r.x + r.w / 2, r.y + 100);
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(42);
      ctx.fillText(card.name, r.x + r.w / 2, r.y + 196);
      ctx.fillStyle = '#7ddf8e';
      ctx.font = G.font(27);
      ctx.fillText('◆ ' + card.ability, r.x + r.w / 2, r.y + 262);
      ctx.strokeStyle = '#33404f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(r.x + 50, r.y + 306); ctx.lineTo(r.x + r.w - 50, r.y + 306); ctx.stroke();
      ctx.fillStyle = '#6a5560';
      ctx.font = G.font(20);
      ctx.fillText('—— 代价 · 残誓' + (card.dur <= 10 ? `（${card.dur} 关）` : '') + ' ——', r.x + r.w / 2, r.y + 348);
      // 残誓正句（严格句式，红字加粗）
      ctx.fillStyle = '#ff6b5e';
      ctx.font = G.font(30);
      const tmpl = '「' + card.restrict + '」';
      let lineStr = '', ly = r.y + 402;
      for (const ch of tmpl) {
        lineStr += ch;
        if (ctx.measureText(lineStr).width > r.w - 70) { ctx.fillText(lineStr, r.x + r.w / 2, ly); lineStr = ''; ly += 42; }
      }
      if (lineStr) { ctx.fillText(lineStr, r.x + r.w / 2, ly); ly += 42; }
      // 注解
      ctx.fillStyle = '#a98080';
      ctx.font = G.font(21);
      let noteStr = '', ny = ly + 8;
      for (const ch of card.restrictNote) {
        noteStr += ch;
        if (ctx.measureText(noteStr).width > r.w - 80) { ctx.fillText(noteStr, r.x + r.w / 2, ny); noteStr = ''; ny += 30; }
      }
      if (noteStr) ctx.fillText(noteStr, r.x + r.w / 2, ny);
      if (done) {
        ctx.fillStyle = '#7ddf8e';
        ctx.font = G.font(34);
        ctx.fillText('✓ 已缔结', r.x + r.w / 2, r.y + r.h - 36);
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

// ---------------- 终章：别按那个键 ----------------
class FinaleScene {
  constructor(onDone) {
    this.onDone = onDone;
    this.player = new G.Player();
    this.enemies = [];   // 供 Player.update 的接口占位
    this.bullets = [];
    this.fx = [];
    this.bubbles = []; this.fields = [];
    this.t = 0;
    this.phase = 'fight';   // fight → truth → prompt → confirm → flash
    this.sealed = [];
    this.sub = null; this.subT = 0;
    this.truthIdx = -1;
    this.flashT = 0;
    this.shootT = 1.5;
    this.slowed = false;
    this.script = [
      { t: 2, sub: ['heaven', '【回收程序，启动。】'] },
      { t: 7, seal: 'skill', sub: ['granny', '音爆被夺走了……撑住！'] },
      { t: 15, seal: 'heal', sub: ['granny', '吐纳也没了……小心走位！'] },
      { t: 23, seal: 'attack', sub: ['granny', '尾拍……小豚，对不起，是老身连累了你……'] },
      { t: 31, seal: 'dash', sub: ['granny', '连豚跃都……'] },
      { t: 37, slow: true, sub: ['heaven', '【剩下的，也不必留。】'] },
      { t: 43, truth: true },
    ];
    this.truthLines = [
      ['granny', '小豚，听老身最后一句——那颗红键，是「确认键」。'],
      ['granny', '这世界，是天键盘里的一局棋。祂，是不许棋局结束的看守。'],
      ['granny', '按下去，这一局才算数。你走过的每一步，才真的存在过。'],
      ['granny', '去吧！这一次——按！那！个！键！'],
    ];
  }
  enter() {
    G.currentBattle = this;
    const self = this;
    // 终章清空一切残誓，只留"剧情封印"规则
    G.run.tempCurses = [];
    this.rule = {
      id: 'finaleSeal', isLevel: true,
      short: '「祂在收回一切」',
      get locks() { return self.sealed; },
      onPress(a) {
        if (self.sealed.includes(a)) return { block: true, punish: true, dmgFrac: 0.05, stun: 0.3, msg: '被·收·回·了' };
        return null;
      },
      update() {},
    };
    G.Input.setRules([this.rule]);
    G.events.clear('punish');
    G.events.on('punish', info => {
      const res = info.res;
      this.player.smite(res.dmgFrac, res.stun);
      this.fx.push({ type: 'text', x: this.player.x, y: this.player.y - 70, t: 1.0, str: res.msg, color: '#ffd166', size: 36 });
      G.audio.punish();
    });
    G.ThatKey.override = '还不是时候……撑住！';
  }
  exit() {
    G.currentBattle = null;
    G.Input.setRules([]);
    G.Input.combatActive = false;
    G.ThatKey.override = null;
    G.events.clear('punish');
  }
  addBubble(x, y) { this.bubbles.push({ x, y, hp: 3, t: 4 }); }
  addField() {}
  update(dt) {
    this.t += dt;
    G.ThatKey.update(dt);

    if (this.phase === 'flash') {
      this.flashT += dt;
      if (this.flashT > 2.2) { this.exit(); this.onDone(); }
      return;
    }

    // 剧本推进
    if (this.phase === 'fight') {
      for (const ev of this.script) {
        if (!ev.done && this.t >= ev.t) {
          ev.done = true;
          if (ev.sub) { this.sub = ev.sub; this.subT = 3.5; }
          if (ev.seal) {
            this.sealed.push(ev.seal);
            G.audio.lock(); G.addShake(10, 0.3);
            this.fx.push({ type: 'text', x: this.player.x, y: this.player.y - 90, t: 1.4, str: '【封印】', color: '#ff6b5e', size: 44 });
          }
          if (ev.slow) this.slowed = true;
          if (ev.truth) { this.phase = 'truth'; this.bullets = []; this.truthIdx = 0; this.subT = 3.4; this.sub = this.truthLines[0]; }
        }
      }
    } else if (this.phase === 'truth') {
      this.subT -= dt;
      if (this.subT <= 0) {
        this.truthIdx++;
        if (this.truthIdx >= this.truthLines.length) {
          this.phase = 'prompt';
          G.ThatKey.override = null;
        } else { this.sub = this.truthLines[this.truthIdx]; this.subT = 3.4; }
      }
    } else if (this.phase === 'prompt' || this.phase === 'confirm') {
      const m = G.Input.mouse;
      const clicked = m.just && G.util.dist(m.x, m.y, G.ThatKey.x, G.ThatKey.y) < 70;
      if (G.Input.just.thatkey || clicked) {
        if (this.phase === 'prompt') { this.phase = 'confirm'; G.audio.thatkey(); G.addShake(10, 0.3); }
        else { this.phase = 'flash'; this.flashT = 0; G.audio.win(); }
        G.Input.just.thatkey = false;
      }
    }
    this.subT = this.phase === 'truth' ? this.subT : Math.max(0, this.subT - dt);

    // 战斗压力（truth 之后停火）
    if (this.phase === 'fight') {
      G.Input.combatActive = true;
      G.Input.update(dt);
      // 玩家减速（剧情杀）
      const oldSpeed = this.player.baseSpeed;
      if (this.slowed) this.player.baseSpeed = 200;
      this.player.update(dt, this);
      this.player.baseSpeed = oldSpeed;
      if (this.player.hp < 1) this.player.hp = 1; // 祂在玩弄你，不让你死

      // 天弹幕
      this.shootT -= dt;
      if (this.shootT <= 0) {
        this.shootT = Math.max(0.8, 1.6 - this.t * 0.01);
        const U = G.util;
        const ex = G.W / 2, ey = 150;
        const base = U.angleTo(ex, ey, this.player.x, this.player.y);
        const n = 5;
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.18;
          this.bullets.push({ x: ex, y: ey, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, r: 10, dmg: 8 });
        }
        G.audio.wave();
      }
    } else {
      G.Input.combatActive = false;
    }

    for (const b of this.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      for (const bub of this.bubbles) {
        if (bub.hp > 0 && G.util.dist(b.x, b.y, bub.x, bub.y) < 46 + b.r) { bub.hp--; b.dead = true; break; }
      }
      if (!b.dead && G.util.dist(b.x, b.y, this.player.x, this.player.y) < b.r + this.player.r - 6) {
        this.player.hurt(b.dmg, b.x, b.y);
        if (this.player.hp < 1) this.player.hp = 1;
        b.dead = true;
      }
      if (b.y > G.H + 40 || b.x < -40 || b.x > G.W + 40) b.dead = true;
    }
    this.bullets = this.bullets.filter(b => !b.dead);
    for (const bub of this.bubbles) bub.t -= dt;
    this.bubbles = this.bubbles.filter(b => b.t > 0 && b.hp > 0);
    for (const f of this.fx) f.t -= dt;
    this.fx = this.fx.filter(f => f.t > 0);
  }
  draw(ctx) {
    // 天裂空间
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#05050a'); g.addColorStop(1, '#100a1a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
    const A = G.ARENA;
    ctx.strokeStyle = 'rgba(255,209,102,0.25)'; ctx.lineWidth = 3;
    G.rr(ctx, A.x - 14, A.y - 14, A.w + 28, A.h + 28, 24); ctx.stroke();

    // 天道本体：巨眼
    G.drawPortrait(ctx, 'heaven', G.W / 2, 150, this.phase === 'confirm' ? 2.4 + Math.sin(G.time * 30) * 0.1 : 2.0);
    if (this.phase === 'confirm') {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = G.font(28);
      ctx.fillText('【警告。警告。禁止确认。禁止——】', G.W / 2, 300);
    }

    for (const bub of this.bubbles) {
      ctx.globalAlpha = Math.min(1, bub.t) * 0.7;
      ctx.strokeStyle = '#8fd8f0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bub.x, bub.y, 46, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const b of this.bullets) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    }
    this.player.draw(ctx);
    for (const f of this.fx) {
      if (f.type === 'text') {
        ctx.globalAlpha = Math.min(1, f.t * 2);
        ctx.fillStyle = f.color;
        ctx.font = G.font(f.size);
        ctx.textAlign = 'center';
        ctx.fillText(f.str, f.x, f.y - (1 - f.t) * 30);
        ctx.globalAlpha = 1;
      }
    }

    // 键位行（复用 HUD 的锁定视觉）
    G.HUD.draw(ctx, this);

    // 字幕
    if (this.sub && this.subT > 0) {
      const who = G.DATA.CHARS[this.sub[0]];
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(10,10,16,0.8)';
      G.rr(ctx, G.W / 2 - 620, G.H - 190, 1240, 70, 14); ctx.fill();
      ctx.fillStyle = who.color;
      ctx.font = G.font(28);
      ctx.fillText(`${who.name}：${this.sub[1]}`, G.W / 2, G.H - 145);
    }

    // 按键提示阶段
    if (this.phase === 'prompt' || this.phase === 'confirm') {
      ctx.fillStyle = `rgba(255,60,40,${0.12 + Math.sin(G.time * 4) * 0.06})`;
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff6b5e';
      ctx.font = G.font(64);
      ctx.fillText(this.phase === 'prompt' ? '—— 按 下 那 个 键 ——' : '再按一次，终结这一切', G.W / 2, G.H / 2 - 40);
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(26);
      ctx.fillText('【Enter】或点击右下角', G.W / 2, G.H / 2 + 30);
      // 指向那个键的箭头
      const t = G.time;
      ctx.strokeStyle = '#ff6b5e'; ctx.lineWidth = 6;
      const ax = G.ThatKey.x - 90 - Math.sin(t * 5) * 15, ay = G.ThatKey.y - 90 - Math.sin(t * 5) * 15;
      ctx.beginPath(); ctx.moveTo(ax - 60, ay - 60); ctx.lineTo(ax, ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - 26, ay - 6); ctx.moveTo(ax, ay); ctx.lineTo(ax - 6, ay - 26); ctx.stroke();
    }
    if (this.phase === 'confirm') {
      // 系统弹窗
      ctx.fillStyle = 'rgba(20,24,32,0.97)';
      G.rr(ctx, G.W / 2 - 380, G.H / 2 + 80, 760, 170, 10); ctx.fill();
      ctx.strokeStyle = '#8a97a5'; ctx.lineWidth = 2;
      G.rr(ctx, G.W / 2 - 380, G.H / 2 + 80, 760, 170, 10); ctx.stroke();
      ctx.fillStyle = '#3a4a5a';
      G.rr(ctx, G.W / 2 - 380, G.H / 2 + 80, 760, 40, 10); ctx.fill();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e8eef4';
      ctx.font = G.font(20);
      ctx.fillText('⚠ 系统提示', G.W / 2 - 360, G.H / 2 + 107);
      ctx.font = G.font(26);
      ctx.fillText('是否结束当前进程：天道.exe ？', G.W / 2 - 340, G.H / 2 + 170);
      ctx.fillStyle = '#ff6b5e';
      ctx.font = G.font(24);
      ctx.textAlign = 'center';
      ctx.fillText('【确认(Enter)】', G.W / 2 + 220, G.H / 2 + 218);
    }
    if (this.phase === 'flash') {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, this.flashT * 1.5)})`;
      ctx.fillRect(0, 0, G.W, G.H);
      if (this.flashT > 1) {
        ctx.fillStyle = `rgba(20,26,32,${Math.min(1, this.flashT - 1)})`;
        ctx.font = G.font(40);
        ctx.textAlign = 'center';
        ctx.fillText('【确认成功。本局已记录。】', G.W / 2, G.H / 2);
      }
    }
    G.ThatKey.draw(ctx);
  }
}
G.FinaleScene = FinaleScene;

// ---------------- 结局 ----------------
class EndingScene {
  constructor() { this.t = 0; }
  update(dt) {
    this.t += dt;
    if (this.t > 2 && G.Input.just.attack) { G.audio.confirm(); G.setScene(new TitleScene()); }
  }
  draw(ctx) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, G.W, G.H);
    // 键台上的豚豚
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.t / 2);
    ctx.fillStyle = '#1d242e';
    G.rr(ctx, G.W / 2 - 300, 560, 600, 80, 20); ctx.fill();
    G.drawPortrait(ctx, 'tuntun', G.W / 2, 480, 1.6);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(1, this.t / 1.5);
    ctx.fillStyle = '#e8eef4';
    ctx.font = G.font(72);
    ctx.fillText('《别按那个键》', G.W / 2, 220);
    ctx.font = G.font(34);
    ctx.fillStyle = '#e8c170';
    ctx.fillText('—— 完 ——', G.W / 2, 300);
    ctx.globalAlpha = Math.min(1, Math.max(0, (this.t - 1.5) / 1.5));
    ctx.fillStyle = '#8a97a5';
    ctx.font = G.font(26);
    ctx.fillText('豚豚站上了键台。这一次，堂堂正正。', G.W / 2, 740);
    const n = G.ThatKey.count;
    ctx.fillStyle = '#c22f2f';
    ctx.font = G.font(22);
    ctx.fillText(`本次旅程你共手贱按了那个键 ${n} 次（结局那两次，不算手贱）`, G.W / 2, 810);
    if (G.run) {
      ctx.fillStyle = '#5a7684';
      ctx.fillText(`阵亡 ${G.run.deaths || 0} 次 · 缔结键契 ${G.run.pickedIds.length} 张`, G.W / 2, 850);
    }
    if (this.t > 2 && Math.sin(this.t * 4) > 0) {
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(28);
      ctx.fillText('【J】回到标题', G.W / 2, 960);
    }
    ctx.globalAlpha = 1;
  }
}
G.EndingScene = EndingScene;
