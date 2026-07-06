// ======================== 场景：标题 / 选关 / 对话 / 三选一 / 终章 / 结局 + 流程 ========================

// ---------------- 流程 ----------------
G.flow = {
  steps: [], i: -1,
  newRun() {
    G.run = {
      mods: {
        dmgMul: 1, healMul: 1, channelTime: 1.0, dashCharges: 1, speedMul: 1,
        attackCdMul: 1, waveGainMul: 1, lifesteal: 0, shieldChance: 0,
        dmgTakenMul: 1, smiteMul: 1, synergyMul: 1,
      },
      tempCurses: [], act3: false, deaths: 0,
      // 修为与神通
      xp: 0, level: 0, levelQueue: 0, powers: [],
      met: { hongxiao: false, linger: false, jingshu: false },
      bondPity: {},
      // 道心（关后抉择累计，决定结局分岔）
      heart: 0, blade: 0,
      nextBattleMods: null,
      ending: 'confirm',
      // rogue：关内伤势随行 + 机缘去重
      hp: null,
      seenEvents: [],
    };
  },
  start() { this.startAt(0, true); },
  startAt(levelIdx, withPrologue) {
    this.newRun();
    // 跳关：补发已错过的羁绊与修为（进关立刻连续突破补选神通）
    G.run.met.hongxiao = levelIdx >= 3;
    G.run.met.linger = levelIdx >= 4;
    G.run.met.jingshu = levelIdx >= 5;
    G.run.level = levelIdx;
    G.run.levelQueue = levelIdx;
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
      const idx = i;
      if (id === 'lv10') {
        this.steps.push(() => new FinaleScene(next));
        continue;
      }
      this.steps.push(() => {
        if (id === 'lv8') G.run.act3 = true;
        G.run.hp = null;             // 新的一关：伤势养好了
        G.run.curseIntroDone = false; // 键誓宣告待演出
        return new DialogScene(D[id + 'Intro'], next);
      });
      // rogue 路程：岔路→房间 ×2，再见关主
      this.steps.push(() => new G.RouteScene(id, idx, 1, next));
      this.steps.push(() => new G.RouteScene(id, idx, 2, next));
      this.steps.push(() => new G.Battle(
        Object.assign(G.Rogue.bossDef(L[id]), { skipCurseIntro: G.run.curseIntroDone }),
        () => { this.decayCurses(); next(); }));
      this.steps.push(() => {
        // 羁绊达成（过关剧情里认识她们，之后突破时才会出现她们的缘起神通）
        if (id === 'lv3') G.run.met.hongxiao = true;
        if (id === 'lv4') G.run.met.linger = true;
        if (id === 'lv5') G.run.met.jingshu = true;
        return new DialogScene(D[id + 'Win'], next);
      });
      // 关后抉择（道心分岔）
      if (G.DATA.CHOICES[id]) this.steps.push(() => new ChoiceScene(id, next));
    }
    // 结局对话按终章的选择动态决定
    this.steps.push(() => new DialogScene(D['ending_' + (G.run.ending || 'confirm')], next));
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
    ctx.fillText('【K】选关　【M】音乐开关', G.W / 2, 890);
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

// ---------------- 关后抉择（道心分岔） ----------------
class ChoiceScene {
  constructor(levelId, onDone) {
    this.data = G.DATA.CHOICES[levelId];
    this.onDone = onDone;
    this.sel = 0;
    this.lockT = 0.8;          // 防误触
    this.phase = 'choose';     // choose → after
    this.afterT = 0;
    this.picked = null;
  }
  optRect(i) {
    const w = 760, h = 300;
    return { x: G.W / 2 - w - 30 + i * (w + 60), y: 470, w, h };
  }
  update(dt) {
    G.ThatKey.update(dt);
    if (this.phase === 'choose') {
      if (this.lockT > 0) { this.lockT -= dt; return; }
      if (G.Input.just.left || G.Input.just.right) { this.sel = 1 - this.sel; G.audio.select(); }
      const m = G.Input.mouse;
      for (let i = 0; i < 2; i++) {
        const r = this.optRect(i);
        if (m.x > r.x && m.x < r.x + r.w && m.y > r.y && m.y < r.y + r.h) {
          this.sel = i;
          if (m.just) this.confirm();
        }
      }
      if (G.Input.just.attack) this.confirm();
    } else {
      this.afterT += dt;
      if (this.afterT > 1.2 && (G.Input.just.attack || G.Input.mouse.just)) {
        G.audio.select();
        this.onDone();
      }
    }
  }
  confirm() {
    this.picked = this.sel === 0 ? this.data.a : this.data.b;
    if (this.picked.tag === 'heart') G.run.heart++;
    else G.run.blade++;
    G.run.nextBattleMods = this.picked.fx || null;
    this.phase = 'after';
    this.afterT = 0;
    G.audio.confirm();
  }
  wrap(ctx, text, cx, y, maxW, lh) {
    let line = '', ly = y;
    for (const ch of text) {
      line += ch;
      if (ctx.measureText(line).width > maxW) { ctx.fillText(line, cx, ly); line = ''; ly += lh; }
    }
    if (line) ctx.fillText(line, cx, ly);
    return ly;
  }
  draw(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#0b0d12'); g.addColorStop(1, '#141220');
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8c170';
    ctx.font = G.font(46);
    ctx.fillText('道 心 一 问', G.W / 2, 130);
    // 道心计数
    ctx.font = G.font(20);
    ctx.fillStyle = '#e07a9a';
    ctx.fillText(`情 ${'●'.repeat(G.run.heart)}${'○'.repeat(Math.max(0, 4 - G.run.heart))}`, G.W / 2 - 160, 178);
    ctx.fillStyle = '#8fb0d8';
    ctx.fillText(`争 ${'●'.repeat(G.run.blade)}${'○'.repeat(Math.max(0, 4 - G.run.blade))}`, G.W / 2 + 160, 178);
    // 情境
    ctx.fillStyle = '#c9d3dd';
    ctx.font = G.font(30, 400);
    this.wrap(ctx, this.data.prompt, G.W / 2, 280, 1400, 46);

    if (this.phase === 'choose') {
      ctx.globalAlpha = G.util.clamp(1 - this.lockT / 0.8, 0.25, 1);
      for (let i = 0; i < 2; i++) {
        const o = i === 0 ? this.data.a : this.data.b;
        const r = this.optRect(i);
        const hot = i === this.sel;
        const color = o.tag === 'heart' ? '#e07a9a' : '#8fb0d8';
        ctx.fillStyle = hot ? '#1c2430' : '#131a24';
        G.rr(ctx, r.x, r.y, r.w, r.h, 18); ctx.fill();
        ctx.strokeStyle = hot ? color : '#2c3a48';
        ctx.lineWidth = hot ? 4 : 2;
        G.rr(ctx, r.x, r.y, r.w, r.h, 18); ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = G.font(22);
        ctx.fillText(o.tag === 'heart' ? '〔情〕' : '〔争〕', r.x + r.w / 2, r.y + 48);
        ctx.fillStyle = '#e8eef4';
        ctx.font = G.font(30);
        this.wrap(ctx, o.t, r.x + r.w / 2, r.y + 116, r.w - 100, 44);
        ctx.fillStyle = '#7a9a8a';
        ctx.font = G.font(21);
        this.wrap(ctx, '◇ ' + o.hint, r.x + r.w / 2, r.y + 240, r.w - 100, 30);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#5a7684';
      ctx.font = G.font(23);
      ctx.fillText(this.lockT > 0 ? '…… 想 清 楚 再 选 ……' : '【A/D】选择　【J】决断', G.W / 2, 950);
    } else {
      // 结果
      const color = this.picked.tag === 'heart' ? '#e07a9a' : '#8fb0d8';
      ctx.fillStyle = color;
      ctx.font = G.font(28);
      ctx.fillText(this.picked.tag === 'heart' ? '—— 道心 · 情 +1 ——' : '—— 道心 · 争 +1 ——', G.W / 2, 520);
      ctx.fillStyle = '#e8eef4';
      ctx.font = G.font(28, 400);
      this.wrap(ctx, this.picked.after, G.W / 2, 600, 1300, 44);
      ctx.fillStyle = '#7a9a8a';
      ctx.font = G.font(22);
      ctx.fillText('◇ ' + this.picked.hint, G.W / 2, 780);
      if (this.afterT > 1.2 && Math.sin(G.time * 5) > 0) {
        ctx.fillStyle = '#e8c170';
        ctx.font = G.font(24);
        ctx.fillText('【J】继续', G.W / 2, 900);
      }
    }
    G.ThatKey.draw(ctx);
  }
}
G.ChoiceScene = ChoiceScene;

// ---------------- 终章：别按那个键 ----------------
class FinaleScene {
  constructor(onDone) {
    this.onDone = onDone;
    this.player = new G.Player();
    this.enemies = [];   // 供 Player.update 的接口占位
    this.bullets = [];
    this.fx = [];
    this.bubbles = []; this.fields = [];
    this.pshots = []; this.bombs = []; this.delayedBooms = []; this.chains = []; this.pickups = [];
    this.companions = [];
    this.freezeT = 0; this.lg2cd = 0;
    this.music = 'battle';
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
  // 三结局的收束
  startSeq(kind) {
    this.phase = kind;
    this.seqT = 0;
    G.Input.combatActive = false;
    if (kind === 'devour') {
      this.seq = [
        { t: 0.2, sub: ['tuntun', '婆婆，你说过的——进了肚子，就是缘分。'] },
        { t: 3.2, sub: ['granny', '小豚？！你要干什么——住手！！'] },
        { t: 5.8, sub: ['narrator', '（吞）——海豚的习惯，别问。'] },
      ];
      this.seqEnd = 8.6;
    } else {
      this.seq = [
        { t: 0.2, sub: ['tuntun', '婆婆。算数……给谁看？'] },
        { t: 3.2, sub: ['tuntun', '祂说了算的世界，我不稀罕「算数」。'] },
        { t: 6.2, sub: ['tuntun', '——不被记录的日子，我们自己记着。'] },
      ];
      this.seqEnd = 9.2;
    }
    G.audio.lock();
    G.addShake(8, 0.3);
  }
  finish(ending) {
    G.run.ending = ending;
    // 记录结局达成（跨周目收集）
    try {
      const seen = JSON.parse(localStorage.getItem('btk_endings') || '{}');
      seen[ending] = true;
      localStorage.setItem('btk_endings', JSON.stringify(seen));
    } catch (e) { }
    this.phase = 'flash';
    this.flashT = 0;
    G.audio.win();
  }
  update(dt) {
    this.t += dt;
    G.ThatKey.update(dt);

    if (this.phase === 'flash') {
      this.flashT += dt;
      if (this.flashT > 2.4) { this.exit(); this.onDone(); }
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
        else { this.finish('confirm'); }
        G.Input.just.thatkey = false;
      }
      // 道心分岔：争心占上风 → 可以吞了它；情心占上风 → 可以转身离开
      if (this.phase === 'prompt') {
        if (G.run.blade > G.run.heart && G.Input.just.skill) this.startSeq('devour');
        if (G.run.heart > G.run.blade && G.Input.just.heal) this.startSeq('stay');
      }
    } else if (this.phase === 'devour' || this.phase === 'stay') {
      this.seqT += dt;
      for (const ev of this.seq) {
        if (!ev.done && this.seqT >= ev.t) { ev.done = true; this.sub = ev.sub; this.subT = 3.2; }
      }
      if (this.seqT >= this.seqEnd) this.finish(this.phase);
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
    // 玩家神通残留物（终章无敌人，只做视觉流动与清理）
    for (const s of this.pshots) {
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.travel = (s.travel || 0) + Math.hypot(s.vx, s.vy) * dt;
      if (s.travel > (s.maxTravel || 800)) s.dead = true;
    }
    this.pshots = this.pshots.filter(s => !s.dead);
    for (const b of this.bombs) {
      b.t -= dt;
      if (b.t <= 0) this.fx.push({ type: 'ring', x: b.x, y: b.y, t: 0.35, max: b.r, color: '#b0a0e8' });
    }
    this.bombs = this.bombs.filter(b => b.t > 0);
    this.delayedBooms = []; this.chains = []; this.pickups = [];
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
    for (const s of this.pshots) {
      ctx.fillStyle = s.color || '#8fd8f0';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r || 8, 0, 7); ctx.fill();
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

    // 三结局的演出层
    if (this.phase === 'devour') {
      ctx.fillStyle = `rgba(60,10,10,${Math.min(0.55, this.seqT * 0.08)})`;
      ctx.fillRect(0, 0, G.W, G.H);
      if (this.seqT > 5.8) {
        // 吞键：天道之眼开始崩散
        G.addShake(6, 0.1);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd166';
        ctx.font = G.font(30);
        ctx.fillText('【警告！确认键信号丢失！警告——】', G.W / 2, 320);
      }
    }
    if (this.phase === 'stay') {
      ctx.fillStyle = `rgba(120,160,200,${Math.min(0.25, this.seqT * 0.04)})`;
      ctx.fillRect(0, 0, G.W, G.H);
      if (this.seqT > 6.2) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#a8c8e0';
        ctx.font = G.font(30);
        ctx.fillText('（天道的手，悬在半空。永远，落不下来了。）', G.W / 2, 320);
      }
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
      // 道心解锁的岔路
      if (this.phase === 'prompt') {
        if (G.run.blade > G.run.heart) {
          ctx.fillStyle = '#8fb0d8';
          ctx.font = G.font(26);
          ctx.fillText('争心已成 ——【K】或者……把它吞了', G.W / 2, G.H / 2 + 90);
        }
        if (G.run.heart > G.run.blade) {
          ctx.fillStyle = '#e07a9a';
          ctx.font = G.font(26);
          ctx.fillText('情心已满 ——【L】或者……转身，回家', G.W / 2, G.H / 2 + 90);
        }
      }
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
      const e = G.run.ending;
      const flashColor = e === 'devour' ? '10,6,8' : e === 'stay' ? '190,215,235' : '255,255,255';
      ctx.fillStyle = `rgba(${flashColor},${Math.min(1, this.flashT * 1.5)})`;
      ctx.fillRect(0, 0, G.W, G.H);
      if (this.flashT > 1) {
        const textColor = e === 'devour' ? `rgba(255,209,102,${Math.min(1, this.flashT - 1)})` : `rgba(20,26,32,${Math.min(1, this.flashT - 1)})`;
        ctx.fillStyle = textColor;
        ctx.font = G.font(40);
        ctx.textAlign = 'center';
        const line = e === 'devour' ? '【错误：确认键丢失。权限——转移。】'
          : e === 'stay' ? '【未确认。进程，保持运行。】'
            : '【确认成功。本局已记录。】';
        ctx.fillText(line, G.W / 2, G.H / 2);
      }
    }
    G.ThatKey.draw(ctx);
  }
}
G.FinaleScene = FinaleScene;

// ---------------- 结局（三变体） ----------------
const ENDINGS = {
  confirm: {
    no: '结局一', title: '万物算数', bg: '#0a0e14', titleColor: '#e8eef4',
    epitaph: '豚豚站上了键台。这一次，堂堂正正。',
    sub: '键台边多了一颗谁也不许碰的旧键帽。他说，那是他师父。',
  },
  devour: {
    no: '结局二', title: '新天道', bg: '#08060a', titleColor: '#ffd166',
    epitaph: '天上那只眼睛，生得胖胖的。看谁，都温柔。',
    sub: '红绡赢的时候，云会动一下。',
  },
  stay: {
    no: '结局三', title: '不算数的日子', bg: '#0c1218', titleColor: '#a8c8e0',
    epitaph: '那一局棋至今没有结束。棋盘上，一群海豚活得很吵。',
    sub: '不被记录的日子，他们自己记着。',
  },
};
class EndingScene {
  constructor() {
    this.t = 0;
    this.cfg = ENDINGS[G.run && G.run.ending] || ENDINGS.confirm;
    try { this.seen = Object.keys(JSON.parse(localStorage.getItem('btk_endings') || '{}')).length; }
    catch (e) { this.seen = 1; }
    if (G.run && G.run.ending === 'confirm') {
      // 确认结局也记录（吞键/转身在 finish() 已记）
      try {
        const seen = JSON.parse(localStorage.getItem('btk_endings') || '{}');
        seen.confirm = true;
        localStorage.setItem('btk_endings', JSON.stringify(seen));
        this.seen = Object.keys(seen).length;
      } catch (e) { }
    }
  }
  update(dt) {
    this.t += dt;
    if (this.t > 2 && G.Input.just.attack) { G.audio.confirm(); G.setScene(new TitleScene()); }
  }
  draw(ctx) {
    const c = this.cfg;
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.t / 2);
    if (G.run.ending === 'devour') {
      // 天上的胖眼睛
      G.drawPortrait(ctx, 'heaven', G.W / 2, 460, 2.0);
      ctx.fillStyle = 'rgba(255,209,102,0.5)';
      ctx.beginPath(); ctx.ellipse(G.W / 2 + 46, 500, 10, 6, 0, 0, 7); ctx.fill(); // 腮红——祂胖胖的
      ctx.beginPath(); ctx.ellipse(G.W / 2 - 46, 500, 10, 6, 0, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = '#1d242e';
      G.rr(ctx, G.W / 2 - 300, 560, 600, 80, 20); ctx.fill();
      G.drawPortrait(ctx, 'tuntun', G.W / 2, 480, 1.6);
      if (G.run.ending === 'stay') {
        // 姑娘们都在
        G.drawPortrait(ctx, 'sister', G.W / 2 - 220, 510, 1.0);
        G.drawPortrait(ctx, 'jingshu', G.W / 2 + 220, 510, 1.0);
        G.drawPortrait(ctx, 'linger', G.W / 2 + 110, 400, 0.7);
        G.drawPortrait(ctx, 'granny', G.W / 2 - 130, 400, 0.6);
      }
    }
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(1, this.t / 1.5);
    ctx.fillStyle = '#8a97a5';
    ctx.font = G.font(28);
    ctx.fillText(`—— ${c.no} ——`, G.W / 2, 160);
    ctx.fillStyle = c.titleColor;
    ctx.font = G.font(84);
    ctx.fillText(`「 ${c.title} 」`, G.W / 2, 260);
    ctx.globalAlpha = Math.min(1, Math.max(0, (this.t - 1.5) / 1.5));
    ctx.fillStyle = '#c9d3dd';
    ctx.font = G.font(28);
    ctx.fillText(c.epitaph, G.W / 2, 740);
    ctx.fillStyle = '#6a7a8a';
    ctx.font = G.font(23);
    ctx.fillText(c.sub, G.W / 2, 790);
    const n = G.ThatKey.count;
    ctx.fillStyle = '#c22f2f';
    ctx.font = G.font(21);
    ctx.fillText(`本次旅程你共手贱按了那个键 ${n} 次`, G.W / 2, 856);
    if (G.run) {
      ctx.fillStyle = '#5a7684';
      ctx.fillText(`道心 情${G.run.heart}·争${G.run.blade} · 阵亡 ${G.run.deaths || 0} 次 · 境界【${G.Powers.realm(G.run.level)}】 · 神通 ${G.run.powers.length} 道`, G.W / 2, 896);
      ctx.fillStyle = '#e8c170';
      ctx.fillText(`已见证结局：${this.seen} / 3`, G.W / 2, 936);
    }
    if (this.t > 2 && Math.sin(this.t * 4) > 0) {
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(28);
      ctx.fillText('【J】回到标题', G.W / 2, 1000);
    }
    ctx.globalAlpha = 1;
  }
}
G.EndingScene = EndingScene;
