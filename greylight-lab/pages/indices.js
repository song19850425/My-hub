/* 灰灯实验室 · 生物指数计算引擎
 * ============================================================
 * 目的：把 4.2 评价矩阵从「一张阈值表」变成「一套真的能跑的计算」。
 *
 * ## 为什么要有这个文件
 *
 * 平台从上线起就在展示 Shannon / Margalef / Pielou / EPT% / IBI 的等级，
 * 但**没有任何一处真的算过这些指数** —— 阈值写在 HTML 表里，结果数字写在别处，
 * 两者从来没有比对过。已经抓到一个实例：
 *
 *     dashboard.html    「示范断面 09 BI=8.3 — 中度污染」
 *     monitoring-workflow.html 4.2 矩阵   BI > 7.0 为**重度污染**
 *
 * 8.3 落在「重度污染」区间，却被标成中度 —— 正是「阈值与结果各写各的」的必然结果。
 *
 * ## 设计原则
 *
 * 1. **能算的必须真的算。** Shannon / Simpson / Margalef / Pielou / EPT% / FOEI
 *    完全由计数数据推出，不引入任何外部参数表。
 * 2. **不能算的明确说不能算。** BI / FBI / IBD / IBI 需要逐分类单元的耐污值或
 *    敏感值赋分表，本平台没有 —— 登记表里标 `computable:false` 并写明缺什么。
 *    **宁可显示「不可计算」，也不显示一个编出来的数字。**
 * 3. **阈值只存一份。** `THRESHOLDS` 是 4.2 矩阵的机器可读副本，
 *    `display` 字段逐字对应 HTML 表格里的那 5 个单元格。
 *    `_tools/_check_thresholds.mjs` 在验证阶段比对两者，不一致即失败 ——
 *    这样阈值改了 HTML 忘了改这里（或反过来）会当场报错，不会静默漂移。
 *
 * ## 中文文案与双语
 *
 * 本文件插入 DOM 的中文只有：等级标签（优秀/良好/轻度污染/中度污染/重度污染）、
 * 分类群简称（底栖/鱼类）、断面名（示范断面 01…09）—— **全部已在 i18n-dict.js 里**，
 * 所以运行时会被 MutationObserver 接住并翻译。新增文案必须先补字典。
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  /* ---------------------------------------------------------------- 阈值
   * 与 monitoring-workflow.html 的 4.2 表逐条对应。
   *
   * 区间约定：每条 band 有 lo / hi 与 loInc / hiInc，按数组顺序**首次命中即采用**。
   * 数组顺序 = 表格列的显示顺序（优秀 → 重度污染），这样 `display` 能直接和 HTML 对拍。
   * 边界按表格原文处理：Shannon「>3.0」为优秀，所以 3.0 归良好。
   */
  var THRESHOLDS = {
    shannon: {
      name: "Shannon-Wiener (H')",
      direction: 'higher',
      decimals: 3,
      display: ['>3.0', '2.0-3.0', '1.0-2.0', '0.5-1.0', '<0.5'],
      source: '经典污染生物学分级（欧盟 WFD 生态状况 / 国内教材）',
      sourceNote: '非 HJ 1295 规定，须标注为引用',
      bands: [
        { grade: 'excellent', label: '优秀',     lo: 3.0, loInc: false, hi: Infinity, hiInc: true },
        { grade: 'good',      label: '良好',     lo: 2.0, loInc: true,  hi: 3.0,      hiInc: true },
        { grade: 'mild',      label: '轻度污染', lo: 1.0, loInc: true,  hi: 2.0,      hiInc: false },
        { grade: 'moderate',  label: '中度污染', lo: 0.5, loInc: true,  hi: 1.0,      hiInc: false },
        { grade: 'severe',    label: '重度污染', lo: -Infinity,         hi: 0.5,      hiInc: false }
      ]
    },
    bi: {
      name: 'BI 生物指数',
      direction: 'lower',
      decimals: 2,
      display: ['<4.0', '4.0-5.0', '5.0-6.0', '6.0-7.0', '>7.0'],
      source: '公式形式近似 Hilsenhoff 生物指数',
      sourceNote: '本平台自定分级，待核原始文献',
      bands: [
        { grade: 'excellent', label: '优秀',     lo: -Infinity,         hi: 4.0, hiInc: false },
        { grade: 'good',      label: '良好',     lo: 4.0, loInc: true,  hi: 5.0, hiInc: true },
        { grade: 'mild',      label: '轻度污染', lo: 5.0, loInc: false, hi: 6.0, hiInc: true },
        { grade: 'moderate',  label: '中度污染', lo: 6.0, loInc: false, hi: 7.0, hiInc: true },
        { grade: 'severe',    label: '重度污染', lo: 7.0, loInc: false, hi: Infinity, hiInc: true }
      ]
    },
    ept: {
      name: '底栖动物 EPT%',
      direction: 'higher',
      decimals: 1,
      display: ['>50%', '30-50%', '15-30%', '5-15%', '<5%'],
      source: 'EPT 为常用清洁指示类群占比',
      sourceNote: '本平台自定分级，须按区域参照样点率定',
      bands: [
        { grade: 'excellent', label: '优秀',     lo: 50, loInc: false, hi: Infinity, hiInc: true },
        { grade: 'good',      label: '良好',     lo: 30, loInc: true,  hi: 50,       hiInc: true },
        { grade: 'mild',      label: '轻度污染', lo: 15, loInc: true,  hi: 30,       hiInc: false },
        { grade: 'moderate',  label: '中度污染', lo: 5,  loInc: true,  hi: 15,       hiInc: false },
        { grade: 'severe',    label: '重度污染', lo: -Infinity,        hi: 5,        hiInc: false }
      ]
    },
    ibd: {
      name: '着生藻类 IBD',
      direction: 'higher',
      decimals: 0,
      display: ['17-20', '13-16', '9-12', '5-8', '1-4'],
      source: 'Prygiel & Coste 1999（IBD 原始分级，范围 1-20）',
      sourceNote: '非 HJ 1295 规定',
      bands: [
        { grade: 'excellent', label: '优秀',     lo: 17, loInc: true, hi: Infinity, hiInc: true },
        { grade: 'good',      label: '良好',     lo: 13, loInc: true, hi: 16,       hiInc: true },
        { grade: 'mild',      label: '轻度污染', lo: 9,  loInc: true, hi: 12,       hiInc: true },
        { grade: 'moderate',  label: '中度污染', lo: 5,  loInc: true, hi: 8,        hiInc: true },
        { grade: 'severe',    label: '重度污染', lo: -Infinity,       hi: 4,        hiInc: true }
      ]
    },
    ibi: {
      name: '鱼类 IBI',
      direction: 'higher',
      decimals: 0,
      display: ['50-60', '40-49', '30-39', '20-29', '0-19'],
      source: 'Karr 1981（IBI 原始框架）',
      sourceNote: '本平台自定分级；HJ 1295 下的指标构成与赋分须对照原文附录',
      bands: [
        { grade: 'excellent', label: '优秀',     lo: 50, loInc: true,  hi: Infinity, hiInc: true },
        { grade: 'good',      label: '良好',     lo: 40, loInc: true,  hi: 49,       hiInc: true },
        { grade: 'mild',      label: '轻度污染', lo: 30, loInc: true,  hi: 39,       hiInc: true },
        { grade: 'moderate',  label: '中度污染', lo: 20, loInc: true,  hi: 29,       hiInc: true },
        { grade: 'severe',    label: '重度污染', lo: -Infinity,        hi: 19,       hiInc: true }
      ]
    }
  };

  /* ---------------------------------------------------------------- 登记表
   * 每个指数写清：公式、需要什么输入、**能不能算**、不能算缺什么。
   *
   * 「能算」的标准是：只需计数数据（物种 + 个体数），不引入任何外部赋分表。
   * 只要需要外部表，一律标 false —— 因为本平台没有那些表，
   * 编一份出来比不显示更糟。
   */
  var REGISTRY = [
    {
      key: 'shannon', name: "Shannon-Wiener (H')", group: 'all',
      formula: "H' = -Σ (nᵢ/N) · ln(nᵢ/N)",
      inputs: '物种 + 个体数',
      computable: true, implemented: true
    },
    {
      key: 'simpson', name: 'Simpson 多样性 (1-D)', group: 'all',
      formula: '1 - Σ (nᵢ/N)²',
      inputs: '物种 + 个体数',
      computable: true, implemented: true,
      note: 'Gini-Simpson 形式（1-D）。4.2 矩阵未列此项，作为 Shannon 的稳健性对照一并输出。'
    },
    {
      key: 'margalef', name: 'Margalef 丰富度 (D)', group: 'all',
      formula: 'D = (S - 1) / ln N',
      inputs: '物种数 + 个体总数',
      computable: true, implemented: true,
      note: '4.2 矩阵未列此项；对样本量敏感，跨样点比较须先统一努力量。'
    },
    {
      key: 'pielou', name: "Pielou 均匀度 (J')", group: 'all',
      formula: "J' = H' / ln S",
      inputs: "Shannon H' + 物种数",
      computable: true, implemented: true,
      note: 'S=1 时无定义（ln 1 = 0），返回 null。'
    },
    {
      key: 'ept', name: '底栖动物 EPT%', group: 'benthos',
      formula: 'EPT 个体数 / 总个体数 × 100',
      inputs: '个体数 + 分类单元所属目',
      computable: true, implemented: true,
      caveat: '参考库底栖名录中 EPT 类群**仅纹石蛾科 1 条**，无蜉蝣目、无襀翅目 —— '
            + '本数据集上 EPT% 恒接近 0，该指数在当前名录下**不可用**。'
            + '须先补录 EPT 类群名录，否则算出来的数没有指示意义。'
    },
    {
      key: 'foei', name: '鱼类保有指数 FOEI', group: 'fish',
      formula: 'FOEI = FO / FE × 100',
      inputs: '现状鱼类种数 FO + 历史基准种数 FE',
      computable: true, implemented: true,
      caveat: 'FO 由本数据集算得；**FE 是演示值**，须由 1980s 前历史文献核定后替换，'
            + '否则 FOEI 只是「相对某个假设基准」的比例，不构成评价结论。'
    },
    {
      key: 'bi', name: 'BI 生物指数', group: 'benthos',
      formula: 'BI = Σ (nᵢ · tᵢ) / N',
      inputs: '个体数 + **逐分类单元耐污值 tᵢ**',
      computable: false, implemented: false,
      reason: '需要逐分类单元的耐污值表。本平台未内置该表，参考库也没有耐污值字段 —— '
            + '缺这一列，BI 一个数都算不出来。'
    },
    {
      key: 'fbi', name: 'Hilsenhoff 生物指数 FBI', group: 'benthos',
      formula: 'FBI = Σ (nᵢ · tᵢ) / N',
      inputs: '个体数 + Hilsenhoff 耐污值表',
      computable: false, implemented: false,
      reason: '与 BI 同源，需要 Hilsenhoff 原始耐污值表（原文为科级 0-10 赋值）。'
            + '本平台未收录该表。'
    },
    {
      key: 'ibd', name: '着生藻类 IBD', group: 'diatom',
      formula: 'IBD = Σ (aⱼ · sⱼ · vⱼ) / Σ (aⱼ · vⱼ)',
      inputs: '硅藻相对丰度 + **逐种敏感值 sⱼ 与指示权重 vⱼ**',
      computable: false, implemented: false,
      reason: '需要 Prygiel & Coste 1999 的硅藻敏感值/权重表（含约 200 个分类单元）。'
            + '本平台未收录，无法计算。'
    },
    {
      key: 'ibi', name: '鱼类 IBI', group: 'fish',
      formula: 'IBI = Σ 各指标得分',
      inputs: '鱼类区系 + **食性 / 耐受性 / 繁殖类群归属**',
      computable: false, implemented: false,
      reason: 'Karr 1981 原版 12 项指标中，多数依赖北美特有类群（镖鲈、日鲈、亚口鱼）'
            + '与食性/耐受性/繁殖类群归属，无法由「物种 + 个体数」直接得出；'
            + '国内常用的改编版 IBI 各有不同的指标构成与赋分规则。'
            + '本平台没有选定版本，因此不输出数值。'
    }
  ];

  /* ---------------------------------------------------------------- EPT 目级归属
   * 只列**参考库里实际出现过**的科，以及 EPT 三目的常见科。
   * 这张表需要随名录扩充而维护 —— 名录补了 EPT 类群，这里也要补，
   * 否则新补的类群不会被计入 EPT%。
   */
  var EPT_ORDERS = {
    // 蜉蝣目 Ephemeroptera
    Baetidae: '蜉蝣目', Ephemeridae: '蜉蝣目', Heptageniidae: '蜉蝣目',
    Leptophlebiidae: '蜉蝣目', Caenidae: '蜉蝣目', Ephemerellidae: '蜉蝣目',
    // 襀翅目 Plecoptera
    Perlidae: '襀翅目', Nemouridae: '襀翅目', Leuctridae: '襀翅目', Perlodidae: '襀翅目',
    // 毛翅目 Trichoptera
    Hydropsychidae: '毛翅目', Rhyacophilidae: '毛翅目', Philopotamidae: '毛翅目',
    Leptoceridae: '毛翅目', Limnephilidae: '毛翅目', Brachycentridae: '毛翅目',
    Glossosomatidae: '毛翅目', Hydroptilidae: '毛翅目', Polycentropodidae: '毛翅目'
  };

  /* FOEI 的历史基准 FE。
   * **这是演示值**：FE 本应是 1980s 之前的鱼类名录种数，须查历史文献核定。
   * 换成真值前，FOEI 只是「相对某个假设基准」的比例，不能当评价结论。
   */
  var FOEI_BASELINE = {
    fe: 68,
    basis: '演示值（本平台自设）',
    note: 'FE 须由 1980s 前历史鱼类名录核定后替换'
  };

  /* ---------------------------------------------------------------- 纯函数 */

  function counts(rows) {
    return rows.map(function (r) { return Number(r.n) || 0; })
               .filter(function (n) { return n > 0; });
  }

  function total(rows) {
    return counts(rows).reduce(function (a, b) { return a + b; }, 0);
  }

  function speciesCount(rows) {
    var seen = {};
    rows.forEach(function (r) {
      if ((Number(r.n) || 0) > 0) {
        seen[(r.latin || r.cn || '').trim()] = 1;
      }
    });
    return Object.keys(seen).length;
  }

  /** Shannon-Wiener H' = -Σ (nᵢ/N) ln(nᵢ/N) */
  function shannon(rows) {
    var ns = counts(rows), N = ns.reduce(function (a, b) { return a + b; }, 0);
    if (!N) { return null; }
    var h = 0;
    ns.forEach(function (n) {
      var p = n / N;
      if (p > 0) { h -= p * Math.log(p); }
    });
    return h;
  }

  /** Gini-Simpson 1 - Σ pᵢ² */
  function simpson(rows) {
    var ns = counts(rows), N = ns.reduce(function (a, b) { return a + b; }, 0);
    if (!N) { return null; }
    var s = 0;
    ns.forEach(function (n) { var p = n / N; s += p * p; });
    return 1 - s;
  }

  /** Margalef D = (S-1) / ln N */
  function margalef(rows) {
    var S = speciesCount(rows), N = total(rows);
    if (N <= 1 || S < 1) { return null; }
    return (S - 1) / Math.log(N);
  }

  /** Pielou J' = H' / ln S */
  function pielou(rows) {
    var S = speciesCount(rows), h = shannon(rows);
    if (h === null || S <= 1) { return null; }
    return h / Math.log(S);
  }

  /** 从 latin 里取出科名：'Hydropsychidae spp.' -> 'Hydropsychidae' */
  function familyOf(latin) {
    var m = String(latin || '').trim().match(/^([A-Z][a-z]+(?:idae|aceae|oidea))/);
    if (m) { return m[1]; }
    var w = String(latin || '').trim().split(/\s+/)[0];
    return w || '';
  }

  /** EPT% 与 EPT 个体数 */
  function ept(rows) {
    var N = total(rows);
    if (!N) { return { pct: null, n: 0, N: 0, taxa: [] }; }
    var eptN = 0, taxa = [];
    rows.forEach(function (r) {
      var n = Number(r.n) || 0;
      if (n <= 0) { return; }
      var fam = familyOf(r.latin);
      if (EPT_ORDERS[fam]) {
        eptN += n;
        taxa.push({ cn: r.cn, latin: r.latin, order: EPT_ORDERS[fam], n: n });
      }
    });
    return { pct: eptN / N * 100, n: eptN, N: N, taxa: taxa };
  }

  /** 优势种（按个体数排序取前 3） */
  function dominants(rows, k) {
    k = k || 3;
    return rows.slice().sort(function (a, b) {
      return (Number(b.n) || 0) - (Number(a.n) || 0);
    }).slice(0, k).map(function (r) {
      return { cn: r.cn, latin: r.latin, n: Number(r.n) || 0 };
    });
  }

  /* ---------------------------------------------------------------- 分级 */

  function bandHit(band, v) {
    var okLo = band.loInc ? (v >= band.lo) : (v > band.lo);
    var okHi = band.hiInc ? (v <= band.hi) : (v < band.hi);
    return okLo && okHi;
  }

  /** 按 key 取阈值，给一个数值定级。返回 {grade,label} 或 null。 */
  function grade(key, value) {
    var t = THRESHOLDS[key];
    if (!t || value === null || value === undefined || isNaN(value)) { return null; }
    for (var i = 0; i < t.bands.length; i++) {
      if (bandHit(t.bands[i], value)) {
        return { grade: t.bands[i].grade, label: t.bands[i].label };
      }
    }
    return null;
  }

  /* ---------------------------------------------------------------- 汇总 */

  function fmt(v, key) {
    if (v === null || v === undefined || isNaN(v)) { return null; }
    var d = (THRESHOLDS[key] && THRESHOLDS[key].decimals);
    if (d === undefined) { d = 2; }
    return Number(v).toFixed(d);
  }

  /** 一组观测记录 → 全部可计算指数 */
  function summarize(rows) {
    var e = ept(rows);
    var h = shannon(rows);
    var out = {
      S: speciesCount(rows),
      N: total(rows),
      shannon: h,
      simpson: simpson(rows),
      margalef: margalef(rows),
      pielou: pielou(rows),
      eptPct: e.pct,
      eptN: e.n,
      eptTaxa: e.taxa,
      dominants: dominants(rows)
    };
    out.text = {
      shannon: fmt(out.shannon, 'shannon'),
      simpson: fmt(out.simpson, 'shannon'),
      margalef: fmt(out.margalef, 'shannon'),
      pielou: fmt(out.pielou, 'shannon'),
      eptPct: fmt(out.eptPct, 'ept')
    };
    out.grades = {
      shannon: grade('shannon', out.shannon),
      ept: grade('ept', out.eptPct)
    };
    return out;
  }

  function keyOf(r) {
    return [r.site, r.date, r.methodKey].join('|');
  }

  /** 整个演示数据集 → 事件级结果 + 断面级 FOEI */
  function computeAll(demo) {
    if (!demo || !demo.records) { return null; }
    var byEvent = {};
    demo.records.forEach(function (r) {
      var k = keyOf(r);
      (byEvent[k] = byEvent[k] || []).push(r);
    });

    var sites = {};
    (demo.sites || []).forEach(function (s) { sites[s.id] = s; });
    var dateMeta = {};
    (demo.dates || []).forEach(function (d) { dateMeta[d.date] = d; });

    var events = Object.keys(byEvent).map(function (k) {
      var parts = k.split('|');
      var sum = summarize(byEvent[k]);
      var s = sites[parts[0]] || {};
      var d = dateMeta[parts[1]] || {};
      sum.site = parts[0];
      sum.siteName = s.name || parts[0];
      sum.reach = s.reach || '';
      sum.date = parts[1];
      sum.season = d.season || '';
      sum.methodKey = parts[2];
      sum.methodLabel = parts[2] === 'fish' ? '鱼类' : '底栖';
      return sum;
    });
    events.sort(function (a, b) {
      if (a.site !== b.site) { return a.site < b.site ? -1 : 1; }
      if (a.date !== b.date) { return a.date < b.date ? -1 : 1; }
      return a.methodKey < b.methodKey ? -1 : 1;
    });

    // FOEI 按断面算：FO = 两季鱼类的种数并集（单次电捕不能代表现状区系）
    var foBySite = {};
    demo.records.forEach(function (r) {
      if (r.methodKey !== 'fish') { return; }
      if ((Number(r.n) || 0) <= 0) { return; }
      var set = (foBySite[r.site] = foBySite[r.site] || {});
      set[(r.latin || r.cn || '').trim()] = 1;
    });
    var foei = Object.keys(sites).sort().map(function (sid) {
      var fo = Object.keys(foBySite[sid] || {}).length;
      var fe = FOEI_BASELINE.fe;
      var v = fe > 0 ? fo / fe * 100 : null;
      return {
        site: sid, siteName: sites[sid].name, reach: sites[sid].reach,
        fo: fo, fe: fe, foei: v,
        text: v === null ? null : v.toFixed(1),
        basis: FOEI_BASELINE.basis, note: FOEI_BASELINE.note
      };
    });

    return {
      version: VERSION,
      events: events,
      foei: foei,
      thresholds: THRESHOLDS,
      registry: REGISTRY,
      eptOrders: EPT_ORDERS,
      foeiBaseline: FOEI_BASELINE,
      // 供页面直接用的分组结果
      byMethod: {
        benthos: events.filter(function (e) { return e.methodKey === 'benthos'; }),
        fish: events.filter(function (e) { return e.methodKey === 'fish'; })
      }
    };
  }

  global.GL_INDICES = {
    VERSION: VERSION,
    THRESHOLDS: THRESHOLDS,
    REGISTRY: REGISTRY,
    EPT_ORDERS: EPT_ORDERS,
    FOEI_BASELINE: FOEI_BASELINE,
    shannon: shannon,
    simpson: simpson,
    margalef: margalef,
    pielou: pielou,
    ept: ept,
    dominants: dominants,
    speciesCount: speciesCount,
    total: total,
    grade: grade,
    summarize: summarize,
    computeAll: computeAll
  };
})(window);
