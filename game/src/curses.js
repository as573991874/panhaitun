// ======================== 键誓 / 残誓（CurseRule 框架） ========================
// 每条限制 = 一个规则对象。约定接口：
//   locks: ['dash']                    → HUD 上锁定显示的动作
//   onPress(action) → {block, punish, dmgFrac, stun, msg} | null
//   onNotify(what, data) → 同上       （冲刺方向、键灵挡伤等主动通报）
//   update(dt) / hudText()             → 计时与 HUD 附加信息
//   remap(action) → action             → 键位漂移类
//   keyState(action) → 'red'|'warn'    → HUD 键帽特殊状态
//   labelFor(action) → 文案            → HUD 键帽功能名覆盖
//   draw(ctx, battle)                  → 世界层特效（如天道之眼）
//   speedMul / disableHeal             → 对玩家的被动修正
//   banner / isLevel / short           → 键誓宣告与常驻显示

class CurseRule {
  constructor(def) { Object.assign(this, def); }
  update() {}
}

const SMITE = (msg, opt) => Object.assign({ block: true, punish: true, dmgFrac: 0.15, stun: 0.5, msg }, opt || {});

G.Curses = {
  defs: {
    // ================= 关卡键誓（常驻） =================

    // 一关：别按那个「闪」键
    noDash: () => new CurseRule({
      id: 'noDash', isLevel: true,
      short: '「别·按·那个·闪·键」',
      locks: ['dash'],
      onPress(a) { return a === 'dash' ? SMITE('闪·键·被·封！') : null; },
    }),

    // 二关：别连按那个「攻」键（间隔须 > 0.6s）
    noRapidAttack: () => new CurseRule({
      id: 'noRapidAttack', isLevel: true,
      short: '「别·连按·那个·攻·键」（一息一拍）',
      lastT: -9,
      onPress(a) {
        if (a !== 'attack') return null;
        const now = G.time;
        if (now - this.lastT < 0.6) { return SMITE('一·息·一·拍！'); }
        this.lastT = now;
        return null;
      },
    }),

    // 三关：别按那个「红」键（轮流有一个键变红）
    redKey: () => new CurseRule({
      id: 'redKey', isLevel: true,
      short: '「别·按·那个·红·键」',
      pool: ['attack', 'skill', 'heal', 'dash'],
      cur: null, phase: 'idle', t: 3,
      update(dt) {
        this.t -= dt;
        if (this.t <= 0) {
          if (this.phase === 'idle') { // 选一个键预警
            this.cur = G.util.pick(this.pool);
            this.phase = 'warn'; this.t = 1.2;
            G.audio.lock();
          } else if (this.phase === 'warn') { this.phase = 'red'; this.t = 5; }
          else { this.phase = 'idle'; this.cur = null; this.t = 2.5; }
        }
      },
      onPress(a) { return (this.phase === 'red' && a === this.cur) ? SMITE('红·键·勿·触！') : null; },
      keyState(a) { return a === this.cur ? (this.phase === 'red' ? 'red' : 'warn') : null; },
      hudText() {
        const n = { attack: '攻', skill: '爆', heal: '纳', dash: '跃' };
        if (this.phase === 'red') return `红键：【${n[this.cur]}】剩 ${this.t.toFixed(1)}s`;
        if (this.phase === 'warn') return `【${n[this.cur]}】即将变红…`;
        return null;
      },
    }),

    // 四关：别松开那个「纳」键（L 必须全程按住）
    // 注意：CurseRule 构造用 Object.assign，getter 会被拍平，动态值须在 update 里刷新
    holdHeal: () => new CurseRule({
      id: 'holdHeal', isLevel: true,
      short: '「别·松开·那个·纳·键」（按住 L 结印）',
      graceT: 4, disableHeal: true, speedMul: 1,
      update(dt) {
        this.speedMul = G.Input.down.heal ? 0.7 : 1;
        if (G.Input.down.heal) { this.graceT = 0.6; return; }
        this.graceT -= dt;
        if (this.graceT <= 0) {
          this.graceT = 1.4;
          G.events.emit('punish', { rule: this, action: 'heal', res: SMITE('印·散·了！按·住·它！') });
        }
      },
      hudText() { return G.Input.down.heal ? '吐纳印：结印中' : '⚠ 快按住【L】结印！'; },
    }),

    // 五关：别同时按那两个键（移动与攻击互斥）
    noMoveAttack: () => new CurseRule({
      id: 'noMoveAttack', isLevel: true,
      short: '「别·同时·按·那·两·个·键」（动者不可攻）',
      onPress(a) {
        if (a !== 'attack') return null;
        const d = G.Input.down;
        return (d.up || d.down || d.left || d.right) ? SMITE('动·者·不·可·攻！') : null;
      },
    }),

    // 六关：那个键会动（J/K/L 每 15 秒轮换）
    keyShuffle: () => new CurseRule({
      id: 'keyShuffle', isLevel: true,
      short: '「x别x按x——那·个·键·会·动」',
      offset: 0, t: 15, ring: ['attack', 'skill', 'heal'],
      rot(a, off) {
        const i = this.ring.indexOf(a);
        return i < 0 ? a : this.ring[(i + off) % 3];
      },
      remap(a) { return this.rot(a, this.offset); },
      update(dt) {
        this.t -= dt;
        if (this.t <= 0) {
          this.offset = (this.offset + 1) % 3;
          this.t = 15;
          for (const k of this.ring) G.Input.down[k] = false; // 防止按住时错位
          G.audio.lock();
          G.addShake(6, 0.2);
        }
      },
      labelFor(a) {
        const n = { attack: '尾拍', skill: '音爆', heal: '吐纳' };
        return n[this.rot(a, this.offset)];
      },
      keyState(a) { return (this.t < 3 && this.ring.includes(a)) ? 'warn' : null; },
      hudText() { return this.t < 3 ? `键位漂移：${this.t.toFixed(1)}s` : `下次漂移：${Math.ceil(this.t)}s`; },
    }),

    // 七关：别第三次按那个「跃」键（十息内事不过三）
    thirdDash: () => new CurseRule({
      id: 'thirdDash', isLevel: true,
      short: '「别·第三次·按·那个·跃·键」',
      count: 0, t: 10,
      onPress(a) {
        if (a !== 'dash') return null;
        this.count++;
        if (this.count >= 3) { this.count = 0; this.t = 10; return SMITE('事·不·过·三！'); }
        return null;
      },
      update(dt) {
        this.t -= dt;
        if (this.t <= 0) { this.count = 0; this.t = 10; }
      },
      hudText() { return `三罪计数：${'●'.repeat(this.count)}${'○'.repeat(2 - Math.min(2, this.count))}　${Math.ceil(this.t)}s 后清算`; },
    }),

    // 八关：只能按那个「爆」键
    onlyBoom: () => new CurseRule({
      id: 'onlyBoom', isLevel: true,
      short: '「只能·按·那个·爆·键」',
      locks: ['attack', 'dash', 'heal'],
      update(dt) {
        const b = G.currentBattle;
        if (b) b.player.wave = Math.min(100, b.player.wave + 8 * dt); // 音波自动积攒
      },
      onPress(a) {
        if (a === 'attack' || a === 'dash' || a === 'heal') return SMITE('神·通·尽·封！');
        return null;
      },
      hudText() { return '音波自行积攒——走位，然后引爆'; },
    }),

    // 九关：别在祂看着时按那个键
    gaze: () => new CurseRule({
      id: 'gaze', isLevel: true,
      short: '「别·在祂看着时·按·那个·键」',
      phase: 'safe', t: 4,
      update(dt) {
        this.t -= dt;
        if (this.t <= 0) {
          if (this.phase === 'safe') { this.phase = 'warn'; this.t = 1.0; G.audio.lock(); }
          else if (this.phase === 'warn') { this.phase = 'gaze'; this.t = 2.5; }
          else { this.phase = 'safe'; this.t = G.util.rand(3, 4.5); }
        }
      },
      onPress(a) {
        if (this.phase !== 'gaze') return null;
        if (['attack', 'skill', 'heal', 'dash'].includes(a)) return SMITE('祂·看·着·你！');
        return null;
      },
      hudText() {
        if (this.phase === 'gaze') return `👁 祂在看！别按！（${this.t.toFixed(1)}s）`;
        if (this.phase === 'warn') return '👁 祂要睁眼了……';
        return '祂在打盹';
      },
      draw(ctx) {
        if (this.phase === 'safe') return;
        const open = this.phase === 'gaze' ? 1 : 1 - this.t;
        // 天穹之眼
        const ex = G.W / 2, ey = 168;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#0a0a10';
        ctx.beginPath(); ctx.ellipse(ex, ey, 90, 40 * open, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(ex, ey, 90, 40 * open, 0, 0, 7); ctx.stroke();
        if (this.phase === 'gaze') {
          ctx.fillStyle = '#ffd166';
          ctx.beginPath(); ctx.arc(ex, ey, 18, 0, 7); ctx.fill();
          ctx.fillStyle = '#0a0a10';
          ctx.beginPath(); ctx.arc(ex, ey, 8, 0, 7); ctx.fill();
          // 注视光幕
          ctx.globalAlpha = 0.07 + Math.sin(G.time * 10) * 0.03;
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(0, 0, G.W, G.H);
        }
        ctx.restore();
      },
    }),

    // ================= 键契残誓（时效 2 关） =================

    // 暴怒獠牙：x别x急按x那个x攻x键
    comboSpam: () => new CurseRule({
      id: 'comboSpam',
      short: '「别·急按·那个·攻·键」',
      count: 0, timer: 0,
      onPress(a) {
        if (a !== 'attack') return null;
        this.count = (this.timer > 0) ? this.count + 1 : 1;
        this.timer = 0.4;
        if (this.count >= 6) {
          this.count = 0; this.timer = 0;
          return SMITE('手·太·贪·了！', { dmgFrac: 0, stun: 0.8 });
        }
        return null;
      },
      update(dt) { if (this.timer > 0) { this.timer -= dt; if (this.timer <= 0) this.count = 0; } },
      hudText() { return this.count >= 3 ? `连按 ${this.count}/6` : null; },
    }),

    // 一息千浪：x别x在豚跃后x按x那个x攻x键
    dashThenAttack: () => new CurseRule({
      id: 'dashThenAttack',
      short: '「豚跃后·别·按·那个·攻·键」',
      window: 0,
      onNotify(what) { if (what === 'dash') this.window = 1.0; return null; },
      onPress(a) { return (a === 'attack' && this.window > 0) ? SMITE('冲·砍·分·离！') : null; },
      update(dt) { this.window = Math.max(0, this.window - dt); },
      hudText() { return this.window > 0 ? `攻键封禁 ${this.window.toFixed(1)}s` : null; },
    }),

    // 幻影豚跃：x别x朝原方向x按x那个x跃x键
    sameDirDash: () => new CurseRule({
      id: 'sameDirDash',
      short: '「别·原方向·按·那个·跃·键」',
      lastDir: null,
      onNotify(what, data) {
        if (what !== 'dash') return null;
        const dir = Math.round(Math.atan2(data.y, data.x) / (Math.PI / 4));
        if (this.lastDir !== null && dir === this.lastDir) { this.lastDir = dir; return SMITE('别·走·回·头·浪！', { block: false }); }
        this.lastDir = dir;
        return null;
      },
    }),

    // 泡影护体：x豚跃后x别x按x任何x键
    postDashSilence: () => new CurseRule({
      id: 'postDashSilence',
      short: '「豚跃后·别·按·任何·键」（泡泡成型需静默）',
      window: 0,
      onNotify(what) { if (what === 'dash') this.window = 0.7; return null; },
      onPress(a) {
        return (this.window > 0 && ['attack', 'skill', 'heal', 'dash'].includes(a)) ? SMITE('静·默·成·泡！') : null;
      },
      update(dt) { this.window = Math.max(0, this.window - dt); },
    }),

    // 音爆余韵：x移动时x别x按x那个x爆x键
    boomStill: () => new CurseRule({
      id: 'boomStill',
      short: '「移动时·别·按·那个·爆·键」（引爆须站定）',
      onPress(a) {
        if (a !== 'skill') return null;
        const d = G.Input.down;
        return (d.up || d.down || d.left || d.right) ? SMITE('站·定·再·爆！') : null;
      },
    }),

    // 汹涌回响：x音波满时x不得不x按x那个x爆x键
    mustBoom: () => new CurseRule({
      id: 'mustBoom',
      short: '「音波满时·别不·按·那个·爆·键」',
      fuse: -1,
      update(dt) {
        const b = G.currentBattle;
        if (!b) return;
        if (b.player.wave >= 100) {
          if (this.fuse < 0) this.fuse = 5;
          this.fuse -= dt;
          if (this.fuse <= 0) {
            this.fuse = -1; b.player.wave = 0;
            G.events.emit('punish', { rule: this, action: 'skill', res: SMITE('憋·不·住·了！') });
          }
        } else this.fuse = -1;
      },
      hudText() { return this.fuse >= 0 ? `⚠ 音波将自爆：${this.fuse.toFixed(1)}s` : null; },
    }),

    // 以伤养伤：x别x按x那个x纳x键
    noHeal: () => new CurseRule({
      id: 'noHeal',
      short: '「别·按·那个·纳·键」',
      locks: ['heal'],
      onPress(a) { return a === 'heal' ? SMITE('纳·键·已·弃！') : null; },
    }),

    // 滑不留手：x别x停下x那些x移动x键
    noStill: () => new CurseRule({
      id: 'noStill',
      short: '「别·停下·按·那个·移动·键」',
      stillT: 0, lastX: 0, lastY: 0,
      update(dt) {
        const b = G.currentBattle;
        if (!b) return;
        const p = b.player;
        const moved = Math.hypot(p.x - this.lastX, p.y - this.lastY) > 2;
        this.lastX = p.x; this.lastY = p.y;
        if (moved) { this.stillT = 0; return; }
        this.stillT += dt;
        if (this.stillT >= 2) {
          this.stillT = 0;
          G.events.emit('punish', { rule: this, action: 'move', res: SMITE('鲨·鱼·定·律！') });
        }
      },
      hudText() { return this.stillT > 1 ? `⚠ 别站着：${(2 - this.stillT).toFixed(1)}s` : null; },
    }),

    // 键灵附体：x键灵挡伤后x别x按x任何x键
    spiritSilence: () => new CurseRule({
      id: 'spiritSilence',
      short: '「键灵挡伤后·别·按·任何·键」',
      window: 0,
      onNotify(what) { if (what === 'shieldProc') this.window = 1.0; return null; },
      onPress(a) {
        return (this.window > 0 && ['attack', 'skill', 'heal', 'dash'].includes(a)) ? SMITE('让·她·缓·缓！') : null;
      },
      update(dt) { this.window = Math.max(0, this.window - dt); },
      hudText() { return this.window > 0 ? `键灵喘息 ${this.window.toFixed(1)}s` : null; },
    }),

    // 千斤豚体：x别x按x那个x跃x键
    noDashCard: () => new CurseRule({
      id: 'noDashCard',
      short: '「别·按·那个·跃·键」',
      locks: ['dash'],
      onPress(a) { return a === 'dash' ? SMITE('太·重·跃·不·动！') : null; },
    }),
  },

  create(id) {
    const f = this.defs[id];
    if (!f) throw new Error('未知诅咒: ' + id);
    return f();
  },
};
