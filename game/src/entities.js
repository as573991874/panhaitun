// ======================== 实体：玩家 / 敌人 / 子弹 / 特效 ========================
G.ARENA = { x: 150, y: 230, w: 1620, h: 690 };

const clampArena = (e) => {
  const A = G.ARENA;
  e.x = G.util.clamp(e.x, A.x + e.r, A.x + A.w - e.r);
  e.y = G.util.clamp(e.y, A.y + e.r, A.y + A.h - e.r);
};

// ---------------- 玩家：胖海豚豚豚 ----------------
class Player {
  constructor() {
    this.x = G.W / 2; this.y = G.ARENA.y + G.ARENA.h / 2;
    this.r = 27;
    this.maxhp = 100; this.hp = 100;
    this.face = 0;
    this.baseSpeed = 310;
    this.wave = 0;
    this.dashT = 0; this.dashDir = { x: 1, y: 0 };
    this.dashCds = [];
    this.dashHitSet = [];       // 本次冲刺已穿过的敌人（破军/连绵）
    this.iframes = 0;
    this.stunT = 0;
    this.attackCd = 0; this.comboN = 0; this.comboT = 0;
    this.channel = 0; this.healCd = 0;
    this.hurtFlash = 0;
    this.trail = [];
    // 神通状态
    this.shield = 0;            // 水鳞护盾（跃鳞/盈息）
    this.shieldCd = 0;
    this.blessHits = 0;         // 以息养刃
    this.rageT = 0;             // 天键共鸣
    this.holdT = 0;             // 鲸落蓄力
    this.stillT = 0;            // 大智若鱼
    this.primed = false;
  }
  get mods() { return G.run.mods; }
  get dashing() { return this.dashT > 0; }
  get channeling() { return this.channel > 0; }
  // 有效伤害系数（天键共鸣翻倍）
  get dmgMulEff() { return this.mods.dmgMul * (this.rageT > 0 ? 2 : 1); }
  get syn() { return this.mods.synergyMul || 1; }

  update(dt, battle) {
    const I = G.Input, U = G.util;
    this.iframes = Math.max(0, this.iframes - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.healCd = Math.max(0, this.healCd - dt);
    this.shieldCd = Math.max(0, this.shieldCd - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.rageT = Math.max(0, this.rageT - dt);
    this.dashCds = this.dashCds.map(c => c - dt).filter(c => c > 0);
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.comboN = 0; }

    if (this.stunT > 0) { this.stunT -= dt; clampArena(this); return; }

    const ax = I.axis();

    // 大智若鱼：静止一息 → 凝神
    if (G.has('dao4')) {
      if (!ax.x && !ax.y && !this.dashing) {
        this.stillT += dt;
        if (this.stillT >= 1) this.primed = true;
      } else { this.stillT = 0; }
    }

    // --- 豚跃（冲刺）---
    if (this.dashT > 0) {
      this.dashT -= dt;
      this.x += this.dashDir.x * 1250 * dt;
      this.y += this.dashDir.y * 1250 * dt;
      this.trail.push({ x: this.x, y: this.y, t: 0.3 });
      // 破军之跃 / 连绵不绝：冲刺穿过敌人
      for (const e of battle.enemies) {
        if (this.dashHitSet.includes(e)) continue;
        if (U.dist(this.x, this.y, e.x, e.y) < this.r + e.r + 14) {
          this.dashHitSet.push(e);
          if (G.has('sh4') && !e.isBoss) { e.stunT = 0.8; e.hit(15 * this.dmgMulEff, this.x, this.y, 0); }
          if (G.has('sh5') && this.dashCds.length) this.dashCds.shift();
        }
      }
      if (this.dashT <= 0 && G.has('sh2')) battle.addBubble(this.x, this.y);
      clampArena(this);
      return;
    }
    if (I.just.dash && this.dashCds.length < this.mods.dashCharges) {
      let dir = (ax.x || ax.y) ? { x: ax.x, y: ax.y } : { x: Math.cos(this.face), y: Math.sin(this.face) };
      const len = Math.hypot(dir.x, dir.y); dir = { x: dir.x / len, y: dir.y / len };
      I.notify('dash', dir);
      this.dashT = 0.17; this.dashDir = dir;
      this.dashHitSet = [];
      this.iframes = Math.max(this.iframes, 0.3);
      this.dashCds.push(1.4);
      this.channel = 0;
      // 跃鳞：披盾
      if (G.has('sc1')) this.shield = Math.max(this.shield, 1);
      // 残影爆裂
      if (G.has('sh1')) battle.bombs.push({ x: this.x, y: this.y, t: 0.4, r: 90, dmg: 25 * this.dmgMulEff * this.syn, needles: G.has('sh3') });
      G.audio.dash();
    }

    // --- 吐纳（回血 / 盈息护罩）---
    const healBlocked = I.rules.some(r => r.disableHeal);
    const lingerNear = battle.companions && battle.companions.some(c => c.kind === 'linger' && U.dist(c.x, c.y, this.x, this.y) < 200);
    const chanSpeed = (G.has('lg5') && lingerNear) ? 2 : 1;
    const wantShieldChannel = G.has('br2') && this.hp >= this.maxhp && this.shield < 1 && this.shieldCd <= 0;
    if (!healBlocked && I.down.heal && this.healCd <= 0 && (this.hp < this.maxhp || wantShieldChannel)) {
      this.channel += dt * chanSpeed;
      if (this.channel >= this.mods.channelTime) {
        if (this.hp < this.maxhp) {
          this.hp = Math.min(this.maxhp, this.hp + 30 * this.mods.healMul);
          if (G.has('br4')) this.blessHits = 3;
        } else {
          this.shield = 1; this.shieldCd = 5;
          battle.fx.push({ type: 'text', x: this.x, y: this.y - 60, t: 0.8, str: '盈息护罩', color: '#e8d090', size: 24 });
        }
        // 吐纳冲击：弹开敌人与敌弹
        if (G.has('br3')) {
          for (const e of battle.enemies) {
            if (U.dist(this.x, this.y, e.x, e.y) < 160 + e.r) e.hit(5, this.x, this.y, 420);
          }
          battle.bullets = battle.bullets.filter(b => U.dist(this.x, this.y, b.x, b.y) > 170);
          battle.fx.push({ type: 'ring', x: this.x, y: this.y, t: 0.4, max: 170, color: '#bdf3d0' });
          G.addShake(6, 0.15);
        }
        this.channel = 0; this.healCd = 3;
        battle.fx.push({ type: 'ring', x: this.x, y: this.y, t: 0.4, max: 90, color: '#7ddf8e' });
        G.audio.heal();
      }
    } else this.channel = 0;

    // --- 移动 ---
    let ruleMul = 1;
    for (const r of I.rules) if (typeof r.speedMul === 'number') ruleMul *= r.speedMul;
    let sp = this.baseSpeed * this.mods.speedMul * ruleMul * (this.channeling ? 0.5 : 1);
    this.x += ax.x * sp * dt;
    this.y += ax.y * sp * dt;
    if (ax.x || ax.y) this.face = Math.atan2(ax.y, ax.x);

    // --- 尾拍（攻击 + 鲸落蓄力）---
    if (I.just.attack && this.attackCd <= 0) this.slash(battle);
    if (G.has('blade6')) {
      if (I.down.attack) this.holdT += dt;
      else if (I.justUp.attack || this.holdT > 0) {
        if (this.holdT >= 0.6) this.whaleSlam(battle);
        this.holdT = 0;
      }
    }

    // --- 音爆（技能）---
    if (I.just.skill) this.boom(battle);
    clampArena(this);
  }

  slash(battle) {
    const U = G.util;
    // 怒海：濒死更快
    const lowHp = G.has('dao3') && this.hp < this.maxhp * 0.3;
    this.attackCd = 0.30 * (this.mods.attackCdMul || 1) * (lowHp ? 0.7 : 1);
    // 大智若鱼：凝神一击直接终结拍
    if (this.primed) { this.comboN = 2; this.primed = false; this.stillT = 0; }
    this.comboN = this.comboN % 3 + 1;
    this.comboT = 0.9;
    let aim = this.face, best = 260;
    for (const e of battle.enemies) {
      const d = U.dist(this.x, this.y, e.x, e.y);
      if (d < best) { best = d; aim = U.angleTo(this.x, this.y, e.x, e.y); }
    }
    this.face = aim;

    // 音之枪：音波满盈 → 贯穿狙击
    if (G.has('so5') && this.wave >= 100) {
      this.wave -= 40;
      const dmg = 60 * this.dmgMulEff * this.syn;
      for (const e of battle.enemies) {
        const rel = U.angDiff(aim, U.angleTo(this.x, this.y, e.x, e.y));
        const d = U.dist(this.x, this.y, e.x, e.y);
        if (Math.abs(Math.sin(rel)) * d < 45 + e.r && Math.cos(rel) > 0) {
          e.hit(dmg, this.x, this.y, 200);
          battle.fx.push({ type: 'text', x: e.x, y: e.y - e.r - 8, t: 0.7, str: Math.round(dmg), color: '#6ee7ff', size: 38 });
        }
      }
      battle.fx.push({ type: 'beam', x: this.x, y: this.y, a: aim, t: 0.3 });
      G.addShake(10, 0.2);
      G.audio.boom();
      return;
    }

    const third = this.comboN === 3;
    let dmg = (third ? 18 : 10) * this.dmgMulEff;
    // 以息养刃
    if (this.blessHits > 0) {
      this.blessHits--;
      dmg += 15 * this.mods.healMul * 0.5;
      this.hp = Math.min(this.maxhp, this.hp + 2);
    }
    const range = 130, arc = 1.3;
    let hitAny = false;
    for (const e of battle.enemies) {
      const d = U.dist(this.x, this.y, e.x, e.y);
      if (d < range + e.r && Math.abs(U.angDiff(aim, U.angleTo(this.x, this.y, e.x, e.y))) < arc) {
        e.hit(dmg, this.x, this.y, third ? 380 : 140);
        this.gainWave(9);
        if (this.mods.lifesteal) this.hp = Math.min(this.maxhp, this.hp + this.mods.lifesteal);
        hitAny = true;
        battle.fx.push({ type: 'text', x: e.x + U.rand(-14, 14), y: e.y - e.r - 8, t: 0.6, str: Math.round(dmg), color: third ? '#ffd166' : '#e8eef4', size: third ? 34 : 26 });
      }
    }
    // 弹指破浪：拍碎敌弹
    if (G.has('dao1')) {
      for (const b of battle.bullets) {
        const d = U.dist(this.x, this.y, b.x, b.y);
        if (d < range + 20 && Math.abs(U.angDiff(aim, U.angleTo(this.x, this.y, b.x, b.y))) < arc) {
          b.dead = true;
          if (G.has('dao2')) this.gainWave(2);
          battle.fx.push({ type: 'spark', x: b.x, y: b.y, t: 0.3, a: Math.random() * 7, sp: 150 });
        }
      }
    }
    // 水刃（终结拍射出）/ 怒海双刃（濒死每拍都射）
    const shootBlades = (G.has('blade1') && third) || lowHp;
    if (shootBlades) {
      const n = G.has('blade2') ? 3 : (lowHp && !G.has('blade1') ? 2 : 1);
      for (let i = 0; i < n; i++) {
        const a = aim + (i - (n - 1) / 2) * 0.22;
        battle.pshots.push({
          x: this.x, y: this.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520,
          r: 10, dmg: 14 * this.dmgMulEff * this.syn, pierce: true,
          returns: G.has('blade3'), split: G.has('blade4'), travel: 0, maxTravel: 720,
          color: '#8fd8f0', blade: true, hits: [],
        });
      }
    }
    // 浪墙
    if (G.has('blade5') && third) {
      battle.pshots.push({
        x: this.x + Math.cos(aim) * 60, y: this.y + Math.sin(aim) * 60,
        vx: Math.cos(aim) * 230, vy: Math.sin(aim) * 230,
        r: 120, dmg: 10 * this.dmgMulEff * this.syn, pierce: true, push: 320,
        travel: 0, maxTravel: 900, color: 'rgba(143,216,240,0.5)', wall: true, hits: [],
      });
    }
    battle.fx.push({ type: 'slash', x: this.x, y: this.y, a: aim, t: 0.15, big: third });
    if (third) { G.audio.hit3(); if (hitAny) G.addShake(7, 0.12); }
    else G.audio.hit();
  }

  // 鲸落：蓄力重拍
  whaleSlam(battle) {
    const U = G.util;
    const dmg = 30 * this.dmgMulEff;
    for (const e of battle.enemies) {
      if (U.dist(this.x, this.y, e.x, e.y) < 190 + e.r) {
        e.hit(dmg, this.x, this.y, 520);
        this.gainWave(9);
        battle.fx.push({ type: 'text', x: e.x, y: e.y - e.r - 8, t: 0.7, str: Math.round(dmg), color: '#ffd166', size: 38 });
      }
    }
    battle.fx.push({ type: 'ring', x: this.x, y: this.y, t: 0.45, max: 190, color: '#8fd8f0' });
    G.addShake(12, 0.25);
    G.audio.boom();
  }

  boom(battle) {
    const U = G.util;
    if (this.wave < 40) {
      battle.fx.push({ type: 'text', x: this.x, y: this.y - 50, t: 0.8, str: '音波不足', color: '#8a97a5', size: 26 });
      return;
    }
    const radius = 150 + this.wave * 1.2;
    const dmg = (15 + this.wave * 0.6) * this.dmgMulEff * this.syn;
    const killed = [];
    for (const e of battle.enemies) {
      if (U.dist(this.x, this.y, e.x, e.y) < radius + e.r) {
        e.hit(dmg, this.x, this.y, 320);
        if (e.hp <= 0) killed.push(e);
      }
    }
    // 连环爆
    if (G.has('so6')) for (const e of killed) battle.chains.push({ x: e.x, y: e.y, t: 0.2 });
    // 夺弹反奏
    if (G.has('so2')) {
      for (const b of battle.bullets) {
        if (U.dist(this.x, this.y, b.x, b.y) < radius) {
          b.dead = true;
          const a = U.angleTo(this.x, this.y, b.x, b.y);
          battle.pshots.push({
            x: b.x, y: b.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420,
            r: 8, dmg: 8 * this.syn, pierce: false, travel: 0, maxTravel: 1200, color: '#6ee7ff', hits: [],
          });
        }
      }
    }
    // 双重奏
    if (G.has('so3')) battle.delayedBooms.push({ x: this.x, y: this.y, t: 0.6, r: radius * 0.6, dmg: dmg * 0.6 });
    if (G.has('so1')) battle.addField(this.x, this.y, radius * 0.7);
    battle.fx.push({ type: 'ring', x: this.x, y: this.y, t: 0.5, max: radius, color: '#6ee7ff' });
    battle.fx.push({ type: 'ring', x: this.x, y: this.y, t: 0.7, max: radius * 0.7, color: '#bdf3ff' });
    G.addShake(14, 0.3);
    G.audio.boom();
    this.wave = 0;
  }

  gainWave(n) {
    const room = G.currentBattle ? (G.currentBattle.roomWaveMul || 1) : 1; // 灵潮词缀
    this.wave = Math.min(100, this.wave + n * (this.mods.waveGainMul || 1) * room);
  }

  hurt(dmg, sx, sy) {
    if (this.iframes > 0 || this.dashing || this.hp <= 0) return;
    const battle = G.currentBattle;
    // 灵光护主：灵儿替你挡下
    if (G.has('lg2') && battle && battle.lg2cd <= 0) {
      battle.lg2cd = 10;
      this.iframes = 1.0;
      const c = battle.companions.find(c => c.kind === 'linger');
      if (c) c.say('灵光护主！');
      battle.fx.push({ type: 'ring', x: this.x, y: this.y, t: 0.5, max: 80, color: '#9ad8c8' });
      G.audio.lock();
      return;
    }
    // 键灵附体：概率免伤
    if (this.mods.shieldChance && Math.random() < this.mods.shieldChance) {
      this.iframes = 0.5;
      G.Input.notify('shieldProc');
      if (battle) battle.fx.push({ type: 'text', x: this.x, y: this.y - 60, t: 0.8, str: '键灵挡下了！', color: '#e8c170', size: 26 });
      G.audio.lock();
      return;
    }
    // 水鳞护盾
    if (this.shield > 0) {
      this.shield--;
      this.iframes = 0.6;
      if (battle) {
        battle.fx.push({ type: 'ring', x: this.x, y: this.y, t: 0.4, max: 90, color: '#e8d090' });
        // 碎鳞反击
        if (G.has('sc2')) {
          for (let i = 0; i < 12; i++) {
            const a = i * Math.PI / 6;
            battle.pshots.push({
              x: this.x, y: this.y, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460,
              r: 7, dmg: 8 * this.syn, pierce: false, travel: 0, maxTravel: 800, color: '#e8d090', hits: [],
            });
          }
        }
      }
      G.audio.lock();
      return;
    }
    this.hp -= dmg * (this.mods.dmgTakenMul || 1);
    this.iframes = 0.7;
    this.hurtFlash = 0.25;
    this.channel = 0;
    if (battle) {
      // 刹那时凝：敌弹凝滞
      if (G.has('sc4')) { battle.freezeT = Math.max(battle.freezeT, 0.8); }
      // 棘水：反击水刺
      if (G.has('sc6')) {
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          battle.pshots.push({
            x: this.x, y: this.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420,
            r: 7, dmg: 7 * this.syn, pierce: false, travel: 0, maxTravel: 600, color: '#a0c8e8', hits: [],
          });
        }
      }
    }
    if (sx !== undefined) {
      const a = G.util.angleTo(sx, sy, this.x, this.y);
      this.x += Math.cos(a) * 30; this.y += Math.sin(a) * 30;
      clampArena(this);
    }
    G.addShake(8, 0.2);
    G.audio.hurt();
  }

  // 天谴：无视无敌帧与护盾
  smite(dmgFrac, stun) {
    this.hp -= this.maxhp * dmgFrac * (this.mods.smiteMul || 1);
    this.stunT = Math.max(this.stunT, stun || 0.5);
    this.channel = 0; this.dashT = 0;
    this.hurtFlash = 0.4;
    if (G.has('dao5')) this.rageT = 3; // 天键共鸣：把惩罚炼成武器
  }

  draw(ctx) {
    const t = G.time;
    this.trail = this.trail.filter(p => (p.t -= 1 / 60) > 0);
    for (const p of this.trail) {
      ctx.globalAlpha = p.t * 1.2;
      ctx.fillStyle = '#4f7ba3';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 24, 18, this.face, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // 天键共鸣：怒气金光
    if (this.rageT > 0) {
      ctx.fillStyle = `rgba(255,209,102,${0.15 + Math.sin(t * 20) * 0.08})`;
      ctx.beginPath(); ctx.arc(this.x, this.y, 46, 0, 7); ctx.fill();
    }
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(t * 4) * 2);
    if (this.iframes > 0 && !this.dashing) ctx.globalAlpha = 0.55 + Math.sin(t * 40) * 0.25;
    const flip = Math.abs(this.face) > Math.PI / 2 ? -1 : 1;
    ctx.scale(flip, 1);
    ctx.fillStyle = '#6f9cc0';
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.quadraticCurveTo(-46, -4 + Math.sin(t * 8) * 6, -52, -14 + Math.sin(t * 8) * 8);
    ctx.quadraticCurveTo(-40, 2, -52, 12 + Math.sin(t * 8) * 6);
    ctx.quadraticCurveTo(-42, 8, -24, 6);
    ctx.fill();
    ctx.fillStyle = this.hurtFlash > 0 ? '#e88' : '#8fb8d8';
    ctx.beginPath(); ctx.ellipse(0, 0, 32, 25, 0, 0, 7); ctx.fill();
    ctx.fillStyle = this.hurtFlash > 0 ? '#f5bbbb' : '#dcebf5';
    ctx.beginPath(); ctx.ellipse(4, 8, 22, 13, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6f9cc0';
    ctx.beginPath(); ctx.moveTo(-4, -22); ctx.quadraticCurveTo(4, -38, 12, -22); ctx.fill();
    ctx.fillStyle = '#1c2733';
    if (this.stunT > 0) {
      ctx.lineWidth = 3; ctx.strokeStyle = '#1c2733';
      ctx.beginPath(); ctx.moveTo(12, -10); ctx.lineTo(22, -2); ctx.moveTo(22, -10); ctx.lineTo(12, -2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(17, -6, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(18.5, -7.5, 1.6, 0, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgba(240,150,150,0.5)';
    ctx.beginPath(); ctx.ellipse(23, 2, 5, 3, 0, 0, 7); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;

    // 水鳞护盾
    if (this.shield > 0) {
      ctx.strokeStyle = `rgba(232,208,144,${0.5 + Math.sin(t * 6) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, 40 + Math.sin(t * 6) * 3, 0, 7); ctx.stroke();
    }
    // 鲸落蓄力圈
    if (this.holdT > 0.15 && G.has('blade6')) {
      const p = Math.min(1, this.holdT / 0.6);
      ctx.strokeStyle = p >= 1 ? '#ffd166' : 'rgba(143,216,240,0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(this.x, this.y, 30 + p * 30, 0, 7 * p); ctx.stroke();
    }
    // 凝神标记
    if (this.primed) {
      ctx.fillStyle = `rgba(232,238,244,${0.6 + Math.sin(t * 8) * 0.3})`;
      ctx.font = G.font(24);
      ctx.textAlign = 'center';
      ctx.fillText('凝', this.x, this.y - 56);
    }
    if (this.channeling) {
      const p = this.channel / this.mods.channelTime;
      ctx.fillStyle = 'rgba(10,16,20,0.7)';
      G.rr(ctx, this.x - 34, this.y - 52, 68, 9, 4); ctx.fill();
      ctx.fillStyle = '#7ddf8e';
      G.rr(ctx, this.x - 32, this.y - 50, 64 * p, 5, 2); ctx.fill();
    }
    if (this.stunT > 0) {
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const a = t * 6 + i * 2.1;
        ctx.beginPath(); ctx.arc(this.x + Math.cos(a) * 26, this.y - 40 + Math.sin(a) * 7, 4, 0, 7); ctx.stroke();
      }
    }
  }
}
G.Player = Player;

// ---------------- 敌人基类 ----------------
class Enemy {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.kbx = 0; this.kby = 0;
    this.flash = 0; this.dead = false;
    this.touchCd = 0;
    this.isBoss = false;
    this.stunT = 0;
    this.slowT = 0;
    this.xp = 12;
  }
  hit(dmg, sx, sy, kb) {
    this.hp -= dmg;
    this.flash = 0.12;
    if (kb && !this.isBoss) {
      const a = G.util.angleTo(sx, sy, this.x, this.y);
      this.kbx += Math.cos(a) * kb; this.kby += Math.sin(a) * kb;
    }
    if (this.hp <= 0) this.dead = true;
  }
  baseUpdate(dt, battle) {
    this.flash = Math.max(0, this.flash - dt);
    this.touchCd = Math.max(0, this.touchCd - dt);
    this.x += this.kbx * dt; this.y += this.kby * dt;
    this.kbx *= Math.pow(0.001, dt); this.kby *= Math.pow(0.001, dt);
    clampArena(this);
    const p = battle.player;
    if (this.touchCd <= 0 && G.util.dist(this.x, this.y, p.x, p.y) < this.r + p.r) {
      p.hurt(this.touchDmg, this.x, this.y);
      this.touchCd = 0.8;
    }
  }
  drawStun(ctx) {
    if (this.stunT <= 0) return;
    const t = G.time;
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      const a = t * 7 + i * 3;
      ctx.beginPath(); ctx.arc(this.x + Math.cos(a) * 20, this.y - this.r - 12 + Math.sin(a) * 5, 3, 0, 7); ctx.stroke();
    }
  }
}

// ---- 键奴 ----
class KeySlave extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.r = 24; this.hp = 30; this.speed = G.util.rand(85, 115); this.touchDmg = 10;
    this.letter = G.util.pick(['帽', '奴', '仆', '苦', '役']);
    this.wob = Math.random() * 7;
    this.xp = G.Powers.xpValue.slave;
  }
  update(dt, battle) {
    const p = battle.player;
    const a = G.util.angleTo(this.x, this.y, p.x, p.y);
    this.x += Math.cos(a) * this.speed * dt;
    this.y += Math.sin(a) * this.speed * dt;
    this.baseUpdate(dt, battle);
  }
  draw(ctx) {
    const b = Math.sin(G.time * 6 + this.wob) * 3;
    ctx.fillStyle = this.flash > 0 ? '#fff' : '#4a5561';
    G.rr(ctx, this.x - 24, this.y - 24 + b, 48, 48, 8); ctx.fill();
    ctx.fillStyle = this.flash > 0 ? '#ddd' : '#5d6b7a';
    G.rr(ctx, this.x - 19, this.y - 20 + b, 38, 34, 6); ctx.fill();
    ctx.fillStyle = '#c9d3dd';
    ctx.font = G.font(24);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.letter, this.x, this.y - 3 + b);
    ctx.textBaseline = 'alphabetic';
    this.drawStun(ctx);
  }
}

// ---- 弹幕修士 ----
class Shooter extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.r = 24; this.hp = 24; this.speed = 100; this.touchDmg = 8;
    this.shootT = G.util.rand(1.2, 2.0);
    this.xp = G.Powers.xpValue.shooter;
  }
  update(dt, battle) {
    const p = battle.player;
    const d = G.util.dist(this.x, this.y, p.x, p.y);
    const a = G.util.angleTo(this.x, this.y, p.x, p.y);
    if (d < 360) { this.x -= Math.cos(a) * this.speed * dt; this.y -= Math.sin(a) * this.speed * dt; }
    else if (d > 520) { this.x += Math.cos(a) * this.speed * dt; this.y += Math.sin(a) * this.speed * dt; }
    this.shootT -= dt;
    if (this.shootT <= 0) {
      this.shootT = 1.8;
      battle.bullets.push({ x: this.x, y: this.y, vx: Math.cos(a) * 270, vy: Math.sin(a) * 270, r: 9, dmg: 8 });
      G.audio.wave();
    }
    this.baseUpdate(dt, battle);
  }
  draw(ctx) {
    const t = G.time;
    ctx.fillStyle = this.flash > 0 ? '#fff' : '#7d6b96';
    ctx.beginPath(); ctx.ellipse(this.x, this.y, 22, 26, 0, 0, 7); ctx.fill();
    ctx.fillStyle = this.flash > 0 ? '#ddd' : '#5a4d70';
    ctx.beginPath(); ctx.moveTo(this.x - 28, this.y - 12); ctx.lineTo(this.x + 28, this.y - 12); ctx.lineTo(this.x, this.y - 34); ctx.closePath(); ctx.fill();
    if (this.shootT < 0.4) {
      ctx.fillStyle = '#ff6b5e';
      ctx.beginPath(); ctx.arc(this.x, this.y + 2, 6 + Math.sin(t * 30) * 2, 0, 7); ctx.fill();
    }
    this.drawStun(ctx);
  }
}

// ---- 撞钟师兄 ----
class Charger extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.r = 27; this.hp = 40; this.speed = 90; this.touchDmg = 12;
    this.state = 'walk'; this.st = G.util.rand(1, 2);
    this.dir = { x: 1, y: 0 };
    this.xp = G.Powers.xpValue.charger;
  }
  update(dt, battle) {
    const p = battle.player, U = G.util;
    this.st -= dt;
    if (this.state === 'walk') {
      const a = U.angleTo(this.x, this.y, p.x, p.y);
      this.x += Math.cos(a) * this.speed * dt;
      this.y += Math.sin(a) * this.speed * dt;
      if (this.st <= 0 && U.dist(this.x, this.y, p.x, p.y) < 460) {
        this.state = 'aim'; this.st = 0.6;
      }
    } else if (this.state === 'aim') {
      const a = U.angleTo(this.x, this.y, p.x, p.y);
      this.dir = { x: Math.cos(a), y: Math.sin(a) };
      if (this.st <= 0) { this.state = 'rush'; this.st = 0.5; G.audio.dash(); }
    } else if (this.state === 'rush') {
      this.x += this.dir.x * 720 * dt;
      this.y += this.dir.y * 720 * dt;
      if (this.st <= 0) { this.state = 'walk'; this.st = U.rand(1.5, 2.5); }
    }
    this.baseUpdate(dt, battle);
  }
  draw(ctx) {
    if (this.state === 'aim') {
      ctx.strokeStyle = `rgba(255,140,80,${0.3 + Math.sin(G.time * 25) * 0.2})`;
      ctx.lineWidth = 20;
      ctx.beginPath(); ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.dir.x * 500, this.y + this.dir.y * 500); ctx.stroke();
    }
    const lean = this.state === 'rush' ? 0.3 : 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(lean * (this.dir.x < 0 ? -1 : 1));
    ctx.fillStyle = this.flash > 0 ? '#fff' : '#a35f3f';
    ctx.beginPath(); ctx.moveTo(-26, 26); ctx.quadraticCurveTo(-30, -22, 0, -28); ctx.quadraticCurveTo(30, -22, 26, 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = this.flash > 0 ? '#ddd' : '#c98a5a';
    ctx.beginPath(); ctx.arc(0, -32, 13, 0, 7); ctx.fill();
    ctx.strokeStyle = '#4a2a1a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, -36); ctx.lineTo(-2, -33); ctx.moveTo(8, -36); ctx.lineTo(2, -33); ctx.stroke();
    ctx.restore();
    this.drawStun(ctx);
  }
}

// ---- Boss：刻薄管事（第一关专属）----
class BossSteward extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.isBoss = true;
    this.name = '刻薄管事 · 杂役院的暴君';
    this.r = 46; this.maxhp = 320; this.hp = 320; this.touchDmg = 12;
    this.state = 'idle'; this.st = 1.2;
    this.chargeDir = { x: 0, y: 0 };
    this.volley = 0;
    this.xp = G.Powers.bossXp;
  }
  get phase2() { return this.hp < this.maxhp * 0.5; }
  update(dt, battle) {
    const p = battle.player, U = G.util;
    this.st -= dt;
    if (this.state === 'idle') {
      const a = U.angleTo(this.x, this.y, p.x, p.y);
      this.x += Math.cos(a) * 70 * dt; this.y += Math.sin(a) * 70 * dt;
      if (this.st <= 0) {
        const acts = ['fan', 'charge', 'fan'];
        if (battle.enemies.length < 4) acts.push('summon');
        this.state = U.pick(acts);
        if (this.state === 'fan') { this.st = 0.5; this.volley = this.phase2 ? 3 : 2; }
        if (this.state === 'charge') this.st = 0.7;
        if (this.state === 'summon') this.st = 0.6;
      }
    } else if (this.state === 'fan') {
      if (this.st <= 0) {
        const n = this.phase2 ? 7 : 5;
        const base = U.angleTo(this.x, this.y, p.x, p.y);
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.22;
          battle.bullets.push({ x: this.x, y: this.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, r: 10, dmg: 8 });
        }
        G.audio.wave();
        this.volley--;
        this.st = 0.55;
        if (this.volley <= 0) { this.state = 'idle'; this.st = this.phase2 ? 1.0 : 1.6; }
      }
    } else if (this.state === 'charge') {
      if (this.st > 0) {
        const a = U.angleTo(this.x, this.y, p.x, p.y);
        this.chargeDir = { x: Math.cos(a), y: Math.sin(a) };
        if (this.st - dt <= 0) { this.state = 'charging'; this.st = 0.45; G.audio.dash(); }
      }
    } else if (this.state === 'charging') {
      this.x += this.chargeDir.x * 950 * dt;
      this.y += this.chargeDir.y * 950 * dt;
      const A = G.ARENA;
      if (this.x < A.x + this.r || this.x > A.x + A.w - this.r || this.y < A.y + this.r || this.y > A.y + A.h - this.r) this.st = 0;
      if (this.touchCd <= 0 && U.dist(this.x, this.y, p.x, p.y) < this.r + p.r) {
        p.hurt(15, this.x, this.y); this.touchCd = 0.8;
      }
      if (this.st <= 0) { this.state = 'idle'; this.st = this.phase2 ? 1.0 : 1.7; G.addShake(10, 0.2); }
    } else if (this.state === 'summon') {
      if (this.st <= 0) {
        for (let i = 0; i < 2; i++) battle.spawnAt('slave', this.x + U.rand(-120, 120), this.y + U.rand(-100, 100));
        this.state = 'idle'; this.st = 2.0;
      }
    }
    this.baseUpdate(dt, battle);
  }
  draw(ctx) {
    const t = G.time;
    if (this.state === 'charge') {
      ctx.strokeStyle = 'rgba(255,90,78,' + (0.4 + Math.sin(t * 25) * 0.25) + ')';
      ctx.lineWidth = 34;
      ctx.beginPath(); ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.chargeDir.x * 900, this.y + this.chargeDir.y * 900); ctx.stroke();
    }
    const lean = this.state === 'charging' ? 0.25 : 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(lean * (this.chargeDir.x < 0 ? -1 : 1));
    ctx.fillStyle = this.flash > 0 ? '#fff' : '#8a4a3a';
    ctx.beginPath(); ctx.moveTo(-34, 42); ctx.quadraticCurveTo(-40, -30, 0, -46); ctx.quadraticCurveTo(40, -30, 34, 42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = this.flash > 0 ? '#ddd' : '#d08770';
    ctx.beginPath(); ctx.arc(0, -52, 22, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3a2018'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-12, -58); ctx.lineTo(-4, -54); ctx.moveTo(12, -58); ctx.lineTo(4, -54); ctx.stroke();
    ctx.fillStyle = '#3a2018';
    ctx.beginPath(); ctx.arc(-7, -52, 2.5, 0, 7); ctx.arc(7, -52, 2.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -42, 6, 0.2, Math.PI - 0.2, true); ctx.stroke();
    ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-46, -10 + Math.sin(t * 3) * 4); ctx.lineTo(46, -18 + Math.sin(t * 3) * 4); ctx.stroke();
    ctx.restore();
  }
}

// ---- 通用 Boss（2~9 关配置化）----
class GenericBoss extends Enemy {
  constructor(x, y, cfg) {
    super(x, y);
    this.isBoss = true;
    this.cfg = cfg;
    this.name = cfg.name;
    this.r = 46; this.maxhp = cfg.hp; this.hp = cfg.hp; this.touchDmg = 12;
    this.state = 'idle'; this.st = 1.4;
    this.moveIdx = 0;
    this.chargeDir = { x: 0, y: 0 };
    this.volley = 0;
    this.xp = G.Powers.bossXp;
  }
  get phase2() { return this.hp < this.maxhp * 0.5; }
  update(dt, battle) {
    const p = battle.player, U = G.util;
    this.st -= dt;
    if (this.state === 'idle') {
      const a = U.angleTo(this.x, this.y, p.x, p.y);
      this.x += Math.cos(a) * 75 * dt; this.y += Math.sin(a) * 75 * dt;
      if (this.st <= 0) {
        let mv = this.cfg.moves[this.moveIdx % this.cfg.moves.length];
        this.moveIdx++;
        if (mv === 'summon' && battle.enemies.length >= 5) mv = 'fan';
        this.state = mv;
        if (mv === 'fan') { this.st = 0.5; this.volley = this.phase2 ? 3 : 2; }
        if (mv === 'charge') this.st = 0.7;
        if (mv === 'summon') this.st = 0.6;
        if (mv === 'nova') { this.st = 0.8; this.volley = this.phase2 ? 2 : 1; }
      }
    } else if (this.state === 'fan') {
      if (this.st <= 0) {
        const n = this.phase2 ? 7 : 5;
        const base = U.angleTo(this.x, this.y, p.x, p.y);
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.22;
          battle.bullets.push({ x: this.x, y: this.y, vx: Math.cos(a) * 310, vy: Math.sin(a) * 310, r: 10, dmg: 8 });
        }
        G.audio.wave();
        this.volley--;
        this.st = 0.55;
        if (this.volley <= 0) this.cool();
      }
    } else if (this.state === 'nova') {
      if (this.st <= 0) {
        const n = this.phase2 ? 16 : 12;
        const off = Math.random() * 7;
        for (let i = 0; i < n; i++) {
          const a = off + i * (Math.PI * 2 / n);
          battle.bullets.push({ x: this.x, y: this.y, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, r: 10, dmg: 8 });
        }
        G.audio.boom();
        G.addShake(8, 0.2);
        this.volley--;
        this.st = 0.9;
        if (this.volley <= 0) this.cool();
      }
    } else if (this.state === 'charge') {
      if (this.st > 0) {
        const a = U.angleTo(this.x, this.y, p.x, p.y);
        this.chargeDir = { x: Math.cos(a), y: Math.sin(a) };
        if (this.st - dt <= 0) { this.state = 'charging'; this.st = 0.45; G.audio.dash(); }
      }
    } else if (this.state === 'charging') {
      this.x += this.chargeDir.x * 980 * dt;
      this.y += this.chargeDir.y * 980 * dt;
      const A = G.ARENA;
      if (this.x < A.x + this.r || this.x > A.x + A.w - this.r || this.y < A.y + this.r || this.y > A.y + A.h - this.r) this.st = 0;
      if (this.touchCd <= 0 && U.dist(this.x, this.y, p.x, p.y) < this.r + p.r) {
        p.hurt(15, this.x, this.y); this.touchCd = 0.8;
      }
      if (this.st <= 0) { this.cool(); G.addShake(10, 0.2); }
    } else if (this.state === 'summon') {
      if (this.st <= 0) {
        for (let i = 0; i < 2; i++) battle.spawnAt(U.pick(['slave', 'charger']), this.x + U.rand(-140, 140), this.y + U.rand(-100, 100));
        this.cool(1.8);
      }
    }
    this.baseUpdate(dt, battle);
  }
  cool(t) { this.state = 'idle'; this.st = (t || (this.phase2 ? 1.0 : 1.6)); }
  draw(ctx) {
    const t = G.time;
    if (this.state === 'charge') {
      ctx.strokeStyle = 'rgba(255,90,78,' + (0.4 + Math.sin(t * 25) * 0.25) + ')';
      ctx.lineWidth = 34;
      ctx.beginPath(); ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.chargeDir.x * 900, this.y + this.chargeDir.y * 900); ctx.stroke();
    }
    if (this.state === 'nova') {
      ctx.strokeStyle = `rgba(255,107,94,${0.3 + Math.sin(t * 20) * 0.2})`;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(this.x, this.y, 70 + Math.sin(t * 10) * 8, 0, 7); ctx.stroke();
    }
    ctx.save();
    if (this.flash > 0) { ctx.globalAlpha = 0.85; }
    G.drawPortrait(ctx, this.cfg.char, this.x, this.y, 0.9);
    if (this.flash > 0) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(this.x, this.y - 10, 52, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
}

G.Enemies = {
  slave: KeySlave,
  shooter: Shooter,
  charger: Charger,
  steward: BossSteward,
};
G.GenericBoss = GenericBoss;
