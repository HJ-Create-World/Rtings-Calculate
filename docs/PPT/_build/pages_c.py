
# -*- coding: utf-8 -*-
import os
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_AUTO_SIZE
from pptlib import *
from pptlib import _font

SHOTS = r"D:\01_HJ_Work\00_Person\04_Project\08_Rtings-Calculate\docs\PPT\_shots"


def codeblock(s, x, y, w, lines, size=9.2, h=None):
    h = h or (0.180 * len(lines) + 0.30)
    box(s, x, y, w, h, fill="1E1E1E", line=None)
    box(s, x, y, 0.035, h, fill=BLUE, line=None)
    tb = s.shapes.add_textbox(Inches(x + 0.12), Inches(y + 0.08), Inches(w - 0.24), Inches(h - 0.16))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
    first = True
    for parts in lines:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.line_spacing = 1.14
        p.space_before = Pt(0); p.space_after = Pt(0)
        for txt, col in parts:
            r = p.add_run(); r.text = txt
            _font(r, MONO, size, False, col)
    return h


C_KW = "569CD6"; C_STR = "CE9178"; C_CMT = "6A9955"; C_FN = "DCDCAA"; C_TXT = "D4D4D4"; C_NUM = "B5CEA8"; C_TYPE = "4EC9B0"


def s09_code_map(prs):
    s = new(prs)
    title(s, "04", "代码介绍 ｜ 客观项统一入口：一条 value 走完四种映射")
    T(s, 0.45, 1.10, 7.6, 0.24, "src/core/mapping.ts  ·  L257–285  mapObjectiveValue",
      size=9.2, bold=True, color=NAVY, anchor="m")
    lines = [
        [("export function ", C_KW), ("mapObjectiveValue", C_FN), ("(mapping: ", C_TXT), ("ObjectiveMapping", C_TYPE), (",", C_TXT)],
        [("  value: ", C_TXT), ("number", C_TYPE), (" | ", C_TXT), ("null", C_KW), (", text?: ", C_TXT), ("string", C_TYPE), ("): ", C_TXT), ("MappingTrace", C_TYPE), (" {", C_TXT)],
        [("  const kind = mapping.kind ?? (mapping.intervals ? 'intervals' : 'anchors');", C_TXT)],
        [("  if (kind === 'categorical') return mapByCategorical(mapping, text);", C_TXT)],
        [("  if (value === null) {", C_TXT)],
        [("    // 文本里的 ∞ / inf 视为无穷大，交给区间表兜底", C_CMT)],
        [("    return mapByIntervals(mapping, Number.POSITIVE_INFINITY);", C_TXT)],
        [("  }", C_TXT)],
        [("  if (kind === 'anchors') return mapByAnchors(mapping, value);", C_TXT)],
        [("  if (kind === 'identity') return mapByIdentity(value);", C_TXT)],
        [("  return mapByIntervals(mapping, value);", C_TXT)],
        [("}", C_TXT)],
    ]
    h = codeblock(s, 0.45, 1.40, 7.62, lines, size=9.2)
    T(s, 0.45, 1.40 + h + 0.06, 7.62, 0.22, "§ 四条分支互斥、无嵌套：入口只做路由，具体算法各自独立可测",
      size=7.4, color=GRAY2, anchor="m")

    # anchors snippet
    y2 = 1.40 + h + 0.38
    T(s, 0.45, y2, 7.6, 0.24, "锚点插值与范围外限幅（mapByAnchors，L123–172 节选）", size=9.2, bold=True, color=NAVY, anchor="m")
    lines2 = [
        [("if (value < anchors[0].value || value > anchors[anchors.length - 1].value) {", C_TXT)],
        [("  const slope = (pointB.score - pointA.score) / (pointB.value - pointA.value);", C_TXT)],
        [("  const estimated = pointA.score + slope * (value - pointA.value);", C_TXT)],
        [("  const clamped = Math.min(10, Math.max(0, estimated));", C_TXT)],
        [("  return { scoreTenths: clamped * 10, estimated: true, warning: 'EXTRAPOLATED_SCORE' };", C_TXT)],
        [("}", C_TXT)],
        [("const ratio = (value - lower.value) / (upper.value - lower.value);", C_TXT)],
        [("return { scoreTenths: (lower.score + ratio * (upper.score - lower.score)) * 10 };", C_TXT)],
    ]
    codeblock(s, 0.45, y2 + 0.28, 7.62, lines2, size=9.2)

    # right: explanation
    px = 8.28
    T(s, px, 1.10, 4.60, 0.26, "这段代码解决什么问题", size=10.5, bold=True, color=NAVY, anchor="m")
    items = [("统一入口", "94 项测试值形态各异（数值 / 类别 / 主观分），但对外只暴露一个函数签名"),
             ("不外推", "超出实测范围不硬编，取最近两锚点斜率外延后限幅 0–10，并打 EXTRAPOLATED_SCORE 警告"),
             ("区间语义明确", "「下含上不含」写进 matchesLower / matchesUpper，相邻区间不会重复计分"),
             ("冲突可见", "多区间命中报 OVERLAP_INTERVALS，规则写错在录入时就暴露，而不是给出一个错的分数")]
    y = 1.44
    for k, v in items:
        box(s, px, y, 4.60, 0.92, fill=WHITE, line=LINE_L)
        box(s, px, y, 0.045, 0.92, fill=BLUE)
        T(s, px + 0.18, y + 0.10, 4.2, 0.22, k, size=9.2, bold=True, color=DARK, anchor="m")
        T(s, px + 0.18, y + 0.38, 4.22, 0.48, v, size=7.9, color=GRAY, line=1.24)
        y += 1.00

    y = 5.60
    hline(s, px, y - 0.12, 4.60, LINE_L)
    T(s, px, y, 4.60, 0.22, "规则自检：validateMapping", size=9.4, bold=True, color=DARK, anchor="m")
    T(s, px, y + 0.28, 4.60, 0.78,
      "对区间表做两两重叠检测，相邻且两侧都不含边界的情况不算重叠；问题在规则加载期即报出，不等到录入。",
      size=7.9, color=GRAY, line=1.26)

    # bottom strip
    yb = 6.46
    box(s, 0.45, yb, 12.43, 0.52, fill=LIGHT, line=None)
    T(s, 0.62, yb, 3.1, 0.52, "17 项自动化测试覆盖这几条分支", size=8.6, bold=True, color=NAVY, anchor="m")
    T(s, 3.70, yb, 9.0, 0.52,
      "锚点精确命中 / 区间内插值 / 范围外限幅 / 区间重叠报错 / 类别未命中 / 循环依赖拦截 —— 改完规则先跑测试，再上页面",
      size=7.8, color=GRAY, anchor="m")
    return s


def s10_code_eval(prs):
    s = new(prs)
    title(s, "04", "代码介绍 ｜ 可重归一的聚合：缺项也不让权重失衡")
    T(s, 0.45, 1.10, 7.6, 0.24, "src/core/evaluate.ts  ·  L177–205  renormalize 分支",
      size=9.2, bold=True, color=NAVY, anchor="m")
    lines = [
        [("const weightSum = ", C_TXT), ("contributing", C_TXT), (".reduce((t, i) => t + i.child.weight!, 0);", C_TXT)],
        [("const weightedSum = contributing.reduce(", C_TXT)],
        [("  (t, i) => t + i.child.weight! * i.evaluation.value!, 0);", C_TXT)],
        [("const normalized = weightSum > 0 ? weightedSum / weightSum : 0;", C_TXT)],
        [("", C_TXT)],
        [("// 贡献分：这一项对父项总分的绝对贡献", C_CMT)],
        [("i.evaluation.contributionToParent =", C_TXT)],
        [("  (i.child.weight! * i.evaluation.value!) / weightSum;", C_TXT)],
        [("", C_TXT)],
        [("return { nodeId, status: 'scored',", C_TXT)],
        [("  value: roundToStep(normalized, policy.roundingStep),", C_TXT)],
        [("  partialValue: normalized, children, warnings };", C_TXT)],
    ]
    h = codeblock(s, 0.45, 1.40, 7.62, lines, size=7.4)
    T(s, 0.45, 1.40 + h + 0.06, 7.62, 0.22, "§ 权重和不为 1 时按实际参与项重归一，并回报 WEIGHT_SUM_NOT_ONE；excelSum 模式则原样照抄 Excel",
      size=7.4, color=GRAY2, anchor="m")

    y2 = 1.40 + h + 0.40
    T(s, 0.45, y2, 7.6, 0.24, "为什么不能直接加权求和", size=9.2, bold=True, color=NAVY, anchor="m")
    # mini diagram: weights
    bx, by = 0.45, y2 + 0.30
    box(s, bx, by, 7.62, 1.44, fill=WHITE, line=LINE_L)
    # 3 children
    kids = [("Hallway Lights", 0.20, "9.2", True), ("Peak 2%", 0.125, "9.4", True),
            ("Peak 100%", 0.05, "6.5", True), ("ABL 主观", 0.175, "—", False)]
    cx = bx + 0.16
    for name, w, val, ok in kids:
        col = PALE if ok else "F7F7F7"
        box(s, cx, by + 0.14, 1.66, 0.82, fill=col, line="CFE0F5" if ok else LINE_L)
        T(s, cx + 0.08, by + 0.20, 1.50, 0.22, name, size=8.2, bold=True, color=DARK if ok else GRAY2, anchor="m")
        T(s, cx + 0.08, by + 0.44, 1.50, 0.22, "权重 %.3f  得分 %s" % (w, val), size=7.4,
          color=GRAY if ok else GRAY2, anchor="m")
        T(s, cx + 0.08, by + 0.66, 1.50, 0.20, "计入" if ok else "缺失·不计入", size=7.2, bold=True,
          color=BLUE if ok else "C00000", anchor="m")
        cx += 1.80
    # bracket & result
    T(s, bx + 0.16, by + 1.02, 4.6, 0.24,
      "Σ权重 = 0.375（不足 1）→ 除以 0.375 重归一，而非按 1 硬算", size=7.8, color=TEXT, anchor="m")
    T(s, bx + 5.06, by + 1.00, 2.40, 0.30, "总分不受缺失项拖低", size=8.6, bold=True, color=BLUE, align="r", anchor="m")

    # right column: guarantees
    px = 8.28
    T(s, px, 1.10, 4.60, 0.26, "四道工程保证", size=10.5, bold=True, color=NAVY, anchor="m")
    g = [("缺项不补零", "缺失项不计入分母，避免「没测 = 0 分」把总分拉低"),
         ("贡献可拆解", "每个叶子都算出对根的绝对贡献分，天梯图与归因直接读这一列"),
         ("舍入集中一处", "roundToStep 统一按聚合策略的 roundingStep（0.1）收口，不在各处零散保留小数"),
         ("规则先验后算", "validateRule 先查重复 ID、父项缺失、无映射、循环依赖，坏规则不给算")]
    y = 1.44
    for k, v in g:
        T(s, px, y, 0.18, 0.22, "◆", size=8, color=BLUE, anchor="m")
        T(s, px + 0.24, y, 4.36, 0.22, k, size=9.2, bold=True, color=DARK, anchor="m")
        T(s, px + 0.24, y + 0.26, 4.36, 0.62, v, size=7.9, color=GRAY, line=1.26)
        y += 0.94

    y = 5.44
    hline(s, px, y - 0.12, 4.60, LINE_L)
    T(s, px, y, 4.60, 0.22, "被谁复用", size=9.4, bold=True, color=DARK, anchor="m")
    T(s, px, y + 0.28, 4.60, 1.10,
      "录入页实时总分、对比页 107 款批量复算、Excel 报告导出、规则草稿的 107 款基线回归——同一份 evaluateRule，四条链路共用一套算法。",
      size=7.9, color=GRAY, line=1.28)

    yb = 6.34
    box(s, 0.45, yb, 12.43, 0.56, fill=LIGHT, line=None)
    T(s, 0.62, yb, 3.0, 0.56, "一处聚合，四条链路复用", size=8.6, bold=True, color=NAVY, anchor="m")
    for i, t in enumerate(["录入实时总分", "对比页 107 款复算", "Excel 报告导出", "规则草稿基线回归"]):
        chip(s, 3.62 + i * 2.28, yb + 0.12, 2.10, 0.32, t, size=7.8, fill=WHITE, color=TEXT, line="CFE0F5")
    return s


def s11_advantage(prs):
    s = new(prs)
    title(s, "05", "主要优势 ｜ 五组「过去 → 现在」的确定性提升")
    rows = [("评分公式", "官方不公开，只能「凭经验给分」", "107 款反推锚点曲线，可复算、可追问、可回归"),
            ("规则维护", "散落在多个 Excel 与个人台账，改一处不知影响哪里", "规则 JSON 化：132 节点 / 93 映射，改规则不改代码"),
            ("评分过程", "人工查表、手工拼公式，一次算一台", "引擎自动聚合 + 缺失重归一 + 范围外预估 + 警告，一次算 107 台"),
            ("历史沉淀", "机型数据分散，复测与横比靠翻旧文件", "基准 / 云端 / 本机评测进统一产品库，随时对比、随时下钻"),
            ("汇报材料", "临时导表、手工拼图，口径难统一", "一键导出 5 个工作表：产品信息 / 评分汇总 / 测试项明细 / 计算追踪 / 总览图表")]
    # header
    hy = 1.16
    box(s, 0.45, hy, 1.60, 0.34, fill=LIGHT, line=None)
    T(s, 0.60, hy, 1.40, 0.34, "维度", size=9.2, bold=True, color=GRAY, anchor="m")
    box(s, 2.12, hy, 4.10, 0.34, fill=LIGHT, line=None)
    T(s, 2.28, hy, 3.80, 0.34, "过去：没有系统时", size=9.2, bold=True, color=GRAY, anchor="m")
    box(s, 6.52, hy, 6.36, 0.34, fill=BLUE, line=None)
    T(s, 6.68, hy, 6.00, 0.34, "现在：BOE Rtings 评测系统", size=9.2, bold=True, color=WHITE, anchor="m")
    y = hy + 0.40
    for i, (k, a, b) in enumerate(rows):
        h = 0.86
        box(s, 0.45, y, 12.43, h, fill=WHITE if i % 2 == 0 else "FBFBFB", line=LINE_L)
        box(s, 0.45, y, 1.60, h, fill=LIGHT, line=None)
        T(s, 0.60, y, 1.36, h, k, size=9.4, bold=True, color=DARK, anchor="m", line=1.2)
        T(s, 2.28, y, 4.10, h, a, size=8.6, color=GRAY, anchor="m", line=1.3)
        T(s, 6.02, y, 0.28, h, "→", size=12, bold=True, color=BLUE, align="c", anchor="m")
        T(s, 6.68, y, 6.02, h, b, size=8.8, color=TEXT, anchor="m", line=1.3)
        y += h + 0.055

    y = 6.34
    hline(s, 0.45, y - 0.06, 12.43, LINE_L)
    T(s, 0.45, y + 0.04, 12.43, 0.46,
      "价值口径：把「老师傅脑子里的评分经验」沉淀为组织资产——新人照系统就能算出与老工程师一致的分数，且每次计算都留下可审计的证据链。",
      size=9.2, bold=True, color=NAVY, line=1.22)
    return s


def s12_trend(prs):
    s = new(prs)
    title(s, "06", "趋势与总结 ｜ 从「能算」到「好用、可治、可推广」")
    # left: milestones
    T(s, 0.45, 1.10, 6.6, 0.26, "四个里程碑：171 天从 0 到 1", size=10.5, bold=True, color=NAVY, anchor="m")
    ms = [("06-01 ~ 11-03", "规则研究版", "数据采集 + Excel 拆解，反推锚点与权重"),
          ("11-04 ~ 11-05", "v0.1.0 评分核心", "规则基线、评分引擎、录入工作台与部署"),
          ("11-06", "规则 v3.0", "双源融合定版，云端闭环打通"),
          ("11-18", "当前迭代", "三级权限、规则版本管理、AI 差异审阅")]
    y = 1.44
    for i, (d, k, v) in enumerate(ms):
        # dot & line
        box(s, 0.62, y + 0.10, 0.10, 0.10, fill=BLUE, shape=MSO_SHAPE.OVAL)
        if i < 3:
            vline(s, 0.665, y + 0.22, 0.62, "CFE0F5")
        T(s, 0.88, y, 1.46, 0.24, d, size=8.0, bold=True, color=BLUE, anchor="m")
        T(s, 2.38, y, 2.0, 0.24, k, size=9.4, bold=True, color=DARK, anchor="m")
        T(s, 4.42, y - 0.02, 2.66, 0.52, v, size=7.8, color=GRAY, line=1.24)
        y += 0.78

    # engineering stats
    # status quote
    qy = 3.62
    box(s, 0.45, qy, 6.66, 0.86, fill=WHITE, line="CFE0F5")
    box(s, 0.45, qy, 0.045, 0.86, fill=BLUE)
    T(s, 0.66, qy + 0.08, 6.30, 0.22, "当前状态", size=8.4, bold=True, color=BLUE, anchor="m")
    T(s, 0.66, qy + 0.32, 6.28, 0.46,
      "v0.1.0 已部署运行，107 款基准全部可复算；当前迭代在补权限、规则版本与 AI 审阅，下一步转向规则治理与规模化。",
      size=7.8, color=TEXT, line=1.26)

    y = 4.72
    box(s, 0.45, y, 6.66, 1.52, fill=LIGHT, line=None)
    T(s, 0.62, y + 0.08, 6.3, 0.22, "工程量：一个人的团队做出了可交付的产品", size=9.0, bold=True, color=NAVY, anchor="m")
    stats = [("79", "Vue/TS 文件"), ("12,466", "行前端与核心代码"), ("96,904", "行规则与基准数据"),
             ("53", "次 Git 提交"), ("17", "项自动化测试")]
    cw = 6.42 / 3
    for i, (n, k) in enumerate(stats):
        col, row = i % 3, i // 3
        x = 0.62 + col * cw
        yy = y + 0.34 + row * 0.58
        T(s, x, yy, 1.30, 0.28, n, size=13.5, bold=True, color=BLUE, anchor="m")
        T(s, x, yy + 0.26, 1.95, 0.18, k, size=7.2, color=GRAY, anchor="m")

    # right: roadmap
    px = 7.42
    T(s, px, 1.10, 5.46, 0.26, "九条路线：下一步做什么", size=10.5, bold=True, color=NAVY, anchor="m")
    rm = [("规则自动升级闭环", "新数据进来自动建议映射调整，人工只做确认"),
          ("规则版本发布与回档", "发布、灰度、回滚，历史评测永不被改写"),
          ("质量看板与异常治理", "把警告、缺失、外推做成可监控的指标"),
          ("云端同步与筛选预设", "个人/团队预设跨设备复用"),
          ("大规模数据存储", "评测明细拆表，支撑千级机型与多年数据"),
          ("权限与数据安全", "更细粒度授权、审计日志与数据脱敏"),
          ("测试方法与规则可视化", "让不懂规则的人也能看懂曲线怎么来的"),
          ("自动化报告中心", "定时生成、按维度分发"),
          ("移动端录入", "产线/实验室现场随手记")]
    y = 1.44
    for i, (k, v) in enumerate(rm):
        col, row = i % 2, i // 2
        if i == 8:
            col = 0
        x = px + col * 2.76
        yy = y + row * 0.78
        T(s, x, yy, 0.20, 0.22, "▸", size=8, color=BLUE, anchor="m")
        T(s, x + 0.20, yy, 2.50, 0.22, k, size=8.2, bold=True, color=DARK, anchor="m")
        T(s, x + 0.20, yy + 0.24, 2.46, 0.46, v, size=7.0, color=GRAY, line=1.2)
    # summary band
    y = 6.38
    box(s, 0.45, y, 12.43, 0.62, fill=NAVY, line=None)
    T(s, 0.72, y, 11.9, 0.62,
      "结论：评测从「个人经验 + 手工表格」升级为「可复算的规则 + 可追溯的系统 + 可复用的数据资产」，具备向更多品类推广的基础。",
      size=10.2, bold=True, color=WHITE, anchor="m", line=1.2)
    return s