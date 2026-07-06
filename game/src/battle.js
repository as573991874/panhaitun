// ======================== 战斗场景 ========================
class Battle {
  constructor(def, onWin) {
    this.def = def;
    this.onWin = onWin;
    this.player = new G.Player();
    this.enemies = [];
    this.bullets = [];    // 敌弹
    this.pshots = [];     // 友方弹幕（水刃/花瓣/水箭/反奏……）
    this.bombs = [];      // 残影炸弹
    this.delayedBooms = [];
    this.chains = [];     // 连环爆
    this.pickups = [];    // 回复泡
    this.markers = [];
    this.bubbles = [];
    this.fields = [];
    this.companions = [];
    this.fx = [];
    this.wave = -1;
    this.bossSpawned = false;
    this.deaths = 0;
    this.enemyHpMul = 1;
    this.freezeT = 0;     // 刹那时凝
    this.lg2cd = 0;       // 灵光护主冷却
    this.music = 'battle';
    // 键誓宣告只在本关第一间房演出（rogue 房间共享关卡键誓）
    this.state = (def.curse && !def.skipCurseIntro) ? 'curse' : 'fight';
    this.stateT = 0;
    this.tipT = 0;
    this.tipShown = false;
    this.winT = 0;
    this.mercyAsk = false;
    this.pick = null;     // 升级三选一覆盖层
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
    this.syncCompanions();
    // 关内伤势随行（rogue：一关之内不回满）
    if (G.run.hp != null) this.player.hp = Math.max(1, Math.min(this.player.maxhp, G.run.hp));
    // 房间词缀
    const rm = this.def.roomMods || {};
    this.bulletSpeedMul = rm.bulletSpeed || 1;
    this.enemySpeedMul = rm.enemySpeed || 1;
    this.roomWaveMul = rm.waveGain || 1;
    this.xpMul = rm.xpMul || 1;
    this.smiteBonus = rm.smite || 1;
    if (rm.hpMul) this.enemyHpMul *= rm.hpMul;
    // 关后抉择的开局馈赠 / 挑战（用完即弃）
    const nm = G.run.nextBattleMods;
    if (nm) {
      if (nm.shield) this.player.shield = nm.shield;
      if (nm.wave) this.player.wave = Math.min(100, nm.wave);
      if (nm.xp) this.addXp(nm.xp);
      if (nm.enemyHpMul) this.enemyHpMul *= nm.enemyHpMul;
      if (nm.extra) this.bonusExtra = nm.extra;
      if (nm.smiteMul) this.smiteBonus *= nm.smiteMul;
      G.run.nextBattleMods = null;
    }
    if (this.state === 'fight') this.nextWave();
  }
  exit() {
    G.currentBattle = null;
    G.Input.setRules([]);
    G.Input.combatActive = false;
    G.events.clear('punish');
  }

  // 羁绊同伴：按已缔结的缘起神通上场（升级中途缔结也会即刻驰援）
  syncCompanions() {
    const want = [['hx1', 'hongxiao'], ['lg1', 'linger'], ['js1', 'jingshu']];
    for (const [pid, kind] of want) {
      if (G.has(pid) && !this.companions.some(c => c.kind === kind)) {
        const c = new G.Companion(kind);
        c.x = this.player.x + G.util.rand(-80, 80);
        c.y = this.player.y - 80;
        this.companions.push(c);
        this.fx.push({ type: 'ring', x: c.x, y: c.y, t: 0.5, max: 80, color: '#e8c170' });
        c.say(kind === 'hongxiao' ? '本师姐来了！' : kind === 'linger' ? '灵儿来啦～' : '静。');
      }
    }
  }

  addBubble(x, y) { this.bubbles.push({ x, y, hp: 3, t: 4 }); }
  addField(x, y, r) { this.fields.push({ x, y, r, t: 3 }); }

  // ---------- 修为 ----------
  addXp(n) {
    G.run.xp += n * (this.xpMul || 1);
    while (G.run.xp >= G.Powers.xpNeed(G.run.level)) {
      G.run.xp -= G.Powers.xpNeed(G.run.level);
      G.run.level++;
      G.run.levelQueue++;
      G.audio.win();
    }
  }

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
    // 抉择带来的追兵（只在第一波）
    if (this.wave === 0 && this.bonusExtra) {
      for (let i = 0; i < this.bonusExtra; i++) this.spawnEdge('slave');
      this.bonusExtra = 0;
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
    const frac = (res.dmgFrac !== undefined ? res.dmgFrac : 0.15) * (this.smiteBonus || 1);
    this.player.smite(frac, res.stun || 0.5);
    this.fx.push({ type: 'lightning', x: this.player.x, y: this.player.y, t: 0.45 });
    this.fx.push({ type: 'text', x: this.player.x, y: this.player.y - 70, t: 1.0, str: res.msg || '天谴！', color: '#ffd166', size: 40 });
    if (G.has('dao5')) this.fx.push({ type: 'text', x: this.player.x, y: this.player.y - 110, t: 1.2, str: '共鸣！伤害翻倍！', color: '#ff9166', size: 28 });
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
    this.pshots = []; this.bombs = []; this.delayedBooms = []; this.chains = []; this.pickups = [];
    this.wave--;
    if (this.bossSpawned) { this.state = 'bossIntro'; this.stateT = 1.2; this.wave = this.def.waves.length - 1; }
    else { this.state = 'fight'; this.nextWave(); }
  }
  startWin() {
    this.state = 'win';
    this.winT = 2.0;
    // 伤势随行到下一间房
    G.run.hp = this.player.hp;
    // 险道奖励：一次境界突破（下一场战斗开打时触发）
    if (this.def.reward === 'breakthrough') {
      G.run.levelQueue++;
      this.fx.push({ type: 'text', x: this.player.x, y: this.player.y - 90, t: 1.6, str: '险道机缘：境界将破！', color: '#e8c170', size: 32 });
    }
    G.Input.combatActive = false;
    G.audio.win();
  }

  // ---------- 主更新 ----------
  update(dt) {
    this.flash = Math.max(0, (this.flash || 0) - dt);
    this.freezeT = Math.max(0, this.freezeT - dt);
    this.lg2cd = Math.max(0, this.lg2cd - dt);
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
    // 升级三选一（世界暂停）
    if (this.state === 'levelup') {
      G.Input.combatActive = false;
      this.pick.update(dt);
      return;
    }

    // --- fight ---
    if (this.tipT > 0) {
      this.tipT -= dt;
      G.Input.combatActive = false;
      return;
    }
    // 境界突破触发
    if (G.run.levelQueue > 0) {
      G.run.levelQueue--;
      this.state = 'levelup';
      this.pick = new G.PowerPick(this.def.id, () => {
        this.state = 'fight';
        this.player.iframes = Math.max(this.player.iframes, 1.2);
        this.syncCompanions();
        this.pick = null;
      });
      return;
    }
    G.Input.combatActive = true;
    G.Input.update(dt);
    this.player.update(dt, this);
    for (const c of this.companions) c.update(dt, this);

    for (const m of this.markers) {
      m.t -= dt;
      if (m.t <= 0) {
        const e = new G.Enemies[m.type](m.x, m.y);
        e.hp *= this.enemyHpMul;
        this.enemies.push(e);
      }
    }
    this.markers = this.markers.filter(m => m.t > 0);

    // 敌人（眩晕跳过 / 迟缓减速 / 词缀加速）
    for (const e of this.enemies) {
      if (e.stunT > 0) { e.stunT -= dt; continue; }
      const f = (e.slowT > 0 ? 0.5 : 1) * (this.enemySpeedMul || 1);
      if (e.slowT > 0) e.slowT -= dt;
      e.update(dt * f, this);
    }

    // 声场：灼烧 +（缓声之环）迟缓
    for (const f of this.fields) {
      f.t -= dt;
      for (const e of this.enemies) {
        if (G.util.dist(f.x, f.y, e.x, e.y) < f.r + e.r) {
          e.hp -= 15 * dt;
          e.flash = Math.max(e.flash, 0.05);
          if (G.has('so4')) e.slowT = Math.max(e.slowT, 0.2);
        }
      }
    }
    this.fields = this.fields.filter(f => f.t > 0);

    // 残影炸弹
    for (const b of this.bombs) {
      b.t -= dt;
      if (b.t <= 0) {
        for (const e of this.enemies) {
          if (G.util.dist(b.x, b.y, e.x, e.y) < b.r + e.r) e.hit(b.dmg, b.x, b.y, 200);
        }
        this.fx.push({ type: 'ring', x: b.x, y: b.y, t: 0.35, max: b.r, color: '#b0a0e8' });
        if (b.needles) {
          for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3;
            this.pshots.push({
              x: b.x, y: b.y, vx: Math.cos(a) * 440, vy: Math.sin(a) * 440,
              r: 7, dmg: 8 * (G.run.mods.synergyMul || 1), pierce: false, travel: 0, maxTravel: 700, color: '#b0a0e8', hits: [],
            });
          }
        }
        G.audio.boom();
      }
    }
    this.bombs = this.bombs.filter(b => b.t > 0);

    // 双重奏
    for (const b of this.delayedBooms) {
      b.t -= dt;
      if (b.t <= 0) {
        for (const e of this.enemies) {
          if (G.util.dist(b.x, b.y, e.x, e.y) < b.r + e.r) {
            e.hit(b.dmg, b.x, b.y, 250);
            if (G.has('so6') && e.hp <= 0) this.chains.push({ x: e.x, y: e.y, t: 0.2 });
          }
        }
        this.fx.push({ type: 'ring', x: b.x, y: b.y, t: 0.4, max: b.r, color: '#6ee7ff' });
        G.audio.boom();
      }
    }
    this.delayedBooms = this.delayedBooms.filter(b => b.t > 0);

    // 连环爆
    for (const c of this.chains) {
      c.t -= dt;
      if (c.t <= 0) {
        for (const e of this.enemies) {
          if (G.util.dist(c.x, c.y, e.x, e.y) < 80 + e.r) e.hit(15 * (G.run.mods.synergyMul || 1), c.x, c.y, 150);
        }
        this.fx.push({ type: 'ring', x: c.x, y: c.y, t: 0.3, max: 80, color: '#ffb86e' });
      }
    }
    this.chains = this.chains.filter(c => c.t > 0);

    // 击杀结算（修为）
    const killed = this.enemies.filter(e => e.dead || e.hp <= 0);
    for (const e of killed) {
      e.dead = true;
      this.addXp(e.xp || 12);
      this.fx.push({ type: 'ring', x: e.x, y: e.y, t: 0.3, max: e.r * 2, color: '#8a97a5' });
      this.fx.push({ type: 'text', x: e.x, y: e.y - e.r - 20, t: 0.7, str: '+' + (e.xp || 12), color: '#b8a8e8', size: 20 });
      for (let i = 0; i < 6; i++) this.fx.push({ type: 'spark', x: e.x, y: e.y, t: 0.4, a: Math.random() * 7, sp: G.util.rand(100, 300) });
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    // 友方弹幕
    const syn = 1;
    for (const s of this.pshots) {
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.travel = (s.travel || 0) + Math.hypot(s.vx, s.vy) * dt;
      if (s.travel > (s.maxTravel || 800)) {
        if (s.returns && !s.returned) { s.returned = true; s.vx = -s.vx; s.vy = -s.vy; s.travel = 0; s.hits = []; }
        else s.dead = true;
      }
      for (const e of this.enemies) {
        if (s.hits.includes(e)) continue;
        if (G.util.dist(s.x, s.y, e.x, e.y) < s.r + e.r) {
          s.hits.push(e);
          e.hit(s.dmg, s.x, s.y, s.push || 60);
          if (s.slow) e.slowT = Math.max(e.slowT, 2);
          if (s.ripple) {
            for (const e2 of this.enemies) {
              if (e2 !== e && G.util.dist(s.x, s.y, e2.x, e2.y) < 70 + e2.r) e2.hit(6 * syn, s.x, s.y, 40);
            }
            this.fx.push({ type: 'ring', x: s.x, y: s.y, t: 0.25, max: 70, color: '#7ab0d0' });
          }
          if (s.split && !s.didSplit) {
            s.didSplit = true;
            const base = Math.atan2(s.vy, s.vx);
            for (const da of [-0.7, 0.7]) {
              this.pshots.push({
                x: s.x, y: s.y, vx: Math.cos(base + da) * 480, vy: Math.sin(base + da) * 480,
                r: 8, dmg: 8 * (G.run.mods.synergyMul || 1), pierce: false, travel: 0, maxTravel: 500, color: '#8fd8f0', hits: [],
              });
            }
          }
          if (!s.pierce) { s.dead = true; break; }
        }
      }
      const A = G.ARENA;
      if (s.x < A.x - 60 || s.x > A.x + A.w + 60 || s.y < A.y - 60 || s.y > A.y + A.h + 60) s.dead = true;
    }
    this.pshots = this.pshots.filter(s => !s.dead);

    // 回复泡
    for (const b of this.pickups) {
      b.t -= dt;
      if (b.bounce) {
        b.x += b.vx * dt; b.y += b.vy * dt;
        const A = G.ARENA;
        if (b.x < A.x + b.r || b.x > A.x + A.w - b.r) b.vx = -b.vx;
        if (b.y < A.y + b.r || b.y > A.y + A.h - b.r) b.vy = -b.vy;
        // 顽皮泡泡撞敌
        for (const e of this.enemies) {
          if (G.util.dist(b.x, b.y, e.x, e.y) < b.r + e.r) {
            e.hit(10 * (G.run.mods.synergyMul || 1), b.x, b.y, 120);
            b.t = 0;
            this.fx.push({ type: 'ring', x: b.x, y: b.y, t: 0.3, max: 60, color: '#9ad8c8' });
            break;
          }
        }
      }
      if (b.t > 0 && G.util.dist(b.x, b.y, this.player.x, this.player.y) < b.r + this.player.r) {
        this.player.hp = Math.min(this.player.maxhp, this.player.hp + b.heal);
        if (G.has('lg3')) this.player.gainWave(20);
        b.t = 0;
        this.fx.push({ type: 'text', x: b.x, y: b.y - 30, t: 0.7, str: '+' + b.heal, color: '#7ddf8e', size: 26 });
        G.audio.heal();
      }
    }
    this.pickups = this.pickups.filter(b => b.t > 0);

    // 敌弹（时凝 / 迟缓区 / 泡泡 / 擦弹 / 吞纳漩涡）
    const jsAura = G.has('js5') && this.companions.find(c => c.kind === 'jingshu');
    for (const b of this.bullets) {
      let f = this.bulletSpeedMul || 1;
      if (this.freezeT > 0) f = 0;
      else {
        if (G.has('so4')) {
          for (const fd of this.fields) if (G.util.dist(b.x, b.y, fd.x, fd.y) < fd.r) { f *= 0.5; break; }
        }
        if (jsAura && G.util.dist(b.x, b.y, jsAura.x, jsAura.y) < 240) f *= 0.5;
      }
      b.x += b.vx * dt * f; b.y += b.vy * dt * f;
      // 吞纳漩涡：吐纳时吸弹化音
      if (G.has('br1') && this.player.channeling && G.util.dist(b.x, b.y, this.player.x, this.player.y) < 150) {
        b.dead = true;
        this.player.gainWave(4);
        this.fx.push({ type: 'spark', x: b.x, y: b.y, t: 0.3, a: Math.random() * 7, sp: 100 });
        continue;
      }
      for (const bub of this.bubbles) {
        if (bub.hp > 0 && G.util.dist(b.x, b.y, bub.x, bub.y) < 46 + b.r) {
          bub.hp--; b.dead = true;
          this.fx.push({ type: 'ring', x: b.x, y: b.y, t: 0.2, max: 30, color: '#8fd8f0' });
          break;
        }
      }
      if (b.dead) continue;
      const pd = G.util.dist(b.x, b.y, this.player.x, this.player.y);
      if (pd < b.r + this.player.r - 6) {
        this.player.hurt(b.dmg, b.x, b.y);
        b.dead = true;
      } else if (G.has('sc3') && !b.grazed && pd < b.r + this.player.r + 26) {
        // 擦浪：擦身而过化为音波
        b.grazed = true;
        this.player.gainWave(3);
        this.fx.push({ type: 'text', x: this.player.x, y: this.player.y - 46, t: 0.4, str: '擦！', color: '#6ee7ff', size: 20 });
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

    for (const f of this.fields) {
      ctx.fillStyle = `rgba(110,231,255,${0.08 + Math.sin(G.time * 8) * 0.03})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(110,231,255,${f.t / 3 * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.stroke();
    }
    for (const m of this.markers) {
      const p = 1 - m.t / 0.8;
      ctx.strokeStyle = `rgba(255,107,94,${0.3 + p * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(m.x, m.y, 34 * (1 - p * 0.4), 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, 7); ctx.stroke();
    }
    // 残影炸弹（未爆）
    for (const b of this.bombs) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#b0a0e8';
      ctx.beginPath(); ctx.ellipse(b.x, b.y, 26, 20, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // 回复泡
    for (const b of this.pickups) {
      const bb = Math.sin(G.time * 4 + b.x) * 4;
      ctx.strokeStyle = '#9ad8c8'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(b.x, b.y + bb, b.r, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(154,216,200,0.18)';
      ctx.beginPath(); ctx.arc(b.x, b.y + bb, b.r, 0, 7); ctx.fill();
      ctx.fillStyle = '#9ad8c8';
      ctx.font = G.font(18);
      ctx.textAlign = 'center';
      ctx.fillText('+', b.x, b.y + bb + 6);
    }

    for (const e of this.enemies) e.draw(ctx);
    for (const c of this.companions) c.draw(ctx);
    for (const bub of this.bubbles) {
      ctx.globalAlpha = Math.min(1, bub.t) * 0.7;
      ctx.strokeStyle = '#8fd8f0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bub.x, bub.y, 46, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(143,216,240,0.12)';
      ctx.beginPath(); ctx.arc(bub.x, bub.y, 46, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // 友方弹幕
    for (const s of this.pshots) {
      if (s.wall) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.atan2(s.vy, s.vx) + Math.PI / 2);
        ctx.fillStyle = s.color;
        G.rr(ctx, -s.r, -18, s.r * 2, 36, 16); ctx.fill();
        ctx.restore();
      } else if (s.blade) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.atan2(s.vy, s.vx));
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.ellipse(0, 0, 20, 7, 0, 0, 7); ctx.fill();
        ctx.restore();
      } else if (s.petal) {
        ctx.fillStyle = s.color;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(G.time * 8);
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, 7); ctx.fill();
        ctx.restore();
      } else if (s.arrow) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.atan2(s.vy, s.vx));
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -4); ctx.lineTo(-8, 4); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = s.color || '#8fd8f0';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
      }
    }
    // 敌弹
    for (const b of this.bullets) {
      ctx.fillStyle = this.freezeT > 0 ? '#a0b8cc' : '#ff6b5e';
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
      } else if (f.type === 'beam') {
        const p = f.t / 0.3;
        ctx.save();
        ctx.translate(f.x, f.y); ctx.rotate(f.a);
        ctx.fillStyle = `rgba(110,231,255,${p * 0.8})`;
        ctx.fillRect(0, -14 * p, 1400, 28 * p);
        ctx.fillStyle = `rgba(255,255,255,${p})`;
        ctx.fillRect(0, -4, 1400, 8);
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

    // 时凝提示
    if (this.freezeT > 0) {
      ctx.fillStyle = `rgba(160,200,230,${this.freezeT * 0.12})`;
      ctx.fillRect(0, 0, G.W, G.H);
    }

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
    if (this.state === 'levelup' && this.pick) this.pick.draw(ctx);
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

  // 键誓宣告演出（动态排版）
  drawCurseIntro(ctx) {
    const words = this.def.curseText;
    ctx.fillStyle = 'rgba(5,5,8,0.82)';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let base = 110;
    const widths = [];
    let total = 0;
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
