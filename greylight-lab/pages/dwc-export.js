/* 名录导出 · Darwin Core（Taxon）CSV
 * ============================================================
 * ## 为什么用 Taxon 而不是 Occurrence
 *
 * Darwin Core 有两条主线：**Occurrence**（某时某地记录到某个个体/群体）
 * 和 **Taxon**（分类单元本身）。本站的两个库是**名录**，不是调查记录 ——
 * 里面没有时间、没有地点、没有个体数，只有「这个分类单元存在、叫什么、据谁定名」。
 *
 * 所以这里只用 Taxon 术语（scientificName / taxonRank / nameAccordingTo / references …）。
 * 用 Occurrence 术语（occurrenceStatus / eventDate / individualCount）会把这批数据
 * **伪装成出现记录** —— 别人拉进 GBIF 或做分布分析时会直接出错，而且错得看不出来。
 *
 * ## 为什么是「加下载」而不是「加接口」
 *
 * 纯前端 Blob 下载，不依赖服务端。代价是数据在页面里已全部加载（本来也是），
 * 收益是这份导出在任何离线环境下都能用 —— 与本站「离线演示版」的定位一致。
 *
 * ## gl: 前缀
 *
 * 平台特有、Darwin Core 里没有对应术语的字段统一加 `gl:` 前缀，
 * 不硬塞进标准术语里冒充标准字段。这是 DwC 扩展的通行做法。
 *
 * ## 已知局限（导出前请读）
 *
 * 1. `acceptedNameUsage` 只在**学名与 iNaturalist 现行接受名不一致时**才有值
 *    （来自 photoTaxon）。两者一致时留空 —— 因为「一致」不等于「已核实为接受名」，
 *    平台没有独立做过分类学核定。
 * 2. 分类阶元取自数据源，未做交叉校核；`species-data.js` 的 phylum 字段是
 *    「门/纲」合写（如「脊索动物门/鱼纲」），这里按 `/` 拆成 phylum 与 class。
 * 3. 本库是**单一数据源**，未经野外核查，不得当作多样性调查结果使用。
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  /* 列顺序：先是 Darwin Core Taxon 标准术语，再是 gl: 扩展。
   * 顺序固定，方便下游脚本按列名读取。 */
  var COLUMNS = [
    // ---- Darwin Core Taxon ----
    'taxonID',
    'scientificName',
    'vernacularName',
    'taxonRank',
    'acceptedNameUsage',
    'kingdom',
    'phylum',
    'class',
    'order',
    'family',
    'genus',
    'nameAccordingTo',
    'references',
    'taxonRemarks',
    // ---- 权利与媒体 ----
    'rights',
    'bibliographicCitation',
    'associatedMedia',
    // ---- gl: 平台扩展 ----
    'gl:group',
    'gl:accession',
    'gl:distribution',
    'gl:tags',
    'gl:iucn',
    'gl:cnRedList',
    'gl:protection',
    'gl:obsCount',
    'gl:photoTaxon'
  ];

  function s(v) {
    if (v === null || v === undefined) { return ''; }
    if (Array.isArray(v)) { return v.join(' | '); }
    return String(v).trim();
  }

  /** 从学名推属名（第一个词）。学名缺失时返回空。 */
  function genusOf(latin) {
    var w = s(latin).split(/\s+/)[0] || '';
    return /^[A-Z][a-z]+$/.test(w) ? w : '';
  }

  /** 学名 → 分类阶元。属级条目写成「Cymbella spp.」，种级是「Carassius auratus」。 */
  function rankOf(latin) {
    var t = s(latin);
    if (!t) { return ''; }
    if (/\bspp?\.?$/.test(t)) { return 'genus'; }
    return t.split(/\s+/).length >= 2 ? 'species' : 'genus';
  }

  /** 「脊索动物门/鱼纲」→ { phylum:'脊索动物门', class:'鱼纲' }
   *  species-data.js 的这个字段是合写的，直接塞进 phylum 是错的。 */
  function splitPhylumClass(v) {
    var parts = s(v).split('/').map(function (x) { return x.trim(); }).filter(Boolean);
    return { phylum: parts[0] || '', cls: parts[1] || '' };
  }

  /** biodiversity-data.js：lineageSci = "Animalia > Arthropoda > Insecta > Coleoptera > Scarabaeidae" */
  function splitLineageSci(v) {
    var parts = s(v).split('>').map(function (x) { return x.trim(); }).filter(Boolean);
    return {
      kingdom: parts[0] || '', phylum: parts[1] || '', cls: parts[2] || '',
      order: parts[3] || '', family: parts[4] || ''
    };
  }

  /** species-data.js → 一行 DwC */
  function adaptSpecies(rec) {
    var pc = splitPhylumClass(rec.phylum);
    var remarks = [];
    if (s(rec.protection)) { remarks.push('保护级别：' + s(rec.protection)); }
    if (s(rec.endemic)) { remarks.push('特有性：' + s(rec.endemic)); }
    if (s(rec.habitat)) { remarks.push('生境：' + s(rec.habitat)); }
    if (s(rec.redListCriteria)) { remarks.push('红色名录标准：' + s(rec.redListCriteria)); }
    var accepted = s(rec.photoTaxon);
    return {
      taxonID: '',
      scientificName: s(rec.latin),
      vernacularName: s(rec.cn),
      taxonRank: rankOf(rec.latin),
      // 只有与现行接受名不一致时才有依据；一致时留空，不冒充「已核定」
      acceptedNameUsage: accepted && accepted !== s(rec.latin) ? accepted : '',
      kingdom: '',
      phylum: pc.phylum,
      'class': pc.cls,
      order: '',
      family: s(rec.family),
      genus: genusOf(rec.latin),
      nameAccordingTo: s(rec.source),
      references: s(rec.sourceUrl),
      taxonRemarks: remarks.join('；'),
      rights: s(rec.photoLicense),
      bibliographicCitation: s(rec.photoCredit),
      associatedMedia: s(rec.photo),
      'gl:group': s(rec.group),
      'gl:accession': s(rec.acc),
      'gl:distribution': s(rec.distribution),
      'gl:tags': s(rec.tags),
      'gl:iucn': s(rec.iucn),
      'gl:cnRedList': s(rec.cnRedList),
      'gl:protection': s(rec.protection),
      'gl:obsCount': '',
      'gl:photoTaxon': accepted
    };
  }

  /** biodiversity-data.js → 一行 DwC */
  function adaptBiodiversity(rec) {
    var lin = splitLineageSci(rec.lineageSci);
    var remarks = [];
    if (s(rec.iucn)) { remarks.push('IUCN：' + s(rec.iucn)); }
    var obs = '';
    if (rec.obsCn !== undefined && rec.obsCn !== null) { obs = s(rec.obsCn); }
    else if (rec.obsGlobal !== undefined && rec.obsGlobal !== null) { obs = s(rec.obsGlobal); }
    return {
      taxonID: s(rec.taxonId),
      scientificName: s(rec.latin),
      vernacularName: s(rec.cn),
      taxonRank: 'species',
      acceptedNameUsage: '',
      kingdom: lin.kingdom,
      phylum: lin.phylum,
      'class': lin.cls,
      order: lin.order,
      family: lin.family || s(rec.familyCn),
      genus: genusOf(rec.latin),
      nameAccordingTo: s(rec.source),
      references: s(rec.sourceUrl),
      taxonRemarks: remarks.join('；'),
      rights: s(rec.photoLicense),
      bibliographicCitation: s(rec.photoCredit),
      associatedMedia: s(rec.photo),
      'gl:group': s(rec.group),
      'gl:accession': '',
      'gl:distribution': '',
      'gl:tags': '',
      'gl:iucn': s(rec.iucn),
      'gl:cnRedList': '',
      'gl:protection': '',
      'gl:obsCount': obs,
      'gl:photoTaxon': ''
    };
  }

  /** RFC 4180：含 , " 换行 的字段加引号，内部 " 变 "" */
  function cell(v) {
    var t = s(v);
    if (/[",\r\n]/.test(t)) { return '"' + t.replace(/"/g, '""') + '"'; }
    return t;
  }

  function buildCSV(records, kind) {
    var adapt = kind === 'biodiversity' ? adaptBiodiversity : adaptSpecies;
    var lines = [COLUMNS.map(cell).join(',')];
    (records || []).forEach(function (r) {
      var o = adapt(r);
      lines.push(COLUMNS.map(function (c) { return cell(o[c]); }).join(','));
    });
    return lines.join('\r\n') + '\r\n';
  }

  /** 加 UTF-8 BOM —— 不加的话 Excel（中文环境）会用 GBK 解，中文全是乱码。 */
  function downloadCSV(csv, filename) {
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function today() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /** 绑定按钮：点击即导出。getRecords 延迟求值，取的是**当前筛选后**的记录。 */
  function bindExport(btnId, getRecords, kind) {
    var btn = document.getElementById(btnId);
    if (!btn) { return false; }
    btn.addEventListener('click', function () {
      var rows = getRecords() || [];
      if (!rows.length) { return; }
      var name = 'greylight-' + (kind === 'biodiversity' ? 'biodiversity' : 'species')
               + '-dwctaxon-' + today() + '.csv';
      downloadCSV(buildCSV(rows, kind), name);
    });
    return true;
  }

  global.GL_DWC = {
    VERSION: VERSION,
    COLUMNS: COLUMNS,
    buildCSV: buildCSV,
    downloadCSV: downloadCSV,
    bindExport: bindExport,
    adaptSpecies: adaptSpecies,
    adaptBiodiversity: adaptBiodiversity
  };
})(window);
