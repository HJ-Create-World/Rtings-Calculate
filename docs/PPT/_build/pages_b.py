
# -*- coding: utf-8 -*-
import os
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE
from pptx.chart.data import XyChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION, XL_TICK_LABEL_POSITION
from pptlib import *

SHOTS = r"D:\01_HJ_Work\00_Person\04_Project\08_Rtings-Calculate\docs\PPT\_shots"

ANCHORS = [(185,1.6),(209,1.9),(225.8,2),(252.8,2.2),(272,2.4),(285,2.5),(302.6,2.7),(325.9,2.9),
           (345,3),(381.3,3.3),(408.6,3.6),(427,3.7),(448,3.9),(458,4),(463,4),(539,4.7),(561,4.8),
           (647,5.5),(677,5.7),(719,6),(751.3,6.2),(787.1,6.4),(799,6.5),(804,6.5),(873.5,6.9),
           (933.7,7.2),(968,7.4),(1004,7.5),(1026,7.6),(1041,7.7),(1060,7.7),(1074,7.8),(1114,7.9),
           (1194,8.2),(1401,9),(1501,9.3),(2085,10)]


def s06_rule(prs):
    s = new(prs)
    title(s, "02", "评分机制 ｜ 一条可复算的规则树，八个维度逐层加权")
    # left: weights
    T(s, 0.45, 1.12, 5.6, 0.26, "规则树：1 个根节点 → 8 个主维度 → 132 个节点", size=10.5, bold=True, color=NAVY, anchor="m")
    weights = [("Brightness 亮度", 0.25, "HDR 0.7 / SDR 0.3"),
               ("Black Level 黑位", 0.22, "对比度 / 均匀性 / 分区"),
               ("Color 色彩", 0.22, "HDR / SDR 色容积 / 校准"),
               ("Motion Handling 运动", 0.10, "拖影 / 24p / 抖动"),
               ("Processing 处理", 0.07, "缩放 / 去噪 / 梯度"),
               ("Game Mode 游戏响应", 0.07, "输入延迟 / 支持度"),
               ("Direct Reflections 直射反射", 0.05, "抗反光处理"),
               ("Ambient Black 环境黑电平", 0.02, "环境光下黑位抬升")]
    y = 1.44
    for i, (name, wgt, sub) in enumerate(weights):
        T(s, 0.45, y, 2.28, 0.22, name, size=8.6, bold=True, color=TEXT, anchor="m")
        box(s, 2.80, y + 0.045, 1.70 * wgt / 0.25, 0.13, fill=BLUE if i < 3 else "8FB8E0", line=None)
        T(s, 2.80 + 1.70 * wgt / 0.25 + 0.06, y + 0.015, 0.62, 0.19, "%d%%" % round(wgt * 100),
          size=8.4, bold=True, color=BLUE, anchor="m")
        T(s, 5.06, y, 2.55, 0.22, sub, size=7.4, color=GRAY2, anchor="m")
        y += 0.34
    T(s, 0.45, y + 0.02, 7.1, 0.24, "权重来源：工程师人工拆解（Excel 权重树）× 107 款 CSV 得分反推，双源融合后逐款回归校准",
      size=7.6, color=GRAY, line=1.2)

    # drill-down chain
    T(s, 0.45, 4.42, 7.1, 0.24, "一条叶子怎么落到分数：权重逐层相乘，最终只占 3.5%", size=9.4, bold=True, color=NAVY, anchor="m")
    chain = [("Mixed Usage", "根节点 · 总分"), ("Brightness 亮度", "一级 · 权重 25%"),
             ("HDR 亮度", "二级 · 权重 70%"), ("Hallway Lights", "叶子 · 权重 20%")]
    cx = 0.45
    for i, (k, v) in enumerate(chain):
        box(s, cx, 4.74, 1.58, 0.70, fill=PALE if i < 3 else "DCE9F8", line="CFE0F5")
        T(s, cx + 0.10, 4.80, 1.38, 0.24, k, size=8.2, bold=True, color=NAVY, anchor="m")
        T(s, cx + 0.10, 5.06, 1.38, 0.22, v, size=7.2, color=GRAY, anchor="m")
        if i < 3:
            arrow(s, cx + 1.62, 5.02, 0.20, 0.16, fill=BLUE, line=BLUE)
        cx += 1.82
    T(s, 0.45, 5.54, 7.15, 0.24,
      "有效权重 25% × 70% × 20% = 3.5%，37 个锚点决定这一段的曲线形状（下一页展开）", size=7.8, color=GRAY, line=1.2)

    # accuracy band
    yb = 5.94
    hline(s, 0.45, yb - 0.10, 7.15, LINE_L)
    acc = [("104 / 107", "款误差 ≤ 0.1 分"), ("96.6%", "分档与人工一致 767/794"), ("17 项", "自动化测试守护")]
    cw3 = 7.15 / 3
    for i, (n, k) in enumerate(acc):
        x = 0.45 + i * cw3
        T(s, x, yb + 0.02, cw3 - 0.12, 0.34, n, size=15, bold=True, color=BLUE, anchor="m")
        T(s, x, yb + 0.36, cw3 - 0.12, 0.24, k, size=7.6, color=GRAY, anchor="m")

    # right: five steps
    px = 7.86
    panel(s, px, 1.12, 5.02, 4.78, fill=WHITE, line=LINE_L)
    bar(s, px, 1.12, 5.02, "五步法：把「评分经验」变成「可执行规则」", h=0.34, size=10.5)
    steps = [("① 人工拆解", "工程师 Excel 8 个工作表：维度、权重、打分范围、7/8 分门槛"),
             ("② 数据集反推", "107 款 × 440 列官方实测与得分，反推每个测试项的得分曲线"),
             ("③ 双源融合", "客观项锚点插值 / 类别映射 / 主观项直评 / 缺失重归一 / 范围外线性预估"),
             ("④ 回归校准", "逐款复算总分，与官方得分比对，误差超标即回到 ③"),
             ("⑤ 全链路追踪", "每个节点输出取值来源、命中映射、贡献分与警告，可逐层下钻")]
    y = 1.62
    for i, (k, v) in enumerate(steps):
        T(s, px + 0.22, y, 5.02 - 0.44, 0.22, k, size=9.8, bold=True, color=BLUE, anchor="m")
        T(s, px + 0.22, y + 0.23, 5.02 - 0.44, 0.50, v, size=8.3, color=TEXT, line=1.28)
        y += 0.78
    hline(s, px + 0.22, 5.30, 4.58, LINE_L)
    T(s, px + 0.22, 5.38, 4.58, 0.44,
      "规则 v3.0 · 2026-11-06 定版　｜　聚合 renormalize · 缺失 renormalize · 舍入 0.1",
      size=7.4, color=GRAY2, line=1.25)
    return s


def s07_curve(prs):
    s = new(prs)
    title(s, "02", "评分机制 ｜ 从数据分段到得分曲线")
    # chart
    T(s, 0.45, 1.10, 7.6, 0.26, "以 Hallway Lights 为例：37 个实测锚点 → 线性插值 → 连续得分曲线（横轴 cd/m²，纵轴 0–10 分）",
      size=9.4, bold=True, color=NAVY, anchor="m")
    cd = XyChartData()
    ser = cd.add_series("Hallway Lights")
    for x, yv in ANCHORS:
        ser.add_data_point(x, yv)
    gf = s.shapes.add_chart(XL_CHART_TYPE.XY_SCATTER_LINES_NO_MARKERS, Inches(0.45), Inches(1.40),
                            Inches(7.60), Inches(3.86), cd)
    ch = gf.chart
    ch.has_legend = False
    ch.has_title = True
    ch.chart_title.text_frame.text = ""
    ch.font.size = Pt(8); ch.font.name = FONT; ch.font.color.rgb = RGBColor.from_string(GRAY)
    for ax in (ch.category_axis,):
        ax.has_major_gridlines = False
        ax.tick_labels.font.size = Pt(8); ax.tick_labels.font.name = FONT
        ax.minimum_scale = 0; ax.maximum_scale = 2200; ax.major_unit = 500
        ax.format.line.color.rgb = RGBColor.from_string(BORDER)
    va = ch.value_axis
    va.has_major_gridlines = True
    va.major_gridlines.format.line.color.rgb = RGBColor.from_string("EDEDED")
    va.major_gridlines.format.line.width = Pt(0.5)
    va.minimum_scale = 0; va.maximum_scale = 10; va.major_unit = 2
    va.tick_labels.font.size = Pt(8); va.tick_labels.font.name = FONT
    va.format.line.color.rgb = RGBColor.from_string(BORDER)
    plot = ch.plots[0]
    plot.gap_width = 0
    plot.smooth = False
    sr = plot.series[0]
    sr.format.line.color.rgb = RGBColor.from_string(BLUE)
    sr.format.line.width = Pt(2.0)

    T(s, 0.45, 5.32, 7.60, 0.24, "数据点即 107 款官方实测样本；两条锚点之间线性插值，范围外不外推、只做限幅预估并打警告",
      size=7.6, color=GRAY2, anchor="m", line=1.2)
    T(s, 0.45, 5.62, 7.60, 0.24, "样本覆盖 185 cd/m²（1.6 分）到 2085 cd/m²（10 分），两端都不靠拍脑袋补点",
      size=7.6, color=GRAY2, anchor="m", line=1.2)

    # three boundary cases
    yb = 6.00
    cases = [("范围内：线性插值", "落在两锚点之间，按比例取分，无警告"),
             ("范围外：限幅预估", "取最近两锚点斜率外延，限幅 0–10 并报 EXTRAPOLATED_SCORE"),
             ("缺项：重归一", "该子项不计入分母，父项按剩余权重重新归一")]
    cw = 7.60 / 3
    for i, (k, v) in enumerate(cases):
        x = 0.45 + i * cw
        box(s, x, yb, cw - 0.12, 0.86, fill=WHITE, line=LINE_L)
        box(s, x, yb, 0.035, 0.86, fill=BLUE)
        T(s, x + 0.16, yb + 0.08, cw - 0.30, 0.22, k, size=8.0, bold=True, color=NAVY, anchor="m")
        T(s, x + 0.16, yb + 0.32, cw - 0.30, 0.46, v, size=7.0, color=GRAY, line=1.2)

    # right: mapping kinds
    px = 8.22
    T(s, px, 1.10, 4.66, 0.26, "四种映射方式覆盖全部 93 条映射", size=10.5, bold=True, color=NAVY, anchor="m")
    kinds = [("锚点插值 anchors", "55 条", "连续量按实测锚点线性插值，范围外不外推"),
             ("区间匹配 intervals", "3 条", "档位制指标，如分区控光对比度按区间给分"),
             ("类别映射 categorical", "16 条", "是/否、模式等离散取值精确匹配"),
             ("人工直评 identity", "19 条", "主观项 0–10 直接作为得分")]
    y = 1.42
    for k, n, v in kinds:
        box(s, px, y, 4.66, 0.90, fill=LIGHT if False else WHITE, line=LINE_L)
        box(s, px, y, 0.045, 0.90, fill=BLUE)
        T(s, px + 0.18, y + 0.10, 3.1, 0.22, k, size=9.4, bold=True, color=DARK, anchor="m")
        T(s, px + 3.10, y + 0.10, 1.38, 0.22, n, size=9.0, bold=True, color=BLUE, align="r", anchor="m")
        T(s, px + 0.18, y + 0.40, 4.30, 0.42, v, size=8.0, color=GRAY, line=1.22)
        y += 0.98

    # evidence bar
    y = 5.42
    hline(s, px, y - 0.14, 4.66, LINE_L)
    T(s, px, y, 4.66, 0.22, "证据等级：A 精确验证 85 条 · C 仅结构有据 8 条", size=8.6, bold=True, color=DARK, anchor="m")
    bx = px
    segs = [(85, BLUE, "A 85"), (8, "9DC3E6", "C 8")]
    tot = 93.0
    for n, col, lab in segs:
        w = 4.66 * n / tot
        box(s, bx, y + 0.30, w, 0.22, fill=col, line=None)
        if n > 20:
            T(s, bx, y + 0.30, w, 0.22, lab, size=7.6, bold=True, color=WHITE, align="c", anchor="m")
        bx += w
    T(s, px, y + 0.56, 4.66, 0.40, "A 级 = 用 107 款官方得分逐款验证，最大误差 ≤0.1；C 级 = 权重或阈值仅来自工程师拆解",
      size=7.0, color=GRAY2, line=1.18)
    return s


def s08_arch(prs):
    s = new(prs)
    title(s, "03", "软件框架 ｜ 五层分层架构与单一职责的评分核心")
    layers = [("应用层", "页面与交互", ["Rtings评分 / 详细参数 / 维度对比", "评分录入 / 云端数据 / 测试方法", "系统介绍 / 系统管理"]),
              ("核心层", "纯函数，不依赖 UI", ["evaluateRule 规则聚合", "mapObjectiveValue 映射", "types 领域模型"]),
              ("服务层", "与外部世界打交道", ["cloud 云端评测", "auth 账号与权限", "ruleAdministration 版本管理", "aiReview 差异审阅"]),
              ("状态层", "组合式函数复用", ["useScoring 评分", "useComparison 对比", "useAuth 鉴权", "useRuleRuntime 规则"]),
              ("数据层", "规则与基准", ["规则 v3.0：132 节点 / 93 映射", "基准：107 款 × 440 列", "本机草稿 / 云端快照"])]
    y = 1.12
    for i, (name, role, items) in enumerate(layers):
        h = 0.84
        box(s, 0.45, y, 2.06, h, fill=BLUE if i == 1 else PALE, line=None)
        T(s, 0.58, y + 0.16, 1.86, 0.28, name, size=12, bold=True,
          color=WHITE if i == 1 else NAVY, anchor="m")
        T(s, 0.58, y + 0.48, 1.86, 0.26, role, size=7.6,
          color=WHITE if i == 1 else GRAY, anchor="m")
        bx = 2.62
        bw = (7.55 - 0.10 * (len(items) - 1)) / len(items)
        for j, it in enumerate(items):
            box(s, bx, y + 0.06, bw, h - 0.12, fill=WHITE, line=LINE_L)
            T(s, bx + 0.10, y + 0.10, bw - 0.20, h - 0.20, it, size=8.0, color=TEXT, line=1.22, anchor="m")
            bx += bw + 0.10
        y += h + 0.08

    # right: tech stack + principles
    px = 10.36
    panel(s, px, 1.12, 2.52, 4.86, fill=WHITE, line=LINE_L)
    bar(s, px, 1.12, 2.52, "技术选型", h=0.32, size=9.8)
    stack = ["前端框架 Vue 3 + Router", "语言 TypeScript", "构建 Vite", "样式 Tailwind CSS 4",
             "图表 Chart.js", "表格 ExcelJS / xlsx", "测试 Vitest + vue-tsc", "部署 静态托管 + 云函数"]
    yy = 1.54
    for it in stack:
        T(s, px + 0.16, yy, 2.24, 0.30, it, size=8.0, color=TEXT, line=1.2)
        yy += 0.38
    hline(s, px + 0.16, yy - 0.06, 2.22, LINE_L)
    T(s, px + 0.16, yy + 0.04, 2.24, 0.66, "核心层零依赖：可离线跑、可单元测试、可被脚本直接调用",
      size=7.4, color=GRAY, line=1.25)

    # bottom principles
    y = 6.02
    hline(s, 0.45, y - 0.14, 9.70, LINE_L)
    prin = [("输入不落计算", "云端只存输入快照，总分永远按规则重算"),
            ("规则即数据", "132 节点与 93 映射全部 JSON 化，改规则不改代码"),
            ("警告不吞掉", "16 类规则警告随结果返回，前端原样呈现"),
            ("离线可用", "本机草稿 + 内置基准，断网仍可录入与对比")]
    cw = 9.70 / 4
    for i, (k, v) in enumerate(prin):
        x = 0.45 + i * cw
        T(s, x, y, cw - 0.18, 0.22, k, size=9.0, bold=True, color=BLUE, anchor="m")
        T(s, x, y + 0.28, cw - 0.22, 0.52, v, size=7.8, color=GRAY, line=1.24)
    return s