# 灰灯实验室 AI 鉴定台

水生生物 AI 鉴定平台离线演示站 · 政务监测报告风格 · 无需联网即可运行全部功能。

## 快速开始

直接双击打开 `pages/index.html`（或任意页面）即可浏览。依赖（Tailwind、Lucide、Chart.js）均放在 `vendor/` 本地加载，带 CDN 回退兜底。

## 页面清单

| 页面 | 文件 | 说明 |
| --- | --- | --- |
| 离线 Demo 入口 | `pages/index.html` | 首页导航与统计 |
| AI 鉴定主控台 | `pages/dashboard.html` | 任务总览、KPI、置信度分布、标本图库、站点监控 |
| 样品管理 | `pages/sample-management.html` | 样品台账、生命周期、类型分布（环形图） |
| **专家复核** | `pages/expert-review.html` | **AI 结果人工复核与仲裁（本版新增）** |
| 水生态监测流程 | `pages/monitoring-workflow.html` | SOP 规程、三阶段流程、eDNA 专项、报告出具流程 |
| 物种参考库 | `pages/species-library.html` | 1,042 种参考库、分类树、序列统计（可筛选/搜索） |
| 报告中心 | `pages/report-center.html` | 模板、台账、三级审核、导出格式 |
| 模型管理 | `pages/model-management.html` | 三大模型卡片、性能趋势、版本历史 |

## 目录结构

```
greylight-lab/
├── pages/               # 全部页面（离线优先，样式内联）
├── assets/              # 标本图、站点图等静态资源
├── vendor/              # Tailwind / Lucide / Chart.js 本地依赖
├── shared-app.js        # 共享交互层（模态框/筛选/搜索/通知/提示）
├── colors_and_type.css  # 设计令牌预检稿（历史产物）
├── .design              # 设计画布清单（含全部页面节点）
└── validation-report.json / runtime-*.json   # 生成流水线记录（历史产物）
```

## 共享交互层（shared-app.js）

所有页面末尾统一加载 `<script src="../shared-app.js"></script>`，提供：

- **模态框**：按钮加 `data-modal="newTask|newSample|newReport|finetune|importSeq"` 即可打开演示表单；或调用 `GL.modal({...})` / `GL.openModal(name)`。
- **筛选引擎**：筛选片加 `data-chip-group="组名" data-chip-value="值"`，条目加 `data-f-group="组名" data-f-values="值1 值2"`；未标注的条目自动按文本匹配（如样品/报告台账）。搜索框加 `data-search="组名"`，计数元素加 `data-result-count="组名"`。程序改动后可调 `GL.refreshFilter(组名)` 刷新。
- **行操作**：`data-action="view|review|export|download|edit|goto"`。`view` 自动读取行的 `data-d1..d8` + `data-d-labels` 生成详情弹窗，无标注时回退为按表头取列；`review` 默认跳转专家复核页，复核页内通过 `gl:review` 事件拦截为复核弹窗。
- **通知/提示**：`GL.toast(msg, type)`；通知铃铛 `data-notifications` 自动绑定下拉面板。
- 交互所需样式由脚本注入（`gl-modal`、`gl-toast`、`chip`、`gl-searchbar` 等），页面无需重复定义。

## 设计规范约定

- 颜色/字号统一使用各页面 `<style id="theme-vars">` 中的 CSS 变量（`--brand-*`、`--ink-*`、`--state-*`），新代码不要写死色值。
- 表格结构复用 `.task-table` + `.badge` 状态徽章；卡片复用 `.card`；KPI 复用 `.kpi-card`。
- 图表统一使用本地 `vendor/chart.umd.min.js`，script 标签带 `onerror` 回退；颜色从 CSS 变量读取，保证跟随主题。
- 图标使用 Lucide，动态插入后需调用 `lucide.createIcons()`。

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
- [ ] 物种参考库已接入真实数据（CoSFISH 条形码 + 磁窑河/余杭塘河名录），其余页面（样品管理、报告中心等）仍是演示数据，可按同一模式逐步真实化。

## 版本

v1.4 · 2026-09-17 · 参考库页交互升级：点击物种卡片照片区域（或「详情」）弹出整张介绍卡，弹窗顶部显示该物种照片大图（无图物种显示「暂无照片（形态鉴定）」占位），并保留分类/站点/序列号/来源/标签完整信息。

v1.3 · 2026-09-17 · 物种参考库新增真实物种照片：166 种中 161 种配真实照片（鱼类 31、鸟类 21、底栖无脊椎 36、浮游植物 39、硅藻/浮游动物 34），下载至 `pages/assets/species-photos/` 离线可用；显微类 5 种（巨毛水丝蚓、裸泽蛭、蓝纤维藻、杂葫芦虫、小巨头轮虫）因公开可靠同物照片稀缺暂留空，卡片显示「暂无照片」占位。图片来源以百科、学术机构、iNaturalist（CC 授权）等为主，未使用商业素材库。

v1.2 · 2026-09-17 · 物种参考库接入真实数据（CoSFISH 鱼类条形码 21,535 COI + 1,074 18S；磁窑河 2021 调查名录；余杭塘河 2021 评价名录，共 166 种，鱼类序列号统一为 GenBank accession 可溯源）

