/* 名录导出自检 —— 在 Node 里验证 DwC CSV 的列、转义与适配。
 *
 * 重点验三件事：
 *   1. 列名固定且含标准 Taxon 术语（不能混进 Occurrence 术语）
 *   2. RFC 4180 转义：含逗号/引号/换行的字段必须正确加引号
 *   3. 两个 schema 的适配：species 的「门/纲」合写要拆开，biodiversity 的 lineageSci 要解析
 *
 * 用法：node scripts/verify-dwc.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function load(file, varName) {
  const win = {};
  const ctx = vm.createContext({ window: win, document: undefined });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), ctx, { filename: file });
  return win[varName];
}

const D = load('pages/dwc-export.js', 'GL_DWC');
const SP = load('pages/species-data.js', 'SPECIES_DATA');
const BIO = load('pages/biodiversity-data.js', 'BIODIVERSITY_DATA');

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else { console.log('  ✓ ' + m); } };

console.log(`dwc-export v${D.VERSION} | 列 ${D.COLUMNS.length} 个\n`);

// ---------------- 1. 列名 ----------------
console.log('1. 列名');
const REQUIRED_TAXON = ['taxonID', 'scientificName', 'vernacularName', 'taxonRank',
  'acceptedNameUsage', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus',
  'nameAccordingTo', 'references', 'taxonRemarks'];
ok(REQUIRED_TAXON.every(c => D.COLUMNS.includes(c)), 'DwC Taxon 核心术语齐全');
const OCCURRENCE_ONLY = ['occurrenceStatus', 'eventDate', 'individualCount', 'decimalLatitude',
  'decimalLongitude', 'basisOfRecord', 'recordedBy', 'occurrenceID'];
const leaked = OCCURRENCE_ONLY.filter(c => D.COLUMNS.includes(c));
ok(leaked.length === 0, `没有混入 Occurrence 术语（检查了 ${OCCURRENCE_ONLY.length} 个）`);
ok(D.COLUMNS.filter(c => c.startsWith('gl:')).length > 0, 'gl: 扩展字段有前缀，不冒充标准术语');

// ---------------- 2. CSV 转义 ----------------
console.log('\n2. RFC 4180 转义');
const csv = D.buildCSV([
  { cn: '含,逗号', latin: 'Genus species', source: '带"引号"的源', distribution: ['A', 'B'] },
  { cn: '正常', latin: 'Genus alius', source: '多行\n来源' }
], 'species');
const lines = csv.split('\r\n');
ok(lines.length === 4, `行数 = ${lines.length}（表头 + 2 条 + 结尾空行）`);
ok(lines[0].includes('scientificName'), '表头第一行是列名');
ok(csv.includes('"含,逗号"'), '含逗号的字段加了引号');
ok(csv.includes('"带""引号""的源"'), '内部引号转义成双写');
ok(csv.includes('"多行\n来源"'), '含换行的字段加了引号');
ok(csv.endsWith('\r\n'), '以 CRLF 结尾');
ok(csv.includes('A | B'), '数组字段用 | 连接');

// ---------------- 3. species 适配 ----------------
console.log('\n3. species-data.js 适配');
const one = D.adaptSpecies(SP[0]);
ok(one.scientificName === 'Carassius auratus', `scientificName = ${one.scientificName}`);
ok(one.vernacularName === '鲫', `vernacularName = ${one.vernacularName}`);
ok(one.taxonRank === 'species', `taxonRank = ${one.taxonRank}`);
ok(one.phylum === '脊索动物门' && one['class'] === '鱼纲',
   `「脊索动物门/鱼纲」已拆成 phylum=${one.phylum} / class=${one['class']}`);
ok(one.genus === 'Carassius', `genus 从学名推出 = ${one.genus}`);
ok(one.nameAccordingTo === '南方某河健康评价 2021-09', 'nameAccordingTo 取 source');
ok(one.rights === 'CC0', `rights = ${one.rights}`);

const spp = D.adaptSpecies({ cn: '桥弯藻', latin: 'Cymbella spp.' });
ok(spp.taxonRank === 'genus', `「Cymbella spp.」判为 genus 级 = ${spp.taxonRank}`);

// 同物异名：photoTaxon 与 latin 不同时才填 acceptedNameUsage
const syn = SP.find(r => r.photoTaxon && r.photoTaxon !== r.latin);
if (syn) {
  const a = D.adaptSpecies(syn);
  ok(a.acceptedNameUsage === syn.photoTaxon,
     `同物异名 ${syn.latin} → acceptedNameUsage = ${a.acceptedNameUsage}`);
} else {
  console.log('  · 数据里暂无 photoTaxon 与 latin 不同的记录，跳过该项');
}
const same = D.adaptSpecies({ cn: 'X', latin: 'Genus species', photoTaxon: 'Genus species' });
ok(same.acceptedNameUsage === '', 'acceptedNameUsage 与学名相同时留空（不冒充已核定）');

// ---------------- 4. biodiversity 适配 ----------------
console.log('\n4. biodiversity-data.js 适配');
const b = D.adaptBiodiversity(BIO[0]);
ok(b.taxonID === '324733', `taxonID = ${b.taxonID}`);
ok(b.kingdom === 'Animalia' && b.phylum === 'Arthropoda' && b['class'] === 'Insecta'
   && b.order === 'Coleoptera' && b.family === 'Scarabaeidae',
   `lineageSci 解析：${b.kingdom} > ${b.phylum} > ${b['class']} > ${b.order} > ${b.family}`);

// ---------------- 5. 全量导出 ----------------
console.log('\n5. 全量导出');
for (const [name, rows, kind] of [['物种库', SP, 'species'], ['生物多样性库', BIO, 'biodiversity']]) {
  const out = D.buildCSV(rows, kind);
  const n = out.split('\r\n').filter(Boolean).length - 1;
  ok(n === rows.length, `${name}：${rows.length} 条记录 → CSV ${n} 行数据`);
  const cols = out.split('\r\n')[0].split(',').length;
  ok(cols === D.COLUMNS.length, `${name}：表头 ${cols} 列 = COLUMNS ${D.COLUMNS.length} 列`);
}

console.log('\n' + '='.repeat(58));
if (fail) { console.log(`✗ 自检失败：${fail} 项`); process.exit(1); }
console.log('✓ 自检全部通过');
