#!/usr/bin/env python3
"""
Check C, Layer 1 — advance-width comparison between PP Telegraf Regular (400) and
Ultrabold (800). Discharges Req 11 c16.

Reads summed `hmtx` advances over `unitsPerEm` from the shipped binaries and adds the
declared 0.05em tracking per character, per design §5.4 Layer 1. Deterministic: no
browser, no font-loading window, no layout. It establishes the LABEL box only — the PILL
box depends on layout and belongs to Layer 2 (pill-measure.mjs).

Emits JSON on stdout so pbt-changeset2.test.mjs can assert against the §5.3 table.

Run: python3 advance-widths.py [--json]
"""

import json
import os
import sys

from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))

FACES = {
    "400": "PPTelegraf-Regular.otf",
    "800": "PPTelegraf-Ultrabold.otf",
}

# The seven labels named in task 16.2, as RENDERED (text-transform: uppercase).
LABELS = [
    ("PROJECTS", 0.8),
    ("CAD GALLERY", 0.8),
    ("READ MORE", 0.7),
    ("VIEW MODEL", 0.7),
    ("CSS", 0.55),
    ("AUTODESK INVENTOR", 0.55),
    ("WATERJET FABRICATION", 0.55),
]

# Change Set 3, design §6.2 (Req 16 c21, label-width half).
#
# The Nav_Panel_Toggle is 0.9rem by default and 0.8rem at `<=small` (<=736px), so MENU is
# measured at 0.8rem at 320px and 0.9rem at 768px — the only two widths where either
# element is not `display: none`. Both Nav_Panel_Links are 0.9rem throughout.
#
# These rows are kept SEPARATE from LABELS rather than folded into it, because LABELS
# carries one declared size per label and MENU carries two. Collapsing them would force a
# single size on MENU and quietly measure the wrong number at one of the two viewports.
NAV_PANEL_LABELS = [
    # (label, element, {viewport: declared rem})
    ("MENU", "Nav_Panel_Toggle", {320: 0.8, 768: 0.9}),
    ("PROJECTS", "Nav_Panel_Link", {320: 0.9, 768: 0.9}),
    ("CAD GALLERY", "Nav_Panel_Link", {320: 0.9, 768: 0.9}),
]

# The §6.2 derived table, asserted by Check C in properties-changeset3.test.mjs.
NAV_PANEL_EXPECTED_PX = {
    ("MENU", 320): (32.29, 35.21),
    ("MENU", 768): (39.97, 43.59),
    ("PROJECTS", 320): (64.52, 67.89),
    ("PROJECTS", 768): (70.99, 74.70),
    ("CAD GALLERY", 320): (85.21, 91.01),
    ("CAD GALLERY", 768): (93.76, 100.14),
}

# Declared root font-size steps (base/_typography.scss). 768 and 1024 share a step.
ROOT_PX = {320: 13.333, 768: 14.667, 1024: 14.667, 1440: 16.0}

# _font(letter-spacing-heading). Req 11 c8 makes this a FLOOR, not a free parameter: the
# tracking-reduction lever §3.5 used to buy width is gone, so any width shortfall must be
# absorbed by the box (§5.4), never by tighter tracking.
LETTER_SPACING_EM = 0.05


def load(weight):
    return TTFont(os.path.join(REPO, "assets", "webfonts", FACES[weight]))


def width_em(font, text, letter_spacing=LETTER_SPACING_EM):
    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    advances = 0
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None:
            raise SystemExit(f"glyph missing for {ch!r} (U+{ord(ch):04X})")
        advances += hmtx[gname][0]
    return advances / upm + letter_spacing * len(text)


def main():
    fonts = {w: load(w) for w in FACES}
    rows = []
    for label, size_rem in LABELS:
        w400 = width_em(fonts["400"], label)
        w800 = width_em(fonts["800"], label)
        rows.append(
            {
                "label": label,
                "fontSizeRem": size_rem,
                "em400": round(w400, 4),
                "em800": round(w800, 4),
                "increasePct": round((w800 / w400 - 1) * 100, 3),
                "px": {
                    str(vw): {
                        "w400": round(w400 * size_rem * root, 2),
                        "w800": round(w800 * size_rem * root, 2),
                    }
                    for vw, root in ROOT_PX.items()
                },
            }
        )

    # Change Set 3 — §6.2 nav panel rows, at their own per-viewport declared sizes.
    nav_rows = []
    for label, element, sizes in NAV_PANEL_LABELS:
        w400 = width_em(fonts["400"], label)
        w800 = width_em(fonts["800"], label)
        px = {}
        for vw, size_rem in sizes.items():
            root = ROOT_PX[vw]
            px[str(vw)] = {
                "fontSizeRem": size_rem,
                "w400": round(w400 * size_rem * root, 2),
                "w800": round(w800 * size_rem * root, 2),
                "deltaPx": round((w800 - w400) * size_rem * root, 2),
                "expected": list(NAV_PANEL_EXPECTED_PX[(label, vw)]),
            }
        nav_rows.append(
            {
                "label": label,
                "element": element,
                "em400": round(w400, 4),
                "em800": round(w800, 4),
                "increasePct": round((w800 / w400 - 1) * 100, 3),
                "px": px,
            }
        )

    result = {
        "letterSpacingEm": LETTER_SPACING_EM,
        "rootPx": ROOT_PX,
        "rows": rows,
        "navPanelRows": nav_rows,
        "increaseRangePct": [
            round(min(r["increasePct"] for r in rows), 3),
            round(max(r["increasePct"] for r in rows), 3),
        ],
    }

    if "--json" in sys.argv:
        json.dump(result, sys.stdout)
        return

    print("Check C, Layer 1 — PP Telegraf 400 -> 800 advance widths (Req 11 c16)")
    print(f"  letter-spacing {LETTER_SPACING_EM}em per character, from the shipped binaries\n")
    print(f"  {'label':22s} {'400':>9s} {'800':>9s} {'delta':>8s}")
    for r in rows:
        print(
            f"  {r['label']:22s} {r['em400']:8.3f}em {r['em800']:8.3f}em "
            f"{r['increasePct']:+7.2f}%"
        )
    lo, hi = result["increaseRangePct"]
    print(f"\n  measured range: {lo:+.2f}% .. {hi:+.2f}%  (design §5.3: +3.62% .. +8.5%)\n")

    print("  rendered label width, px (400 -> 800):")
    header = "  " + "label".ljust(22) + "size".rjust(6)
    for vw in ROOT_PX:
        header += f"{str(vw) + 'px':>18s}"
    print(header)
    for r in rows:
        line = "  " + r["label"].ljust(22) + f"{r['fontSizeRem']:>6}"
        for vw in ROOT_PX:
            cell = r["px"][str(vw)]
            line += f"{cell['w400']:8.1f} ->{cell['w800']:7.1f}"
        print(line)
    print()

    print("Change Set 3, §6.2 — nav panel labels (Req 16 c21, label-width half)")
    print("  MENU is 0.8rem at 320px (<=small) and 0.9rem at 768px; both links 0.9rem.\n")
    print(f"  {'label':14s} {'element':18s} {'vw':>5s} {'rem':>5s} {'400':>8s} {'800':>8s} {'delta':>8s} {'%':>7s}")
    for r in nav_rows:
        for vw, cell in r["px"].items():
            print(
                f"  {r['label']:14s} {r['element']:18s} {vw:>5s} {cell['fontSizeRem']:>5} "
                f"{cell['w400']:8.2f} {cell['w800']:8.2f} {cell['deltaPx']:+8.2f} {r['increasePct']:+6.2f}%"
            )
    print()


if __name__ == "__main__":
    main()
