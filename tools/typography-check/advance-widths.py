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

    result = {
        "letterSpacingEm": LETTER_SPACING_EM,
        "rootPx": ROOT_PX,
        "rows": rows,
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


if __name__ == "__main__":
    main()
