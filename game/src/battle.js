// ======================== 战斗场景 ========================
class Battle {
  constructor(def, onWin) {
    this.def = def;
    this.onWin = onWin;
    this.player = new G.Player();
    this.enemies = [];
    this.bullets = [];
    this.markers = [];
    this.bubbles = [];   // 泡影护体
    this.fields = [];    // 音爆余韵声场
    this.fx = [];
    this.wave = -1;
    this.bossSpawned = false;
    this.deaths = 0;
    this.enemyHpMul = 1;
    this.state = def.curse ? 'curse' : 'fight';
    this.stateT = 0;
    this.tipT = 0;
    this.tipShown = false;
    this.winT = 0;
    this.mercyAsk = false;
  }

  enter() {
    G.currentBattle = this;
    const rules = [];
    if (this.def.curse) {
      this.levelRule = G.Curses.create(this.def.curse);
      rules.push(this.levelRule);
    }
    for (const c of G.run.tempCurses) rules.push(c.rule);
    G.Input.setRules(rules);
    G.events.clear('punish');
    G.events.on('punish', info => this.onPunish(info));
    if (this.state === 'fight') this.nextWave();
  }
  exit() {
    G.currentBattle = null;
    G.Input.setRules([]);
    G.Input.combatActive = false;
    G.events.clear('punish');
  }

  addBubble(x, y) { this.bubbles.push({ x, y, hp: 3, t: 4 }); }
  addField(x, y, r) { this.fields.push({ x, y, r, t: 3 }); }

  // ---------- 出怪 ----------
  nextWave() {
    this.wave++;
    if (this.wave >= this.def.waves.length) {
      if (this.def.boss && !this.bossSpawned) {
        this.bossSpawned = true;
        this.state = 'bossIntro';
        this.stateT = 1.6;
      } else this.startWin();
      return;
    }
    for (const grp of this.def.waves[this.wave]) {
      for (let i = 0; i < grp.n; i++) this.spawnEdge(grp.t);
    }
  }
  spawnEdge(type) {
    const A = G.ARENA, U = G.util;
    const side = U.randInt(0, 3);
    const x = side === 0 ? A.x + 60 : side === 1 ? A.x + A.w - 60 : U.rand(A.x + 80, A.x + A.w - 80);
    const y = side === 2 ? A.y + 60 : side === 3 ? A.y + A.h - 60 : U.rand(A.y + 80, A.y + A.h - 80);
    this.markers.push({ x, y, t: 0.8, type });
  }
  spawnAt(type, x, y) { this.markers.push({ x, y, t: 0.8, type }); }
  spawnBoss() {
    const cfgs = Array.isArray(this.def.boss) ? this.def.boss : [this.def.boss];
    cfgs.forEach((cfg, i) => {
      const x = G.W / 2 + (cfgs.length > 1 ? (i === 0 ? -260 : 260) : 0);
      const B = (cfg === 'steward')
        ? new G.Enemies.steward(x, G.ARENA.y + 160)
        : new G.GenericBoss(x, G.ARENA.y + 160, cfg);
      B.hp *= this.enemyHpMul; B.maxhp *= this.enemyHpMul;
      this.enemies.push(B);
    });
    G.addShake(10, 0.3);
  }
  bossNames() {
    const cfgs = Array.isArray(this.def.boss) ? this.def.boss : [this.def.boss];
    return cfgs.map(c => c === 'steward' ? '刻薄管事' : c.name.split(' · ')[0]).join(' & ');
  }

  // ---------- 天谴 ----------
  onPunish(info) {
    const res = info.res;
    this.player.smite(res.dmgFrac !== undefined ? res.dmgFrac : 0.15, res.stun || 0.5);
    this.fx.push({ type: 'lightning', x: this.player.x, y: this.player.y, t: 0.45 });
    this.fx.push({ type: 'text', x: this.player.x, y: this.player.y - 70, t: 1.0, str: res.msg || '天谴！', color: '#ffd166', size: 40 });
    this.flash = 0.35;
    G.addShake(16, 0.35);
    G.audio.punish();
    if (!this.tipShown && this.levelRule && info.rule === this.levelRule) {
      this.tipShown = true;
      this.tipT = 2.6;
    }
    if (this.player.hp <= 0) this.die();
  }

  die() {
    this.state = 'dead';
    this.deaths++;
    if (G.run) G.run.deaths = (G.run.deaths || 0) + 1;
    this.mercyAsk = this.deaths >= 3 && this.enemyHpMul === 1;
    G.Input.combatActive = false;
    G.audio.die();
  }
  retry(mercy) {
    if (mercy) this.enemyHpMul = 0.7;
    this.player.hp = this.player.maxhp;
    this.player.x = G.W / 2; this.player.y = G.ARENA.y + G.ARENA.h / 2;
    this.player.stunT = 0; this.player.wave = 0;
    this.enemies = []; this.bullets = []; this.markers = []; this.bubbles = []; this.fields = [];
    this.wave--;
    if (this.bossSpawned) { this.state = 'bossIntro'; this.stateT = 1.2; this.wave = this.def.waves.length - 1; }
    else { this.state = 'fight'; this.nextWave(); }
  }
  startWin() {
    this.state = 'win';
    this.winT = 2.0;
    G.Input.combatActive = false;
    G.audio.win();
  }

  // ---------- 主更新 ----------
  update(dt) {
    this.flash = Math.max(0, (this.flash || 0) - dt);
    G.ThatKey.update(dt);

    if (this.state === 'curse') {
      this.stateT += dt;
      const total = this.def.curseText.length * 0.45 + 1.3;
      if (this.stateT > this.def.curseText.length * 0.45 && !this._lockSnd) { this._lockSnd = true; G.audio.lock(); }
      if (this.stateT >= total + 1.2 || (this.stateT > total && G.Input.just.attack)) {
        this.state = 'fight';
        this.nextWave();
      }
      return;
    }
    if (this.state === 'bossIntro') {
      this.stateT -= dt;
      if (this.stateT <= 0) { this.spawnBoss(); this.state = 'fight'; }
      return;
    }
    if (this.state === 'dead') {
      if (this.mercyAsk) {
        if (G.Input.just.attack) { this.retry(true); }
        else if (G.Input.just.skill) { this.mercyAsk = false; this.retry(false); }
      } else if (G.Input.just.attack) this.retry(false);
      return;
    }
    if (this.state === 'win') {
      this.winT -= dt;
      if (this.winT <= 0) { this.exit(); this.onWin(); }
      return;
    }

    // --- fight ---
    if (this.tipT > 0) {
      this.tipT -= dt;
      G.Input.combatActive = false;
      return;
    }
    G.Input.combatActive = true;
    G.Input.update(dt);
    this.player.update(dt, this);

    for (const m of this.markers) {
      m.t -= dt;
      if (m.t <= 0) {
        const e = new G.Enemies[m.type](m.x, m.y);
        e.hp *= this.enemyHpMul;
        this.enemies.push(e);
      }
    }
    this.markers = this.markers.filter(m => m.t > 0);

    for (const e of this.enemies) e.update(dt, this);
    // 声场灼烧
    for (const f of this.fields) {
      f.t -= dt;
      for (const e of this.enemies) {
        if (G.util.dist(f.x, f.y, e.x, e.y) < f.r + e.r) e.hp -= 15 * dt * (e.hp <= 0 ? 0 : 1);
      }
    }
    this.fields = this.fields.filter(f => f.t > 0);
    for (const e of this.enemies) if (e.hp <= 0) e.dead = true;

    const killed = this.enemies.filter(e => e.dead);
    for (const e of killed) {
      this.fx.push({ type: 'ring', x: e.x, y: e.y, t: 0.3, max: e.r * 2, color: '#8a97a5' });
      for (let i = 0; i < 6; i++) this.fx.push({ type: 'spark', x: e.x, y: e.y, t: 0.4, a: Math.random() * 7, sp: G.util.rand(100, 300) });
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    // 子弹（泡泡可挡）
    for (const b of this.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      for (const bub of this.bubbles) {
        if (bub.hp > 0 && G.util.dist(b.x, b.y, bub.x, bub.y) < 46 + b.r) {
          bub.hp--; b.dead = true;
          this.fx.push({ type: 'ring', x: b.x, y: b.y, t: 0.2, max: 30, color: '#8fd8f0' });
          break;
        }
      }
      if (!b.dead && G.util.dist(b.x, b.y, this.player.x, this.player.y) < b.r + this.player.r - 6) {
        this.player.hurt(b.dmg, b.x, b.y);
        b.dead = true;
      }
      const A = G.ARENA;
      if (b.x < A.x - 40 || b.x > A.x + A.w + 40 || b.y < A.y - 40 || b.y > A.y + A.h + 40) b.dead = true;
    }
    this.bullets = this.bullets.filter(b => !b.dead);
    for (const bub of this.bubbles) bub.t -= dt;
    this.bubbles = this.bubbles.filter(b => b.t > 0 && b.hp > 0);

    for (const f of this.fx) f.t -= dt;
    this.fx = this.fx.filter(f => f.t > 0);

    if (this.player.hp <= 0) { this.die(); return; }
    if (this.enemies.length === 0 && this.markers.length === 0) this.nextWave();
  }

  // ---------- 绘制 ----------
  draw(ctx) {
    const A = G.ARENA, U = G.util;
    ctx.fillStyle = '#11181f';
    G.rr(ctx, A.x - 14, A.y - 14, A.w + 28, A.h + 28, 24); ctx.fill();
    ctx.strokeStyle = '#2a3a4a'; ctx.lineWidth = 4;
    G.rr(ctx, A.x - 14, A.y - 14, A.w + 28, A.h + 28, 24); ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#7fa8c9';
    for (let gx = 0; gx < 8; gx++) for (let gy = 0; gy < 3; gy++) {
      G.rr(ctx, A.x + 70 + gx * 200, A.y + 70 + gy * 230, 110, 110, 16);
      ctx.stroke();
    }
    ctx.restore();

    // 声场
    for (const f of this.fields) {
      ctx.fillStyle = `rgba(110,231,255,${0.08 + Math.sin(G.time * 8) * 0.03})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(110,231,255,${f.t / 3 * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.stroke();
    }
    // 出怪预警
    for (const m of this.markers) {
      const p = 1 - m.t / 0.8;
      ctx.strokeStyle = `rgba(255,107,94,${0.3 + p * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(m.x, m.y, 34 * (1 - p * 0.4), 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, 7); ctx.stroke();
    }

    for (const e of this.enemies) e.draw(ctx);
    // 泡泡
    for (const bub of this.bubbles) {
      ctx.globalAlpha = Math.min(1, bub.t) * 0.7;
      ctx.strokeStyle = '#8fd8f0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bub.x, bub.y, 46, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(143,216,240,0.12)';
      ctx.beginPath(); ctx.arc(bub.x, bub.y, 46, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const b of this.bullets) {
      ctx.fillStyle = '#ff6b5e';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,190,0.7)';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.45, 0, 7); ctx.fill();
    }
    this.player.draw(ctx);

    for (const f of this.fx) {
      if (f.type === 'slash') {
        const p = f.t / 0.15;
        ctx.save();
        ctx.translate(f.x, f.y); ctx.rotate(f.a);
        ctx.strokeStyle = `rgba(232,238,244,${p})`;
        ctx.lineWidth = f.big ? 14 : 8;
        ctx.beginPath(); ctx.arc(0, 0, f.big ? 120 : 100, -0.7, 0.7); ctx.stroke();
        ctx.restore();
      } else if (f.type === 'ring') {
        const p = 1 - f.t / (f.t0 || (f.t0 = f.t));
        ctx.strokeStyle = f.color;
        ctx.globalAlpha = 1 - p;
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.max * p, 0, 7); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (f.type === 'text') {
        ctx.globalAlpha = Math.min(1, f.t * 2);
        ctx.fillStyle = f.color;
        ctx.font = G.font(f.size);
        ctx.textAlign = 'center';
        ctx.fillText(f.str, f.x, f.y - (1 - f.t) * 30);
        ctx.globalAlpha = 1;
      } else if (f.type === 'lightning') {
        const p = f.t / 0.45;
        ctx.strokeStyle = `rgba(255,209,102,${p})`;
        ctx.lineWidth = 10 * p + 2;
        ctx.beginPath();
        let ly = 0;
        ctx.moveTo(f.x + U.rand(-6, 6), 0);
        while (ly < f.y) { ly += 60; ctx.lineTo(f.x + U.rand(-22, 22), Math.min(ly, f.y)); }
        ctx.stroke();
        ctx.fillStyle = `rgba(255,209,102,${p * 0.6})`;
        ctx.beginPath(); ctx.arc(f.x, f.y, 40 * (1 - p) + 15, 0, 7); ctx.fill();
      } else if (f.type === 'spark') {
        const p = 1 - f.t / 0.4;
        ctx.fillStyle = `rgba(200,215,226,${1 - p})`;
        ctx.beginPath();
        ctx.arc(f.x + Math.cos(f.a) * f.sp * p, f.y + Math.sin(f.a) * f.sp * p, 4 * (1 - p) + 1, 0, 7);
        ctx.fill();
      }
    }

    // 规则的世界层特效（如天道之眼）
    for (const r of G.Input.rules) if (r.draw) r.draw(ctx, this);

    G.HUD.draw(ctx, this);

    if (this.def.tutorial) {
      ctx.fillStyle = 'rgba(10,14,18,0.7)';
      G.rr(ctx, 44, 150, 400, 44 + G.DATA.TUTOR_HINTS.length * 36, 12); ctx.fill();
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(21);
      ctx.textAlign = 'left';
      ctx.fillText('帽婆婆的练功须知：', 64, 186);
      ctx.fillStyle = '#c9d3dd';
      ctx.font = G.font(19, 400);
      G.DATA.TUTOR_HINTS.forEach((h, i) => ctx.fillText(h, 64, 222 + i * 36));
    }

    if (this.state === 'curse') this.drawCurseIntro(ctx);
    if (this.state === 'bossIntro') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, G.H / 2 - 90, G.W, 180);
      ctx.fillStyle = '#d08770';
      ctx.font = G.font(64);
      ctx.textAlign = 'center';
      ctx.fillText('关主 · ' + this.bossNames(), G.W / 2, G.H / 2 + 20);
    }
    if (this.tipT > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = G.font(46);
      ctx.fillText('天　谴', G.W / 2, G.H / 2 - 80);
      ctx.fillStyle = '#e8eef4';
      ctx.font = G.font(28);
      ctx.fillText('键誓生效中——违反一次，遭一次天谴（扣血 + 麻痹）。', G.W / 2, G.H / 2);
      ctx.fillStyle = '#e8c170';
      ctx.fillText('帽婆婆：「用别的活法赢。」', G.W / 2, G.H / 2 + 60);
    }
    if (this.state === 'dead') {
      ctx.fillStyle = 'rgba(10,5,5,0.75)';
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff6b6b';
      ctx.font = G.font(72);
      ctx.fillText('被打趴了……', G.W / 2, G.H / 2 - 60);
      ctx.font = G.font(30);
      if (this.mercyAsk) {
        ctx.fillStyle = '#e8c170';
        ctx.fillText('帽婆婆心软了：「要不要老身削他们三成血？」', G.W / 2, G.H / 2 + 30);
        ctx.fillStyle = '#e8eef4';
        ctx.fillText('【J】要（削弱敌人）　　【K】不要（硬气重来）', G.W / 2, G.H / 2 + 90);
      } else {
        ctx.fillStyle = '#e8eef4';
        ctx.fillText('【J】爬起来再战（从当前波次继续）', G.W / 2, G.H / 2 + 40);
      }
    }
    if (this.state === 'win') {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, G.H / 2 - 100, G.W, 200);
      ctx.fillStyle = '#7ddf8e';
      ctx.font = G.font(78);
      ctx.textAlign = 'center';
      ctx.fillText(this.def.winText || '过关！', G.W / 2, G.H / 2 + 26);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,60,40,${this.flash * 0.8})`;
      ctx.fillRect(0, 0, G.W, G.H);
    }
    G.ThatKey.draw(ctx);
  }

  // 键誓宣告演出：大字逐个砸出（动态排版，适配长修饰词）
  drawCurseIntro(ctx) {
    const words = this.def.curseText;
    ctx.fillStyle = 'rgba(5,5,8,0.82)';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // 动态计算每个词宽度与总宽，超宽则缩字号
    let base = 110;
    const widths = [];
    let total = 0;
    ctx.font = G.font(base);
    for (const w of words) {
      const hot = w === this.def.curseKeyword;
      ctx.font = G.font(hot ? base * 1.25 : base);
      const wd = ctx.measureText(w).width + 60;
      widths.push(wd);
      total += wd;
    }
    const scale = Math.min(1, 1700 / total);
    const shown = Math.floor(this.stateT / 0.45) + 1;
    let x = G.W / 2 - total * scale / 2;
    for (let i = 0; i < Math.min(shown, words.length); i++) {
      const age = this.stateT - i * 0.45;
      const pop = Math.min(1, age / 0.15);
      const hot = words[i] === this.def.curseKeyword;
      const cx = x + widths[i] * scale / 2;
      ctx.save();
      ctx.translate(cx, G.H / 2 - 40);
      ctx.scale((2 - pop) * scale, (2 - pop) * scale);
      ctx.globalAlpha = pop;
      ctx.fillStyle = hot ? '#ff3b30' : '#e8eef4';
      ctx.font = G.font(hot ? base * 1.25 : base);
      if (hot) { ctx.shadowColor = 'rgba(255,60,40,0.9)'; ctx.shadowBlur = 40; }
      ctx.fillText(words[i], 0, 0);
      ctx.restore();
      if (age < 0.15 && age > 0) G.addShake(8, 0.1);
      x += widths[i] * scale;
    }
    if (shown > words.length) {
      ctx.fillStyle = '#8a97a5';
      ctx.font = G.font(26);
      ctx.fillText('—— 键誓已生效，此关常驻 ——', G.W / 2, G.H / 2 + 130);
      if (this.def.curseHint) {
        ctx.fillStyle = '#e8c170';
        ctx.font = G.font(28);
        ctx.fillText(this.def.curseHint, G.W / 2, G.H / 2 + 190);
      }
      ctx.fillStyle = '#5a7684';
      ctx.font = G.font(20);
      ctx.fillText('【J】应战', G.W / 2, G.H / 2 + 240);
    }
    ctx.textBaseline = 'alphabetic';
  }
}
G.Battle = Battle;
