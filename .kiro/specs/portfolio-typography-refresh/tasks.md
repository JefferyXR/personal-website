# Implementation Plan: portfolio-typography-refresh

## Overview

This plan now covers two change sets.

**Change Set 1 is implemented and merged to `main`** (commit `d49d8c5`, PR #1). Tasks 1–15 are its shipped history and are retained, marked complete, rather than deleted — the reasoning recorded in them (the intake gate, the branch selection, the `@font-face` insertion point, the seven Chrome_Text sites) is what Change Set 2 builds on.

**Change Set 2 is tasks 16–25.** Seven follow-up changes against the merged code, all declaration-level or markup-level: the email link goes darker, card titles centre, nav / buttons / pills go Ultrabold, the pill boxes are retuned to fit the heavier labels, the footer "Fonts & icons" line becomes a Back to top control with a reworded HTML5 UP design credit, the copyright bar becomes legible, and the Horizon licence-text `TODO` becomes a recorded accepted position. Values, selectors and rationale are fixed in design §5.1–§5.7; tasks reference them and do not re-derive them.

Three things shape the ordering of tasks 1–15:

1. **Font acquisition is a manual prerequisite.** Neither face can be fetched programmatically (Req 9 c1 forbids the aggregator mirror). Until the files are in hand, Horizon's `OS/2.usWeightClass`, Horizon's advance widths, and whether the free Telegraf tier ships a bold face are all **unknown**. Task 1 is a manual owner action and Task 2 is the Check G intake gate that resolves those three unknowns. **No CSS is written before Task 2 completes.** The design's `3.5rem` / `2.75rem` / `2.5rem` intro and project `h1` values are *estimates* to be confirmed in 2.2, not values to copy.
2. **There is no SASS compiler.** `assets/sass/**` and `assets/css/main.css` are both shipped artifacts. Every task below that edits SASS mirrors the same resolved values into `main.css` in the *same* task, per the design's Compiled Stylesheet Sync Procedure. No task leaves the two artifacts divergent.
3. **`.github/workflows/static.yml` deploys the whole repo to production on every push to `main`, with no staging environment, and `main` is the current branch.** All work goes on a feature branch reviewed by PR. Task 14 is the pre-push verification gate.

Values, selectors, `@font-face` blocks, the `$font` map target state, the seven Chrome_Text sites, the provenance schema, and the 13 correctness properties are all fixed in `design.md`. Tasks reference them; they do not re-derive them.

Four things shape the ordering of tasks 16–25, and they are different from what shaped Change Set 1:

1. **There is no acquisition gate and no unknown.** `PPTelegraf-Ultrabold.otf` (44,664 bytes, `usWeightClass` 800) already ships and is already declared at `font-weight: 800`, so Requirement 11 adds **no font file and changes no `@font-face` rule** (Req 11 c4, design §5.3). Risk R6 does not recur. Sequencing is therefore driven by **file conflict and dependency**, not by a blocking manual step.
2. **Requirements 11 and 12 are one change.** Ultrabold widens every interactive label by 3.6%–8.5% (design §5.3), which puts the shipped homepage pill at a 0.891–0.893 width ratio against the 0.88 ceiling. Landing task 19 without task 20 ships a measured Req 12 c5 failure, so they belong in the same commit and the same verification run (risk R7).
3. **The pill values must be measured in a browser before they are mirrored.** Design §5.4 labels its numbers *derived, not yet browser-measured*. Task 20.1 runs the Layer 2 measurement first; task 20.2 applies and re-measures, and adjusts per Req 12 c11 if any bound is missed. This is why the harness work (task 16) comes before any CSS edit.
4. **Change Set 2 is the first change set to touch HTML.** All nine pages change inside `div#copyright`, which is why the design added **step 7** to the Compiled Stylesheet Sync Procedure. Task 25 is the pre-push gate for it.

The SASS-plus-compiled-CSS pairing rule from Change Set 1 is unchanged and applies to every task below: **every SASS edit is mirrored by hand into `assets/css/main.css` in the same task.** No task leaves the two artifacts divergent.

## Tasks

**Change Set 1 — shipped and merged to `main` (tasks 1–15). Retained as history; do not re-run.**

- [x] 1. Acquire fonts and record provenance
  - [x] 1.1 **[MANUAL — OWNER ACTION, BLOCKS ALL OTHER FONT AND CSS WORK]** Download both faces from official channels and store them with their licence texts
    - Horizon (Alberto Fontense), free personal-use tier: download from the designer's own channel — VP Creative Shop or Creative Market (`https://edocs.creativemarket.com/fontense/2189003-Horizon-Wide-Sans-Serif`). Take the **WOFF2** face. Exactly one solid face; do not take Outline / Outline Two / Lines / Lines Two (decorative styles, not weights).
    - Telegraf (Pangram Pangram Foundry), free personal-use tier: download from `https://pangrampangram.com/products/telegraf/`. Take the **OTF or TTF exactly as supplied** — do not convert, subset, rename internal font data, or re-save. The free tier grants no WOFF/WOFF2, so a converted file would leave the site with no licensed delivery route (Req 9 c6 is load-bearing for the Req 2 c3 delivery path).
    - **`fontdownloader.net` and any other aggregator or mirror is forbidden as a download source** (Req 9 c1), even though it informed the requirements.
    - Place the font files under `assets/webfonts/` alongside the existing Font Awesome files. Do not touch, rename, or re-save any `fa-*` file (Req 7 c7).
    - Store the supplied licence text as `assets/webfonts/Horizon-LICENSE.txt` and `assets/webfonts/Telegraf-LICENSE.txt` (Req 9 c2).
    - _Requirements: 2.1, 9.1, 9.2, 9.6_

  - [x] 1.2 Create `assets/webfonts/FONT-PROVENANCE.md` with one record per font file
    - Use the field schema in design §4.4 verbatim: `file`, `family`, `designer`, `source_url`, `download_date`, `licence_tier`, `licence_text_file`, `format`, `converted`, `sha256`, `stored_bytes`, `content_encoding`, `transfer_bytes`.
    - Compute `sha256` and `stored_bytes` for each shipped file now. Set `converted: no`. Leave `content_encoding` and `transfer_bytes` as `TBD — Check H` (filled in task 15.1).
    - Add a short note that this file must be updated whenever a font file is added or replaced (Req 9 c8).
    - _Requirements: 9.2, 9.8_

- [x] 2. Check G — font intake gate (resolves the three unknowns)
  - [x] 2.1 Read Horizon's weight and Telegraf's shipped styles; select Branch A or Branch B
    - Run the `fontTools` snippet in design §3.1 against the Horizon file to read `OS/2.usWeightClass` and the subfamily name. This value becomes `$HORIZON_WEIGHT` and is written **identically** into `weight-heading` and the `@font-face` `font-weight` so no synthesized bold is ever possible (Req 3 c4). Expected `400`, but use what is reported.
    - Enumerate every Telegraf face in the download with its `usWeightClass` and whether a **true italic** exists (Req 4 c11).
    - **Select the branch and record the decision:** Branch A if a bold face ships (`weight: 400`, `weight-bold: 700`, both files ship); Branch B if not (`weight-bold` == `weight` == 400, one file ships, alternative emphasis per design §3.4, README note required). This resolves open Assumption 6.
    - Append an "Intake findings" section to `assets/webfonts/FONT-PROVENANCE.md` recording `$HORIZON_WEIGHT`, the Telegraf face inventory, italic availability, and the selected branch.
    - _Requirements: 2.4, 2.5, 2.16, 3.4, 4.3, 4.4, 4.11_

  - [x] 2.2 Measure Horizon's advance widths and derive the intro and project `h1` sizes
    - Run the per-string measurement script in design §3.3 for `JEFFERY ROSS`, `JEFFERY`, and `HALLGRÍMSKIRKJA`.
    - Apply the design's formula with the chosen letter-spacing: `max_rem = AVAIL / ((width_em + LS × len) × root_px)`, using the measured geometry table (266.7px at 320px/13.33px root, 650.7px at 768px/14.67px root, 906.7px at 1024px, 1312.0px at 1440px). **768px is the binding constraint.** Take the minimum across 768/1024/1440, cap at 4rem, round *down* to the nearest 0.25rem.
    - Record the three derived values (intro `h1` default, intro `h1` `<=small`, project-page `h1`) in the Intake findings section. The design's 3.5rem / 2.75rem / 2.5rem are estimates — replace them with measured values if they differ.
    - If the derived cap falls below ~2.5rem, follow the design §3.3 escalation order (−0.02em letter-spacing, then `<=medium` intro padding 4rem→2rem with owner sign-off, then escalate the Req 3 c6 vs c12 conflict). Do **not** mid-word-break the intro name.
    - _Requirements: 3.6, 3.12, 3.13_

  - [x] 2.3 Audit glyph coverage for the three non-ASCII codepoints used on the site
    - Confirm U+00ED (í), U+00D7 (×), U+00B7 (·) are present in the `cmap` of both faces. U+00ED appears in **heading** text ("Hallgrímskirkja" on `church.html` and `index.html`), so Horizon itself must carry it — a gap here changes the design rather than merely failing a test.
    - Confirm the declared `unicode-range` (`U+0000-00FF, U+0100-017F, U+2000-206F, U+2212`) sits inside each face's real coverage (Req 3 c15).
    - Record results in the Intake findings section.
    - _Requirements: 2.9, 3.15, 3.16, 4.14_

- [x] 3. Set up verification tooling and keep it out of the deployed site
  - [x] 3.1 Create `tools/typography-check/` with its own manifest and harness
    - `tools/typography-check/package.json` declaring `fast-check` and `playwright` as dev dependencies, and a `test` script running `node --test`. The manifest lives here, not at the repository root, so the site stays a plain static tree.
    - Shared fixtures module exporting the nine Content_Page paths, the four viewport widths (320, 768, 1024, 1440), the in-scope element role selectors (Heading_Text, Body_Text, Chrome_Text per the glossary, with `#nav .links a` routed to Chrome_Text and `#header .logo` excluded per conflict C6), a WCAG 2.1 relative-luminance contrast helper that alpha-composites `rgba()` over its resolved backdrop, and a Playwright helper that launches headless with `--no-sandbox` and caches one context per (page, viewport, font-state) triple.
    - Webfont-blocking helper using Playwright request interception to abort `assets/webfonts/{Horizon,Telegraf}*`, for the `webfonts-blocked` font state.
    - Every property test in this plan runs a **minimum of 100 iterations** via `fc.assert(..., { numRuns: 100 })` and carries a comment naming its design property, per design Testing Strategy.
    - _Requirements: 7.3, 8.1_

  - [x] 3.2 Add a prune step to `.github/workflows/static.yml`
    - Insert a `Prune non-site files` step running `rm -rf tools .kiro` between `Checkout` and `Setup Pages`, exactly as design Testing Strategy specifies. The workflow uploads `path: '.'`, so without this the verification tooling and the spec documents are published.
    - This runs against the ephemeral CI checkout only; it must not delete anything from the repository.
    - _Requirements: 9.4_

- [x] 4. Checkpoint — intake gate closed
  - Confirm `$HORIZON_WEIGHT`, the Telegraf face inventory, the selected branch, the derived `h1` values, and the glyph audit are all recorded. Confirm `npm ci && npm test` runs in `tools/typography-check/`. Ensure all tests pass, ask the user if questions arise.

- [x] 5. Declare the webfonts and remove Google Fonts
  - [x] 5.1 Insert the `@font-face` blocks into `assets/css/main.css` and delete the Google Fonts `@import`
    - **Insert the `@font-face` blocks immediately AFTER the Font Awesome `@import` on line 1, never before it.** CSS requires all `@import` rules to precede other rules; a rule placed above line 1 invalidates the Font Awesome import and breaks every icon on all nine pages (Req 7 c6).
    - Delete the Google Fonts `@import` on line 2 (`Merriweather` + `Source Sans Pro`).
    - Use the exact blocks in design §3.2, substituting the real filenames and the `$HORIZON_WEIGHT` from task 2.1. One rule per file; `font-family` identical to the head of the corresponding stack; `font-weight` equal to the referenced file's weight; `font-display: swap`; the `unicode-range` from §3.2.
    - **The `format()` hint must match the file's actual format:** `woff2` for Horizon, `opentype` for a `.otf` Telegraf file, `truetype` for a `.ttf` one. If the download supplied `.ttf`, the extension and the hint change together.
    - Paths relative to `main.css` (`../webfonts/…`) with no scheme and no host.
    - Ship the Telegraf bold `@font-face` block **only under Branch A**; omit it entirely under Branch B.
    - _Requirements: 2.2, 2.3, 2.6, 2.7, 2.8, 2.9, 2.11, 2.14, 6.6, 7.6_

  - [x]* 5.2 Write property test for bundle/declaration agreement and budget
    - **Property 9: Bundle and declarations agree, within budget**
    - Determine each file's format from its real **sfnt signature**, not its extension. Exclude the fifteen `fa-*` files from the size bounds by name (they total ~2.9 MB and would swamp the 600 KB budget).
    - **Validates: Requirements 2.2, 2.3, 2.5, 2.6, 2.8, 2.12, 2.13, 2.16, 4.3**

  - [x]* 5.3 Write property test for glyph coverage
    - **Property 7: Every character used is a character the font can render**
    - **Validates: Requirements 2.9, 3.15, 3.16, 4.14**

  - [x]* 5.4 Write property test for font provenance
    - **Property 11: Every font file is provably the vendor's, from the vendor**
    - Include the explicit `fontdownloader.net` denylist entry and assert `converted: no` and SHA-256 equality with the recorded vendor hash.
    - **Validates: Requirements 9.1, 9.2, 9.6, 9.8**

- [x] 6. Update the token model
  - [x] 6.1 Rewrite the `$font` map and add the `alt.fg-link` palette key in `assets/sass/libs/_vars.scss`, mirroring into `assets/css/main.css`
    - `$font` target state per design §3.1: `family` → `('Telegraf', 'Helvetica Neue', 'Segoe UI', Roboto, sans-serif)`; `family-heading` → `('Horizon', 'Arial Black', Verdana, 'Trebuchet MS', sans-serif)` (widest-first per Req 6 c1); `family-fixed` unchanged; `weight` 300→400; `weight-bold` 700 (Branch A) or 400 (Branch B); `weight-heading` 900→`$HORIZON_WEIGHT`.
    - **Add the new `letter-spacing-heading: 0.05em` key.** `assets/sass/components/_pagination.scss:31` already reads `_font(letter-spacing-heading)` — a key that does not exist. Because there is no compiler this has never been evaluated; it would error on the first SASS run. Adding the key fixes that latent bug and centralises Req 5 c8. Also remove the now-dead duplicate `letter-spacing: 0.075em` on the preceding line 30.
    - **Add `fg-link: #4a5158` to the `alt` palette map as a new key. Do NOT edit `alt.fg` or `alt.fg-bold`** — `#717981` resolves at 15 sites in the compiled CSS and editing it would recolour the footer `h3`, social icons, table `th`, and pagination links, violating Req 1 c10/c11 (conflict C1). Every existing palette value stays byte-identical.
    - Mirror into `main.css`: `family-heading` resolves at **11** sites — change all of them, not the first. Quote family names as the compiler would emit them (`"Telegraf", "Helvetica Neue", "Segoe UI", Roboto, sans-serif`).
    - _Requirements: 3.1, 3.4, 4.1, 4.3, 5.8, 6.1, 6.2, 6.3, 7.1, 7.2, 7.4, 8.7_

  - [x]* 6.2 Write property test for forbidden tokens, off-origin fonts, and inline typography
    - **Property 6: No forbidden token, no off-origin font, no inline typography**
    - Scope the inline-style oracle to the five typography properties specifically — `index.html` legitimately carries `style="--project-image: url(…)"` on every card, and a blanket ban produces seven false failures.
    - **Validates: Requirements 2.7, 2.11, 2.14, 7.4, 7.9, 7.10, 8.4**

- [x] 7. Apply the heading type scale and overflow safety
  - [x] 7.1 Set heading sizes, weight, letter-spacing, and line-height in `assets/sass/base/_typography.scss` and `assets/sass/layout/_intro.scss`, mirroring into `assets/css/main.css`
    - `h1`–`h6` letter-spacing `0.075em` → **`-0.01em`** (Req 3 c7 range −0.02em…0.02em); base `line-height` `1.5` → **`1.3`** (Req 3 c8 range 1.20–1.50).
    - `h2`–`h6` sizes are already correct per Req 3 c5 (1.75 / 1.25 / 1 / 0.9 / 0.8rem) — re-declare unchanged and confirm the strictly-decreasing ≥0.1rem scale holds with base `h1` at 4rem.
    - Intro `h1`: replace the current **5rem** with the value derived in task 2.2 (design estimate 3.5rem), and the `<=small` **3.25rem** override with the derived small value (estimate 2.75rem). Both declarations change, not one (finding F4). Intro `h1` `line-height` `1` → **`1.1`** (Req 3 c8 range 1.05–1.20).
    - Project-page `h1` (`body.project-page … header.major > h1`): 3.25rem → derived value (estimate 2.5rem).
    - Preserve `text-transform: uppercase` and `fg-bold` colour resolution (Req 3 c9). Do not touch the root font-size steps (Req 3 c10).
    - _Requirements: 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 7.1, 7.2_

  - [x] 7.2 Add `overflow-wrap: break-word` to `h1`–`h6` in `assets/sass/base/_typography.scss`, mirroring into `assets/css/main.css`
    - "Hallgrímskirkja" is 15 characters with no break opportunity and **already overflows today** at 320px (357.5px needed vs 266.7px available) — a pre-existing defect. No font-size reduction fixes it; Horizon makes it worse. `overflow-wrap` is required for Req 3 c11, not advisory (finding F6 / risk R2).
    - Add `hyphens: auto` where supported. Apply to headings generally; do **not** apply mid-word breaking to the intro `h1`, which would split a person's name across lines.
    - _Requirements: 3.11, 3.13, 6.7_

  - [x]* 7.3 Write property test for token-model resolution
    - **Property 4: Every element resolves to the token model**
    - The weight clause is the high-value one — it fails on any surviving hardcoded `font-weight: 700` against a single-weight Horizon.
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.7, 3.8, 3.10, 4.2, 4.5, 4.6, 4.11, 4.12, 5.1, 5.2, 5.8, 6.3**

  - [x]* 7.4 Write property test for overflow and containment in both font states
    - **Property 5: Nothing overflows, in either font state**
    - Generate skills labels **longer than any current content** — today's maximum is exactly 20 characters, so real content never exercises the wrap path.
    - **This property is expected to fail until task 7.2 (`overflow-wrap`) and task 10.3 (elastic pill) have both landed.** A red result before then is the design's prediction, not a mistake.
    - **Validates: Requirements 3.11, 3.12, 3.13, 4.9, 5.4, 5.7, 6.7, 6.8, 6.9, 6.10**

- [x] 8. Apply body text treatment
  - [x] 8.1 Set body `line-height` and confirm body metrics in `assets/sass/base/_typography.scss`, mirroring into `assets/css/main.css`
    - `line-height` **2.375 → 1.7** (Req 4 c5 range 1.6–1.9). The old value was tuned for Merriweather's small x-height; Telegraf's larger x-height makes it read disconnected.
    - `font-size` stays `1rem`; `p { text-align: justify }` is retained (Req 4 c10); `family-fixed` untouched for `code`/`pre` (Req 4 c8).
    - Do **not** lower the root font-size steps — the smallest body size is 10pt = 13.33px, only 0.33px above the Req 4 c13 13px floor.
    - _Requirements: 4.5, 4.6, 4.8, 4.10, 4.13, 7.1, 7.2_

  - [x] 8.2 **[NOT APPLICABLE — task 2.1 selected Branch A, so this was correctly skipped, not implemented]** Add alternative emphasis for `strong`/`b`, mirroring into `assets/css/main.css`
    - Only unblocked once task 2.1 has selected the branch. Under Branch A, `strong`/`b` already resolve through `_font(weight-bold)` and nothing is needed here.
    - Under Branch B apply the design §3.4 block: `font-weight: _font(weight-bold)` (== `weight`, no delta), `font-synthesis: none`, `letter-spacing: 0.02em`, `background-color: rgba(24, 191, 239, 0.12)`, `padding: 0 0.15em`.
    - **Never apply `font-synthesis: none` globally or to `em`/`i`** — Req 4 c11 depends on the browser's synthesized oblique staying available within the Telegraf family, with no family substitution.
    - _Requirements: 4.4, 4.11, 4.12_

  - [x]* 8.3 Write property test for fallback-state equality
    - **Property 13: Blocking the webfonts changes only the family**
    - Differential: compare two renders of the same page rather than either against a fixed expectation.
    - **Validates: Requirements 2.15, 6.4, 6.5**

- [x] 9. Checkpoint — headings and body in place
  - Run Checks A–D locally. Properties 4, 6, 7, 9, 11, 13 should pass; Property 5 is still expected to fail pending task 10.3. Ensure all tests pass, ask the user if questions arise.

- [x] 10. Migrate small interface text off the heading font
  - [x] 10.1 Route all seven Chrome_Text sites to the body font, mirroring each into `assets/css/main.css`
    - Each site changes `_font(family-heading)` → `_font(family)` **and** `_font(weight-heading)` → `_font(weight)` (Req 5 c2 — chrome must sit on a weight that actually ships). Chrome_Text currently inherits Horizon at sizes down to 0.55rem, where its tight closed apertures collapse.
    - The seven sites per design §3.5: `components/_button.scss:24` (skills + Read More), `components/_form.scss:73` (`label`), `components/_pagination.scss:26` (pagination links), `components/_table.scss:31` (`th`), `layout/_navPanel.scss:22` and `:84` (nav panel links), `layout/_footer.scss:188` (`#copyright`).
    - Also per conflict C6: route `#nav .links a` in `layout/_nav.scss` to `_font(family)`, and **keep `#header .logo` on `_font(family-heading)`** as a display element.
    - Chrome_Text letter-spacing `0.075em` → **`0.05em`** via the `letter-spacing-heading` key added in 6.1 (Req 5 c8 range 0.025–0.075em). Reduced deliberately: the longest skills label is exactly 20 characters ("Waterjet fabrication"), precisely at the Req 5 c4 single-line boundary.
    - Preserve the uppercase transform and background treatment of the skills and Read More buttons (Req 5 c5).
    - _Requirements: 5.1, 5.2, 5.5, 5.8, 7.1, 7.2, 7.4_

  - [x] 10.2 Replace all three hardcoded values on the card `h2` in `assets/sass/layout/_main.scss` (~line 358-364), mirroring into `assets/css/main.css`
    - `font-family: Merriweather, Georgia, serif` → `_font(family-heading)`.
    - `font-weight: 700` → `_font(weight-heading)`. **This one matters as much as the family:** left in place against a single-weight Horizon it triggers exactly the browser-synthesized bold Req 3 c4 forbids.
    - `letter-spacing: 0` → `_font(letter-spacing-heading)`.
    - Retain `font-size: 1.1rem` and `text-transform: none` — deliberate card-design choices (conflict C5).
    - This is the only literal typeface name outside the `$font` map and the `@font-face` rules; removing it satisfies Req 7 c4.
    - _Requirements: 3.3, 3.4, 7.4_

  - [x] 10.3 Make the skills pill vertically elastic in `assets/sass/layout/_main.scss`, mirroring into `assets/css/main.css`
    - Req 5 c7 requires an over-wide label to wrap **inside the card** with every character visible. That is impossible today: `body.home #main .button.skills` sets `white-space: nowrap`, `height: 1.7rem`, `line-height: 1.55rem`, and `body.home #main .skills-box` sets `flex-wrap: nowrap` — a wrapped label would be clipped even if it wrapped.
    - Apply the design §3.5 block: container `flex-wrap: wrap`; pill `white-space: normal`, `height: auto`, `min-height: 1.7rem` (preserves the silhouette), `line-height: 1.4` (must be a ratio once multi-line), `padding: 0.15rem 0.4rem` (restores vertical centring without a fixed height).
    - Leave background, border, radius, and uppercase treatment untouched (Req 5 c5).
    - _Requirements: 5.4, 5.5, 5.7_

  - [x]* 10.4 Write property test for per-role cross-page invariance
    - **Property 3: Typography is invariant across pages, per role**
    - Compare **per role, not per tag** (conflict C5: base `h2` 1.75rem, card `h2` 1.1rem, post `h2` 1.5rem legitimately differ), and skip a page on which a role does not appear rather than failing it (`cad.html` has no `h1` and no `h2`).
    - **Validates: Requirements 1.3, 1.8, 4.13, 5.3, 8.1, 8.2, 8.3, 8.9**

- [x] 11. Darken the footer email link
  - [x] 11.1 Add the targeted footer email link rules in `assets/sass/layout/_footer.scss`, mirroring into `assets/css/main.css`
    - Selector **`#footer a[href^="mailto:"]`**. Chosen because the nine pages carry two different footer nesting depths (index/arduino/cad/calculator/church/fluid_sim nest one level deeper than killerbyte/launchtoy/vexlego); an attribute selector matches all nine identically with **no markup edits** (Req 1 c3, c9; Req 8 c5).
    - Default state: `color` and `border-bottom-color` both `#4a5158` (7.38:1 measured). **The underline must be solid** — the inherited `rgba(113,121,129,0.5)` composites to `#b3b7bb` = 1.85:1 and fails Req 1 c7; even `rgba(74,81,88,0.5)` reaches only 2.33:1 (finding F3).
    - Hover: `color: #18bfef !important` (the accent Req 1 c4 mandates) with `border-bottom-color: #4a5158` kept solid — the generic `#footer a:hover` sets `border-bottom-color: transparent`, which is at best an ambiguous Req 1 c7 pass.
    - Focus: `:focus-visible { outline: 2px solid #212931; outline-offset: 2px; }`. `outline` rather than a border so the indicator spans the full text box and cannot alter layout; because `outline` and `color` are independent, the ring survives simultaneous hover as Req 1 c6 demands.
    - No new transition — the inherited `a` transition is 0.2s on `color` and `border-color`, inside the Req 1 c4/c5 bound. Existing `0.8rem` sizing satisfies Req 1 c8 unchanged.
    - **Touch no other footer colour.** The `<h3>Email</h3>` label, social icon links, and `#copyright` keep their exact pre-change values (Req 1 c10, c11).
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 7.1, 7.2_

  - [x]* 11.2 Write property test for declared colour contrast, with the accepted-exceptions allowlist
    - **Property 1: Every declared colour pair meets its contrast threshold**
    - Alpha-composite every `rgba()` value over its resolved backdrop before measuring — the defect this catches is precisely a translucent underline that looks fine and measures 1.85:1.
    - **Encode the accepted-exceptions set with exactly two entries, and do not "fix" either:** `#footer h3` Heading_Text at **4.05:1** (conflict C2) and `#copyright` `rgba(255,255,255,0.25)` on `#1e252d` → `#565c62` at **2.29:1** (conflict C3). The owner ruled **email-link-only**, so Req 1 c11 wins over Req 3 c14 and Req 5 c6. Both are reported as *known-and-accepted* with their conflict IDs, not as failures.
    - The set must fail in three ways: a tuple outside it missing its threshold; a tuple inside it whose measured ratio no longer equals the recorded value at two-decimal precision (in **either** direction — a fix must retire the entry); and it must never be silently extended. Adding a third entry is an owner scope decision, not a test fix.
    - The hover accent (conflict C4, 1.98:1) is **not** an entry — Req 1 c4 mandates it, so scope the transient hover state out of the ≥4.5:1 Body_Text clause instead.
    - **Validates: Requirements 1.1, 1.2, 1.6, 1.7, 3.14, 4.7, 5.6**

  - [x]* 11.3 Write property test for focus and hover state behaviour
    - **Property 10: Focus and hover states behave as declared**
    - Geometric and state-machine oracle (thickness, extent, retention under simultaneous hover); the indicator's contrast is Property 1's business.
    - **Validates: Requirements 1.4, 1.5, 1.6**

- [x] 12. Document the change
  - [x] 12.1 Update `README.md` with credits, the regeneration procedure, and any Branch B limitation
    - Credits section: Horizon → Alberto Fontense, Telegraf → Pangram Pangram Foundry, each with its licence tier (Req 9 c3).
    - Reproduce the six-step Compiled Stylesheet Sync Procedure from the design, in execution order, naming every file edited or produced and stating how parity is verified (Req 7 c5). Include the last-declaration-wins note: `#footer` already carries `color` twice from the `color(alt)` mixin, so a checker reading the first match reports a false failure.
    - **Under Branch B only:** record the missing-bold limitation and the alternative emphasis treatment in the Credits or typography notes section (Req 4 c4).
    - _Requirements: 4.4, 7.5, 9.3_

- [x] 13. Cross-cutting verification
  - [x]* 13.1 Write property test for the intended-delta allowlist
    - **Property 8: Everything outside the intended delta is byte-identical to the baseline**
    - The allowlist *is* the specification of scope: every `$palette` entry (additive `alt.fg-link` excepted), footer `h3` / social icon / `#copyright` colours, heading `text-transform` and colour resolution, skills and Read More background and uppercase treatment, every `mailto:` href and visible text, every nav and project `href` resolving to a file present in the repo, the set/count/order/nesting of the six element groups on every page, and the name, count, and SHA-256 of all fifteen pre-existing Font Awesome files.
    - **Validates: Requirements 1.9, 1.10, 1.11, 3.9, 5.5, 7.7, 8.5, 8.7, 8.8**

  - [x]* 13.2 Write property test for SASS/compiled-CSS parity
    - **Property 2: Compiled CSS is value-identical to the resolved SASS source**
    - Apply **last-declaration-wins** within each rule. Also assert zero occurrences of `Merriweather` and `Source Sans Pro` in both artifacts.
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.8**

  - [x]* 13.3 Write property test for commercial-use markers
    - **Property 12: No page contains a commercial-use marker**
    - Both licences are conditioned on non-commercial use, an obligation that outlives this change. Running this on every invocation turns it into a detectable failure.
    - **Validates: Requirements 9.4**

  - [x]* 13.4 Write integration guards for Font Awesome and page scripts (Checks E and F)
    - Check E: every Font Awesome icon renders on all nine pages with no missing-glyph substitution — the guard that the `@font-face` insertion point did not displace the `@import` (Req 7 c6).
    - Check F: the water particle canvas from `assets/js/waterParticles.js` initialises and animates, and the hover / expand / Read More interactions from `assets/js/projectCards.js` respond, with no uncaught console error.
    - One run each, not property tests — these do not vary with input.
    - _Requirements: 7.6, 8.6_

- [x] 14. Checkpoint — pre-push verification gate
  - **Do not push to `main`.** `.github/workflows/static.yml` deploys the whole repository to production on every push to `main` and there is no staging environment. Commit this work as **one revertible commit** on a feature branch and open a PR for review; `git revert` of that single commit fully restores the previous typography.
  - Run `cd tools/typography-check && npm ci && npm test` (Checks A–F) against the working tree. All 13 properties and both integration checks must pass, including Property 5, which task 7.2 and task 10.3 have now unblocked.
  - Confirm Property 1 passes with its two accepted exceptions reported as known-and-accepted. A red Property 1 means one of three real things: a new contrast regression outside the set, an accepted ratio drifting from its recorded value, or an entry added without an owner decision.
  - Confirm zero occurrences of `Merriweather` and `Source Sans Pro` in both artifacts, and that the `@font-face` blocks sit after the Font Awesome `@import`.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Record post-deploy transfer measurements
  - [x] 15.1 Run Check H against the live origin and fill in the provenance record
    - **Sequenced after the PR merges and the workflow deploys, by necessity** — Req 2 c10, c17, and c18 are assertions about the deployed GitHub Pages origin's compression and same-origin behaviour, which cannot be measured before the fonts are live.
    - Run the `curl` procedure in design §4.5 for each font file. `--compressed` advertises gzip/br so the response reflects what a real browser receives.
    - Record the measured `Content-Encoding` and `transfer_bytes` for every file in `assets/webfonts/FONT-PROVENANCE.md`, replacing the `TBD — Check H` placeholders. `font/otf` is commonly not compressed by GitHub Pages, so `identity` with `transfer_bytes == stored_bytes` is the expected result and `gzip` with a smaller count is a bonus. Either outcome changes nothing in the CSS.
    - The same run doubles as the Req 2 c10 same-origin check — `http=200` for every file.
    - _Requirements: 2.10, 2.17, 2.18, 9.8_


---

**Change Set 2 — the seven follow-up changes (tasks 16–25). All against the post-merge code on `main`.**

- [ ] 16. Prepare the verification harness for Change Set 2
  - [ ] 16.1 Update the shared fixtures and helpers in `tools/typography-check/fixtures.mjs`
    - **Drop the `#copyright` entry from `ACCEPTED_CONTRAST_EXCEPTIONS`, leaving exactly one member** — `#footer h3` Heading_Text at **4.05:1** (conflict C2). Req 14 c7 requires this: the set pins each entry to a *measured* ratio and fails when that ratio drifts **in either direction**, so leaving the 2.27:1 `#copyright` entry in place while task 23 ships 7.33:1 would turn a successful fix into a red check. The footer `h3` entry stays — Req 14 c8 keeps conflict C2 resolved as previously decided.
    - Add a **label-box helper that reads a `Range` over the anchor's text node via `getClientRects()`**, returning one rect per rendered line. Properties 14 and 15 both depend on this and it is the single easiest thing to get wrong: the anchor *is* the pill, so measuring the element rect would compare the pill to itself and report every ratio as 1.000 — a vacuous pass (design Testing Strategy, Check D note).
    - Add a Playwright context helper for **`javaScriptEnabled: false`**, plus an `assets/js/*` abort variant for the partial-failure case. This is Check I's mechanism and it needs a separately configured context, which is why it cannot be folded into Check D.
    - Add role selectors for the Change Set 2 element groups: **Bold_Chrome_Text** (`#nav ul.links a`, `.button` including `.button.primary` / `.button.primary.small.fit`, `a.button.skills`), the two **Skills_Pill** geometries, the **Card_Header_Band** and Card_Heading, and the **Copyright_Block** with its two child links.
    - Extend Property 6's forbidden-token set with **`#4a5158`** as a link or underline colour (Req 1 c13 is a zero-occurrence rule), and widen its inline-style oracle from the five typography properties to also cover **`text-align`** and **`color`** on the nine pages (Req 10 c8, Req 14 c9). Keep the `style="--project-image: url(…)"` carve-out — a custom property is neither of the added names, so `index.html` must not produce seven false failures.
    - _Requirements: 1.13, 10.8, 14.7, 14.9_

  - [ ] 16.2 Add the advance-width comparison to Check C (`fontTools`, no browser)
    - Run the design §5.4 Layer 1 script over `PPTelegraf-Regular.otf` and `PPTelegraf-Ultrabold.otf`: summed `hmtx` advances over `unitsPerEm` plus the declared `0.05em` tracking per character, for `PROJECTS`, `CAD GALLERY`, `READ MORE`, `VIEW MODEL`, `CSS`, `AUTODESK INVENTOR`, `WATERJET FABRICATION`.
    - Assert the measured 400→800 increase against the §5.3 table (+3.62% to +8.5%, clustering near +6.8%) and emit the rendered-width table at 320 / 768 / 1024 / 1440px using the declared root steps (13.33px, 14.67px, 14.67px, 16.00px). **This discharges Req 11 c16**, which asks for measured rather than assumed advance widths, and it is deterministic — no browser, no font loading window.
    - _Requirements: 11.16_

  - [ ]* 16.3 Run Property 15 against the **unmodified** tree and record the baseline breaches
    - **Property 15: Every skills pill box fits its label, symmetrically and in ratio**
    - **This run is expected to FAIL, in three places at once**, and the failures are the evidence for §5.4: homepage width ratio **0.891–0.893** against the 0.88 ceiling (Req 12 c5); homepage vertical symmetry **≈8.1px** against the 1px tolerance (Req 12 c2), because `min-height: 1.7rem` exceeds the 19.12px content height and block layout drops all 8.08px of slack below the line box; and the wider-context height ratio **1.000** against the 0.85 ceiling with an **undefined** padding-to-gap ratio (Req 12 c4), because `line-height: 2.25rem` is a length set equal to `height: 2.25rem`.
    - **A Property 15 that passes here is a broken checker, not good news** — it means the label box is being read from the element rect rather than from a text-node `Range`. Verify the three expected failures appear before trusting any later pass.
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.10, 12.12, 12.13**

- [ ] 17. Darken the footer email link to `#3a4148` (design §5.1)
  - [ ] 17.1 Change the `alt.fg-link` token in `assets/sass/libs/_vars.scss`, mirroring into `assets/css/main.css`
    - `fg-link: #4a5158` → **`fg-link: #3a4148`**. One literal in the SASS source; Change Set 1 already routed all three declarations (`color`, default `border-bottom-color`, hover `border-bottom-color`) through `_palette(alt, fg-link)`, so the source delta is a single token.
    - Mirror **all three resolved literals** in `assets/css/main.css`. A partial replacement ships two different email colours across the site and fails Property 6 rather than being caught by eye.
    - **Req 1 c13 is a zero-occurrence rule, not a replacement rule.** After this task `#4a5158` must appear **nowhere** in the SASS source or the compiled CSS as a link or underline colour — including in explanatory comments in `layout/_footer.scss` that document a value the source no longer sets. Update those comments with the declaration so the source does not describe a superseded value.
    - The threshold in Req 1 c1 did **not** move: it is still ≥7.0:1 and `#4a5158` already cleared it at 7.38:1. `#3a4148` measures **9.49:1** on `#f5f5f5` and buys margin; this is not a failure being fixed, and recording that keeps a reader from misreading the amendment's intent.
    - Do not touch `alt.fg`, `alt.fg-bold`, the `<h3>Email</h3>` label, or the social icon links (Req 1 c11, Req 8 c7 — `alt.fg-link` remains the single changed palette value).
    - _Requirements: 1.1, 1.2, 1.7, 1.12, 1.13, 7.1, 7.2, 8.7_

  - [ ]* 17.2 Extend the zero-occurrence and literal checks for the new value
    - **Property 6: No forbidden token, no off-origin font, no inline typography** — assert zero occurrences of `#4a5158` in both artifacts as a link or underline colour.
    - Update the Change Set 1 unit assertion in `smoke.test.mjs` from the literal `#4a5158` to **`#3a4148`** as the `alt.fg-link` value.
    - Re-run **Property 1** so its footer-email rows re-measure at 9.49:1 (default text and underline) and confirm the relative-luminance clause against `#717981` is still checked directly rather than inferred.
    - **Validates: Requirements 1.1, 1.2, 1.7, 1.12, 1.13, 7.9**

- [ ] 18. Centre the project card titles (design §5.2)
  - [ ] 18.1 Change `text-align` on the Card_Header_Band in `assets/sass/layout/_main.scss`, mirroring into `assets/css/main.css`
    - **Edit the existing `text-align: left` at line 358** (`body.home #main .posts > article > header`) to `text-align: center`. One token; the declaration count stays identical in both artifacts.
    - **Do NOT add `text-align` to the card `h2`.** That would leave the source saying "this band is left-aligned and its only child is centred" — a contradiction that invites a future editor to tidy one of the two and silently undo the change. Leaving the `h2` rule untouched is also the cheapest guarantee of Req 10 c4 (`font-size: 1.1rem`, `text-transform: none`, `line-height`, `color`) and Req 10 c5 (`h2 > a { color: inherit }`, no separate colour).
    - **Do NOT touch the two other `text-align: left` declarations at lines 179 and 444.** `_main.scss` contains exactly three; 179 and 444 are card *description* paragraph rules (both `font-size: 0.85rem`) where left alignment is a deliberate prose-readability choice (Req 10 c7). No global find-and-replace of `left` → `center` in either artifact.
    - Multi-line titles need no extra work and this is the load-bearing detail: `text-align` applies per **line box**, so the explicit `<br />` in "KillerByte / Full-body Spinner Battlebot" and any 320px auto-wrap centre independently (Req 10 c2, c3). **Do not use flex or grid centring** — `justify-content: center` would centre the `h2` *box* as one unit and leave its internal lines left-ragged, passing c1 while failing c2 and c3.
    - Req 10 c9 holds trivially: `text-align` moves inline content within the line box and changes no box dimension, so the band's `background-color: #12263a`, `padding: 0.85rem 1rem`, card heights and grid alignment are all unaffected.
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 7.1, 7.2_

  - [ ]* 18.2 Write property test for per-line card title centring
    - **Property 14: Every card title line is centred in its band**
    - Quantify over **rendered lines**, not headings: a check on the heading's own bounding box would pass for a flex-centred `h2` whose lines were still left-ragged, which is the exact mistake §5.2 rejects. Lines come from the `Range`/`getClientRects()` helper added in 16.1.
    - **Pin the `<br />` card as a required case** alongside the sampled ones — "KillerByte / Full-body Spinner Battlebot" is the only heading that breaks at every viewport, so a uniformly sampling generator could miss it.
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [ ]* 18.3 Extend Property 8's baseline set for the centring scope
    - **Property 8: Everything outside the intended delta is byte-identical to the baseline**
    - Move the Card_Header_Band `text-align` value **out** of the baseline set (it is now an intended change) and add: the `text-align` resolution of every other element, naming `_main.scss:179` and `:444` specifically (Req 10 c7); the band's `background-color: #12263a`, `padding: 0.85rem 1rem` and box dimensions (Req 10 c9); and the Card_Heading's `font-size: 1.1rem`, `text-transform: none`, `line-height` and `color`, plus the **absence** of any `color` declaration on `h2 > a` (Req 10 c4, c5).
    - Add the unit assertions from the design Testing Strategy: the band declares `text-align: center` while lines 179 and 444 still declare `left`.
    - **Validates: Requirements 10.4, 10.5, 10.7, 10.9**

- [ ] 19. Move nav, buttons and pills to Ultrabold (design §5.3)
  - [ ] 19.1 Change the two `font-weight` declarations, mirroring both into `assets/css/main.css`
    - `assets/sass/layout/_nav.scss:34` (`ul.links`): `_font(weight)` → **`_font(weight-bold)`**.
    - `assets/sass/components/_button.scss:26` (the base `.button` rule): `_font(weight)` → **`_font(weight-bold)`**.
    - **Two declarations cover all three element groups, which is exactly what Req 11 c3 requires.** The base `.button` rule reaches Read More (`.button`), View Model (`.button.primary`, `.button.primary.small`, `.button.primary.small.fit`) **and** the skills pills, because `body.home #main .button.skills` declares no `font-weight` of its own and inherits. Do not add a third declaration to the pill rule — a per-rule literal weight would also breach Req 11 c2, which requires the weight to resolve through the `$font` map.
    - **No new font file and no `@font-face` change** (Req 11 c4). `PPTelegraf-Ultrabold.otf` already ships at `usWeightClass` 800 and is already declared at `font-weight: 800` under the `PP Telegraf` family, because Change Set 1 needed it for `<strong>`. The bundle stays at **103,324 bytes, 17% of the 600 KB budget**. Req 11 c6 follows: 800 is a shipped weight, so nothing is synthesized or interpolated.
    - **Change nothing else in either rule.** Family stays `_font(family)` (Req 11 c5); `letter-spacing` stays `_font(letter-spacing-heading)` = `0.05em`, which Req 11 c8 now makes a **floor** rather than a free parameter — the tracking-reduction lever §3.5 used to buy width is gone, so any width shortfall is absorbed by the box in task 20, never by tighter tracking. `text-transform`, `background-color`, `border`, `border-radius`, default and hover colours and transition timing are untouched (Req 11 c13), so Req 11 c14 inherits Change Set 1's contrast measurements (12.18:1 worst case).
    - **Verify for clipping and overflow in all three groups**, since Ultrabold measures **+3.6% to +8.5% wider** than Regular at an unchanged font size (§5.3, clustering ~+6.8%): the nav bar (`PROJECTS` + `CAD GALLERY` grow 159.7px → 169.5px at 1440px inside a 1312px flex row with grow/shrink), the buttons (`inline-block`, `width: auto`, so the box sizes to its label — the exposure is actions-row reflow, not clipping; retain `white-space: nowrap` per Req 11 c11), and the pills (**the binding case, and it does fail** — 124.0px at 1440px puts the width ratio at 0.893 against the 0.88 ceiling).
    - **Req 11 c12 fixes the remedy in advance** for anything that will not fit: enlarge the element or its padding. Never reduce `font-size` below the Req 5 c3 floor, never revert to weight 400, never apply `text-overflow` truncation.
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.8, 11.9, 11.10, 11.11, 11.12, 11.13, 11.15, 5.2, 7.1, 7.2_

  - [ ]* 19.2 Extend Property 4's weight clause into a 400/800 partition
    - **Property 4: Every element resolves to the token model**
    - Refine "a member of the shipped-face weight set" into a **partition** over Chrome_Text: every Bold_Chrome_Text element (`#nav ul.links` anchors, every `.button` label including the View Model variants, every `a.button.skills`) computes to exactly **800**; every other Chrome_Text element (form labels, pagination links, table headers, nav-panel links, Copyright_Block) computes to exactly **400** (Req 11 c15). Both must be members of the shipped set `{400, 800}`.
    - This is why Requirement 11 gets no property of its own, and why the partition is worth the refinement: **the two halves fail each other's mistakes.** Bolding too much trips the 400 clause; bolding too little trips the 800 clause; either way fast-check's shrink output names the element. Keep the family clause, so a weight edit that accidentally alters the family also fails here (Req 11 c5).
    - Add the unit assertions: both `_nav.scss:34` and `_button.scss:26` declare `_font(weight-bold)`.
    - **This property passes only once both halves of Requirement 11 land** — an incomplete edit fails asymmetrically and diagnostically.
    - **Validates: Requirements 11.1, 11.2, 11.5, 11.6, 11.8, 11.15, 5.2**

  - [ ]* 19.3 Extend Property 5's containment clause to the bold groups
    - **Property 5: Nothing overflows, in either font state**
    - Name the Bold_Chrome_Text groups explicitly, all measured at weight 800: every `.button` and Skills_Pill label lies wholly inside its element's box with no clipped character and **no `text-overflow` ellipsis applied**; `Read More` and `View Model` each occupy exactly one line inside their button's padding box (Req 11 c11); `Projects` and `CAD Gallery` each occupy one line inside the `#nav` content box with no two nav links overlapping (Req 11 c10).
    - Worth checking rather than reasoning about, because the §5.3 arithmetic models neither the nav's logo and right-hand icon group nor the actions row's wrap behaviour.
    - **Req 11 c7 is deliberately NOT in this property.** Overlapping glyph outlines and filled counters at 0.55rem/800 are a rendering judgement, not a bounding-box computation; they belong to the visual-review step in task 25.
    - **Validates: Requirements 11.9, 11.10, 11.11, 12.8, 5.4, 5.7**

- [ ] 20. Retune the skills pill geometry for the heavier labels (design §5.4) — depends on task 19
  - [ ] 20.1 Run the Layer 2 browser measurement and record the rendered numbers
    - Playwright, headless Chromium, **with the real fonts confirmed loaded** via `document.fonts.check('0.55rem "PP Telegraf"')` before any measurement — a measurement taken during the `font-display: swap` fallback window measures Helvetica, not Telegraf.
    - For each of 9 pages × 4 viewports {320, 768, 1024, 1440} and every `a.button.skills`: read the pill's `getBoundingClientRect()` with its resolved `padding`, `border-width` and `min-height`; read the **label** box from the `Range`/`getClientRects()` helper (16.1); derive the four gaps, the c5/c6 ratios and the c4 padding-to-gap ratio; assert pill-to-pill non-overlap and card containment (c12).
    - **Record the narrowest and widest label of each geometry** — `C++` / `WATERJET FABRICATION` homepage, `C++` / `WATERJET FABRICATION` wider-context — with measured label box, measured pill border box, and the resulting ratios, at all four viewports. **This is what discharges Req 12 c13**; §5.4's numbers are derived from font metrics and declared CSS and are explicitly *not yet browser-measured*.
    - Layer 2 is the authority. Where it disagrees with §5.4's arithmetic, Layer 2 wins — subpixel rounding, hinting and the `skills-box` flex gap all sit outside the arithmetic.
    - _Requirements: 12.13, 12.1, 12.2, 12.3, 12.12_

  - [ ] 20.2 Apply the two geometry blocks in `assets/sass/layout/_main.scss`, mirroring into `assets/css/main.css`, then re-measure
    - **Homepage geometry** (`body.home #main .button.skills`, ~line 486), per §5.4: `padding: 0.2rem 0.55rem` (was `0.15rem 0.4rem`), `min-height: 1.35rem` (was `1.7rem`), `display: inline-flex` with `align-items: center` and `justify-content: center`. `font-size: 0.55rem`, `line-height: 1.4`, `white-space: normal` and `height: auto` are **unchanged** (Req 12 c8, c11).
    - **Wider-context geometry** (`.button.skills, .actions .button`, ~lines 195–201): **`line-height: 1.4` only** — was `2.25rem`, a *length* set equal to `height`. `height: 2.25rem` and `padding: 0 1rem` are deliberately left alone so the Read More and View Model boxes do not change size.
    - Each number answers a specific breach: horizontal padding `0.55rem` puts the widest label at a **0.864** width ratio (the 0.88 ceiling needs ≥0.466rem at 1440px; `0.5rem` would pass at 0.873 with only 0.007 of headroom that rounding could erase); vertical padding `0.2rem` is forced by Req 12 c4, since `0.15rem` against `0.55rem` horizontal exceeds the 3.5× ceiling and is **out of bounds by itself**; `min-height: 1.35rem` clears the Req 12 c7 floor whose worst case is **1.320rem at 320px** (the 2px border is absolute, so it is a larger fraction of a smaller root); and `line-height: 1.4` in the wider context converts a length into a ratio, dropping the height ratio from **1.000 → 0.436** and turning a zero vertical gap into 10.16px, which puts the 1rem horizontal padding at **1.57×** it.
    - `display: inline-flex` with `align-items: center` is the belt to `min-height`'s braces: ~0.88px of residual slack at 1440px would all fall below the text under block layout, and flex centring splits it to ~0.44px per side, inside the 1px tolerance of Req 12 c2 **structurally** rather than by arithmetic coincidence. Multi-line wrapping survives — the text becomes a single anonymous flex item that still wraps under `white-space: normal` (Req 12 c8, Req 5 c7).
    - **Then re-run 20.1's measurement and adjust if any Requirement 12 bound is missed** (Req 12 c11). The two thinnest predicted margins are the wider-context height ratio (0.436) and its narrowest width ratio (0.424), both against a 0.40 floor; §5.4's recorded fallback is `height: 2.1rem` with `padding: 0 0.9rem`, computing to 0.467 and 0.450–0.846. Adjust padding, `min-height` or `line-height` only: never reduce `font-size` below the Req 5 c3 floor, never reintroduce `white-space: nowrap`, never reintroduce a fixed `height` on the homepage geometry.
    - Req 12 c9 holds throughout: `border-radius: 999px`, `background-color`, border colour and width, and label colour are untouched in both geometries. This corrects fit, not appearance.
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11, 12.12, 7.1, 7.2_

  - [ ]* 20.3 Write property test for pill box fit
    - **Property 15: Every skills pill box fits its label, symmetrically and in ratio**
    - Treat the two geometries as a **generator dimension**, not two properties — the oracle is identical and only the declared `font-size` and the effective-vertical-gap definition differ.
    - Generate **over-long labels** to exercise the multi-line clause (Req 12 c6): current content reaches exactly 20 characters and no label wraps at these sizes, so real content never reaches that path. Predicted two-line homepage ratio is 0.737 against the 0.90 ceiling.
    - The label box must come from the text-node `Range`, never the anchor rect — see 16.3.
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.10, 12.12, 12.13**

- [ ] 21. Checkpoint — the coupled bold-and-geometry change is whole
  - Requirements 11 and 12 must be verified **together**: landing 19 without 20 ships a measured Req 12 c5 failure (risk R7). Confirm Property 15 now passes at all four viewports, that its three baseline breaches from 16.3 are gone, and that Property 4's partition and Property 5's containment arm both pass.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Replace the footer line with a Back to top control and a reworded design credit (design §5.5)
  - [ ] 22.1 Add the three supporting CSS declarations, mirroring each into `assets/css/main.css`
    - `html { scroll-behavior: smooth; }` in `assets/sass/base/_page.scss` (the existing `html` rule), with a **`@media (prefers-reduced-motion: reduce)` arm restoring `scroll-behavior: auto`** — an unrequested full-page scroll animation is precisely the class of motion that setting exists to suppress. `scroll-behavior` must sit on the scrolling element, so it is necessarily global rather than scoped to the link.
    - In `assets/sass/layout/_footer.scss`, inside the `#copyright` rule: `a { cursor: pointer; }` overriding the block's `cursor: default` on static text (Req 13 c17), and `a:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }` (Req 13 c9). `outline` rather than a border, so the ring spans the full text box and alters no layout; `currentColor` rather than a literal, so the ring tracks the block colour task 23 sets and the two rules cannot drift apart; `:focus-visible` keeps the ring off pointer clicks.
    - The smooth-scroll block is **optional to the requirement**: Req 13 c2 asks only that the top of the document be brought into the viewport. If Check F shows any interference with the template's `scrolly` / `scrollex` anchors, drop the block — the instant jump still satisfies c2, c3 and c5 in full. (`scrolly` calls `preventDefault()`, so no native scroll competes with jQuery's animation in the first place.)
    - _Requirements: 13.9, 13.17, 13.2, 7.1, 7.2_

  - [ ] 22.2 Replace the `#copyright` list content on **all nine** Content_Pages
    - Replace `<ul><li>Fonts &amp; icons: <a href="https://html5up.net">HTML5 UP</a></li></ul>` with:
      `<ul><li><a href="#top">Back to top</a></li><li>Design: <a href="https://html5up.net">HTML5 UP</a></li></ul>`
    - **Two `<li>` elements, matching Req 13 c12's two-separate-elements rule.** No CSS work is needed: `#copyright ul li` are already `inline-block` with `border-left: solid 2px` and `:first-child { border-left: 0 }`, so the second item picks up the template's divider, and the existing `<=xsmall` breakpoint already stacks them.
    - **`href="#top"`, not `#wrapper`** (Req 13 c4 permits either; §5.5 chooses `#top`). The HTML standard defines the `top` fragment as the top of the document when no element carries that ID, so the link cannot be broken by a markup change; `#wrapper` depends on an element continuing to exist and scrolls to that element's box rather than the document origin. `#wrapper` is the recorded fallback if a target browser is found not to honour the special case — a one-token change per page.
    - **No `class="scrolly"`.** Req 13 c5 requires the control to work with scripting disabled, and a native `<a href="#top">` does so because fragment navigation is browser behaviour. Scrolly would *technically* degrade correctly, but it would make the control's intended behaviour depend on jQuery, three script files and a plugin for nothing but easing — which the CSS in 22.1 supplies instead. No `href="#"`, no `javascript:` URL, no script-only handler (Req 13 c6).
    - Accessibility falls out of using a real anchor: the visible text `Back to top` **is** the accessible name, so **no `aria-label`** is added — a redundant label risks diverging from the visible text (Req 13 c7). A native `<a href>` is in the tab order by default, and no `tabindex` is declared on it or any ancestor (Req 13 c8). Enter on a focused anchor performs the same navigation as a click, so no `keydown` handler (Req 13 c3).
    - **The HTML5 UP credit is retained, and reworded** (Req 13 c10, c11). It stays because the [HTML5 UP licence](https://html5up.net/license) places the templates under **Creative Commons Attribution 3.0** with credit for the design given in exchange, and attribution-free usage is sold separately through Pixelarity — so the credit is the price of the free tier, not a courtesy; because CC BY 3.0 attaches attribution to **adaptations**, not only verbatim copies, so divergence from the demo does not discharge it; and because the repository is still substantially template-derived (24 files under `assets/sass/` carry the Massively header, six template JS files ship, and `#wrapper` / `is-preload` / `split contact` / `icons` / `actions` are on all nine pages). What changes is the **wording**: "Fonts & icons" is now simply inaccurate — the fonts are Horizon and PP Telegraf — so it becomes a design credit. Removing the credit is not available under this spec; the supported route is a Pixelarity licence, which is a purchase decision outside it.
    - **Respect each page's existing line layout while emitting identical inner markup** (Req 13 c13). Six pages write `#copyright` across multiple source lines; **`killerbyte.html`, `launchtoy.html` and `vexlego.html` write the whole div on one source line** — edit in place rather than reformatting.
    - **Verification point: all nine pages become byte-identical inside the `<ul>`.** `vexlego.html` currently writes `&amp;` where the other eight write a bare `&`; the new wording contains **no ampersand at all**, so that divergence retires and Req 13 c14's escaping rule is satisfied vacuously rather than by nine careful edits. **Do not reintroduce an entity.** Diff the nine `<ul>` strings against each other as the completion check for this task.
    - Req 13 c15 holds untouched: the Copyright_Block keeps `PP Telegraf`, `0.8rem`, uppercase, its declared letter-spacing, `1.5` line-height and centred alignment. Req 8 c5 is satisfied because the exemption covers the block's inner content only — the block itself and its position in the footer are unchanged, and no element outside it is added or removed.
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.10, 13.11, 13.12, 13.13, 13.14, 13.15, 13.16, 8.5_

  - [ ]* 22.3 Write property test for the control, including the no-JavaScript arm (Check I)
    - **Property 16: The Back to top control works without scripting, from the keyboard, on every page**
    - Assert exactly one Back_To_Top_Control and exactly one Design_Credit as **two separate elements** with byte-identical inner markup and identical text across all nine pages; the control is an `<a>` whose `href` is a same-document fragment that is neither `#` nor a `javascript:` URL, with a non-empty accessible name and no positive `tabindex` on it or any ancestor; the Design_Credit names HTML5 UP, links to `https://html5up.net`, and its text references **neither fonts nor icons**.
    - **Check I is a separate check because it needs a separately configured context**, not a different generator: `javaScriptEnabled: false` for the whole context, which cannot be mixed into a run that also exercises the card-interaction paths. Add the `assets/js/*` abort variant for the partial-failure case. Oracle for "brings the top into the viewport": `window.scrollY === 0` after pointer and after keyboard activation, with an unchanged `document.URL` pathname — which is what distinguishes a working fragment jump from a navigation to a different document.
    - Two clauses are stricter than they look and both are deliberate: byte-identical inner markup is what stops the nine pages drifting (per-page hand editing has already produced divergence once), and the two-separate-elements clause is what stops a single anchor doing both jobs from passing a naive "control exists" plus "credit exists" pair of checks while making the credit unclickable or the control an external link.
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.10, 13.11, 13.12, 13.13, 13.14**

  - [ ]* 22.4 Extend Property 10 and Check F for the two new links
    - **Property 10: Focus and hover states behave as declared** — the focus-indicator clause (≥2 CSS pixels, spanning at least the full width of the text, retained under simultaneous hover) now also holds for the Back_To_Top_Control and the Design_Credit link, and while the pointer is over either the computed `cursor` is `pointer` rather than the block's `default` (Req 13 c17). The indicator's *contrast* stays Property 1's business.
    - Extend **Check F** (integration, one run): confirm `scroll-behavior: smooth` does not disturb the `scrolly` anchors or the `scrollex` intro fade, and that no uncaught console error appears. A failure here is the documented trigger for dropping the smooth-scroll block from 22.1.
    - **Validates: Requirements 13.9, 13.17, 8.6**

- [ ] 23. Make the copyright bar legible (design §5.6)
  - [ ] 23.1 Raise the `#copyright` text alpha in `assets/sass/layout/_footer.scss:227`, mirroring into `assets/css/main.css`
    - `color: transparentize(_palette(invert, fg), 0.75)` → **`transparentize(_palette(invert, fg), 0.35)`**. `transparentize` *subtracts* its amount from the alpha, so target alpha **0.65** is written as `0.35`. The compiled mirror is `rgba(255, 255, 255, 0.65)`, which composites to **`#b0b3b6`** and measures **7.33:1** against `#1e252d`.
    - **Only the `transparentize` amount changes.** `invert.fg` stays `#ffffff`, the Copyright_Block background stays `#1e252d`, and no other rule resolving through the `invert` palette is touched — so Req 8 c7 continues to hold with `alt.fg-link` as the single changed palette value (Req 14 c4, c5).
    - **Cover all four states and confirm each clears 4.5:1** (Req 14 c1–c3): static text, Back_To_Top_Control and Design_Credit defaults all inherit `#b0b3b6` at **7.33:1** through the existing `#copyright a { color: inherit }` rule, so one declaration carries three rows; hover / active resolves to the `invert` accent `#18bfef` at **7.17:1**; focus keeps `#b0b3b6` text plus the 2px `currentColor` ring from 22.1 (≥3.0:1 required, 7.33:1 delivered).
    - **Why 0.65 and not 0.50, when Req 14 c1 asks only for 4.5:1:** the deciding factor is the hover state. At alpha 0.50 the default measures 4.94:1 against a 7.17:1 hover — **+45%**, so the control would look conspicuously weaker than its own hover, an odd signal for something that should be discoverable *before* being hovered. At 0.65 the two sit within **2%** of each other. Both alphas satisfy c1–c3; 0.65 is chosen for state consistency, and that is the rationale Req 14 c6 asks to be recorded.
    - The earlier "alpha ~0.65 → ≈4.6:1" pairing was unreconciled: 0.65 gives 7.33:1 and ≈4.9:1 falls near alpha 0.50. Use the measured pairing, and do not carry the old one forward into any comment.
    - **Leave the footer `h3` (4.05:1) and the social icon links alone** (Req 14 c8, Req 1 c11) — conflict C2 stands as decided; the Req 1 c11 exemption reaches the Copyright_Block and nothing else.
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.8, 14.9, 7.1, 7.2_

  - [ ]* 23.2 Re-run Property 1 with the reduced exceptions set
    - **Property 1: Every declared colour pair meets its contrast threshold**
    - The Copyright_Block, the Back_To_Top_Control and the Design_Credit link are now checked against the ordinary **≥4.5:1** Chrome_Text threshold in default, hover, focus and active states, like any other tuple — the `#copyright` accepted-exception entry was removed in 16.1 and must not reappear. Confirm the alpha-compositing path measures `rgba(255,255,255,0.65)` as `#b0b3b6`, not as opaque white.
    - Confirm the run still reports the single remaining entry (`#footer h3`, 4.05:1, conflict C2) as **known-and-accepted** with its conflict ID, and that adding an entry remains an owner scope decision rather than a test fix.
    - Add the unit assertion: `#copyright` declares `transparentize(_palette(invert, fg), 0.35)` and resolves to `rgba(255, 255, 255, 0.65)`.
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.7, 5.6**

- [ ] 24. Update the provenance record and the README
  - [ ] 24.1 Replace the Horizon `TODO` block in `assets/webfonts/FONT-PROVENANCE.md` with the recorded accepted position
    - Change the `licence_text_file` field in the `## Horizon.woff2` record from `*none — see TODO below*` to **`*none — accepted, see note*`**. Req 9 c11 requires a **sentinel value**, not an empty cell, so that "recorded as absent" stays distinguishable from "forgotten".
    - Delete the `**TODO (owner):**` block that instructs the owner to save `Horizon-LICENSE.txt`, and replace it with the §5.7 statement: no vendor licence or EULA text for Horizon could be located from the designer's own channels; Req 9 c2 no longer requires a stored file for Heading_Font; Req 9 c9 substitutes a recorded-fields obligation met by the four fields already present (tier *free for personal use*, designer *Alberto Fontense*, source URL, download date); **this is a closed decision, not an outstanding action.**
    - State plainly that the **obligation is unchanged**: Horizon's free-personal-use terms bind the Site whether or not a copy is stored, so Req 9 c4 and c5's Non_Commercial_Use constraint applies exactly as before. **Invent no substitute licence file**, and paraphrase rather than reproduce the designer's terms (Req 9 c11).
    - No font file, no stylesheet and no page changes in this task — the four recorded fields are already non-empty, so this is a note edit rather than a data-gathering exercise.
    - _Requirements: 9.2, 9.9, 9.11_

  - [ ]* 24.2 Split Property 11's licence-text clause per family
    - **Property 11: Every font file is provably the vendor's, from the vendor**
    - Resolve `licence_text_file` **per family**: for Body_Font it must name a file present under `assets/webfonts/` (`EULA-PangramPangram-FreeForPersonalUse-MAY2021.pdf` does ship); for Heading_Font it must carry the "none — accepted" **sentinel**.
    - The direction of the oracle matters: the naive fix — skip the check for Horizon — would also pass a record that had quietly *lost* the field, so assert the sentinel is **present**. Additionally fail if any `TODO` marker survives anywhere in the file (that is what distinguishes a recorded position from an unresolved action), and fail if a `Horizon-LICENSE.txt` appears alongside the sentinel — Req 9 c11 forbids inventing or paraphrasing a substitute, so a file materialising where the record says none exists is a defect, not an improvement.
    - The four Req 9 c9 fields stay covered by the existing non-empty clause; the amendment does not weaken them.
    - **Validates: Requirements 9.2, 9.9, 9.11**

  - [ ] 24.3 Update `README.md` where it describes the footer, the credit, or the sync procedure
    - **Reword the Credits entry.** It currently reads "**Inspo:** [Massively](https://html5up.net/massively) by [HTML5 UP](https://html5up.net) | @ajlkn", which understates the obligation — the attribution is a **licence condition** under CC BY 3.0, not an acknowledgement of inspiration. Reword it as a design/template credit consistent with the footer wording from 22.2, keeping both links. **Do not remove it.**
    - **Add step 7 to the reproduced Compiled Stylesheet Sync Procedure** (Req 7 c5): apply the Copyright_Block markup to all nine pages, then verify the inner `<ul>…</ul>` is byte-identical across them — three pages write the div on one source line and six write it multi-line, so surrounding whitespace legitimately differs while the inner markup must not. Note that the new wording contains no ampersand and that no entity should be reintroduced.
    - Extend step 6's zero-occurrence confirmation to **`#4a5158`**, and add the §5.4 note that pill geometry is measured in a browser **before** it is mirrored, not after.
    - The existing note about `#footer` and `#copyright` each carrying `color` twice (the `color(alt)` mixin artifact) becomes load-bearing now that the `#copyright` colour changes — confirm it still reads correctly and states **last-declaration-wins**.
    - The Req 4 c4 missing-bold limitation note remains not required (Branch A was selected), and the typeface credits from Change Set 1 are unaffected.
    - _Requirements: 7.5, 9.3, 13.11_

- [ ] 25. Checkpoint — pre-push verification gate for Change Set 2
  - **Do not push to `main`.** `.github/workflows/static.yml` still deploys the whole repository to production on every push and there is no staging environment. Land Change Set 2 as **one revertible commit** on the current feature branch and open a PR; `git revert` of that commit restores the shipped Change Set 1 typography completely.
  - **This is the first change set to touch HTML** — all nine Content_Pages change inside `div#copyright`. That is why the design added **step 7 to the Compiled Stylesheet Sync Procedure**: steps 1–6 cover the stylesheet pair only. Work step 7 explicitly, and treat Property 16's byte-identity assertion as its authority.
  - Run `cd tools/typography-check && npm ci && npm test` (Checks A–F, plus the new **Check I**) against the working tree. All 16 properties and the integration checks must pass, including Property 15, which task 20.2 has now unblocked, and Property 4's 400/800 partition, which needs both halves of Requirement 11.
  - Confirm Property 1 passes with **exactly one** accepted exception reported as known-and-accepted (`#footer h3`, 4.05:1, conflict C2). The `#copyright` entry must be gone; a red Property 1 means a new regression outside the set, the footer `h3` ratio drifting, or an entry re-added without an owner decision.
  - Confirm zero occurrences of `#4a5158` in both artifacts as a link or underline colour, and zero occurrences of `Merriweather` and `Source Sans Pro`.
  - **Visual review at 320, 768, 1024 and 1440, in both font states — and this step carries Req 11 c7, the one criterion in the amendment that no property covers.** At 0.55rem and weight 800, no two adjacent glyph outlines may overlap or touch and every enclosed counter must stay open. That is a rendering judgement, not a bounding-box computation, so it is reviewed rather than asserted. Also confirm the Back to top control and the credit read correctly against the new `#b0b3b6`.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP.
- **Tasks 1–15 are Change Set 1, shipped and merged (commit `d49d8c5`, PR #1).** They are retained as history and marked complete; do not re-run them. Their notes below are kept because Change Set 2 depends on the decisions they record.
- **Change Set 1 notes, still true:** tasks 1.1 and 2.x gated everything else — 1.1 was a manual owner action and 2.1–2.3 converted design estimates into measured facts. Task 8.2 was skipped because task 2.1 selected Branch A (`PPTelegraf-Ultrabold.otf` at weight 800 ships), so no README missing-bold note was required. Property 5's expected failure closed once tasks 7.2 and 10.3 landed.
- **Change Set 2 has no acquisition gate and no unknowns.** The 800 face already ships and is already declared, so no font file is added and no `@font-face` rule changes (Req 11 c4). Sequencing is driven by file conflict and dependency instead.
- Every task that edits SASS mirrors the resolved values into `assets/css/main.css` in the same task. There is still no compiler, and `main.css` is what browsers execute.
- **Tasks 19 and 20 are one change and ship together.** Ultrabold widens labels 3.6%–8.5%; landing 19 alone ships a measured Req 12 c5 failure (risk R7).
- **Property 15 is expected to fail on the unmodified tree, in three places** (task 16.3). A pass there means the label box is being read from the element rect instead of a text-node `Range` — a broken checker, not good news.
- **Property 1's accepted-exceptions set now has exactly one member** — `#footer h3` at 4.05:1. The `#copyright` entry is removed because Req 14 fixes that shortfall rather than accepting it; leaving it would make the fix read as a failure.
- **Req 11 c7 belongs to visual review, not to any property.** Glyph collisions and closed counters at 0.55rem/800 are a rendering judgement; task 25 carries it.
- **The HTML5 UP credit is not removable under this spec.** CC BY 3.0 attaches attribution to adaptations, and HTML5 UP sells attribution-free usage separately through Pixelarity. Task 22.2 rewords it; Property 16 asserts its presence, wording and link target on all nine pages so a future removal fails a check (risk R8).

## Task Dependency Graph

Change Set 1's leaf tasks are complete and are omitted. The waves below cover the incomplete Change Set 2 leaves only. `assets/css/main.css` is written by every implementation task, so those tasks are necessarily serialised one per wave; test and harness tasks parallelise around them, and no two tasks in a wave write `verify.mjs` or `smoke.test.mjs`.

```json
{
  "waves": [
    { "id": 0, "tasks": ["16.1"] },
    { "id": 1, "tasks": ["16.2", "16.3"] },
    { "id": 2, "tasks": ["17.1"] },
    { "id": 3, "tasks": ["17.2", "18.1"] },
    { "id": 4, "tasks": ["18.2", "19.1"] },
    { "id": 5, "tasks": ["18.3"] },
    { "id": 6, "tasks": ["19.2", "20.1"] },
    { "id": 7, "tasks": ["19.3", "20.2"] },
    { "id": 8, "tasks": ["20.3"] },
    { "id": 9, "tasks": ["22.1", "22.2"] },
    { "id": 10, "tasks": ["22.3"] },
    { "id": 11, "tasks": ["22.4", "23.1"] },
    { "id": 12, "tasks": ["23.2", "24.1"] },
    { "id": 13, "tasks": ["24.2", "24.3"] }
  ]
}
```
