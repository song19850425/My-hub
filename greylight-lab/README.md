# 灰灯实验室 AI 鉴定台

水生生物 AI 鉴定平台离线演示站 · 苹果官网简约风配色 · 无需联网即可运行全部功能。

**在线演示：<https://song19850425.github.io/My-hub/greylight-lab/>**

**演示页直达：**
[离线 Demo 入口](https://song19850425.github.io/My-hub/greylight-lab/) ·
[AI 鉴定主控台](https://song19850425.github.io/My-hub/greylight-lab/pages/dashboard.html) ·
[样品管理](https://song19850425.github.io/My-hub/greylight-lab/pages/sample-management.html) ·
[专家复核](https://song19850425.github.io/My-hub/greylight-lab/pages/expert-review.html) ·
[水生态监测流程](https://song19850425.github.io/My-hub/greylight-lab/pages/monitoring-workflow.html) ·
[物种参考库](https://song19850425.github.io/My-hub/greylight-lab/pages/species-library.html) ·
[生物多样性参考库](https://song19850425.github.io/My-hub/greylight-lab/pages/biodiversity-library.html) ·
[报告中心](https://song19850425.github.io/My-hub/greylight-lab/pages/report-center.html) ·
[模型管理](https://song19850425.github.io/My-hub/greylight-lab/pages/model-management.html)

> 仓库 `My-hub` 的 `gh-pages` 分支上同时跑着另一个站点（AI 智能碳汇管理平台，位于仓库根目录 `/My-hub/`）。
> 本站点在 `/My-hub/greylight-lab/` 子目录下，两者互不影响。

## 快速开始

**在线看** —— 直接打开 <https://song19850425.github.io/My-hub/greylight-lab/>，入口页会自动跳到首页导航。

**本地看** —— 双击打开 `pages/index.html`（或任意页面）即可浏览。
依赖（Tailwind、Lucide、Chart.js）均放在 `vendor/` 本地加载，带 CDN 回退兜底，**断网也能用**。

## 页面清单

线上地址 = `https://song19850425.github.io/My-hub/greylight-lab/` + 下表路径。

| 页面 | 文件 | 说明 |
| --- | --- | --- |
| 离线 Demo 入口 | [`pages/index.html`](https://song19850425.github.io/My-hub/greylight-lab/pages/index.html) | 首页导航与统计 |
| AI 鉴定主控台 | [`pages/dashboard.html`](https://song19850425.github.io/My-hub/greylight-lab/pages/dashboard.html) | 任务总览、KPI、置信度分布、标本图库、站点监控 |
| 样品管理 | [`pages/sample-management.html`](https://song19850425.github.io/My-hub/greylight-lab/pages/sample-management.html) | 样品台账、生命周期、类型分布（环形图） |
| **专家复核** | [`pages/expert-review.html`](https://song19850425.github.io/My-hub/greylight-lab/pages/expert-review.html) | **AI 结果人工复核与仲裁（本版新增）** |
| 水生态监测流程 | [`pages/monitoring-workflow.html`](https://song19850425.github.io/My-hub/greylight-lab/pages/monitoring-workflow.html) | SOP 规程、三阶段流程、eDNA 专项、报告出具流程 |
| 物种参考库（水生态） | [`pages/species-library.html`](https://song19850425.github.io/My-hub/greylight-lab/pages/species-library.html) | 247 种真实名录、分类树、序列统计（可筛选/搜索） |
| **生物多样性参考库** | [`pages/biodiversity-library.html`](https://song19850425.github.io/My-hub/greylight-lab/pages/biodiversity-library.html) | **297 种陆生类群：陆生植物 / 昆虫与陆生无脊椎 / 哺乳动物 / 真菌与地衣（本版新增）** |
| 报告中心 | [`pages/report-center.html`](https://song19850425.github.io/My-hub/greylight-lab/pages/report-center.html) | 模板、台账、三级审核、导出格式 |
| 模型管理 | [`pages/model-management.html`](https://song19850425.github.io/My-hub/greylight-lab/pages/model-management.html) | 三大模型卡片、性能趋势、版本历史 |

## 目录结构

```
greylight-lab/
├── pages/               # 全部页面（离线优先，样式内联）
│   ├── species-data.js / species-library.html            # 水生态物种库（247 种）
│   ├── biodiversity-data.js / biodiversity-library.html  # 生物多样性库（297 种）
│   ├── indices.js                                        # 生物指数计算引擎 + 阈值（v1.13）
│   ├── observation-demo-data.js                          # 演示观测数据集（合成，v1.13）
│   ├── dwc-export.js                                     # Darwin Core 名录导出（v1.13）
│   └── assets/
│       ├── species-photos/        # 水生态物种照片 243 张（47 MB）
│       └── biodiversity-photos/   # 生物多样性照片 297 张（约 11 MB，长边 900px）
├── scripts/             # **公开**的生成器与验证闸门（v1.13 新增）
│   ├── gen-observation-demo.py    # 生成演示观测数据集（固定种子可复现）
│   ├── verify-indices.mjs         # 指数引擎自检（公式 + 分级边界 + 手工算例）
│   ├── verify-thresholds.mjs      # 阈值一致性闸门（indices.js ↔ 4.2 表逐字比对）
│   └── verify-dwc.mjs             # Darwin Core 导出自检（列名 + RFC 4180 转义 + 适配）
├── assets/              # 标本图、站点图、微信公众号二维码（wechat-qrcode.png）等静态资源
├── favicon.svg          # 站点图标（各页按目录深度用相对路径引用）
├── favicon-180.png      # apple-touch-icon，180×180 透明底
├── vendor/              # Tailwind / Lucide / Chart.js 本地依赖
├── shared-app.js        # 共享交互层（模态框/筛选/搜索/通知/提示）
├── colors_and_type.css  # 设计令牌预检稿（历史产物）
├── .design              # 设计画布清单（含全部页面节点）
└── validation-report.json / runtime-*.json   # 生成流水线记录（历史产物）
```

> **`scripts/` 与 `_tools/` 的区别（别混淆）**：`scripts/` 是**进仓库的**，
> 装的是「生成演示数据」和「验证正确性」的脚本 —— 数据的来路必须可审计，
> 否则合成数据看起来就像实测结果。`_tools/` 是**不进仓库的**，
> 因为 `_gen_anonymize.py` 里的替换映射表本身写着被抹掉的真实地名，公开等于脱敏可逆。

> 两个参考库的数据文件都由脚本生成，**不要手工编辑**：
> `_tools/_gen_biodiversity.py`（取数 + 下照片 + 写 `biodiversity-data.js`）、
> `_tools/_gen_biodiversity_page.py`（从 `species-library.html` 抽壳生成页面）、
> `_tools/_gen_species_photos.py`（把聚合站来源照片换成 CC 授权照片）。
> 工具链在 `.gitignore` 里（见下方版本记录 v1.9 的说明）。

## 验证闸门

改完页面**不要只看「看起来对」**。本站有几道会自动失败的闸门：

| 闸门 | 命令 | 抓什么 |
| --- | --- | --- |
| 双语残留（**权威**） | `node _tools/_i18n_residue.mjs` | 逐页切英文、扫文本节点与属性、点开所有弹层；未白名单残留即退出码 1。**覆盖率脚本会骗人，这个不会。** |
| 阈值一致性 | `node scripts/verify-thresholds.mjs` | `indices.js` 的阈值与 4.2 表格逐字比对。两份副本漂移即失败。 |
| 指数引擎 | `node scripts/verify-indices.mjs` | 公式（含手工算例 `H'(50,50)=ln2`）、分级边界 26 例、不可计算项登记。 |
| 名录导出 | `node scripts/verify-dwc.mjs` | 列名未混入 Occurrence 术语、RFC 4180 转义、两个 schema 的适配。 |
| 导出接线 | `PW_CHROME=<chromium> node _tools/_verify_dwc.mjs` | 真浏览器里点按钮、拦下载、验 BOM 与行数。**纯函数对了不等于按钮绑上了。** |

## 共享交互层（shared-app.js）

所有页面末尾统一加载 `<script src="../shared-app.js"></script>`，提供：

- **模态框**：按钮加 `data-modal="newTask|newSample|newReport|finetune|importSeq"` 即可打开演示表单；或调用 `GL.modal({...})` / `GL.openModal(name)`。
- **筛选引擎**：筛选片加 `data-chip-group="组名" data-chip-value="值"`，条目加 `data-f-group="组名" data-f-values="值1 值2"`；未标注的条目自动按文本匹配（如样品/报告台账）。搜索框加 `data-search="组名"`，计数元素加 `data-result-count="组名"`。程序改动后可调 `GL.refreshFilter(组名)` 刷新。
- **行操作**：`data-action="view|review|export|download|edit|goto"`。`view` 自动读取行的 `data-d1..d8` + `data-d-labels` 生成详情弹窗，无标注时回退为按表头取列；`review` 默认跳转专家复核页，复核页内通过 `gl:review` 事件拦截为复核弹窗。
- **通知/提示**：`GL.toast(msg, type)`；通知铃铛 `data-notifications` 自动绑定下拉面板。
- **页脚联系方式**：9 个页面底部自动挂一张「联系方式」卡（微信公众号「小宋的环保笔记」二维码 + 邮箱），二维码可点击放大。数据源在 `shared-app.js` 顶部的 `GL_CONTACT` —— **改一处，全站 9 个页面同步**，页面 HTML 不用动。
  - 二维码图放 `assets/wechat-qrcode.png`（600×600，源图为微信公众平台导出的 `qrcode_for_gh_*_860.jpg`，缩到页脚实际显示的 92px 仍可正常扫码）；把 `qrcode.src` 置空则整块二维码区域不渲染；图片缺失时自动隐藏，不会留破图。
  - `qrcode.caption` 里的 `\n` 会渲染成换行，用来控制二维码下方小字的分行；`qrcode.name` 用作放大弹窗的标题。
  - `items` 里 `value` 为空的条目自动隐藏；`href` 写 `tel:` / `mailto:` 会自动拼上 `value`。
  - 每个 `<footer>` 都会**重新构建**一张联系卡（不是 `cloneNode`）——`cloneNode` 不复制事件监听器，克隆出来的二维码会点不动、图片缺失时也不会自动隐藏。
- 交互所需样式由脚本注入（`gl-modal`、`gl-toast`、`chip`、`gl-searchbar`、`gl-contact` 等），页面无需重复定义。

## 设计规范约定

- 颜色/字号统一使用各页面 `<style id="theme-vars">` 中的 CSS 变量（`--brand-*`、`--ink-*`、`--state-*`），新代码不要写死色值。
- 表格结构复用 `.task-table` + `.badge` 状态徽章；卡片复用 `.card`；KPI 复用 `.kpi-card`。
- 图表统一使用本地 `vendor/chart.umd.min.js`，script 标签带 `onerror` 回退；颜色从 CSS 变量读取，保证跟随主题。
- 图标使用 Lucide，动态插入后需调用 `lucide.createIcons()`。

### 配色：苹果官网简约风

主色系取自 apple.com 现行设计令牌；状态色取 Apple HIG 的可读档位（在白底上作文字用）。
实测对比度见本节末尾 —— 有两处卡在 AA 边缘，已如实标注，没有四舍五入成「全部达标」。

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--brand-background` / `--bg` | `#f5f5f7` | 页面底色 |
| `--brand-card` / `--brand-surface` | `#ffffff` | 卡片、面板 |
| `--brand-surface-2` / `--brand-muted` | `#e8e8ed` | 填充灰（表头、图标区、悬停） |
| `--brand-foreground` / `--ink` | `#1d1d1f` | 正文（Apple near-black，**不是纯黑**） |
| `--brand-muted-foreground` / `--ink-2` | `#6e6e73` | 次级文字 |
| `--ink-3` | `#86868b` | 三级文字、占位符 |
| `--brand-border` / `--line` | `#d2d2d7` | 发丝分隔线 |
| `--brand-primary` / `--brand-ring` | `#0071e3` | 强调色（Apple Blue） |
| `--state-success` | `#248a3d` | 达标 / 已完成 |
| `--state-warning` | `#c93400` | 待复核 / 关注 |
| `--state-error` | `#d70015` | 超标 / 失败 |
| `--state-info` | `#5856d6` | 提示（Apple Indigo，**刻意与主蓝拉开**，避免和按钮撞色） |

圆角：`--r-xs 6px / --r-sm 8px / --r-md 12px / --r-lg 18px / --r-pill 999px`。
阴影：中性黑、低透明度（`--shadow-1` 几乎不可见，`--shadow-3` 仅用于模态框）。

两条风格纪律：

1. **不做大面积饱和色块。** 苹果的克制在于色只用在按钮、链接、图标、状态徽章上。
   首页卡片顶部的图标区用 `--brand-surface-2 → --brand-card` 的浅灰渐变 + 蓝色细线图标
   （`stroke-width: 1.5`），**不要改回实心色带**。
2. **字重靠字号和间距拉开层次，不靠加粗。** 大标题用 600，正文 400；不要用 700/800。

### 对比度实测（WCAG 2.1）

实测值，不是估计。底色 `#f5f5f7`，卡片 `#ffffff`：

| 前景 | 底色 | 对比度 | 判定 |
| --- | --- | --- | --- |
| 正文 `#1d1d1f` | `#f5f5f7` | 15.46:1 | AA ✓ |
| 次级 `#6e6e73` | `#f5f5f7` | 4.66:1 | AA ✓ |
| 三级 `#86868b` | `#f5f5f7` | 3.33:1 | 仅大字/非文字 |
| 主蓝 `#0071e3` | `#ffffff` | 4.70:1 | AA ✓ |
| 白字 | `#0071e3` 按钮 | 4.70:1 | AA ✓ |
| 成功 `#248a3d` | `#ffffff` | 4.40:1 | **差 0.1 到 AA** |
| 警告 `#c93400` | `#ffffff` | 5.28:1 | AA ✓ |
| 错误 `#d70015` | `#ffffff` | 5.38:1 | AA ✓ |
| 提示 `#5856d6` | `#ffffff` | 5.65:1 | AA ✓ |

两处需要知情：

- **主蓝压灰底是 4.31:1**（低于 4.5）。本布局里蓝字绝大多数落在白卡片上（4.70 ✓），
  直接压页面灰底的场景很少，所以按 Apple 原值保留。
- **成功绿 4.40:1** 卡在 AA 门槛下 0.1。这是 Apple HIG 的原始值；
  若要严格达标，改成 `#22803a`（4.98:1）即可，肉眼几乎看不出差别。

改法（若决定调）：只动各页 `theme-vars` 里的 `--state-success` / `--brand-primary`，
全站 10 个页面同步改，别在页面里写死。

## 新增页面步骤

1. 复制 `pages/dashboard.html` 作为壳（保证导航/侧栏/样式一致），改标题与激活态。
2. 替换 `<main class="app-main">` 主体内容；如需图表，复制 chart script 标签 + 初始化脚本。
3. 在 `lucide.createIcons()` 前挂载 `shared-app.js`（页面专属脚本需放在它之后）。
4. 在 `.design` 中登记新页面节点；如需交互，按上文约定加 `data-*` 属性即可。
5. **新页面的文案要进双语字典**：在 `</body>` 前加
   `<script src="../i18n-dict.js"></script>` + `<script src="../i18n.js"></script>`
   （第 0 层目录去掉 `../`），并把新增中文文案补进 `i18n-dict.js`。
   漏了不会报错 —— 页面照常显示，只是英文模式下那几句还是中文。
   校验方式是跑 `_tools/_i18n_residue.mjs`（浏览器实测，未白名单残留即失败），
   **不要只看覆盖率脚本**：JS 里拼出来的 HTML 片段它看不到。

## 已知限制 / 后续待办（Backlog）

- [ ] 数据仍为静态演示数据：`shared-app.js` 的表单提交只弹提示，不真正写入。
- [ ] 页面共用壳 CSS 约 700 行内联重复，可抽成 `shared.css` 收敛（注意离线与设计工具兼容）。
- [ ] 表头排序、分页未实现；筛选目前只支持单组单值（AND 搜索）。
- [ ] `validation-report.json` / `runtime-*.json` 为旧生成流水线产物，本次开发未重新生成。
- [ ] 专家复核页的「批量通过」与复核弹窗为纯前端演示，无后端持久化。
- [ ] 物种参考库已接入真实数据（CoSFISH 条形码 + 北方某河（一）/南方某河名录），其余页面（样品管理、报告中心等）仍是演示数据，可按同一模式逐步真实化。
- [ ] 生物多样性库的「栽培 vs 野生」边界：iNaturalist 的 research grade 本身已要求「非圈养 / 栽培个体」，但桑、桃、板栗这类既有大量栽培也有野生种群的物种，仍可能拍到人工栽植的个体。当前保持选种依据客观可复现（不做人工取舍），页面「数据口径」弹层里已如实说明。

### v1.13 之后新增的待办

按优先级排列，前四条是**会直接影响评价结论能不能成立**的：

- [ ] **补录 EPT 类群名录（P0）**。参考库底栖名录 38 条里没有蜉蝣目、没有襀翅目，毛翅目只有纹石蛾 1 条 —— EPT% 恒接近 0，无指示意义。须按 HJ 1295 / 相关标准补录 EPT 类群，否则该指数不能用。同时 `dashboard.html` 的鉴定记录里出现「四节蜉属」「网脉蜉属」，参考库无对应条目，两处需对齐（二选一：补名录，或改仪表盘）。
- [ ] **核定 FOEI 的历史基准 FE（P0）**。当前 `indices.js` 的 `FOEI_BASELINE.fe = 68` 是**演示值**，须查 1980s 前历史鱼类名录核定。替换前 FOEI 只表示「相对某个假设基准的比例」，不构成评价结论（页面与导出均已标注）。
- [ ] **BI / FBI / IBD / IBI 需要外部赋分表（P1）**。四个指数已明确标为「不可计算」并写明缺什么：BI/FBI 需逐分类单元耐污值（Hilsenhoff 原文为科级 0–10）、IBD 需 Prygiel & Coste 1999 的硅藻敏感值与权重（约 200 个分类单元）、IBI 需选定一个指标构成与赋分规则版本。**在拿到表之前不要输出数值** —— 编一个比不显示更糟。
- [ ] **同物异名记录的学名待更新（P2）**。iNaturalist 的现行接受名与名录里的旧名不一致时，已在 `photoTaxon` 字段留档（如 `Paramisgurnus dabryanus → Misgurnus dabryanus`），并导出到 `acceptedNameUsage`。但**名录里显示的仍是旧名**，页面未做「异名」标注 —— 用于名录比对时应留意。
- [ ] **137 条记录仍无 CC 授权照片（P2，属上游限制）**。110/247 已换成 CC 授权；剩余 137 条中，57 条上游确实没有 CC 图（如青鱼 82 条 research-grade 观测、0 条 CC 授权），10 条 iNaturalist 查不到该学名（多为中国特有种），其余为名录内已有机构/CC 署名。可考虑接 GBIF 或 FishBase 作为第二图片来源，但**同样受许可约束**。
- [ ] 演示观测数据集目前只有 2 个季节 × 2 种方法。若要验证季节动态或做趋势分析，需要更多期次；生成脚本 `scripts/gen-observation-demo.py` 已参数化，扩期次只是改 `DATES`。

## 版本

v1.13 · 2026-09-20 · 按「首席研究员视角」的改进清单施工，核心是**把几处会误导人的表述改掉，并让指数第一次真的能算出来**。三件事值得单独说：

**① 全站「HJ 1295/1296 合规」是个站不住的声明。** 8 个页面页脚都写着这一句，而本站自己的 `compliance-matrix.html` 里逐条对照的结果是 7 项 ❌/⚠️ —— 平台只做了 HJ 1295 四准则层里的「生物」层（权重 0.2），不实现 RHI 综合赋分，也不覆盖「盆」「水」「社会服务功能」三层。全部改为「参照 HJ 1295 生物准则层（部分实现）」（`compliance-matrix.html` 因在自我批评里**引用**了原句，故意不改）。首页首屏新增定位说明：本站给出的生物指数与等级是**生物专项评价结果，不能作为完整河湖健康评价结论使用**。

**② 指数阈值多数不是 HJ 1295 规定的，之前笼统写成「依据 HJ 1295」。** 4.1 与 4.2 两张表各增一列「分级依据」，逐行写明真实出处：Shannon 是经典污染生物学分级（欧盟 WFD / 国内教材）、IBD 是 Prygiel & Coste 1999、IBI 是 Karr 1981、FBI 是 Hilsenhoff 1988，并分别标注「非 HJ 1295 规定，须标注为引用」或「本平台自定」。`Hilsenhoff 1988` 原文为 6 级、此处简化为 4 级，也如实注明是本平台改动。

**③ 新增指数计算引擎（`pages/indices.js`），并抓到一处真实矛盾。** 平台从上线起就在展示 Shannon / EPT% / IBI 的等级，但**从来没有一处真的算过** —— 阈值写在 HTML 表里、结果数字写在别处，两者从未比对。补上引擎后当场发现：`dashboard.html` 写「示范断面 09 BI=8.3 — 生态预警：中度污染」，而 4.2 矩阵规定 BI>7.0 为**重度污染**，8.3 落在重度区间。这不是笔误，是「阈值表与结果数字分头手写」的必然结果；已按矩阵改正，并在页面上留了一条可追溯记录。

配套落地：
- **演示观测数据集** `pages/observation-demo-data.js`（36 个采样事件 / 394 条记录 / 9 断面 × 2 季 × 2 方法），由 `scripts/gen-observation-demo.py` 生成，固定种子可复现。分类单元取自参考库（分类学真实），个体数按对数正态分布合成。**页面顶部与文件头都写明这是合成数据、不得引用**，并说明其能力边界：抽选未假定耐污等级，故只能验证纯计数类指数。
- **可计算性登记**：能算的（Shannon / Simpson / Margalef / Pielou / FOEI）真的算；**不能算的（BI / FBI / IBD / IBI）明确标「不可计算」并写明缺什么** —— 分别需要逐分类单元耐污值表、Hilsenhoff 原始耐污值表、Prygiel & Coste 1999 硅藻敏感值表、Karr IBI 的指标构成与赋分规则，平台都没有。宁可显示「不可计算」，也不显示一个编出来的数字。
- **EPT% 暴露了名录缺口**：参考库底栖名录 38 条里**没有蜉蝣目、没有襀翅目**，毛翅目只有纹石蛾 1 条 —— 该指数在当前名录下恒接近 0，无指示意义。而 `dashboard.html` 的鉴定记录里却出现「四节蜉属」「网脉蜉属」，参考库并无对应条目，两处需对齐（已在页面登记表里标出）。
- **阈值一致性闸门** `scripts/verify-thresholds.mjs`：`indices.js` 的阈值与 4.2 表格逐字比对，不一致退出码 1。阈值有两份副本（给人看的表 / 给机器判级的代码），改一处忘另一处会当场失败 —— 这正是 BI=8.3 那个矛盾的成因。**已做反向测试确认它真的会失败**（改一个字符即报错，还原后恢复通过）。
- **Darwin Core 名录导出**（`pages/dwc-export.js`）：两个名录页各加「导出名录」按钮，前端 Blob 下载，UTF-8 BOM（不加则 Excel 中文乱码）。术语用 **Taxon 而非 Occurrence** —— 这是分类单元名录，没有时间/地点/个体数，用 Occurrence 术语会被下游当成出现记录。平台特有字段统一加 `gl:` 前缀，不冒充标准术语。自检里专门断言「没有混入 Occurrence 术语」。
- **照片许可**：把聚合站/百科来源的照片换成 iNaturalist CC 授权。首轮 83 张，修正匹配规则后第二轮再补 27 张（**同物异名**：iNat 返回现行接受名而旧名落在 `matched_term`，只比对 `name` 会把「Tachysurus fulvidraco → T. sinensis」判成查不到；另有 `spp.` 后缀未剥导致「田蚌科」类条目被挡）。合计 **110/247** 有明确 CC 许可（CC0 18 / CC-BY 44 / CC-BY-SA 25），聚合站来源 124+ → 35。剩 137 条无 CC 图是**上游确实没有**（如青鱼 82 条 research-grade 观测、0 条 CC 授权），不是脚本缺陷。0 破图、0 空文件、全部可解码。

同版修掉一个工具缺陷：`_tools/_i18n_residue.mjs` 的 `--report` 模式**无论有没有残留都打印「✓ 闸门通过」** —— 一个永远亮的绿灯等于没有灯。改为如实输出「报告模式：未做闸门判定（当前有 N 条）」。

v1.12 · 2026-09-19 · 全站中英双语（11 个内容页 + 两个名录）。做法是**零 HTML 改动**：新增 `i18n-dict.js`（约 4800 条，键 = 中文原文）与 `i18n.js`（运行时遍历文本节点整串查表），每个页面 `</body>` 前注入语言切换按钮，默认中文、选择记在 `localStorage['gl-lang']`。字典里查不到的字符串一律保持中文 —— 这一条顺手把 ID、文件名、图片署名挡在外面，不必单独维护排除名单；物种英文名尽量从 iNaturalist 的 `english_common_name` 派生，没有公认英文名的**回退到拉丁学名**（与 iNaturalist 英文界面一致），不臆造译名。

> **站点根目录的 `index.html` 是例外**：它是跳转壳不是内容页，head 里就 `location.replace()` 走了，body 里的脚本永远不执行 —— 引不进运行时（引 276 KB 的字典还会拖慢跳转）。它唯一可见的中文是标签页标题，由一行内联脚本按 `localStorage` 就地换掉。抽取脚本按「跳转壳」跳过它，不进待译清单。

真正难的不是翻译量而是**覆盖面**：覆盖率脚本报「待译 0」时，浏览器实测仍有 **3012 个中文文本节点**。根因是本站大量文案由 JS 拼出来（`'<div …>分类</div>'`），既不是 HTML 静态文本、也不是整段 JS 字面量，**两头都漏**。修了三处：抽取器新增「HTML 片段内文案」桶、覆盖率脚本把它按必须项处理、并把「拼接整串」单独还原（`'A' + n + 'B'` → `A⟨变量⟩B`，再拿运行时规则逐位枚举探针去试）。运行时规则补齐到 12 条（计数、万元、IUCN 等级、`标签：值`、项目符号、阶元链与目/科、中文日期、编号标签、字段兜底、复核完成与批量通过提示…）——这类串的值是变量，整串永远进不了字典。另修两个真缺陷：中文名回退成拉丁学名后与旁边学名画重（`Oscillatoria (Oscillatoria)`，全站 **136 处**），在渲染层按词去重并保证切回中文逐格还原；属级条目统一保留 `(genus)` 标记，`网脉蜉属` 的学名从误写的 `Iron` 更正为 `Ecdyonurus`。

**权威判据是浏览器实测** `_tools/_i18n_residue.mjs`：逐页切英文、扫文本节点与属性、**逐个点开所有能弹东西的触发点**（弹层是点击才注入 DOM 的，「没扫到」不等于「不存在」；轻提示只活几秒，也一并扫），未白名单残留即退出码 1。最终：待译[必须] **0** / 拼接整串未覆盖 **0** / 残留闸门通过 / 测试 54 项全过。同版把两处图片署名「台湾数位典藏」「台湾大学生命科学院」补为「中国台湾…」。

v1.11 · 2026-09-19 · 补上全站 favicon（此前 13 个页面**一个都没声明**，连图标资源都没有）。不声明 `<link rel="icon">` 时浏览器会去请求**域名根**的 `/favicon.ico`，而本站托管在 `/My-hub/greylight-lab/` 子路径下，根上没有这个文件 —— 于是每个页面都产生一条自动发起的 404，页面上完全看不出来。本版新建 `favicon.svg`（蓝底 `#0071e3` 圆角方 + 白色烧瓶，与站点苹果风一致）与 `favicon-180.png`（180×180 透明底，供 iOS 加到主屏），并给 13 个页面按**目录深度**注入相对路径（第 0 层 `favicon.svg`、第 1 层 `../favicon.svg`）。注入脚本 `scripts/inject_favicon.py` 的纪律：已是规范状态就一个字节不动、自定义图标绝不覆盖、全量校验后才统一写盘、站点根缺图标资源直接报错退出、幂等。**注意 `file://` 测不出来** —— 双击打开时浏览器不做域名根回退，必须起本地 HTTP 服务并带子路径才能复现与验证。同一次也修了 EnvLab 站（115 页里 111 页缺声明）。

v1.10 · 2026-09-19 · 新增「生物多样性参考库」（297 种）。原有物种参考库只覆盖水生态（鱼 / 底栖 / 浮游 / 藻 / 鸟 / 两栖爬行），陆地类群完全空白，本版补上：陆生植物 120、昆虫与陆生无脊椎 90（昆虫纲 65 + 蛛形纲 25）、哺乳动物 37、真菌与地衣 50。**选种不是人工拟名单** —— 按 iNaturalist 中国境内（place_id 6903）research-grade 观测记录数排序取各字段前列，观测数同时充当「常见程度」的近似；每条记录都带完整中文阶元链（界/门/纲/目/科，297/297 覆盖）、IUCN 保护等级、中国与全球观测数，以及可回原页复核的 `sourceUrl`。照片只收 CC0 / CC BY / CC BY-SA：iNaturalist 上 `license` 为空表示观察者未选择任何 CC 协议、默认「保留所有权利」，**不是**公共领域，一律不采用；严格许可下通过率约 1/5，故候选池开到目标的 14 倍，并利用 `species_counts` 响应里已带的 rank / 中文名 / 照片许可字段先筛后取，只对最终入选者再补分类阶元，池子开大不增加请求数。297 张照片本地化到 `pages/assets/biodiversity-photos/`（长边压到 900px，约 11 MB），离线可用。页面不手写 —— 由 `_tools/_gen_biodiversity_page.py` 从 `species-library.html` **抽取外壳**生成（950 行内联壳 CSS 抄一份必然与上游分叉），只替换 title / 侧边栏 / 正文 / 页脚 / 末尾脚本，锚点缺失即报错不写盘。两库互相有入口；主库页脚与 KPI 里过期的 166 也一并改成实际值 247。

v1.9 · 2026-09-19 · 全站地名脱敏。演示数据里的真实水体名与行政区名统一替换为通用描述：两条调查河流改为「北方某河（一）/（二）」「南方某河」；河段与点位按下游位置改为「汇入口段 / 城区段 / 支流段 / 上游段 / 中游段 / 下游段 / 水库点位」；9 个演示监测断面统一改为「示范断面 01」~「示范断面 09」。共 11 个文件、433 行改动。新增生成器 `_tools/_gen_anonymize.py`，带全站残留自检：具体名先于宽泛名替换（避免「城区段段」）、`X监测断面` 整体换（避免语义重复）、裸河名兜底（站名整体替换后仍会残留的、不带站点前缀的裸水体名），未覆盖的残留直接报错不写盘；图片署名（`photoCredit`）等合法来源信息经白名单保留。生成器幂等，复跑零改动。**工具链不进仓库** —— `_tools/` 已列入 `.gitignore`，因为映射表本身就写着被抹掉的地名，公开等于脱敏可逆。

v1.8 · 2026-09-19 · 补齐入口链接。README 之前**一个链接都没有** —— 页面清单是纯文本路径，全文也没写线上地址，访客在仓库首页点不进任何演示页。现在：介绍区加了线上地址与「演示页直达」一行 8 条链接，页面清单的路径列也改成可点击；同时补了「本地看 / 在线看」两条快速开始路径，并说明本站点与同仓库根目录的碳汇平台互不影响。站点首页的介绍区（标题/副标题/徽章下方）新增一排「直接进入」文字链接，7 个演示页在首屏即可点进，不用往下翻。

v1.7 · 2026-09-18 · 配色改为苹果官网简约风。全站 12 个品牌色 1:1 换成 apple.com 现行令牌（底色 `#f5f5f7`、正文 `#1d1d1f`、发丝线 `#d2d2d7`、强调蓝 `#0071e3`），状态色改用 Apple HIG 无障碍档位；圆角放大到 18px 档、阴影改为中性黑低透明度、字体栈改为 SF Pro 系统栈；阴影/遮罩里的蓝色调 `rgba(15,23,42,…)` 全部中性化。首页卡片顶部的实心青色渐变色带改成浅灰图标区 + 蓝色细线图标（苹果的克制在于不做大面积饱和色块）。共 10 个文件、约 400 处改动，全部走令牌，未动任何结构。

v1.6 · 2026-09-18 · 联系方式卡接入真实微信公众号二维码（「小宋的环保笔记」，源图 860px 导出件压到 600×600）；修掉 `cloneNode` 不复制事件监听器的 bug —— 此前「点击二维码放大」与「图片缺失自动隐藏」实际都未生效，改为每个页脚重新构建节点；二维码下方小字支持 `\n` 分行。

v1.5 · 2026-09-17 · 8 个页面底部统一新增「联系方式」卡（微信公众号二维码 + 邮箱），数据源集中在 `shared-app.js` 的 `GL_CONTACT`，改一处全站生效；二维码点击可放大，移动端自动改为上下堆叠并把二维码放大到 118px 方便扫码。

v1.4 · 2026-09-17 · 参考库页交互升级：点击物种卡片照片区域（或「详情」）弹出整张介绍卡，弹窗顶部显示该物种照片大图（无图物种显示「暂无照片（形态鉴定）」占位），并保留分类/站点/序列号/来源/标签完整信息。

v1.3 · 2026-09-17 · 物种参考库新增真实物种照片：166 种中 161 种配真实照片（鱼类 31、鸟类 21、底栖无脊椎 36、浮游植物 39、硅藻/浮游动物 34），下载至 `pages/assets/species-photos/` 离线可用；显微类 5 种（巨毛水丝蚓、裸泽蛭、蓝纤维藻、杂葫芦虫、小巨头轮虫）因公开可靠同物照片稀缺暂留空，卡片显示「暂无照片」占位。图片来源以百科、学术机构、iNaturalist（CC 授权）等为主，未使用商业素材库。

v1.2 · 2026-09-17 · 物种参考库接入真实数据（CoSFISH 鱼类条形码 21,535 COI + 1,074 18S；北方某河（一） 2021 调查名录；南方某河 2021 评价名录，共 166 种，鱼类序列号统一为 GenBank accession 可溯源）

