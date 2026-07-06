// ======================== 神通系统：成长线 / 升级三选一 / 羁绊同伴 ========================
// 设计原则：神通一律是"机制"不是数值；每条成长线可 build 成型；
// 代价（残誓）从代价池随机抽取、选择前隐藏、时效 1~3 关随机；
// 残誓只给一句誓词，不给详解——让玩家自己领悟。

G.has = id => !!(G.run && G.run.powers && G.run.powers.includes(id));
G.lineCount = line => G.run.powers.reduce((n, id) => {
  const p = G.Powers.byId[id];
  return n + (p && p.line === line ? 1 : 0);
}, 0);

G.Powers = {
  // ---- 修为曲线（放缓：让玩家先适应节奏，突破再来） ----
  xpNeed(level) { return 80 + 45 * level; },
  xpValue: { slave: 12, shooter: 15, charger: 18 },
  bossXp: 80,
  realms: ['炼气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '问道', '斩天', '无量'],
  realm(level) { return this.realms[Math.min(level, this.realms.length - 1)]; },

  // ---- 成长线定义（用于 UI 分色）----
  lines: {
    blade:    { name: '浪 · 尾拍', color: '#8fd8f0' },
    shadow:   { name: '影 · 豚跃', color: '#b0a0e8' },
    sound:    { name: '音 · 音爆', color: '#6ee7ff' },
    breath:   { name: '息 · 吐纳', color: '#7ddf8e' },
    scale:    { name: '鳞 · 护体', color: '#e8d090' },
    dao:      { name: '道 · 修为', color: '#e8eef4' },
    hongxiao: { name: '缘 · 红绡', color: '#e07a9a' },
    linger:   { name: '缘 · 灵儿', color: '#9ad8c8' },
    jingshu:  { name: '缘 · 静姝', color: '#7ab0d0' },
  },

  // ---- 神通池（50）----
  // req: 前置神通 id；reqLine: {line, n} 线内已有 n 个；gate: 羁绊剧情门槛；apply: 立即生效的修正
  // tier: 理解成本（1 一眼就懂 / 2 有点门道 / 3 玩明白了再说），前期只发低 tier
  list: [
    // ===== 浪线：把尾拍打成弹幕 =====
    { id: 'blade1', line: 'blade', name: '水刃初显', key: 'J', tier: 1, desc: '三连第三拍甩出贯穿水刃' },
    { id: 'blade2', line: 'blade', name: '三叉浪', key: 'J', tier: 2, desc: '水刃变三道扇形齐射', req: 'blade1' },
    { id: 'blade3', line: 'blade', name: '回旋刃', key: 'J', tier: 2, desc: '水刃尽头折返，再伤一轮', req: 'blade1' },
    { id: 'blade4', line: 'blade', name: '裂空斩', key: 'J', tier: 2, desc: '水刃命中裂出两道斜刃', req: 'blade1' },
    { id: 'blade5', line: 'blade', name: '浪墙', key: 'J', tier: 2, desc: '每轮三连击推出一面浪墙', req: 'blade1' },
    { id: 'blade6', line: 'blade', name: '鲸落', key: 'J', tier: 2, desc: '按住 J 蓄力，松开重拍一切' },

    // ===== 影线：冲刺即武器 =====
    { id: 'sh1', line: 'shadow', name: '残影爆裂', key: '空格', tier: 1, desc: '豚跃起点留残影，随后炸裂' },
    { id: 'sh2', line: 'shadow', name: '泡影护体', key: '空格', tier: 1, desc: '豚跃落点生成挡弹泡' },
    { id: 'sh3', line: 'shadow', name: '影针', key: '空格', tier: 2, desc: '残影炸裂射出六向水针', req: 'sh1' },
    { id: 'sh4', line: 'shadow', name: '破军之跃', key: '空格', tier: 2, desc: '豚跃穿过的敌人冲晕受创' },
    { id: 'sh5', line: 'shadow', name: '连绵不绝', key: '空格', tier: 2, desc: '跃穿敌人立返一段充能' },
    { id: 'sh6', line: 'shadow', name: '幻影多重', key: '空格', tier: 1, desc: '豚跃 +1 段充能', apply() { G.run.mods.dashCharges = 2; } },

    // ===== 音线：音爆改写弹幕 =====
    { id: 'so1', line: 'sound', name: '音爆余韵', key: 'K', tier: 1, desc: '音爆留下灼烧声场' },
    { id: 'so2', line: 'sound', name: '夺弹反奏', key: 'K', tier: 2, desc: '音爆夺敌弹为己有，反射出去' },
    { id: 'so3', line: 'sound', name: '双重奏', key: 'K', tier: 2, desc: '音爆过后，原地再炸一次', reqLine: { line: 'sound', n: 1 } },
    { id: 'so4', line: 'sound', name: '缓声之环', key: 'K', tier: 2, desc: '声场令敌与敌弹迟缓', req: 'so1' },
    { id: 'so5', line: 'sound', name: '音之枪', key: 'K', tier: 3, desc: '音波满盈时，尾拍化贯穿狙击' },
    { id: 'so6', line: 'sound', name: '连环爆', key: 'K', tier: 2, desc: '音爆击杀的敌人殉爆', reqLine: { line: 'sound', n: 1 } },

    // ===== 息线：吐纳不只是回血 =====
    { id: 'br1', line: 'breath', name: '吞纳漩涡', key: 'L', tier: 2, desc: '吐纳时吞敌弹，化为音波' },
    { id: 'br2', line: 'breath', name: '盈息护罩', key: 'L', tier: 1, desc: '满血吐纳改凝护盾' },
    { id: 'br3', line: 'breath', name: '吐纳冲击', key: 'L', tier: 2, desc: '回复完成，弹开身边一切', reqLine: { line: 'breath', n: 1 } },
    { id: 'br4', line: 'breath', name: '以息养刃', key: 'L', tier: 3, desc: '吐纳后三次尾拍增伤回血', reqLine: { line: 'breath', n: 1 } },
    { id: 'br5', line: 'breath', name: '深海吐纳', key: 'L', tier: 2, desc: '回复翻倍，引导需两息', apply() { G.run.mods.healMul *= 2; G.run.mods.channelTime = 2.0; } },

    // ===== 鳞线：在弹幕里活下来（含擦弹）=====
    { id: 'sc1', line: 'scale', name: '跃鳞', key: '空格', tier: 1, desc: '每次豚跃披一层护盾' },
    { id: 'sc2', line: 'scale', name: '碎鳞反击', key: '—', tier: 2, desc: '护盾碎裂，迸射十二向水针', reqLine: { line: 'scale', n: 1 } },
    { id: 'sc3', line: 'scale', name: '擦浪', key: '—', tier: 3, desc: '敌弹擦身而过，化为音波' },
    { id: 'sc4', line: 'scale', name: '刹那时凝', key: '—', tier: 2, desc: '受击刹那，全场敌弹凝滞' },
    { id: 'sc5', line: 'scale', name: '键灵附体', key: '—', tier: 1, desc: '受击 25% 概率键灵代挡', apply() { G.run.mods.shieldChance += 0.25; } },
    { id: 'sc6', line: 'scale', name: '棘水', key: '—', tier: 2, desc: '受创向八方迸出水刺' },

    // ===== 道线：改写规则本身 =====
    { id: 'dao1', line: 'dao', name: '弹指破浪', key: 'J', tier: 1, desc: '尾拍可拍碎敌弹' },
    { id: 'dao2', line: 'dao', name: '碎弹取音', key: 'J', tier: 2, desc: '拍碎的敌弹化为音波', req: 'dao1' },
    { id: 'dao3', line: 'dao', name: '怒海', key: '—', tier: 2, desc: '濒死时尾拍双刃且更快' },
    { id: 'dao4', line: 'dao', name: '大智若鱼', key: '—', tier: 3, desc: '静立一息，下击必为终结拍' },
    { id: 'dao5', line: 'dao', name: '天键共鸣', key: '—', tier: 3, desc: '遭天谴后 3 秒，伤害翻倍' },
    { id: 'dao6', line: 'dao', name: '万象归一', key: '—', tier: 3, desc: '全队伤害 +25%', reqLines: 3, apply() { G.run.mods.synergyMul = 1.25; } },

    // ===== 缘·红绡：弹幕烈焰的师姐（缘起由剧情直接缔结） =====
    { id: 'hx1', line: 'hongxiao', name: '缘起 · 一线红', key: '缘', tier: 1, desc: '红绡驰援：周期绽放花瓣弹幕', gate: 'hongxiao' },
    { id: 'hx2', line: 'hongxiao', name: '红颜盛放', key: '缘', tier: 2, desc: '花瓣变九连，且贯穿', req: 'hx1' },
    { id: 'hx3', line: 'hongxiao', name: '心有灵犀', key: '缘', tier: 2, desc: '你豚跃，红绡随即齐射', req: 'hx1' },
    { id: 'hx4', line: 'hongxiao', name: '双人舞', key: '缘', tier: 2, desc: '红绡镜着你起舞，覆盖半场', req: 'hx1' },
    { id: 'hx5', line: 'hongxiao', name: '情丝缠绕', key: '缘', tier: 2, desc: '花瓣缠敌，使其迟缓', req: 'hx1' },

    // ===== 缘·灵儿：守阁的小键灵 =====
    { id: 'lg1', line: 'linger', name: '缘起 · 守阁灵', key: '缘', tier: 1, desc: '灵儿相随：不时吹出回复泡', gate: 'linger' },
    { id: 'lg2', line: 'linger', name: '灵光护主', key: '缘', tier: 2, desc: '你受击时灵儿护你一秒', req: 'lg1' },
    { id: 'lg3', line: 'linger', name: '泡中藏音', key: '缘', tier: 2, desc: '回复泡附带一口音波', req: 'lg1' },
    { id: 'lg4', line: 'linger', name: '顽皮泡泡', key: '缘', tier: 2, desc: '泡泡弹跳，撞敌炸水花', req: 'lg1' },
    { id: 'lg5', line: 'linger', name: '心意相通', key: '缘', tier: 2, desc: '灵儿在侧，吐纳快一倍', req: 'lg1' },

    // ===== 缘·静姝：止水神箭的道侣 =====
    { id: 'js1', line: 'jingshu', name: '缘起 · 止水', key: '缘', tier: 1, desc: '静姝入阵：定点连绵放箭', gate: 'jingshu' },
    { id: 'js2', line: 'jingshu', name: '洞穿', key: '缘', tier: 2, desc: '水箭贯穿一切，更迅疾', req: 'js1' },
    { id: 'js3', line: 'jingshu', name: '动静相宜', key: '缘', tier: 2, desc: '你站定，她倾泻连射', req: 'js1' },
    { id: 'js4', line: 'jingshu', name: '涟漪', key: '缘', tier: 2, desc: '水箭命中泛起涟漪', req: 'js1' },
    { id: 'js5', line: 'jingshu', name: '心如止水', key: '缘', tier: 2, desc: '立于静姝身侧，敌弹迟缓', req: 'js1' },
  ],

  // ---- 代价池（残誓，严格「x别x按x那x个x键x」句式）----
  costs: [
    { curse: 'comboSpam', tmpl: '别·急按·那个·攻·键', key: '攻', note: '0.4秒内连按第 6 次 → 僵直', conflicts: ['lv2'] },
    { curse: 'dashThenAttack', tmpl: '别·在豚跃后·按·那个·攻·键', key: '攻', note: '豚跃后 1 秒内按 J → 天谴', conflicts: [] },
    { curse: 'sameDirDash', tmpl: '别·朝原方向·按·那个·跃·键', key: '跃', note: '连续两次同向豚跃 → 天谴', conflicts: [] },
    { curse: 'postDashSilence', tmpl: '豚跃后·别·按·任何·键', key: '任何', note: '豚跃后 0.7 秒内按键 → 天谴', conflicts: [] },
    { curse: 'boomStill', tmpl: '移动时·别·按·那个·爆·键', key: '爆', note: '引爆必须站定', conflicts: ['lv8'] },
    { curse: 'mustBoom', tmpl: '音波满时·不得不·按·那个·爆·键', key: '爆', note: '满值 5 秒内不爆 → 自爆', conflicts: [] },
    { curse: 'noHeal', tmpl: '别·按·那个·纳·键', key: '纳', note: '纳键（L）封印', conflicts: ['lv4', 'lv8'] },
    { curse: 'noStill', tmpl: '别·停下·那些·移动·键', key: '移动', note: '静止超过 2 秒 → 天谴', conflicts: ['lv5'] },
    { curse: 'spiritSilence', tmpl: '键灵挡伤后·别·按·任何·键', key: '任何', note: '触发后 1 秒内按键 → 天谴', conflicts: [] },
    { curse: 'noDashCard', tmpl: '别·按·那个·跃·键', key: '跃', note: '跃键（空格）封印', conflicts: ['lv7'] },
  ],

  get byId() {
    if (!this._byId) { this._byId = {}; for (const p of this.list) this._byId[p.id] = p; }
    return this._byId;
  },

  // 神通是否可入池
  usable(p) {
    if (G.run.powers.includes(p.id)) return false;
    if (p.gate && !G.run.met[p.gate]) return false;
    if (p.req && !G.run.powers.includes(p.req)) return false;
    if (p.reqLine && G.lineCount(p.reqLine.line) < p.reqLine.n) return false;
    if (p.reqLines) {
      const lines = new Set(G.run.powers.map(id => this.byId[id].line));
      if (lines.size < p.reqLines) return false;
    }
    return true;
  },

  // 抽三个神通 + 各配一条隐藏代价
  rollOffers(n, levelId) {
    let pool = this.list.filter(p => this.usable(p));
    // 先易后难：前两个只发一眼就懂的，玩顺了再上花活
    const owned = G.run.powers.length;
    const maxTier = owned < 2 ? 1 : owned < 5 ? 2 : 3;
    const easy = pool.filter(p => (p.tier || 2) <= maxTier);
    if (easy.length >= n) pool = easy;
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const offers = pool.slice(0, n);
    // 配代价：排除与当前关键誓死锁的、与已生效残誓重复的；本次三张不重复
    const activeCurses = G.run.tempCurses.map(c => c.rule.id);
    let costPool = this.costs.filter(c => !c.conflicts.includes(levelId) && !activeCurses.includes(c.curse));
    for (let i = costPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [costPool[i], costPool[j]] = [costPool[j], costPool[i]];
    }
    return offers.map((p, i) => ({ power: p, cost: costPool[i % costPool.length] }));
  },
};

// ======================== 升级三选一（战斗内覆盖层，代价隐藏→揭示） ========================
class PowerPick {
  constructor(levelId, onDone) {
    this.onDone = onDone;
    this.offers = G.Powers.rollOffers(3, levelId);
    this.sel = 0;
    this.t = 0;
    this.phase = this.offers.length ? 'choose' : 'skip'; // choose → reveal
    this.lockT = 0.7;   // 防误触：刚弹出时战斗连打的按键一概无效
    this.revealT = 0;
    this.dur = 0;
    this.grannyLine = '';
  }
  cardRect(i) {
    const n = this.offers.length, cw = 420, ch = 520, gap = 50;
    const total = n * cw + (n - 1) * gap;
    return { x: G.W / 2 - total / 2 + i * (cw + gap), y: 280, w: cw, h: ch };
  }
  update(dt) {
    this.t += dt;
    if (this.phase === 'skip') { // 池子空了：全学完，给点血
      const p = G.currentBattle && G.currentBattle.player;
      if (p) p.hp = Math.min(p.maxhp, p.hp + 30);
      this.onDone();
      return;
    }
    if (this.phase === 'choose') {
      // 弹出锁定期：按键/点击一概无效，防止战斗连打误选
      if (this.lockT > 0) { this.lockT -= dt; return; }
      const n = this.offers.length;
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
    } else if (this.phase === 'reveal') {
      this.revealT += dt;
      if (this.revealT > 1.2 && (G.Input.just.attack || G.Input.mouse.just)) {
        G.audio.select();
        this.onDone();
      }
    }
  }
  confirm() {
    const o = this.offers[this.sel];
    G.run.powers.push(o.power.id);
    if (o.power.apply) o.power.apply();
    // 掷代价时效：1~3 关
    this.dur = G.util.randInt(1, 3);
    const rule = G.Curses.create(o.cost.curse);
    rule.levelsLeft = this.dur;
    G.run.tempCurses.push({ rule, left: this.dur, cardName: o.power.name });
    if (G.currentBattle) G.Input.rules.push(rule); // 立即在本场生效
    this.grannyLine = G.util.pick([
      '代价现形——看清楚了。',
      '天下没有白得的神通，小豚。',
      '嘶……这条誓有点疼。',
      `忍忍。${this.dur} 关而已。`,
      '签都签了，练吧。',
    ]);
    this.phase = 'reveal';
    this.revealT = 0;
    G.audio.lock();
    G.addShake(6, 0.2);
  }
  draw(ctx) {
    ctx.fillStyle = 'rgba(5,7,10,0.85)';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8c170';
    ctx.font = G.font(54);
    ctx.fillText('境 界 突 破', G.W / 2, 130);
    ctx.fillStyle = '#8a97a5';
    ctx.font = G.font(24);
    ctx.fillText(`【${G.Powers.realm(G.run.level)}】 帽婆婆：「挑吧。代价嘛……选完才知道。」`, G.W / 2, 186);

    if (this.phase === 'choose') {
      ctx.globalAlpha = G.util.clamp(1 - this.lockT / 0.7, 0.25, 1);
      for (let i = 0; i < this.offers.length; i++) this.drawCard(ctx, i);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#5a7684';
      ctx.font = G.font(24);
      if (this.lockT > 0) ctx.fillText('…… 收 手 ，静 心 ，再 选 ……', G.W / 2, 920);
      else ctx.fillText('【A/D】选择　【J】缔结', G.W / 2, 920);
    } else if (this.phase === 'reveal') {
      const o = this.offers[this.sel];
      const line = G.Powers.lines[o.power.line];
      const p = Math.min(1, this.revealT / 0.35);
      const cw = 560, ch = 620;
      const x = G.W / 2 - cw / 2, y = 240;
      ctx.save();
      ctx.translate(G.W / 2, y + ch / 2);
      ctx.scale(0.8 + p * 0.2, 0.8 + p * 0.2);
      ctx.translate(-G.W / 2, -(y + ch / 2));
      ctx.fillStyle = '#1a2230';
      G.rr(ctx, x, y, cw, ch, 22); ctx.fill();
      ctx.strokeStyle = line.color; ctx.lineWidth = 4;
      G.rr(ctx, x, y, cw, ch, 22); ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = line.color;
      ctx.font = G.font(22);
      ctx.fillText('〔' + line.name + '〕', G.W / 2, y + 52);
      ctx.fillStyle = '#e8c170';
      ctx.font = G.font(46);
      ctx.fillText(o.power.name, G.W / 2, y + 120);
      ctx.fillStyle = '#7ddf8e';
      ctx.font = G.font(25);
      this.wrap(ctx, '◆ ' + o.power.desc, G.W / 2, y + 178, cw - 80, 34);
      ctx.strokeStyle = '#33404f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 60, y + 268); ctx.lineTo(x + cw - 60, y + 268); ctx.stroke();
      // 代价揭示
      if (this.revealT > 0.35) {
        const a = Math.min(1, (this.revealT - 0.35) / 0.3);
        ctx.globalAlpha = a;
        ctx.fillStyle = '#a06060';
        ctx.font = G.font(22);
        ctx.fillText('—— 代价现形 ——', G.W / 2, y + 316);
        ctx.fillStyle = '#ff6b5e';
        ctx.font = G.font(34);
        if (a >= 1) { ctx.shadowColor = 'rgba(255,60,40,0.6)'; ctx.shadowBlur = 16; }
        this.wrap(ctx, '「' + o.cost.tmpl + '」', G.W / 2, y + 376, cw - 70, 46);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#6a5560';
        ctx.font = G.font(20);
        ctx.fillText('（何意？自己领悟。）', G.W / 2, y + 470);
        ctx.fillStyle = '#ffd166';
        ctx.font = G.font(28);
        ctx.fillText(`残誓 · ${this.dur} 关`, G.W / 2, y + 530);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      if (this.revealT > 0.7) {
        ctx.fillStyle = '#e8c170';
        ctx.font = G.font(24);
        ctx.fillText(`帽婆婆：「${this.grannyLine}」`, G.W / 2, 930);
        if (this.revealT > 1.2 && Math.sin(G.time * 5) > 0) {
          ctx.fillStyle = '#5a7684';
          ctx.font = G.font(22);
          ctx.fillText('【J】继续战斗', G.W / 2, 980);
        }
      }
    }
  }
  drawCard(ctx, i) {
    const o = this.offers[i];
    const r = this.cardRect(i);
    const hot = i === this.sel;
    const line = G.Powers.lines[o.power.line];
    ctx.save();
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
    ctx.scale(hot ? 1.04 : 1, hot ? 1.04 : 1);
    ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
    ctx.fillStyle = hot ? '#1e2836' : '#141b26';
    G.rr(ctx, r.x, r.y, r.w, r.h, 20); ctx.fill();
    ctx.strokeStyle = hot ? line.color : '#33404f';
    ctx.lineWidth = hot ? 4 : 2;
    G.rr(ctx, r.x, r.y, r.w, r.h, 20); ctx.stroke();
    ctx.textAlign = 'center';
    // 成长线标签
    ctx.fillStyle = line.color;
    ctx.font = G.font(20);
    ctx.fillText('〔' + line.name + '〕', r.x + r.w / 2, r.y + 46);
    // 键位徽章
    ctx.fillStyle = '#2a3648';
    G.rr(ctx, r.x + r.w / 2 - 45, r.y + 68, 90, 66, 12); ctx.fill();
    ctx.fillStyle = '#e8eef4';
    ctx.font = G.font(32);
    ctx.fillText(o.power.key, r.x + r.w / 2, r.y + 112);
    // 名称 + 效果
    ctx.fillStyle = '#e8c170';
    ctx.font = G.font(38);
    ctx.fillText(o.power.name, r.x + r.w / 2, r.y + 192);
    ctx.fillStyle = '#7ddf8e';
    ctx.font = G.font(24);
    this.wrap(ctx, '◆ ' + o.power.desc, r.x + r.w / 2, r.y + 246, r.w - 70, 33);
    ctx.strokeStyle = '#33404f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(r.x + 45, r.y + 356); ctx.lineTo(r.x + r.w - 45, r.y + 356); ctx.stroke();
    // 隐藏的代价
    ctx.fillStyle = '#6a5560';
    ctx.font = G.font(20);
    ctx.fillText('—— 代价（选定后现形）——', r.x + r.w / 2, r.y + 396);
    ctx.fillStyle = '#8a6a6a';
    ctx.font = G.font(40);
    const dots = '？？？';
    ctx.fillText(dots, r.x + r.w / 2, r.y + 452);
    // 半遮的线索：只透露缠绕的键位
    ctx.fillStyle = '#a98080';
    ctx.font = G.font(22);
    ctx.fillText(`（隐约缠绕于「${o.cost.key}」）`, r.x + r.w / 2, r.y + 494);
    ctx.restore();
  }
  wrap(ctx, text, cx, y, maxW, lh) {
    let line = '', ly = y;
    for (const ch of text) {
      line += ch;
      if (ctx.measureText(line).width > maxW) { ctx.fillText(line, cx, ly); line = ''; ly += lh; }
    }
    if (line) ctx.fillText(line, cx, ly);
  }
}
G.PowerPick = PowerPick;

// ======================== 羁绊同伴（战场实体） ========================
// 她们是来讲故事的，不是来代打的——台词是主角，弹幕是点缀
const BOND_QUOTES = {
  hongxiao: ['看什么看，快打！', '本、本师姐才没在担心你！', '妖族怎么了？妖族的鳍最好看！', '红线还没还呢，不许倒下！', '躲开！……哼，算你反应快。'],
  linger:   ['豚豚大人加油鸭！', '泡泡泡泡～接住嘛～', '灵儿的尾巴也很灵的！', '打完带灵儿去看海嘛！', '坏人！不许欺负大人！'],
  jingshu:  ['静。', '看箭。', '……你很吵。（对敌人说的）', '心如止水。水，也会起浪。', '你站定的样子，很好。'],
};

class Companion {
  constructor(kind) {
    this.kind = kind;           // hongxiao / linger / jingshu
    this.x = G.W / 2; this.y = G.ARENA.y + G.ARENA.h / 2 + 120;
    this.fireT = 2;
    this.quoteT = G.util.rand(6, 12);
    this.quote = null; this.quoteShow = 0;
    this.tpT = 10;              // 静姝换位
    this.chargeN = 0;           // 静姝蓄势
    this.stillT = 0;
    this.bob = Math.random() * 7;
  }
  say(text) { this.quote = text; this.quoteShow = 2.5; }
  update(dt, battle) {
    const p = battle.player, U = G.util;
    this.quoteShow = Math.max(0, this.quoteShow - dt);
    this.quoteT -= dt;
    if (this.quoteT <= 0) {
      this.quoteT = U.rand(14, 22);
      if (battle.enemies.length) this.say(U.pick(BOND_QUOTES[this.kind]));
    }
    const syn = G.run.mods.synergyMul || 1;

    if (this.kind === 'hongxiao') {
      // 位置：跟随 或 双人舞（镜像）
      let tx, ty;
      if (G.has('hx4')) {
        tx = G.ARENA.x * 2 + G.ARENA.w - p.x; ty = G.ARENA.y * 2 + G.ARENA.h - p.y;
      } else { tx = p.x - Math.cos(p.face) * 90; ty = p.y - Math.sin(p.face) * 90 - 30; }
      this.x += (tx - this.x) * Math.min(1, dt * 4);
      this.y += (ty - this.y) * Math.min(1, dt * 4);
      this.fireT -= dt;
      if (this.fireT <= 0 && battle.enemies.length) { this.fireT = 6; this.volley(battle, syn); }
      // 心有灵犀：玩家冲刺瞬间齐射
      if (G.has('hx3') && p.dashT > 0.15 && !this._dashSync) { this._dashSync = true; this.volley(battle, syn); }
      if (p.dashT <= 0) this._dashSync = false;
    } else if (this.kind === 'linger') {
      const tx = p.x + Math.cos(G.time * 1.5) * 70, ty = p.y - 70 + Math.sin(G.time * 2) * 16;
      this.x += (tx - this.x) * Math.min(1, dt * 5);
      this.y += (ty - this.y) * Math.min(1, dt * 5);
      this.fireT -= dt;
      if (this.fireT <= 0) {
        this.fireT = 8;
        const b = { x: this.x, y: this.y, r: 20, heal: 10, t: 12, vx: G.util.rand(-80, 80), vy: G.util.rand(-60, -20), bounce: G.has('lg4') };
        if (!b.bounce) { b.vx = 0; b.vy = 0; }
        battle.pickups.push(b);
        this.say('泡泡出发咯～');
      }
    } else if (this.kind === 'jingshu') {
      this.tpT -= dt;
      if (this.tpT <= 0) {
        this.tpT = 10;
        this.x = U.rand(G.ARENA.x + 150, G.ARENA.x + G.ARENA.w - 150);
        this.y = U.rand(G.ARENA.y + 120, G.ARENA.y + G.ARENA.h - 120);
        battle.fx.push({ type: 'ring', x: this.x, y: this.y, t: 0.4, max: 70, color: '#7ab0d0' });
      }
      // 动静相宜：玩家移动→蓄势；站定→倾泻
      const moving = G.Input.axis().x || G.Input.axis().y;
      if (G.has('js3')) {
        if (moving) { this.chargeN = Math.min(6, this.chargeN + dt * 2); this.stillT = 0; }
        else {
          this.stillT += dt;
          if (this.stillT > 0.5 && this.chargeN >= 1) { this.chargeN -= 1; this.shoot(battle, syn); }
        }
      }
      this.fireT -= dt;
      if (this.fireT <= 0 && battle.enemies.length) { this.fireT = 2.4; this.shoot(battle, syn); }
    }
  }
  volley(battle, syn) {
    const U = G.util;
    let target = null, best = 1e9;
    for (const e of battle.enemies) { const d = U.dist(this.x, this.y, e.x, e.y); if (d < best) { best = d; target = e; } }
    if (!target) return;
    const n = G.has('hx2') ? 9 : 5;
    const base = U.angleTo(this.x, this.y, target.x, target.y);
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 0.16;
      battle.pshots.push({
        x: this.x, y: this.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420,
        r: 8, dmg: 3 * syn, pierce: G.has('hx2'), slow: G.has('hx5'), color: '#e07a9a', petal: true, hits: [],
      });
    }
    G.audio.wave();
  }
  shoot(battle, syn) {
    const U = G.util;
    let target = null, best = 1e9;
    for (const e of battle.enemies) { const d = U.dist(this.x, this.y, e.x, e.y); if (d < best) { best = d; target = e; } }
    if (!target) return;
    const a = U.angleTo(this.x, this.y, target.x, target.y);
    const sp = G.has('js2') ? 780 : 560;
    battle.pshots.push({
      x: this.x, y: this.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      r: 7, dmg: 4 * syn, pierce: G.has('js2'), ripple: G.has('js4'), color: '#7ab0d0', arrow: true, hits: [],
    });
    G.audio.hit();
  }
  draw(ctx) {
    const t = G.time, b = Math.sin(t * 3 + this.bob) * 4;
    ctx.save();
    ctx.translate(this.x, this.y + b);
    if (this.kind === 'hongxiao') {
      G.drawPortrait(ctx, 'sister', 0, 0, 0.62);
    } else if (this.kind === 'linger') {
      G.drawPortrait(ctx, 'linger', 0, 0, 0.5);
    } else {
      G.drawPortrait(ctx, 'jingshu', 0, 0, 0.62);
      // 静姝的止水缓速场
      if (G.has('js5')) {
        ctx.strokeStyle = `rgba(122,176,208,${0.25 + Math.sin(t * 2) * 0.1})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 240, 0, 7); ctx.stroke();
      }
    }
    ctx.restore();
    // 名牌
    const names = { hongxiao: '红绡', linger: '灵儿', jingshu: '静姝' };
    const colors = { hongxiao: '#e07a9a', linger: '#9ad8c8', jingshu: '#7ab0d0' };
    ctx.fillStyle = colors[this.kind];
    ctx.font = G.font(16);
    ctx.textAlign = 'center';
    ctx.fillText(names[this.kind], this.x, this.y - 52 + b);
    // 台词气泡
    if (this.quoteShow > 0 && this.quote) {
      ctx.globalAlpha = Math.min(1, this.quoteShow);
      ctx.font = G.font(20);
      const w = ctx.measureText(this.quote).width + 30;
      ctx.fillStyle = 'rgba(16,22,30,0.9)';
      G.rr(ctx, this.x - w / 2, this.y - 100 + b, w, 36, 10); ctx.fill();
      ctx.strokeStyle = colors[this.kind]; ctx.lineWidth = 1.5;
      G.rr(ctx, this.x - w / 2, this.y - 100 + b, w, 36, 10); ctx.stroke();
      ctx.fillStyle = '#e8eef4';
      ctx.fillText(this.quote, this.x, this.y - 75 + b);
      ctx.globalAlpha = 1;
    }
  }
}
G.Companion = Companion;
