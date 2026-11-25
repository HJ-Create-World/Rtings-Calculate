
# -*- coding: utf-8 -*-
import os
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE
from pptlib import *

SHOTS = r"D:\01_HJ_Work\00_Person\04_Project\08_Rtings-Calculate\docs\PPT\_shots"


def s01_cover(prs):
    s = new(prs)
    # left blue rule
    box(s, 0.0, 0.0, 0.16, 7.5, fill=BLUE)
    # right screenshot
    p = os.path.join(SHOTS, "history.png")
    ph = 3.30
    pw = ph * 16 / 9
    x = 13.333 - 0.55 - pw
    y = 1.86
    box(s, x - 0.10, y - 0.10, pw + 0.20, ph + 0.20, fill=WHITE, line=LINE_L, lw=0.75)
    pic(s, p, x, y, w=pw, h=ph)

    T(s, 0.78, 1.05, 6.2, 0.28, "项 目 结 项 汇 报   ·   2 0 2 6 . 1 1", size=10.5, bold=True,
      color=BLUE, anchor="m", spc=1.0)
    T(s, 0.75, 1.40, 6.9, 0.72, "BOE Rtings 评测系统", size=40, bold=True, color=NAVY, anchor="m")
    T(s, 0.78, 2.22, 6.6, 0.40, "把不可复算的评分经验，变成可审计的工程系统", size=17, bold=True,
      color=BLUE, anchor="m")
    hline(s, 0.78, 2.78, 5.55, BLUE, 2.2)
    R(s, 0.78, 2.98, 5.5, 1.55, [
        [("一个覆盖「测试录入 — 规则评分 — 云端沉淀 — 对比分析 — 报告导出」的", {"size": 11.5, "color": TEXT})],
        [("企业内部统一评分工作台：107 款基准机型、132 个评分节点、94 项可录入测试项，", {"size": 11.5, "color": TEXT})],
        [("每一分都可复算、可追溯、可解释。", {"size": 11.5, "color": TEXT, "bold": True})],
    ], line=1.6, gap=0)

    # metainfo
    meta = [("汇 报 单 位", "S02 软件开发组"), ("汇 报 人", "邹代好  林艺霖  傅鸿钧"),
            ("项 目 周 期", "2026-06-01 — 2026-11-18 · 171 天")]
    yy = 4.86
    for k, v in meta:
        T(s, 0.78, yy, 1.35, 0.26, k, size=8.5, color=GRAY2, anchor="m", spc=1.2)
        T(s, 2.12, yy, 4.3, 0.26, v, size=10.5, color=TEXT, anchor="m")
        yy += 0.36

    # KPI strip
    ky = 6.10
    box(s, 0.78, ky, 11.98, 0.94, fill=LIGHT, line=None)
    kpis = [("107", "基准机型", "官方实测得分可核对"), ("440", "测试数据列", "20261117 数据快照"),
            ("132", "评分节点", "8 大维度 / 规则 v3.0"), ("94", "可录入测试项", "91 客观 + 3 主观"),
            ("17", "自动化测试", "核心引擎回归")]
    w = 11.98 / 5
    for i, (num, name, note) in enumerate(kpis):
        cx = 0.78 + i * w
        T(s, cx + 0.20, ky + 0.12, 1.0, 0.40, num, size=21, bold=True, color=BLUE, anchor="m")
        T(s, cx + 0.20 + 0.78, ky + 0.12, 1.3, 0.20, name, size=9.5, bold=True, color=DARK, anchor="m")
        T(s, cx + 0.20 + 0.78, ky + 0.34, 1.35, 0.18, note, size=7.2, color=GRAY, anchor="m")
        if i: vline(s, cx, ky + 0.14, 0.66, LINE_L)
    return s


def s02_agenda(prs):
    s = new(prs)
    title(s, "00", "汇报主线")
    items = [
        ("01", "功能介绍", "7 个业务页面 + 2 类管理模块，覆盖录入到报告全流程", "2 min"),
        ("02", "评分机制", "五步法建规则；数据分段 → 锚点 → 曲线，逐款验证", "1.5 min"),
        ("03", "软件框架", "五层分层架构 + 单一职责的评分核心", "0.5 min"),
        ("04", "代码介绍", "客观项统一入口、可重归一聚合两段核心实现", "0.5 min"),
        ("05", "主要优势", "五组「过去 → 现在」的对比与价值量化", "0.5 min"),
        ("06", "趋势与总结", "四个里程碑、九条路线、下一步计划", "0.5 min"),
    ]
    x0, y0 = 0.45, 1.24
    cw, ch = 6.00, 1.22
    for i, (num, name, desc, t) in enumerate(items):
        col, row = i % 2, i // 2
        x = x0 + col * (cw + 0.43)
        y = y0 + row * (ch + 0.13)
        box(s, x, y, cw, ch, fill=WHITE, line=LINE_L)
        box(s, x, y, 0.055, ch, fill=BLUE)
        T(s, x + 0.20, y + 0.20, 0.62, 0.36, num, size=18, bold=True, color=BLUE, anchor="m",
          font="Times New Roman")
        T(s, x + 0.82, y + 0.20, 3.4, 0.30, name, size=14, bold=True, color=DARK, anchor="m")
        T(s, x + 4.30, y + 0.22, 1.45, 0.24, "约 " + t, size=8.5, color=GRAY2, align="r", anchor="m")
        T(s, x + 0.82, y + 0.56, cw - 1.05, 0.52, desc, size=9.8, color=TEXT, line=1.3)

    y = 5.78
    hline(s, 0.45, y - 0.14, 12.43, LINE_L)
    notes = [("事实口径", "所有指标取自当前源码与文档：规则 v3.0 / 数据快照 20261117 / 应用 v0.1.0"),
             ("演示方式", "配图为系统真实运行截图，非示意图"),
             ("汇报时长", "约 5 分钟，六部分按序展开")]
    cw3 = 12.43 / 3
    for i, (k, v) in enumerate(notes):
        x = 0.45 + i * cw3
        T(s, x, y, 1.05, 0.24, k, size=8.5, bold=True, color=BLUE, anchor="m")
        T(s, x + 0.95, y - 0.02, cw3 - 1.08, 0.52, v, size=8.8, color=GRAY, line=1.28, anchor="t")
    return s


def s03_flow(prs):
    s = new(prs)
    title(s, "01", "功能介绍 ｜ 从测试录入到评审看板的完整闭环")
    steps = [("①", "数据录入", "手工录入 / Excel 批量导入\n94 项测试值分维度展开"),
             ("②", "实时计算", "规则引擎逐节点打分\n右侧侧栏实时给总分"),
             ("③", "云端沉淀", "评测记录 + 数据快照\n按规则版本绑定存档"),
             ("④", "查询对比", "筛选 / 天梯 / 雷达\n多维对比与贡献拆解"),
             ("⑤", "报告导出", "带明细与计算追踪\n的 Excel 报告")]
    x = 0.45
    w, gap = 2.30, 0.28
    for i, (n, name, desc) in enumerate(steps):
        cx = x + i * (w + gap)
        box(s, cx, 1.22, w, 1.24, fill=PALE, line="CFE0F5")
        T(s, cx + 0.14, 1.30, 0.34, 0.30, n, size=13, bold=True, color=BLUE, anchor="m")
        T(s, cx + 0.50, 1.30, w - 0.62, 0.30, name, size=11.5, bold=True, color=NAVY, anchor="m")
        T(s, cx + 0.14, 1.64, w - 0.26, 0.72, desc, size=8.3, color=TEXT, line=1.30)
        if i < 4:
            arrow(s, cx + w + 0.045, 1.70, 0.19, 0.26, fill=BLUE, line=BLUE)

    ph = 7.30 * 9 / 16
    p = os.path.join(SHOTS, "entry.png")
    box(s, 0.45, 2.62, 7.30, ph, fill=WHITE, line=LINE_L)
    pic(s, p, 0.45, 2.62, w=7.30)
    T(s, 0.48, 6.80, 7.2, 0.22, "▲ 评分录入工作台：左「产品档案」右「实时计算」，未填满 94 项不输出正式总分",
      size=7.6, color=GRAY2, anchor="m")

    px = 7.98
    panel(s, px, 2.62, 4.90, 4.18, fill=WHITE, line=LINE_L)
    bar(s, px, 2.62, 4.90, "录入侧：为工程使用而设计", h=0.34, size=11)
    rows = [("结构化产品档案", "品牌 / 型号 / 测试日期 / 工程师 / 尺寸 / 屏幕 / 背光 7 项必填，杜绝脏数据"),
            ("实时计算侧栏", "边填边算，当前总分、完成度、缺失项一目了然"),
            ("Excel 批量导入", "复用工程师既有台账格式，一次导入整批机型"),
            ("不自动补零", "数据不完整即判「不完整」，不输出可被误读的分数"),
            ("三级权限", "数据查看 / 评分录入 / 测试方法 按角色分模块授权")]
    yy = 3.06
    for i, (k, v) in enumerate(rows):
        T(s, px + 0.22, yy, 0.14, 0.20, "▪", size=8, color=BLUE, anchor="m")
        T(s, px + 0.40, yy, 4.30, 0.22, k, size=9.8, bold=True, color=DARK, anchor="m")
        T(s, px + 0.40, yy + 0.22, 4.30, 0.42, v, size=8.4, color=GRAY, line=1.22)
        yy += 0.72
    return s


def s04_query(prs):
    s = new(prs)
    title(s, "01", "功能介绍 ｜ 面向评审的查询、对比与归因")
    pw = 6.02
    ph = pw * 9 / 16
    imgs = [(0.45, "charts-ladder.png", "排名与画像", "Mixed Usage 总分天梯图 + 7 维雷达，一眼看出梯队与长短项"),
            (6.86, "comparison.png", "筛选与对比", "5 维属性筛选 + 评分区间滑块 + 筛选预设 + 对比组模板")]
    for x, fn, k, v in imgs:
        T(s, x, 1.16, 3.0, 0.26, k, size=11.5, bold=True, color=NAVY, anchor="m")
        box(s, x, 1.46, pw, ph, fill=WHITE, line=LINE_L)
        pic(s, os.path.join(SHOTS, fn), x, 1.46, w=pw)
        T(s, x, 1.46 + ph + 0.08, pw, 0.40, v, size=8.6, color=GRAY, line=1.25)

    y = 5.30
    hline(s, 0.45, y - 0.12, 12.43, LINE_L)
    stats = [("6 台", "同屏对比上限", "总分 + 7 维 + 94 项明细同表对齐"),
             ("44 台", "单次筛选结果", "品牌/年份/尺寸/屏幕/背光 5 维组合筛选"),
             ("0.1 分", "排序精度", "总分保留一位小数，天梯图按 0.1 分排序"),
             ("1 键", "报告导出", "明细表 + 计算追踪 + 图表一次导出")]
    cw = 12.43 / 4
    for i, (num, k, v) in enumerate(stats):
        x = 0.45 + i * cw
        T(s, x, y, 1.30, 0.42, num, size=19, bold=True, color=BLUE, anchor="m")
        T(s, x + 1.24, y + 0.03, cw - 1.30, 0.22, k, size=9.5, bold=True, color=DARK, anchor="m")
        T(s, x, y + 0.52, cw - 0.30, 0.62, v, size=8.4, color=GRAY, line=1.3)
        if i: vline(s, x - 0.16, y + 0.06, 1.10, LINE_L)
    return s


def s05_explain(prs):
    s = new(prs)
    title(s, "01", "功能介绍 ｜ 规则可解释、权限可治理")
    pw = 6.06
    # left: methods
    ph1 = pw * 2000 / 3200
    T(s, 0.45, 1.14, 3.2, 0.26, "测试方法与评分规则", size=11.5, bold=True, color=NAVY, anchor="m")
    box(s, 0.45, 1.44, pw, ph1, fill=WHITE, line=LINE_L)
    pic(s, os.path.join(SHOTS, "methods-full.png"), 0.45, 1.44, w=pw)
    T(s, 0.45, 1.44 + ph1 + 0.06, pw, 0.30, "▲ 规则曲线与 107 款实测样本叠加，规则「凭什么这么给分」可当场追问",
      size=8.4, color=GRAY, line=1.2)

    ph2 = pw * 2000 / 3200
    T(s, 6.82, 1.14, 3.2, 0.26, "账号、权限与版本治理", size=11.5, bold=True, color=NAVY, anchor="m")
    box(s, 6.82, 1.44, pw, ph2, fill=WHITE, line=LINE_L)
    pic(s, os.path.join(SHOTS, "admin-users.png"), 6.82, 1.44, w=pw)
    T(s, 6.82, 1.44 + ph2 + 0.06, pw, 0.30, "▲ 三级角色 × 三类模块权限，封禁与活跃会话可管可查",
      size=8.4, color=GRAY, line=1.2)

    y = 5.72
    hline(s, 0.45, y - 0.14, 12.43, LINE_L)
    cards = [("规则与方法可视化", "评分曲线 / 数据分布 / 实测样本 / 映射证据，测试方法按 9 段结构化"),
             ("数据快照与规则版本", "数据快照、规则快照、差异报告、激活回滚日志全程留痕"),
             ("AI 辅助审阅与草稿", "规则差异自动比对；规则草稿先跑 107 款基线回归再上架")]
    cw = 12.43 / 3
    for i, (k, v) in enumerate(cards):
        x = 0.45 + i * cw
        T(s, x, y, 0.20, 0.24, "◆", size=9, color=BLUE, anchor="m")
        T(s, x + 0.26, y, cw - 0.5, 0.24, k, size=10.5, bold=True, color=DARK, anchor="m")
        T(s, x, y + 0.30, cw - 0.35, 0.82, v, size=8.6, color=GRAY, line=1.32)
        if i: vline(s, x - 0.16, y + 0.04, 1.05, LINE_L)
    return s