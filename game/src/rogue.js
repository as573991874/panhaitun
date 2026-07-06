// ======================== 关卡 Rogue 化：选路 / 房间词缀 / 机缘事件 ========================
// 每一关 = 选路 → 房间 → 选路 → 房间 → 关主。
// 键誓仍是关卡常驻（贴合剧情），rogue 的随机性在：房型、词缀、事件、隐藏代价。
// 关内血量继承（打完一间带伤进下一间），过关回满。

G.Rogue = {
  // ---- 房间词缀（险道必带其一） ----
  mods: [
    { id: 'swift', name: '疾风弹雨', desc: '敌弹迅疾 +40%', bulletSpeed: 1.4 },
    { id: 'rage', name: '凶煞过境', desc: '敌人身法 +30%', enemySpeed: 1.3 },
    { id: 'wrath', name: '天怒', desc: '天谴更痛 ×1.5，但修为 +50%', smite: 1.5, xpMul: 1.5 },
    { id: 'rich', name: '妖气充盈', desc: '敌人更壮 +25%，但修为 +50%', hpMul: 1.25, xpMul: 1.5 },
    { id: 'tide', name: '灵潮涌动', desc: '你的音波积攒翻倍', waveGain: 2 },
  ],

  // ---- 出怪生成：随关卡爬坡 ----
  genWaves(levelIdx, elite) {
    const lvl = levelIdx + 1;
    const mk = () => {
      const total = 3 + Math.floor(lvl * 0.7) + (elite ? 2 : 0);
      let sh = lvl >= 1 ? Math.round(total * 0.3) : 0;
      let ch = lvl >= 2 ? Math.round(total * 0.25) : 0;
      const sl = Math.max(1, total - sh - ch);
      const w = [{ t: 'slave', n: sl }];
      if (sh) w.push({ t: 'shooter', n: sh });
      if (ch) w.push({ t: 'charger', n: ch });
      return w;
    };
    return [mk(), mk()];
  },

  // 房间战斗定义（继承关卡键誓；只有本关第一间演出键誓宣告）
  roomDef(level, levelIdx, opt) {
    return Object.assign({}, level, {
      waves: this.genWaves(levelIdx, opt.elite),
      boss: null,
      tutorial: false,
      skipCurseIntro: !opt.first,
      rogueRoom: true,
      roomMods: opt.mod || null,
      reward: opt.elite ? 'breakthrough' : null,
      winText: opt.elite ? '险道踏平！' : '前路已开！',
    });
  },
  // 关主战斗定义（无小怪波次，直入 Boss）
  bossDef(level) {
    return Object.assign({}, level, { waves: [], skipCurseIntro: true, tutorial: false });
  },

  // 生成 2~3 个路口选项
  genRoutes(levelIdx, roomIdx) {
    const U = G.util;
    const routes = [{ kind: 'fight' }];
    if (Math.random() < 0.75) routes.push({ kind: 'elite', mod: U.pick(this.mods) });
    if (Math.random() < 0.7) routes.push({ kind: 'event', event: U.pick(this.events.filter(e => !G.run.seenEvents.includes(e.id))) });
    if (routes.length === 1) routes.push({ kind: 'elite', mod: U.pick(this.mods) });
    // 事件池抽空了就补一条险道
    for (const r of routes) if (r.kind === 'event' && !r.event) { r.kind = 'elite'; r.mod = U.pick(this.mods); }
    return routes.slice(0, 3);
  },

  // ---- 机缘事件池（单结局：不再选完又选，福祸直接落地） ----
  // fx: hp(±)、healFull、queue(境界突破次数)、shield、heart/blade、gamble(五五开)
  events: [
    {
      id: 'spring', title: '灵泉', prompt: '崖底一汪灵泉，泉眼咕嘟咕嘟冒着泡。帽婆婆：「好东西，喝！」',
      fx: { healFull: 1 }, after: '泉水入腹，浑身伤口都在冒热气。舒坦！（伤势痊愈）',
    },
    {
      id: 'stele', title: '无字碑', prompt: '荒地里立着一块无字碑，键位的纹路在碑底流动。你盘坐下来，参了半个时辰。',
      fx: { queue: 1 }, after: '碑文入体——灵气在肚子里打转。境界，将破！',
    },
    {
      id: 'wounded', title: '受伤的妖族', prompt: '路边倒着一只被键誓反噬的小狐妖，尾巴还在冒烟。你渡了一口灵力过去。',
      fx: { hp: -15, shield: 2, heart: 1 }, after: '小狐妖绕着你转了三圈，呵出一口妖气——凝成两层水鳞。（-15 血，下一战护盾 ×2）',
    },
    {
      id: 'merchant', title: '黑市键商', prompt: '破庙里蹲着个兜帽人：「小妖，以血换键，童叟无欺。」你伸出了鳍。',
      fx: { hp: -25, queue: 1 }, after: '他收血的手法快得不像人。「合作愉快。」——境界，将破！（-25 血）',
    },
    {
      id: 'gamble', title: '赌石摊', prompt: '一块半人高的原石，摊主拍胸脯：「里面准有上古键髓！」帽婆婆：「五五开。」你把鳍拍了上去——开！',
      fx: { gamble: 1 }, after: '',
    },
    {
      id: 'echo', title: '旧键盘的残响', prompt: '半截埋在土里的老键盘，键帽早掉光了。帽婆婆忽然安静下来：「……老伙计。」你陪她坐了半个时辰。',
      fx: { hp: 30, heart: 1 }, after: '临走时，老键盘的空位里，有一格微微发了光。（回复 30）',
    },
  ],
};

// ======================== 选路场景 ========================
class RouteScene {
  constructor(levelId, levelIdx, roomIdx, onDone) {
    this.levelId = levelId;
    this.level = G.DATA.LEVELS[levelId];
    this.levelIdx = levelIdx;
    this.roomIdx = roomIdx;   // 1 或 2
    this.onDone = onDone;
    this.routes = G.Rogue.genRoutes(levelIdx, roomIdx);
    this.sel = 0;
    this.lockT = 0.5;
    this.music = 'story';
  }
  optRect(i) {
    const n = this.routes.length, w = 460, h = 420, gap = 60;
    const total = n * w + (n - 1) * gap;
    return { x: G.W / 2 - total / 2 + i * (w + gap), y: 380, w, h };
  }
  update(dt) {
    G.ThatKey.update(dt);
    if (this.lockT > 0) { this.lockT -= dt; return; }
    const n = this.routes.length;
    if (G.Input.just.left) { this.sel = (this.sel + n - 1) % n; G.audio.select(); }
    if (G.Input.just.right) { this.sel = (this.sel + 1) % n; G.audio.select(); }
    const m = G.Input.mouse;
    for (let i = 0; i < n; i++) {
      const r = this.optRect(i);
      if (m.x > r.x && m.x < r.x + r.w && m.y > r.y && m.y < r.y + r.h) {
        this.sel = i;
        if (m.just) this.go();
      }
    }
    if (G.Input.just.attack) this.go();
  }
  go() {
    const r = this.routes[this.sel];
    G.audio.confirm();
    if (r.kind === 'event') {
      G.run.seenEvents.push(r.event.id);
      G.setScene(new EventScene(r.event, this.onDone));
    } else {
      // 键誓宣告在本关第一场实际战斗时演出（选了机缘就顺延）
      const def = G.Rogue.roomDef(this.level, this.levelIdx, {
        first: !G.run.curseIntroDone,
        elite: r.kind === 'elite',
        mod: r.mod,
      });
      G.run.curseIntroDone = true;
      G.setScene(new G.Battle(def, this.onDone));
    }
  }
  draw(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#0b0f14'); g.addColorStop(1, '#131a24');
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8c170';
    ctx.font = G.font(48);
    ctx.fillText('岔 路', G.W / 2, 130);
    ctx.fillStyle = '#8a97a5';
    ctx.font = G.font(24);
    ctx.fillText(`${this.level.title} · 路程 ${this.roomIdx}/2 · 尽头是关主`, G.W / 2, 184);
    // 当前血量提醒（关内不回满）
    const hp = G.run.hp == null ? 100 : Math.ceil(G.run.hp);
    ctx.fillStyle = hp > 40 ? '#7ddf8e' : '#ff6b6b';
    ctx.font = G.font(22);
    ctx.fillText(`伤势随行：${hp}/100（本关内不回满，量力选路）`, G.W / 2, 236);

    const KINDS = {
      fight: { name: '正 道', color: '#7fa8c9', desc: ['寻常妖兵拦路', '', '稳扎稳打'] },
      elite: { name: '险 道', color: '#ff6b5e', desc: ['精锐压阵，凶多吉少', '', '踏平后必得一次境界突破'] },
      event: { name: '机 缘', color: '#e8c170', desc: ['不闻刀兵之声', '', '福祸，未可知'] },
    };
    for (let i = 0; i < this.routes.length; i++) {
      const rt = this.routes[i];
      const k = KINDS[rt.kind];
      const r = this.optRect(i);
      const hot = i === this.sel;
      ctx.fillStyle = hot ? '#1c2430' : '#131a24';
      G.rr(ctx, r.x, r.y, r.w, r.h, 18); ctx.fill();
      ctx.strokeStyle = hot ? k.color : '#2c3a48';
      ctx.lineWidth = hot ? 4 : 2;
      G.rr(ctx, r.x, r.y, r.w, r.h, 18); ctx.stroke();
      // 门
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      G.rr(ctx, r.x + r.w / 2 - 70, r.y + 44, 140, 150, 60); ctx.fill();
      ctx.strokeStyle = k.color; ctx.lineWidth = 3;
      G.rr(ctx, r.x + r.w / 2 - 70, r.y + 44, 140, 150, 60); ctx.stroke();
      ctx.fillStyle = k.color;
      ctx.font = G.font(40);
      ctx.fillText(k.name, r.x + r.w / 2, r.y + 250);
      ctx.fillStyle = '#8a97a5';
      ctx.font = G.font(21);
      ctx.fillText(rt.kind === 'event' ? `「${rt.event.title}」` : k.desc[0], r.x + r.w / 2, r.y + 296);
      ctx.fillStyle = rt.kind === 'elite' ? '#e8c170' : '#5a7684';
      ctx.font = G.font(20);
      ctx.fillText(k.desc[2], r.x + r.w / 2, r.y + 332);
      // 险道词缀
      if (rt.mod) {
        ctx.fillStyle = '#ff8a80';
        ctx.font = G.font(21);
        ctx.fillText(`词缀 ·「${rt.mod.name}」：${rt.mod.desc}`, r.x + r.w / 2, r.y + 376);
      }
    }
    ctx.fillStyle = '#5a7684';
    ctx.font = G.font(23);
    ctx.fillText(this.lockT > 0 ? '……' : '【A/D】选路　【J】动身', G.W / 2, 920);
    G.ThatKey.draw(ctx);
  }
}
G.RouteScene = RouteScene;

// ======================== 机缘事件场景（单结局：读完→落地→上路） ========================
class EventScene {
  constructor(ev, onDone) {
    this.ev = ev;
    this.onDone = onDone;
    this.lockT = 0.6;
    this.phase = 'read';   // read → after
    this.afterT = 0;
    this.afterText = '';
    this.music = 'story';
  }
  update(dt) {
    G.ThatKey.update(dt);
    if (this.phase === 'read') {
      if (this.lockT > 0) { this.lockT -= dt; return; }
      if (G.Input.just.attack || G.Input.mouse.just) this.resolve();
    } else {
      this.afterT += dt;
      if (this.afterT > 1.2 && (G.Input.just.attack || G.Input.mouse.just)) {
        G.audio.select();
        this.onDone();
      }
    }
  }
  resolve() {
    const fx = this.ev.fx || {};
    this.afterText = this.ev.after;
    const curHp = () => (G.run.hp == null ? 100 : G.run.hp);
    if (fx.gamble) {
      // 赌石：五五开
      if (Math.random() < 0.5) { G.run.levelQueue++; this.afterText = '「咔——」石开键现！一颗上古键髓滚了出来，灵气扑面。摊主哭了。（境界将破）'; }
      else { G.run.hp = Math.max(15, curHp() - 20); this.afterText = '「砰！！」原石炸了你一脸碎渣（-20 血）。摊主：「哎呀，手滑。」帽婆婆已经在撸袖子了。'; }
    }
    if (fx.hp) G.run.hp = Math.max(15, Math.min(100, curHp() + fx.hp));
    if (fx.healFull) G.run.hp = 100;
    if (fx.queue) G.run.levelQueue += fx.queue;
    if (fx.shield) G.run.nextBattleMods = Object.assign(G.run.nextBattleMods || {}, { shield: fx.shield });
    if (fx.heart) G.run.heart += fx.heart;
    if (fx.blade) G.run.blade += fx.blade;
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
  }
  draw(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#0d0b10'); g.addColorStop(1, '#181420');
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8c170';
    ctx.font = G.font(48);
    ctx.fillText(`机 缘 ·「${this.ev.title}」`, G.W / 2, 140);
    ctx.fillStyle = '#c9d3dd';
    ctx.font = G.font(29, 400);
    this.wrap(ctx, this.ev.prompt, G.W / 2, 300, 1400, 46);

    if (this.phase === 'read') {
      if (this.lockT <= 0 && Math.sin(G.time * 5) > 0) {
        ctx.fillStyle = '#e8c170';
        ctx.font = G.font(26);
        ctx.fillText('【J】且看福祸', G.W / 2, 900);
      }
    } else {
      ctx.fillStyle = '#e8eef4';
      ctx.font = G.font(28, 400);
      this.wrap(ctx, this.afterText, G.W / 2, 580, 1300, 44);
      if (this.afterT > 1.2 && Math.sin(G.time * 5) > 0) {
        ctx.fillStyle = '#e8c170';
        ctx.font = G.font(24);
        ctx.fillText('【J】继续赶路', G.W / 2, 900);
      }
    }
    G.ThatKey.draw(ctx);
  }
}
G.EventScene = EventScene;
