# Design Document

## Overview

This design implements the outcomes of `requirements.md` against a static, build-tool-free HTML5 UP site. **Change Set 1 is implemented and merged to `main`** (commits `d49d8c5`, merged as `a3d8a92`); its two outcomes were:

1. **Footer email legibility** — the `mailto:` link moves from `#717981` (4.05:1, measured) to a darker value, via a *targeted* selector rather than a palette edit. Change Set 1 shipped `#4a5158` (7.38:1); **Change Set 2 supersedes it with `#3a4148` (9.49:1)** — see §5.1.
2. **Typeface replacement** — Horizon (WOFF2, one solid face) for `h1`–`h6`; PP Telegraf (vendor-supplied OTF, unconverted) for body text and all small interface text. Google Fonts is removed; both faces are self-hosted.

**Change Set 2** is a follow-up amendment against the merged code, specified in Requirements 10–14 plus amendments to Requirements 1, 5, 8 and 9. Its seven changes and the sections that carry them:

| # | Change | Requirement | Design section |
|---|---|---|---|
| 1 | Footer email link `#4a5158` → `#3a4148` (7.38:1 → 9.49:1) | Req 1 c7/c12/c13, Req 8 c7 | §5.1, and §3.6 / §4.2 revised |
| 2 | Project card titles centred in their header band | Req 10 | §5.2 |
| 3 | Nav links, Read More / View Model buttons and skills pills move to Ultrabold (800) | Req 11, Req 5 c2 | §5.3 |
| 4 | Skills pill box geometry corrected for the heavier label text | Req 12 | §5.4 |
| 5 | Footer "Fonts & icons" line becomes a Back to top control; HTML5 UP credit **retained** and reworded | Req 13, Req 8 c5 | §5.5 |
| 6 | `#copyright` contrast raised — **reverses conflict C3** | Req 14, Req 1 c11 | §5.6, and conflict C3 re-marked |
| 7 | Stored-licence-text obligation no longer applies to Horizon | Req 9 c2, c9–c11 | §5.7, and §4.4 revised |

Change Set 2 adds **no font file**, changes **no `@font-face` rule**, and changes **no palette value** beyond the single `alt.fg-link` token that Change Set 1 already introduced. Every other Change Set 2 effect is a per-rule declaration change.

### What research established

All numbers below were measured against the repository during design, not assumed. Six findings materially shaped the design:

| # | Finding | Consequence |
|---|---|---|
| F1 | `#4a5158` measures **7.38:1** on `#f5f5f5`; `#3a4148` measures **9.49:1** | Change Set 1 shipped 7.38:1. **Change Set 2 supersedes it with `#3a4148` at 9.49:1** (Req 1 c12). Both clear the 7.0:1 threshold of Req 1 c1, which is unchanged. |
| F2 | `#717981` occurs **15×** in `assets/css/main.css` — it is the shared `alt` palette `fg`/`fg-bold` driving footer headings, social icons, table `th`, and pagination | The colour change **cannot** be a palette edit; Req 1 c10/c11 force a targeted selector. See D3. |
| F3 | The footer link underline is `rgba(113,121,129,0.5)` → composites to `#b3b7bb` = **1.85:1** | Fails Req 1 c7 (≥3:1). The underline must become solid. See D4. |
| F4 | `#intro h1` is **5rem**, not 4rem, with a `3.25rem` override at `<=small` | Req 3 c6 caps intro `h1` at ≤4rem, so this is a reduction of two declarations, not one. See §3.3. |
| F5 | `#intro` horizontal padding is `4rem`/side (compiled: `padding: 8rem 4rem 6rem 4rem`); root font-size at 768px resolves to **11pt = 14.67px** | Gives a hard 650.7px content budget at 768px, which is the binding constraint on intro `h1`. See §3.3. |
| F6 | "Hallgrímskirkja" (15 chars, no break opportunity) **already overflows** at 320px in Source Sans Pro at 3.25rem (357.5px needed vs 266.7px available) | Req 3 c11 is unsatisfiable by size reduction alone. `overflow-wrap` is mandatory, not optional. See D6. |

F2, F3 and F6 are pre-existing defects that this refresh must fix in order to satisfy its own acceptance criteria. F6 in particular means the requirement cannot be met by tuning font sizes, which is how it would otherwise be read.

Requirement conflicts uncovered during measurement are collected in **Requirement Conflicts Requiring a Decision**. All six are **settled**, but one has since been re-decided: C2, C4, C5, C6 and C1 stand exactly as recorded there, while **C3 (`#copyright` contrast) is reversed by Change Set 2** — the owner has ruled that the copyright bar must be legible now that it hosts an interactive control, so C3 is resolved *by fixing it* rather than by leaving it unchanged (Req 14; §5.6). C2 (footer `h3` at 4.05:1) is untouched and remains the sole accepted contrast exception.

---

## Architecture

There is no application architecture. The only architecture is the *resolution chain* by which a page acquires a glyph, and the only structural decision is where each link in that chain lives.

```mermaid
flowchart TD
    P["9 Content_Pages<br/>index, arduino, cad, calculator, church,<br/>fluid_sim, killerbyte, launchtoy, vexlego"]
    P -->|"&lt;link rel=stylesheet&gt;"| CSS

    subgraph CSS["assets/css/main.css — hand-maintained compiled output"]
        I1["line 1: @import fontawesome-all.min.css  (RETAINED, Req 7 c6)"]
        I2["line 2: @import Google Fonts  (REMOVED, Req 2 c11)"]
        FF["@font-face x N  (NEW — inserted after line 1)"]
        R["typography rules<br/>font-family / size / weight / line-height / letter-spacing"]
    end

    FF -->|"relative url(), no scheme/host"| WF
    subgraph WF["assets/webfonts/ — same origin"]
        H["Horizon-*.woff2  (1 face)"]
        T["Telegraf-*.otf|ttf  (1–2 faces, unconverted)"]
        FA["fa-*.{eot,svg,ttf,woff,woff2}  (UNTOUCHED, Req 7 c7)"]
        PROV["FONT-PROVENANCE.md + licence texts  (Req 9 c2)"]
    end

    SASS["assets/sass/** — source of truth for intent"]
    SASS -.->|"hand-mirrored, no compiler (Req 7)"| CSS

    style I2 stroke-dasharray: 4 4
    style SASS stroke-dasharray: 4 4
```

Two properties of this chain drive the rest of the design:

- **The dotted SASS→CSS edge is not automated.** There is no `package.json`, no compiler, and `assets/css/main.css` is a shipped artifact that is edited by hand. The SASS files express intent; the CSS is what browsers execute. Requirement 7 exists because these can silently diverge, so the **Compiled Stylesheet Sync Procedure** defines a mechanical sync and **Correctness Property 2** makes divergence a detectable failure rather than a latent one.
- **`@font-face` must be inserted after the Font Awesome `@import`.** CSS requires all `@import` rules to precede other rules; placing `@font-face` above line 1 would invalidate the Font Awesome import and break every icon (Req 7 c6).

### Deployment topology and rollback

`.github/workflows/static.yml` triggers on push to `main` and uploads `path: '.'` — **the entire repository, with no build step and no staging environment**. Two consequences:

- Any file added to the repo is published, including `.kiro/` (already published today) and any new tooling. the **Testing Strategy** adds a prune step so verification tooling does not become part of the site.
- There is no pre-production environment, so "verify before it goes live" must mean *verify before push*. the **Pre-push verification gate** in the Testing Strategy defines that gate.

---

## Components and Interfaces

### 3.0 Change Set 1 as shipped — reconciliation

Sections 3.1 through 4.5 were written *before* the fonts were in hand, so several of their values are stated as estimates or as open branches. Change Set 1's intake gate (Check G) resolved all of them, and the resolutions are recorded in `assets/webfonts/FONT-PROVENANCE.md`. **Change Set 2 targets the shipped values below, not the pre-intake estimates**, and where the two differ the shipped value governs:

| Item | Pre-intake estimate in §3.1–§4.3 | **As shipped on `main`** |
|---|---|---|
| Body_Font CSS family name | `Telegraf` | **`PP Telegraf`** (the faces' internal family name) |
| `weight-heading` | `$HORIZON_WEIGHT`, expected `400` | **`700`** — Horizon's single face is a Bold at `usWeightClass` 700 |
| `weight-bold` | `700` under Branch A | **`800`** — the free download has no 700 face; `PPTelegraf-Ultrabold.otf` is 800 |
| Bold branch (§3.4) | A or B, undecided | **Branch A.** A true bold ships, so no alternative emphasis treatment and no README limitation note |
| Italic faces | possibly absent | **None shipped.** Zero `<em>`/`<i>` in site content; synthesized oblique stays inside `PP Telegraf` |
| Intro `h1` | `3.5rem` estimated | **`3.75rem`** browser-confirmed (7.72% margin at 768px) |
| `unicode-range` | `U+2000-206F` blanket | narrowed to the punctuation codepoints verified present in all three faces |
| Font bundle | ≤600 KB budget | **103,324 bytes (≈101 KB)**, 17% of budget |

Change Set 2 depends on three of these directly: `weight-bold: 800` is the value Req 11 c2 resolves through (§5.3), `PP Telegraf` is the family that stays unchanged under Req 11 c5, and the 101 KB bundle is why Req 11 adds no payload at all (§5.3).

### 3.1 The `$font` map — `assets/sass/libs/_vars.scss`

The map is the single interface through which every typeface decision is expressed (Req 7 c4). Shipped state, with the intake-resolved values from §3.0 substituted in:

```scss
$font: (
    family:             ('PP Telegraf', 'Helvetica Neue', 'Segoe UI', Roboto, sans-serif),
    family-heading:     ('Horizon', 'Arial Black', Verdana, 'Trebuchet MS', sans-serif),
    family-fixed:       ('Courier New', monospace),   // UNCHANGED — Req 4 c8
    weight:             400,                          // PPTelegraf-Regular.otf
    weight-bold:        800,                          // PPTelegraf-Ultrabold.otf — no 700 face ships
    weight-heading:     700,                          // Horizon's single solid face, measured
    letter-spacing-heading: 0.05em                    // NEW KEY — see note below
);
```

**Change Set 2 makes no edit to this map.** Requirement 11 changes which *rules* reference `weight-bold`; the token's value is already correct.

**Fallback stack for `family-heading` — widest-first, as Req 6 c1 requires.** Horizon is an extra-wide face, so its advance widths exceed every installed fallback. Ordering the stack widest-first minimises the layout shift when the webfont swaps in (Req 6 c8):

| Position | Family | Default-installed on | Why this position |
|---|---|---|---|
| 1 | `Arial Black` | Windows, macOS | Closest available match on *both* axes that matter — heavy weight and wide advances. Best single approximation of Horizon's metrics. |
| 2 | `Verdana` | Windows, macOS | Widest advances among ubiquitous text sans faces; wider than Arial/Helvetica by a clear margin. |
| 3 | `Trebuchet MS` | Windows, macOS | Moderately wide humanist sans; last resort before the generic. |
| 4 | `sans-serif` | generic | Terminator required by Req 6 c3; satisfies Req 6 c11. |

Android/iOS ship none of positions 1–3 and will land on `sans-serif` (Roboto / SF). This is acceptable: Req 6 c1 requires each *named* family to be installed on **at least one** of the four platforms, which positions 1–3 satisfy, and the generic terminator guarantees a rendering everywhere.

**Fallback stack for `family` — Req 6 c2** requires two or more named families, each default-installed somewhere, then the generic: `Helvetica Neue` (macOS/iOS), `Segoe UI` (Windows), `Roboto` (Android), `sans-serif`. Between them these cover all four named platforms with a neo-grotesque of similar proportion to Telegraf, keeping swap reflow small (Req 6 c9).

**`weight-heading` is resolved at implementation, not guessed.** Horizon ships exactly one solid face (decision 4), and Req 3 c4 requires `weight-heading` to *equal that face's weight* and requires the `@font-face` `font-weight` to match it, so that no browser-synthesized bold is ever applied. The value is read from the font's `OS/2.usWeightClass` once the file is in hand:

```bash
python3 -c "from fontTools.ttLib import TTFont; f=TTFont('assets/webfonts/Horizon.woff2'); \
print('usWeightClass =', f['OS/2'].usWeightClass, '| subfamily =', f['name'].getDebugName(2))"
```

Expected `400`. Whatever it reports is written *identically* into `weight-heading` and into the `@font-face` block. Because browsers default `h1`–`h6` to `bold`, an explicit `font-weight` is mandatory at every heading level — which the existing `_font(weight-heading)` reference already provides, **except** at the card `h2`, which hardcodes `font-weight: 700` and must be converted (§3.5).

**`letter-spacing-heading` is a new key that fixes a latent bug.** `assets/sass/components/_pagination.scss:31` already reads `_font(letter-spacing-heading)` — a key that does not exist in the map. Because the project has no compiler, this has never been evaluated; it would raise an error the moment anyone runs SASS. Adding the key both satisfies Req 5 c8 centrally and removes the trap. (The compiled CSS currently carries `letter-spacing: 0.075em` for pagination, from the preceding line.)

### 3.2 `@font-face` blocks — `assets/css/main.css`

Inserted immediately after the Font Awesome `@import` on line 1, before the reset. Filenames are placeholders confirmed against the actual downloads.

```css
/* Horizon — Alberto Fontense, free personal-use tier. WOFF2 (Req 2 c2). */
@font-face {
    font-family: 'Horizon';
    src: url('../webfonts/Horizon.woff2') format('woff2');
    font-weight: 400;          /* MUST equal $HORIZON_WEIGHT — Req 3 c4 */
    font-style: normal;
    font-display: swap;        /* Req 2 c8, Req 6 c6 */
    unicode-range: U+0000-00FF, U+0100-017F, U+2000-206F, U+2212;
}

/* Telegraf — Pangram Pangram Foundry, free personal-use tier.
   Vendor-supplied OTF, shipped unconverted (Req 2 c3, Req 9 c6).
   format() hint MUST match the actual file: opentype for .otf, truetype for .ttf. */
@font-face {
    font-family: 'Telegraf';
    src: url('../webfonts/Telegraf-Regular.otf') format('opentype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
    unicode-range: U+0000-00FF, U+0100-017F, U+2000-206F, U+2212;
}

/* Branch A only — omit entirely under Branch B (§3.4). */
@font-face {
    font-family: 'Telegraf';
    src: url('../webfonts/Telegraf-Bold.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
    unicode-range: U+0000-00FF, U+0100-017F, U+2000-206F, U+2212;
}
```

Interface contract per Req 2 c6 — one rule per file; `font-family` identical to the first family of the corresponding stack; `font-weight` equal to the referenced file's weight; `format()` matching the real format. Paths are relative to `main.css` (`../webfonts/…`), carrying no scheme and no host (Req 2 c7, c14).

> **As shipped (§3.0):** the CSS family name is **`PP Telegraf`**, not `Telegraf`; the files are `PPTelegraf-Regular.otf` (400) and `PPTelegraf-Ultrabold.otf` (**800**, not 700); Horizon's `font-weight` is **700**; and the `unicode-range` is the narrowed enumeration recorded in `FONT-PROVENANCE.md`. **Change Set 2 changes none of these rules** — Req 11 c4 requires it not to, and §5.3 reuses the already-declared 800 face rather than adding one.

**On `unicode-range` (Req 2 c9).** The criterion is scoped to rules referencing a *subset* font file. Req 9 c6 forbids subsetting, so **no rule here references a subset file and the criterion is vacuously satisfied**. The declaration is included anyway, for two reasons: it documents the coverage each face is relied upon for, and it is a correctness guard — an over-narrow range silently diverts characters to the fallback. The range must therefore be verified against real page content, not copied from a template. Measured content across all nine pages contains exactly three non-ASCII characters:

| Codepoint | Char | Where | In declared range? |
|---|---|---|---|
| U+00ED | í | `Hallgrímskirkja` — `h1` (church.html), `h2` (index.html) — **Heading_Text** | Yes (Latin-1) |
| U+00D7 | × | body text | Yes (Latin-1) |
| U+00B7 | · | body text | Yes (Latin-1) |

U+00ED lands in Heading_Text, so Horizon must actually carry it. Horizon's stated coverage is Basic Latin, Latin-1 and Latin Extended, so the declared range sits inside its coverage as Req 3 c15 requires — **to be confirmed by glyph audit** (**Testing Strategy, Check G**), because a missing glyph here silently substitutes a fallback family mid-word (Req 3 c16, Req 4 c14).

### 3.3 Heading type scale

Levels `h2`–`h6` are fixed by Req 3 c5 and are already correct in `_typography.scss`; they are re-declared unchanged. The base `h1` stays at `4rem`, satisfying the strictly-decreasing rule (4 → 1.75 → 1.25 → 1 → 0.9 → 0.8, every gap ≥ 0.1rem).

The *overrides* are where the work is. Req 3 c6 requires the intro `h1` to be "the largest value at or below 4rem" that keeps "Jeffery Ross" on one line at 768/1024/1440 — so the value must be **derived**, not chosen.

**Derivation method.** With `text-transform: uppercase` the string laid out is `JEFFERY ROSS` (12 characters). Required width is `chars × avg_advance_em × font_px`; available width is `viewport − 2 × padding`. Measured geometry:

| Viewport | Matching root step | Root px | `#intro` pad/side | Available |
|---|---|---|---|---|
| 320px | `<=xxsmall` 10pt | 13.33px | 2rem = 26.7px | **266.7px** |
| 768px | `<=large` 11pt | 14.67px | 4rem = 58.7px | **650.7px** |
| 1024px | `<=large` 11pt | 14.67px | 4rem = 58.7px | 906.7px |
| 1440px | `<=xlarge` 12pt | 16.00px | 4rem = 64.0px | 1312.0px |

Maximum intro `h1` that keeps `JEFFERY ROSS` on one line, as a function of Horizon's mean uppercase advance:

| Viewport | 0.80em | 0.90em | 1.00em | 1.10em |
|---|---|---|---|---|
| **768px** | 4.62rem | **4.11rem** | **3.70rem** | **3.36rem** |
| 1024px | 6.44rem | 5.72rem | 5.15rem | 4.68rem |
| 1440px | 8.54rem | 7.59rem | 6.83rem | 6.21rem |

**768px is the binding constraint** at every plausible advance width — 1024px and 1440px have slack to spare. Combined with the 4rem ceiling:

- **Intro `h1` (default): `3.5rem`** — down from 5rem. Survives a mean advance up to ~1.06em, which brackets the plausible range for an extra-wide geometric sans. Chosen over 4rem because 4rem only survives to ~0.92em and Horizon may well exceed that.
- **Intro `h1` (`<=small`): `2.75rem`** — down from 3.25rem. At 320px the widest unbreakable token is `JEFFERY` (7 chars); 2.75rem needs 256.7px of the 266.7px available at 1.00em advance. 3.25rem needs 303px and overflows. Req 3 c13 permits two lines here, which 2.75rem delivers.
- **Project-page `h1` (`body.project-page … header.major > h1`): `2.5rem`** — down from 3.25rem. These strings are far longer than the intro's (up to 38 chars: "KillerByte Full-Body Spinner BattleBot"); they wrap across multiple lines by design, so the constraint is the widest *word*, not the string.

**Verification, and the fallback if it does not fit.** The estimates above must be confirmed against Horizon's real metrics once the file is in hand. Exact per-string measurement, no browser needed:

```bash
python3 - <<'PY'
from fontTools.ttLib import TTFont
f = TTFont('assets/webfonts/Horizon.woff2')
upm = f['head'].unitsPerEm; cmap = f.getBestCmap(); hmtx = f['hmtx']
def width_em(s):
    return sum(hmtx[cmap[ord(c)]][0] for c in s if ord(c) in cmap) / upm
for s in ('JEFFERY ROSS', 'JEFFERY', 'HALLGRÍMSKIRKJA'):
    w = width_em(s)
    print(f'{s!r:20s} {w:6.3f}em  mean/char {w/len(s):.3f}em')
PY
```
Then, with `LS` the chosen letter-spacing in em and `AVAIL` the value from the geometry table: `max_rem = AVAIL / ((width_em + LS × len) × root_px)`. Take the **minimum** across 768/1024/1440, cap at 4rem, and round *down* to the nearest 0.25rem for margin.

If even a heavily reduced size will not hold `JEFFERY ROSS` on one line at 768px — i.e. the derived cap falls below ~2.5rem, where the intro would stop reading as a display heading — the escalation order is:

1. Apply the `-0.02em` end of the Req 3 c7 letter-spacing range (buys ~2% width).
2. Reduce the `<=medium` intro padding from `4rem` to `2rem`/side, adding ~117px of budget at 768px (~18%). This is a layout change outside the stated scope and needs owner sign-off.
3. Escalate to the owner: Req 3 c12 (one line at 768px) and Req 3 c6 (recognisable display size) are then in genuine conflict, and one must give.

Mid-word breaking is deliberately **not** on this list for the intro: it would split a person's name across lines.

**Heading letter-spacing: `-0.01em`** (Req 3 c7 range −0.02em…0.02em). Horizon's extra-wide letterforms already carry generous side bearings; the inherited `0.075em` would read as badly over-tracked. A slight negative value tightens word shapes without collision. This replaces `0.075em` at the `h1`–`h6` rule.

**Heading line-height** (Req 3 c8): intro `h1` `1.1` (range 1.05–1.20; replaces the current `1`, which is out of range); `h1`–`h6` base `1.3` (range 1.20–1.50; replaces `1.5`, tightened because a heavy extra-wide face at 1.5 leaves visually loose leading).

`text-transform: uppercase` and `fg-bold` colour resolution are preserved (Req 3 c9). Existing root-size steps are untouched, so rem values scale as Req 3 c10 requires.

### 3.4 Body text

| Property | Current | Target | Requirement |
|---|---|---|---|
| `font-family` | `_font(family)` → Merriweather | `_font(family)` → Telegraf | Req 4 c1, c2 |
| `line-height` | `2.375` | **`1.7`** | Req 4 c5 |
| `font-size` | `1rem` | `1rem` (unchanged) | Req 4 c6 |
| `text-align` | `justify` | `justify` (unchanged) | Req 4 c10 |

**`line-height: 1.7`** sits mid-range in the required 1.6–1.9. The existing 2.375 was tuned for Merriweather, a serif with a small x-height; Telegraf's larger x-height makes the same leading look disconnected. 1.7 keeps justified paragraphs cohesive while staying comfortable at 1rem.

Root steps (16pt/12pt/11pt/10pt) are preserved (Req 4 c6). The smallest resulting body size is 10pt = 13.33px at ≤360px, clearing the 13px floor of Req 4 c13 — with only 0.33px of margin, so the root steps must not be lowered.

**Italics (Req 4 c11).** If the licensed download has no true italic, `em`/`i` must stay in the Telegraf family with a synthesized oblique and must *not* fall back to another family. Browsers do this by default, but only if nothing disables synthesis — so `font-synthesis: none` must **not** be applied globally. Under Branch B it is applied to `strong`/`b` only, never to `em`/`i`.

**Bold — two branches, written while Assumption 6 was open.** The free Telegraf tier ships "selected styles", so a 700 face was not confirmed at design time. Both branches were fully specified so implementation could proceed either way; the branch was selected by inspecting the download (**Testing Strategy, Check G**).

> **RESOLVED at intake — Branch A, at weight 800.** The free download supplied a true bold, so Branch B was not implemented and no README limitation note was required. The face is `PPTelegraf-Ultrabold.otf` at `usWeightClass` **800**, not 700; there is no 700 face, so `weight-bold: 800` is declared against the file that actually ships (Req 4 c3). Branch B below is retained as history — it is not live code. This is the token that Requirement 11 now reuses for Bold_Chrome_Text (§5.3), which is why that change ships no new font file.

*Branch A — a bold face exists.* `weight: 400`, `weight-bold: 700`; both faces ship; `strong`/`b` resolve through `_font(weight-bold)` as they already do. Nothing further.

*Branch B — no bold face (Req 4 c4).* `weight-bold` is set **equal to** `weight` (400), only the regular face ships, and `strong`/`b` receive an alternative emphasis that does not rely on synthesized bold:

```scss
strong, b {
    font-weight: _font(weight-bold);   // == weight; no weight delta
    font-synthesis: none;              // suppress the synthetic bold browsers would apply
    letter-spacing: 0.02em;            // subtle tracking cue
    background-color: rgba(24, 191, 239, 0.12);   // accent-derived tint
    padding: 0 0.15em;
}
```
The tint reuses the existing accent `#18bfef` at low alpha, so emphasis stays legible without a second colour token, and the near-transparent wash leaves text contrast essentially unchanged — a claim that Property 1 verifies rather than assumes. Branch B also requires the limitation to be recorded in `README.md` (Req 4 c4) and reduces the bundle to a single Telegraf file, easing the §4.3 budget.

### 3.5 Chrome_Text migration — Heading font → body font

Chrome_Text currently inherits `family-heading` at sizes down to **0.55rem** (`body.home #main .button.skills`, `_main.scss:475`). Horizon's tight, closed apertures collapse long before that size, so all seven sites move to `_font(family)` (Req 5 c1). Every one is a `_font(family-heading)` → `_font(family)` swap plus a weight change from `weight-heading` to `weight` (Req 5 c2 — Chrome_Text must sit on a weight that actually ships).

| Source file | Selector | Size |
|---|---|---|
| `components/_button.scss:24` | buttons — skills + Read More | 0.8rem (0.7 small, 0.55 card) |
| `components/_form.scss:73` | `label` | inherits |
| `components/_pagination.scss:26` | pagination links | 0.8rem |
| `components/_table.scss:31` | `th` | 0.8rem |
| `layout/_navPanel.scss:22,84` | nav panel links | 0.9rem |
| `layout/_footer.scss:224` | `#copyright` | 0.8rem |
| `layout/_nav.scss:33` | `#nav ul.links` (conflict C6) | 0.8rem |

**Change Set 2 splits this table in two.** Requirement 11 moves three of these groups — the nav links, every `.button` label, and the skills pill labels — from `_font(weight)` to `_font(weight-bold)`, making them **Bold_Chrome_Text** (§5.3). The family stays `_font(family)` for all of them, so the Req 5 c1 routing above is unchanged; only the weight differs. Form labels, pagination links, table headers, nav-panel links and `#copyright` stay at 400 (Req 11 c15).

**Chrome_Text letter-spacing: `0.05em`**, down from `0.075em` (Req 5 c8 range 0.025–0.075em; both comply). Reduced deliberately: the longest skills label is exactly **20 characters** ("Waterjet fabrication"), precisely at the Req 5 c4 single-line boundary, and it must fit inside a card pill at 0.55rem. Dropping tracking by 0.025em buys ~0.5 characters of width at zero visual cost. Centralised as `letter-spacing-heading` in the `$font` map (§3.1) so all seven sites stay consistent (Req 8 c3).

**The card `h2` (Req 3 c3).** `layout/_main.scss:~361` hardcodes three values that must all change, not just the family:

```scss
// before                                  // after
font-family: Merriweather, Georgia, serif; → font-family: _font(family-heading);
font-weight: 700;                          → font-weight: _font(weight-heading);
letter-spacing: 0;                         → letter-spacing: _font(letter-spacing-heading);
```
The `font-weight: 700` is as important as the family: left in place with a single-weight Horizon it would trigger exactly the synthesized bold Req 3 c4 forbids. `font-size: 1.1rem` and `text-transform: none` are deliberate card-design choices and are retained — see conflict C5. This is the only literal typeface name outside the `$font` map and `@font-face` rules, and removing it satisfies Req 7 c4.

**Skills pills cannot wrap as currently built (Req 5 c7).** `body.home #main .button.skills` sets `white-space: nowrap`, a fixed `height: 1.7rem` and `line-height: 1.55rem`, and its container sets `flex-wrap: nowrap`. Req 5 c7 requires a label that exceeds the available width to *wrap inside the card* with every character visible — impossible under `nowrap`, and a wrapped label inside a fixed 1.7rem pill would be clipped even if it did wrap. The pill therefore becomes vertically elastic:

```scss
body.home #main .skills-box { flex-wrap: wrap; }
body.home #main .button.skills {
    white-space: normal;        // was nowrap  — permits the Req 5 c7 wrap
    height: auto;               // was 1.7rem  — fixed height would clip line 2
    min-height: 1.7rem;         // preserves the current pill silhouette
    line-height: 1.4;           // was 1.55rem — must be a ratio once multi-line
    padding: 0.15rem 0.4rem;    // restores vertical centring without a fixed height
}
```
Background, border, radius and uppercase treatment are untouched (Req 5 c5). White-on-`rgba(18,38,58,0.92)` measures 12.18:1 worst-case (over white) and 15.40:1 on the card, comfortably clearing Req 5 c6.

> **Superseded in part by Change Set 2 (§5.4).** The `min-height: 1.7rem` / `padding: 0.15rem 0.4rem` pairing above is the geometry the owner now reports as mismatching its text, and measurement confirms two distinct faults in it: the trailing comment "restores vertical centring without a fixed height" is **wrong** — `min-height` exceeds the natural content height by ~8px, and in block layout all of that slack falls *below* the text rather than splitting — and the 0.4rem horizontal padding leaves the widest label at a 0.89 label-to-pill width ratio, over the 0.88 ceiling Req 12 c5 sets. The wrap behaviour established here (`white-space: normal`, `height: auto`, `flex-wrap: wrap` on the container) is **retained unchanged** by Req 12 c8; only `padding`, `min-height` and the centring mechanism change. See §5.4.

### 3.6 Footer email link

Selector: **`#footer a[href^="mailto:"]`**. Chosen over a class or a structural path because the nine pages carry two different footer nesting depths (index/arduino/cad/calculator/church/fluid_sim nest one level deeper than killerbyte/launchtoy/vexlego); an attribute selector matches all nine identically with no markup edits, satisfying Req 1 c3 and c9 while leaving every page's DOM untouched (Req 8 c5).

```css
#footer a[href^="mailto:"] {
    color: #3a4148;                    /* 9.49:1 measured — Req 1 c1, c2, c12 */
    border-bottom-color: #3a4148;      /* solid, 9.49:1 — Req 1 c7; was 1.85:1 */
}
#footer a[href^="mailto:"]:hover {
    color: #18bfef !important;         /* accent mandated by Req 1 c4 */
    border-bottom-color: #3a4148;      /* stays 9.49:1 — Req 1 c7 in hover state */
}
#footer a[href^="mailto:"]:focus-visible {
    outline: 2px solid #212931;        /* 13.51:1, ≥2px, spans the box — Req 1 c6 */
    outline-offset: 2px;
}
```

**Colour history.** Change Set 1 shipped `#4a5158` at **7.38:1**. **Change Set 2 supersedes it with `#3a4148` at 9.49:1** (Req 1 c12) — the darker of the two candidates originally considered. Both clear the 7.0:1 threshold of Req 1 c1, which the amendment leaves unchanged; the change buys margin, it does not chase a new threshold. In the SASS source all three declarations read `_palette(alt, fg-link)` and only the token's value moves (§4.2, §5.1), so exactly one literal changes in `_vars.scss` and three resolved literals change in the compiled CSS. Req 1 c13 additionally requires **zero** remaining occurrences of `#4a5158` as a link or underline colour in either artifact.

Four things this encodes:

- **Underline (Req 1 c7).** The inherited `rgba(113,121,129,0.5)` composites to `#b3b7bb` = 1.85:1 and fails. Even `rgba(74,81,88,0.5)` reaches only 2.33:1. Only a solid colour clears 3:1, so the underline is declared solid at the link colour.
- **Hover underline.** The generic `#footer a:hover` sets `border-bottom-color: transparent`. Req 1 c7 requires ≥3:1 in the hover state, and a transparent underline is at best an ambiguous pass; the rule above keeps it solid and measurable — now at 9.49:1.
- **Focus (Req 1 c6).** `outline` is used rather than a border so the indicator spans the full text box and cannot alter layout. `:focus-visible` keeps the ring off mouse clicks; because `outline` and `color` are independent properties, the ring survives simultaneous hover as c6 demands.
- **Transitions (Req 1 c4, c5).** The inherited `a` transition is `0.2s` on `color` and `border-color`, inside the 200 ms bound. No new transition is needed.

Existing `0.8rem` sizing (`#footer form label, #footer h3, #footer p`) satisfies Req 1 c8 unchanged. No other footer colour is touched (Req 1 c10, c11).

---

## Data Models

The only persistent structures are the SASS maps, the font bundle, and the provenance record.

### 4.1 `$font` — typeface tokens

| Key | Type | Before | After | Constraint |
|---|---|---|---|---|
| `family` | font stack | `('Merriweather', Georgia, serif)` | `('PP Telegraf', 'Helvetica Neue', 'Segoe UI', Roboto, sans-serif)` | Req 4 c1; Req 6 c2, c3 |
| `family-heading` | font stack | `('Source Sans Pro', Helvetica, sans-serif)` | `('Horizon', 'Arial Black', Verdana, 'Trebuchet MS', sans-serif)` | Req 3 c1; Req 6 c1, c3 |
| `family-fixed` | font stack | `('Courier New', monospace)` | unchanged | Req 4 c8 |
| `weight` | 100–900 | `300` | `400` | Req 4 c3 |
| `weight-bold` | 100–900 | `600` | **`800`** (Branch A; measured, §3.0) | Req 4 c3, c4; Req 11 c2 |
| `weight-heading` | 100–900 | `900` | **`700`** (Horizon, measured) | Req 3 c4 |
| `letter-spacing-heading` | em length | *absent* | `0.05em` | Req 5 c8; Req 11 c8; fixes `_pagination.scss:31` |

Change Set 2 touches none of these rows. `weight-bold` and `letter-spacing-heading` acquire additional consumers under Requirement 11 (§5.3) but keep their values — and Req 11 c8 forbids *lowering* `letter-spacing-heading`, which pins `0.05em` as a floor from here on.

`weight` moves 300 → 400 and `weight-heading` 900 → Horizon's single weight because Req 2 c5/c16 and Req 3 c4 require every declared weight to correspond to a face that actually ships. A declared 300 with only a 400 face on disk would invite synthesis.

### 4.2 `$palette` — one additive change

Every existing value is preserved (Req 8 c7). One key is **added** to the `alt` map:

| Map | Key | Change Set 1 | **Change Set 2** | Purpose |
|---|---|---|---|---|
| `alt` | `fg-link` | `#4a5158` (7.38:1) | **`#3a4148` (9.49:1)** | Footer email link default + underline (Req 1 c12, c13) |

See conflict C1 under **Requirement Conflicts Requiring a Decision** for why this is additive rather than an edit to `alt.fg-bold`.

**This remains the only changed palette value after Change Set 2**, which matters because Req 8 c7 is written as a single-exception rule. The Copyright_Block recolouring of §5.6 does not widen the exception: it adjusts the `transparentize()` *amount* applied to `invert.fg` inside the `#copyright` rule, and leaves `invert.fg` itself at `#ffffff` (Req 14 c4). A per-rule opacity adjustment is not a palette edit, so the count of changed palette values stays at one — and Property 8 checks it that way, comparing every `$palette` entry against its baseline with only `alt.fg-link` allowlisted.

### 4.3 Webfont bundle manifest

Budget: **≤600 KB** for the two families combined, **≤400 KB** per Telegraf file (Req 2 c12, c13). The existing Font Awesome files (~2.9 MB across 15 files) are excluded from both bounds by name (Req 2 c12) and must remain byte-identical (Req 7 c7).

| File | Family | Weight | Format | `format()` | Typical | Bound |
|---|---|---|---|---|---|---|
| `Horizon.woff2` | Horizon | `$HORIZON_WEIGHT` | WOFF2 | `woff2` | 20–60 KB | — |
| `Telegraf-Regular.otf` | Telegraf | 400 | OTF (unconverted) | `opentype` | 60–200 KB | ≤400 KB |
| `Telegraf-Bold.otf` *(Branch A only)* | Telegraf | 700 | OTF (unconverted) | `opentype` | 60–200 KB | ≤400 KB |

Face count is the minimum Requirement 4 needs and no more (Req 2 c16) — one Horizon face (Req 2 c4), one Telegraf face per declared weight (Req 2 c5). If the download supplies `.ttf` rather than `.otf`, both the extension and the `format()` hint change to `truetype` together; a mismatched hint is a Req 2 c6 failure.

> **As shipped (§3.0):** three files, all OTF/WOFF2 as planned but named and weighted differently — `Horizon.woff2` (17,084 B, weight 700), `PPTelegraf-Regular.otf` (41,576 B, 400) and `PPTelegraf-Ultrabold.otf` (44,664 B, **800**). Total **103,324 B ≈ 101 KB, 17% of the 600 KB budget**; the seven unshipped Telegraf styles were deleted under Req 2 c16. **Change Set 2 adds nothing to this manifest**, which is the whole reason Requirement 11 has no payload cost (§5.3).

### 4.4 Provenance record — `assets/webfonts/FONT-PROVENANCE.md`

Requirement 9 c2 and c8 require source URL, download date, licence tier and format to be stored *in the repository*, alongside the licence texts, and updated whenever a file is added or replaced. One record per file:

| Field | Example |
|---|---|
| `file` | `Telegraf-Regular.otf` |
| `family` / `designer` | Telegraf / Pangram Pangram Foundry |
| `source_url` | `https://pangrampangram.com/products/telegraf/` (official channel only — Req 9 c1) |
| `download_date` | `2025-01-15` |
| `licence_tier` | Free personal / non-commercial |
| `licence_text_file` | `Telegraf-LICENSE.txt` |
| `format` / `converted` | OTF / **no** (Req 9 c6) |
| `sha256` | `…` — proves the shipped file is byte-identical to the download |
| `stored_bytes` | `142336` |
| `content_encoding` | `identity` (measured — Req 2 c17) |
| `transfer_bytes` | `142336` (measured — Req 2 c17, c18) |

`sha256` is not decorative: Req 9 c6 requires byte-for-byte fidelity to the vendor file, and a recorded hash is the only way a later reviewer can confirm nobody quietly re-saved or subsetted a face.

Neither Horizon nor Telegraf can be fetched by automation — both require a manual download from the designer's own channel behind an account or checkout flow (Req 9 c1 forbids aggregator mirrors, explicitly including the `fontdownloader.net` link that informed the requirements). Font acquisition is therefore a **manual prerequisite** that gates implementation; **Check G** in the Testing Strategy is the intake gate.

**Stored licence text — Body_Font only, as amended by Change Set 2 (Req 9 c2, c9–c11).** The design originally required a stored licence text for both families. Body_Font's obligation is met by the shipped `assets/webfonts/EULA-PangramPangram-FreeForPersonalUse-MAY2021.pdf`. For Heading_Font no such text could be located from the designer's channels, and Req 9 c2 no longer asks for one; criterion 9 substitutes a **recorded-fields** obligation instead. See §5.7 for the exact `FONT-PROVENANCE.md` edit. Two consequences for the data model:

- The `licence_text_file` field becomes **optional per family**, not per file. For the `Horizon.woff2` record it carries the literal `none — accepted, see note` rather than a filename, which is a recorded position and not a missing value (Req 9 c11).
- The four fields that *are* mandatory for Heading_Font — `licence_tier` (`free for personal use`), `designer`, `source_url`, `download_date` — are already present and non-empty in the shipped record, so §5.7 is a note edit, not a data edit.

The substantive licence terms are untouched: Req 9 c10 states plainly that the free-personal-use grant binds the Site whether or not a copy is stored, so Non_Commercial_Use (Req 9 c4, c5) applies to Horizon exactly as before. Property 11's field check is adjusted accordingly — it must not fail an absent licence text for Heading_Font, and it must not accept an *invented* one either.

### 4.5 Transfer-size measurement procedure (Req 2 c17, c18)

Req 2 c17 requires the *measured* `Content-Encoding` and over-the-wire byte count for each Telegraf file from the deployed origin — because the OTF/TTF delivery path was chosen on a size trade-off that should be verified rather than assumed. Run **after** the first deploy that includes the fonts, and record both values in §4.4:

```bash
BASE=https://jefferyxr.github.io/personal-website/assets/webfonts
for f in Telegraf-Regular.otf Telegraf-Bold.otf Horizon.woff2; do
  [ -f "assets/webfonts/$f" ] || continue
  curl -sI --compressed "$BASE/$f" | grep -iE '^(HTTP/|content-encoding|content-length|content-type)'
  curl -s -o /dev/null --compressed \
       -w "$f  http=%{http_code}  transfer_bytes=%{size_download}  encoding=%{content_type}\n" \
       "$BASE/$f"
  echo "  stored_bytes=$(wc -c < "assets/webfonts/$f")"
done
```

`--compressed` advertises gzip/br so the response reflects what a real browser receives. GitHub Pages compresses some MIME types and not others, and `font/otf` is commonly **not** compressed — so `Content-Encoding: identity` with `transfer_bytes == stored_bytes` is the expected result, and `gzip` with a smaller count is a bonus.

**Either outcome changes nothing in the CSS.** The `@font-face` rules, `format()` hints and paths are identical regardless. What the measurement does affect is the budget: if `identity` is confirmed, the §4.3 stored-size bounds *are* the transfer cost, and the ≤400 KB per-file bound is the real defence against a slow first paint. Req 2 c18 (measured ≤ stored) holds in both cases, since compression can only reduce the count — but it is recorded as measured fact, not inferred. The same run doubles as the Req 2 c10 same-origin check (`http=200` for every file).

---

## Change Set 2 — Design

Seven follow-up changes against the merged Change Set 1 code. All seven are **declaration-level or markup-level**; none adds a font file, alters an `@font-face` rule, or edits a palette value beyond the single `alt.fg-link` token that already exists.

The total source delta is small and worth stating up front, because it bounds the review surface:

| Change | SASS declarations | Compiled CSS rules | HTML pages |
|---|---|---|---|
| §5.1 email colour | 1 (`_vars.scss` token) | 3 resolved literals | 0 |
| §5.2 centred titles | 1 (`left` → `center`) | 1 | 0 |
| §5.3 bold weight | 2 (`weight` → `weight-bold`) | 2 | 0 |
| §5.4 pill geometry | 2 rules retuned | 2 | 0 |
| §5.5 Back to top | 3 added (cursor, focus, smooth scroll) | 3 | **9** |
| §5.6 copyright contrast | 1 (`transparentize` amount) | 1 | 0 |
| §5.7 Horizon licence note | 0 | 0 | 0 (one Markdown file) |

### 5.1 Footer email link — `#4a5158` → `#3a4148`

The mechanism is already in place: Change Set 1 routed all three declarations through `_palette(alt, fg-link)` (§3.6), so this change is **one literal in `_vars.scss`** plus its three resolved mirrors in `assets/css/main.css`.

```scss
// assets/sass/libs/_vars.scss — alt palette
fg-link: #3a4148,   // was #4a5158.  9.49:1 on #f5f5f5, was 7.38:1
```

| State | Colour | Ratio on `#f5f5f5` | Requirement |
|---|---|---|---|
| default text | `#3a4148` | **9.49:1** | Req 1 c1 (≥7.0:1), c12 |
| default underline | `#3a4148`, fully opaque | **9.49:1** | Req 1 c7 (≥3.0:1) |
| hover text | `#18bfef` | 1.98:1 — mandated by Req 1 c4, see conflict C4 | Req 1 c4 |
| hover underline | `#3a4148` | **9.49:1** | Req 1 c7 in hover state |
| focus outline | `#212931` | 13.51:1 | Req 1 c6 (≥3.0:1) |

Three points that keep this from being a blind find-and-replace:

- **The threshold did not move.** Req 1 c1 still says ≥7.0:1, and `#4a5158` already cleared it. This change buys margin against a stricter future target and satisfies the owner's stated preference for the darker candidate; it does not fix a failure. Recording that matters, because a reader who assumes 7.38:1 was failing will misread the amendment's intent.
- **Req 1 c13 is a zero-occurrence rule, not just a replacement rule.** After this change, `#4a5158` must appear **nowhere** in the SASS source or the compiled CSS as a link or underline colour. Two places in the existing artifacts mention it as *prose*: the conflict C2 note in this document names it as the ready remedy for the footer `h3`, and `_footer.scss` carries explanatory comments. The C2 remedy reference is updated in the conflicts section below; any SASS comment naming the old value is updated with the declaration so the source does not document a value it no longer sets.
- **Relative luminance, not just ratio.** Req 1 c2 requires a lower relative luminance than `#717981`. `#3a4148` is darker than `#4a5158`, which was already darker than `#717981`, so c2 holds transitively — but Property 1 checks it directly rather than by inference.

### 5.2 Centred project card titles (Req 10)

**Decision: set `text-align: center` on the Card_Header_Band, editing the existing `text-align: left` at `assets/sass/layout/_main.scss:358`. Do not add a declaration to the `h2`.**

```scss
// body.home #main .posts > article > header
text-align: center;   // was left — Req 10 c1
```

Why the band and not the `h2`:

- **It is an edit, not an addition.** The band already declares `text-align: left`; changing one token leaves the declaration count identical in both artifacts. Adding `text-align: center` to the `h2` instead would leave the source saying *"this band is left-aligned, and its only child is centred"* — an internal contradiction that invites a future editor to "tidy" one of the two and silently undo the change.
- **The band's only content is the Card_Heading.** The glossary pins this, and `_main.scss:352-359` confirms it: the `header` contains the `h2` and nothing else. So band-level centring has no collateral reach today, and if a card header ever gains a second child, centring extends to it automatically — which is the stated intent, cards reading as a symmetrical grid.
- **It keeps the `h2` rule untouched.** Req 10 c4 pins the Card_Heading's `font-size: 1.1rem`, `text-transform: none`, `line-height` and `color`, and Req 10 c5 pins `h2 > a { color: inherit }`. Not editing that rule at all is the cheapest way to guarantee those four are preserved.

**Multi-line titles need no extra work, and this is the load-bearing detail.** `text-align` applies per line box, not per block, so every line box inside the band is centred independently within the band's content box. That covers both cases Requirement 10 distinguishes:

- **Forced breaks (Req 10 c3).** "KillerByte / Full-body Spinner Battlebot" carries an explicit `<br />` inside its `h2 > a`. An anchor is inline and establishes no new block container, so the `<br />` breaks the `h2`'s line box and each resulting line centres on its own. No flex or grid centring is needed, and none should be used — `justify-content: center` on the band would centre the `h2` *box* as a single unit and leave its internal lines left-ragged, which fails c2 and c3 while appearing to pass c1.
- **Automatic wrapping (Req 10 c2, c6).** Titles that wrap at 320px behave identically, and `overflow-wrap: break-word` from Change Set 1 still governs any unbreakable token.

**Explicitly not touched (Req 10 c7).** `assets/sass/layout/_main.scss` contains exactly three `text-align: left` declarations — lines **179**, **358** and **444** — verified by grep. Line 358 is the Card_Header_Band and is the only one that changes. Lines 179 and 444 are card *description* paragraph rules (both `font-size: 0.85rem`), and left-aligning those is a deliberate readability choice for prose. Property 8 carries all three positions against their baseline so that a careless global replace fails a check rather than shipping.

Req 10 c9 (band `background-color: #12263a`, `padding: 0.85rem 1rem`, box dimensions preserved) holds trivially: `text-align` affects inline content position within the line box and changes no box dimension, so no card height and no grid alignment moves.

### 5.3 Ultrabold for nav, buttons and pills (Req 11)

**Three element groups move from weight 400 to 800, through exactly two SASS declarations.**

```scss
// assets/sass/layout/_nav.scss:34   — ul.links, the "Projects" / "CAD Gallery" links
font-weight: _font(weight-bold);    // was _font(weight)

// assets/sass/components/_button.scss:26 — the base .button rule
font-weight: _font(weight-bold);    // was _font(weight)
```

**Two declarations cover all three groups, which is exactly what Req 11 c3 asks for.** The base `.button` rule reaches Read More (`.button`), View Model (`.button.primary`, `.button.primary.small.fit`) *and* the skills pills (`.button.skills`) because `body.home #main .button.skills` declares no `font-weight` of its own and inherits from `.button`. Req 11 c3 requires a single rule covering all three so that no variant is left behind, and this is that rule. Site inventory confirms the reach: 24 `button skills`, 7 `button`, 6 `button primary`, 5 `button primary small fit`.

Three things this does *not* change, all pinned by Req 11:

- **Family (c5).** Both rules keep `_font(family)` → `PP Telegraf`. Only the weight moves.
- **Letter-spacing (c8).** Both keep `_font(letter-spacing-heading)` = `0.05em`. Req 11 c8 forbids going *below* the pre-amendment value, so 0.05em is now a floor rather than a free parameter — which removes the tracking-reduction lever that §3.5 used to buy width. Any width shortfall must be absorbed by the box (§5.4), not by tighter tracking.
- **Appearance (c13).** `text-transform`, `background-color`, `border`, `border-radius`, default/hover colours and transition timing are all untouched. Contrast is therefore unchanged and Req 11 c14 inherits Change Set 1's measurements (white on `rgba(18,38,58,0.92)` = 12.18:1 worst case).

**No new font file, and the bundle budget is untouched — stated explicitly because it is easy to assume otherwise.** `PPTelegraf-Ultrabold.otf` (44,664 bytes, `usWeightClass` 800) already ships and is already declared at `font-weight: 800` under the `PP Telegraf` CSS family, because Change Set 1 needed it for `<strong>`. Requirement 11 adds a second consumer of a face that is already downloaded on every page load. The bundle stays at **103,324 bytes (≈101 KB), 17% of the 600 KB budget**, and Req 11 c4 (add no file, remove no file, change no `@font-face` rule) is satisfied by doing nothing. Req 11 c6 likewise: 800 is a shipped `usWeightClass`, so no weight is synthesized or interpolated.

**Two incidental reaches of the `.button` rule, both benign.** The compiled `.button` rule at `main.css:2120` is a grouped selector that also covers `input[type="submit"|"reset"|"button"]` and bare `button` elements. A content audit finds **zero forms and zero such inputs** across all nine pages, so those selectors match nothing today. The one non-anchor match is the intro down-arrow, `class="button icon solid solo fa-arrow-down scrolly"` — an icon-only control with no text node, whose glyph is painted by a Font Awesome `:before` rule that sets its own `font-family` and `font-weight`, so the change has no visible effect on it. Neither reach touches anything Req 11 c15 pins at 400 (form labels, pagination links, table headers, nav-panel links, Copyright_Block), because none of those resolves through `.button`.

#### The real risk: Ultrabold is wider than Regular

This is the substantive risk in Change Set 2, and it is measured rather than assumed. Advance widths were read directly from the two shipped binaries with `fontTools` — summed `hmtx` advances over `unitsPerEm`, plus the declared `0.05em` tracking per character — so these are properties of the files on disk, not estimates:

| Label (as rendered, uppercase) | 400 | 800 | Increase |
|---|---|---|---|
| `PROJECTS` | 5.378em | 5.659em | **+5.22%** |
| `CAD GALLERY` | 7.103em | 7.586em | **+6.80%** |
| `READ MORE` | 6.130em | 6.550em | **+6.85%** |
| `VIEW MODEL` | 6.848em | 7.328em | **+7.01%** |
| `CSS` (narrowest pill) | 2.157em | 2.235em | +3.62% |
| `AUTODESK INVENTOR` | 11.390em | 12.166em | +6.81% |
| `WATERJET FABRICATION` (widest pill) | 13.200em | 14.096em | **+6.79%** |

The increase is **+3.6% to +8.5%, clustering near +6.8%** — materially less than the 60–100% jump Horizon caused for headings (risk R1), but real and non-uniform.

**Rendered label widths at the four required viewports (Req 11 c16).** Computed from the measured em widths above and the declared root steps (12pt = 16.00px at ≤xlarge, 11pt = 14.67px at ≤large, 10pt = 13.33px at ≤xxsmall), so 1024px and 768px share a row:

| Label | Size | 320px | 768/1024px | 1440px |
|---|---|---|---|---|
| `PROJECTS` | 0.8rem | 57.4 → **60.4** | 63.1 → **66.4** | 68.8 → **72.4** |
| `CAD GALLERY` | 0.8rem | 75.8 → **80.9** | 83.3 → **89.0** | 90.9 → **97.1** |
| `READ MORE` | 0.7rem | 57.2 → **61.1** | 62.9 → **67.2** | 68.7 → **73.4** |
| `VIEW MODEL` | 0.7rem | 63.9 → **68.4** | 70.3 → **75.2** | 76.7 → **82.1** |
| `WATERJET FABRICATION` | 0.55rem | 96.8 → **103.4** | 106.5 → **113.7** | 116.1 → **124.0** |

*(px, 400 → 800. The 0.7rem row is the `.actions .button` override; the 0.55rem row is the homepage pill.)*

**How each group is verified, rather than assumed:**

- **Nav bar (Req 11 c10) — low risk, and the numbers say why.** The two labels together grow from 159.7px to 169.5px at 1440px, an absolute increase of **9.8px** inside a 1312px content box. Even at 320px the pair totals 141.3px. The nav is a flex row with `flex-grow`/`flex-shrink` on `ul.links`, so it has slack in every direction. Verified by Property 3's bounding-box arm at all four viewports rather than by inspection, because the nav also carries a logo and a right-hand icon group that the arithmetic above does not model.
- **Buttons (Req 11 c11) — low risk, structurally.** `.button` is `inline-block` with `width: auto` and `padding: 0 2rem` (0 1rem under the `.actions` override), so the box grows with its label; the label cannot overflow a box that sizes to it. `white-space: nowrap` is retained as c11 requires. The `.fit` variant on `cad.html` is `width: 100%`, which has even more room. The exposure is not clipping but *reflow* — a wider button changing how the actions row wraps — which Property 5's containment arm covers.
- **Pills (Req 12) — the binding case, and it does fail today.** At 0.55rem the widest label reaches 124.0px at 1440px, and against the shipped `padding: 0 0.4rem` that puts the label-to-pill width ratio at **0.893**, over the 0.88 ceiling of Req 12 c5. This is a genuine measured breach introduced by the weight change, and §5.4 is its remedy.

**The interaction with Requirement 12 is direct, so the two are one change.** Requirement 11 widens the labels; Requirement 12 resizes the boxes that hold them. Landing 11 without 12 ships a measurable Req 12 c5 failure, so they belong in the same commit and the same verification run. Req 11 c12 also constrains the remedy in advance: a label that will not fit must be given a **larger box**, never a smaller font (the Req 5 c3 floor), never a return to weight 400, and never `text-overflow` truncation.

### 5.4 Skills pill box geometry (Req 12)

Requirement 12 deliberately pins **no pixel values**, and its criterion 13 makes measuring and recording them a design-phase obligation. This section discharges that: it states the measurement procedure, records what the current geometry measures, and derives values that satisfy the bounds.

#### What the shipped geometry measures — two distinct faults

**Homepage geometry** (`body.home #main .button.skills`: `font-size: 0.55rem`, `min-height: 1.7rem`, `padding: 0.15rem 0.4rem`, `line-height: 1.4`, 1px border):

| Bound | Req | Shipped value | Verdict |
|---|---|---|---|
| width ratio ≤ 0.88 | 12 c5 | **0.891–0.893** (`WATERJET FABRICATION`) | **FAIL** |
| width ratio ≥ 0.40 | 12 c5 | 0.549 (`C++`) | pass |
| height ratio 0.40–0.85 | 12 c5 | 0.453 | pass |
| vertical symmetry ≤ 1px | 12 c2 | **≈8.1px at 1440px** | **FAIL** |
| horizontal padding / vertical gap ∈ 1.5–3.5 | 12 c4 | 2.67 | pass |

The symmetry failure is the one the owner is describing as boxes mismatching their text, and its cause is worth naming precisely. Natural content height at 1440px is `line box 12.32px + 2×3.2px padding… ` — in fact `12.32 + 2×2.4 + 2 = 19.12px` — while `min-height: 1.7rem` forces **27.2px**. In normal block layout the line box sits at the top of the box and *all* 8.08px of surplus accumulates below it: top gap 2.4px, bottom gap 10.5px. The §3.5 comment claiming this arrangement "restores vertical centring" is simply incorrect, and no amount of padding tuning fixes it while a `min-height` larger than the content dominates.

**Wider-context geometry** (`.button.skills, .actions .button`: `font-size: 0.7rem`, `height: 2.25rem`, `line-height: 2.25rem`, `padding: 0 1rem`) is worse, and fails in a way that is invisible until the ratios are written down:

| Bound | Req | Shipped value | Verdict |
|---|---|---|---|
| height ratio ≤ 0.85 | 12 c5 | **1.000** | **FAIL** |
| horizontal padding / vertical gap ∈ 1.5–3.5 | 12 c4 | **undefined** (gap = 0) | **FAIL** |
| width ratio 0.40–0.88 | 12 c5 | 0.424–0.831 | pass |

`line-height: 2.25rem` is a **length**, not a ratio, and it is set equal to `height`. So the rendered line box exactly fills the box: the height ratio is 1.000 against a 0.85 ceiling, and Req 12 c4's "half the difference between the declared `height` and the rendered line box height" evaluates to **zero**, making any non-zero horizontal padding an infinite multiple of it. This is the classic fixed-height/matched-line-height centring trick, and it is unsatisfiable under Requirement 12 as written — not because the requirement is unreasonable, but because that trick leaves no vertical padding to be in ratio *with*.

#### Measurement procedure (Req 11 c16, Req 12 c13)

Two layers, because they answer different questions and have different costs.

**Layer 1 — font metrics, from the binaries.** Already run; it produced the tables in §5.3 and the ratios above. Deterministic, no browser, no fonts to load:

```bash
python3 - <<'PY'
from fontTools.ttLib import TTFont
F = {w: TTFont(f'assets/webfonts/PPTelegraf-{n}.otf')
     for w, n in (('400','Regular'), ('800','Ultrabold'))}
def width_em(w, s, ls=0.05):
    f = F[w]; upm = f['head'].unitsPerEm; cmap = f.getBestCmap(); hmtx = f['hmtx']
    return sum(hmtx[cmap[ord(c)]][0] for c in s) / upm + ls * len(s)
for s in ('PROJECTS','CAD GALLERY','READ MORE','VIEW MODEL','CSS','WATERJET FABRICATION'):
    a, b = width_em('400', s), width_em('800', s)
    print(f'{s:24s} {a:7.3f}em -> {b:7.3f}em  {(b/a-1)*100:+.2f}%')
PY
```

This layer establishes the *label* box. It cannot establish the *pill* box, because that depends on layout: the card's content width, the `skills-box` flex gap, and how many pills share a row.

**Layer 2 — rendered boxes, in a real browser.** Playwright, headless Chromium, with the real fonts confirmed loaded via `document.fonts.check('0.55rem "PP Telegraf"')` before any measurement — a measurement taken during the fallback window is a measurement of Helvetica, not Telegraf. For each of the **9 pages × 4 viewports** {320, 768, 1024, 1440} and every `a.button.skills`:

1. Read the pill's `getBoundingClientRect()` and its resolved `padding`, `border-width` and `min-height`.
2. Read the **label** box from a `Range` over the anchor's text node via `getClientRects()` — not from the anchor's own rect, which is the pill. This distinction is the whole point: `getClientRects()` on a Range returns one rect per rendered line, which gives per-line widths for the wrap case and the true glyph extent for the ratio bounds.
3. Derive the four left/right/top/bottom gaps, the width and height ratios of Req 12 c5 and c6, and the padding-to-gap ratio of c4.
4. Record the narrowest and widest label of each geometry, as c13 requires, and assert pill-to-pill non-overlap and card containment (c12).

Layer 2 is the authority. Where Layer 1 and Layer 2 disagree, Layer 2 wins — subpixel rounding, hinting and the flex gap are all outside the arithmetic.

#### Chosen values

> **These are derived, not yet browser-measured.** The label widths are measured from the shipped binaries and the pill boxes are computed from the declared CSS and root steps. The ratios below therefore have the status of *predictions with a measured input*, and Req 12 c13 is discharged only once Layer 2 records the rendered numbers. Implementation runs Layer 2 first and adjusts padding, `min-height` or `line-height` if any bound is missed, exactly as Req 12 c11 directs.

**Homepage geometry:**

```scss
body.home #main .button.skills {
    font-size: 0.55rem;         // UNCHANGED — Req 12 c11 forbids reducing it
    line-height: 1.4;           // UNCHANGED — a ratio, so it survives wrapping
    padding: 0.2rem 0.55rem;    // was 0.15rem 0.4rem
    min-height: 1.35rem;        // was 1.7rem
    display: inline-flex;       // was inline-block (inherited from .button)
    align-items: center;        // splits any residual vertical slack evenly
    justify-content: center;
    white-space: normal;        // UNCHANGED — Req 12 c8
    height: auto;               // UNCHANGED — Req 12 c8, c11
}
```

**Wider-context geometry:**

```scss
.button.skills,
.actions .button {
    font-size: 0.7rem;          // UNCHANGED
    height: 2.25rem;            // UNCHANGED — no box-size change
    line-height: 1.4;           // was 2.25rem — a LENGTH equal to height; now a ratio
    padding: 0 1rem;            // UNCHANGED
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
```

Predicted ratios, identical at all four viewports because every input except the 1px border scales with the root step:

| Geometry | Label | width ratio (0.40–0.88) | height ratio (0.40–0.85) | pad/gap (1.5–3.5) |
|---|---|---|---|---|
| homepage | `WATERJET FABRICATION` | 0.861–0.864 | 0.570 | 2.75 |
| homepage | `AUTODESK INVENTOR` | 0.843–0.845 | 0.570 | 2.75 |
| homepage | `CSS` | 0.496–0.501 | 0.570 | 2.75 |
| homepage | `C++` (narrowest) | 0.481–0.486 | 0.570 | 2.75 |
| wider | `WATERJET FABRICATION` | 0.831 | 0.436 | 1.57 |
| wider | `C++` (narrowest) | 0.424 | 0.436 | 1.57 |

Reasoning behind each number:

- **Horizontal padding 0.4rem → 0.55rem (homepage).** The 0.88 ceiling requires the pill border-box to be at least `label / 0.88` wide. At the widest label that means padding ≥ **0.466rem** at 1440px, ≥0.460rem at 768/1024px, ≥0.454rem at 320px. `0.5rem` would clear it at 0.873 — passing, but with 0.007 of headroom against a bound, which browser rounding could erase. `0.55rem` lands at 0.864 and keeps the narrowest label at 0.481, comfortably inside both ends.
- **Vertical padding 0.15rem → 0.2rem (homepage).** Forced by Req 12 c4, not by appearance. With horizontal padding at 0.55rem, the 3.5× ceiling requires vertical padding ≥ 0.157rem, so 0.15rem is *out of bounds by itself*. `0.2rem` gives a ratio of 2.75, mid-range.
- **`min-height` 1.7rem → 1.35rem (homepage).** Req 12 c7 sets a floor: `min-height` ≥ one line box + vertical padding + borders. That sum is **1.295rem** at 1440px, 1.306rem at 768/1024px and **1.320rem** at 320px — the 320px case being largest because the 2px border is absolute and so a bigger fraction of a smaller root. `1.35rem` clears the worst case with 0.03rem to spare. The old `1.7rem` exceeded the content by ~8px, which is exactly what produced the c2 asymmetry.
- **`display: inline-flex` with `align-items: center`.** This is the belt to `min-height`'s braces. Even at 1.35rem a residual ~0.88px of slack exists at 1440px; block layout would drop all of it below the text, flex centring splits it to ~0.44px per side, inside the 1px tolerance of Req 12 c2 with margin. It also makes c2 hold *structurally* rather than by arithmetic coincidence, so a future font or root-step change cannot silently reintroduce the fault. Multi-line wrapping is unaffected — the text becomes a single anonymous flex item that still wraps internally under `white-space: normal` — so Req 12 c8 and Req 5 c7 are preserved.
- **Wider-context: change `line-height` only.** `2.25rem` → `1.4` converts a length into a ratio, which simultaneously fixes both faults: the height ratio drops from 1.000 to **0.436** (inside 0.40–0.85), and the vertical gap becomes `(36 − 15.68)/2 = 10.16px` at 1440px, putting the 1rem horizontal padding at **1.57×** it (inside 1.5–3.5). `height: 2.25rem` and `padding: 0 1rem` are deliberately left alone so the Read More and View Model boxes do not change size — Req 11 c13 and Req 8 c5 both favour minimal box churn, and this reaches the bounds without any.
- **Two-line case (Req 12 c6).** Homepage: two line boxes total 1.54rem against a border-box of 2.09rem → **0.737**, inside the 0.90 ceiling. No label in current content wraps at these sizes, so this path is exercised by generated over-long labels in Property 15, as Property 5 already does for Req 5 c7.

**Documented fallback if Layer 2 misses a bound.** The two thinnest margins are the wider-context height ratio (0.436 against a 0.40 floor) and its narrowest width ratio (0.424 against the same floor). If either measures below 0.40, apply `height: 2.1rem` with `padding: 0 0.9rem`, which computes to **0.467** height ratio and **0.450–0.846** width ratios — more margin at both ends, at the cost of a slightly shorter Read More / View Model box. This is a recorded fallback with computed consequences, not an open question, and Req 12 c11 sanctions exactly this class of adjustment.

Req 12 c9 holds throughout: `border-radius: 999px`, `background-color`, border colour and width, and label colour are untouched in both geometries. The correction changes fit, not appearance.

### 5.5 Back to top control and the retained design credit (Req 13)

#### Markup — identical on all nine pages

Current content, inside `div#copyright` on every page:

```html
<ul><li>Fonts &amp; icons: <a href="https://html5up.net">HTML5 UP</a></li></ul>
```

Replacement:

```html
<ul><li><a href="#top">Back to top</a></li><li>Design: <a href="https://html5up.net">HTML5 UP</a></li></ul>
```

Two `<li>` elements, matching the two-element structure Req 13 c12 requires. This slots into the existing `#copyright ul li` styling with no CSS work: those items are `inline-block` with `border-left: solid 2px` and `:first-child { border-left: 0 }`, so the second item automatically gets the template's divider rule — and at `<=xsmall` they stack, which the existing breakpoint already handles.

**Page-by-page application (Req 13 c13, c14).** Six pages write `#copyright` across multiple source lines and three — `killerbyte.html`, `launchtoy.html`, `vexlego.html` — write the whole div on one line; the replacement respects each page's existing line layout while emitting **identical inner markup structure and identical text**. `vexlego.html` currently differs from the other eight by writing the ampersand as `&amp;` where they use a bare `&`. The new wording contains **no ampersand at all**, which retires that divergence: after this change all nine pages carry a byte-identical `<ul>…</ul>`, and Req 13 c14's escaping rule is satisfied vacuously rather than by nine careful edits. Property 16 asserts the byte-identity so a future single-page edit cannot drift.

#### `#top` versus `#wrapper`

Req 13 c4 permits either. **Decision: `href="#top"`.**

- **It is guaranteed by specification, not by markup.** The HTML standard defines the indicated part of a document for the fragment `top` (ASCII case-insensitive) as the **top of the document** when no element has that ID — so the link cannot be broken by a markup change. `href="#wrapper"` depends on an element continuing to exist; `#wrapper` is present on all nine pages today, but that is a fact about current markup rather than a guarantee.
- **It targets the document origin rather than an element's box.** `#wrapper` scrolls to the wrapper's box position, which is the document top today only because nothing precedes it and it has no top offset. Both facts are incidental.
- **Neither option requires markup outside the Copyright_Block**, so Req 8 c5's pin on element set, count, order and nesting elsewhere is respected by both. That rules out inventing an `id="top"` anchor at the top of `<body>`.
- **`#wrapper` is recorded as the sanctioned fallback**, since c4 names it and the element genuinely is present on all nine pages. If a target browser is found not to honour the `top` special case, switching is a one-token change per page with no other consequence.

Req 13 c6 is satisfied by construction: the `href` is a real same-document fragment, not `href="#"` and not a `javascript:` URL.

#### No JavaScript, and no jQuery

Req 13 c5 requires the control to work with scripting disabled, or `jquery.scrolly.min.js` failing to load, or any other script failing. A native `<a href="#top">` satisfies this because fragment navigation is a **browser** behaviour, not a scripted one.

**`class="scrolly"` is deliberately not used**, even though the site already loads `jquery.scrolly.min.js` and the intro down-arrow (`href="#main"`) uses it. Scrolly binds a click handler that calls `preventDefault()` and animates via jQuery. That would *technically* still degrade correctly — with no JS the handler never binds and the native jump happens — but it would make the control's *intended* behaviour depend on jQuery, three script files and a plugin, for nothing but easing. Requirement 13's whole thrust is a control that does not depend on scripting, so the easing comes from CSS instead:

```css
html { scroll-behavior: smooth; }

@media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
}
```

Three notes on this:

- **`prefers-reduced-motion` is honoured**, because an unrequested full-page scroll animation is precisely the class of motion that setting exists to suppress. The reduced-motion arm restores an instant jump.
- **`scroll-behavior` must sit on the scrolling element**, so it is necessarily global rather than scoped to the link. Its only other same-document consumers are the `scrolly` anchors, and scrolly calls `preventDefault()` — no native scroll occurs, so no double-animation. When scripting is off, those anchors get CSS smoothing too, which is an improvement rather than a regression. The interaction with `jquery.scrollex` (which observes scroll position for the intro fade) is the one thing worth watching, and it is covered by Check F's console-error and animation run.
- **It is optional to the requirement.** Req 13 c2 asks only that the top of the document be brought into the viewport. If Check F shows any interference, dropping the `scroll-behavior` block leaves an instant jump that still satisfies c2, c3 and c5 in full.

#### Accessibility

| Criterion | Mechanism |
|---|---|
| c7 accessible name | Visible text `Back to top`, which is the anchor's accessible name. No `aria-label` needed, and none added — a redundant label risks diverging from the visible text. |
| c8 keyboard reachable | A native `<a>` with an `href` is in the tab order by default. No `tabindex` is declared on it or any ancestor, so no positive value can exist. |
| c3 keyboard activation | Enter on a focused anchor performs the same navigation as a click. No `keydown` handler required. |
| c9 focus indicator | See below. |
| c17 pointer cursor | `#copyright` sets `cursor: default` on its static text; both links need an override. |

```css
#copyright a { cursor: pointer; }                    /* Req 13 c17 */

#copyright a:focus-visible {
    outline: 2px solid currentColor;                 /* Req 13 c9 — 2px, spans the text box */
    outline-offset: 2px;
}
```

`currentColor` resolves to the Copyright_Block text colour, which §5.6 sets to a composite of **`#b0b3b6`** = **7.33:1** against `#1e252d` — well past the 3.0:1 of Req 13 c9. Binding the ring to `currentColor` rather than a literal means it tracks the block colour automatically, so §5.6 and this rule cannot drift apart. `outline` rather than a border, for the same reason as §3.6: it spans the full text box and alters no layout. `:focus-visible` keeps the ring off pointer clicks.

Req 13 c15 (Copyright_Block typography preserved — `PP Telegraf`, 0.8rem, uppercase, declared letter-spacing, 1.5 line-height, centred alignment) holds because none of the rules above touches those properties; only `color`, `cursor` and the focus outline change.

#### The HTML5 UP credit is retained, and reworded

**The Design_Credit stays.** The owner asked whether it could be dropped, given that the fonts are no longer HTML5 UP's and the site now looks and behaves very differently from the published Massively demo. The recorded answer is **no**, on three independent grounds:

1. **The credit is the consideration, not a courtesy.** [html5up.net/license](https://html5up.net/license) places the templates under **Creative Commons Attribution 3.0** and states that personal use, commercial use and modification are all permitted — with credit for the design given in exchange. HTML5 UP separately sells attribution-free usage through Pixelarity. That an attribution-free tier is a *paid product* settles the character of the free tier's credit: it is the price, not etiquette.
2. **CC BY 3.0 attaches attribution to adaptations, not only to verbatim copies.** So the extent of divergence does not discharge the condition. A heavily modified derivative is still a derivative, and the licence's attribution term travels with it. "It looks nothing like the demo" is an argument about *how much* was changed, and the licence does not condition attribution on that quantity.
3. **The Site remains substantially template-derived, as a matter of fact.** Verified against the repository: **24 files under `assets/sass/` carry the Massively header** (22 partials plus `main.scss` and `noscript.scss`); six template JavaScript files still ship (`main.js`, `util.js`, `breakpoints.min.js`, `browser.min.js`, `jquery.scrollex.min.js`, `jquery.scrolly.min.js`); and the `#wrapper`, `is-preload`, `split contact`, `icons` and `actions` structures appear on all nine pages. This design document's own §5.4 fallback and §5.5 markup both build directly on template CSS (`#copyright ul li`, `.button`), which is the clearest possible demonstration that the template is still load-bearing.

**The one supported route to removing the credit is a Pixelarity licence**, which is what HTML5 UP sells for exactly this purpose. That would be a new owner decision outside this spec, and it is a purchase rather than a code change.

**What does change is the wording.** "Fonts & icons: HTML5 UP" is now simply inaccurate: Heading_Font is Horizon (Alberto Fontense) and Body_Font is PP Telegraf (Pangram Pangram Foundry), both credited under Req 9 c3 in `README.md`. Only the Font Awesome icons still come through the template. The credit is therefore reworded to what it actually is — a **design** credit — satisfying Req 13 c10 (visible, names HTML5 UP, links to `https://html5up.net`) and c11 (worded as a template/site design credit, not a fonts or icons credit).

*Licence terms above are summarised from the linked page rather than quoted; content was rephrased for compliance with licensing restrictions, and html5up.net/license is authoritative for the actual terms. This is a reading of the licence for design purposes and not legal advice.*

### 5.6 Legible copyright bar (Req 14)

**Decision: alpha 0.25 → 0.65, composited `#b0b3b6`, measured 7.33:1 against `#1e252d`.**

```scss
// assets/sass/layout/_footer.scss:227 — #copyright
color: transparentize(_palette(invert, fg), 0.35);   // was 0.75. alpha 0.25 -> 0.65
```

`transparentize($color, $amount)` *subtracts* `$amount` from the alpha, so the target alpha 0.65 is written as `0.35`. The compiled mirror is `rgba(255, 255, 255, 0.65)`.

**Correction to a claim this document previously made.** Conflict C3 recorded the deferred remedy as "raise the alpha to ~0.65 (≈4.6:1)". **That pairing is wrong.** Measured values for white over `#1e252d`:

| Alpha | Composite | Ratio vs `#1e252d` |
|---|---|---|
| 0.25 (shipped) | `#565c62` | 2.27:1 |
| 0.50 | — | 4.94:1 |
| 0.60 | — | 6.46:1 |
| **0.65 (chosen)** | **`#b0b3b6`** | **7.33:1** |

Alpha 0.65 gives **7.33:1**, not ≈4.6:1; ≈4.9:1 falls near alpha **0.50**. The direction of the old note was right and the alpha it named was right — only the paired ratio was wrong, by conflating two different points on the curve. Every occurrence of the "≈4.6:1" claim is corrected: here, in conflict C3, and in Property 1's exception table (where the entry is removed outright). Req 14 c6 requires the design to record a *measured* pairing rather than restate the unreconciled one, which this table does.

**Why 0.65 rather than 0.50, when Req 14 c1 only asks for 4.5:1.** The deciding factor is the hover state, not the default. The Copyright_Block now hosts an interactive control, and `#copyright a` inherits the block colour while hover resolves to the `invert` palette accent `#18bfef` = **7.17:1** against `#1e252d`:

| Alpha | default ratio | hover ratio | default → hover change |
|---|---|---|---|
| 0.50 | 4.94:1 | 7.17:1 | **+45%** — hover looks markedly stronger than default |
| **0.65** | **7.33:1** | 7.17:1 | **−2%** — visually the same strength |

At 0.65 the default and hover states sit at essentially identical contrast, so the control reads with consistent weight whether or not the pointer is on it. At 0.50 the default state would look conspicuously weaker than its own hover — an odd signal for a control that should be discoverable *before* being hovered. Both alphas satisfy Req 14 c1–c3; 0.65 is chosen for state consistency, and this is the rationale Req 14 c6 asks to be recorded.

**Full state table (Req 14 c1–c3):**

| Element | State | Colour | Ratio vs `#1e252d` | Bound |
|---|---|---|---|---|
| Copyright_Block static text | default | `rgba(255,255,255,0.65)` → `#b0b3b6` | **7.33:1** | ≥4.5:1 ✓ |
| Back_To_Top_Control | default | inherited `#b0b3b6` | **7.33:1** | ≥4.5:1 ✓ |
| Design_Credit link | default | inherited `#b0b3b6` | **7.33:1** | ≥4.5:1 ✓ |
| either link | hover / active | `#18bfef` (invert accent) | **7.17:1** | ≥4.5:1 ✓ |
| either link | focus | `#b0b3b6` text + 2px `currentColor` ring | **7.33:1** | ≥4.5:1 ✓, ring ≥3.0:1 ✓ |

Both links resolve their default colour through the existing `#copyright a { color: inherit }` rule, so one declaration change carries all three default-state rows. This is also why Req 14 c5 (a single colour value, resolving identically on all nine pages, applied to the `#copyright` rule only) is satisfied without adding per-link colours.

**Scope (Req 14 c4, c5, c8).** The edit changes only the `transparentize` amount inside the `#copyright` rule. `invert.fg` stays `#ffffff`, the Copyright_Block background stays `#1e252d`, and every other rule resolving through the `invert` palette is untouched — so Req 8 c7 continues to hold with `alt.fg-link` as the single changed palette value (§4.2). The footer `h3` at 4.05:1 and the footer social icon links are explicitly **not** touched: conflict C2 stands as decided, and the Req 1 c11 exemption reaches the Copyright_Block and nothing else.

**Consequence for Property 1 (Req 14 c7).** The `#copyright` entry is **removed** from that property's accepted-exceptions set, leaving the footer `h3` as the only member. This is not bookkeeping: the set pins each entry to a *measured* ratio and fails if the measurement drifts in either direction, so leaving a 2.27:1 entry in place while shipping 7.33:1 would turn a successful fix into a red check.

### 5.7 Horizon licence text — recorded accepted position (Req 9 c2 amended)

One file changes: `assets/webfonts/FONT-PROVENANCE.md`. No font file, no stylesheet, no page.

**Field edit** in the `## Horizon.woff2` record:

```diff
- | `licence_text_file` | *none — see TODO below* |
+ | `licence_text_file` | *none — accepted, see note* |
```

**Block replacement.** The record currently carries a `**TODO (owner):**` block instructing the owner to save `Horizon-LICENSE.txt` and close Req 9 c2. That block is removed and replaced by a recorded position:

> **Accepted position — no vendor licence text is available for Horizon.** No licence or EULA text for Horizon could be located from the designer's own channels. Requirement 9 criterion 2 no longer requires a stored licence text file for Heading_Font; criterion 9 substitutes a recorded-fields obligation, met by the four fields already present in this record: licence tier *free for personal use*, designer *Alberto Fontense*, source URL, and download date. **This is a closed decision, not an outstanding action.**
>
> The obligation itself is unchanged. Horizon's free-personal-use terms bind the Site whether or not a copy is stored here, so the Non_Commercial_Use constraint of Requirement 9 criteria 4 and 5 applies to Horizon exactly as before. No substitute licence file is invented, and the designer's terms are paraphrased rather than reproduced.

Three properties of this edit are deliberate:

- **`licence_text_file` carries a sentinel, not an empty cell.** Req 9 c11 requires a value denoting "none — accepted", so the distinction between *recorded as absent* and *forgotten* survives in the data. Property 11 is adjusted to accept the sentinel for Heading_Font and to keep requiring a real, present file for Body_Font — where `EULA-PangramPangram-FreeForPersonalUse-MAY2021.pdf` does ship.
- **No file is invented.** Req 9 c11 forbids fabricating or paraphrasing a licence file in place of the real one, so Property 11 must also fail if a `Horizon-LICENSE.txt` appears whose provenance is not the designer. The safe check is presence-of-sentinel, not presence-of-file.
- **The four recorded fields are already non-empty**, so this is a note edit rather than a data-gathering exercise. Nothing blocks it.

Req 9 c3's `README.md` credits (Horizon → Alberto Fontense, PP Telegraf → Pangram Pangram Foundry, each with its licence tier) are unaffected and stay as shipped.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This project is a good fit for property-based testing despite there being no application code, because the acceptance criteria quantify over an input space far too large to enumerate by hand: **9 pages × 4 viewports × 2 font states × ~40 in-scope elements per page**, plus every colour pair, every selector, and every font file. The oracles are all computable — the WCAG luminance formula, string equality of resolved declarations, bounding-box containment, `cmap` membership, SHA-256 equality. What PBT is *not* used for is recorded in the Testing Strategy: GitHub Pages' compression and same-origin behaviour, Font Awesome icon rendering, and the water-particle canvas are integration concerns whose behaviour does not vary with input.

Prework classified ~70 of the 106 criteria as property-shaped and then consolidated them: many criteria are the same universal quantification seen through different requirements. The 16 properties below are the result, and no two share both an oracle and a generator. Properties 1–13 come from Change Set 1 and several are **extended** by Change Set 2; Properties 14–16 are new and cover Requirements 10, 12 and 13. Requirement 11 and Requirement 14 deliberately add **no** new property — they are absorbed by the existing weight clause of Property 4 and the threshold clause of Property 1 respectively, because inventing near-duplicates of those oracles would add checks without adding discrimination.

### Property 1: Every declared colour pair meets its contrast threshold

*For all* (foreground, background, element-role, interaction-state) tuples derived from the typography scope, **either** the tuple is a member of the accepted-exceptions set defined below and its measured WCAG 2.1 relative-luminance contrast ratio equals the ratio recorded for it there, **or** that measured ratio is greater than or equal to the threshold for its role — 7.0:1 for the footer email link in its default state, 3.0:1 for its underline in every state and for every focus indicator, and 4.5:1 for Heading_Text, Body_Text and Chrome_Text, the Copyright_Block, the Back_To_Top_Control and the Design_Credit link in their default, hover, focus and active states — and, in every case, the footer email link's default colour has a strictly lower relative luminance than `#717981`.

Generator: the `$palette` maps plus every `color`/`border-bottom-color`/`outline-color` declaration in the typography scope, crossed with `{default, hover, focus, active}`. Any `rgba()` value is alpha-composited over its resolved backdrop before measurement — the defect this catches is precisely a translucent underline that looks fine and measures 1.85:1, and it is the same mechanism that measures the Copyright_Block's `rgba(255,255,255,0.65)` as its composited `#b0b3b6`.

**Accepted-exceptions set — exactly one entry, following the Change Set 2 reversal of conflict C3:**

| Foreground | Element / role | State | Recorded ratio |
|---|---|---|---|
| `#717981` | `#footer h3` label — Heading_Text (conflict C2) | default | **4.05:1** |

**The `#copyright` entry was removed by Change Set 2 (Req 14 c7).** It previously recorded `rgba(255,255,255,0.25)` over `#1e252d` → `#565c62` at 2.27:1 as an accepted shortfall under conflict C3. That shortfall is now **fixed, not accepted**: §5.6 raises the alpha to 0.65 for a composited `#b0b3b6` at **7.33:1**, so the pairing is checked against the ordinary ≥4.5:1 Chrome_Text threshold like any other. Removing the entry is mandatory rather than tidy-up — the set pins each member to a measured value and fails when that value drifts *in either direction*, so a stale 2.27:1 entry would make the successful fix read as a failure.

The exception set is what stops an accepted shortfall from producing a red failure while keeping the check honest, and it is built to fail in three distinct ways rather than one:

- A tuple **outside** the set that misses its threshold fails loudly — so any *new* contrast regression is caught exactly as before. This is the clause that carries the property's value, and after Change Set 2 it is the clause that guards the Copyright_Block, the Back_To_Top_Control and the Design_Credit link.
- A tuple **inside** the set whose measured ratio no longer equals the recorded value (compared at the recorded two-decimal precision) also fails, in either direction. An accepted exception is pinned to a measurement, not waved through: if `#footer h3` drifts to 3.4:1 the check breaks, and if someone fixes it to 9.49:1 the check breaks too and the entry must be retired — which is exactly the mechanism that has just retired the `#copyright` entry.
- Every run **reports** the remaining entry as *known-and-accepted*, with its ratio and its conflict ID, so the shortfall stays visible in output instead of disappearing.

**The set is a deliberate, reviewed exception list, and adding an entry to it requires an explicit owner decision.** Its sole member exists because Req 1 c11 was ruled to win over Req 3 c14; nothing else qualifies, and Req 14 c8 keeps that ruling in force for the footer `h3` even while reversing it for the Copyright_Block. Silently appending an entry to make a failing check pass would turn this list into a place to hide real defects, which is precisely the failure mode it must not enable — so a change to the set is reviewed as a scope decision, not as a test fix. The hover accent of conflict C4 is deliberately **not** an entry: Req 1 c4 mandates that colour, so the property scopes the mandated transient hover state out of the ≥4.5:1 Body_Text clause instead of admitting it as an exception. Note that the Copyright_Block links need no such carve-out — their hover accent `#18bfef` measures **7.17:1** against the dark `#1e252d` and passes outright.

**Validates: Requirements 1.1, 1.2, 1.6, 1.7, 3.14, 4.7, 5.6, 11.14, 13.9, 14.1, 14.2, 14.3, 14.7**

### Property 2: Compiled CSS is value-identical to the resolved SASS source

*For all* selectors governing Heading_Text, Body_Text or Chrome_Text, and for all five properties `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, the value declared in `assets/css/main.css` equals the value obtained by resolving that selector's declaration in the SASS source through the `$font` and `$palette` maps, with zero differing declarations.

Oracle detail: resolution must apply **last-declaration-wins** within a rule, because the compiled output already contains duplicate declarations for one property in one rule (`#footer` declares `color` twice, from the `color(alt)` mixin). A checker that reads the first match would report a false failure.

**Validates: Requirements 7.1, 7.2, 7.3, 7.8**

### Property 3: Typography is invariant across pages, per role

*For all* element roles in the typography scope, all viewport widths in {320, 768, 1024, 1440}, and all pairs of the nine Content_Pages on which that role appears, the computed font-family stack, font-weight, font-size, line-height and letter-spacing are equal — font-size within 0.01rem and line-height within 0.05 — and every computed size respects its floor: the footer email link at ≥0.8rem, Body_Text at ≥13px, and Chrome_Text at ≥0.7rem.

Two scoping rules, both forced by measurement: roles are compared **per role, not per tag** (conflict C5 — base `h2` 1.75rem, card `h2` 1.1rem and post `h2` 1.5rem legitimately differ), and a page on which a role does not appear is skipped rather than failed (`cad.html` has no `h1` and no `h2`).

**Validates: Requirements 1.3, 1.8, 4.13, 5.3, 8.1, 8.2, 8.3, 8.9**

### Property 4: Every element resolves to the token model

*For all* in-scope elements on all nine Content_Pages: Heading_Text resolves to a stack headed by Horizon and Chrome_Text and Body_Text to a stack headed by Telegraf, with no Chrome_Text element resolving to Horizon; every computed font-weight is a member of the shipped-face weight set, so no browser-synthesized weight is ever relied upon; every heading letter-spacing lies within −0.02em…0.02em and every Chrome_Text letter-spacing within 0.025em…0.075em; heading line-height lies in 1.05…1.20 for the intro `h1` and 1.20…1.50 for `h1`–`h6`, and Body_Text line-height in 1.6…1.9; consecutive heading levels differ by at least 0.1rem in strictly decreasing order; every computed pixel size equals the declared rem value times the expected root step for that viewport; `em`/`i` elements remain in the Telegraf family with an italic style; and every declaration naming either webfont terminates in `sans-serif`.

The weight clause is the high-value one: it fails on the card `h2`'s hardcoded `font-weight: 700` against a single-weight Horizon — the exact synthesized bold that Req 3 c4 forbids.

**Extended by Change Set 2 for Requirement 11.** The weight clause is refined from "a member of the shipped-face weight set" to a *partition* over Chrome_Text: every **Bold_Chrome_Text** element — the `#nav ul.links` anchors, every `.button` label including the `.button.primary` / `.button.primary.small.fit` View Model variants, and every `a.button.skills` — computes to exactly **800**, and every other Chrome_Text element — form labels, pagination links, table headers, nav-panel links and the Copyright_Block — computes to exactly **400**. Both values must be present in the shipped-face weight set `{400, 800}`, so no synthesized or interpolated weight can satisfy either side. The family clause covers Req 11 c5 unchanged: Bold_Chrome_Text still resolves to a stack headed by `PP Telegraf`, so a weight change that accidentally alters the family fails here.

This is why Requirement 11 gets no property of its own. The partition is the *same* oracle — computed weight against the shipped `usWeightClass` set — read at a finer grain, and the two halves fail each other's mistakes: bolding too much trips the 400 clause, bolding too little trips the 800 clause. A separate "Bold_Chrome_Text is bold" property would duplicate the generator and the oracle while catching a strict subset of what this clause catches.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.7, 3.8, 3.10, 4.2, 4.5, 4.6, 4.11, 4.12, 5.1, 5.2, 5.8, 6.3, 11.1, 11.2, 11.5, 11.6, 11.8, 11.15**

### Property 5: Nothing overflows, in either font state

*For all* (page, viewport ∈ {320, 768, 1024, 1440}, font-state ∈ {webfonts-loaded, webfonts-blocked}) combinations, the document produces no horizontal scrollbar (`scrollWidth ≤ clientWidth`), every heading, paragraph, card description and skills-button label is fully contained within its containing block with no clipped character, every in-scope element has non-empty text and a non-zero bounding box, the intro `h1` occupies exactly one line at 768/1024/1440 and at most two lines at 320, and every skills label of 20 characters or fewer occupies exactly one line inside its card while any longer label wraps inside the card bounds without page overflow.

Font-state is a generator dimension rather than a separate property, which is what makes the swap-reflow criteria (Req 6 c7–c9) fall out of the same run. Long-label wrapping requires **generated** labels longer than any current content — today's maximum is exactly 20 characters, so real content never exercises the wrap path. This is the property that failed before Change Set 1 on `overflow-wrap` (finding F6, "Hallgrímskirkja" at 320px) and on the fixed-height `nowrap` skills pill.

**Extended by Change Set 2 for Requirement 11's containment criteria.** The containment clause now names the Bold_Chrome_Text groups explicitly: every `.button` and Skills_Pill label lies wholly inside its element's box with no clipped character and no `text-overflow` ellipsis applied; the "Read More" and "View Model" labels each occupy exactly one line inside their button's padding box; and the "Projects" and "CAD Gallery" nav labels each occupy one line inside the `#nav` content box with no two nav links overlapping. All of these run at weight 800, which is the state that makes them worth checking — §5.3 measures the labels 3.6%–8.5% wider than at 400, and the arithmetic there does not model the nav's logo and icon group or the actions row's wrap behaviour. Requirement 11 c7's glyph-collision criterion at 0.55rem is **not** in this property: overlapping outlines and filled counters are a rendering judgement, not a bounding-box computation, and it is recorded under the Testing Strategy's visual-review step instead.

**Validates: Requirements 3.11, 3.12, 3.13, 4.9, 5.4, 5.7, 6.7, 6.8, 6.9, 6.10, 10.6, 11.9, 11.10, 11.11, 12.8, 13.16**

### Property 6: No forbidden token, no off-origin font, no inline typography

*For all* (artifact, pattern) pairs over `assets/css/main.css`, the SASS sources and the nine Content_Pages: the family names `Merriweather` and `Source Sans Pro` occur zero times; every font `url()` and stylesheet `href` is relative, carries no scheme or host, and resolves to an existing local file; every `font-family` declaration in the SASS source is a `_font()` map lookup rather than a literal typeface name, except inside the `$font` map itself, the `@font-face` rules, and the Font Awesome icon families; and no inline `style` attribute and no embedded `<style>` block declares `font-family`, `font-size`, `font-weight`, `line-height` or `letter-spacing`.

Two oracle details. The literal-name clause is what catches the hardcoded `Merriweather, Georgia, serif` on the card `h2` — and, more usefully, prevents the next one. The inline-style oracle must target those five properties specifically rather than inline styles in general: `index.html` legitimately uses `style="--project-image: url(…)"` on every card, and a blanket ban would produce seven false failures on one page.

**Extended by Change Set 2.** Two additions. First, the forbidden-token set gains **`#4a5158`** as a link or underline colour: Req 1 c13 is a zero-occurrence rule, so the superseded value must appear nowhere in either artifact, and a partial replacement that leaves one of the three compiled mirrors behind fails here rather than shipping two different email colours across the site. Second, the inline-style clause is widened from the five typography properties to also cover **`text-align`** and **`color`** on the nine pages, because Req 10 c8 and Req 14 c9 both forbid achieving their effect through an inline attribute or an in-page `<style>` block — the centring and the copyright colour must live in the stylesheet where Property 2 can check parity. The `--project-image` carve-out is unaffected, since a custom property is neither of the added names.

**Validates: Requirements 1.13, 2.7, 2.11, 2.14, 7.4, 7.9, 7.10, 8.4, 10.8, 14.9**

### Property 7: Every character used is a character the font can render

*For all* characters appearing in Heading_Text or Body_Text across the nine Content_Pages, the codepoint lies inside the `unicode-range` declared for the applicable face and is present in that font's `cmap` table.

Measured content contains exactly three non-ASCII codepoints — U+00ED (í), U+00D7 (×), U+00B7 (·) — and U+00ED occurs in **heading** text ("Hallgrímskirkja" on `church.html` and `index.html`), so Horizon itself must carry it. This is the property that detects a silent per-character fallback, which reads as a subtly wrong letter rather than as an error.

**Validates: Requirements 2.9, 3.15, 3.16, 4.14**

### Property 8: Everything outside the intended delta is byte-identical to the baseline

*For all* declarations, markup structures and files outside an explicit allowlist of intended changes, the value equals its pre-change baseline in `git`: every `$palette` entry (the additive `alt.fg-link` key excepted), the footer `h3` and social-icon colours, heading `text-transform` and colour resolution, the skills and Read More button background and uppercase treatment, every `mailto:` href and its visible text, every navigation and project `href` (each internal target resolving to a file present in the repository), the set, count, order and nesting of the intro, nav, card, footer-contact, social-icon and copyright element groups on every page, and the name, count and SHA-256 of all fifteen pre-existing Font Awesome webfont files.

The allowlist *is* the specification of scope. This property is what makes "restrict the change to the email link only" mean something enforceable, given that `#717981` appears 15 times in the compiled CSS and a palette edit would silently recolour five unrelated components.

**Change Set 2 moves three items out of the baseline set and adds five to it.** Removed, because they are now intended changes: the `#copyright` colour (Req 14 exempts it — the pin survives only for the footer `h3` and the social icons, per Req 14 c8), the Card_Header_Band `text-align` value, and the *content* of the Copyright_Block (Req 8 c5 now exempts the inner markup while still pinning the block itself and its position in the footer). Added to the baseline set:

- The `text-align` resolution of **every element other than the Card_Header_Band**, and specifically the two further `text-align: left` declarations at `_main.scss:179` and `:444` — the card description paragraph rules (Req 10 c7). A careless global replace of `left` → `center` in either artifact fails here.
- The Card_Header_Band `background-color: #12263a`, `padding: 0.85rem 1rem` and box dimensions (Req 10 c9), so centring cannot be smuggled in alongside a box change that shifts card heights or grid alignment.
- The Card_Heading `font-size: 1.1rem`, `text-transform: none`, `line-height` and `color`, plus the absence of any `color` declaration on `h2 > a` (Req 10 c4, c5).
- Every Bold_Chrome_Text element's `text-transform`, `background-color`, `border`, `border-radius`, default and hover `color`, and hover transition timing (Req 11 c13), and each Skills_Pill's `border-radius: 999px`, background, border and label colour (Req 12 c9) — so the weight and geometry work cannot drift into a restyle.
- The Copyright_Block typography — `PP Telegraf`, `0.8rem`, uppercase, declared letter-spacing, `1.5` line-height and centred alignment (Req 13 c15) — and the font bundle file set, so Req 11 c4's "add no file, remove no file, change no `@font-face` rule" is checked rather than assumed.

**Validates: Requirements 1.9, 1.10, 1.11, 3.9, 5.5, 7.7, 8.5, 8.7, 8.8, 10.4, 10.5, 10.7, 10.9, 11.4, 11.13, 12.9, 13.15, 14.4, 14.5, 14.8**

### Property 9: Bundle and declarations agree, within budget

*For all* font files in the Webfont_Bundle there is exactly one corresponding `@font-face` rule, and vice versa, in which the `font-family` equals the head of the corresponding family stack, the `font-weight` equals the weight recorded in the file's `OS/2.usWeightClass`, the `format()` hint matches the format determined from the file's actual sfnt signature (`woff2` for Horizon, `opentype` for an OTF and `truetype` for a TTF Telegraf file), and `font-display: swap` is declared; the set of weights declared for Body_Text equals the set of shipped Telegraf face weights exactly, in both directions, so that no declared weight lacks a file and no shipped file lacks a declared weight; and the summed stored size of all non-Font-Awesome font files is at most 600 KB with each Telegraf file at most 400 KB.

The format hint is determined from the file's real signature rather than its extension, because a renamed file with a plausible extension is exactly the failure mode a hand-maintained stylesheet invites, and a wrong hint is a silent load failure. The size clause must exclude Font Awesome by name — those fifteen files total ~2.9 MB and would swamp a 600 KB budget applied naively.

**Validates: Requirements 2.2, 2.3, 2.5, 2.6, 2.8, 2.12, 2.13, 2.16, 4.3**

### Property 10: Focus and hover states behave as declared

*For all* nine Content_Pages, the footer email link declares a transition of at most 200 ms on `color` and `border-color`; its hover rule sets the accent `#18bfef`; and while it holds keyboard focus it carries an indicator at least 2 CSS pixels thick spanning at least the full width of the link text, which is retained when the pointer simultaneously hovers the link. **Extended by Change Set 2:** the same focus-indicator clause holds for the Back_To_Top_Control and the Design_Credit link inside the Copyright_Block, and while the pointer is over either of them the computed `cursor` is `pointer` rather than the `default` the Copyright_Block sets on its static text.

Kept separate from Property 1 because the oracle is geometric and state-machine-like (thickness, extent, retention under a second simultaneous state) rather than colorimetric; the indicator's contrast is Property 1's business. The cursor clause rides here for the same reason — it is a computed-style assertion on a hover state, which is this property's existing shape.

**Validates: Requirements 1.4, 1.5, 1.6, 13.9, 13.17**

### Property 11: Every font file is provably the vendor's, from the vendor

*For all* files in the Webfont_Bundle, a provenance record exists with every required field non-empty — source URL, download date, licence tier, designer, format, `converted` flag and SHA-256 — the source URL's host is on the official-channel allowlist and is not on the aggregator denylist, the `converted` flag is `no`, and the SHA-256 of the shipped file equals the recorded hash of the vendor download; and the `licence_text_file` field resolves per family: for **Body_Font** it names a file that is present under `assets/webfonts/`, and for **Heading_Font** it carries the sentinel denoting "none — accepted", with no `TODO` marker anywhere in the record.

The hash is the only mechanical proof of Req 9 c6, the load-bearing licence condition: the free Telegraf tier grants no converted format, so a re-saved or subsetted file would leave the site with no licensed delivery route at all. A denylist entry for `fontdownloader.net` is explicit, since that host informed the requirements but must never be a download source.

**The per-family split of the licence-text clause is the Change Set 2 change (Req 9 c2, c9, c11), and its direction matters.** The naive fix — "skip the licence-text check for Horizon" — would also pass a record that had quietly *lost* the field, so the oracle asserts the sentinel is **present** rather than that the check is skipped. It additionally fails if the record still contains a `TODO` marker, which is what distinguishes a recorded accepted position from an unresolved action item, and it fails if a `Horizon-LICENSE.txt` appears alongside the sentinel — because Req 9 c11 forbids inventing or paraphrasing a substitute, so a file materialising where the record says none exists is a defect rather than an improvement. The four fields Req 9 c9 makes mandatory for Heading_Font — licence tier, designer, source URL, download date — are covered by the non-empty clause above and are not weakened by the amendment.

**Validates: Requirements 9.1, 9.2, 9.6, 9.8, 9.9, 9.11**

### Property 12: No page contains a commercial-use marker

*For all* nine Content_Pages and all markers in the commercial-use vocabulary — advertisement of paid services, statements of freelance or contract availability, rates or pricing, sponsorship, and affiliate content — the marker does not occur in the page's visible text.

Both licences are conditioned on non-commercial use, and that condition outlives this change. Running the check on every invocation converts a standing obligation into a detectable failure, so a future edit adding "available for freelance work" trips a check instead of quietly voiding both licences.

**Validates: Requirements 9.4**

### Property 13: Blocking the webfonts changes only the family

*For all* (page, viewport, in-scope element) triples, the computed `font-size`, `font-weight`, `line-height`, `letter-spacing`, `color` and `text-transform` observed with the webfont requests blocked are equal to those observed with the fonts loaded, and every element remains visible with non-empty text and a non-zero bounding box.

A differential property: it compares two renders of the same page rather than checking either against a fixed expectation, so it catches a fallback-only regression — such as a fallback stack that resolves to a family whose metrics silently alter computed line-height — that no single-state assertion would find. Containment in the fallback state is Property 5's `webfonts-blocked` arm; this property owns the *equality* half.

**Validates: Requirements 2.15, 6.4, 6.5**

### Property 14: Every card title line is centred in its band

*For all* Card_Heading elements on `index.html`, all viewport widths in {320, 768, 1024, 1440}, and **all rendered lines** of each heading, the distance from the line's leftmost rendered glyph edge to the Card_Header_Band's left content-box edge and the distance from its rightmost rendered glyph edge to the band's right content-box edge differ by at most 1 CSS pixel.

Two oracle details carry the whole property. The per-**line** quantification is the point: a check that measured the heading's own bounding box would pass for a flex-centred `h2` whose internal lines were still left-ragged, which is the exact mistake §5.2 rejects. Lines are obtained from a `Range` over the heading's text content via `getClientRects()`, which returns one rect per rendered line and so covers the forced-break and auto-wrap cases with the same code. And the generator must include the `<br />` case deliberately — "KillerByte / Full-body Spinner Battlebot" is the only card whose heading breaks at every viewport, so a generator that sampled cards uniformly could miss it; it is pinned as a required case alongside the sampled ones.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 15: Every skills pill box fits its label, symmetrically and in ratio

*For all* Skills_Pill elements across the nine Content_Pages, both geometries, and all viewport widths in {320, 768, 1024, 1440}: the label's rendered text box lies wholly inside the pill's padding box with no glyph painted outside the border box; the top and bottom gaps between the label's line boxes and the pill's content-box edges differ by at most 1 CSS pixel, as do the left and right gaps; the declared horizontal padding is between 1.5 and 3.5 times the effective vertical gap; a single-line label's width-to-border-box-width ratio lies in [0.40, 0.88] and its line-box-height-to-border-box-height ratio in [0.40, 0.85]; a multi-line label's summed line-box height is at most 0.90 of the border-box height; the declared `min-height` is at least one line box plus vertical padding plus borders; and no pill overlaps another pill or extends past its card's content box.

Three things make this a property rather than a set of examples. The bounds are **relationships**, so they hold or fail independently of which label happens to be in the pill — which is what lets generated over-long labels exercise the multi-line clause that no current content reaches. The two geometries are a generator dimension rather than two properties, since the oracle is identical and only the declared `font-size` and the effective-vertical-gap definition differ. And the label box must come from a `Range` over the text node, not from the anchor's own rect: the anchor *is* the pill, so measuring it would compare the pill to itself and every ratio would be 1.000 — a checker that reported all-pass here would be measuring nothing.

This is the property that fails on the shipped geometry, in three places at once (§5.4): the homepage width ratio at 0.891–0.893 against the 0.88 ceiling, the homepage vertical symmetry at ≈8.1px against the 1px tolerance, and the wider-context height ratio at 1.000 against the 0.85 ceiling with an undefined padding-to-gap ratio. Its recorded output for the narrowest and widest label of each geometry is what discharges Req 12 c13.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.10, 12.12, 12.13**

### Property 16: The Back to top control works without scripting, from the keyboard, on every page

*For all* nine Content_Pages: the Copyright_Block contains exactly one Back_To_Top_Control and exactly one Design_Credit, as two separate elements with byte-identical inner markup structure and identical text across all nine pages; the control is an `<a>` whose `href` is a same-document fragment resolving to the top of the document, is neither `#` nor a `javascript:` URL, and carries a non-empty accessible name; the Design_Credit names HTML5 UP, links to `https://html5up.net`, and its text contains no reference to fonts or icons; the control is reachable by sequential keyboard navigation with no positive `tabindex` on it or any ancestor; and **with all scripts blocked**, activating the control by pointer and by keyboard each brings the top of the document into the viewport without navigating away from the page.

The no-JavaScript arm is the reason this property exists and is quantified over pages rather than asserted once. Playwright's `context({ javaScriptEnabled: false })` gives the Req 13 c5 condition directly, and aborting `assets/js/*` gives the partial-failure variant — the same request-interception mechanism Properties 5 and 13 already use for fonts. The oracle for "brings the top into the viewport" is `window.scrollY === 0` after activation together with an unchanged `document.URL` pathname, which distinguishes a working fragment jump from a navigation to a different document.

Two clauses are stricter than they look. **Byte-identical inner markup** is what stops the nine pages drifting — three of them write the `#copyright` div on a single source line and one previously wrote `&amp;` where the others wrote `&`, so per-page hand editing has already produced divergence once. And the **two separate elements** clause encodes Req 13 c12: a single anchor doing both jobs would pass a naive "control exists" check and a naive "credit exists" check while making the credit unclickable or the control an external link.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.10, 13.11, 13.12, 13.13, 13.14**

---

## Error Handling

Nothing here executes logic, so "error handling" means **degradation paths**: what a visitor sees when a font, a rule, or a glyph is missing. The governing choice is `font-display: swap` on every face, which sets a 0 ms invisible-text block period and satisfies Req 6 c6 — text is painted in the fallback from first paint and never hidden.

| Failure | Detection | Behaviour | Requirement |
|---|---|---|---|
| Font file 404 / blocked / >3 s | Browser font loading | Fallback stack renders; all sizes, weights, line-heights and colours identical to the webfont case | Req 2 c15; Req 6 c4, c5 |
| Font still downloading | `font-display: swap` | Fallback painted immediately, 0 ms block period | Req 6 c6 |
| Horizon arrives after first paint | Browser swap | Reflow bounded by the widest-first stack (§3.1); must not overflow, truncate, or break the intro `h1` onto two lines ≥768px | Req 6 c8 |
| Telegraf arrives after first paint | Browser swap | Similar proportion to fallbacks; no card-description clipping | Req 6 c9 |
| Whole fallback stack unavailable | — | `sans-serif` generic renders at declared sizes/weights | Req 6 c11 |
| Glyph absent from Horizon (e.g. U+00ED) | Glyph audit, Check G | Browser substitutes **per character** from the next stack family; the string is not re-rendered wholesale | Req 3 c16; Req 4 c14 |
| No true italic in Telegraf | Download inspection | Synthesized oblique **within** the Telegraf family; no family substitution. Requires that `font-synthesis: none` is never applied to `em`/`i` | Req 4 c11 |
| No bold face in Telegraf | Download inspection | **Did not occur** — Branch A selected at intake, `PPTelegraf-Ultrabold.otf` at weight 800 ships, so §3.4's Branch B alternative emphasis is not implemented and no synthesized bold arises. This is also the face Requirement 11 reuses (§5.3) | Req 4 c4 |
| Font Awesome `@import` displaced | Icon rendering | Must not happen: `@font-face` is inserted *after* line 1, since a rule before an `@import` invalidates it | Req 7 c6 |
| **Scripting disabled, or `jquery.scrolly.min.js` 404s, or any page script throws** | Property 16's script-blocked arm | Back_To_Top_Control still works: the `href="#top"` fragment jump is browser behaviour, not scripted. No `class="scrolly"`, no click handler, no `javascript:` URL | Req 13 c5, c6 |
| **Visitor prefers reduced motion** | `prefers-reduced-motion: reduce` | `scroll-behavior` reverts from `smooth` to `auto`, giving an instant jump. Requirement 13 c2 asks only that the top be brought into view, so the reduced-motion path is fully conforming rather than degraded | Req 13 c2 |
| **`scroll-behavior: smooth` interferes with the template's scroll plugins** | Check F console/animation run | Drop the `scroll-behavior` block; the instant jump still satisfies Req 13 c2, c3, c5. The `scrolly` anchors call `preventDefault()`, so no native scroll competes with jQuery's animation in the first place | Req 13 c2; Req 8 c6 |
| **A Bold_Chrome_Text label will not fit its box at 800** | Property 5 containment arm; Property 15 ratios | Enlarge the element or its padding (§5.4). Never reduce `font-size` below the Req 5 c3 floor, never revert to weight 400, never apply `text-overflow` truncation | Req 11 c12; Req 12 c11 |

Two failures are silent and therefore the dangerous ones. A **missing glyph** looks like a slightly-off letter, not an error, so it is caught by the up-front glyph audit rather than by inspection. An **over-narrow `unicode-range`** diverts characters to the fallback with no console warning; §3.2 pins the range against measured page content for exactly this reason. Neither may surface an error message, empty run, or placeholder glyph to the visitor (Req 6 c10).

---

## Requirement Conflicts Requiring a Decision

Measurement surfaced six places where criteria cannot all hold as literally written. **All six are settled and none is open.** C2, C3 and C4 were accessibility outcomes that needed an explicit ruling; the site owner gave one for Change Set 1:

> **Owner decision (Change Set 1): email link only — keep the change strictly scoped as Requirement 1 c10/c11 state.**

C2 and C4 are therefore marked **RESOLVED by owner decision** below, and C1, C5 and C6 **adopt** the defaults the design named.

**One entry has since been re-decided.** In Change Set 2 the owner reversed the ruling for **C3** only, because the Copyright_Block now hosts an interactive control:

> **Owner decision (Change Set 2): the copyright bar must be legible. Requirement 1 c11 is amended to exempt the Copyright_Block — and nothing else.**

So C3 below is marked **RESOLVED BY FIXING IT** rather than "leave unchanged", while C2's identical-looking shortfall stays accepted. The distinguishing fact is interactivity, not the size of the contrast gap, and the two entries record that explicitly so the pairing does not read as inconsistent. Implementation follows every entry in this section as written.

**C1 — "Palette change" vs. "email link only". ADOPTED.** Req 8 c7 describes the change as a palette value, but `#717981` is `alt.fg`/`alt.fg-bold`, used **15×** in the compiled CSS. Editing it would recolour the footer `h3`, social icons, table `th` and pagination links — violating Req 1 c10 and c11. *Adopted: add `alt.fg-link` (§4.2) and apply it through the targeted selector of §3.6. Every existing palette value is preserved, and the change reaches only the email link.* This is the same scoping rule the owner decision restates, so C1 and the C2/C3 rulings are one coherent position rather than three independent ones.

**C2 — Footer `h3` labels fail heading contrast. RESOLVED: leave unchanged. Unaffected by Change Set 2.** `#footer h3` is `#717981` = **4.05:1** measured. Req 3 c14 requires ≥4.5:1 for Heading_Text, but Req 1 c11 requires this label's colour to stay identical. Both cannot hold, and **Req 1 c11 wins by explicit owner decision**: the colour is left exactly as it is. The 4.05:1 measurement is *reported, not fixed* — it is an accepted, recorded shortfall, and Correctness Property 1 carries it as an accepted exception rather than a failure; after Change Set 2 it is the **only** member of that set. `#3a4148` (9.49:1) remains the ready remedy, reusing the token whose value §5.1 has just updated, should the owner revisit this later; adopting it would be a new decision, not a follow-up to this one. Req 14 c8 explicitly restates the pin, so the C3 reversal does not reach here.

**C3 — `#copyright` fails chrome contrast. RE-DECIDED in Change Set 2 — RESOLVED BY FIXING IT.** `rgba(255,255,255,0.25)` on `#1e252d` composites to `#565c62` = **2.27:1** measured (the ratio comes from the *unrounded* alpha composite; rounding the composite to `#565c62` before computing gives 2.29:1, which is not the measured value). Req 5 c6 requires ≥4.5:1 for Chrome_Text; Req 1 c11 originally required the colour unchanged, and Req 1 c11 won by owner decision — so this entry previously read *RESOLVED: leave unchanged*, with the shortfall carried as an accepted exception in Correctness Property 1.

**The owner has reversed that ruling for this element.** The Copyright_Block now hosts an interactive control (the Back_To_Top_Control, §5.5) rather than static text only, so legibility is no longer a matter of taste about a decorative line. Requirement 14 records the reversal and Req 1 c11 is amended to exempt the Copyright_Block. The fix is the remedy this entry always named — raise the alpha — now with a corrected ratio: **alpha 0.65, composited `#b0b3b6`, measured 7.33:1** (§5.6).

**Two corrections travel with the reversal.** First, this entry previously paired "alpha ~0.65" with "≈4.6:1". **That pairing was wrong**: alpha 0.65 measures **7.33:1**, and ≈4.9:1 falls near alpha **0.50**. The alpha was right and the ratio was wrong; both are now measured and recorded in §5.6. Second, the `#copyright` entry is **removed** from Correctness Property 1's accepted-exceptions set (Req 14 c7), because that set pins each member to a measured value and fails when the measurement drifts in either direction — so a fixed element must leave the list rather than sit in it with a stale number.

**The reversal is scoped to this element only.** C2 above is untouched: the footer `h3` shortfall at 4.05:1 remains an accepted exception, it remains the *sole* member of Property 1's exception set, and Req 14 c8 restates the Req 1 c11 pin for the footer `h3` and the social icon links. Reversing C3 is therefore not a precedent for reversing C2 — the distinguishing fact is interactivity, which the footer `h3` does not have.

**C4 — Hover accent fails body contrast. RESOLVED: keep the mandated accent.** Req 1 c4 mandates `#18bfef` on hover, which is **1.98:1** on `#f5f5f5`. The email link is Body_Text, so Req 4 c7 wants ≥4.5:1. **Resolved in favour of the explicit c4 mandate**, consistent with the default the design had already stated: the state is transient and pointer-driven, and the underline holds **9.49:1** throughout hover after §5.1 (7.38:1 as Change Set 1 shipped it), so the link never depends on text colour alone to be perceivable. The darker footer-scoped alternatives (`#0e7f9e`, 4.24:1; `#0b6a84`, ≥4.5:1) are recorded as *not* taken — Req 1 c4 is honoured as written. Because this state is a mandated value rather than an unmet threshold, Property 1 scopes the hover accent out of the ≥4.5:1 Body_Text clause; it is not an entry in the accepted-exceptions list.

**C5 — Cross-page `h2` identity vs. deliberate per-context sizes. ADOPTED.** Req 8 c1 requires an identical computed `h2` size on all nine pages, but three sizes coexist by design: base `1.75rem`, card `h2` `1.1rem` (index), post `h2` `1.5rem` (project pages). Also `cad.html` has **no** `h1` and **no** `h2` at all, so a literal all-pages comparison is undefined there. *Adopted: read Req 8 c1 per **role** — base heading, card heading, post heading — requiring identity within a role across every page where the role appears. Correctness Property 3 encodes this reading, and implementation follows it.* The alternative, collapsing all `h2`s to one size, would destroy the card design.

**C6 — Two elements are unclassified. ADOPTED.** `#nav .links a` (0.8rem, `family-heading`) meets the glossary's general Chrome_Text description but is not in its enumeration; `#header .logo` (2.25rem, `family-heading`) is neither Heading_Text, Body_Text, nor Chrome_Text. *Adopted: route `#nav .links a` to `_font(family)` with the other small chrome (consistent with Req 5's rationale — Horizon's apertures close up at 0.8rem), and keep `#header .logo` on `_font(family-heading)` as a display element.* Recorded here because neither classification follows from the requirements as written, but the routing above is what implementation does.

---

## Risks

**R1 — Horizon's extra width breaks existing layouts.** *(highest risk)* Every heading gets 60–100% wider at the same point size. Concretely: the intro `h1` (mitigated by §3.3 derivation), card `h2` in a fixed-aspect card, project-page `h1` up to 38 characters, `#nav` links in a flex row, and the 20-character skills pill. Mitigation: derive sizes from real metrics rather than assuming (§3.3); move all small chrome off Horizon entirely (§3.5); make pills elastic (§3.5); verify at four viewports in both font states (Property 5).

**R2 — "Hallgrímskirkja" cannot fit on one line at 320px at any usable size.** Measured: 15 unbreakable characters need 585px at 3.25rem/0.90em against 266.7px available. **It already overflows today** at 357.5px in Source Sans Pro — a pre-existing defect. No font-size reduction fixes this; even 1.5rem overflows. Mitigation: `overflow-wrap: break-word` on `h1`–`h6` (plus `hyphens: auto` where supported), which is *required* for Req 3 c11, not merely advisable. Applied to headings generally, not to the intro `h1` name.

**R3 — Uncompressed body font on first paint. LARGELY CLOSED.** A 200 KB unconverted OTF, likely served as `identity`, would have been a real first-paint cost. Mitigations were `font-display: swap` (never blocks text), the ≤400 KB per-file bound, minimum face count, and §4.5 measurement to replace assumption with fact. The shipped reality is far better than feared: the two Telegraf faces total **86 KB** and the whole bundle is **101 KB**, 17% of the 600 KB budget. Change Set 2 adds nothing to it (§5.3), so the residual risk is only the post-deploy `Content-Encoding` measurement of Check H.

**R4 — SASS/CSS divergence.** Two artifacts, no compiler, and the CSS is what ships. A correct SASS edit with a forgotten CSS mirror is invisible until a visitor notices. Mitigation: the Compiled Stylesheet Sync Procedure and Correctness Property 2, which turns divergence into a check failure.

**R5 — Licence drift.** Both grants depend on the site staying non-commercial (Req 9 c4) — a standing obligation that outlives this change. Mitigation: Property 12 scans for commercial markers on every run, so a future edit adding rates or freelance availability trips a check rather than passing silently.

**R6 — Font acquisition blocks implementation. CLOSED by Change Set 1.** Both faces needed manual download from official channels (Req 9 c1); neither could be automated, and aggregator mirrors are forbidden. Every §3.3 number stayed an *estimate* until the files existed. Check G was the gate; it passed, and the shipped bundle is 103,324 bytes across three files. Change Set 2 adds no file, so this risk does not recur.

**R7 — Ultrabold widens every interactive label, and the pills are the tight case.** *(highest remaining risk)* Change Set 2's Req 11 raises three element groups from weight 400 to 800, and the shipped binaries measure the labels **3.6%–8.5% wider** at an unchanged font size (§5.3). Nav and buttons have structural slack — a flex row with grow/shrink, and `inline-block` boxes that size to their label — but the 0.55rem homepage pills do not, and measurement shows the widest label already breaching Req 12 c5's 0.88 width ratio at 0.891–0.893. Mitigation: the two changes ship and are verified **together**, since landing Req 11 without Req 12 ships a measured failure; the geometry is derived from real font metrics rather than guessed (§5.4); Property 15 turns every ratio bound into a check at four viewports; and Req 11 c12 fixes the remedy in advance as *enlarge the box*, never shrink the type, revert the weight, or truncate. Residual exposure: the two thinnest predicted margins are the wider-context height ratio (0.436) and its narrowest width ratio (0.424), both against a 0.40 floor, for which §5.4 records a computed fallback geometry.

**R8 — The template attribution is a standing licence condition, not a one-off edit.** Change Set 2 reworded the HTML5 UP credit and, in doing so, invited the question of removing it. The recorded answer is no (§5.5): CC BY 3.0 attaches attribution to adaptations, HTML5 UP sells attribution-free usage separately through Pixelarity, and the repository is still substantially template-derived — 24 SASS files carry the Massively header, six template JS files ship, and template structures appear on all nine pages. The risk is that a future edit removes the credit on the intuition that the site "looks nothing like Massively", which is not the test the licence applies. Mitigation: Property 16 asserts the Design_Credit's presence, wording and link target on **all nine pages**, so its removal fails a check rather than passing quietly — the same shape of guard that Property 12 provides for the fonts' non-commercial condition. The one supported route to removing it is a Pixelarity licence, recorded in §5.5 as a purchase decision outside this spec.

---

## Compiled Stylesheet Sync Procedure

Requirement 7 c5 requires this documented in `README.md`; it is reproduced here as the design's interface between the two artifacts. Every typography change follows it in order:

1. **Edit the SASS source** — `_vars.scss` first (the `$font` map and the additive palette key), then the rule-level files (`base/_typography.scss`, `layout/_footer.scss`, `layout/_main.scss`, `layout/_intro.scss`, `layout/_navPanel.scss`, `components/_button.scss`, `_form.scss`, `_pagination.scss`, `_table.scss`).
2. **Resolve each map reference by hand.** `_font(family)` → the full comma-separated stack, with family names quoted exactly as the compiler would emit them (`"PP Telegraf", "Helvetica Neue", "Segoe UI", Roboto, sans-serif`).
3. **Apply the same change to `assets/css/main.css`** at every location. Map-driven values appear many times — `family-heading` resolves at **11** sites in the compiled CSS today — so change *all* occurrences, not the first.
4. **Remove the Google Fonts `@import` (line 2)** and insert the `@font-face` blocks directly after the Font Awesome `@import` on line 1 — never before it (Req 7 c6).
5. **Verify parity** by running the Testing Strategy checks. Property 2 is the authority: for every selector governing Heading_Text, Body_Text or Chrome_Text, the value resolved from SASS must equal the value declared in the CSS, with zero differing declarations.
6. **Confirm zero occurrences** of `Merriweather` and `Source Sans Pro` in both artifacts (Req 7 c9).

Note for step 3: the compiled CSS already contains duplicate declarations for the same property in one rule — `#footer` carries `color: #717981` followed by `color: #909498`, an artifact of the `color(alt)` mixin — so a parity checker must apply last-declaration-wins rather than reading the first match.

`README.md` additionally gains: the Credits entries required by Req 9 c3 (Horizon → Alberto Fontense, PP Telegraf → Pangram Pangram Foundry, each with its licence tier). Branch A was selected at intake, so the Req 4 c4 missing-bold limitation note is **not** required.

**Change Set 2 adds a step 7, because it is the first change set to touch HTML.** Steps 1–6 above cover the stylesheet pair; Change Set 2's §5.5 replaces markup inside `div#copyright` on all nine pages:

7. **Apply the Copyright_Block markup to all nine pages**, then verify the inner `<ul>…</ul>` is **byte-identical** across them. Three pages (`killerbyte.html`, `launchtoy.html`, `vexlego.html`) write the div on a single source line and six write it multi-line, so the surrounding whitespace legitimately differs while the inner markup must not. The new wording contains no ampersand, which retires the pre-existing `&` / `&amp;` divergence in `vexlego.html` — do not reintroduce an entity. Property 16 is the authority for this step.

Two further notes for Change Set 2. The §5.1 colour change is **one literal in `_vars.scss` and three resolved mirrors** in `main.css`; step 6's zero-occurrence confirmation extends to `#4a5158`, which Req 1 c13 requires to appear nowhere in either artifact as a link or underline colour — including in comments that document a value the source no longer sets. And the §5.4 pill geometry must be **measured in a browser before it is mirrored**, not after: the values in §5.4 are derived from font metrics and declared CSS, and Req 12 c13 is discharged only by the rendered numbers.


---

## Testing Strategy

### The starting position

There is no test suite, no `package.json`, and no build tooling. Tooling must therefore be *introduced*, and the deployment topology constrains where it can live: `static.yml` uploads `path: '.'`, so **anything added to the repository is published**. `.kiro/` is already being published today.

### Tooling and its placement

| Concern | Choice | Rationale |
|---|---|---|
| Location | `tools/typography-check/` | Self-contained; one directory to prune. Repository root stays as clean as it is today. |
| Runtime | Node 22 (present in the environment) | Already available; needed anyway for the browser driver. |
| Dependency manifest | `tools/typography-check/package.json` | Keeps `node_modules` and dev dependencies out of the repository root, so the site remains a plain static tree with no root-level manifest. |
| PBT library | **fast-check** | The established JS property-based testing library. Not hand-rolled (per the workflow's explicit instruction); supplies shrinking, which matters — a failure that shrinks to "`h2` on `cad.html` at 320px" is actionable, "some element somewhere overflows" is not. |
| Test runner | `node --test` | Built in; no extra dependency. |
| Browser | **Playwright**, headless, `--no-sandbox` | Properties 3, 5, 10 and 13 need *computed* styles and real bounding boxes, which no static parser can produce. The `playwright` Power is available in this environment. |
| Font introspection | `fontTools` (Python, already present) | Reads `OS/2.usWeightClass` and `cmap` for Properties 7 and 9. |

**Keeping tooling out of the deployed site.** `static.yml` gains one prune step before the upload — this is the minimal change that stops verification tooling (and the already-leaking `.kiro/` directory) from being published:

```yaml
      - name: Checkout
        uses: actions/checkout@v4
      - name: Prune non-site files
        run: rm -rf tools .kiro
      - name: Setup Pages
        uses: actions/configure-pages@v5
```

This runs against the ephemeral CI checkout, never the repository. Pruning `.kiro` is a small, in-scope correctness improvement: spec documents are not part of the site, and Property 12 (commercial-use markers) should not have to reason about text in spec files that visitors can currently reach.

### Property test configuration

Every property from the Correctness Properties section is implemented as **exactly one** property-based test, running a **minimum of 100 iterations**, tagged with a comment referencing its design property:

```js
// Feature: portfolio-typography-refresh, Property 5: Nothing overflows, in either font state
fc.assert(
  fc.property(
    fc.constantFrom(...NINE_PAGES),
    fc.constantFrom(320, 768, 1024, 1440),
    fc.constantFrom('loaded', 'blocked'),
    async (page, viewport, fontState) => { /* … */ }
  ),
  { numRuns: 100 }
);
```

Two notes on generators. Where a property's natural domain is smaller than 100 tuples (Property 9 ranges over 2–3 font files), the generator is widened with the dimensions that *do* vary — mutated declarations, permuted stacks — so the 100 iterations test the checker's discrimination rather than re-running one identical case. Where the domain is very large (Property 5 spans 9 × 4 × 2 × ~40), 100 runs sample it and fast-check's shrinking localises any failure. Property 5 caches one browser context per (page, viewport, font-state) triple, since a naive implementation would launch 100 browsers.

Webfont blocking for Properties 5 and 13 uses Playwright request interception, aborting `assets/webfonts/{Horizon,Telegraf}*`, which reproduces the Req 6 c4 failure mode without touching the CSS.

### Checks, in dependency order

| Check | What | Type | Gate |
|---|---|---|---|
| **A** | Files present at expected paths | Smoke | pre-push |
| **B** | Static properties: 2, 6, 8, 9, 11, 12, **16** (markup clauses) | Property (fast-check) | pre-push |
| **C** | Font-binary properties: 7, 9 (weights), **and the §5.3 advance-width table** | Property (fontTools + fast-check) | pre-push |
| **D** | Rendered properties: 1, 3, 4, 5, 10, 13, **14, 15** | Property (Playwright + fast-check) | pre-push |
| **E** | Font Awesome icons render; no missing-glyph substitution | Integration, 1 run | pre-push |
| **F** | Water canvas animates; card interactions respond; no console errors; **`scroll-behavior` does not disturb the `scrolly` / `scrollex` anchors** | Integration, 1 run | pre-push |
| **G** | **Font intake gate** — see below | Manual + smoke | **before any CSS work** (passed in Change Set 1) |
| **H** | Same-origin 200s; `Content-Encoding`; transfer bytes | Integration, 1 run | **post-deploy** |
| **I** | **Back_To_Top_Control with scripting disabled** — Property 16's no-JS arm | Property (Playwright, `javaScriptEnabled: false`) | pre-push |

**Change Set 2 adds one check and extends three.** Check I is separated from D because it needs a *differently configured browser context* rather than a different generator — scripting off for the whole context, which cannot be mixed into a run that also exercises the card-interaction paths. Check C gains the `fontTools` advance-width comparison that discharges Req 11 c16, which is deterministic and needs no browser. Check D gains the two geometric properties, and its Playwright helper needs one addition that is easy to get wrong: label boxes must be read from a `Range` over the text node via `getClientRects()`, not from the element rect, or Properties 14 and 15 measure the container against itself and report a vacuous pass.

**Check G is a prerequisite, not a test.** Neither font can be fetched by automation — both require a manual download from the designer's own channel (Req 9 c1 forbids aggregator mirrors), so implementation cannot start until it passes. It establishes four facts that the rest of the work depends on:

1. **Horizon's weight** — `OS/2.usWeightClass` → fixes `weight-heading` and the `@font-face` `font-weight` (Req 3 c4).
2. **Which Telegraf styles the download contains** — resolves the open Assumption 6 and selects **Branch A or Branch B** (§3.4), including whether a true italic exists (Req 4 c11).
3. **Horizon's advance widths** — feeds the `h1` derivation in §3.3, converting its estimates into measured values.
4. **Glyph coverage for U+00ED, U+00D7, U+00B7** — Property 7's precondition; U+00ED appears in heading text, so a gap here changes the design rather than merely failing a test.

**Check H is post-deploy by necessity.** Req 2 c10, c17 and c18 are assertions about the deployed GitHub Pages origin — its compression behaviour and same-origin serving. These test *GitHub's* infrastructure, not this repository, and 100 requests would reveal nothing that 1 does; they are integration checks. The procedure is in §4.5, and its results are recorded in the provenance table.

### Unit and integration tests (the non-property half)

Deliberately few, because the properties carry the general cases. Reserved for single literal assertions where universal quantification would add nothing: the `$font` map heads (`Horizon`, `PP Telegraf`); `family-fixed` unchanged; `p { text-align: justify }` retained; the literal **`#3a4148`** as the `alt.fg-link` value; the intro `h1` declared value ≤ 4rem; exactly one Horizon face shipped, at the `weight-heading` value (Req 2 c4); `font-display: swap` present; fallback stacks having ≥2 named families each, checked against a curated platform-availability table (whether a family ships on Windows/macOS/iOS/Android is external knowledge, not a computable property — and "widest first" is a design judgement recorded in §3.1, since metrics for uninstalled fonts cannot be measured); README sections required by Req 7 c5 and Req 9 c3. Branch A was selected, so the Req 4 c4 note is not asserted.

Change Set 2 adds four literal assertions in the same spirit: the Card_Header_Band declares `text-align: center` while `_main.scss:179` and `:444` still declare `left`; both `_nav.scss:34` and `_button.scss:26` declare `_font(weight-bold)`; the `#copyright` rule declares `transparentize(_palette(invert, fg), 0.35)` and resolves to `rgba(255, 255, 255, 0.65)`; and the `Horizon.woff2` provenance record carries the "none — accepted" sentinel with **no** `TODO` marker anywhere in `FONT-PROVENANCE.md`. Each is a single fixed fact about a single line, which is precisely where a property would add cost without adding coverage.

### Where PBT is deliberately not used

- **GitHub Pages behaviour** (Req 2 c10, c17, c18) — external service; behaviour does not vary with input; each check costs a network round trip. Integration, 1 run.
- **Font Awesome icon rendering** (Req 7 c6) — third-party font behaviour, already tested by its authors. Integration, 1–2 examples. The one genuinely fragile part, that `@font-face` must not precede the `@import`, is a static assertion in Check B.
- **Water canvas and card interactions** (Req 8 c6) — unrelated to typography; a regression guard, not a property. Integration, 1 run.
- **Documentation obligations** (Req 7 c5, Req 9 c3, c5) — presence is checkable, adequacy is not. Smoke plus human review.
- **Future-conditional obligations** (Req 9 c5, c7) — antecedents are false today. Recorded as standing conditions; Property 11's `converted` flag makes c7 detectable if the delivery path ever changes.

### Pre-push verification gate

There is no staging environment: a push to `main` deploys straight to production. "Verify before it goes live" therefore has to mean *verify before push*.

```bash
cd tools/typography-check && npm ci && npm test    # Checks A–F
```

The full sequence:

1. **Check G** passes — fonts in hand, weights and styles known, branch selected.
2. SASS edited, then mirrored into `assets/css/main.css` by the procedure in the Compiled Stylesheet Sync Procedure section.
3. **Checks A–F** pass locally against the working tree via `file://`, or a local static server.
4. Visual review of `index.html` and one project page at 320 and 1440, in both font states — the properties bound overflow and containment, but not whether the result looks right. **For Change Set 2 this step also carries Req 11 c7**, the only criterion in the amendment that no property covers: at 0.55rem and weight 800, no two adjacent glyph outlines may overlap or touch and every enclosed counter must stay open. That is a rendering judgement, not a bounding-box computation, so it is reviewed at all four viewports rather than asserted.
5. Push to `main`; the workflow deploys.
6. **Check H** against the live origin; record `Content-Encoding` and transfer bytes in the provenance record.

**Rollback.** The change is confined to text artifacts plus added font binaries, so `git revert` of the single commit restores the previous typography completely and the next push redeploys it — no state, no migration, nothing to unwind. This argues for landing the work as **one revertible commit** rather than a series. If a defect is found after deploy, revert first and diagnose locally, rather than fixing forward against production.

### Expected first-run failures, and what a red check actually means

Change Set 1's expected first-run failure is **closed**: Property 5 previously failed until `overflow-wrap: break-word` was added to the headings (finding F6) and the skills pill became vertically elastic (§3.5). Both are fixed on `main`.

**Change Set 2 has one expected first-run failure, and it is Property 15.** The shipped pill geometry breaches three of Requirement 12's bounds before any edit is made (§5.4): the homepage width ratio at 0.891–0.893 against the 0.88 ceiling, the homepage vertical symmetry at ≈8.1px against the 1px tolerance, and the wider-context height ratio at 1.000 against the 0.85 ceiling with a padding-to-gap ratio that is undefined because the gap is zero. Those failures are the *evidence* for §5.4, so seeing them confirms the checker discriminates. A Property 15 that passed on the unmodified tree would mean the label box was being read from the element rect rather than from a text-node `Range` — that should be treated as a broken check, not as good news.

**Property 4 is expected to pass only once both halves of Requirement 11 land.** Its weight clause is a partition, so an incomplete edit fails asymmetrically and diagnostically: bolding `_button.scss` but not `_nav.scss` fails the 800 clause on the nav links, while bolding anything outside Bold_Chrome_Text fails the 400 clause on that element. Either way the shrink output names the element.

By contrast, Property 1 is **expected to pass**. The footer `h3` (4.05:1) and `#copyright` (2.27:1, measured from the unrounded alpha composite) shortfalls are now settled by owner decision — leave both unchanged — so they are carried in that property's accepted-exceptions set and surface in the run output as *known-and-accepted*, with their conflict IDs, rather than as failures. A red Property 1 therefore means one of three real things: a new contrast regression somewhere outside the set, or one of the two accepted ratios having drifted from its recorded value, or an entry having been added to the set without an owner decision. None of those is a first-run expectation.
