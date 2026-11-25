
# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pptx import Presentation
from pptx.util import Inches
import pptlib
from pptlib import *
import pages_a, pages_b, pages_c

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

order = [pages_a.s01_cover, pages_a.s02_agenda, pages_a.s03_flow, pages_a.s04_query,
         pages_a.s05_explain, pages_b.s06_rule, pages_b.s07_curve, pages_b.s08_arch,
         pages_c.s09_code_map, pages_c.s10_code_eval, pages_c.s11_advantage, pages_c.s12_trend]

NOTES = [
    "开场（30 秒）：这份系统解决的是「评分经验无法复算」的问题。107 款基准机型、132 个评分节点、94 项测试项，每一分都能追溯。",
    "汇报主线（20 秒）：六部分按序展开。前两部分是重点，占一半时间；后面四部分各半分钟。",
    "功能介绍一（50 秒）：五个环节是一个闭环。左边是真实录入界面，右边说明为工程使用做的五件事——尤其是「数据不完整不输出正式总分」。",
    "功能介绍二（50 秒）：评审最关心的两件事——谁强谁弱、差在哪。左边天梯图加雷达图看梯队与长短项，右边五维筛选加评分区间可以直接圈出候选。",
    "功能介绍三（40 秒）：规则不是黑盒。测试方法页把曲线、分布、实测样本、映射证据摆在一起；管理端有三级权限和规则版本留痕。",
    "评分机制一（45 秒）：八个维度逐层加权，权重来自工程师拆解和 107 款数据反推的双源融合。五步法就是从经验到规则的路径。",
    "评分机制二（45 秒）：这是全场最硬的一张图。37 个实测锚点连成曲线，107 款逐款验证，104 款误差不超过 0.1 分。",
    "软件框架（30 秒）：五层分层，核心层是纯函数、零依赖，所以能离线跑、能单测、能被脚本直接调用。",
    "代码介绍一（30 秒）：94 项测试值形态各异，但对内只暴露一个入口函数，四条分支互斥。范围外不外推，只做限幅预估并打警告。",
    "代码介绍二（30 秒）：缺项不补零，而是按实际参与项重归一——这是分数可信的关键。同一份引擎被四条链路复用。",
    "主要优势（40 秒）：五组对比，本质是把老师傅脑子里的经验变成组织资产。新人照系统算，结果和老工程师一致，而且有证据链。",
    "趋势与总结（40 秒）：171 天，四个里程碑，从 0 到 1。下一步九条路线，重点是规则自动升级、版本治理和质量看板。结论一句话：评测从个人经验升级为可复算、可追溯、可复用的数据资产。",
]

for i, fn in enumerate(order):
    s = fn(prs)
    chrome(s, wordmark=(fn is not pages_a.s01_cover))
    s.notes_slide.notes_text_frame.text = NOTES[i]

cp = prs.core_properties
cp.title = "BOE Rtings 评测系统 · 项目结项汇报"
cp.subject = "企业内部汇报 · 约 5 分钟"
cp.author = "S02 软件开发组"
cp.keywords = "评分系统;规则引擎;可追溯;数据资产"
cp.comments = "全部为原生可编辑文本框/形状/图片/图表"

out = OUT
prs.save(out)
print("SAVED", out, os.path.getsize(out))