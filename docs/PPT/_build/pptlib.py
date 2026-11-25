
# -*- coding: utf-8 -*-
import os, sys
from PIL import Image
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR, MSO_AUTO_SIZE
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from lxml import etree

BASE = r"D:\01_HJ_Work\00_Person\04_Project\08_Rtings-Calculate\docs\PPT"
SHOTS = os.path.join(BASE, "_shots")
OUT = os.path.join(BASE, "BOE Rtings评测系统-项目汇报.pptx")

BLUE   = "005BBB"
BLUE_D = "00418A"
NAVY   = "0B2E59"
DARK   = "1F1F1F"
TEXT   = "404040"
GRAY   = "7F7F7F"
GRAY2  = "A6A6A6"
BORDER = "BFBFBF"
LINE_L = "D9D9D9"
LIGHT  = "F2F2F2"
PALE   = "EAF2FB"
WHITE  = "FFFFFF"
FONT   = "Microsoft YaHei"
MONO   = "Consolas"

AMAP = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER, "r": PP_ALIGN.RIGHT, "j": PP_ALIGN.JUSTIFY}
VANCH = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}


def _font(run, name=FONT, size=None, bold=None, color=None, italic=None, spc=None):
    f = run.font
    if size is not None: f.size = Pt(size)
    if bold is not None: f.bold = bold
    if italic is not None: f.italic = italic
    if color is not None: f.color.rgb = RGBColor.from_string(color)
    f.name = name
    rPr = run._r.get_or_add_rPr()
    for tag in ("a:ea", "a:cs"):
        el = rPr.find(qn(tag))
        if el is None:
            el = etree.SubElement(rPr, qn(tag))
        el.set("typeface", name)
    if spc is not None:
        rPr.set("spc", str(int(spc * 100)))


def _frame(shape, anchor="t", pad=(0, 0, 0, 0), wrap=True):
    tf = shape.text_frame
    tf.word_wrap = wrap
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.margin_left = Inches(pad[0]); tf.margin_top = Inches(pad[1])
    tf.margin_right = Inches(pad[2]); tf.margin_bottom = Inches(pad[3])
    tf.vertical_anchor = VANCH[anchor]
    return tf


def box(slide, x, y, w, h, fill=None, line=None, lw=0.75, shape=MSO_SHAPE.RECTANGLE, dash=None):
    s = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    s.shadow.inherit = False
    if fill:
        s.fill.solid(); s.fill.fore_color.rgb = RGBColor.from_string(fill)
    else:
        s.fill.background()
    if line:
        s.line.color.rgb = RGBColor.from_string(line); s.line.width = Pt(lw)
        if dash:
            s.line.dash_style = dash
    else:
        s.line.fill.background()
    _frame(s, "m")
    return s


def T(slide, x, y, w, h, text, size=11, bold=False, color=TEXT, align="l",
      anchor="t", line=1.12, font=FONT, italic=False, spc=None, pad=(0, 0, 0, 0)):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = _frame(tb, anchor, pad)
    p = tf.paragraphs[0]
    p.alignment = AMAP[align]
    p.line_spacing = line
    p.space_before = Pt(0); p.space_after = Pt(0)
    r = p.add_run(); r.text = text
    _font(r, font, size, bold, color, italic, spc)
    return tb


def R(slide, x, y, w, h, paras, size=11, color=TEXT, align="l", anchor="t",
      line=1.18, gap=2.0, font=FONT):
    """paras: list of list of (text, dict)"""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = _frame(tb, anchor)
    first = True
    for para in paras:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = AMAP[align]
        p.line_spacing = line
        p.space_before = Pt(0); p.space_after = Pt(gap)
        for txt, opt in para:
            r = p.add_run(); r.text = txt
            _font(r, opt.get("font", font), opt.get("size", size), opt.get("bold", False),
                  opt.get("color", color), opt.get("italic", False), opt.get("spc"))
    return tb


def bar(slide, x, y, w, text, h=0.30, size=12, fill=BLUE, color=WHITE):
    s = box(slide, x, y, w, h, fill=fill)
    tf = _frame(s, "m", pad=(0.10, 0, 0.06, 0))
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.LEFT
    r = p.add_run(); r.text = text
    _font(r, FONT, size, True, color)
    return s


def panel(slide, x, y, w, h, fill=None, line=LINE_L):
    return box(slide, x, y, w, h, fill=fill, line=line, lw=0.75)


def chip(slide, x, y, w, h, text, size=10, bold=True, fill=LIGHT, color=TEXT,
         line=None, align="c", lw=0.6):
    s = box(slide, x, y, w, h, fill=fill, line=line, lw=lw)
    tf = _frame(s, "m", pad=(0.06, 0.02, 0.06, 0.02))
    p = tf.paragraphs[0]; p.alignment = AMAP[align]; p.line_spacing = 1.0
    r = p.add_run(); r.text = text
    _font(r, FONT, size, bold, color)
    return s


def arrow(slide, x, y, w, h, shape=MSO_SHAPE.RIGHT_ARROW, fill=WHITE, line=GRAY2):
    s = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    s.shadow.inherit = False
    if fill: s.fill.solid(); s.fill.fore_color.rgb = RGBColor.from_string(fill)
    else: s.fill.background()
    s.line.color.rgb = RGBColor.from_string(line); s.line.width = Pt(0.75)
    return s


def pic(slide, path, x, y, w=None, h=None):
    iw, ih = Image.open(path).size
    ar = ih / iw
    if w is not None and h is None: h = w * ar
    elif h is not None and w is None: w = h / ar
    return slide.shapes.add_picture(path, Inches(x), Inches(y), Inches(w), Inches(h))


def vline(slide, x, y, h, color=LINE_L):
    return box(slide, x, y, 0.012, h, fill=color)


def hline(slide, x, y, w, color=LINE_L, lw=0.75):
    s = slide.shapes.add_connector(1, Inches(x), Inches(y), Inches(x + w), Inches(y))
    s.line.color.rgb = RGBColor.from_string(color); s.line.width = Pt(lw)
    return s


PAGE = {"n": 0}


def chrome(slide, wordmark=True):
    if wordmark:
        T(slide, 9.95, 0.30, 2.93, 0.42, "BOE Rtings", size=16, bold=True,
          color=DARK, align="r", anchor="m", spc=1.2)
        T(slide, 9.95, 0.66, 2.93, 0.22, "评测系统", size=8, color=GRAY2, align="r", anchor="m", spc=2.0)
    PAGE["n"] += 1
    n = PAGE["n"]
    if n > 1:
        T(slide, 0.45, 7.10, 6.0, 0.24, "S02 软件开发组  ｜  内部资料 · 注意保密", size=7.5, color=GRAY2, anchor="m")
        T(slide, 11.90, 7.10, 0.98, 0.24, "%02d / 12" % n, size=7.5, color=GRAY2, align="r", anchor="m")


def title(slide, num, text):
    tb = slide.shapes.add_textbox(Inches(0.45), Inches(0.24), Inches(9.6), Inches(0.64))
    tf = _frame(tb, "m")
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.LEFT
    r1 = p.add_run(); r1.text = num + "  "
    _font(r1, "Times New Roman", 26, True, BLUE)
    r2 = p.add_run(); r2.text = text
    _font(r2, FONT, 25, True, DARK)
    hline(slide, 0.45, 0.97, 12.43, LINE_L, 0.9)


def new(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])
