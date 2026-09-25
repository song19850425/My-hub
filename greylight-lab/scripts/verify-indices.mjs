/* 指数引擎自检 —— 在 Node 里用假的 window 跑通 indices.js，核对公式与分级边界。
 *
 * 为什么要单独一个自检：
 *   `indices.js` 里的阈值是 4.2 矩阵的机器可读副本，边界一旦写错，
 *   算出来的等级就是错的 —— 而错的等级在页面上看起来和正确的一模一样。
 *   边界必须用测试钉死，不能靠肉眼。
 *
 * 用法：node scripts/verify-indices.mjs
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FILES = ['pages/observation-demo-data.js', 'pages/indices.js'];

const win = {};
const ctx = vm.createContext(win);
ctx.window = win;
for (const f of FILES) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) {
    console.error(`✗ 缺少 ${f}`);
    process.exit(1);
  }
  vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
}

const I = win.GL_INDICES;
const D = win.OBSERVATION_DEMO;
if (!I || !D) {
  console.error('✗ indices.js 或 observation-demo-data.js 未正确挂载到 window');
  process.exit(1);
}

let fail = 0;
const ok = (cond, msg) => {
  if (!cond) { fail++; console.log(`  ✗ ${msg}`); }
  else { console.log(`  ✓ ${msg}`); }
};

console.log(`引擎 v${I.VERSION} | 记录 ${D.records.length} 条 | 断面 ${D.sites.length} 个\n`);

const res = I.computeAll(D);

// ---------------------------------------------------------------- 1. 结构
console.log('1. 计算结构');
ok(res && res.events.length === 36, `事件数 = ${res.events.length}（期望 36 = 9 断面 × 2 日期 × 2 方法）`);
ok(res.byMethod.benthos.length === 18, `底栖事件 = ${res.byMethod.benthos.length}（期望 18）`);
ok(res.byMethod.fish.length === 18, `鱼类事件 = ${res.byMethod.fish.length}（期望 18）`);
ok(res.foei.length === 9, `FOEI 断面 = ${res.foei.length}（期望 9）`);

// ---------------------------------------------------------------- 2. 数值合理性
console.log('\n2. 数值合理性');
const allEvents = res.events;
ok(allEvents.every(e => e.N > 0), '每个事件的个体总数 N > 0');
ok(allEvents.every(e => e.shannon !== null && e.shannon > 0), "每个事件的 H' 均可算出且 > 0");
ok(allEvents.every(e => e.shannon <= Math.log(e.S) + 1e-9),
   "H' ≤ ln(S) 恒成立（Shannon 上界）");
ok(allEvents.every(e => e.pielou !== null && e.pielou > 0 && e.pielou <= 1 + 1e-9),
   "J' ∈ (0, 1]（均匀度归一化正确）");
ok(allEvents.every(e => e.simpson > 0 && e.simpson < 1), 'Simpson 1-D ∈ (0, 1)');
ok(allEvents.every(e => e.margalef !== null && e.margalef > 0), 'Margalef D > 0');
ok(allEvents.every(e => e.grades.shannon !== null), '每个事件都有 Shannon 等级');
ok(res.foei.every(f => f.foei !== null && f.foei > 0 && f.foei <= 100),
   `FOEI ∈ (0, 100]（当前范围 ${Math.min(...res.foei.map(f => f.foei)).toFixed(1)}–${Math.max(...res.foei.map(f => f.foei)).toFixed(1)}%）`);

// ---------------------------------------------------------------- 3. 已知公式对照
console.log('\n3. 公式对照（手工算例）');
// 两个种各 50 个：H' = -2 × 0.5 ln 0.5 = ln 2 = 0.693147
const two = [{ latin: 'A', n: 50 }, { latin: 'B', n: 50 }];
const h2 = I.shannon(two);
ok(Math.abs(h2 - Math.LN2) < 1e-12, `H'(50,50) = ${h2.toFixed(6)} = ln2 ✓`);
// 单种：H' = 0，Simpson = 0，Pielou 无定义
const one = [{ latin: 'A', n: 100 }];
ok(I.shannon(one) === 0, "H'(单种) = 0");
ok(I.simpson(one) === 0, 'Simpson(单种) = 0');
ok(I.pielou(one) === null, "J'(单种) = null（ln 1 = 0，无定义）");
// Margalef: S=2, N=100 → (2-1)/ln100
const m2 = I.margalef(two);
ok(Math.abs(m2 - 1 / Math.log(100)) < 1e-12, `Margalef(2,100) = ${m2.toFixed(6)}`);
// Pielou: H'=ln2, S=2 → ln2/ln2 = 1
ok(Math.abs(I.pielou(two) - 1) < 1e-12, "J'(50,50) = 1（完全均匀）");
// EPT：纹石蛾科是毛翅目
const e = I.ept([{ latin: 'Hydropsychidae spp.', n: 30 }, { latin: 'Chironomidae spp.', n: 70 }]);
ok(Math.abs(e.pct - 30) < 1e-12, `EPT%(纹石蛾 30 / 100) = ${e.pct}%`);
ok(e.taxa.length === 1 && e.taxa[0].order === '毛翅目', '纹石蛾科归入毛翅目');

// ---------------------------------------------------------------- 4. 分级边界
console.log('\n4. 分级边界');
const shannonCases = [
  [3.0001, 'excellent'], [3.0, 'good'], [2.9999, 'good'],
  [2.0, 'good'], [1.9999, 'mild'], [1.0, 'mild'], [0.9999, 'moderate'],
  [0.5, 'moderate'], [0.4999, 'severe']
];
let bad = 0;
for (const [v, exp] of shannonCases) {
  const g = I.grade('shannon', v);
  if (!g || g.grade !== exp) { bad++; console.log(`    ✗ H'=${v} → ${g ? g.grade : 'null'}，期望 ${exp}`); }
}
ok(bad === 0, `Shannon 边界 ${shannonCases.length} 例`);

const biCases = [
  [3.999, 'excellent'], [4.0, 'good'], [5.0, 'good'], [5.001, 'mild'],
  [6.0, 'mild'], [6.001, 'moderate'], [7.0, 'moderate'], [7.001, 'severe'],
  [8.3, 'severe']
];
bad = 0;
for (const [v, exp] of biCases) {
  const g = I.grade('bi', v);
  if (!g || g.grade !== exp) { bad++; console.log(`    ✗ BI=${v} → ${g ? g.grade : 'null'}，期望 ${exp}`); }
}
ok(bad === 0, `BI 边界 ${biCases.length} 例`);

// dashboard 那处 BI=8.3 的矛盾：按矩阵必须判重度污染
const bi83 = I.grade('bi', 8.3);
ok(bi83 && bi83.grade === 'severe',
   `BI=8.3 → ${bi83 ? bi83.label : 'null'}（dashboard 原文写「中度污染」，按 4.2 矩阵应为重度污染）`);

const eptCases = [[50.001, 'excellent'], [50, 'good'], [30, 'good'], [29.999, 'mild'],
                   [15, 'mild'], [14.999, 'moderate'], [5, 'moderate'], [4.999, 'severe']];
bad = 0;
for (const [v, exp] of eptCases) {
  const g = I.grade('ept', v);
  if (!g || g.grade !== exp) { bad++; console.log(`    ✗ EPT=${v} → ${g ? g.grade : 'null'}，期望 ${exp}`); }
}
ok(bad === 0, `EPT% 边界 ${eptCases.length} 例`);

// ---------------------------------------------------------------- 5. 不可计算项必须诚实
console.log('\n5. 不可计算项登记');
const notComputable = res.registry.filter(r => !r.computable);
ok(notComputable.length === 4,
   `标为不可计算的指数 ${notComputable.length} 个：${notComputable.map(r => r.name).join(' / ')}`);
ok(notComputable.every(r => (r.reason || '').length > 20), '每个不可计算项都写明了缺什么');
const computable = res.registry.filter(r => r.computable);
ok(computable.every(r => r.implemented), '标为可计算的指数均已实现');

// ---------------------------------------------------------------- 6. EPT 名录缺口
console.log('\n6. EPT 名录缺口（预期会失败，用于确认问题真实存在）');
const eptTaxaInLibrary = D.records.filter(r => I.EPT_ORDERS[String(r.latin || '').split(/\s+/)[0]]);
const eptNames = [...new Set(eptTaxaInLibrary.map(r => r.latin))];
console.log(`    数据集中 EPT 类群：${eptNames.length ? eptNames.join('、') : '（无）'}`);
console.log(`    全部事件 EPT% 均为 ${[...new Set(res.events.map(e => e.text.eptPct))].join(' / ')}%`);
console.log('    → 参考库底栖名录缺蜉蝣目/襀翅目，EPT% 当前无指示意义（登记表已标注 caveat）');

// ---------------------------------------------------------------- 汇总
console.log('\n' + '='.repeat(58));
if (fail) {
  console.log(`✗ 自检失败：${fail} 项不符`);
  process.exit(1);
}
console.log('✓ 自检全部通过');
