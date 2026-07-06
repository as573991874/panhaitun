// ======================== 数据：角色 / 对话 / 关卡 / 键契卡 ========================
G.DATA = {};

// ---- 角色定义（generic: 代码绘制的通用立绘参数）----
G.DATA.CHARS = {
  narrator: { name: '', color: '#8a97a5' },
  tuntun:   { name: '豚豚', color: '#8fb8d8' },
  granny:   { name: '帽婆婆', color: '#e8c170' },
  steward:  { name: '刻薄管事', color: '#d08770' },
  brute:    { name: '铁牛师兄', color: '#c46a4a', g: { robe: '#6a3a2a', skin: '#d08770', expr: 'angry', big: 1.2 } },
  sister:   { name: '红绡师姐', color: '#e07a9a', g: { robe: '#8a3a5a', skin: '#f0c0b0', expr: 'smug', hair: 1 } },
  executor: { name: '阴柔执事', color: '#9a8ac0', g: { robe: '#4a4070', skin: '#d8c8c0', expr: 'cold' } },
  couple:   { name: '双修道侣', color: '#7ab0a0', g: { robe: '#2a5a50', skin: '#e0c8b0', expr: 'smug', twin: 1 } },
  elder:    { name: '阵法长老', color: '#b0a070', g: { robe: '#5a5030', skin: '#c8b090', expr: 'cold', beard: 1 } },
  warden:   { name: '执法堂主', color: '#8a8a9a', g: { robe: '#3a3a4a', skin: '#c0a890', expr: 'angry', beard: 1 } },
  master:   { name: '玄键宗主', color: '#d4a017', g: { robe: '#1a1a2a', skin: '#d8c0a0', expr: 'cold', crown: 1 } },
  heaven:   { name: '天道', color: '#ffd166', g: { eye: 1 } },
  linger:   { name: '灵儿', color: '#9ad8c8', g: { fairy: 1 } },
  jingshu:  { name: '静姝', color: '#7ab0d0', g: { robe: '#2a5a70', skin: '#e8d0c0', expr: 'gentle', hair: 1 } },
};

// ---- 对话脚本 ----
G.DATA.DIALOGS = {
  prologue: {
    bg: 'yard',
    lines: [
      { who: 'narrator', text: '玄键宗，天下第一宗。宗规第一条：妖族，不得绑键。' },
      { who: 'tuntun', text: '挑水、扫地、给师兄们当沙包……哼，我豚豚总有一天，要堂堂正正站上键台比一场！' },
      { who: 'narrator', text: '（墙角的落叶堆里，有什么东西在幽幽发光）' },
      { who: 'tuntun', text: '咦？一块键帽……上面什么字都没有？' },
      { who: 'tuntun', text: '（吞）——海豚的习惯，别问。' },
      { who: 'granny', text: '咳咳咳！！哪个不长眼的把老身吞了？！' },
      { who: 'tuntun', text: '键、键帽成精了？！' },
      { who: 'granny', text: '老身乃天键盘器灵，帽婆婆。罢了……进了你的肚子，就是缘分。小胖子，想不想修键？' },
      { who: 'tuntun', text: '想！！' },
      { who: 'granny', text: '那记住第一条戒律，也是唯一一条——看到右下角那颗红键了吗？' },
      { who: 'granny', text: '别按那个键。', big: true },
      { who: 'tuntun', text: '……为什么？' },
      { who: 'granny', text: '少废话。跟老身练功去！' },
    ],
  },
  afterTutorial: {
    bg: 'yard',
    lines: [
      { who: 'granny', text: '嗯，是块料。肥归肥，尾巴倒是挺灵。' },
      { who: 'steward', text: '（远处怒吼）死胖子！水呢？！杂役考核要开始了——你也给我下场，给师兄们当靶子！' },
      { who: 'tuntun', text: '……考核？我也能下场？' },
      { who: 'granny', text: '呵。去吧，让他们看看，什么叫妖族。' },
    ],
  },

  lv1Intro: { bg: 'arena', lines: [
    { who: 'steward', text: '什么？杂役也想过考核？哈哈哈……行啊。' },
    { who: 'steward', text: '不过——妖族嘛，规矩得改改。' },
    { who: 'steward', text: '杂役不配闪避！站着挨打，才是你的本分！' },
    { who: 'steward', text: '敕令！！', big: true },
    { who: 'granny', text: '小心，是键誓！此誓必然生效，谁也躲不掉——' },
  ] },
  lv1Win: { bg: 'arena', lines: [
    { who: 'steward', text: '不、不可能！一个杂役——一个妖族！' },
    { who: 'tuntun', text: '记小本本上了，管事。还有——水在这，往后自己挑。' },
    { who: 'granny', text: '哟，会耍帅了。来——键契，挑一张。' },
    { who: 'granny', text: '记住，小豚：每一份神通，都有代价。' },
  ] },

  lv2Intro: { bg: 'arena', lines: [
    { who: 'brute', text: '哪来的胖鱼？赢了个管事就飘了？外门比试，你也配？' },
    { who: 'tuntun', text: '比就比。' },
    { who: 'brute', text: '好！但我外门有古礼——一息一拍，急拍者，天诛！敕令！！', big: true },
    { who: 'granny', text: '他封了你的连击。每一拍之间，须隔一息。' },
  ] },
  lv2Win: { bg: 'arena', lines: [
    { who: 'brute', text: '你、你的尾巴怎么比我的锤还快……' },
    { who: 'tuntun', text: '不是快。是每一下，都想好了再拍。' },
    { who: 'granny', text: '悟性不错。一息一拍，拍拍致命。' },
  ] },

  lv3Intro: { bg: 'arena', lines: [
    { who: 'sister', text: '听说外门出了条会打架的鱼？本师姐的「红颜咒」，专治不长眼的东西。' },
    { who: 'sister', text: '敕令！！', big: true },
    { who: 'granny', text: '红颜咒——哪个键泛红，哪个键就是她的脸面。碰了，天谴。' },
    { who: 'tuntun', text: '看脸色行事……我最擅长了。杂役十年，白干的吗？' },
  ] },
  lv3Win: { bg: 'arena', lines: [
    { who: 'sister', text: '你怎么每次都躲得开？！' },
    { who: 'tuntun', text: '师姐，你变脸之前，眉毛会先动。' },
    { who: 'granny', text: '（低声）其实是键变红前会先发白……让他装，让他装。' },
    { who: 'sister', text: '……罢了。喂，胖子，看好了。' },
    { who: 'narrator', text: '（红绡扯下肩上的红纱——纱下，一道背鳍缓缓展开。）' },
    { who: 'sister', text: '海豚妖。瞒了宗门十年的海豚妖。这身红绡，就是拿来遮鳍的。' },
    { who: 'tuntun', text: '？！师姐你——' },
    { who: 'sister', text: '你敢顶着一身肥膘堂堂正正打，本师姐凭什么继续躲？' },
    { who: 'sister', text: '这条红线，另一头先押你那儿。要是打不赢天键宗——拿命来还！' },
    { who: 'narrator', text: '【羁绊达成：红绡 —— 此后她将驰援你的战场；突破时可深化「缘·红绡」一脉】' },
  ] },

  lv4Intro: { bg: 'hall', lines: [
    { who: 'executor', text: '藏键阁重地。想查你那块键帽的来历？可以——先验明正身。' },
    { who: 'executor', text: '结「吐纳印」。按住，别松。松了，便是心虚，便是有罪。敕令！！', big: true },
    { who: 'granny', text: '他要废掉你一只手……小心，这是要命的验法。' },
    { who: 'tuntun', text: '（一只鳍死死按住印）来。' },
  ] },
  lv4Win: { bg: 'hall', lines: [
    { who: 'executor', text: '单手……全程单手？！你到底是什么东西……' },
    { who: 'granny', text: '查到了。小豚，你吞下的那块无字键帽——是天键盘最后一块残片。' },
    { who: 'tuntun', text: '所以宗主找了三百年的东西……在我肚子里？' },
    { who: 'linger', text: '（书架后探出个小脑袋）大人大人！阁里的键帽们吵着要跟你走！还有……还有灵儿！' },
    { who: 'granny', text: '守阁灵？小丫头片子，阁不守了？' },
    { who: 'linger', text: '执事都坏掉了，还守给谁看嘛。豚豚大人，收留灵儿！灵儿会吹泡泡！' },
    { who: 'narrator', text: '【羁绊达成：灵儿 —— 此后她将相随战场；突破时可深化「缘·灵儿」一脉】' },
    { who: 'granny', text: '……行了行了。快走，这里不能久留。' },
  ] },

  lv5Intro: { bg: 'arena', lines: [
    { who: 'couple', text: '（男）内门席位，一年只空一个。（女）而你，一条妖族，也想抢？' },
    { who: 'couple', text: '合击咒·动静二仪——动者不可攻，攻者不可动！敕令！！', big: true },
    { who: 'granny', text: '走就纯走，打就站桩打。脚和尾巴，一次只能用一样。' },
  ] },
  lv5Win: { bg: 'arena', lines: [
    { who: 'couple', text: '（男）你怎么被打中的？！（女）你才是怎么被打中的？！' },
    { who: 'tuntun', text: '你俩吵架的时候，就都忘了动。' },
    { who: 'jingshu', text: '（静姝忽然摘下道侣玉佩，轻轻放在地上）离缘。' },
    { who: 'couple', text: '（男）静、静姝？！十年合击，你说离就离？！' },
    { who: 'jingshu', text: '十年了。动的是你，错的也是你，挨骂的，是我。' },
    { who: 'narrator', text: '（她解开常年不离身的水袖——腕上鳞光粼粼，一尾青灰。）' },
    { who: 'jingshu', text: '妖族。海豚。和他一样。你十年，没发现过。' },
    { who: 'jingshu', text: '豚豚道友。我想试试——一个人的「静」。' },
    { who: 'granny', text: '（豚豚啊豚豚，你这是什么胖鱼体质。）' },
    { who: 'narrator', text: '【羁绊达成：静姝 —— 此后她将入阵相助；突破时可深化「缘·静姝」一脉】' },
    { who: 'granny', text: '「内门弟子豚豚」。啧，听着还挺像回事。' },
  ] },

  lv6Intro: { bg: 'hall', lines: [
    { who: 'elder', text: '宗主要老夫看看你的成色。进阵吧，妖族。' },
    { who: 'elder', text: '「颠倒阵」——你的神通，会在你的键上爬来爬去。敕令！！', big: true },
    { who: 'granny', text: '肌肉记忆靠不住了。盯着键位看，别信你的手。' },
  ] },
  lv6Win: { bg: 'hall', lines: [
    { who: 'elder', text: '阵没破……你是活活适应了它？疯子。' },
    { who: 'tuntun', text: '扫了十年地。扫帚每天都不在昨天的地方。' },
    { who: 'granny', text: '（这孩子吃过的苦，倒全成了本事。）' },
  ] },

  lv7Intro: { bg: 'hall', lines: [
    { who: 'warden', text: '妖族豚豚。私藏禁物，扰乱宗门。刑堂，拿你。' },
    { who: 'tuntun', text: '罪名呢？证据呢？' },
    { who: 'warden', text: '宗主说有，就有。刑堂的规矩——事不过三。敕令！！', big: true },
    { who: 'granny', text: '十息之内，跃两次是极限。数着用，一步都不能错。' },
  ] },
  lv7Win: { bg: 'hall', lines: [
    { who: 'warden', text: '（跪地）宗主……老臣，尽力了……' },
    { who: 'tuntun', text: '回去告诉他。别再派人来了——让他自己来。' },
    { who: 'granny', text: '……他真的会来。小豚，接下来，才是真正的坎。' },
  ] },

  lv8Intro: { bg: 'throne', lines: [
    { who: 'master', text: '好一条肥鱼。老夫找了三百年的最后一块残片，竟在你肚子里养膘。' },
    { who: 'master', text: '把键交出来。或者——老夫把你整条炼了。' },
    { who: 'tuntun', text: '婆婆是我吞的。要拿她，先把我打死。' },
    { who: 'master', text: '敕令！！', big: true },
    { who: 'granny', text: '他封尽了你的神通……只剩「爆」还在。音波会自己涨——活下来，攒住，一口气还给他！' },
  ] },
  lv8Win: { bg: 'throne', lines: [
    { who: 'master', text: '不可能！你的键，明明都被老夫封死了——' },
    { who: 'tuntun', text: '你封得住我的键。封不住我这十年，挨过的每一下。' },
    { who: 'granny', text: '（颤抖）小豚……天在暗。祂，被惊动了。' },
  ] },

  lv9Intro: { bg: 'void', lines: [
    { who: 'narrator', text: '天，裂了一道缝。缝里，是一只眼睛。' },
    { who: 'heaven', text: '【检测到：僭越。检测到：残片。回收程序，启动。】' },
    { who: 'granny', text: '祂来了……听着！祂睁眼的时候，什么都别按！祂看不见"不动的东西"！' },
    { who: 'tuntun', text: '婆婆，你在抖。' },
    { who: 'granny', text: '老身三百年前，见过祂一次。那一天，整个宗门，都没了。' },
  ] },
  lv9Win: { bg: 'void', lines: [
    { who: 'heaven', text: '【眼使已清除。切换：本体，降临。】' },
    { who: 'granny', text: '赢不了的……那是天道本身……小豚，快逃——' },
    { who: 'tuntun', text: '逃了十年了，婆婆。这次，不逃了。' },
    { who: 'granny', text: '……小豚。趁祂还没落下来，老身给你讲个故事。' },
    { who: 'granny', text: '三百年前，有个和你一样倔的孩子，也走到了天道面前。也是妖族，也被全宗门踩在脚底下，也一步一步，打到了这里。' },
    { who: 'granny', text: '他差一步。就一步。' },
    { who: 'granny', text: '祂把他连名字带影子，一起抹了。全天下，只有老身还记得他存在过。' },
    { who: 'granny', text: '因为老身……当年就是他的键灵。' },
    { who: 'tuntun', text: '……他叫什么？' },
    { who: 'granny', text: '（很久，很久）……不敢说。说了，若是记错一个字，就是第二次抹杀。' },
  ] },

  // ============ 三结局 ============
  ending_confirm: { bg: 'void', lines: [
    { who: 'narrator', text: '白光退去。天键盘悬在半空——缺口处，正好是一颗键的形状。' },
    { who: 'granny', text: '算数了。这一局，终于……算数了。' },
    { who: 'narrator', text: '（帽婆婆的声音，在发抖。）' },
    { who: 'granny', text: '刚才白光里，老身看见那孩子了。三百年前那一局……也被补上了。他的名字，回来了。' },
    { who: 'narrator', text: '（三百岁的键灵，第一次哭出了声。）' },
    { who: 'granny', text: '……小豚。老身是天键盘的器灵。键盘修好了，老身，得归位了。' },
    { who: 'tuntun', text: '？！婆婆——' },
    { who: 'granny', text: '哭什么！又不是死！往后你每敲一个键，都是在跟老身说话。' },
    { who: 'granny', text: '红绡那丫头嘴硬心软，灵儿要人哄，静姝话少你要多问。都记下了？' },
    { who: 'tuntun', text: '（用力点头，说不出话）' },
    { who: 'granny', text: '小豚。堂堂正正——去比吧。' },
    { who: 'narrator', text: '从那天起，玄键宗的键台上，多了一颗谁也不许碰的旧键帽。' },
    { who: 'narrator', text: '豚豚说，那是他师父。' },
  ] },
  ending_devour: { bg: 'void', lines: [
    { who: 'narrator', text: '豚豚看着那颗键，忽然，笑了。' },
    { who: 'tuntun', text: '婆婆，你说过的——进了肚子，就是缘分。' },
    { who: 'granny', text: '小豚？！你要干什么——住手！！' },
    { who: 'narrator', text: '（吞）——海豚的习惯，别问。' },
    { who: 'narrator', text: '天上那只手，僵在半空。然后，一根一根手指，散成了星。' },
    { who: 'heaven', text: '【权限转移。新任看守，确认中——】' },
    { who: 'narrator', text: '新的天道，生得胖胖的。看谁，都温柔。' },
    { who: 'narrator', text: '玄键宗的新弟子们说：天上那只眼睛，最爱看妖族比试。谁欺负妖族，谁明天准多挑一天水。' },
    { who: 'granny', text: '（天上）……傻孩子。这局棋，你替所有人看着了。那谁来看着你呢？' },
    { who: 'tuntun', text: '（天上）婆婆不是在吗。' },
    { who: 'narrator', text: '红绡后来总觉得，有人在看她比试。' },
    { who: 'narrator', text: '每次她赢了，云，会动一下。' },
  ] },
  ending_stay: { bg: 'void', lines: [
    { who: 'narrator', text: '豚豚看了那颗键很久，很久。然后——转过身去。' },
    { who: 'granny', text: '小豚？！按啊！这一局马上就能算数了！！' },
    { who: 'tuntun', text: '婆婆。算数……给谁看？' },
    { who: 'tuntun', text: '祂说了算的世界，我不稀罕「算数」。' },
    { who: 'tuntun', text: '我挨的打，红绡记得。我扫的地，灵儿记得。我赢的每一场，静姝都看着。' },
    { who: 'tuntun', text: '——不被记录的日子，我们自己记着。' },
    { who: 'narrator', text: '天道的手悬在半空，永远落不下来了。' },
    { who: 'narrator', text: '祂只会封键。祂封不了一条，不按键的鱼。' },
    { who: 'granny', text: '……你这胖子。老身活了三百年，头一次见有人把「不按」，按成了赢。' },
    { who: 'narrator', text: '那一局棋，至今没有结束。' },
    { who: 'narrator', text: '听说棋盘上，一群海豚，活得很吵。' },
  ] },
};

// ---- 关卡定义 ----
// waves: 每波 [{t:类型, n:数量}]；boss: 'steward' 或 GenericBoss 配置（可为数组=双Boss）
G.DATA.LEVELS = {
  tutorial: {
    id: 'tutorial', title: '杂役院 · 练功', curse: null, tutorial: true,
    waves: [[{ t: 'slave', n: 3 }], [{ t: 'slave', n: 4 }]],
    boss: null, winText: '练功完成！',
  },
  lv1: {
    id: 'lv1', title: '第一关 · 杂役考核', curse: 'noDash',
    curseText: ['别', '按', '那个', '闪', '键'], curseKeyword: '闪',
    curseHint: '帽婆婆：「闪不了，就用脚。走位，绕圈，别贪刀。」',
    waves: [[{ t: 'slave', n: 3 }], [{ t: 'slave', n: 2 }, { t: 'shooter', n: 1 }], [{ t: 'slave', n: 2 }, { t: 'shooter', n: 2 }]],
    boss: 'steward', winText: '考核通过！',
  },
  lv2: {
    id: 'lv2', title: '第二关 · 外门比试', curse: 'noRapidAttack',
    curseText: ['别', '连按', '那个', '攻', '键'], curseKeyword: '连按',
    curseHint: '帽婆婆：「一息一拍。掐着点打，第三拍最痛。」',
    waves: [[{ t: 'slave', n: 3 }, { t: 'charger', n: 1 }], [{ t: 'charger', n: 2 }, { t: 'shooter', n: 1 }], [{ t: 'slave', n: 2 }, { t: 'charger', n: 1 }, { t: 'shooter', n: 1 }]],
    boss: { name: '铁牛师兄 · 外门第一锤', hp: 400, moves: ['charge', 'charge', 'fan'], char: 'brute' },
    winText: '比试获胜！',
  },
  lv3: {
    id: 'lv3', title: '第三关 · 演武场切磋', curse: 'redKey',
    curseText: ['别', '按', '那个', '红', '键'], curseKeyword: '红',
    curseHint: '帽婆婆：「键发白，就是要变红。红了的键，换个活法。」',
    waves: [[{ t: 'shooter', n: 2 }, { t: 'slave', n: 2 }], [{ t: 'shooter', n: 3 }, { t: 'charger', n: 1 }], [{ t: 'slave', n: 3 }, { t: 'shooter', n: 2 }]],
    boss: { name: '红绡师姐 · 演武场之花', hp: 450, moves: ['fan', 'nova', 'fan'], char: 'sister' },
    winText: '切磋获胜！',
  },
  lv4: {
    id: 'lv4', title: '第四关 · 藏键阁验身', curse: 'holdHeal',
    curseText: ['别', '松开', '那个', '纳', '键'], curseKeyword: '松开',
    curseHint: '帽婆婆：「腾一只鳍死死按住 L。剩下的，交给走位。」',
    waves: [[{ t: 'slave', n: 4 }], [{ t: 'charger', n: 2 }, { t: 'shooter', n: 2 }], [{ t: 'slave', n: 3 }, { t: 'charger', n: 2 }]],
    boss: { name: '阴柔执事 · 藏键阁掌钥', hp: 480, moves: ['summon', 'fan', 'nova'], char: 'executor' },
    winText: '验身通过！',
  },
  lv5: {
    id: 'lv5', title: '第五关 · 内门夺位', curse: 'noMoveAttack',
    curseText: ['别', '同时按', '那', '两个', '键'], curseKeyword: '同时按',
    curseHint: '帽婆婆：「站定了打，打完就跑。两件事，分开做。」',
    waves: [[{ t: 'charger', n: 2 }, { t: 'shooter', n: 2 }], [{ t: 'slave', n: 4 }, { t: 'shooter', n: 2 }]],
    boss: [
      { name: '道侣 · 动', hp: 300, moves: ['charge', 'charge'], char: 'couple' },
      { name: '道侣 · 静', hp: 300, moves: ['fan', 'nova'], char: 'jingshu' },
    ],
    winText: '夺位成功！',
  },
  lv6: {
    id: 'lv6', title: '第六关 · 颠倒幻阵', curse: 'keyShuffle',
    curseText: ['那个', '键', '会', '动'], curseKeyword: '动',
    curseHint: '帽婆婆：「别信你的手，信你的眼睛。键帽上写着它现在是什么。」',
    waves: [[{ t: 'slave', n: 3 }, { t: 'shooter', n: 2 }], [{ t: 'charger', n: 2 }, { t: 'shooter', n: 2 }], [{ t: 'slave', n: 4 }, { t: 'charger', n: 1 }, { t: 'shooter', n: 1 }]],
    boss: { name: '阵法长老 · 颠倒众生', hp: 560, moves: ['nova', 'summon', 'fan'], char: 'elder' },
    winText: '破阵而出！',
  },
  lv7: {
    id: 'lv7', title: '第七关 · 刑堂问罪', curse: 'thirdDash',
    curseText: ['别', '第三次', '按', '那个', '跃', '键'], curseKeyword: '第三次',
    curseHint: '帽婆婆：「十息之内，跃两次是极限。数着用。」',
    waves: [[{ t: 'charger', n: 3 }], [{ t: 'shooter', n: 3 }, { t: 'slave', n: 2 }], [{ t: 'charger', n: 2 }, { t: 'shooter', n: 2 }, { t: 'slave', n: 2 }]],
    boss: { name: '执法堂主 · 铁面无私', hp: 650, moves: ['charge', 'fan', 'nova'], char: 'warden' },
    winText: '无罪！',
  },
  lv8: {
    id: 'lv8', title: '第八关 · 宗主夺键', curse: 'onlyBoom',
    curseText: ['只能', '按', '那个', '爆', '键'], curseKeyword: '只能',
    curseHint: '帽婆婆：「活下来。攒住。一口气，还给他。」',
    waves: [[{ t: 'slave', n: 3 }], [{ t: 'slave', n: 2 }, { t: 'shooter', n: 1 }], [{ t: 'slave', n: 3 }, { t: 'shooter', n: 1 }]],
    boss: { name: '玄键宗主 · 三百年野心', hp: 450, moves: ['fan', 'charge', 'summon', 'nova'], char: 'master' },
    winText: '宗主，败了。',
  },
  lv9: {
    id: 'lv9', title: '第九关 · 天道注视', curse: 'gaze',
    curseText: ['别', '在祂看着时', '按', '那个', '键'], curseKeyword: '在祂看着时',
    curseHint: '帽婆婆：「祂睁眼，就停手。祂看不见不动的东西。」',
    waves: [[{ t: 'shooter', n: 3 }, { t: 'charger', n: 1 }], [{ t: 'slave', n: 3 }, { t: 'shooter', n: 2 }, { t: 'charger', n: 1 }]],
    boss: { name: '天道眼使 · 无瞬之瞳', hp: 750, moves: ['nova', 'fan', 'fan', 'summon'], char: 'heaven' },
    winText: '眼使，碎了。',
  },
  lv10: { id: 'lv10', title: '终章 · 别按那个键', finale: true },
};
G.DATA.LEVEL_ORDER = ['lv1', 'lv2', 'lv3', 'lv4', 'lv5', 'lv6', 'lv7', 'lv8', 'lv9', 'lv10'];

// ---- 键契卡池（12 张，限制严格遵循「x别x按x那x个x键x」句式）----
G.DATA.CARDS = [
  {
    id: 'fury', name: '暴怒獠牙', key: 'J',
    ability: '尾拍伤害 +40%',
    restrict: '别·急按·那个·攻·键', restrictNote: '0.4秒内连按第 6 次 → 僵直 0.8 秒',
    dur: 2, curse: 'comboSpam', conflicts: [],
    apply() { G.run.mods.dmgMul *= 1.4; },
  },
  {
    id: 'tsunami', name: '一息千浪', key: 'J',
    ability: '尾拍出招快 35%',
    restrict: '豚跃后·别·按·那个·攻·键', restrictNote: '豚跃后 1 秒内按 J → 天谴',
    dur: 2, curse: 'dashThenAttack', conflicts: [],
    apply() { G.run.mods.attackCdMul *= 0.65; },
  },
  {
    id: 'phantom', name: '幻影豚跃', key: '空格',
    ability: '豚跃 +1 段充能',
    restrict: '别·原方向·按·那个·跃·键', restrictNote: '连续两次同向豚跃 → 天谴',
    dur: 2, curse: 'sameDirDash', conflicts: [],
    apply() { G.run.mods.dashCharges = 2; },
  },
  {
    id: 'bubble', name: '泡影护体', key: '空格',
    ability: '豚跃落点留一颗挡弹泡（挡 3 发）',
    restrict: '豚跃后·别·按·任何·键', restrictNote: '豚跃后 0.7 秒内按键 → 天谴',
    dur: 2, curse: 'postDashSilence', conflicts: [],
    apply() { G.run.mods.bubble = true; },
  },
  {
    id: 'echo', name: '音爆余韵', key: 'K',
    ability: '音爆留下灼烧声场 3 秒',
    restrict: '移动时·别·按·那个·爆·键', restrictNote: '引爆必须站定，动着按 K → 天谴',
    dur: 2, curse: 'boomStill', conflicts: ['lv8'],
    apply() { G.run.mods.echoField = true; },
  },
  {
    id: 'surge', name: '汹涌回响', key: 'K',
    ability: '音波积攒速度 +50%',
    restrict: '音波满时·别不·按·那个·爆·键', restrictNote: '满值后 5 秒内不引爆 → 自爆',
    dur: 2, curse: 'mustBoom', conflicts: [],
    apply() { G.run.mods.waveGainMul *= 1.5; },
  },
  {
    id: 'breath', name: '深海吐纳', key: 'L',
    ability: '吐纳回复量翻倍',
    restrict: '别·急着按·那个·纳·键', restrictNote: '吐纳引导从 1 秒变 2 秒',
    dur: 2, curse: null, conflicts: ['lv4', 'lv8'],
    apply() { G.run.mods.healMul *= 2; G.run.mods.channelTime = 2.0; },
  },
  {
    id: 'vampire', name: '以伤养伤', key: 'J',
    ability: '尾拍命中回复 1 点血',
    restrict: '别·按·那个·纳·键', restrictNote: '纳键（L）直接封印',
    dur: 2, curse: 'noHeal', conflicts: ['lv4', 'lv8'],
    apply() { G.run.mods.lifesteal += 1; },
  },
  {
    id: 'slippery', name: '滑不留手', key: 'WASD',
    ability: '游速 +20%',
    restrict: '别·停下·按·那个·移动·键', restrictNote: '静止超过 2 秒 → 天谴',
    dur: 2, curse: 'noStill', conflicts: ['lv5'],
    apply() { G.run.mods.speedMul *= 1.2; },
  },
  {
    id: 'spirit', name: '键灵附体', key: '？',
    ability: '受击时 25% 概率免伤',
    restrict: '键灵挡伤后·别·按·任何·键', restrictNote: '免伤触发后 1 秒内按键 → 天谴',
    dur: 2, curse: 'spiritSilence', conflicts: [],
    apply() { G.run.mods.shieldChance += 0.25; },
  },
  {
    id: 'heavy', name: '千斤豚体', key: '空格',
    ability: '受到的伤害 -30%',
    restrict: '别·按·那个·跃·键', restrictNote: '跃键（空格）直接封印',
    dur: 2, curse: 'noDashCard', conflicts: ['lv7'],
    apply() { G.run.mods.dmgTakenMul *= 0.7; },
  },
  {
    id: 'transfer', name: '誓约转嫁', key: '—',
    ability: '天谴伤害从 15% 降至 5%',
    restrict: '下次·只能·选·那·两张·键契', restrictNote: '下一次三选一变成二选一',
    dur: 99, curse: null, conflicts: [],
    apply() { G.run.mods.smiteMul = 1 / 3; G.run.pickTwo = true; },
  },
];

// ---- 关后抉择（道心系统：每关打完，故事里做一次选择）----
// tag: 'heart'（情·护） / 'blade'（争·锋）；fx 作用于下一关开局；hint 是给玩家看的效果预告
G.DATA.CHOICES = {
  lv1: {
    prompt: '管事跪在地上，颤抖着捧出一袋月钱——那是他十年里，从每个杂役嘴里抠下来的。',
    a: { t: '分给杂役们。他们的每一文，都该算数。', tag: 'heart', fx: { shield: 1 }, hint: '下一关开局：水鳞护盾 ×1',
      after: '杂役们捧着钱不敢信。有个小妖朝你磕头，你把他扶了起来。帽婆婆没说话，但键帽是暖的。' },
    b: { t: '拿走。这是你挨打十年的利息。', tag: 'blade', fx: { wave: 60 }, hint: '下一关开局：音波 +60',
      after: '钱袋很沉。帽婆婆哼了一声：「记仇是本事。别让仇，记住你。」' },
  },
  lv2: {
    prompt: '铁牛把锤一扔，单膝砸地：「胖哥！以后你就是我大哥！」外门弟子全在看。',
    a: { t: '扶他起来：「不当大哥。当朋友。」', tag: 'heart', fx: { enemyHpMul: 0.9 }, hint: '下一关：铁牛帮你踩场（敌人体力 -10%）',
      after: '铁牛咧嘴一笑，露出豁牙：「那朋友，下一场我先去替你把场子踩软！」' },
    b: { t: '「我一个人打上去。谁的名号也不借。」', tag: 'blade', fx: { queue: 1 }, hint: '独行之道：下一战开打即境界突破',
      after: '铁牛愣了愣，重重点头：「……好。那俺就在台下，看你打到最上头。」' },
  },
  lv3: {
    prompt: '红绡的红线还缠在你鳍上。她背过身：「说清楚，这是押金，不是定情——你打算怎么收？」',
    a: { t: '郑重系好：「打完天键宗，亲手还你。」', tag: 'heart', fx: { shield: 1 }, hint: '红线护体：下一关开局护盾 ×1',
      after: '她的耳鳍红得比纱还艳：「谁、谁要你还了！……系紧点，别弄丢。」' },
    b: { t: '缠在尾鳍上当武器：「那就物尽其用。」', tag: 'blade', fx: { wave: 60 }, hint: '红线缠尾：下一关开局音波 +60',
      after: '红绡气笑了：「把定情信物当兵器使……行，很妖族。本师姐喜欢。」' },
  },
  lv4: {
    prompt: '灵儿要跟你走。可帽婆婆说：藏键阁没了守阁灵，三百年的键帽典藏会散架。灵儿咬着嘴唇看你。',
    a: { t: '「留下守阁。打完这一仗，我来接你。」', tag: 'heart', fx: { wave: 50 }, hint: '灵儿塞给你一颗攒了十年的音波糖（音波 +50）',
      after: '灵儿瘪着嘴答应了。——三天后她还是偷偷跟来了，理由是：「阁、阁塌了灵儿也修不好嘛！」' },
    b: { t: '「带走。键帽们也该自由了。」', tag: 'blade', fx: { extra: 3, queue: 1 }, hint: '挑战：下一关多一队追兵，但开打即境界突破',
      after: '身后传来藏键阁梁柱倒塌的轰响。灵儿回头看了一眼，抹了把脸：「……拆就拆！大人在哪，阁就在哪！」' },
  },
  lv5: {
    prompt: '道侣男跪在演武场中央，嚎啕大哭求静姝回头。全内门都在围观。静姝看着你，等一个说法。',
    a: { t: '挡在静姝身前：「她的路她自己选。你，没资格拦。」', tag: 'heart', fx: { shield: 1 }, hint: '静水回护：下一关开局护盾 ×1',
      after: '静姝从你身后走出，朝你微一颔首。那是她十年里，第一次自己往前走。' },
    b: { t: '一尾巴把他拍进水池：「吵到我的人了。」', tag: 'blade', fx: { wave: 80 }, hint: '爽！下一关开局音波 +80',
      after: '水花溅了三丈高。静姝盯着水池看了半晌，忽然轻轻说：「……再拍一次给我看。」' },
  },
  lv6: {
    prompt: '阵法长老败倒在阵眼里，忽然低声说：「宗主要炼你。老夫可以装作没见过你——逃吧，妖族，还来得及。」',
    a: { t: '扶老人出阵：「谢过。但我不逃。」', tag: 'heart', fx: { enemyHpMul: 0.9 }, hint: '长老暗中撤了半座阵（敌人体力 -10%）',
      after: '老人看了你很久：「三百年前也有个孩子这么说。……去吧。老夫这次，想看到不一样的结局。」' },
    b: { t: '「不用装。回去告诉宗主：我去找他。」', tag: 'blade', fx: { enemyHpMul: 1.15, queue: 1 }, hint: '宣战：下一关敌人更强（+15%），但开打即境界突破',
      after: '长老苦笑摇头：「狂……但三百年了，宗门也该有人狂一次了。」' },
  },
  lv7: {
    prompt: '刑堂大牢里，关着历年"私藏禁物"的妖族——鳞的、羽的、须的，几十双眼睛在黑暗里看你。',
    a: { t: '劈开所有牢门：「走！都走！」', tag: 'heart', fx: { smiteMul: 0.5 }, hint: '众妖护佑：下一关天谴伤害减半',
      after: '妖族们四散奔逃前，纷纷回头看你。有个苍老的声音喊：「小海豚！我们记住你了！」——被记住，原来是这种感觉。' },
    b: { t: '「等我。打赢了宗主，牢就没了。」先赶路。', tag: 'blade', fx: { wave: 80 }, hint: '心无旁骛：下一关开局音波 +80',
      after: '黑暗里安静了一瞬，然后有人轻轻敲起了牢栏——一声，两声，满牢的妖族敲栏为你送行。' },
  },
  lv8: {
    prompt: '宗主瘫坐在王座下，忽然笑了：「你知道老夫为什么集键吗？天道每一次轮回，都把一切抹平。老夫只是想……让自己算数一次。」',
    a: { t: '「那你更不该，踩着别人去算数。」留他活着看结局。', tag: 'heart', fx: { smiteMul: 0.5 }, hint: '道心澄明：下一关天谴伤害减半',
      after: '宗主怔住，忽然老泪纵横。「……去吧。去替所有人，算这一次。」' },
    b: { t: '碾碎他的键根：「你的算法，到此为止。」', tag: 'blade', fx: { queue: 1 }, hint: '斩尽：下一战开打即境界突破',
      after: '键根碎裂的声音像冰裂。宗主抱着空掌心喃喃：「也好……也好，抹平了，就不疼了。」' },
  },
  lv9: {
    prompt: '帽婆婆讲完三百年前的故事，天已经全黑了。她问：「小豚。你怕吗？」',
    a: { t: '「怕。但婆婆，这次你不会再失去谁。」', tag: 'heart', fx: { shield: 2 }, hint: '婆婆的守护：终章开局护盾 ×2',
      after: '帽婆婆别过头去，半天憋出一句：「……肥是肥了点，心眼倒是不肥。」' },
    b: { t: '「不怕。祂欠那孩子的，我们今天讨回来。」', tag: 'blade', fx: { wave: 100 }, hint: '讨债：终章开局音波满盈',
      after: '帽婆婆深吸一口气，声音稳了：「好。那就去讨。老身这三百年的账本，都在你肚子里。」' },
  },
};

// ---- "那个键" 手贱台词（递进；第 8 条第三幕解锁）----
G.DATA.THATKEY_QUOTES = [
  '你按它干什么？！手放好！',
  '第二次了。我记下了。',
  '……你是不是觉得很好玩？',
  '小豚，有些键按下去，就收不回来了。',
  '求你了，别按。',
  '你知道上一个按了它的人怎么样了吗？……没有"上一个人"。',
  '（沉默）',
  '……也许，你和别人不一样。',
];

// ---- 教学提示 ----
G.DATA.TUTOR_HINTS = [
  '【WASD】游动',
  '【J】尾拍攻击（连击第三下更痛）',
  '【空格】豚跃冲刺（有无敌帧）',
  '打中敌人攒音波，【K】音爆引爆',
  '【L】按住吐纳回血（移速减半）',
];
