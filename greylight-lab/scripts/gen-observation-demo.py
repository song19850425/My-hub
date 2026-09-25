#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""生成「演示观测数据集」`pages/observation-demo-data.js`。

## 为什么需要这个数据集

平台从上线起就在展示 Shannon / Margalef / Pielou / EPT% / IBI 这些指数和它们的等级，
但**从来没有一份观测数据**：指数值是手写进 HTML 的，不是算出来的。

这带来两个后果：

1. **方法学无法验证。** 「算得出来」和「算不出来」是两种东西 ——
   前者能证明公式、单位、汇总口径是对的，后者只能看图。
2. **阈值与结果各写各的，必然对不上。** 已经抓到一个实例：
   `dashboard.html` 写「示范断面 09 BI=8.3 — 中度污染」，
   而 `monitoring-workflow.html` 的 4.2 矩阵规定 BI>7.0 为**重度污染**。
   8.3 被标成中度，就是因为没有任何一处真的去比对过阈值。

补一份数据集 + 一个真的计算引擎，这两个问题一起解决。

## 这份数据是**合成**的，不是实测

必须写在最前面，也必须写在产出的 JS 文件头上：

- 类群抽选：从 `pages/species-data.js` 的**真实分类单元**里随机抽（分类学是真的）
- 个体数：对数正态分布 `n_i ∝ exp(N(0, σ_site))`，σ 随断面质量分变化
- 生物量：按类群给一个固定的单体重，再乘个体数
- **不假定任何耐污等级** —— 抽选是均匀随机的，没有「这个种耐污所以多给几个」

最后一条决定了这份数据的**能力边界**：它只能验证**纯计数类**指数
（Shannon / Simpson / Margalef / Pielou / EPT%），
**不能**验证任何依赖耐污值的指数（BI / FBI / IBD / IBI）——
那些需要外部赋分表，本平台没有，所以引擎里直接标成「不可计算」。

## 用法

    python scripts/gen-observation-demo.py            # 写盘
    python scripts/gen-observation-demo.py --dry       # 只打印统计，不写盘

固定 `SEED`，同一版本脚本产出同一份数据 —— 可复现是「可审计」的前提。
"""
import argparse
import io
import json
import math
import os
import random
import re
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(_HERE)
DATA_JS = os.path.join(ROOT, "pages", "species-data.js")
OUT_JS = os.path.join(ROOT, "pages", "observation-demo-data.js")

SEED = 20260920

# 两次采样日期。秋季那次与 dashboard 里 2026-09 的活动记录同期。
DATES = [
    {"date": "2026-04-18", "season": "春季", "label": "2026 春季"},
    {"date": "2026-09-12", "season": "秋季", "label": "2026 秋季"},
]

# 9 个示范断面。q = 质量分（1 越接近清洁，0 越退化）。
# q 只用来驱动「物种数」和「丰度均匀度」两个合成参数，
# **不代表任何实测结论**，也不对应任何水质类别。
SITES = [
    {"id": "S01", "name": "示范断面 01", "reach": "上游段", "q": 0.95},
    {"id": "S02", "name": "示范断面 02", "reach": "上游段", "q": 0.88},
    {"id": "S03", "name": "示范断面 03", "reach": "中游段", "q": 0.72},
    {"id": "S04", "name": "示范断面 04", "reach": "中游段", "q": 0.64},
    {"id": "S05", "name": "示范断面 05", "reach": "城区段", "q": 0.42},
    {"id": "S06", "name": "示范断面 06", "reach": "城区段", "q": 0.30},
    {"id": "S07", "name": "示范断面 07", "reach": "汇入口段", "q": 0.48},
    {"id": "S08", "name": "示范断面 08", "reach": "支流段", "q": 0.78},
    {"id": "S09", "name": "示范断面 09", "reach": "下游段", "q": 0.22},
]

# 两种采样方法各对应一个分类群池。方法名按国内水生态调查常规写法。
METHODS = {
    "benthos": {
        "method": "底栖大型无脊椎动物 · 索伯网（30×30cm，500μm，3 次重复）",
        "group": "底栖无脊椎",
        "n_total": (180, 620),
        "richness": (3, 16),
        "biomass_unit": "g/m²",
    },
    "fish": {
        "method": "鱼类 · 电捕（背式电鱼机，断面长度 200m，往返 1 次）",
        "group": "鱼类",
        "n_total": (90, 380),
        "richness": (3, 17),
        "biomass_unit": "g/尾·合计",
    },
}

# 单个体重量（g）的取值区间，按分类群粗分。用于合成生物量列。
# 是合成参数，不是实测测量值。
WEIGHT_RANGE = {
    "鱼类": (12.0, 850.0),
    "底栖无脊椎": (0.01, 3.5),
}


def load_species():
    s = io.open(DATA_JS, encoding="utf-8").read()
    m = re.search(r"window\.SPECIES_DATA\s*=\s*(\[.*\])\s*;?\s*$", s, re.S)
    if not m:
        sys.exit("error: 解析 species-data.js 失败")
    return json.loads(m.group(1))


def build_pools(rows):
    """按 group 归池。只保留有学名的条目（属级条目 latin 带 spp. 也算，保留原样）。"""
    pools = {}
    for r in rows:
        g = r.get("group")
        if g not in ("鱼类", "底栖无脊椎"):
            continue
        if not (r.get("latin") or "").strip():
            continue
        pools.setdefault(g, []).append({
            "cn": r.get("cn"),
            "latin": r.get("latin"),
            "group": g,
        })
    return pools


def draw_community(rng, pool, q, cfg):
    """抽一个群落：先定物种数，再定各物种个体数（对数正态）。

    σ 随 q 反向变化：清洁断面群落更均匀（σ 小 → Shannon 高），
    退化断面少数种占优（σ 大 → Shannon 低）。
    这一步是整份数据集唯一的「梯度来源」，除此之外没有任何假设。
    """
    s_lo, s_hi = cfg["richness"]
    richness = max(2, int(round(s_lo + (s_hi - s_lo) * q)))
    richness = min(richness, len(pool))
    taxa = rng.sample(pool, richness)

    sigma = 1.45 - 0.85 * q          # q=0.95 → 0.64；q=0.22 → 1.26
    ws = [math.exp(rng.gauss(0.0, sigma)) for _ in taxa]
    tot_w = sum(ws)

    n_lo, n_hi = cfg["n_total"]
    n_total = int(round(n_lo + (n_hi - n_lo) * rng.random()))

    out = []
    for t, w in zip(taxa, ws):
        n = int(round(w / tot_w * n_total))
        if n <= 0:
            continue
        w_lo, w_hi = WEIGHT_RANGE[t["group"]]
        unit_w = math.exp(rng.uniform(math.log(w_lo), math.log(w_hi)))
        out.append({
            "cn": t["cn"],
            "latin": t["latin"],
            "group": t["group"],
            "n": n,
            "biomass": round(n * unit_w, 2),
        })
    out.sort(key=lambda r: -r["n"])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="只打印统计，不写盘")
    args = ap.parse_args()

    rows = load_species()
    pools = build_pools(rows)
    for g, p in pools.items():
        print("类群池 %-8s %d 条" % (g, len(p)))
    if not pools.get("鱼类") or not pools.get("底栖无脊椎"):
        sys.exit("error: 类群池为空")

    rng = random.Random(SEED)
    records = []

    for site in SITES:
        for d in DATES:
            for key in ("benthos", "fish"):
                cfg = METHODS[key]
                comm = draw_community(rng, pools[cfg["group"]], site["q"], cfg)
                for rec in comm:
                    records.append({
                        "site": site["id"],
                        "date": d["date"],
                        "season": d["season"],
                        "method": cfg["method"],
                        "methodKey": key,
                        "cn": rec["cn"],
                        "latin": rec["latin"],
                        "group": rec["group"],
                        "n": rec["n"],
                        "biomass": rec["biomass"],
                    })

    # 每组事件的个体总数（用于核对）
    agg = {}
    for r in records:
        k = (r["site"], r["date"], r["methodKey"])
        a = agg.setdefault(k, {"S": 0, "N": 0})
        a["S"] += 1
        a["N"] += r["n"]

    print()
    print("采样事件 %d 个（%d 断面 × %d 日期 × 2 方法）"
          % (len(agg), len(SITES), len(DATES)))
    print("观测记录 %d 条" % len(records))
    print()
    print("%-6s %-12s %-8s %5s %6s" % ("断面", "日期", "方法", "S", "N"))
    for (sid, date, mk), a in sorted(agg.items()):
        print("%-6s %-12s %-8s %5d %6d" % (sid, date, mk, a["S"], a["N"]))

    doc = {
        "meta": {
            "label": "演示数据集（合成，非实测）",
            "disclaimer": (
                "本数据集为**合成数据**，用于验证指数计算方法学，不是任何河流的实测结果。"
                "分类单元取自本平台参考库（分类学真实），个体数与生物量为按固定随机种子生成的模拟值。"
                "不得用于计算多样性指数以外的任何用途，不得作为调查结论、评价结论或报告数据引用。"
            ),
            "seed": SEED,
            "generator": "scripts/gen-observation-demo.py",
            "taxonPool": "pages/species-data.js",
            "synthesis": (
                "类群抽选：从参考库对应分类群池中均匀随机抽选（不假定任何耐污等级）；"
                "物种数 S = round(3 + 13q)（底栖）/ round(3 + 14q)（鱼类），q 为断面质量分；"
                "个体数 n_i ∝ exp(N(0, σ))，σ = 1.45 − 0.85q，再按各事件总个体数归一取整；"
                "生物量 = 个体数 × 按类群抽定的单个体重量。"
            ),
            "limitation": (
                "因抽选不假定耐污等级，本数据集只能验证纯计数类指数（Shannon / Simpson / Margalef / Pielou / EPT%）；"
                "不能验证依赖耐污值或赋分表的指数（BI / FBI / IBD / IBI）。"
                "另：参考库底栖名录中 EPT 类群仅纹石蛾科 1 条，EPT% 在本数据集上恒接近 0，"
                "该指数当前不可用，须先补录蜉蝣目 / 襀翅目 / 毛翅目名录。"
            ),
            "notSuitableFor": [
                "作为任何断面、任何河流的实测结果引用",
                "用于评价保护成效或支撑管理决策",
                "作为报告或论文的数据来源",
            ],
        },
        "sites": SITES,
        "dates": DATES,
        "records": records,
    }

    if args.dry:
        print()
        print("（dry 模式，未写盘）")
        return

    header = (
        "/* 演示观测数据集 —— 合成数据，非实测。\n"
        " *\n"
        " * 生成脚本：scripts/gen-observation-demo.py（随机种子 %d，可复现）\n"
        " * 分类单元来源：pages/species-data.js（真实分类学名）\n"
        " * 个体数 / 生物量：按对数正态分布合成的模拟值\n"
        " *\n"
        " * 用途：仅用于验证指数计算方法学（证明公式与汇总口径可跑通）。\n"
        " * 禁止：作为实测结果、调查结论、评价结论引用；禁止用于支撑管理决策。\n"
        " * 局限：抽选未假定耐污等级，故不可用于验证 BI / FBI / IBD / IBI 等依赖赋分表的指数。\n"
        " *\n"
        " * 详见 meta.disclaimer / meta.synthesis / meta.limitation。\n"
        " */\n" % SEED
    )
    out = header + "window.OBSERVATION_DEMO = %s;\n" % json.dumps(doc, ensure_ascii=False, indent=1)
    io.open(OUT_JS, "w", encoding="utf-8").write(out)
    print()
    print("已写出 %s" % OUT_JS)


if __name__ == "__main__":
    main()
