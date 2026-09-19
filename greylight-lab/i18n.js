/* 灰灯实验室 · 中英双语运行时（语言切换按钮）
 * ============================================================
 * 设计要点（每一条都对应一个真实的坑）：
 *
 * 1. **字典按「中文原文」做键**，不给每个元素加 data-i18n。
 *    全站 1000+ 个文本节点，逐个加属性既容易漏、又会把 HTML 改得面目全非；
 *    按原文查表则**零 HTML 改动**，且「字典里没有的字符串一律保持中文」——
 *    这正好把 ID、文件名、图片署名这类**不该翻译**的东西自然排除在外。
 *
 * 2. **必须记住原文**。切回中文时要能还原，所以用 WeakMap 存
 *    「节点 → 中文原文」。不能靠反向查表（英文可能重复，且会丢空白）。
 *
 * 3. **动态渲染的内容要重新翻译**。物种库的卡片、筛选后的计数、
 *    弹层内容都是 JS 后写的；只在 DOMContentLoaded 跑一次会漏掉一大半。
 *    用 MutationObserver 盯 childList + characterData，并做防抖
 *    （物种库一屏 297 张卡片，不防抖会把自己抖死）。
 *
 * 4. **不能碰 <script>/<style>**，也不能碰切换按钮自己（否则按钮文字被反复翻译）。
 *
 * 5. **样式内联注入**，不依赖任何外部 CSS —— 站点有 2 个页面不加载 shared-app.js。
 *
 * 6. **译名与学名撞车要去重**。中文名回退成拉丁学名后，和旁边本来就有的学名
 *    画成了两次（「Oscillatoria (Oscillatoria)」，全站 136 处）。在渲染层清掉
 *    重复的那一格，而不是去改译文 —— 译文本身没错。详见 dedupeLatin()。
 *
 * 7. **拼出来的串要单列规则**。有一大类文案是 JS 运行时拼的，整串永远进不了
 *    字典（「显示 12 / 247 条」「约 77 万元」「鞘翅目 / 金龟科」「数据来源：xxx」）。
 *    这类归 composeRule() 管。查表顺序：整串 → 量词后缀 → 复合串规则。
 *
 * ⚠️ **不要相信覆盖率脚本**。`_tools/_i18n_coverage.cjs` 只看得到「HTML 静态文本」
 *    和「JS 里整段的字符串字面量」，而本站大量文案是**JS 里拼出来的 HTML 片段**
 *    （`'<div ...>分类</div>'`），两头都漏 —— 它报「待译 0」，实测却有 3000+ 个
 *    文本节点还是中文。**以 `_tools/_i18n_residue.mjs` 的浏览器实测为准。**
 *
 * 8. **「没扫到」不等于「不存在」**。弹层内容是**点击时才注入 DOM** 的，
 *    页面初载根本不存在。第一版残留扫描器只点了 `.species-card`，于是漏掉
 *    一整批弹层（筛选口径 / 照片许可说明 / 数据来源 / 专家复核 / 批量通过 /
 *    上传 / 导出…）。改成**遍历所有触发点、一次只点一个**之后，又扫出 16 条 ——
 *    包括 report-center 的「2026年9月 / 2026年3季度 / 2026年度」这类
 *    **藏在 <select> 选项里**的字符串。扫描器要主动去点开所有能点开的东西。
 *
 * 用法：页面里先引 i18n-dict.js（提供 window.GL_I18N），再引本文件。
 * 默认语言 = 中文；选择记在 localStorage['gl-lang']。
 */
(function () {
  'use strict';

  var DICT = window.GL_I18N || {};
  var LANG_KEY = 'gl-lang';
  var ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1 };
  var TOGGLE_CLASS = 'gl-lang-toggle';

  var originals = new WeakMap();   // 文本节点 → 中文原文
  var lang = readLang();

  function readLang() {
    try {
      var v = localStorage.getItem(LANG_KEY);
      return v === 'en' ? 'en' : 'zh';
    } catch (e) { return 'zh'; }
  }
  function saveLang(v) {
    try { localStorage.setItem(LANG_KEY, v); } catch (e) { /* 隐私模式等，忽略 */ }
  }

  /** 查表。返回 null 表示「没有译文，保持原样」 */
  function tr(key) {
    if (!key) return null;
    return Object.prototype.hasOwnProperty.call(DICT, key) ? DICT[key] : null;
  }

  /* ---------------- 量词后缀 ---------------- */

  /* 中文把量词跟在数字后面：「1,417 次」「64,048 次」「48,200 张」。
   * 这类节点是 JS 动态拼出来的（num(s.obsCn) + ' 次'），数字千变万化，
   * 逐条进字典根本枚举不完，所以单列一条规则。
   *
   * 英文里数词后面**不跟量词**，所以直接去掉：旁边的标签已经说明是什么
   * （「中国观测」→ "Observations in China"），写成 "1,417 observations"
   * 反而和标签重复。单独一个量词的 KPI 单元节点（<span>次</span>）同理清空。
   *
   * ⚠️ 只收「没有别的含义」的量词。**「种」绝不能收** —— 它在分类阶元
   *    里是 rank 标签（界/门/纲/目/科/属/种），字典里译作 'species'，
   *    收进来会让阶元链上的「种」被清空。 */
  var UNIT_RE = /^(?:([\d][\d.,\s]*)\s*)?(次|条|份|个|张|台|人|株|尾|只|处|项|头|羽|粒|枚)$/;

  function unitRule(key) {
    var m = UNIT_RE.exec(key);
    if (!m) return null;
    return m[1] ? m[1].trim() : '';
  }

  function isSkipped(el) {
    if (!el || el.nodeType !== 1) return false;
    // 必须**向上遍历祖先**，不能只看直接父节点。
    // 实测踩过：切换按钮的结构是 <div class="gl-lang-toggle"><button>中</button>…，
    // 按钮文字的直接父节点是 <button>，类名在外层 div 上 —— 只看一层就漏掉，
    // 于是字典里一条 '中' → 'Medium'（模型管理页的资源档位）把按钮文字也译了。
    var n = el;
    while (n && n.nodeType === 1) {
      if (SKIP_TAGS[n.nodeName]) return true;
      if (n.classList && n.classList.contains(TOGGLE_CLASS)) return true;
      n = n.parentNode;
    }
    return false;
  }

  /* ---------------- 复合串规则 ---------------- */

  /* 一大类文案是 JS 在运行时**拼**出来的，整串永远进不了字典（数据是变量）：
   *     `显示 ${n} / ${m} 条`          → 「显示 12 / 247 条」
   *     `约 ${x.toFixed(0)} 万元`       → 「约 77 万元」
   *     iucnLabel() 拼的 `近危（NT）`
   *     `数据来源：` + s.source
   *     `• ${item}`（SOP 页季节要点）
   *     [s.orderCn, s.familyCn].join(' / ')   → 「鞘翅目 / 金龟科」
   *     s.phylumCn + ' · ' + s.classCn        → 「节肢动物门 · 昆虫纲」
   *     s.cn + ' · ' + s.latin                → 「颤藻 · Oscillatoria」
   *
   * 前三条用正则直接还原；后三条本质都是「逐段查表再拼回去」，
   * 所以归成标签规则 / 项目符号规则 / 分隔符规则。
   *
   * ⚠️ 纪律：**任一段查不到就整串放弃**。宁可整句保持中文，也不要产出
   *    「Order / 科」这种半中半英 —— 那比不译更难读，也更难查。 */
  var CJK_RE = /[\u4e00-\u9fff]/;

  var MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  /** 统一查表入口：整串 → 量词后缀 → 复合规则。depth 防递归失控。 */
  function translate(key, depth) {
    var t = tr(key);
    if (t !== null) return t;
    t = unitRule(key);
    if (t !== null) return t;
    return composeRule(key, depth || 0);
  }

  function composeRule(key, depth) {
    if (depth > 3) return null;
    var m, t;

    // 1) 「显示 12 / 247 条」——筛选后的计数
    m = /^显示\s*([\d,]+)\s*\/\s*([\d,]+)\s*[条种项个]$/.exec(key);
    if (m) return 'Showing ' + m[1] + ' of ' + m[2];

    // 2) 「约 77 万元」——预算估算（万元 = 10,000 元）
    m = /^约\s*([\d,.]+)\s*万元$/.exec(key);
    if (m) {
      var yuan = Math.round(parseFloat(m[1].replace(/,/g, '')) * 10000);
      if (!isNaN(yuan)) return '≈ CNY ' + yuan.toLocaleString('en-US');
    }

    // 3) 「近危（NT）」——IUCN 等级：中文名 + 全角括号里的标准缩写
    m = /^(.+?)（([A-Z]{1,3})）$/.exec(key);
    if (m) {
      t = tr(m[1]);
      if (t !== null) return t + ' (' + m[2] + ')';
    }

    // 3b) 「微囊藻 (Microcystis)」「纹石蛾属 (Hydropsyche)」——中文名 + 括号里的拉丁学名。
    //     括号内容必须**含小写字母**才认：全大写缩写（NT / EN / CR）是 IUCN 等级，
    //     由规则 3 先接走，这里再加一道保险，避免把等级当学名。
    //     两处去重，都是「中文名回退成学名」引起的：
    //       · 译名与学名完全相同（微囊藻 → Microcystis）→ 只留一个
    //       · 译名本身已带着这串学名（纹石蛾属 → 'Hydropsyche (genus)'）→ 不再追加
    m = /^(.+?)\s*[（(]\s*([A-Z][A-Za-z .'()×-]*[a-z][A-Za-z .'()×-]*)\s*[）)]$/.exec(key);
    if (m) {
      t = translate(m[1], depth + 1);
      if (t !== null) {
        var lat = m[2].trim();
        var low = t.trim().toLowerCase();
        if (low === lat.toLowerCase()) return lat;
        if (low.indexOf(lat.toLowerCase() + ' ') === 0) return t.trim();
        return t + ' (' + lat + ')';
      }
    }

    // 3c) 「2026年9月」「2026年3季度」「2026年度」——报告周期下拉项。
    //     这三条是 shared-app.js 里写死的，但月份/年份属于变量语义，
    //     将来换年份不该再补字典，所以按规则处理。
    m = /^(\d{4})年(\d{1,2})月$/.exec(key);
    if (m) {
      var mi = parseInt(m[2], 10);
      if (mi >= 1 && mi <= 12) return MONTHS[mi] + ' ' + m[1];
    }
    m = /^(\d{4})年([1-4])季度$/.exec(key);
    if (m) return 'Q' + m[2] + ' ' + m[1];
    m = /^(\d{4})年度$/.exec(key);
    if (m) return m[1] + ' Annual';

    // 4) 「数据来源：xxx」——标签 + 值；值也递归试一遍（译不动就原样留着）
    //    标签长度上限放到 40：实测有「iNaturalist 分类单元 ID：324733」，
    //    前缀就有 19 个字符，限 16 会漏。上限只是性能护栏 —— 真正把关的是
    //    「前缀必须能在字典里查到」，所以放长不会产生误译。
    //    全角「：」和半角「:」都要试（源码里两种都有，如 '未定义的模态框: '）。
    m = /^([^：:]{1,40})[：:]\s*(\S[\s\S]*)$/.exec(key);
    if (m) {
      var label = tr(m[1] + '：');
      if (label === null) label = tr(m[1] + ':');
      if (label === null) label = tr(m[1]);
      if (label !== null) {
        var val = m[2];
        if (CJK_RE.test(val)) {
          var tv = translate(val, depth + 1);
          if (tv !== null) val = tv;
        }
        return label + ' ' + val;
      }
    }

    // 4b) 「备选 2：备选种 2（形态近似）」——复核弹层里置信度候选条。
    //     i>0 时拼的是 `'备选 ' + (i+1) + '：' + c.name`，序号是变量。
    //     「首选：X」不走这里 —— 它由规则 4 处理（'首选：' 在字典里）。
    m = /^备选\s*(\d+)\s*[：:]\s*(\S[\s\S]*)$/.exec(key);
    if (m) {
      t = translate(m[2], depth + 1);
      if (t !== null) return 'Alternative ' + m[1] + ': ' + t;
    }

    // 5) 「• 鸟类迁徙样线（秋季高峰）」——项目符号
    m = /^([•·▪‣-]\s+)([\s\S]+)$/.exec(key);
    if (m) {
      t = translate(m[2], depth + 1);
      if (t !== null) return m[1] + t;
    }

    // 7) 「复核详情 GL-2026-0945」——中文标签 + 空格 + ASCII 编号/值。
    //     两道限制叠加后才生效，不会误吃正常中文句子：
    //       · 前缀必须是**单个词**（不含空白）且能在字典里查到；
    //       · 尾部必须是纯 ASCII 记号（编号、版本号、路径）。
    //     顺带覆盖 'data-d-title' 这类「标签 + 编号」的弹层标题。
    m = /^(\S+)\s+([A-Za-z0-9][A-Za-z0-9._/-]*)$/.exec(key);
    if (m) {
      t = tr(m[1]);
      if (t !== null) return t + ' ' + m[2];
    }

    // 8) 「将以下 5 条待复核记录标记为“已复核”，并将复核人记录为当前账号（张研究员）。」
    //    ——批量通过弹层的正文。条数是变量，整句永远进不了字典，只能整句正则。
    //    （曾试图用「将以下」+「条待复核记录标记为…」两条字典碎片拼，那是**死条目**：
    //      实际渲染出来是一个文本节点，碎片永远匹配不上。）
    m = /^将以下\s*(\d+)\s*条待复核记录标记为“已复核”，并将复核人记录为当前账号（张研究员）。$/.exec(key);
    if (m) {
      return 'The following ' + m[1] + ' records will be marked as "reviewed", ' +
        'and the reviewer will be recorded as the current account (Researcher Zhang).';
    }

    // 9) 「字段9」——通用详情弹层的兜底标签（labels[i] 缺失时才出现）
    m = /^字段\s*(\d+)$/.exec(key);
    if (m) return 'Field ' + m[1];

    // 10) 「GL-2026-0945 复核完成：同意 AI 鉴定」——复核提交后的轻提示
    //     （Toast 只存活几秒，浏览器扫描器基本抓不到，只能靠拼接整串盘点发现）
    m = /^(\S+)\s+复核完成\s*[：:]\s*(\S[\s\S]*)$/.exec(key);
    if (m) {
      t = translate(m[2], depth + 1);
      if (t !== null) return m[1] + ' review complete: ' + t;
    }

    // 11) 「已批量通过 5 条记录」
    m = /^已批量通过\s*([\d,]+)\s*条记录$/.exec(key);
    if (m) return 'Bulk-approved ' + m[1] + ' records';

    // 12) 「登记样品已提交（演示数据，未真正写入）」——模态框提交后的轻提示。
    //     前缀就是模态框标题（在字典里），后缀是固定尾巴。
    m = /^(.+?)已提交（演示数据，未真正写入）$/.exec(key);
    if (m) {
      t = translate(m[1], depth + 1);
      if (t !== null) return t + ' submitted (demo data, not actually saved)';
    }

    // 6) 「A · B」「A / B」——阶元链、目/科、弹层标题
    return splitRule(key, depth);
  }

  function splitRule(key, depth) {
    // 分隔符：` · `（阶元链、弹层标题）、` / `（目/科）、` — `（'专家复核 — ' + 样品号）
    // ⚠️ 双破折号「 —— 」**不会**被当成分隔符：正则要求破折号两侧都是空白，
    //    而「 —— 」里两个破折号是连着的。散文里的「 —— 」因此保持完整，
    //    不会把一个句子劈成两半。
    var parts = key.split(/(\s+[·/—–]\s+)/);
    if (parts.length < 3) return null;
    var segs = [], seps = [];
    for (var i = 0; i < parts.length; i++) {
      if (i % 2 === 1) seps.push(parts[i]);
      else segs.push(parts[i].trim());
    }
    var out = [];
    for (var j = 0; j < segs.length; j++) {
      var seg = segs[j];
      // 不含中文的段（拉丁学名、数字、ID）原样通过
      var t = CJK_RE.test(seg) ? translate(seg, depth + 1) : seg;
      if (t === null) return null;
      // 译完与上一段撞车（「颤藻 · Oscillatoria」→ 两个 Oscillatoria）就合并
      if (out.length && out[out.length - 1].toLowerCase() === t.toLowerCase()) continue;
      out.push(t);
    }
    if (!out.length) return null;
    if (out.length === 1) return out[0];
    return out.join(' ' + seps[0].trim() + ' ');
  }

  /* ---------------- 译名与学名撞车时去重 ---------------- */

  /* 名录类 UI 是「中文名 + 学名」两个元素：
   *     表格   <td>颤藻 <span class="latin">(Oscillatoria)</span></td>
   *     卡片   <div class="species-card-name">颤藻</div>
   *            <div class="species-card-latin">Oscillatoria</div>
   *     标本   <div class="name">桥弯藻 <span class="latin">(Cymbella)</span></div>
   *
   * 中文名若没有通用英文俗名，按约定**回退成拉丁学名**（与 iNaturalist 英文界面
   * 一致，不生造译名）。于是英文模式下同一个词被画两次：
   *     Oscillatoria (Oscillatoria)       ← 表格
   *     Baetis (Baetis)                   ← 标本标签
   *     Phytomia zonata / Phytomia zonata ← 卡片两行
   * 全站 136 处（数据文件 117 + 静态 HTML 19）。
   *
   * 这**不是译文错**，是同一串字出现了两次，所以在渲染层去重：
   * 译名里已经含了这串学名时，把学名那一格清空。原文记在 data 属性上，
   * 切回中文原样还原（不能只记在 WeakMap 里 —— 清空后 nodeValue 变成空串，
   * applyTextNode 一进门就 `if (!raw) return` 了，还原逻辑根本走不到）。
   *
   * ⚠️ 判定必须**按词**比，不能按子串 —— 否则 Cymbella 会命中 Cymbellaceae，
   *    把「同科不同属」的学名也清掉。 */
  var LATIN_STORE = 'data-gl-i18n-latin';

  function isLatinEl(el) {
    if (!el || el.nodeType !== 1 || !el.classList) return false;
    return el.classList.contains('latin') || el.classList.contains('species-card-latin');
  }

  /** 找名字旁边那格学名。形状 A（同格内 span）和形状 B（并列 div）都要认。 */
  function findLatinEl(node) {
    var p = node.parentNode;
    if (!p || p.nodeType !== 1) return null;
    if (isLatinEl(p)) return null;            // 自己就是学名格，别自比
    var kids = p.children;
    for (var i = 0; i < kids.length; i++) {
      if (isLatinEl(kids[i])) return kids[i];
    }
    var sib = p.nextElementSibling;           // 卡片：名字与学名是并列的两个 div
    return isLatinEl(sib) ? sib : null;
  }

  /** 译名里是否已经含有这串学名。按词比（整串相同，或以「学名 + 空格」开头）。 */
  function nameHasLatin(en, latin) {
    var a = String(en).trim().toLowerCase();
    var b = String(latin).trim().toLowerCase();
    if (!b) return false;
    return a === b || a.indexOf(b + ' ') === 0;
  }

  /** 去掉学名外面的括号：「(Baetis)」→「Baetis」 */
  function stripParen(s) {
    return String(s).trim().replace(/^[（(]\s*/, '').replace(/\s*[）)]$/, '').trim();
  }

  function dedupeLatin(node, en) {
    var el = findLatinEl(node);
    if (!el) return;
    if (el.getAttribute(LATIN_STORE) !== null) return;   // 已处理过
    var tn = el.firstChild;
    if (!tn || tn.nodeType !== 3) return;
    if (!nameHasLatin(en, stripParen(tn.nodeValue))) return;
    el.setAttribute(LATIN_STORE, tn.nodeValue);
    tn.nodeValue = '';
  }

  /** 切回中文时把清空过的学名还原。 */
  function restoreLatin() {
    var els = document.querySelectorAll('[' + LATIN_STORE + ']');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var v = el.getAttribute(LATIN_STORE);
      var tn = el.firstChild;
      if (tn && tn.nodeType === 3) tn.nodeValue = v;
      else el.insertBefore(document.createTextNode(v), el.firstChild);
      el.removeAttribute(LATIN_STORE);
    }
  }

  /* ---------------- 文本节点 ---------------- */

  /** 把一段原文压成「查表用的键」：去掉首尾空白，内部连续空白（含换行+缩进）
   *  压成单个空格。必须与 _tools/_i18n_extract.cjs、_i18n_coverage.cjs 里的
   *  规则完全一致，否则字典键对不上。
   *
   *  为什么需要：HTML 里多行文案的文本节点长这样
   *      "……未引 HJ 1295 具体条款号。\n                建议：要么逐条补……"
   *  换行后那串缩进空格是**格式化产物**，不是文案的一部分。若按 trim() 后的
   *  原文做键，字典里就得逐字节复现换行和 16 个空格 —— 一改缩进就静默失效。 */
  function normKey(s) {
    return s.trim().replace(/\s+/g, ' ');
  }

  function applyTextNode(node) {
    var parent = node.parentNode;
    if (!parent || isSkipped(parent)) return;
    var raw = node.nodeValue;
    if (!raw) return;
    var key = normKey(raw);
    if (!key) return;

    if (lang === 'en') {
      var en = translate(key);               // 整串 → 量词后缀 → 复合串规则
      if (en === null) return;               // 字典没有 → 保持中文
      if (originals.has(node)) return;       // 已翻译过，别二次处理
      originals.set(node, raw);
      // 整段替换，只保留首尾空白。用 indexOf 定位再切片是不行的 ——
      // key 已归一化，在 raw 里根本找不到（换行/缩进被压掉了）。
      var lead = raw.match(/^\s*/)[0];
      var trail = raw.match(/\s*$/)[0];
      node.nodeValue = lead + en + trail;
      dedupeLatin(node, en);        // 译名与旁边的学名撞车 → 清掉学名那一格
    } else if (originals.has(node)) {
      node.nodeValue = originals.get(node);
      originals.delete(node);
    }
  }

  /* ---------------- 属性 ---------------- */

  function applyAttrs(el) {
    if (isSkipped(el)) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.getAttribute) continue;
      var v = el.getAttribute(a);
      if (!v) continue;
      var store = 'data-gl-i18n-' + a;
      if (lang === 'en') {
        var en = translate(normKey(v));
        if (en === null) continue;
        if (!el.hasAttribute(store)) el.setAttribute(store, v);
        el.setAttribute(a, en);
      } else if (el.hasAttribute(store)) {
        el.setAttribute(a, el.getAttribute(store));
        el.removeAttribute(store);
      }
    }
  }

  /* ---------------- 遍历 ---------------- */

  function applyTree(root) {
    if (!root) return;
    if (root.nodeType === 3) { applyTextNode(root); return; }
    if (root.nodeType === 1) applyAttrs(root);
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;

    // TreeWalker 的 currentNode 初始就在 root 上，nextNode() 从 root 的
    // **第一个后代**开始，正好覆盖整棵子树而不重复访问 root 自己。
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var n = walker.nextNode();
    while (n) {
      if (n.nodeType === 3) applyTextNode(n);
      else applyAttrs(n);
      n = walker.nextNode();
    }
  }

  function applyAll() {
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
    if (lang === 'zh') restoreLatin();   // 还原被去重清空的学名（必须在遍历前）
    // <title>
    var t = document.querySelector('title');
    if (t) {
      var raw = t.getAttribute('data-gl-i18n-title') || t.textContent;
      if (lang === 'en') {
        var en = translate(normKey(raw));
        if (en !== null) {
          if (!t.hasAttribute('data-gl-i18n-title')) t.setAttribute('data-gl-i18n-title', raw);
          t.textContent = en;
        }
      } else if (t.hasAttribute('data-gl-i18n-title')) {
        t.textContent = t.getAttribute('data-gl-i18n-title');
        t.removeAttribute('data-gl-i18n-title');
      }
    }
    applyTree(document.body || document.documentElement);
  }

  /* ---------------- 切换按钮 ---------------- */

  function injectStyle() {
    if (document.getElementById('gl-lang-style')) return;
    var s = document.createElement('style');
    s.id = 'gl-lang-style';
    s.textContent =
      '.' + TOGGLE_CLASS + '{display:inline-flex;align-items:center;gap:0;border:1px solid var(--brand-border,#d4d9e0);' +
      'border-radius:999px;overflow:hidden;background:var(--brand-surface,#fff);flex:0 0 auto;margin-left:10px;}' +
      '.' + TOGGLE_CLASS + ' button{appearance:none;border:0;background:transparent;cursor:pointer;' +
      'font:inherit;font-size:12px;line-height:1;padding:6px 11px;color:var(--ink-2,#5a6678);}' +
      '.' + TOGGLE_CLASS + ' button[aria-pressed="true"]{background:var(--brand-primary,#0071e3);color:#fff;font-weight:600;}' +
      '.' + TOGGLE_CLASS + ' button:focus-visible{outline:2px solid var(--brand-ring,rgba(0,113,227,.5));outline-offset:-2px;}' +
      '.' + TOGGLE_CLASS + '.gl-lang-float{position:fixed;right:18px;bottom:18px;z-index:9999;margin:0;' +
      'box-shadow:0 4px 16px rgba(0,0,0,.14);}';
    document.head.appendChild(s);
  }

  function buildToggle() {
    var box = document.createElement('div');
    box.className = TOGGLE_CLASS;
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', '语言 / Language');
    ['zh', 'en'].forEach(function (code) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-gl-lang', code);
      b.textContent = code === 'zh' ? '中' : 'EN';
      b.addEventListener('click', function (e) {
        e.preventDefault();
        setLang(code);
      });
      box.appendChild(b);
    });
    return box;
  }

  function mountToggle() {
    injectStyle();
    if (document.querySelector('.' + TOGGLE_CLASS)) { syncToggle(); return; }
    var box = buildToggle();
    var host = document.querySelector('.header-right') || document.querySelector('.app-header');
    if (host) {
      if (host.classList && host.classList.contains('header-right')) host.insertBefore(box, host.firstChild);
      else host.appendChild(box);
    } else {
      box.classList.add('gl-lang-float');
      document.body.appendChild(box);
    }
    syncToggle();
  }

  function syncToggle() {
    var btns = document.querySelectorAll('.' + TOGGLE_CLASS + ' button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-gl-lang') === lang ? 'true' : 'false');
    }
  }

  function setLang(v) {
    if (v !== 'en' && v !== 'zh') return;
    lang = v;
    saveLang(v);
    // ⚠️ 这里**绝不能**重置 originals —— 它就是「切回中文」的唯一依据，
    // 清空后中文原文就找不回来了（实测：切回中文时导航仍是英文）。
    applyAll();
    syncToggle();
    try {
      document.dispatchEvent(new CustomEvent('gl:langchange', { detail: { lang: lang } }));
    } catch (e) { /* 老浏览器忽略 */ }
  }

  /* ---------------- 动态内容 ---------------- */

  var pending = null;
  function scheduleApply() {
    if (pending) return;
    pending = setTimeout(function () {
      pending = null;
      applyAll();
    }, 120);   // 防抖：物种库一屏 297 张卡片，不防抖会卡死
  }

  function observe() {
    if (!window.MutationObserver) return;
    var mo = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === 'childList' && (r.addedNodes.length || r.removedNodes.length)) { scheduleApply(); return; }
        if (r.type === 'characterData') {
          var p = r.target.parentNode;
          if (p && (p.classList && p.classList.contains(TOGGLE_CLASS))) continue;
          scheduleApply();
          return;
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function start() {
    mountToggle();
    applyAll();
    observe();
    // 有些页面在 DOMContentLoaded 之后还会再渲染一轮（图表、卡片）
    setTimeout(function () { applyAll(); syncToggle(); }, 400);
    window.GL_LANG = {
      get: function () { return lang; },
      set: setLang,
      dict: DICT,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
