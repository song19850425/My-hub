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
│   └── assets/
│       ├── species-photos/        # 水生态物种照片 243 张（47 MB）
│       └── biodiversity-photos/   # 生物多样性照片 297 张（约 11 MB，长边 900px）
├── assets/              # 标本图、站点图、微信公众号二维码（wechat-qrcode.png）等静态资源
├── favicon.svg          # 站点图标（各页按目录深度用相对路径引用）
├── favicon-180.png      # apple-touch-icon，180×180 透明底
├── vendor/              # Tailwind / Lucide / Chart.js 本地依赖
├── shared-app.js        # 共享交互层（模态框/筛选/搜索/通知/提示）
├── colors_and_type.css  # 设计令牌预检稿（历史产物）
├── .design              # 设计画布清单（含全部页面节点）
└── validation-report.json / runtime-*.json   # 生成流水线记录（历史产物）
```

> 两个参考库的数据文件都由脚本生成，**不要手工编辑**：
> `_tools/_gen_biodiversity.py`（取数 + 下照片 + 写 `biodiversity-data.js`）、
> `_tools/_gen_biodiversity_page.py`（从 `species-library.html` 抽壳生成页面）。
> 工具链在 `.gitignore` 里（见下方版本记录 v1.9 的说明）。

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

## 已知限制 / 后续待办（Backlog）

- [ ] 数据仍为静态演示数据：`shared-app.js` 的表单提交只弹提示，不真正写入。
- [ ] 页面共用壳 CSS 约 700 行内联重复，可抽成 `shared.css` 收敛（注意离线与设计工具兼容）。
- [ ] 表头排序、分页未实现；筛选目前只支持单组单值（AND 搜索）。
- [ ] `validation-report.json` / `runtime-*.json` 为旧生成流水线产物，本次开发未重新生成。
- [ ] 专家复核页的「批量通过」与复核弹窗为纯前端演示，无后端持久化。
- [ ] 物种参考库已接入真实数据（CoSFISH 条形码 + 北方某河（一）/南方某河名录），其余页面（样品管理、报告中心等）仍是演示数据，可按同一模式逐步真实化。
- [ ] 生物多样性库的「栽培 vs 野生」边界：iNaturalist 的 research grade 本身已要求「非圈养 / 栽培个体」，但桑、桃、板栗这类既有大量栽培也有野生种群的物种，仍可能拍到人工栽植的个体。当前保持选种依据客观可复现（不做人工取舍），页面「数据口径」弹层里已如实说明。

## 版本

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

