/* ============================================================
 * 灰灯实验室 AI 鉴定台 — 共享交互层 shared-app.js v1.2
 * ------------------------------------------------------------
 * 功能：
 *   1. 模态框系统（GL.modal）＋ 各页面演示表单模板
 *   2. 轻提示 Toast（GL.toast）
 *   3. 通知铃铛下拉面板
 *   4. 通用筛选引擎：筛选片 chip + 搜索框 + 结果计数 + 空态
 *      - 约定：chip 带 data-chip-group / data-chip-value
 *             条目带 data-f-group + data-f-values（空格分隔）
 *             搜索框带 data-search="组名"，条目带 data-search-text
 *             计数元素带 data-result-count="组名"
 *   5. 表格行操作：data-action="view|review|download|goto"
 *   6. 演示表单：拦截 submit → 成功提示
 *   7. 页脚联系方式卡（微信公众号二维码 + 邮箱）
 *      - 数据源：文件顶部 GL_CONTACT，改一处全站 8 个页面同步
 *      - 页面无需改 HTML，脚本自动挂到每个 <footer> 后面
 * ------------------------------------------------------------
 * 依赖：无（原生 JS）。lucide 存在时自动刷新图标。
 * ============================================================ */
(function () {
  'use strict';

  var GL = window.GL = window.GL || {};

  /* ============================================================
   * 联系方式（全站唯一数据源）
   * ------------------------------------------------------------
   * 只改这里 → 8 个页面底部的联系卡同步生效，不要在页面里硬编码。
   *
   * qrcode.src  ：二维码图片路径，相对 shared-app.js 所在目录写。
   *               留空 '' 或 null → 整个二维码区域不渲染。
   * qrcode.caption：二维码下方小字（如「微信公众号」）。
   * items       ：value 为空的条目自动隐藏，不会渲染空占位。
   *               href 写 'tel:' / 'mailto:' 会自动拼上 value；
   *               写 http(s) 地址会自动带 target="_blank"。
   * ============================================================ */
  var GL_CONTACT = window.GL_CONTACT = {
    title: '联系方式',
    icon: 'contact',
    qrcode: {
      src: 'assets/wechat-qrcode.png',
      caption: '微信公众号',
      alt: '微信公众号二维码'
    },
    items: [
      { icon: 'mail', label: '邮箱', value: 'jinghao.song@gmail.com', href: 'mailto:' }
    ],
    note: '离线演示版（Demo）· 页面数据仅用于功能演示，非真实监测结果'
  };

  /* shared-app.js 自身所在目录：联系方式里的相对路径据此解析，
     这样页面放在 pages/ 子目录下也能正确取到 assets/。 */
  var ASSET_BASE = (function () {
    var s = document.currentScript;
    if (!s || !s.src) {
      var all = document.getElementsByTagName('script');
      s = all[all.length - 1];
    }
    var src = (s && s.src) ? String(s.src) : '';
    return src ? src.replace(/[?#].*$/, '').replace(/[^\/]*$/, '') : '';
  })();

  /* ---------------- 基础 DOM 工具 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'style') node.style.cssText = attrs[k];
        else if (k.indexOf('data-') === 0) node.setAttribute(k, attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (html != null) node.innerHTML = html;
    return node;
  }
  function refreshIcons() {
    if (window.lucide && typeof lucide.createIcons === 'function') {
      try { lucide.createIcons(); } catch (e) { /* ignore */ }
    }
  }

  /* ---------------- 共享样式（仅注入一次） ---------------- */
  var SHARED_CSS = [
    '.gl-modal-overlay{position:fixed;inset:0;z-index:200;background:rgba(15,23,42,.45);display:flex;align-items:flex-start;justify-content:center;padding:8vh 16px 32px;overflow-y:auto;}',
    '.gl-modal{background:var(--brand-card);border:1px solid var(--brand-border);border-radius:var(--r-lg,8px);box-shadow:var(--shadow-3,0 24px 60px -20px rgba(15,23,42,.2));width:100%;max-width:560px;animation:gl-pop .18s ease-out;}',
    '@keyframes gl-pop{from{opacity:0;transform:translateY(10px) scale(.985);}to{opacity:1;transform:none;}}',
    '.gl-modal-head{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--brand-border);}',
    '.gl-modal-head [data-lucide]{width:18px;height:18px;color:var(--brand-primary);}',
    '.gl-modal-title{font-size:15px;font-weight:600;color:var(--brand-foreground);flex:1;}',
    '.gl-modal-close{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:none;background:none;border-radius:var(--r-sm,4px);color:var(--ink-3,#8b95a4);cursor:pointer;}',
    '.gl-modal-close:hover{background:var(--brand-surface-2);color:var(--brand-foreground);}',
    '.gl-modal-close [data-lucide]{width:15px;height:15px;color:inherit;}',
    '.gl-modal-body{padding:16px 18px;max-height:60vh;overflow-y:auto;}',
    '.gl-modal-foot{display:flex;justify-content:flex-end;gap:10px;padding:12px 18px;border-top:1px solid var(--brand-border);}',
    '.gl-field{margin-bottom:12px;}',
    '.gl-field:last-child{margin-bottom:0;}',
    '.gl-field-label{display:block;font-size:12px;font-weight:500;color:var(--ink-2,#5a6678);margin-bottom:5px;}',
    '.gl-input,.gl-select,.gl-textarea{width:100%;box-sizing:border-box;padding:7px 10px;border:1px solid var(--brand-input,#d4d9e0);border-radius:var(--r-md,4px);font-size:13px;font-family:var(--font-sans);color:var(--brand-foreground);background:var(--brand-surface,#fff);outline:none;}',
    '.gl-input:focus,.gl-select:focus,.gl-textarea:focus{border-color:var(--brand-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--brand-primary) 18%,transparent);}',
    '.gl-textarea{min-height:64px;resize:vertical;}',
    '.gl-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:var(--r-md,4px);font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--brand-border);background:var(--brand-surface,#fff);color:var(--brand-foreground);white-space:nowrap;}',
    '.gl-btn:hover{background:var(--brand-surface-2);}',
    '.gl-btn-primary{background:var(--brand-primary);color:var(--brand-primary-foreground,#fff);border-color:transparent;}',
    '.gl-btn-primary:hover{background:color-mix(in srgb,var(--brand-primary) 88%,#000);}',
    '.gl-btn [data-lucide]{width:14px;height:14px;}',
    '.gl-toast-wrap{position:fixed;top:68px;right:20px;z-index:300;display:flex;flex-direction:column;gap:8px;max-width:340px;}',
    '.gl-toast{display:flex;align-items:flex-start;gap:8px;padding:10px 14px;border-radius:var(--r-md,4px);background:var(--brand-surface,#fff);border:1px solid var(--brand-border);box-shadow:var(--shadow-2,0 8px 24px -8px rgba(15,23,42,.12));font-size:13px;color:var(--brand-foreground);animation:gl-in .18s ease-out;}',
    '.gl-toast [data-lucide]{width:15px;height:15px;flex-shrink:0;margin-top:1px;}',
    '.gl-toast.success [data-lucide]{color:var(--state-success);}',
    '.gl-toast.info [data-lucide]{color:var(--state-info);}',
    '.gl-toast.warn [data-lucide]{color:var(--state-warning);}',
    '.gl-toast.error [data-lucide]{color:var(--state-error);}',
    '@keyframes gl-in{from{opacity:0;transform:translateX(14px);}to{opacity:1;transform:none;}}',
    '.gl-dropdown{position:absolute;top:calc(100% + 8px);right:0;z-index:150;width:300px;background:var(--brand-popover,#fff);border:1px solid var(--brand-border);border-radius:var(--r-md,4px);box-shadow:var(--shadow-2,0 8px 24px -8px rgba(15,23,42,.12));overflow:hidden;display:none;}',
    '.gl-dropdown.open{display:block;}',
    '.gl-dropdown-head{padding:10px 14px;border-bottom:1px solid var(--brand-border);font-size:12px;font-weight:600;color:var(--brand-foreground);display:flex;align-items:center;justify-content:space-between;}',
    '.gl-dropdown-item{display:flex;gap:10px;padding:10px 14px;border-bottom:1px solid var(--brand-border);cursor:pointer;align-items:flex-start;}',
    '.gl-dropdown-item:last-child{border-bottom:none;}',
    '.gl-dropdown-item:hover{background:var(--brand-surface-2);}',
    '.gl-dropdown-item [data-lucide]{width:14px;height:14px;color:var(--brand-primary);flex-shrink:0;margin-top:2px;}',
    '.gl-dropdown-item-text{flex:1;min-width:0;}',
    '.gl-dropdown-item-title{font-size:12px;color:var(--brand-foreground);line-height:1.4;}',
    '.gl-dropdown-item-time{font-size:11px;color:var(--ink-3,#8b95a4);margin-top:2px;font-family:var(--font-mono);font-variant-numeric:tabular-nums;}',
    '.gl-empty{padding:28px 16px;text-align:center;color:var(--ink-3,#8b95a4);font-size:13px;}',
    '.chip{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--brand-border);color:var(--ink-2,#5a6678);background:var(--brand-surface,#fff);white-space:nowrap;}',
    '.chip.active{background:color-mix(in srgb,var(--brand-primary) 10%,transparent);color:var(--brand-primary);border-color:var(--brand-primary);}',
    '.chip:hover{background:var(--brand-surface-2);}',
    '.chip.active:hover{background:color-mix(in srgb,var(--brand-primary) 15%,transparent);}',
    '.gl-kv{width:100%;border-collapse:collapse;font-size:13px;}',
    '.gl-kv td{padding:6px 8px;border-bottom:1px solid var(--brand-border);vertical-align:top;}',
    '.gl-kv td:first-child{width:120px;color:var(--ink-2,#5a6678);font-size:12px;}',
    '.gl-kv tr:last-child td{border-bottom:none;}',
    '.gl-kv .mono{font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:12px;}',
    '.gl-searchbar{display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--brand-card);border:1px solid var(--brand-border);border-radius:var(--r-md,4px);box-shadow:var(--shadow-1);flex-wrap:wrap;}',
    '.gl-searchbar [data-lucide]{width:16px;height:16px;color:var(--ink-3);flex-shrink:0;}',
    '.gl-search-input{flex:1;min-width:160px;border:none;outline:none;font-size:13px;font-family:var(--font-sans);color:var(--brand-foreground);background:transparent;}',
    '.gl-search-input::placeholder{color:var(--ink-3);}',
    '.gl-chiprow{display:flex;gap:8px;flex-wrap:wrap;}',
    '.gl-search-count{font-size:12px;color:var(--ink-3);font-family:var(--font-mono);white-space:nowrap;flex-shrink:0;}',
    /* === 页脚联系方式卡 === */
    '.gl-contact{margin-top:var(--s-4,24px);padding-top:var(--s-4,24px);border-top:1px dashed var(--brand-border);text-align:center;}',
    '.gl-contact-inner{margin:0 auto;}',
    '.gl-contact-title{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:600;letter-spacing:.06em;color:var(--brand-foreground);margin-bottom:12px;}',
    '.gl-contact-title [data-lucide]{width:14px;height:14px;color:var(--brand-primary);}',
    '.gl-contact-card{display:inline-flex;align-items:center;gap:20px;padding:14px 22px;border:1px solid var(--brand-border);border-radius:var(--r-lg,8px);background:var(--brand-surface,#fff);text-align:left;box-shadow:var(--shadow-1,0 1px 3px rgba(15,23,42,.06));}',
    '.gl-contact-qr{display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;}',
    '.gl-contact-qr img{width:92px;height:92px;object-fit:contain;display:block;border:1px solid var(--brand-border);border-radius:var(--r-md,4px);background:#fff;padding:4px;box-sizing:content-box;cursor:zoom-in;transition:border-color .15s;}',
    '.gl-contact-qr img:hover{border-color:var(--brand-primary);}',
    '.gl-contact-qr-cap{font-size:11px;color:var(--ink-3,#8b95a4);white-space:nowrap;}',
    '.gl-contact-fields{display:flex;flex-direction:column;gap:8px;min-width:0;}',
    '.gl-contact-item{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border:1px solid var(--brand-border);border-radius:var(--r-pill,999px);background:var(--brand-surface,#fff);font-size:12px;line-height:1.5;color:var(--ink-2,#5a6678);text-decoration:none;transition:border-color .15s,color .15s,box-shadow .15s;}',
    'a.gl-contact-item:hover{border-color:var(--brand-primary);color:var(--brand-foreground);box-shadow:var(--shadow-1,0 1px 3px rgba(15,23,42,.08));}',
    '.gl-contact-item [data-lucide]{width:13px;height:13px;flex-shrink:0;color:var(--brand-primary);}',
    '.gl-contact-label{color:var(--ink-3,#8b95a4);}',
    '.gl-contact-value{font-weight:500;color:var(--brand-foreground);font-variant-numeric:tabular-nums;word-break:break-all;}',
    '.gl-contact-note{margin-top:10px;font-size:11px;color:var(--ink-3,#8b95a4);}',
    '.gl-qr-modal{text-align:center;}',
    '.gl-qr-modal img{max-width:min(320px,68vw);width:100%;height:auto;display:block;margin:0 auto;border:1px solid var(--brand-border);border-radius:var(--r-md,4px);background:#fff;padding:8px;box-sizing:border-box;}',
    '@media (max-width:640px){.gl-contact-card{flex-direction:column;gap:14px;padding:14px 16px;}.gl-contact-qr img{width:118px;height:118px;}.gl-contact-item{padding:4px 10px;font-size:11px;}}'
  ].join('\n');
  var cssInjected = false;
  function injectSharedCss() {
    if (cssInjected) return;
    cssInjected = true;
    var s = el('style', { id: 'gl-shared-styles' }, SHARED_CSS);
    document.head.appendChild(s);
  }

  /* ---------------- Toast ---------------- */
  function toast(msg, type) {
    var wrap = $('.gl-toast-wrap');
    if (!wrap) { wrap = el('div', { class: 'gl-toast-wrap' }); document.body.appendChild(wrap); }
    var icon = type === 'success' ? 'check-circle'
      : type === 'warn' ? 'alert-triangle'
      : type === 'error' ? 'x-circle' : 'info';
    var item = el('div', { class: 'gl-toast ' + (type || 'info') },
      '<i data-lucide="' + icon + '"></i><span>' + msg + '</span>');
    wrap.appendChild(item);
    refreshIcons();
    setTimeout(function () {
      item.style.opacity = '0';
      item.style.transition = 'opacity .25s';
      setTimeout(function () { if (item.parentNode) item.parentNode.removeChild(item); }, 260);
    }, 2600);
  }
  GL.toast = toast;

  /* ---------------- Modal ---------------- */
  function modal(opts) {
    injectSharedCss();
    var overlay = el('div', { class: 'gl-modal-overlay' });
    var box = el('div', { class: 'gl-modal' });
    var iconHtml = opts.icon ? '<i data-lucide="' + opts.icon + '"></i>' : '';
    box.innerHTML =
      '<div class="gl-modal-head">' + iconHtml +
      '<div class="gl-modal-title">' + (opts.title || '') + '</div>' +
      '<button type="button" class="gl-modal-close" data-gl-close><i data-lucide="x"></i></button></div>' +
      '<div class="gl-modal-body">' + (opts.body || '') + '</div>' +
      (opts.foot ? '<div class="gl-modal-foot">' + opts.foot + '</div>' : '');
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    refreshIcons();
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    $('[data-gl-close]', box).addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    return { close: close, overlay: overlay, box: box };
  }
  GL.modal = modal;

  /* ---------------- 演示表单字段模板 ---------------- */
  function field(label, inner) {
    return '<div class="gl-field"><label class="gl-field-label">' + label + '</label>' + inner + '</div>';
  }
  function select(name, options) {
    var html = '<select class="gl-select" name="' + name + '">';
    options.forEach(function (o) {
      html += '<option value="' + o + '">' + o + '</option>';
    });
    return html + '</select>';
  }
  function primaryBtn(label, icon) {
    return '<button type="submit" class="gl-btn gl-btn-primary"><i data-lucide="' + (icon || 'check') + '"></i>' + label + '</button>';
  }
  function cancelBtn() {
    return '<button type="button" class="gl-btn" data-gl-close>取消</button>';
  }

  /* ---------------- 演示模态框注册表 ---------------- */
  var MODALS = {
    newTask: {
      title: '新建鉴定任务',
      icon: 'cpu',
      body: field('样品编号', '<input class="gl-input" value="GL-2026-0956" readonly style="background:var(--brand-surface-2);">') +
        field('样品类型', select('type', ['底栖无脊椎', '硅藻', '浮游植物', '鱼类 eDNA', '着生藻类'])) +
        field('采集站点', select('site', ['信阳浉河', '南湾水库', '淮河干流', '狮河区段', '浉河支流', '丹江口水库', '小浪底水库', '黄河郑州段', '海河河南段'])) +
        field('鉴定模式', select('mode', ['AI 自动鉴定', 'AI 辅助 + 人工确认', '人工鉴定'])) +
        field('备注', '<textarea class="gl-textarea" placeholder="选填：样品描述、采集信息等"></textarea>'),
      foot: cancelBtn() + primaryBtn('提交任务', 'play')
    },
    newSample: {
      title: '新建样品',
      icon: 'test-tube',
      body: field('样品编号', '<input class="gl-input" value="GL-2026-0956" readonly style="background:var(--brand-surface-2);">') +
        field('样品类型', select('type', ['底栖无脊椎', '硅藻', '浮游植物', '鱼类 eDNA', '着生藻类'])) +
        field('采集站点', select('site', ['信阳浉河', '南湾水库', '淮河干流', '狮河区段', '浉河支流', '丹江口水库', '小浪底水库', '黄河郑州段', '海河河南段'])) +
        field('采集日期', '<input class="gl-input" type="date" value="2026-09-17">') +
        field('采集人', '<input class="gl-input" value="张研究员">') +
        field('固定方式', select('fix', ['4% 甲醛', '95% 乙醇', '鲁哥氏液', '液氮冻存（eDNA）', '不固定（活体）'])) +
        field('备注', '<textarea class="gl-textarea" placeholder="选填"></textarea>'),
      foot: cancelBtn() + primaryBtn('登记样品', 'plus')
    },
    newReport: {
      title: '生成报告',
      icon: 'file-plus',
      body: field('报告模板', select('tmpl', ['水质监测月报（HJ 1295）', '水生态调查报告', 'eDNA 专项报告'])) +
        field('监测断面', select('site', ['信阳浉河', '南湾水库', '淮河干流', '狮河区段', '浉河支流', '丹江口水库', '小浪底水库', '黄河郑州段', '海河河南段'])) +
        field('报告周期', select('period', ['2026年9月', '2026年3季度', '2026年度'])) +
        field('编制人', '<input class="gl-input" value="张研究员">') +
        field('备注', '<textarea class="gl-textarea" placeholder="选填：报告重点、范围说明等"></textarea>'),
      foot: cancelBtn() + primaryBtn('开始生成', 'wand-2')
    },
    finetune: {
      title: '微调模型',
      icon: 'sliders-horizontal',
      body: field('目标模型', select('model', ['底栖无脊椎识别模型 v2.3.1', '硅藻自动分类模型 v3.1.0', '鱼类 eDNA 物种注释模型 v1.2.0'])) +
        field('训练数据集', select('data', ['最近 90 天标注数据（+1,204 张）', '全量训练样本（48,200 张）', '自定义数据集'])) +
        field('学习率', '<input class="gl-input" type="number" step="0.0001" value="0.0001">') +
        field('训练轮数（Epochs）', '<input class="gl-input" type="number" value="50">') +
        field('备注', '<textarea class="gl-textarea" placeholder="选填：调参说明、预期目标等"></textarea>'),
      foot: cancelBtn() + primaryBtn('提交训练', 'play')
    },
    importSeq: {
      title: '导入参考序列',
      icon: 'upload',
      body: field('标记基因', select('gene', ['12S rRNA', '16S rRNA', 'COI', '18S rRNA', 'ITS'])) +
        field('序列文件', '<input class="gl-input" type="text" value="sequences/gl-ref-2026-09.fasta" placeholder="选择 FASTA/FASTQ 文件">') +
        field('导入方式', select('mode', ['追加（去重合并）', '覆盖指定门类', '仅校验不导入'])) +
        field('备注', '<textarea class="gl-textarea" placeholder="选填：数据来源、版本说明等"></textarea>'),
      foot: cancelBtn() + primaryBtn('开始导入', 'upload')
    },
    exportReport: {
      title: '导出报告',
      icon: 'download',
      body: field('报告', '<input class="gl-input" value="GL-RPT-2026-0928 信阳浉河水质月报" readonly style="background:var(--brand-surface-2);">') +
        field('导出格式', select('fmt', ['PDF 正式版（带 CMA 签章）', 'Word 可编辑版', 'Excel 数据汇总表', '电子归档包（含原始记录）'])) +
        field('水印', select('wm', ['无水印', '内部资料水印', '受控文件水印'])),
      foot: cancelBtn() + primaryBtn('开始导出', 'download')
    }
  };

  /* ---------------- 打开命名模态框 ---------------- */
  GL.openModal = function (name) {
    var cfg = MODALS[name];
    if (!cfg) { toast('未定义的模态框: ' + name, 'warn'); return; }
    var m = modal({
      title: cfg.title,
      icon: cfg.icon,
      body: cfg.body,
      foot: cfg.foot
    });
    var form = el('form');
    form.innerHTML = m.box.querySelector('.gl-modal-body').innerHTML;
    m.box.querySelector('.gl-modal-body').innerHTML = '';
    m.box.querySelector('.gl-modal-body').appendChild(form);
    refreshIcons();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      toast(cfg.title + '已提交（演示数据，未真正写入）', 'success');
      m.close();
    });
  };

  /* ---------------- 通用详情模态框 ---------------- */
  GL.rowDetail = function (tr) {
    if (!tr) return;
    var title = tr.getAttribute('data-d-title') || '详情';
    var rows = [];
    var keys = ['data-d1', 'data-d2', 'data-d3', 'data-d4', 'data-d5', 'data-d6', 'data-d7', 'data-d8'];
    var labels = (tr.getAttribute('data-d-labels') || '').split('|');
    keys.forEach(function (k, i) {
      var v = tr.getAttribute(k);
      if (v) rows.push('<tr><td>' + (labels[i] || ('字段' + (i + 1))) + '</td><td class="' + (k === 'data-d1' ? 'mono' : '') + '">' + v + '</td></tr>');
    });
    if (!rows.length) {
      // 回退：按表头自动取值
      var table = tr.closest('table');
      var ths = table ? Array.prototype.slice.call(table.querySelectorAll('thead th')) : [];
      var tds = tr.querySelectorAll('td');
      for (var i = 0; i < tds.length && i < ths.length; i++) {
        var label = ths[i].textContent.trim();
        if (!label || label === '操作' || label === '审核进度') continue;
        rows.push('<tr><td>' + label + '</td><td class="mono">' + tds[i].textContent.trim() + '</td></tr>');
      }
    }
    if (!rows.length) { toast('演示版暂无详情数据', 'info'); return; }
    modal({
      title: title,
      icon: 'file-text',
      body: '<table class="gl-kv">' + rows.join('') + '</table>',
      foot: cancelBtn()
    });
  };

  /* 物种卡片详情（参考库专用）：照片大图 + 完整信息卡 */
  GL.cardDetail = function (card) {
    if (!card) { toast('演示版暂无详情数据', 'info'); return; }
    var name = $('.species-card-name', card);
    var latin = $('.species-card-latin', card);
    var rows = '';
    $$('.species-info-row', card).forEach(function (r) {
      var label = $('.species-info-label', r);
      var value = $('.species-info-value', r);
      if (label && value) rows += '<tr><td>' + label.textContent.trim() + '</td><td>' + value.textContent.trim() + '</td></tr>';
    });
    var tags = $$('.species-tag', card).map(function (t) { return t.textContent.trim(); });
    var img = $('.species-card-photo', card);
    var photoHtml = '';
    if (img && img.getAttribute('src')) {
      photoHtml = '<div style="width:100%;border-radius:8px;overflow:hidden;border:1px solid var(--brand-border);margin-bottom:12px;background:var(--brand-surface-2);"><img src="' + img.getAttribute('src') + '" alt="' + (name ? name.textContent.trim() : '') + '" style="display:block;width:100%;max-height:320px;object-fit:contain;background:var(--brand-surface-2);"></div>';
    } else {
      photoHtml = '<div style="width:100%;height:120px;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px dashed var(--brand-border);margin-bottom:12px;color:var(--ink-3);font-size:12px;background:var(--brand-surface-2);">暂无照片（形态鉴定）</div>';
    }
    modal({
      title: (name ? name.textContent.trim() : '物种详情') + (latin ? ' <span style="font-style:italic;font-weight:400;color:var(--ink-2);">' + latin.textContent.trim() + '</span>' : ''),
      icon: 'library',
      body: photoHtml + '<table class="gl-kv">' + rows + '</table>' +
        (tags.length ? '<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">' +
          tags.map(function (t) { return '<span class="species-tag">' + t + '</span>'; }).join('') + '</div>' : ''),
      foot: cancelBtn()
    });
  };

  /* ---------------- 筛选引擎 ---------------- */
  var filterGroups = {};
  GL.refreshFilter = function (group) {
    if (group) {
      if (filterGroups[group]) filterGroups[group].apply();
    } else {
      Object.keys(filterGroups).forEach(function (k) { filterGroups[k].apply(); });
    }
  };

  function setupFilterGroup(group) {
    var chips = $$('[data-chip-group="' + group + '"]');
    var items = $$('[data-f-group="' + group + '"]');
    var search = $('[data-search="' + group + '"]');
    var counter = $('[data-result-count="' + group + '"]');
    var emptyBox = $('[data-empty="' + group + '"]');
    var state = { chip: '*', query: '' };

    function apply() {
      var visible = 0;
      items.forEach(function (item) {
        var hasExplicit = item.hasAttribute('data-f-values');
        var values = (item.getAttribute('data-f-values') || '').split(/\s+/).filter(Boolean);
        var matchChip = state.chip === '*' || (hasExplicit ? values.indexOf(state.chip) !== -1 : item.textContent.indexOf(state.chip) !== -1);
        var text = (item.getAttribute('data-search-text') || item.textContent || '').toLowerCase();
        var matchQuery = !state.query || text.indexOf(state.query) !== -1;
        var show = matchChip && matchQuery;
        item.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (counter) {
        counter.textContent = '显示 ' + visible + ' / ' + items.length + ' 条';
      }
      if (emptyBox) emptyBox.style.display = visible ? 'none' : '';
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        state.chip = chip.getAttribute('data-chip-value') || '*';
        apply();
      });
    });
    if (search) {
      search.addEventListener('input', function () {
        state.query = search.value.trim().toLowerCase();
        apply();
      });
    }
    filterGroups[group] = { state: state, apply: apply };
    apply();
  }

  /* ---------------- 通知铃铛 ---------------- */
  var NOTIFICATIONS = [
    { title: '模型微调完成 — 底栖识别模型 v2.3.1 已上线', time: '10:24', icon: 'cpu' },
    { title: 'GL-2026-0945 等待专家复核', time: '09:47', icon: 'check-circle' },
    { title: '丹江口水库 9 月批次样品已接收（48 份）', time: '09:12', icon: 'package' },
    { title: '海河河南段 BI=8.3 触发生态预警', time: '昨天', icon: 'alert-triangle' },
    { title: '参考库新增 47 条硅藻 16S 序列', time: '昨天', icon: 'database' }
  ];
  function setupNotifications(btn) {
    var wrap = el('div', { class: 'gl-dropdown' });
    wrap.innerHTML = '<div class="gl-dropdown-head"><span>通知中心</span><a href="#" data-gl-markread style="font-size:11px;color:var(--brand-primary);text-decoration:none;">全部已读</a></div>' +
      NOTIFICATIONS.map(function (n) {
        return '<div class="gl-dropdown-item"><i data-lucide="' + n.icon + '"></i>' +
          '<div class="gl-dropdown-item-text"><div class="gl-dropdown-item-title">' + n.title + '</div>' +
          '<div class="gl-dropdown-item-time">' + n.time + '</div></div></div>';
      }).join('');
    btn.parentNode.appendChild(wrap);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      $$('.gl-dropdown').forEach(function (d) { if (d !== wrap) d.classList.remove('open'); });
      wrap.classList.toggle('open');
    });
    wrap.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.getAttribute('data-gl-markread')) {
        e.preventDefault();
        var badge = $('.notification-badge', btn.parentNode);
        if (badge) badge.style.display = 'none';
        wrap.classList.remove('open');
        toast('通知已全部标记为已读', 'success');
      }
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target) && e.target !== btn) wrap.classList.remove('open');
    });
  }

  /* ---------------- 页脚联系方式条 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function contactHref(item) {
    var h = item.href || '';
    if (!h) return '';
    if (h === 'tel:' || h === 'mailto:') return h + String(item.value).replace(/\s+/g, '');
    return h;
  }
  function setupContactBar() {
    var cfg = GL_CONTACT;
    if (!cfg) return;

    var items = (cfg.items || []).filter(function (it) { return it && it.value; });
    var qr = (cfg.qrcode && cfg.qrcode.src) ? cfg.qrcode : null;
    if (!items.length && !qr) return;   // 二维码和条目都没配 → 整块不渲染

    var footers = $$('footer');
    if (!footers.length) return;

    var box = el('div', { class: 'gl-contact', role: 'contentinfo' });
    var inner = el('div', { class: 'gl-contact-inner' });
    inner.appendChild(el('div', { class: 'gl-contact-title' },
      '<i data-lucide="' + esc(cfg.icon || 'contact') + '"></i><span>' + esc(cfg.title || '联系方式') + '</span>'));

    var card = el('div', { class: 'gl-contact-card' });

    /* 二维码：点击放大；图片缺失时整块优雅隐藏，不留破图 */
    if (qr) {
      var src = /^(https?:|data:|file:|\/)/.test(qr.src) ? qr.src : ASSET_BASE + qr.src;
      var qrWrap = el('div', { class: 'gl-contact-qr' });
      var img = el('img', { src: src, alt: qr.alt || qr.caption || '二维码', title: '点击放大' });
      img.addEventListener('click', function () {
        GL.modal({
          title: qr.caption || '二维码',
          icon: 'qr-code',
          body: '<div class="gl-qr-modal"><img src="' + esc(src) + '" alt="' + esc(qr.alt || '') + '"></div>'
        });
      });
      img.addEventListener('error', function () {
        if (qrWrap.parentNode) qrWrap.parentNode.removeChild(qrWrap);
      });
      qrWrap.appendChild(img);
      if (qr.caption) qrWrap.appendChild(el('div', { class: 'gl-contact-qr-cap' }, esc(qr.caption)));
      card.appendChild(qrWrap);
    }

    if (items.length) {
      var fields = el('div', { class: 'gl-contact-fields' });
      items.forEach(function (it) {
        var href = contactHref(it);
        var node = el(href ? 'a' : 'span', { class: 'gl-contact-item' });
        node.setAttribute('title', it.label + '：' + it.value);
        if (href) {
          node.setAttribute('href', href);
          if (href.indexOf('http') === 0) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
        }
        node.innerHTML = '<i data-lucide="' + esc(it.icon) + '"></i>' +
          '<span class="gl-contact-label">' + esc(it.label) + '</span>' +
          '<span class="gl-contact-value">' + esc(it.value) + '</span>';
        fields.appendChild(node);
      });
      card.appendChild(fields);
    }

    inner.appendChild(card);
    if (cfg.note) inner.appendChild(el('div', { class: 'gl-contact-note' }, esc(cfg.note)));
    box.appendChild(inner);

    footers.forEach(function (f) {
      var host = f.parentNode;
      if (!host || host.querySelector(':scope > .gl-contact')) return;
      host.insertBefore(box.cloneNode(true), f.nextSibling);
    });
    refreshIcons();
  }

  /* ---------------- 全局初始化 ---------------- */
  function init() {
    injectSharedCss();

    // 1) [data-modal] 按钮
    $$('[data-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        GL.openModal(btn.getAttribute('data-modal'));
      });
    });

    // 2) [data-action] 行操作
    $$('[data-action]').forEach(function (node) {
      node.addEventListener('click', function () {
        var action = node.getAttribute('data-action');
        if (action === 'view') {
          var tr = node.closest('tr');
          if (tr) GL.rowDetail(tr);
          else {
            var card = node.closest('.species-card');
            if (card) GL.cardDetail(card);
            else toast('演示版暂无详情数据', 'info');
          }
        } else if (action === 'review') {
          var row = node.closest('tr');
          var revEvent = new CustomEvent('gl:review', { cancelable: true, detail: { row: row, node: node } });
          document.dispatchEvent(revEvent);
          if (!revEvent.defaultPrevented) window.location.href = 'expert-review.html';
        } else if (action === 'download' || action === 'export') {
          toast('已加入导出队列（演示）', 'success');
        } else if (action === 'goto') {
          var href = node.getAttribute('data-href') || 'index.html';
          window.location.href = href;
        } else if (action === 'edit') {
          toast('演示版：编辑功能为占位', 'info');
        } else {
          toast('演示版：该操作为占位功能', 'info');
        }
      });
    });

    // 3) 通用筛选组（页面里声明了 data-chip-group 才会生效）
    var groups = [];
    $$('[data-chip-group]').forEach(function (chip) {
      var g = chip.getAttribute('data-chip-group');
      if (groups.indexOf(g) === -1) groups.push(g);
    });
    groups.forEach(setupFilterGroup);

    // 4) 通知铃铛
    var bell = $('[data-notifications]');
    if (bell) setupNotifications(bell);

    // 4.5) 页脚联系方式卡（二维码 + 邮箱，数据源见文件顶部 GL_CONTACT）
    setupContactBar();

    // 5) 通用表单提交拦截
    document.addEventListener('submit', function (e) {
      var f = e.target;
      if (f && f.tagName === 'FORM' && !f.getAttribute('data-native')) {
        e.preventDefault();
        toast('已提交（演示数据，未真正写入）', 'success');
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
