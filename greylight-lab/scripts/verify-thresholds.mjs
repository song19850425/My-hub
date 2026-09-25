/* 阈值一致性闸门 —— 比对 indices.js 的 THRESHOLDS 与 monitoring-workflow.html 的 4.2 表。
 *
 * ## 为什么必须有这道闸门
 *
 * 本轮修掉的那个矛盾（dashboard 写「BI=8.3 → 中度污染」，矩阵规定 >7.0 为重度）
 * 根因是**同一套阈值存在两份手写副本**：一份在 HTML 表格里给人看，
 * 一份在代码里给机器判级。两份之间没有任何机制保证一致。
 *
 * 把阈值收进 indices.js 只解决了一半 —— 只要 HTML 表还在，就还是两份。
 * 真正防漂移的是这道闸门：**不一致就退出码 1**，
 * 改了一处忘了另一处会当场失败，不会静默漂移到线上。
 *
 * 比对方式：`THRESHOLDS[key].display` 是 HTML 那 5 个单元格的**逐字副本**
 * （含 `>3.0`、`30-50%`、`17-20` 这类写法），比对时做 HTML 实体还原与空白折叠。
 *
 * 用法：node scripts/verify-thresholds.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAGE = path.join(ROOT, 'pages', 'monitoring-workflow.html');
const ENGINE = path.join(ROOT, 'pages', 'indices.js');

// 表格里第一列写的名字 → indices.js 里的键
const ROW_KEY = {
  "Shannon-Wiener (H')": 'shannon',
  'BI 生物指数': 'bi',
  '底栖动物 EPT%': 'ept',
  '着生藻类 IBD': 'ibd',
  '鱼类 IBI': 'ibi',
};

function loadEngine() {
  const win = {};
  vm.runInNewContext(fs.readFileSync(ENGINE, 'utf8'), { window: win });
  if (!win.GL_INDICES) throw new Error('indices.js 未挂载 window.GL_INDICES');
  return win.GL_INDICES;
}

/** HTML 实体还原 + 空白折叠 —— 与 i18n 的 normKey 同一套归一化。 */
function norm(s) {
  return s
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 从 4.2 表里抽出每行的前 6 个单元格文本。 */
function parseTable(html) {
  const t = html.indexOf('eval-table');
  if (t < 0) throw new Error('找不到 4.2 评价矩阵表（class="task-table eval-table"）');
  const end = html.indexOf('</table>', t);
  const body = html.slice(t, end);
  const tb = body.indexOf('<tbody>');
  const rowsHtml = body.slice(tb).split(/<tr>/i).slice(1);
  return rowsHtml.map((r) => {
    const cells = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      norm(m[1].replace(/<[^>]+>/g, ''))
    );
    return cells;
  }).filter((c) => c.length >= 5);
}

const I = loadEngine();
const rows = parseTable(fs.readFileSync(PAGE, 'utf8'));

let fail = 0;
console.log('阈值一致性：indices.js ↔ monitoring-workflow.html 4.2 表\n');
console.log(`表格行数 ${rows.length} / 引擎阈值 ${Object.keys(I.THRESHOLDS).length} 项\n`);

const seen = new Set();
for (const cells of rows) {
  const name = cells[0];
  const key = ROW_KEY[name];
  if (!key) {
    console.log(`  ? 表格行「${name}」在 ROW_KEY 里没有映射 —— 新增了指数却忘了登记`);
    fail++;
    continue;
  }
  seen.add(key);
  const html5 = cells.slice(1, 6);
  const code5 = I.THRESHOLDS[key].display;
  if (!code5) {
    console.log(`  ✗ ${name}：引擎里没有 display 字段`);
    fail++;
    continue;
  }
  let bad = 0;
  for (let i = 0; i < 5; i++) {
    if (html5[i] !== code5[i]) {
      bad++;
      console.log(`  ✗ ${name} 第 ${i + 1} 档：HTML「${html5[i]}」 ≠ 引擎「${code5[i]}」`);
    }
  }
  if (!bad) console.log(`  ✓ ${name}：5 档阈值逐字一致`);
  fail += bad;
}

for (const k of Object.keys(I.THRESHOLDS)) {
  if (!seen.has(k)) {
    console.log(`  ✗ 引擎里的阈值「${k}」在 4.2 表里没有对应行 —— 表格漏了或键名写错`);
    fail++;
  }
}

console.log('\n' + '='.repeat(58));
if (fail) {
  console.log(`✗ 阈值闸门未通过：${fail} 处不一致`);
  console.log('  阈值有两份副本（HTML 表给人看 / indices.js 给机器判级）。');
  console.log('  改一处必须改另一处 —— 这正是 dashboard BI=8.3 那个矛盾的成因。');
  process.exit(1);
}
console.log('✓ 阈值闸门通过：两份副本逐字一致');
