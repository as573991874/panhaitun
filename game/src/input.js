// ======================== InputGate：全项目唯一输入入口 ========================
// 所有键盘输入经此转发。键誓/残誓 = 挂在这里的规则对象（CurseRule），
// 规则可以拦截(block)、惩罚(punish)某次按键 —— 这是"别按那个键"的机制核心。
G.Input = {
  map: {
    KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right',
    KeyJ: 'attack', KeyK: 'skill', KeyL: 'heal', Space: 'dash',
    Enter: 'thatkey', NumpadEnter: 'thatkey',
    KeyM: 'mute',
  },
  down: {},          // 逻辑动作按住状态
  just: {},          // 本帧刚按下
  justUp: {},        // 本帧刚松开
  rules: [],         // 当前生效的诅咒规则
  combatActive: false, // 仅战斗中规则才审查按键
  mouse: { x: 0, y: 0, just: false, down: false },

  init(canvas) {
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      // 调试后门：Ctrl+Shift+9 直接胜利当前战斗（不外传）
      if (e.ctrlKey && e.shiftKey && e.code === 'Digit9') { e.preventDefault(); G.debugWin && G.debugWin(); return; }
      G.audio.ensure();
      let a = this.map[e.code];
      if (!a) return;
      e.preventDefault();
      if (a === 'thatkey') { this.just[a] = true; this.down[a] = true; return; } // 那个键永不被诅咒拦截
      if (this.combatActive) {
        for (const rule of this.rules) if (rule.remap) a = rule.remap(a); // 键位漂移类诅咒
        if (!this.attempt(a)) return; // 被规则拦截：不注册按下
      }
      this.down[a] = true;
      this.just[a] = true;
    });
    window.addEventListener('keyup', e => {
      let a = this.map[e.code];
      if (!a) return;
      if (this.combatActive) for (const rule of this.rules) if (rule.remap) a = rule.remap(a);
      if (this.down[a]) this.justUp[a] = true;
      this.down[a] = false;
    });
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) / r.width * G.W;
      this.mouse.y = (e.clientY - r.top) / r.height * G.H;
    });
    canvas.addEventListener('mousedown', () => { G.audio.ensure(); this.mouse.just = true; this.mouse.down = true; });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
  },

  // 按键审查：询问所有规则。返回 false = 该按键被拦截（不生效）
  // 同一次按键最多遭一次天谴（多条规则叠加时不重复惩罚）
  attempt(action) {
    let allowed = true;
    for (const rule of this.rules) {
      const res = rule.onPress && rule.onPress(action);
      if (!res) continue;
      if (res.block) allowed = false;
      if (res.punish) { G.events.emit('punish', { rule, action, res }); break; }
    }
    return allowed;
  },

  // 主动行为通报（如冲刺方向），供需要上下文的规则使用
  notify(what, data) {
    for (const rule of this.rules) {
      const res = rule.onNotify && rule.onNotify(what, data);
      if (res && res.punish) G.events.emit('punish', { rule, action: what, res });
    }
  },

  // 查询某动作当前是否被锁（用于 HUD 上锁显示）
  lockedBy(action) {
    for (const rule of this.rules) {
      if (rule.locks && rule.locks.includes(action)) return rule;
    }
    return null;
  },

  setRules(rules) { this.rules = rules || []; },
  update(dt) { for (const r of this.rules) r.update && r.update(dt); },
  endFrame() { this.just = {}; this.justUp = {}; this.mouse.just = false; },

  axis() {
    let x = (this.down.right ? 1 : 0) - (this.down.left ? 1 : 0);
    let y = (this.down.down ? 1 : 0) - (this.down.up ? 1 : 0);
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    return { x, y };
  },
};
