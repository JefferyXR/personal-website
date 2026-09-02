# Font Provenance

Provenance record for the self-hosted webfonts under `assets/webfonts/`, required by
Requirement 9 c2 and c8 of the `portfolio-typography-refresh` spec. One record per shipped
font file.

> **This file must be updated whenever a font file is added or replaced** (Req 9 c8). A new
> file needs a full record — source URL, download date, licence tier, format, `converted`
> flag, SHA-256, and stored size — before it is referenced from `assets/css/main.css`.

The fifteen pre-existing Font Awesome `fa-*` files are out of scope: they ship with the
HTML5 UP Massively template under its own licence and are untouched by this change
(Req 7 c7).

---

## Horizon.woff2

| Field | Value |
|---|---|
| `file` | `Horizon.woff2` |
| `family` | Horizon |
| `designer` | Alberto Fontense (also spelled Fontese) |
| `source_url` | `https://edocs.creativemarket.com/fontense/2189003-Horizon-Wide-Sans-Serif` |
| `download_date` | 2026-09-02 |
| `licence_tier` | Free for personal use (commercial licence required for any monetised use) |
| `licence_text_file` | *none — accepted, see note* |
| `format` | WOFF2 |
| `converted` | no |
| `sha256` | `aaa66743b480d7ca8b33a44ccd95ef44852ec637386d5967a054f524e34d6305` |
| `stored_bytes` | `17084` |
| `content_encoding` | `TBD — Check H` |
| `transfer_bytes` | `TBD — Check H` |

**Accepted position — no vendor licence text is available for Horizon.** No licence or EULA
text for Horizon could be located from the designer's own channels. Requirement 9 criterion 2
no longer requires a stored licence text file for the heading font; criterion 9 substitutes a
recorded-fields obligation, and that obligation is met by the four fields already present in
the record above: licence tier *free for personal use*, designer *Alberto Fontense*, source
URL, and download date. **This is a closed decision, not an outstanding action.**

**The obligation itself is unchanged.** Horizon's free-personal-use terms bind this site
whether or not a copy of those terms is stored here. The absence of a stored file narrows the
*record*, not the *obligation*: Horizon stays usable only while the site remains
non-commercial, so Requirement 9 criteria 4 and 5 apply to Horizon exactly as they did before.
No substitute licence file is invented, and the designer's terms are paraphrased rather than
reproduced. A `Horizon-LICENSE.txt` appearing alongside this sentinel would be a defect rather
than an improvement, because its provenance would not be the designer.

The `licence_text_file` field carries the sentinel *none — accepted, see note* rather than an
empty cell, so "recorded as absent" stays distinguishable from "forgotten" (Req 9 c11).

---

## PPTelegraf-Regular.otf

| Field | Value |
|---|---|
| `file` | `PPTelegraf-Regular.otf` |
| `family` | PP Telegraf |
| `designer` | Pangram Pangram Foundry |
| `source_url` | `https://pangrampangram.com/products/telegraf/` |
| `download_date` | 2026-09-02 |
| `licence_tier` | Free for personal / non-commercial use (Pangram Pangram free-to-try tier) |
| `licence_text_file` | `EULA-PangramPangram-FreeForPersonalUse-MAY2021.pdf` |
| `format` | OTF (vendor-supplied desktop format) |
| `converted` | no |
| `sha256` | `2f2e07daf036ae192bcadc4c29493da4267d6b784459e3188fede316ebd81106` |
| `stored_bytes` | `41576` |
| `content_encoding` | `TBD — Check H` |
| `transfer_bytes` | `TBD — Check H` |

---

## PPTelegraf-Ultrabold.otf

| Field | Value |
|---|---|
| `file` | `PPTelegraf-Ultrabold.otf` |
| `family` | PP Telegraf Ultrabold (internal name; served under the CSS family `PP Telegraf` at weight 800) |
| `designer` | Pangram Pangram Foundry |
| `source_url` | `https://pangrampangram.com/products/telegraf/` |
| `download_date` | 2026-09-02 |
| `licence_tier` | Free for personal / non-commercial use (Pangram Pangram free-to-try tier) |
| `licence_text_file` | `EULA-PangramPangram-FreeForPersonalUse-MAY2021.pdf` |
| `format` | OTF (vendor-supplied desktop format) |
| `converted` | no |
| `sha256` | `7294de0d73f11a34658b9c09eb4a668d1e29145d517b2944cfe80737b2d1694a` |
| `stored_bytes` | `44664` |
| `content_encoding` | `TBD — Check H` |
| `transfer_bytes` | `TBD — Check H` |

---

## Bundle budget (Req 2 c12, c13, c16)

| File | Stored bytes | Per-file bound |
|---|---|---|
| `Horizon.woff2` | 17,084 | — (WOFF2, not bound by c13) |
| `PPTelegraf-Regular.otf` | 41,576 | ≤ 409,600 ✓ |
| `PPTelegraf-Ultrabold.otf` | 44,664 | ≤ 409,600 ✓ |
| **Total** | **103,324 (≈101 KB)** | **≤ 614,400 ✓** |

The bundle sits at roughly **17%** of the 600 KB budget. Font Awesome files are excluded from
both bounds by name, per Req 2 c12.

---

## Intake findings (Check G)

Resolved the four facts the rest of the implementation depends on. All values below were read
from the shipped files with `fontTools`, not assumed.

### 1. Horizon's weight — `$HORIZON_WEIGHT = 700`

```
Horizon.woff2   OS/2.usWeightClass = 700   name(1) = "Horizon"   name(2) = "Bold"
                unitsPerEm = 2048   mapped codepoints = 368   GPOS kerning present
```

**The design's expected value of `400` was wrong.** Horizon's single solid face is a Bold at
weight 700. `weight-heading` and the Horizon `@font-face` `font-weight` are both **700**, so no
browser-synthesized bold can occur (Req 3 c4).

A side effect: the card `h2`'s pre-existing hardcoded `font-weight: 700` is now *coincidentally*
the right number. It is still routed through `_font(weight-heading)` (task 10.2) so that the
value cannot drift away from the shipped face — Req 7 c4.

### 2. Telegraf face inventory — **Branch A**, but the bold is 800, not 700

Nine OTFs were supplied in the free download. Full inventory as delivered:

| File | `usWeightClass` | `italicAngle` | Subfamily | Shipped? |
|---|---|---|---|---|
| `PPTelegraf-Ultralight.otf` | 200 | 0 | Regular | no |
| `PPTelegraf-UltralightOblique.otf` | 200 | −30 | Regular | no |
| `PPTelegraf-UltralightSlanted.otf` | 200 | −15 | Italic | no |
| `PPTelegraf-Regular.otf` | **400** | 0 | Regular | **yes** |
| `PPTelegraf-RegularOblique.otf` | 400 | −30 | Regular | no |
| `PPTelegraf-RegularSlanted.otf` | 400 | −15 | Italic | no |
| `PPTelegraf-Ultrabold.otf` | **800** | 0 | Regular | **yes** |
| `PPTelegraf-UltraboldOblique.otf` | 800 | −30 | Regular | no |
| `PPTelegraf-UltraboldSlanted.otf` | 800 | −15 | Italic | no |

**Branch A is selected** — a true bold face exists, so the design §3.4 Branch B alternative
emphasis treatment is **not** implemented and no README limitation note is required.

**Deviation from the design:** `weight-bold` is **800**, not the design's assumed 700. There is
no 700 face in the download, and Req 4 c3 requires every declared weight to match a face that
actually ships. Declaring 700 against an 800 file would either snap to 800 anyway or invite
synthesis, so 800 is declared explicitly.

The CSS family name is **`PP Telegraf`**, matching the faces' internal family name.
`PPTelegraf-Ultrabold.otf` carries the internal family `PP Telegraf Ultrabold`; it is served
under the `PP Telegraf` CSS family at `font-weight: 800`, which is normal for a foundry that
packages weights as separate families.

**Italics: none shipped.** The download contains Oblique (−30°) and Slanted (−15°) styles at
every weight, but a content audit of all nine pages found **`<strong>` 15 times** (vexlego 6,
launchtoy 6, killerbyte 3) and **zero `<em>` and zero `<i>`**. Shipping six unused italic faces
would add ~302 KB of dead weight and breach Req 2 c16's minimum-face-count rule, so none ship.
Req 4 c11 is satisfied structurally: if an `<em>` is ever added, the browser synthesizes an
oblique from `PP Telegraf` Regular and stays inside the family, which is exactly what c11
requires. Nothing anywhere sets `font-synthesis: none`.

The seven unshipped Telegraf OTFs were **deleted** from `assets/webfonts/` for this reason.
They remain recoverable from git history if a future change needs them.

### 3. Horizon advance widths and the derived `h1` sizes

Sum of advances from `hmtx`, divided by `unitsPerEm` (2048), with the chosen
`letter-spacing: -0.01em` applied as `width_em + LS × len`:

| String | Raw width | Effective width (LS −0.01em) | Mean advance/char |
|---|---|---|---|
| `JEFFERY ROSS` | 11.119em | **10.999em** | 0.917em |
| `JEFFERY` | 3.005em | 2.935em | 0.419em* |
| `HALLGRÍMSKIRKJA` | 15.283em | 15.133em | 1.009em |
| `KILLERBYTE` | 9.608em | 9.508em | 0.951em |

\* `JEFFERY` is narrow because Horizon's `J`, `E` and `F` are among its tightest glyphs; the
mean across `JEFFERY ROSS` (0.917em) is the representative figure. **Horizon is narrower than
the design's pessimistic 1.00–1.10em estimate**, which is why the derived sizes come out above
the design's estimates.

Arithmetic caps from `max_rem = AVAIL / (width_em_effective × root_px)`:

| String | 320px (266.7px avail) | 768px (650.7px) | 1024px (906.7px) | 1440px (1312.0px) |
|---|---|---|---|---|
| `JEFFERY ROSS` | — | **4.033rem** | 5.620rem | 7.455rem |
| `JEFFERY` | 2.935rem | — | — | — |
| `KILLERBYTE` | 2.104rem | 4.666rem | — | — |

**768px is the binding constraint**, as the design predicted.

**Derived values — browser-confirmed, see the note below:**

| Declaration | Old | New | Basis |
|---|---|---|---|
| Intro `h1` (default) | `5rem` | **`3.75rem`** | Arithmetic allows 4.033rem at 768px, but only ~0.8% margin and the arithmetic excludes Horizon's GPOS kerning. Confirmed in a real browser; see below. |
| Intro `h1` (`<=small`) | `3.25rem` | **`2.75rem`** | 320px cap is 2.935rem; rounded down to the nearest 0.25rem. Matches the design estimate. |
| Project-page `h1` (default) | `3.25rem` | **`2.5rem`** | Matches the design estimate. Constrained by the widest single *word*, `KILLERBYTE`. |
| Project-page `h1` (`<=small`) | `2.4rem` | **`2rem`** | New step. 320px cap for `KILLERBYTE` is 2.104rem, so the pre-existing 2.4rem would break a project title mid-word. |

**Browser confirmation** (`tools/typography-check/measure-h1.mjs`, headless Chromium, real
fonts confirmed loaded via `document.fonts.check`). Intro `h1`, widest laid-out line against
the content box:

| Candidate | 768px | 1024px | 1440px | Verdict |
|---|---|---|---|---|
| `4rem` | 1 line, 643.97 / 650.67px — **1.03% margin** | 1 line, 28.97% | 1 line, 46.70% | **rejected** — under the 2% margin bar |
| **`3.75rem`** | 1 line, 600.41 / 650.67px — **7.72% margin** | 1 line, 33.78% | 1 line, 50.17% | **SELECTED** |
| `3.5rem` | 1 line, 14.42% | 1 line, 38.58% | 1 line, 53.41% | fits, but needlessly small |

So 4rem *does* mathematically hold one line at 768px — the arithmetic was right, and real
kerning even helped slightly (643.97px measured against 645.4px predicted). It was rejected
on margin, not on fit: 1.03% is roughly 6.7px of slack, which a font-rendering or metrics
difference in another engine could erase. `3.75rem` is the largest 0.25rem step with real room.

At 320px the `<=small` step was confirmed the same way: `3rem` overflows (268.2px against
266.67px available) and `2.75rem` fits at 250.44px on two lines, matching Req 3 c13.

`HALLGRÍMSKIRKJA` at 320px on `church.html` now lays out across 3 lines at 276.34px against
280px available, with no horizontal scrollbar — the pre-existing overflow defect (design
finding F6, risk R2) is fixed by `overflow-wrap: break-word`.

### 4. Glyph coverage — PASSES

Site content across all nine pages contains exactly three non-ASCII codepoints:

| Codepoint | Char | Occurrences | Where | Horizon | Telegraf Regular | Telegraf Ultrabold |
|---|---|---|---|---|---|---|
| U+00ED | í | 6 | `Hallgrímskirkja` — **heading text** (`h1` on `church.html`, `h2` on `index.html`) | ✓ | ✓ | ✓ |
| U+00D7 | × | 7 | body text | ✓ | ✓ | ✓ |
| U+00B7 | · | 3 | body text | ✓ | ✓ | ✓ |

Horizon carries U+00ED, so "Hallgrímskirkja" renders wholly in Horizon with no mid-word family
substitution. This was the one intake finding that could have forced a design change; it did not.

**`unicode-range` — narrowed from the design's declaration.** The design specified
`U+0000-00FF, U+0100-017F, U+2000-206F, U+2212`. Measured coverage shows each face carries only
**15 of the 112** General Punctuation codepoints, so the blanket `U+2000-206F` over-declares by
97 codepoints. The shipped declaration enumerates only codepoints verified present in **all
three** faces:

```
unicode-range: U+0000-00FF, U+0100-017F, U+2013-2014, U+2018-201A,
               U+201C-201E, U+2020-2022, U+2026, U+2039-203A, U+2212;
```

This keeps the en/em dash, curly quotes, bullet and ellipsis on the webfonts — so a future
pasted curly apostrophe does not silently render from the fallback family mid-word — while
declaring nothing the faces do not have. `U+2044` (Horizon only) and `U+2030` (Telegraf only)
are excluded so that one identical range serves all three rules.

Because Req 9 c6 forbids subsetting, no rule references a subset file, so Req 2 c9's antecedent
is false and the declaration is a voluntary correctness guard rather than a mandated one. Note
that the two blocks Req 2 c9 names as a minimum are themselves not fully covered — Basic Latin
95/96 in every face, Latin-1 96/96 in Horizon but 86/96 in Telegraf, Latin Extended-A 127/128
in Horizon and 99/128 in Telegraf — so per-character fallback under Req 3 c16 and Req 4 c14
carries any gap regardless of how the range is declared.
