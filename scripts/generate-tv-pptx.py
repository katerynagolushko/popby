#!/usr/bin/env python3
"""Generate editable Hangbyme TV attract screen PowerPoint (matches /tv)."""

from __future__ import annotations

import io
import re
import uuid
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

import qrcode
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_AUTO_SIZE, PP_ALIGN
from pptx.util import Inches, Pt

# Brand tokens (globals.css + src/app/tv/page.tsx)
PAPER = RGBColor(0xF2, 0xEF, 0xE9)
NAVY = RGBColor(0x1A, 0x1F, 0x36)
ACCENT = RGBColor(0xFF, 0x57, 0x22)
NAVY_80 = RGBColor(0x45, 0x49, 0x5A)
NAVY_70 = RGBColor(0x5B, 0x5D, 0x6C)

FONT_DISPLAY = "Syne"
FONT_BODY = "IBM Plex Sans"
FONT_BODY_MEDIUM = "IBM Plex Sans Medium"

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_DIR = Path(__file__).resolve().parent
FONTS_DIR = SCRIPT_DIR / "fonts"
OUTPUT = ROOT / "Hangbyme-TV-Screen.pptx"
LOGO = ROOT / "public" / "email-logo.png"
QR_URL = "https://hangby.me"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

ET.register_namespace("p", P_NS)
ET.register_namespace("r", R_NS)
ET.register_namespace("", REL_NS)


def set_slide_bg(slide, color: RGBColor) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_run(paragraph, text: str, *, font_name: str, size: Pt, bold: bool, color: RGBColor):
    run = paragraph.add_run()
    run.text = text
    run.font.name = font_name
    run.font.size = size
    run.font.bold = bold
    run.font.color.rgb = color
    return run


def add_textbox(
    slide,
    left,
    top,
    width,
    height,
    text: str,
    *,
    font_name: str = FONT_BODY,
    font_size: Pt = Pt(18),
    bold: bool = False,
    color: RGBColor = NAVY,
    align: PP_ALIGN = PP_ALIGN.LEFT,
):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    p = tf.paragraphs[0]
    p.alignment = align
    add_run(p, text, font_name=font_name, size=font_size, bold=bold, color=color)
    return box


def generate_qr_buffer(url: str) -> io.BytesIO:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=12,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1a1f36", back_color="#f2efe9")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def _next_rid(existing_ids: set[str]) -> str:
    n = 1
    while True:
        rid = f"rId{n}"
        if rid not in existing_ids:
            return rid
        n += 1


def embed_fonts(pptx_path: Path, fonts: list[dict]) -> None:
    """Embed TTF fonts into an existing .pptx via OOXML (Mac-safe, editable text)."""
    with zipfile.ZipFile(pptx_path, "r") as zin:
        archive = {name: zin.read(name) for name in zin.namelist()}

    pres_path = "ppt/presentation.xml"
    rels_path = "ppt/_rels/presentation.xml.rels"
    content_types_path = "[Content_Types].xml"

    pres_root = ET.fromstring(archive[pres_path])
    rels_root = ET.fromstring(archive[rels_path])
    ct_root = ET.fromstring(archive[content_types_path])

    existing_rids = {
        rel.attrib["Id"]
        for rel in rels_root.findall(f"{{{REL_NS}}}Relationship")
    }

    font_list = pres_root.find(f"{{{P_NS}}}embeddedFontLst")
    if font_list is None:
        font_list = ET.Element(f"{{{P_NS}}}embeddedFontLst")
        pres_root.insert(0, font_list)

    font_index = 1
    for spec in fonts:
        typeface = spec["typeface"]
        font_entry = ET.SubElement(font_list, f"{{{P_NS}}}embeddedFont")
        ET.SubElement(
            font_entry,
            f"{{{P_NS}}}font",
            {
                "typeface": typeface,
                "panose": "020B0604020202020204",
                "pitchFamily": "34",
                "charset": "-122",
            },
        )

        for variant, key in (("regular", "regular"), ("bold", "bold")):
            ttf_path = spec.get(key)
            if ttf_path is None:
                continue

            font_guid = uuid.uuid4()
            font_bytes = Path(ttf_path).read_bytes()
            # PresentationML stores raw font bytes (no Word-style obfuscation).
            font_filename = f"font{font_index}.fntdata"
            font_part = f"ppt/fonts/{font_filename}"
            archive[font_part] = font_bytes

            rid = _next_rid(existing_rids)
            existing_rids.add(rid)

            ET.SubElement(
                rels_root,
                f"{{{REL_NS}}}Relationship",
                {
                    "Id": rid,
                    "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/font",
                    "Target": f"fonts/{font_filename}",
                },
            )

            variant_el = ET.SubElement(font_entry, f"{{{P_NS}}}{variant}")
            variant_el.set(f"{{{R_NS}}}id", rid)
            variant_el.set("fontKey", "{" + str(font_guid).upper() + "}")

            ET.SubElement(
                ct_root,
                f"{{{CT_NS}}}Override",
                {
                    "PartName": f"/{font_part}",
                    "ContentType": "application/vnd.openxmlformats-officedocument.obfuscatedFont",
                },
            )
            font_index += 1

    archive[pres_path] = ET.tostring(pres_root, encoding="utf-8", xml_declaration=True)
    archive[rels_path] = ET.tostring(rels_root, encoding="utf-8", xml_declaration=True)
    archive[content_types_path] = ET.tostring(ct_root, encoding="utf-8", xml_declaration=True)

    with zipfile.ZipFile(pptx_path, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for name, data in archive.items():
            zout.writestr(name, data)


def ensure_fonts() -> None:
    """Download brand fonts into scripts/fonts/ if missing."""
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    sources = {
        "Syne-Bold.ttf": "https://fonts.gstatic.com/s/syne/v24/8vIS7w4qzmVxsWxjBZRjr0FKM_3fvj6k.ttf",
        "IBMPlexSans-Regular.ttf": "https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1swZSAXcomDVmadSD6llzAA.ttf",
        "IBMPlexSans-Medium.ttf": "https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1swZSAXcomDVmadSD2FlzAA.ttf",
    }
    try:
        import urllib.request

        for filename, url in sources.items():
            dest = FONTS_DIR / filename
            if dest.exists() and dest.stat().st_size > 1000:
                continue
            print(f"Downloading {filename}...")
            urllib.request.urlretrieve(url, dest)
    except Exception as exc:  # noqa: BLE001
        raise SystemExit(f"Font download failed: {exc}") from exc


def build_slide(prs: Presentation) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, PAPER)

    half_w = SLIDE_W / 2
    left_pad = Inches(0.6)  # ~4.5vw
    content_w = half_w - left_pad - Inches(0.35)

    # Vertically center the left column block (~matches /tv flex justify-center).
    brand_top = Inches(1.62)
    logo_size = Inches(0.5)
    slide.shapes.add_picture(str(LOGO), left_pad, brand_top, logo_size, logo_size)

    wordmark_box = slide.shapes.add_textbox(
        left_pad + logo_size + Inches(0.12),
        brand_top + Inches(0.02),
        Inches(2.6),
        Inches(0.55),
    )
    wordmark_tf = wordmark_box.text_frame
    wordmark_tf.word_wrap = False
    wordmark_p = wordmark_tf.paragraphs[0]
    add_run(wordmark_p, "Hangby", font_name=FONT_DISPLAY, size=Pt(32), bold=True, color=NAVY)
    add_run(wordmark_p, "me", font_name=FONT_DISPLAY, size=Pt(32), bold=True, color=ACCENT)

    headline_top = brand_top + Inches(0.72)
    headline_box = slide.shapes.add_textbox(left_pad, headline_top, content_w, Inches(2.55))
    headline_tf = headline_box.text_frame
    headline_tf.word_wrap = True
    headline_tf.auto_size = MSO_AUTO_SIZE.NONE
    headline_p = headline_tf.paragraphs[0]
    headline_p.line_spacing = 1.02
    headline_p.space_after = Pt(0)

    # Match src/app/tv/page.tsx: orange on "first startup" and "IRL".
    add_run(headline_p, "The ", font_name=FONT_DISPLAY, size=Pt(50), bold=True, color=NAVY)
    add_run(
        headline_p,
        "first startup\n",
        font_name=FONT_DISPLAY,
        size=Pt(50),
        bold=True,
        color=ACCENT,
    )
    add_run(
        headline_p,
        "social network\nfor ",
        font_name=FONT_DISPLAY,
        size=Pt(50),
        bold=True,
        color=NAVY,
    )
    add_run(headline_p, "IRL", font_name=FONT_DISPLAY, size=Pt(50), bold=True, color=ACCENT)

    subcopy_top = headline_top + Inches(2.48)
    add_textbox(
        slide,
        left_pad,
        subcopy_top,
        content_w,
        Inches(1.1),
        "See who's free nearby and meet in person spontaneously.",
        font_name=FONT_BODY_MEDIUM,
        font_size=Pt(24),
        bold=False,
        color=NAVY_80,
    )

    # QR region (~half viewport, centered).
    qr_outer = Inches(4.55)
    qr_card_left = half_w + (half_w - qr_outer) / 2
    qr_card_top = Inches(0.95)

    qr_frame = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        qr_card_left,
        qr_card_top,
        qr_outer,
        qr_outer,
    )
    qr_frame.fill.solid()
    qr_frame.fill.fore_color.rgb = PAPER
    qr_frame.line.color.rgb = ACCENT
    qr_frame.line.width = Pt(3)
    try:
        qr_frame.line.fill.transparency = 0.3  # border-accent/70
    except AttributeError:
        pass

    qr_pad = Inches(0.2)
    qr_img_size = qr_outer - 2 * qr_pad
    slide.shapes.add_picture(
        generate_qr_buffer(QR_URL),
        qr_card_left + qr_pad,
        qr_card_top + qr_pad,
        qr_img_size,
        qr_img_size,
    )

    label_w = Inches(4.8)
    label_left = half_w + (half_w - label_w) / 2
    label_top = qr_card_top + qr_outer + Inches(0.32)

    add_textbox(
        slide,
        label_left,
        label_top,
        label_w,
        Inches(0.55),
        "Scan to join the waitlist",
        font_name=FONT_DISPLAY,
        font_size=Pt(26),
        bold=True,
        color=NAVY,
        align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide,
        label_left,
        label_top + Inches(0.42),
        label_w,
        Inches(0.34),
        "hangby.me",
        font_name=FONT_BODY_MEDIUM,
        font_size=Pt(18),
        bold=False,
        color=NAVY_70,
        align=PP_ALIGN.CENTER,
    )


def verify_embedded_fonts(pptx_path: Path) -> list[str]:
    with zipfile.ZipFile(pptx_path, "r") as zf:
        font_parts = [n for n in zf.namelist() if n.startswith("ppt/fonts/")]
        pres = zf.read("ppt/presentation.xml").decode("utf-8")
        typefaces = re.findall(r'typeface="([^"]+)"', pres)
        return sorted(set(typefaces + [Path(p).name for p in font_parts]))


def main() -> None:
    ensure_fonts()

    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    build_slide(prs)

    tmp_path = OUTPUT.with_suffix(".tmp.pptx")
    prs.save(tmp_path)

    embed_fonts(
        tmp_path,
        [
            {"typeface": FONT_DISPLAY, "regular": FONTS_DIR / "Syne-Bold.ttf"},
            {"typeface": FONT_BODY, "regular": FONTS_DIR / "IBMPlexSans-Regular.ttf"},
            {
                "typeface": FONT_BODY_MEDIUM,
                "regular": FONTS_DIR / "IBMPlexSans-Medium.ttf",
            },
        ],
    )
    tmp_path.replace(OUTPUT)

    embedded = verify_embedded_fonts(OUTPUT)
    print(OUTPUT.resolve())
    print("Embedded:", ", ".join(embedded))


if __name__ == "__main__":
    main()
