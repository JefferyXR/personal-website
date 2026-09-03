# Implementation Plan: portfolio-typography-refresh

## Overview

This plan now covers three change sets.

**Change Set 1 is implemented and merged to `main`** (commit `d49d8c5`, PR #1). Tasks 1–15 are its shipped history and are retained, marked complete, rather than deleted — the reasoning recorded in them (the intake gate, the branch selection, the `@font-face` insertion point, the seven Chrome_Text sites) is what Change Set 2 builds on.

**Change Set 2 is tasks 16–25, and it is shipped** (commits `4723384` and `fec1de6` on `spec/typography-refresh-change-set-2`). Seven follow-up changes, all declaration-level or markup-level: the email link goes darker, card titles centre, nav / buttons / pills go Ultrabold, the pill boxes are retuned to fit the heavier labels, the footer "Fonts & icons" line becomes a Back to top control with a reworded HTML5 UP design credit, the copyright bar becomes legible, and the Horizon licence-text `TODO` becomes a recorded accepted position. Tasks 16–25 are retained as history and marked complete; **task 22.1 is annotated rather than plainly ticked**, because part of what it shipped was removed again in `fec1de6` — see the note under it. Values, selectors and rationale are fixed in design §5.1–§5.7.

**Change Set 3 is tasks 26–31.** Three follow-up changes against the Change Set 2 tree, fixed in design §6.1–§6.3: the Copyright_Divider is centred by restructuring `#copyright ul` into a two-equal-halves flex row (§6.1), the Nav_Panel_Toggle and the Nav_Panel_Links move to Ultrabold to close the reparenting inconsistency Change Set 2 left open (§6.2), and `README.md` returns to a short credits file with the regeneration procedure relocated to a new `docs/stylesheet-sync.md` (§6.3). Values, selectors and rationale are fixed in the design; tasks reference them and do not re-derive them.

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

Four things shape the ordering of tasks 26–31:

1. **No page is edited, at all.** Change Set 3 is the first amendment since Change Set 1 that leaves all nine Content_Pages **byte-identical**: Req 15 c12 forbids touching the Copyright_Block markup, Req 16's two elements are script-injected or reparented rather than authored, and Req 17 c13 restricts change 3 to `README.md`, `docs/stylesheet-sync.md` and the workflow prune step. Property 8's page clause therefore tightens to whole-file identity for this change set, and the label substitution that Req 15 c4 needs is performed **at runtime in the page under test** rather than in markup (design §6.1, Testing Strategy).
2. **The divider mechanism and its `<=xsmall` revert are one change.** A flex container lays its items out in a row **regardless of their `display` value**, so landing the flex `ul` without the `<=xsmall` revert would stop the Stacked_Layout stacking and put two items side by side at 320px with a divider that should not exist (Req 15 c5, c6). Tasks 27.2 and 27.3 ship in the same commit for the same reason tasks 19 and 20 did.
3. **The divider position and the toggle geometry must be measured in a browser before the mechanism is accepted.** Design §6.1 and §6.2 label their tables *derived*, from the shipped font binaries and the declared CSS; Req 15 c14 and Req 16 c21 are discharged only by rendered numbers. Tasks 27.1 and 29.1 measure the unmodified tree first, 27.4 and 29.3 re-measure after the edit. The §6.1 record carries a **row height** column because a flex container generates no strut, and Req 15 c10 requires the pre- and post-change heights to be equal.
4. **Two of the three changes edit rules whose appearance must not move at all**, so the guards matter more than the edits. §6.1 restructures the rule that declares the divider without changing the `border-left` shorthand; §6.2 changes two `font-weight` declarations in a file that contains a third, unrelated `font-weight: 900` for a Font Awesome glyph. The harness work in task 26 comes before any edit for that reason.

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

- [x] 16. Prepare the verification harness for Change Set 2
  - [x] 16.1 Update the shared fixtures and helpers in `tools/typography-check/fixtures.mjs`
    - **Drop the `#copyright` entry from `ACCEPTED_CONTRAST_EXCEPTIONS`, leaving exactly one member** — `#footer h3` Heading_Text at **4.05:1** (conflict C2). Req 14 c7 requires this: the set pins each entry to a *measured* ratio and fails when that ratio drifts **in either direction**, so leaving the 2.27:1 `#copyright` entry in place while task 23 ships 7.33:1 would turn a successful fix into a red check. The footer `h3` entry stays — Req 14 c8 keeps conflict C2 resolved as previously decided.
    - Add a **label-box helper that reads a `Range` over the anchor's text node via `getClientRects()`**, returning one rect per rendered line. Properties 14 and 15 both depend on this and it is the single easiest thing to get wrong: the anchor *is* the pill, so measuring the element rect would compare the pill to itself and report every ratio as 1.000 — a vacuous pass (design Testing Strategy, Check D note).
    - Add a Playwright context helper for **`javaScriptEnabled: false`**, plus an `assets/js/*` abort variant for the partial-failure case. This is Check I's mechanism and it needs a separately configured context, which is why it cannot be folded into Check D.
    - Add role selectors for the Change Set 2 element groups: **Bold_Chrome_Text** (`#nav ul.links a`, `.button` including `.button.primary` / `.button.primary.small.fit`, `a.button.skills`), the two **Skills_Pill** geometries, the **Card_Header_Band** and Card_Heading, and the **Copyright_Block** with its two child links.
    - Extend Property 6's forbidden-token set with **`#4a5158`** as a link or underline colour (Req 1 c13 is a zero-occurrence rule), and widen its inline-style oracle from the five typography properties to also cover **`text-align`** and **`color`** on the nine pages (Req 10 c8, Req 14 c9). Keep the `style="--project-image: url(…)"` carve-out — a custom property is neither of the added names, so `index.html` must not produce seven false failures.
    - _Requirements: 1.13, 10.8, 14.7, 14.9_

  - [x] 16.2 Add the advance-width comparison to Check C (`fontTools`, no browser)
    - Run the design §5.4 Layer 1 script over `PPTelegraf-Regular.otf` and `PPTelegraf-Ultrabold.otf`: summed `hmtx` advances over `unitsPerEm` plus the declared `0.05em` tracking per character, for `PROJECTS`, `CAD GALLERY`, `READ MORE`, `VIEW MODEL`, `CSS`, `AUTODESK INVENTOR`, `WATERJET FABRICATION`.
    - Assert the measured 400→800 increase against the §5.3 table (+3.62% to +8.5%, clustering near +6.8%) and emit the rendered-width table at 320 / 768 / 1024 / 1440px using the declared root steps (13.33px, 14.67px, 14.67px, 16.00px). **This discharges Req 11 c16**, which asks for measured rather than assumed advance widths, and it is deterministic — no browser, no font loading window.
    - _Requirements: 11.16_

  - [x]* 16.3 Run Property 15 against the **unmodified** tree and record the baseline breaches
    - **Property 15: Every skills pill box fits its label, symmetrically and in ratio**
    - **This run is expected to FAIL, in three places at once**, and the failures are the evidence for §5.4: homepage width ratio **0.891–0.893** against the 0.88 ceiling (Req 12 c5); homepage vertical symmetry **≈8.1px** against the 1px tolerance (Req 12 c2), because `min-height: 1.7rem` exceeds the 19.12px content height and block layout drops all 8.08px of slack below the line box; and the wider-context height ratio **1.000** against the 0.85 ceiling with an **undefined** padding-to-gap ratio (Req 12 c4), because `line-height: 2.25rem` is a length set equal to `height: 2.25rem`.
    - **A Property 15 that passes here is a broken checker, not good news** — it means the label box is being read from the element rect rather than from a text-node `Range`. Verify the three expected failures appear before trusting any later pass.
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.10, 12.12, 12.13**

- [x] 17. Darken the footer email link to `#3a4148` (design §5.1)
  - [x] 17.1 Change the `alt.fg-link` token in `assets/sass/libs/_vars.scss`, mirroring into `assets/css/main.css`
    - `fg-link: #4a5158` → **`fg-link: #3a4148`**. One literal in the SASS source; Change Set 1 already routed all three declarations (`color`, default `border-bottom-color`, hover `border-bottom-color`) through `_palette(alt, fg-link)`, so the source delta is a single token.
    - Mirror **all three resolved literals** in `assets/css/main.css`. A partial replacement ships two different email colours across the site and fails Property 6 rather than being caught by eye.
    - **Req 1 c13 is a zero-occurrence rule, not a replacement rule.** After this task `#4a5158` must appear **nowhere** in the SASS source or the compiled CSS as a link or underline colour — including in explanatory comments in `layout/_footer.scss` that document a value the source no longer sets. Update those comments with the declaration so the source does not describe a superseded value.
    - The threshold in Req 1 c1 did **not** move: it is still ≥7.0:1 and `#4a5158` already cleared it at 7.38:1. `#3a4148` measures **9.49:1** on `#f5f5f5` and buys margin; this is not a failure being fixed, and recording that keeps a reader from misreading the amendment's intent.
    - Do not touch `alt.fg`, `alt.fg-bold`, the `<h3>Email</h3>` label, or the social icon links (Req 1 c11, Req 8 c7 — `alt.fg-link` remains the single changed palette value).
    - _Requirements: 1.1, 1.2, 1.7, 1.12, 1.13, 7.1, 7.2, 8.7_

  - [x]* 17.2 Extend the zero-occurrence and literal checks for the new value
    - **Property 6: No forbidden token, no off-origin font, no inline typography** — assert zero occurrences of `#4a5158` in both artifacts as a link or underline colour.
    - Update the Change Set 1 unit assertion in `smoke.test.mjs` from the literal `#4a5158` to **`#3a4148`** as the `alt.fg-link` value.
    - Re-run **Property 1** so its footer-email rows re-measure at 9.49:1 (default text and underline) and confirm the relative-luminance clause against `#717981` is still checked directly rather than inferred.
    - **Validates: Requirements 1.1, 1.2, 1.7, 1.12, 1.13, 7.9**

- [x] 18. Centre the project card titles (design §5.2)
  - [x] 18.1 Change `text-align` on the Card_Header_Band in `assets/sass/layout/_main.scss`, mirroring into `assets/css/main.css`
    - **Edit the existing `text-align: left` at line 358** (`body.home #main .posts > article > header`) to `text-align: center`. One token; the declaration count stays identical in both artifacts.
    - **Do NOT add `text-align` to the card `h2`.** That would leave the source saying "this band is left-aligned and its only child is centred" — a contradiction that invites a future editor to tidy one of the two and silently undo the change. Leaving the `h2` rule untouched is also the cheapest guarantee of Req 10 c4 (`font-size: 1.1rem`, `text-transform: none`, `line-height`, `color`) and Req 10 c5 (`h2 > a { color: inherit }`, no separate colour).
    - **Do NOT touch the two other `text-align: left` declarations at lines 179 and 444.** `_main.scss` contains exactly three; 179 and 444 are card *description* paragraph rules (both `font-size: 0.85rem`) where left alignment is a deliberate prose-readability choice (Req 10 c7). No global find-and-replace of `left` → `center` in either artifact.
    - Multi-line titles need no extra work and this is the load-bearing detail: `text-align` applies per **line box**, so the explicit `<br />` in "KillerByte / Full-body Spinner Battlebot" and any 320px auto-wrap centre independently (Req 10 c2, c3). **Do not use flex or grid centring** — `justify-content: center` would centre the `h2` *box* as one unit and leave its internal lines left-ragged, passing c1 while failing c2 and c3.
    - Req 10 c9 holds trivially: `text-align` moves inline content within the line box and changes no box dimension, so the band's `background-color: #12263a`, `padding: 0.85rem 1rem`, card heights and grid alignment are all unaffected.
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 7.1, 7.2_

  - [x]* 18.2 Write property test for per-line card title centring
    - **Property 14: Every card title line is centred in its band**
    - Quantify over **rendered lines**, not headings: a check on the heading's own bounding box would pass for a flex-centred `h2` whose lines were still left-ragged, which is the exact mistake §5.2 rejects. Lines come from the `Range`/`getClientRects()` helper added in 16.1.
    - **Pin the `<br />` card as a required case** alongside the sampled ones — "KillerByte / Full-body Spinner Battlebot" is the only heading that breaks at every viewport, so a uniformly sampling generator could miss it.
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x]* 18.3 Extend Property 8's baseline set for the centring scope
    - **Property 8: Everything outside the intended delta is byte-identical to the baseline**
    - Move the Card_Header_Band `text-align` value **out** of the baseline set (it is now an intended change) and add: the `text-align` resolution of every other element, naming `_main.scss:179` and `:444` specifically (Req 10 c7); the band's `background-color: #12263a`, `padding: 0.85rem 1rem` and box dimensions (Req 10 c9); and the Card_Heading's `font-size: 1.1rem`, `text-transform: none`, `line-height` and `color`, plus the **absence** of any `color` declaration on `h2 > a` (Req 10 c4, c5).
    - Add the unit assertions from the design Testing Strategy: the band declares `text-align: center` while lines 179 and 444 still declare `left`.
    - **Validates: Requirements 10.4, 10.5, 10.7, 10.9**

- [x] 19. Move nav, buttons and pills to Ultrabold (design §5.3)
  - [x] 19.1 Change the two `font-weight` declarations, mirroring both into `assets/css/main.css`
    - `assets/sass/layout/_nav.scss:34` (`ul.links`): `_font(weight)` → **`_font(weight-bold)`**.
    - `assets/sass/components/_button.scss:26` (the base `.button` rule): `_font(weight)` → **`_font(weight-bold)`**.
    - **Two declarations cover all three element groups, which is exactly what Req 11 c3 requires.** The base `.button` rule reaches Read More (`.button`), View Model (`.button.primary`, `.button.primary.small`, `.button.primary.small.fit`) **and** the skills pills, because `body.home #main .button.skills` declares no `font-weight` of its own and inherits. Do not add a third declaration to the pill rule — a per-rule literal weight would also breach Req 11 c2, which requires the weight to resolve through the `$font` map.
    - **No new font file and no `@font-face` change** (Req 11 c4). `PPTelegraf-Ultrabold.otf` already ships at `usWeightClass` 800 and is already declared at `font-weight: 800` under the `PP Telegraf` family, because Change Set 1 needed it for `<strong>`. The bundle stays at **103,324 bytes, 17% of the 600 KB budget**. Req 11 c6 follows: 800 is a shipped weight, so nothing is synthesized or interpolated.
    - **Change nothing else in either rule.** Family stays `_font(family)` (Req 11 c5); `letter-spacing` stays `_font(letter-spacing-heading)` = `0.05em`, which Req 11 c8 now makes a **floor** rather than a free parameter — the tracking-reduction lever §3.5 used to buy width is gone, so any width shortfall is absorbed by the box in task 20, never by tighter tracking. `text-transform`, `background-color`, `border`, `border-radius`, default and hover colours and transition timing are untouched (Req 11 c13), so Req 11 c14 inherits Change Set 1's contrast measurements (12.18:1 worst case).
    - **Verify for clipping and overflow in all three groups**, since Ultrabold measures **+3.6% to +8.5% wider** than Regular at an unchanged font size (§5.3, clustering ~+6.8%): the nav bar (`PROJECTS` + `CAD GALLERY` grow 159.7px → 169.5px at 1440px inside a 1312px flex row with grow/shrink), the buttons (`inline-block`, `width: auto`, so the box sizes to its label — the exposure is actions-row reflow, not clipping; retain `white-space: nowrap` per Req 11 c11), and the pills (**the binding case, and it does fail** — 124.0px at 1440px puts the width ratio at 0.893 against the 0.88 ceiling).
    - **Req 11 c12 fixes the remedy in advance** for anything that will not fit: enlarge the element or its padding. Never reduce `font-size` below the Req 5 c3 floor, never revert to weight 400, never apply `text-overflow` truncation.
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.8, 11.9, 11.10, 11.11, 11.12, 11.13, 11.15, 5.2, 7.1, 7.2_

  - [x]* 19.2 Extend Property 4's weight clause into a 400/800 partition
    - **Property 4: Every element resolves to the token model**
    - Refine "a member of the shipped-face weight set" into a **partition** over Chrome_Text: every Bold_Chrome_Text element (`#nav ul.links` anchors, every `.button` label including the View Model variants, every `a.button.skills`) computes to exactly **800**; every other Chrome_Text element (form labels, pagination links, table headers, nav-panel links, Copyright_Block) computes to exactly **400** (Req 11 c15). Both must be members of the shipped set `{400, 800}`.
    - This is why Requirement 11 gets no property of its own, and why the partition is worth the refinement: **the two halves fail each other's mistakes.** Bolding too much trips the 400 clause; bolding too little trips the 800 clause; either way fast-check's shrink output names the element. Keep the family clause, so a weight edit that accidentally alters the family also fails here (Req 11 c5).
    - Add the unit assertions: both `_nav.scss:34` and `_button.scss:26` declare `_font(weight-bold)`.
    - **This property passes only once both halves of Requirement 11 land** — an incomplete edit fails asymmetrically and diagnostically.
    - **Validates: Requirements 11.1, 11.2, 11.5, 11.6, 11.8, 11.15, 5.2**

  - [x]* 19.3 Extend Property 5's containment clause to the bold groups
    - **Property 5: Nothing overflows, in either font state**
    - Name the Bold_Chrome_Text groups explicitly, all measured at weight 800: every `.button` and Skills_Pill label lies wholly inside its element's box with no clipped character and **no `text-overflow` ellipsis applied**; `Read More` and `View Model` each occupy exactly one line inside their button's padding box (Req 11 c11); `Projects` and `CAD Gallery` each occupy one line inside the `#nav` content box with no two nav links overlapping (Req 11 c10).
    - Worth checking rather than reasoning about, because the §5.3 arithmetic models neither the nav's logo and right-hand icon group nor the actions row's wrap behaviour.
    - **Req 11 c7 is deliberately NOT in this property.** Overlapping glyph outlines and filled counters at 0.55rem/800 are a rendering judgement, not a bounding-box computation; they belong to the visual-review step in task 25.
    - **Validates: Requirements 11.9, 11.10, 11.11, 12.8, 5.4, 5.7**

- [x] 20. Retune the skills pill geometry for the heavier labels (design §5.4) — depends on task 19
  - [x] 20.1 Run the Layer 2 browser measurement and record the rendered numbers
    - Playwright, headless Chromium, **with the real fonts confirmed loaded** via `document.fonts.check('0.55rem "PP Telegraf"')` before any measurement — a measurement taken during the `font-display: swap` fallback window measures Helvetica, not Telegraf.
    - For each of 9 pages × 4 viewports {320, 768, 1024, 1440} and every `a.button.skills`: read the pill's `getBoundingClientRect()` with its resolved `padding`, `border-width` and `min-height`; read the **label** box from the `Range`/`getClientRects()` helper (16.1); derive the four gaps, the c5/c6 ratios and the c4 padding-to-gap ratio; assert pill-to-pill non-overlap and card containment (c12).
    - **Record the narrowest and widest label of each geometry** — `C++` / `WATERJET FABRICATION` homepage, `C++` / `WATERJET FABRICATION` wider-context — with measured label box, measured pill border box, and the resulting ratios, at all four viewports. **This is what discharges Req 12 c13**; §5.4's numbers are derived from font metrics and declared CSS and are explicitly *not yet browser-measured*.
    - Layer 2 is the authority. Where it disagrees with §5.4's arithmetic, Layer 2 wins — subpixel rounding, hinting and the `skills-box` flex gap all sit outside the arithmetic.
    - _Requirements: 12.13, 12.1, 12.2, 12.3, 12.12_

  - [x] 20.2 Apply the two geometry blocks in `assets/sass/layout/_main.scss`, mirroring into `assets/css/main.css`, then re-measure
    - **Homepage geometry** (`body.home #main .button.skills`, ~line 486), per §5.4: `padding: 0.2rem 0.55rem` (was `0.15rem 0.4rem`), `min-height: 1.35rem` (was `1.7rem`), `display: inline-flex` with `align-items: center` and `justify-content: center`. `font-size: 0.55rem`, `line-height: 1.4`, `white-space: normal` and `height: auto` are **unchanged** (Req 12 c8, c11).
    - **Wider-context geometry** (`.button.skills, .actions .button`, ~lines 195–201): **`line-height: 1.4` only** — was `2.25rem`, a *length* set equal to `height`. `height: 2.25rem` and `padding: 0 1rem` are deliberately left alone so the Read More and View Model boxes do not change size.
    - Each number answers a specific breach: horizontal padding `0.55rem` puts the widest label at a **0.864** width ratio (the 0.88 ceiling needs ≥0.466rem at 1440px; `0.5rem` would pass at 0.873 with only 0.007 of headroom that rounding could erase); vertical padding `0.2rem` is forced by Req 12 c4, since `0.15rem` against `0.55rem` horizontal exceeds the 3.5× ceiling and is **out of bounds by itself**; `min-height: 1.35rem` clears the Req 12 c7 floor whose worst case is **1.320rem at 320px** (the 2px border is absolute, so it is a larger fraction of a smaller root); and `line-height: 1.4` in the wider context converts a length into a ratio, dropping the height ratio from **1.000 → 0.436** and turning a zero vertical gap into 10.16px, which puts the 1rem horizontal padding at **1.57×** it.
    - `display: inline-flex` with `align-items: center` is the belt to `min-height`'s braces: ~0.88px of residual slack at 1440px would all fall below the text under block layout, and flex centring splits it to ~0.44px per side, inside the 1px tolerance of Req 12 c2 **structurally** rather than by arithmetic coincidence. Multi-line wrapping survives — the text becomes a single anonymous flex item that still wraps under `white-space: normal` (Req 12 c8, Req 5 c7).
    - **Then re-run 20.1's measurement and adjust if any Requirement 12 bound is missed** (Req 12 c11). The two thinnest predicted margins are the wider-context height ratio (0.436) and its narrowest width ratio (0.424), both against a 0.40 floor; §5.4's recorded fallback is `height: 2.1rem` with `padding: 0 0.9rem`, computing to 0.467 and 0.450–0.846. Adjust padding, `min-height` or `line-height` only: never reduce `font-size` below the Req 5 c3 floor, never reintroduce `white-space: nowrap`, never reintroduce a fixed `height` on the homepage geometry.
    - Req 12 c9 holds throughout: `border-radius: 999px`, `background-color`, border colour and width, and label colour are untouched in both geometries. This corrects fit, not appearance.
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11, 12.12, 7.1, 7.2_

  - [x]* 20.3 Write property test for pill box fit
    - **Property 15: Every skills pill box fits its label, symmetrically and in ratio**
    - Treat the two geometries as a **generator dimension**, not two properties — the oracle is identical and only the declared `font-size` and the effective-vertical-gap definition differ.
    - Generate **over-long labels** to exercise the multi-line clause (Req 12 c6): current content reaches exactly 20 characters and no label wraps at these sizes, so real content never reaches that path. Predicted two-line homepage ratio is 0.737 against the 0.90 ceiling.
    - The label box must come from the text-node `Range`, never the anchor rect — see 16.3.
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.10, 12.12, 12.13**

- [x] 21. Checkpoint — the coupled bold-and-geometry change is whole
  - Requirements 11 and 12 must be verified **together**: landing 19 without 20 ships a measured Req 12 c5 failure (risk R7). Confirm Property 15 now passes at all four viewports, that its three baseline breaches from 16.3 are gone, and that Property 4's partition and Property 5's containment arm both pass.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Replace the footer line with a Back to top control and a reworded design credit (design §5.5)
  - [x] 22.1 **[SHIPPED, THEN PARTLY REVERSED — read this before treating it as history]** Add the two supporting `#copyright` CSS declarations, mirroring each into `assets/css/main.css`
    - **What actually happened, recorded because the tick alone would misrepresent it.** This task shipped in `4723384` with **three** things, not two: the `a { cursor: pointer }` rule, the `a:focus-visible` ring, **and** `html { scroll-behavior: smooth }` with a `@media (prefers-reduced-motion: reduce)` arm. The third was removed again in `fec1de6` ("Fix ~1s scroll lag") after Check J measured **1056 ms** to first movement on the intro down-arrow. The task text below was rewritten *after* the reversal, so it now reads as though the smooth-scroll block was never added — it was, it shipped, and it was taken out. **The net delta of this task on the tree is the two `#copyright` declarations plus the two DO-NOT-REINTRODUCE comments at `assets/sass/base/_page.scss:31–41` and `assets/css/main.css:145–155`.** Nothing else survives from it. The reversal is why task 22.5 (Check J) exists at all, and the surviving comments are what Change Set 3 must not disturb: they sit at the exact line where someone would re-add the declaration.
    - In `assets/sass/layout/_footer.scss`, inside the `#copyright` rule: `a { cursor: pointer; }` overriding the block's `cursor: default` on static text (Req 13 c17), and `a:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }` (Req 13 c9). `outline` rather than a border, so the ring spans the full text box and alters no layout; `currentColor` rather than a literal, so the ring tracks the block colour task 23 sets and the two rules cannot drift apart; `:focus-visible` keeps the ring off pointer clicks.
    - **Do NOT add `html { scroll-behavior: smooth; }`, and do not add a `@media (prefers-reduced-motion: reduce)` arm.** An earlier version of this task added both, on the reasoning that `scrolly` calls `preventDefault()` so no native scroll competes with jQuery's animation. **That reasoning is wrong and it shipped a regression.** `preventDefault()` suppresses the native *fragment navigation*; it does nothing about `scroll-behavior` applying to jQuery's own *programmatic* `scrollTop` writes. `assets/js/jquery.scrolly.min.js` animates with `parent.stop().animate({scrollTop: t}, 1000, 'swing')` on `$("body,html")`, so jQuery writes `scrollTop` once per frame and **each of those ~60 writes starts its own smooth scroll** — nothing moves until the 1000 ms animation's final write sticks. Measured at 1440 px: first movement **1056 ms** with `smooth` against **32–50 ms** with `auto` on the intro down-arrow; the footer control itself went from reaching 0 at 882 ms to 18–23 ms. With no CSS smooth scroll there is no unrequested motion left to suppress, so the reduced-motion arm is not added either.
    - The smooth-scroll block was always **optional to the requirement** — Req 13 c2 asks only that the top of the document be brought into the viewport — and **that fallback is taken**: the instant fragment jump satisfies c2, c3 and c5 in full (design §5.5).
    - **Leave a comment where someone would re-add it**, in both `assets/sass/base/_page.scss` and `assets/css/main.css`, stating the jQuery interference mechanism and the measured figures. Delete the `preventDefault()` reasoning rather than rewording it, so a future reader cannot reconstruct it. Task 22.5's Check J and a static zero-occurrence assertion (`scroll-behavior`, `prefers-reduced-motion`, scanned with comments stripped) are the guards.
    - _Requirements: 13.9, 13.17, 13.2, 7.1, 7.2_

  - [x] 22.2 Replace the `#copyright` list content on **all nine** Content_Pages
    - Replace `<ul><li>Fonts &amp; icons: <a href="https://html5up.net">HTML5 UP</a></li></ul>` with:
      `<ul><li><a href="#top">Back to top</a></li><li>Design: <a href="https://html5up.net">HTML5 UP</a></li></ul>`
    - **Two `<li>` elements, matching Req 13 c12's two-separate-elements rule.** No CSS work is needed: `#copyright ul li` are already `inline-block` with `border-left: solid 2px` and `:first-child { border-left: 0 }`, so the second item picks up the template's divider, and the existing `<=xsmall` breakpoint already stacks them.
    - **`href="#top"`, not `#wrapper`** (Req 13 c4 permits either; §5.5 chooses `#top`). The HTML standard defines the `top` fragment as the top of the document when no element carries that ID, so the link cannot be broken by a markup change; `#wrapper` depends on an element continuing to exist and scrolls to that element's box rather than the document origin. `#wrapper` is the recorded fallback if a target browser is found not to honour the special case — a one-token change per page.
    - **No `class="scrolly"`.** Req 13 c5 requires the control to work with scripting disabled, and a native `<a href="#top">` does so because fragment navigation is browser behaviour. Scrolly would *technically* degrade correctly, but it would make the control's intended behaviour depend on jQuery, three script files and a plugin for nothing but easing. There is no easing: 22.1 records that the CSS smooth-scroll block is not added, and the instant jump satisfies Req 13 c2. No `href="#"`, no `javascript:` URL, no script-only handler (Req 13 c6).
    - Accessibility falls out of using a real anchor: the visible text `Back to top` **is** the accessible name, so **no `aria-label`** is added — a redundant label risks diverging from the visible text (Req 13 c7). A native `<a href>` is in the tab order by default, and no `tabindex` is declared on it or any ancestor (Req 13 c8). Enter on a focused anchor performs the same navigation as a click, so no `keydown` handler (Req 13 c3).
    - **The HTML5 UP credit is retained, and reworded** (Req 13 c10, c11). It stays because the [HTML5 UP licence](https://html5up.net/license) places the templates under **Creative Commons Attribution 3.0** with credit for the design given in exchange, and attribution-free usage is sold separately through Pixelarity — so the credit is the price of the free tier, not a courtesy; because CC BY 3.0 attaches attribution to **adaptations**, not only verbatim copies, so divergence from the demo does not discharge it; and because the repository is still substantially template-derived (24 files under `assets/sass/` carry the Massively header, six template JS files ship, and `#wrapper` / `is-preload` / `split contact` / `icons` / `actions` are on all nine pages). What changes is the **wording**: "Fonts & icons" is now simply inaccurate — the fonts are Horizon and PP Telegraf — so it becomes a design credit. Removing the credit is not available under this spec; the supported route is a Pixelarity licence, which is a purchase decision outside it.
    - **Respect each page's existing line layout while emitting identical inner markup** (Req 13 c13). Six pages write `#copyright` across multiple source lines; **`killerbyte.html`, `launchtoy.html` and `vexlego.html` write the whole div on one source line** — edit in place rather than reformatting.
    - **Verification point: all nine pages become byte-identical inside the `<ul>`.** `vexlego.html` currently writes `&amp;` where the other eight write a bare `&`; the new wording contains **no ampersand at all**, so that divergence retires and Req 13 c14's escaping rule is satisfied vacuously rather than by nine careful edits. **Do not reintroduce an entity.** Diff the nine `<ul>` strings against each other as the completion check for this task.
    - Req 13 c15 holds untouched: the Copyright_Block keeps `PP Telegraf`, `0.8rem`, uppercase, its declared letter-spacing, `1.5` line-height and centred alignment. Req 8 c5 is satisfied because the exemption covers the block's inner content only — the block itself and its position in the footer are unchanged, and no element outside it is added or removed.
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.10, 13.11, 13.12, 13.13, 13.14, 13.15, 13.16, 8.5_

  - [x]* 22.3 Write property test for the control, including the no-JavaScript arm (Check I)
    - **Property 16: The Back to top control works without scripting, from the keyboard, on every page**
    - Assert exactly one Back_To_Top_Control and exactly one Design_Credit as **two separate elements** with byte-identical inner markup and identical text across all nine pages; the control is an `<a>` whose `href` is a same-document fragment that is neither `#` nor a `javascript:` URL, with a non-empty accessible name and no positive `tabindex` on it or any ancestor; the Design_Credit names HTML5 UP, links to `https://html5up.net`, and its text references **neither fonts nor icons**.
    - **Check I is a separate check because it needs a separately configured context**, not a different generator: `javaScriptEnabled: false` for the whole context, which cannot be mixed into a run that also exercises the card-interaction paths. Add the `assets/js/*` abort variant for the partial-failure case. Oracle for "brings the top into the viewport": `window.scrollY === 0` after pointer and after keyboard activation, with an unchanged `document.URL` pathname — which is what distinguishes a working fragment jump from a navigation to a different document.
    - Two clauses are stricter than they look and both are deliberate: byte-identical inner markup is what stops the nine pages drifting (per-page hand editing has already produced divergence once), and the two-separate-elements clause is what stops a single anchor doing both jobs from passing a naive "control exists" plus "credit exists" pair of checks while making the credit unclickable or the control an external link.
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.10, 13.11, 13.12, 13.13, 13.14**

  - [x]* 22.4 Extend Property 10 for the two new links
    - **Property 10: Focus and hover states behave as declared** — the focus-indicator clause (≥2 CSS pixels, spanning at least the full width of the text, retained under simultaneous hover) now also holds for the Back_To_Top_Control and the Design_Credit link, and while the pointer is over either the computed `cursor` is `pointer` rather than the block's `default` (Req 13 c17). The indicator's *contrast* stays Property 1's business.
    - **Validates: Requirements 13.9, 13.17**

  - [x]* 22.5 Add Check J — scroll latency of the two same-document scroll controls
    - **Why this exists: a verification gap, and it is the real lesson of 22.1.** The Check F extension this task replaces asserted the intro arrow's **final position** (`landedNear: true`, y 900) and a clean console. A scroll that did not begin for a full second satisfied both, so a plainly broken interaction passed verification. Generalised: **an assertion about a final state cannot detect a latency defect, so any interaction whose value depends on *when* it happens needs a timing clause.**
    - Implement at `tools/typography-check/scroll-latency.test.mjs`, and mirror it in the `verify.mjs` runner where the Check F extension used to sit (Check F keeps the water canvas, card interactions and console clauses, and drops the `scroll-behavior` clause). Click each of the two controls — `#intro .actions a.scrolly` (jQuery-animated) and the `#copyright` Back_To_Top_Control (native fragment navigation) — sample `window.scrollY` on a **16 ms** timer, and assert **first observable movement within a 150 ms budget** plus the correct final position (`#main` within 80 px; y 0). Measure **both** controls: the declaration broke only the jQuery one, so the footer control alone would have missed it.
    - **Integration, one run per control — not a property.** The oracle is a wall-clock bound on a fixed interaction, so extra fast-check iterations would add runtime and jitter without widening the input space.
    - **Sample from the Node side.** `page.waitForFunction` polls on `requestAnimationFrame`, which is throttled in these headless contexts, so an in-page poller reports late or never — and here the quantity under test *is* the timing, so a throttled sampler would manufacture the defect it is meant to detect.
    - Add the static companion guard in `smoke.test.mjs`: zero `scroll-behavior` and zero `prefers-reduced-motion` occurrences in `assets/css/main.css` and `assets/sass/base/_page.scss` with comments stripped, the `html` rule keeping `box-sizing: border-box`, and the measured figures still present in the surviving comment.
    - _Requirements: 13.2, 8.6_

- [x] 23. Make the copyright bar legible (design §5.6)
  - [x] 23.1 Raise the `#copyright` text alpha in `assets/sass/layout/_footer.scss:227`, mirroring into `assets/css/main.css`
    - `color: transparentize(_palette(invert, fg), 0.75)` → **`transparentize(_palette(invert, fg), 0.35)`**. `transparentize` *subtracts* its amount from the alpha, so target alpha **0.65** is written as `0.35`. The compiled mirror is `rgba(255, 255, 255, 0.65)`, which composites to **`#b0b3b6`** and measures **7.33:1** against `#1e252d`.
    - **Only the `transparentize` amount changes.** `invert.fg` stays `#ffffff`, the Copyright_Block background stays `#1e252d`, and no other rule resolving through the `invert` palette is touched — so Req 8 c7 continues to hold with `alt.fg-link` as the single changed palette value (Req 14 c4, c5).
    - **Cover all four states and confirm each clears 4.5:1** (Req 14 c1–c3): static text, Back_To_Top_Control and Design_Credit defaults all inherit `#b0b3b6` at **7.33:1** through the existing `#copyright a { color: inherit }` rule, so one declaration carries three rows; hover / active resolves to the `invert` accent `#18bfef` at **7.17:1**; focus keeps `#b0b3b6` text plus the 2px `currentColor` ring from 22.1 (≥3.0:1 required, 7.33:1 delivered).
    - **Why 0.65 and not 0.50, when Req 14 c1 asks only for 4.5:1:** the deciding factor is the hover state. At alpha 0.50 the default measures 4.94:1 against a 7.17:1 hover — **+45%**, so the control would look conspicuously weaker than its own hover, an odd signal for something that should be discoverable *before* being hovered. At 0.65 the two sit within **2%** of each other. Both alphas satisfy c1–c3; 0.65 is chosen for state consistency, and that is the rationale Req 14 c6 asks to be recorded.
    - The earlier "alpha ~0.65 → ≈4.6:1" pairing was unreconciled: 0.65 gives 7.33:1 and ≈4.9:1 falls near alpha 0.50. Use the measured pairing, and do not carry the old one forward into any comment.
    - **Leave the footer `h3` (4.05:1) and the social icon links alone** (Req 14 c8, Req 1 c11) — conflict C2 stands as decided; the Req 1 c11 exemption reaches the Copyright_Block and nothing else.
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.8, 14.9, 7.1, 7.2_

  - [x]* 23.2 Re-run Property 1 with the reduced exceptions set
    - **Property 1: Every declared colour pair meets its contrast threshold**
    - The Copyright_Block, the Back_To_Top_Control and the Design_Credit link are now checked against the ordinary **≥4.5:1** Chrome_Text threshold in default, hover, focus and active states, like any other tuple — the `#copyright` accepted-exception entry was removed in 16.1 and must not reappear. Confirm the alpha-compositing path measures `rgba(255,255,255,0.65)` as `#b0b3b6`, not as opaque white.
    - Confirm the run still reports the single remaining entry (`#footer h3`, 4.05:1, conflict C2) as **known-and-accepted** with its conflict ID, and that adding an entry remains an owner scope decision rather than a test fix.
    - Add the unit assertion: `#copyright` declares `transparentize(_palette(invert, fg), 0.35)` and resolves to `rgba(255, 255, 255, 0.65)`.
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.7, 5.6**

- [x] 24. Update the provenance record and the README
  - [x] 24.1 Replace the Horizon `TODO` block in `assets/webfonts/FONT-PROVENANCE.md` with the recorded accepted position
    - Change the `licence_text_file` field in the `## Horizon.woff2` record from `*none — see TODO below*` to **`*none — accepted, see note*`**. Req 9 c11 requires a **sentinel value**, not an empty cell, so that "recorded as absent" stays distinguishable from "forgotten".
    - Delete the `**TODO (owner):**` block that instructs the owner to save `Horizon-LICENSE.txt`, and replace it with the §5.7 statement: no vendor licence or EULA text for Horizon could be located from the designer's own channels; Req 9 c2 no longer requires a stored file for Heading_Font; Req 9 c9 substitutes a recorded-fields obligation met by the four fields already present (tier *free for personal use*, designer *Alberto Fontense*, source URL, download date); **this is a closed decision, not an outstanding action.**
    - State plainly that the **obligation is unchanged**: Horizon's free-personal-use terms bind the Site whether or not a copy is stored, so Req 9 c4 and c5's Non_Commercial_Use constraint applies exactly as before. **Invent no substitute licence file**, and paraphrase rather than reproduce the designer's terms (Req 9 c11).
    - No font file, no stylesheet and no page changes in this task — the four recorded fields are already non-empty, so this is a note edit rather than a data-gathering exercise.
    - _Requirements: 9.2, 9.9, 9.11_

  - [x]* 24.2 Split Property 11's licence-text clause per family
    - **Property 11: Every font file is provably the vendor's, from the vendor**
    - Resolve `licence_text_file` **per family**: for Body_Font it must name a file present under `assets/webfonts/` (`EULA-PangramPangram-FreeForPersonalUse-MAY2021.pdf` does ship); for Heading_Font it must carry the "none — accepted" **sentinel**.
    - The direction of the oracle matters: the naive fix — skip the check for Horizon — would also pass a record that had quietly *lost* the field, so assert the sentinel is **present**. Additionally fail if any `TODO` marker survives anywhere in the file (that is what distinguishes a recorded position from an unresolved action), and fail if a `Horizon-LICENSE.txt` appears alongside the sentinel — Req 9 c11 forbids inventing or paraphrasing a substitute, so a file materialising where the record says none exists is a defect, not an improvement.
    - The four Req 9 c9 fields stay covered by the existing non-empty clause; the amendment does not weaken them.
    - **Validates: Requirements 9.2, 9.9, 9.11**

  - [x] 24.3 Update `README.md` where it describes the footer, the credit, or the sync procedure
    - **Reword the Credits entry.** It currently reads "**Inspo:** [Massively](https://html5up.net/massively) by [HTML5 UP](https://html5up.net) | @ajlkn", which understates the obligation — the attribution is a **licence condition** under CC BY 3.0, not an acknowledgement of inspiration. Reword it as a design/template credit consistent with the footer wording from 22.2, keeping both links. **Do not remove it.**
    - **Add step 7 to the reproduced Compiled Stylesheet Sync Procedure** (Req 7 c5): apply the Copyright_Block markup to all nine pages, then verify the inner `<ul>…</ul>` is byte-identical across them — three pages write the div on one source line and six write it multi-line, so surrounding whitespace legitimately differs while the inner markup must not. Note that the new wording contains no ampersand and that no entity should be reintroduced.
    - Extend step 6's zero-occurrence confirmation to **`#4a5158`**, and add the §5.4 note that pill geometry is measured in a browser **before** it is mirrored, not after.
    - The existing note about `#footer` and `#copyright` each carrying `color` twice (the `color(alt)` mixin artifact) becomes load-bearing now that the `#copyright` colour changes — confirm it still reads correctly and states **last-declaration-wins**.
    - The Req 4 c4 missing-bold limitation note remains not required (Branch A was selected), and the typeface credits from Change Set 1 are unaffected.
    - _Requirements: 7.5, 9.3, 13.11_

- [x] 25. Checkpoint — pre-push verification gate for Change Set 2
  - **Do not push to `main`.** `.github/workflows/static.yml` still deploys the whole repository to production on every push and there is no staging environment. Land Change Set 2 as **one revertible commit** on the current feature branch and open a PR; `git revert` of that commit restores the shipped Change Set 1 typography completely.
  - **This is the first change set to touch HTML** — all nine Content_Pages change inside `div#copyright`. That is why the design added **step 7 to the Compiled Stylesheet Sync Procedure**: steps 1–6 cover the stylesheet pair only. Work step 7 explicitly, and treat Property 16's byte-identity assertion as its authority.
  - Run `cd tools/typography-check && npm ci && npm test` (Checks A–F, plus the new **Check I** and **Check J**) against the working tree. All 16 properties and the integration checks must pass, including Property 15, which task 20.2 has now unblocked, and Property 4's 400/800 partition, which needs both halves of Requirement 11.
  - **Read Check J's reported numbers, not just its exit status.** Both scroll controls must report first movement inside the 150 ms budget — 18–50 ms is the expected range with no CSS smooth scroll. A four-figure first-movement time means `scroll-behavior` is back; the final positions will still be correct, which is exactly why the budget clause exists (task 22.5).
  - Confirm Property 1 passes with **exactly one** accepted exception reported as known-and-accepted (`#footer h3`, 4.05:1, conflict C2). The `#copyright` entry must be gone; a red Property 1 means a new regression outside the set, the footer `h3` ratio drifting, or an entry re-added without an owner decision.
  - Confirm zero occurrences of `#4a5158` in both artifacts as a link or underline colour, zero occurrences of `Merriweather` and `Source Sans Pro`, and zero **declarations** of `scroll-behavior` or `prefers-reduced-motion` in either artifact (comments stripped before the scan — the surviving comment names the property deliberately).
  - **Visual review at 320, 768, 1024 and 1440, in both font states — and this step carries Req 11 c7, the one criterion in the amendment that no property covers.** At 0.55rem and weight 800, no two adjacent glyph outlines may overlap or touch and every enclosed counter must stay open. That is a rendering judgement, not a bounding-box computation, so it is reviewed rather than asserted. Also confirm the Back to top control and the credit read correctly against the new `#b0b3b6`.
  - Ensure all tests pass, ask the user if questions arise.

---

**Change Set 3 — the three follow-up changes (tasks 26–31). All against the Change Set 2 tree. No Content_Page is edited by any task below.**

- [ ] 26. Prepare the verification harness for Change Set 3
  - [ ] 26.1 Extend the shared fixtures and helpers in `tools/typography-check/fixtures.mjs`
    - **Add the runtime label-substitution helper — this is the one new capability the change set needs.** It replaces the two Copyright_Item labels **in the page under test**: the Back_To_Top_Control anchor's text for the first item, and the second item's leading text node plus its `HTML5 UP` anchor for the second. **Never by editing the nine pages** — Req 15 c12 and Req 17 c13 both forbid page edits, a substitution baked into markup would have to be reverted before push (a manual step Property 8's byte-identity clause catches only if someone remembers to run it), and the matrix is nine pages × three viewports × four pairs, which is three lines at runtime and a combinatorial mess in markup. A runtime assignment also tests the *mechanism* rather than a document: it changes only the text layout consumes, which is exactly the variable Req 15 c4 quantifies over.
    - **The trap is measuring before layout settles.** `element.textContent = …` does not force a synchronous reflow, so reading `getBoundingClientRect()` in the same task can return either geometry depending on what else touched layout. Await `document.fonts.ready`, read a layout-forcing property, then await a frame before measuring. A stale read does not error — it silently measures the shipped labels and reports that every substitution passes.
    - **Pin the four label pairs** that Property 17 requires, plus the sampled arm: shipped `Back to top` / `Design: HTML5 UP` (Δ5); **S1** `Top` / `Design: HTML5 UP` (Δ13, first label much shorter); **S2** `Back to the top of this page` / `Design: HTML5 UP` (Δ12, first label much **longer**, so the offset has the opposite sign); **S3** `Return to top` / `Design: HTML5` (Δ0, equal counts, a **control**); and random strings 1–40 characters including single unbroken tokens.
    - **Add the divider-box helper**: the divider box comes from the second `li`'s `left` plus **half its resolved `border-left-width`** — not from the `li` rect, and not from an assumed 2px. Reading the `li` rect would make Property 17 pass on the unmodified tree, which is a broken check rather than good news (design Testing Strategy).
    - Add the row and block box helpers: the Copyright_Row content box from `getBoundingClientRect()` on the `ul` adjusted for its resolved padding, and the Copyright_Block content box for the c3 clause. Label glyph extents come from the existing `Range`/`getClientRects()` helper (16.1) over each item's text node — **never the `li` rect**, because the `li` *is* the half, so every clearance would read back as the padding regardless of the text.
    - Add role selectors for the §6.2 elements: `#navPanelToggle` and `#navPanelToggle.alt`, the `#navPanelToggle:before` icon rule, `#navPanel .links li a`, `#navPanel .close`, and the `#header` title (needed for the Req 16 c11 clearance, which is a difference between two edges).
    - **Widen Property 6's inline-style oracle** with `display`, `flex`, `flex-basis` and `min-height` on the nine pages (Req 15 c13, Req 16 c19). The divider centring is a layout mechanism, and a page reproducing it inline would pass Property 17's geometry check while sitting outside Property 2's parity check. Keep the `style="--project-image: url(…)"` carve-out — a custom property is none of the added names.
    - Add the `README.md` / Sync_Document parsing helpers for Property 18: **discover** the Markdown link set by parsing rather than carrying a hardcoded list that would go stale in exactly the edit it guards; resolve relative targets **against the repository, not the deployed origin** (Req 17 c11 prunes `docs`, so `docs/stylesheet-sync.md` is deliberately absent from Pages and a checker pointed at the live site reports a false failure — §6.3); count lines; and locate Req 7 c12's eight retained items in their execution positions.
    - _Requirements: 15.4, 15.13, 16.19, 17.12, 7.12_

  - [ ] 26.2 Add the §6.2 advance-width comparison to Check C (`fontTools`, no browser)
    - Extend `advance-widths.py` with `MENU`, `PROJECTS` and `CAD GALLERY` over `PPTelegraf-Regular.otf` and `PPTelegraf-Ultrabold.otf`, by the same Layer 1 method Change Set 2 used: summed `hmtx` advances over `unitsPerEm` plus the declared `0.05em` tracking per character, scaled by the declared root steps (13.33px at 320px, 14.67px at 768px). `MENU` is measured at **0.8rem at 320px** (inside `<=small`, ≤736px) and **0.9rem at 768px**; both links at 0.9rem throughout.
    - Assert against the §6.2 table: `MENU` 32.29 → **35.21** at 320px and 39.97 → **43.59** at 768px; `PROJECTS` 64.52 → **67.89** and 70.99 → **74.70**; `CAD GALLERY` 85.21 → **91.01** and 93.76 → **100.14**. Note the shape rather than just the pass: `MENU` widens **+9.05%**, the largest relative increase measured anywhere in this spec, because a four-character word gains proportionally more from Ultrabold than a longer label does — the smallest label carries the biggest percentage.
    - **This discharges only the label-width half of Req 16 c21.** The toggle's border-box width and its left border-box edge x are layout facts that this arithmetic does not model, and they need a browser — tasks 29.1 and 29.3.
    - _Requirements: 16.21_

  - [ ]* 26.3 Run Property 17 against the **unmodified** tree and record the baseline
    - **Property 17: The Copyright_Divider is centred, whatever the labels say**
    - **This run is expected to FAIL, on four of its five label cases**, and the distribution is the evidence for §6.1: the shipped pair fails by **20.1px** at 1440px (the pair that is actually in the markup), S1 by roughly **−49.6px** and S2 by roughly **+45.4px** — opposite signs, which is what distinguishes a centred divider from one displaced by a constant — while **S3 passes** at about −0.1px because its two labels happen to be 0.17px apart in width.
    - **S3 passing is a required observation, not a nuisance.** Req 15 c4 names the equal-count case, and it must never be the *only* substitution exercised: a suite that ran S3 alone would report a clean pass against a mechanism that is 20.1px off in production (risk R10). If S3 **fails** here, the row and block centres are being computed from the wrong boxes.
    - **A Property 17 that passes here is a broken checker, not good news** — it means the divider box is being taken from the `li` rect rather than from `left` plus half the resolved `border-left-width`. Verify the four expected failures and the one expected pass appear before trusting any later pass.
    - Record the 320px arm too: at the Stacked_Layout there is no divider, so the baseline records the item box widths and line count.
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.8, 15.14**

  - [ ]* 26.4 Run Property 18 against the **unmodified** tree and record which clauses fail
    - **Property 18: Every required attribution is present and every documentation link resolves**
    - **This run is expected to FAIL, for exactly two reasons and no others:** `README.md` is **134 lines** against the 40-line ceiling (Req 17 c2), and `docs/stylesheet-sync.md` does not exist (Req 17 c8, and with it the Req 7 c12 item clauses).
    - **Every attribution clause is expected to PASS before the edit and to keep passing after it.** That is the point of the change: the compaction reaches the prose around the credits and never the credits themselves. An attribution clause that flips from pass to fail during task 30.1 means content was **lost rather than moved**, which is Req 17 c6's reportable defect and risk R11's failure mode.
    - Confirm the relocation clause reads the Provenance_Record rather than writing to it, and that the line bounds are checked **at both ends of the move** — a 26-line README whose Sync_Document is missing a step satisfies Req 17 c2 and fails Req 7 c13, and that is the most plausible way this change set goes wrong.
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 17.12, 7.5, 7.11, 7.12, 7.13, 9.3, 4.4**

- [ ] 27. Centre the Copyright_Divider (design §6.1)
  - [ ] 27.1 Measure the shipped row and divider, and fill the **pre-change** half of the §6.1 c14 record
    - Playwright, headless Chromium, **with the real faces confirmed loaded** via `document.fonts.check('0.8rem "PP Telegraf"')` before any measurement — a measurement taken in the `font-display: swap` fallback window measures Helvetica, not Telegraf.
    - For each of {768, 1024, 1440}px and each of the four label pairs (shipped, S1, S2, S3), record: Copyright_Row content-box **left x** and **right x**, row **centre x**, Copyright_Divider **centre x**, the **signed offset** (divider centre minus row centre, positive to the right), **and the Copyright_Row border-box height**. At 320px record the item box widths and the line count instead, since the Stacked_Layout renders no divider.
    - **The row height column is not decoration.** In the shipped inline layout the `ul` establishes an inline formatting context whose line box is floored by the **strut** — the `ul`'s inherited `font-size: 0.8rem` × `line-height: 1.5` = 1.2rem. A flex container generates no strut, so this pre-change height is the baseline that Req 15 c10 requires the post-change height to equal, and a lost strut has no other symptom: nothing about the divider's position would change while every footer element below the row moved up.
    - Expect the shipped pair to reproduce the design's **−20.1px** at 1440px, S1 near **−49.6px**, S2 near **+45.4px** and S3 near **−0.1px**. §6.1's numbers below its horizontal rule are *derived* from the shipped binaries and the declared CSS; **Req 15 c14 is discharged only by these rendered figures.**
    - Substitution is performed by the runtime helper from 26.1 and by nothing else. Do not edit a page to measure it.
    - _Requirements: 15.14, 15.1, 15.2, 15.3, 15.4_

  - [ ] 27.2 Restructure `#copyright ul` and its `li` rule in `assets/sass/layout/_footer.scss` (~lines 270–290), mirroring into `assets/css/main.css:4601–4620`
    - On the `ul`: add `display: flex`, `justify-content: center`, `align-items: center` and `min-height: 1.2rem`. `list-style: none`, `margin: 0` and `padding-left: 0` are **unchanged**.
    - On the base `li`: add `flex: 0 0 calc(50% + 1px)`, `min-width: 0` and `text-align: left`; **remove `margin-left: 1rem`**. `border-left: solid 2px`, `line-height: 1` and `padding-left: 1rem` are **unchanged**.
    - On `li:first-child`: add `flex-basis: calc(50% - 1px)`, `padding-right: 1rem` and `text-align: right`. `border-left: 0` and `padding-left: 0` are **unchanged**; the `margin-left: 0` reset is **dropped**, since it is redundant once the base rule declares no margin.
    - **Why equal halves and not an adjustment.** The offset is *exactly* half the difference between the two label widths — the 34px of margin, border and padding cancels out of the arithmetic entirely (§6.1) — so no `margin`, `padding` or `letter-spacing` tuning can fix it, and any mechanism that leaves the items sized by their content reproduces the fault at a different magnitude the moment either label changes length. `flex: 0 0 …` fixes each item's main size to its basis with no grow and no shrink; a percentage basis resolves against the flex container's inner main size and nothing else; `box-sizing: border-box` is inherited globally (`_page.scss:29`, `main.css:144`), so the two items tile the row exactly. **No term in the item sizing derives from a label** — that is Req 15 c4 satisfied structurally rather than by arithmetic coincidence.
    - **The ±1px is `border-width / 2`, and the comment must say so.** The divider is painted inside the second item, starting at its left edge, so a plain 50/50 split puts the divider box centre 1.0px off — satisfying c1's "within 1 CSS pixel" only on an inclusive reading and with zero margin for measurement noise. Biasing the halves puts the *divider box* on the centre line. If the declared border width ever changes, this constant changes with it.
    - **`min-width: 0` is the most important declaration in the block.** Flex items default to `min-width: auto`, whose automatic minimum size floors the used main size at min-content — so a label wider than half the row would grow its item past 50% and displace the divider, reintroducing exactly the content-dependence this change removes, and only for the long-label case c4 exists to cover. With `min-width: 0` an over-long label wraps inside its own half and the divider does not move. **Do not delete it as noise** (risk R10: S1 and S3 would both still pass without it; S2 and the sampled arm are what catch its removal).
    - **`min-height: 1.2rem` restores the strut** a flex container does not generate — 1.5 line-height × 0.8rem font-size, in the same rem terms, so it tracks the root steps at every breakpoint. `align-items: center` places the items within it and keeps the divider's rendered height at the item's `line-height: 1` box rather than stretching it to the full row.
    - **Clearance comes from inside the halves** (Req 15 c8, ≥8px): right-aligning the first label pushes its text toward the centre, so the gap the removed `margin-left` used to supply is now `padding-right: 1rem` on `:first-child`, mirroring the second item's unchanged `padding-left: 1rem`. 1rem is 16.0px at 1440px and 14.67px at 768/1024px, and both gaps clear the floor at every width where the Side_By_Side_Layout applies — including its 481px lower edge.
    - **Do not** absolutely position the divider at `left: 50%` (it would have to stop being a border, breaking Req 15 c9, and it fixes the divider while leaving the labels centred as a run — so under a wide-difference pair the divider would pass *through* a glyph, failing c8 while passing c1, the worst possible failure shape). **Do not** use `grid 1fr auto 1fr` (the middle track has no element and c12 forbids adding one). **Do not** equalise inline-block widths (correct, but whitespace-sensitive: reformatting the `<ul>` onto separate source lines inserts a word space and silently breaks c1). **Do not** touch the `border-left: solid 2px` shorthand or add a colour component to it — the omitted colour is what keeps the divider on `currentColor` and therefore on the §5.6 block colour (Req 15 c9), and it is easy to "fix" into a literal while tidying.
    - Compiled mirrors, per step 3's every-location instruction: `#copyright ul` at `main.css:4601`, `#copyright ul li` at `:4607`, `#copyright ul li:first-child` at `:4615`.
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.8, 15.9, 15.10, 15.12, 15.13, 7.1, 7.2_

  - [ ] 27.3 Extend the `<=xsmall` revert block in `assets/sass/layout/_footer.scss` (~lines 294–306), mirroring into the `max-width: 480px` block at `assets/css/main.css:4629–4641` — **ships in the same commit as 27.2**
    - On the `ul`: add `display: block` and `min-height: 0`. On the `li`: add `text-align: inherit`. On `li:first-child`: add **`text-align: inherit`** and `padding-right: 0`.
    - **Landing 27.2 without this task ships a broken 320px layout**, and it breaks silently: a flex container lays its items out in a row **regardless of their `display` value**, so the existing `display: block` on the items would stop stacking them the moment the `ul` becomes a flex container. The Side_By_Side mechanism must be **reverted**, not merely overridden.
    - **The `:first-child` repeat is a specificity requirement, not redundancy.** The base `#copyright ul li:first-child { text-align: right }` is `(1,1,2)` and a media-query `#copyright ul li { text-align: inherit }` is `(1,0,2)`, so the base rule **outranks** the media block and the reset only lands when it is declared at the same `:first-child` specificity, where source order decides and the later block wins. A reset written only on the `li` rule leaves the stacked first item right-aligned at 320px **while every check that looks at the divider reports a pass.**
    - `display: block` rather than `flex-direction: column`, because it restores the original formatting context wholesale: `flex`, `flex-basis` and `min-width` all become inert with no individual unwind, and the five declarations Req 15 c5 pins keep their pre-amendment meaning exactly. Under `flex-direction: column` the 50% bases would resolve against the container's *height* instead.
    - `min-height: 0` is belt-and-braces — the stacked items are far taller than 1.2rem so the floor cannot bind, and declaring it removes the question rather than leaving it to be re-derived.
    - The five Req 15 c5 declarations stay exactly as they are: `border-left: 0`, `margin: 1rem 0 0 0`, `padding-left: 0`, `display: block`, and `:first-child { margin-top: 0 }`.
    - _Requirements: 15.5, 15.6, 15.13, 7.1, 7.2_

  - [ ] 27.4 Re-measure and complete the §6.1 c14 record
    - Repeat 27.1 exactly — same viewports, same four pairs, same fonts-loaded precondition — and fill the post-change columns. Expect a signed offset of **0.0px** (within 1px) at all three viewports for **all four pairs**, which is the signature of a mechanism in which label widths do not appear.
    - **Assert the row border-box height equals its pre-change value at each viewport** (Req 15 c10). This is the strut check, and it is the reason the height column exists: `min-height: 1.2rem` is an argument that should be checked rather than believed.
    - Record the measured clearances on both sides of the divider and confirm ≥8px (Req 15 c8), and confirm the row centre sits within 1px of the Copyright_Block content-box centre (c3).
    - At 320px confirm two full-width block boxes, one line each, and **no divider box at all**.
    - **If a bound is missed, the adjustment is a change to the mechanism, not a change to the recorded number** (Req 15 c14). Never reach for absolute positioning, never re-add a compensating margin, and never shorten a label to make the arithmetic work — the label is the variable c4 quantifies over.
    - _Requirements: 15.14, 15.1, 15.2, 15.3, 15.4, 15.7, 15.8, 15.10_

  - [ ]* 27.5 Write property test for divider centring
    - **Property 17: The Copyright_Divider is centred, whatever the labels say**
    - **The label-pair generator is the whole property.** A generator that only rendered the two shipped strings would pass any mechanism that happened to centre *those* strings, which is precisely why Req 15 c4 exists. Pin **S1** (Δ13), **S2** (Δ12, opposite sign) and **S3** (Δ0, control) as required cases alongside the shipped pair and the sampled arm of 1–40 character strings including single unbroken tokens.
    - **S3 must not be the only substitution.** It passes on the shipped, broken mechanism at −0.1px; a suite built around the equal-count case alone has no discrimination at all (risk R10). The sampled arm is what makes this a property rather than four examples: it reaches long unbreakable tokens, which is where the automatic minimum size would reassert content-dependence if `min-width: 0` were ever dropped.
    - Quantify the 320px Stacked_Layout as a **separate arm**, not an exclusion: c6 scopes c1–c4 out of it, but c5 makes positive demands there, and leaving the row a flex container at `<=xsmall` is the most likely way to break this change — it would fail the block-box and no-divider clauses at once.
    - Three oracle details: label glyph extents from a `Range` over each item's text node, never the `li` rect; the divider box from the second item's `left` plus half its **resolved** `border-left-width`, so the check tracks the declared width rather than assuming 2px (Req 15 c9's width pin lives in Property 8); and the substitution through the runtime helper from 26.1, with the layout flush.
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.8, 15.14**

  - [ ]* 27.6 Extend Property 8's baseline set for the divider scope, and add the unit assertions
    - **Property 8: Everything outside the intended delta is byte-identical to the baseline**
    - Add, and remove nothing: **all nine Content_Pages, whole-file** — for this change set the page clause tightens from "element set, count, order and nesting" to file-level identity, including the Copyright_Block inner markup that Change Set 2 had moved out of the baseline (Req 15 c12, Req 17 c13). Change Set 3 is the first amendment since Change Set 1 that can be checked this strictly, and doing so is free.
    - Add the **Copyright_Divider's declared width and inherited colour** — `border-left: solid 2px` on the second item with the colour still omitted from the shorthand, so it resolves to `currentColor` and therefore to the §5.6 block colour (Req 15 c9). Add the **Copyright_Block `margin`, `width`, `max-width` and `<=large` margin override, and the Copyright_Row's border-box height** (Req 15 c10) — the height entry is the one that matters, because it is what turns the strut argument into a check.
    - Add the unit assertions from the design Testing Strategy: the `#copyright ul` rule declares `display: flex` with the two `calc(50% ∓ 1px)` bases and `min-width: 0`; the `<=xsmall` block declares `display: block` on the `ul` with `text-align: inherit` on **both** the `li` rule **and** its `:first-child`. **That second one is asserted literally because it is a specificity trap rather than a value question** — a property quantified over viewports would report the resulting 320px failure without pointing at the cause.
    - **Validates: Requirements 15.9, 15.10, 15.12, 17.13**

  - [ ]* 27.7 Extend Property 5 for label containment, and re-run Properties 16 and 10 for Req 15 c11
    - **Property 5: Nothing overflows, in either font state** — add: both Copyright_Item labels render with every character visible inside the Copyright_Row content box at **all four** viewports, with no ellipsis or other truncation indicator and no horizontal page scrollbar (Req 15 c7). The divider's *position* is Property 17's business; the labels' containment is this property's.
    - Re-run **Property 16** and **Property 10** unchanged in substance (Req 15 c11): the Back_To_Top_Control's fragment navigation, the Design_Credit's link target, the focus indicator and the pointer cursor must all survive the mechanism change. The clause that could plausibly have been disturbed is **keyboard reachability**, since the items are now flex children — flex layout does not reorder the DOM unless `order` or `row-reverse` is declared and §6.1 declares neither, so the tab order is unchanged; Property 16's sequential-navigation clause checks that directly rather than by reading the CSS.
    - **Validates: Requirements 15.7, 15.11**

- [ ] 28. Checkpoint — the divider change is whole at every width
  - Tasks 27.2 and 27.3 are **one change and ship together**: a flex container lays its items in a row regardless of their `display` value, so 27.2 without 27.3 puts two items side by side at 320px with a divider that should not exist (Req 15 c5, c6).
  - Confirm Property 17 now passes on **all** its cases — the shipped pair, S1, S2, S3 and the sampled arm — at 768/1024/1440, and that its 320px arm passes on the block-box and no-divider clauses. The four baseline failures from 26.3 must be gone and S3 must still pass.
  - Confirm the §6.1 c14 record is complete with **both** the pre- and post-change row heights, and that they are equal at each viewport (Req 15 c10). An unequal pair means the strut floor is wrong, not that the record needs adjusting.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 29. Ultrabold for the Nav_Panel_Toggle and the Nav_Panel_Links (design §6.2)
  - [ ] 29.1 Measure the toggle geometry at the **body weight**, before the edit (first half of Req 16 c21)
    - Playwright, fonts confirmed loaded, at **320px and 768px only** — both elements render `display: none` above the `<=medium` breakpoint, so no other width is layout-relevant. Open the nav panel for the link measurements.
    - Record: the rendered `MENU` label width; the Nav_Panel_Toggle **border-box width**; the **x-coordinate of its left border-box edge**; the `#header` title's **right edge x**; and the resulting **clearance** between them. Record the widest link `CAD GALLERY`'s rendered width and the `#navPanel` content-box width alongside.
    - The last two columns are not named by c21 but are what make Req 16 c11 checkable: **a clearance is a difference between two edges**, and recording only the toggle's edge would leave the criterion unverifiable from the record.
    - Confirm the pinned position before the weight changes: right border-box edge 0.75rem from the viewport's right edge, top edge 0.75rem from the top (Req 16 c10). The box has `width: auto`, so a heavier label cannot move it — it **grows leftward**, toward the header title, and this measurement is the fixed point that growth is measured against.
    - _Requirements: 16.21, 16.10, 16.11_

  - [ ] 29.2 Change the two `font-weight` declarations in `assets/sass/layout/_navPanel.scss`, mirroring both into `assets/css/main.css`
    - **`_navPanel.scss:24`** (the `#navPanelToggle` rule): `_font(weight)` → **`_font(weight-bold)`**. Compiled mirror: **`main.css:4660`** (`font-weight: 400` → `800`).
    - **`_navPanel.scss:87`** (the `#navPanel .links li a` rule): `_font(weight)` → **`_font(weight-bold)`**. Compiled mirror: **`main.css:4753`** (`font-weight: 400` → `800`).
    - **Do NOT touch `main.css:4677`.** The `#navPanelToggle:before` rule declares `font-weight: 900` for the Font Awesome `\f0c9` glyph and resolves through the icon family, not the `$font` map. It is not Chrome_Text, it is not Bold_Chrome_Text, and Property 8 carries it against its baseline. **Two `font-weight` declarations in one region of one file is exactly the shape a careless mirror gets wrong** — the `:before` rule sits 17 lines below the declaration that does change.
    - **Leave the duplicate `font-size: 0.9rem` at `_navPanel.scss:85–86` alone**, and its mirror at `main.css:4751–4752`. It is pre-existing, harmless and identical in both artifacts, so removing it would be an unrelated edit to a rule this change set is already touching — and it is the **live example** behind Req 7 c12's last-declaration-wins caveat: a parity checker reading the first match rather than the last reports a false failure here, and this rule is where a maintainer will meet that behaviour. A well-meant cleanup would delete the illustration along with the duplicate.
    - **Change nothing else at either site.** `font-family: _font(family)` stays at `:22` and `:84` (Req 16 c4); the declared `font-size` values stay — 0.9rem, reducing to 0.8rem at `<=small` for the toggle only, at `_navPanel.scss:50` (Req 16 c5); `letter-spacing` stays at `_font(letter-spacing-heading)` = 0.05em, which Req 16 c14 makes a **floor** — the heavier face reduces inter-glyph white space at constant tracking, so tightening it is not available as a width lever. `text-transform`, default and hover `color`, `background-color`, `border`, `box-shadow`, `padding` and transition timing are untouched, **including the `#navPanelToggle.alt` scrolled state** (Req 16 c15).
    - **No font file is added** (Req 16 c6): `PPTelegraf-Ultrabold.otf` already ships at `usWeightClass` 800 and is already declared at `font-weight: 800` under the `PP Telegraf` family, so the bundle stays at **103,324 bytes** and nothing is synthesized or interpolated (c7). This is the same position §5.3 recorded for Requirement 11.
    - **What this fixes is an inconsistency, not a taste.** `assets/js/main.js:130` injects the toggle, and the same file moves the children of `#nav` into `#navPanel > nav` at `<=medium` and back above it — so the Nav_Panel_Links and the top navigation links are **the same two anchors**, "Projects" and "CAD Gallery", under two different parents. Change Set 2 set `#nav ul.links a` to 800 and left `#navPanel .links li a` at 400, so those anchors **changed weight as the viewport crossed 980px**. After this task they carry one weight throughout (Req 16 c17).
    - Contrast needs no re-derivation (Req 16 c16): no colour pair changes, font weight does not enter the WCAG formula, and at 0.9rem and 0.8rem neither element approaches the 18.66px large-text boundary, so the threshold stays 4.5:1. Both states are still generated by Property 1 so the claim is checked rather than asserted.
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.14, 16.15, 16.17, 16.19, 7.1, 7.2_

  - [ ] 29.3 Re-measure at weight 800 and complete the §6.2 c21 record
    - Repeat 29.1 at 320px and 768px and fill the table: rendered label width at **both** weights, toggle border-box width, toggle left border-box edge x, `#header` title right edge x, and clearance.
    - Expect the border-box width to increase by **exactly the label delta** — **+2.92px at 320px and +3.62px at 768px** — because the `:before` icon is Font Awesome at its own `font-weight: 900` and does not change width, and the `margin-right: 0.5rem` and horizontal padding are unchanged. The Req 16 c11 clearance therefore shrinks by at most 3.7px.
    - Verify c9 (label plus `\f0c9` glyph on one line wholly inside the padding box, no truncation indicator, no horizontal page scrollbar), c10 (right and top border-box edges still 0.75rem from the viewport edges — the box grew leftward rather than moving), c11 (no glyph of the toggle overlapping any glyph of the `#header` title), and c12 with the panel open (each link on one line inside the `#navPanel` content box, no link overlapping another link or the `.close` control).
    - The panel links are the low-risk half and the numbers say why: at 320px the `max-width: 80%` cap binds at 256px giving a 202.7px content box against `CAD GALLERY` at 91.0px; at 768px the `20rem` width binds at 293.3px giving 234.7px against 100.1px — **43–45% occupancy at weight 800**, with `display: block` links in a vertical list and no horizontal neighbour.
    - **If the toggle clearance fails, Req 16 c13 fixes the remedy in advance:** enlarge the containing box or reduce the element's horizontal padding. Never reduce `font-size` below the Req 5 c3 floor, never return either element to the body weight, never apply `text-overflow` truncation.
    - _Requirements: 16.21, 16.9, 16.10, 16.11, 16.12, 16.13_

  - [ ]* 29.4 Extend Property 4's 400/800 partition to the two nav panel sites
    - **Property 4: Every element resolves to the token model**
    - Move the Nav_Panel_Toggle and the Nav_Panel_Links **out** of the 400 half and into the **800** half of the existing partition (task 19.2 put nav-panel links in the 400 half; that membership is now wrong). Every other Chrome_Text element still computes to exactly 400, and both halves must be members of the shipped set `{400, 800}`. Keep the family clause, so a weight edit that also alters the family fails here (Req 16 c4).
    - **Req 16 c17 falls out of the partition for free, and it is the clause worth naming.** Because `main.js` reparents the same two anchors across `<=medium`, the generator's viewport dimension visits them under *both* parents — at 320/768 inside `#navPanel`, at 1024/1440 inside `#nav`. Requiring 800 in every case is strictly stronger than requiring two observations to be equal, so no cross-viewport comparison needs writing.
    - **Expect a diagnostic failure shape from an incomplete edit:** bolding `#nav ul.links` but not `#navPanel .links li a` fails the 800 clause at **320px and 768px only** and passes at 1024px and 1440px. A weight failure at two viewports and not the other two is the signature of the Change Set 2 inconsistency this amendment closes, not a flaky check.
    - Add the unit assertions: `_navPanel.scss:24` and `:87` each declare `_font(weight-bold)`, while `:22` and `:84` still declare `_font(family)`, the two `font-size` values are untouched, and **`main.css:4677` still declares `font-weight: 900`** for the Font Awesome `:before` glyph. Assert the duplicate `font-size: 0.9rem` at `_navPanel.scss:85–86` is **still present** and still mirrored at `main.css:4751–4752`.
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.7, 16.8, 16.14, 16.17**

  - [ ]* 29.5 Extend Property 5's containment clause to the nav panel elements
    - **Property 5: Nothing overflows, in either font state**
    - Add three toggle clauses and one link clause, all at weight 800 and all at **320px and 768px**, inside the `<=medium` breakpoint where the elements are not `display: none`: the toggle renders `MENU` plus its `\f0c9` icon on one line wholly inside its padding box with no truncation indicator (c9); its border box sits wholly inside the viewport with right and top edges 0.75rem from the viewport edges, so the wider label extends the box leftward rather than moving or overflowing it (c10); its box does not overlap any rendered glyph of the `#header` title (c11) — the clause the §6.2 measurement exists to feed; and every Nav_Panel_Link renders on one line inside the `#navPanel` content box with no link overlapping another link or the `.close` control (c12).
    - **Req 16 c18 is deliberately NOT in this property.** Whether two adjacent glyph outlines touch and whether counters stay open at 0.9rem/800 is a rendering judgement, not a bounding-box computation — the same reasoning that put Req 11 c7 in the visual-review step, and c18 joins it there in task 31.
    - **Validates: Requirements 16.9, 16.10, 16.11, 16.12**

  - [ ]* 29.6 Extend Property 8's baseline set for the nav panel, and re-run Property 1
    - **Property 8: Everything outside the intended delta is byte-identical to the baseline**
    - Add both nav panel sites' `text-transform`, default and hover `color`, `background-color`, `border`, `box-shadow`, `padding` and transition timing, **including the `#navPanelToggle.alt` scrolled-state background, box shadow, colour and hover background** (Req 16 c15) — plus the `#navPanelToggle:before` icon rule's own `font-family` and `font-weight: 900`, which is Font Awesome's and is **not** part of the weight partition. Add the font bundle file set, so Req 16 c6's "add no file, remove no file, change no `@font-face` rule" is checked rather than assumed.
    - Re-run **Property 1** over both elements in default and hover states, in the plain and `.alt` toggle states, against the ordinary ≥4.5:1 Chrome_Text threshold (Req 16 c16). Nothing is re-derived — no colour pair changed — but the claim is generated rather than asserted, and Property 1's accepted-exceptions set must still report **exactly one** member (`#footer h3`, 4.05:1, conflict C2).
    - **Validates: Requirements 16.6, 16.15, 16.16**

- [ ] 30. Shorten the README, add the Sync_Document, and prune `docs` from the artifact (design §6.3)
  - [ ] 30.1 Replace `README.md` with the owner's target text
    - Write exactly this, and note that it is **not** design §6.3's draft: the design's version editorialises about licence conditions, and the owner asked for a short file like the one they had. This keeps their structure, their bullet order and their two-space hard line breaks. It is **26 lines** against the 40-line ceiling (Req 17 c2), with the fonts credit at **3 lines** against the 4-line cap (Req 17 c4).

      ```markdown
      # Personal Website

      You can visit my website [here](https://jefferyxr.github.io/personal-website/index.html)

      ---

      ## Credits

      - **Template:**  
        [Massively](https://html5up.net/massively) by [HTML5 UP](https://html5up.net) | @ajlkn  

      - **Icons:**  
        [Font Awesome](https://fontawesome.io)  

      - **Fonts:**  
        Horizon by Alberto Fontense — free for personal use  
        [Telegraf](https://pangrampangram.com/products/telegraf/) by Pangram Pangram Foundry — free for personal use  

      - **Other Libraries & Tools:**  
        - [jQuery](https://jquery.com)  
        - [Scrollex](https://github.com/ajlkn/jquery.scrollex)  
        - [Responsive Tools](https://github.com/ajlkn/responsive-tools)

      ---

      Maintainers: the stylesheet regeneration and parity procedure is in [`docs/stylesheet-sync.md`](docs/stylesheet-sync.md).
      ```

    - What it satisfies: Req 17 c1 (H1, one line linking the deployed site, a `## Credits` section), c2 (26 ≤ 40), c3 (template naming Massively and HTML5 UP with a Markdown link to `https://html5up.net`; icons naming Font Awesome; libraries naming jQuery, Scrollex and Responsive Tools; fonts naming both typefaces with designer and licence tier), c4 and **Req 9 c3** (the fonts credit as a single bullet of three lines, carrying designer and tier for each typeface), **Req 7 c11** and c7 (the Sync_Document linked in one line of body text), and Req 17 c5 (the template and fonts credits are retained independently of the length reduction — **the compaction reaches the prose around the credits, never the credits themselves**).
    - **This text drops the inline `FONT-PROVENANCE.md` link, so Req 17 c10's provenance reference must live in `docs/stylesheet-sync.md` instead.** c10 permits either location; the target README uses the Sync_Document, so **task 30.2 must carry that link or c10 fails** — and it fails silently, because nothing else in the README points at the Provenance_Record. Do not add the link back to the README to satisfy c10; the owner's structure is the requirement here and the Sync_Document is the recorded home.
    - **Note for Property 18's oracle:** the fonts bullet states each tier as "free for personal use". Telegraf's tier is a free personal / **non-commercial** tier, and that condition is stated in full in the Sync_Document's standing-obligation statement (30.2) and in the Provenance_Record — so the c3 check must read *a licence tier per typeface* rather than matching the literal string "non-commercial" in the README, or it reports a false failure against the owner's wording.
    - **Relocation, not deletion** (Req 17 c9), and each removed statement's destination is already decided: the **declared-weights table** and the **no-italic-face note** are already present in `assets/webfonts/FONT-PROVENANCE.md` (the per-file `usWeightClass` inventory with the "no 700 face" deviation note, and "Italics: none shipped" with the Oblique/Slanted inventory, the zero-`<em>` content audit and the ~302 KB figure) — **so removing the README copies is deleting duplicates, not losing content**, and this is why Req 17 c9's permitted-destinations list and Req 17 c13's unchanged list can both name the Provenance_Record without contradiction. The **regeneration procedure and its caveats** and the **non-commercial standing-obligation statement** move to the Sync_Document in 30.2. **Do not edit `FONT-PROVENANCE.md`** — Req 17 c13 requires it unchanged, and the relocation check reads it rather than writing to it.
    - Change nothing else: Req 17 c13 restricts this change to `README.md`, the Sync_Document and the prune step. A README rewrite that also "tidied" a stylesheet fails Property 8.
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.7, 17.9, 17.12, 17.13, 9.3, 7.11_

  - [ ] 30.2 Create `docs/stylesheet-sync.md` holding the full procedure
    - Carry the **whole** procedure across, in execution order, naming every file and stating how parity is verified (Req 7 c5, c12). **This is a relocation with no editorial reduction**: Req 7 c13 makes any omitted step, file name or verification instruction a reportable defect naming what is missing. Risk R11 is that the line count is the visible goal and the procedure is what gets quietly shortened to hit it — and a dropped step produces no failing check, only a wrong edit months later against two artifacts that diverge silently.
    - The eight items Req 7 c12 pins, each in its execution position: **(1)** the SASS edit step naming `libs/_vars.scss` first and then every rule-level file (`base/_typography.scss`, `layout/_intro.scss`, `layout/_main.scss`, `layout/_footer.scss`, `layout/_nav.scss`, `layout/_navPanel.scss`, `components/_button.scss`, `_form.scss`, `_pagination.scss`, `_table.scss`); **(2)** the by-hand map-resolution step, with `_font(family)` expanding to `"PP Telegraf", "Helvetica Neue", "Segoe UI", Roboto, sans-serif`; **(3)** "apply the change at **every** location in `assets/css/main.css`" — `family-heading` resolves at **11** sites, and changing the first is the default mistake; **(4)** the **`@import` / `@font-face` ordering step** — `@import url(fontawesome-all.min.css)` stays on line 1 and every `@font-face` stays below it, because a rule above an `@import` invalidates it and every icon on all nine pages disappears (Req 7 c6); **(5)** the parity-verification step with the last-declaration-wins caveat and the browser-measured Skills_Pill geometry instruction; **(6)** the zero-occurrence step for `Merriweather`, `Source Sans Pro` and **`#4a5158`**, plus `scroll-behavior` and `prefers-reduced-motion` with comments stripped; **(7)** the per-page Copyright_Block markup step; **(8)** the carried-forward note that the `scroll-behavior` removal is guarded at the line where someone would re-add it.
    - **Item 5's caveat must survive in full**, because it is the one most easily lost in a move: `#footer` and `#copyright` each declare `color` **twice**, an artifact of the `color(alt)` mixin, so a checker reading the first match reports a false failure — **and for `#copyright` the first value is the mixin's opaque `#ffffff`, not the value that renders.** The block paints the second declaration, `rgba(255, 255, 255, 0.65)`. A maintainer who trusts the first `color` there will conclude the copyright bar is opaque white and compute a contrast ratio for a colour that is never painted. Record `#navPanel .links li a`'s duplicate `font-size: 0.9rem` (`_navPanel.scss:85–86`, `main.css:4751–4752`) as the third live instance, in a rule Change Set 3 touches, and state that all three are left as they are.
    - **Carry the non-commercial standing-obligation statement here** (Req 17 c9): both grants hold only while the site remains a personal job-application showcase, and adding paid services, rates, sponsorship or any other monetisation lapses them and requires paid licences including a Pangram Pangram **Web** licence scoped to the domain and pageview tier. The README's version is broader than the Horizon-scoped sentence already in the Provenance_Record, so it is carried rather than assumed covered.
    - **Include the link to `assets/webfonts/FONT-PROVENANCE.md`** — this is what keeps Req 17 c10 satisfied once the README drops its inline provenance link (30.1). Say what the record holds: per-file source URLs, download dates, licence tiers, SHA-256 hashes, stored sizes, the declared-weights inventory and the no-italic-face note.
    - Add the Change Set 3 notes the design records for this procedure: step 1's file list already names `layout/_footer.scss` and `layout/_navPanel.scss`, so no step gains a file; step 3's every-location instruction covers the four compiled sites (`main.css:4601–4620` and the `max-width: 480px` block at `:4630–4641`, plus `:4660` and `:4753`), and **`main.css:4677` is Font Awesome's and is not one of them**; the divider position and the toggle geometry are measured in a browser **before** the mechanism is accepted, with the label substitution performed at runtime and never by editing the nine pages; and step 5 gains one item for §6.3 itself — `README.md` at 40 lines or fewer with every Markdown link resolving **against the repository**, and `docs` present in the `static.yml` prune step.
    - _Requirements: 17.8, 17.9, 17.10, 7.5, 7.12, 7.13_

  - [ ] 30.3 Add `docs` to the prune step in `.github/workflows/static.yml`
    - `run: rm -rf tools .kiro` → **`run: rm -rf tools .kiro docs`**. One token.
    - Required because the workflow uploads **`path: '.'`** with no build step, so a new `docs/` directory would otherwise be published (Req 17 c11). `docs` belongs to the same class as `tools` and `.kiro`: repository content that is not site content, following the precedent the workflow already sets. The step runs against the ephemeral CI checkout and never the repository.
    - **The consequence is intended and must be recorded so it is not later read as a broken link:** the README's link to `docs/stylesheet-sync.md` resolves on GitHub, which is where the README is actually read, and does **not** resolve on the deployed Pages origin, where nothing links to the README at all. Property 18 therefore resolves relative links **against the repository** — a checker pointed at the live site would report a false failure on a file whose absence is the design.
    - _Requirements: 17.11_

  - [ ]* 30.4 Write property test for the attributions, the link resolution and the retained procedure
    - **Property 18: Every required attribution is present and every documentation link resolves**
    - Quantify over the four attributions Req 17 c3 enumerates, over every Markdown link in `README.md`, and over the eight items Req 7 c12 enumerates. **Discover the link and item sets by parsing** rather than carrying a hardcoded list — both sets change whenever either document is edited, which is exactly the edit the check is meant to guard, and a stale fixture would go quiet at the worst moment.
    - Four oracle details, each guarding a way this check could be hollow: relative links resolve **against the repository, not the deployed origin** (30.3 prunes `docs` deliberately); **presence is checked and adequacy is not** — whether the credits are *sufficient* attribution is a licence reading recorded in §5.5 and R8, so the oracle is the enumerated facts per typeface and the named parties per credit, which is more than a substring match on "HTML5 UP" (Req 17 c6 makes a missing attribution a reportable defect naming it); the **relocation clause reads the Provenance_Record rather than writing it**, asserting the declared-weights table and the no-italic-face note are *found* in `FONT-PROVENANCE.md` and the non-commercial standing obligation is *found* in the Sync_Document, failing by name if a statement is in neither (Req 17 c9); and the **line bounds are checked at both ends of the move** — a 26-line README whose Sync_Document is missing a step satisfies Req 17 c2 and fails Req 7 c13.
    - Assert the Req 17 c10 provenance reference resolves from the **Sync_Document**, since the owner's README drops the inline link, and read the fonts credit's licence tier per typeface rather than matching "non-commercial" literally (see 30.1).
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 17.12, 7.5, 7.11, 7.12, 7.13, 9.3, 4.4**

  - [ ]* 30.5 Extend Property 8 for Req 17 c13, and add the prune-step assertion
    - **Property 8: Everything outside the intended delta is byte-identical to the baseline**
    - Add the Stylesheet_Source, the Compiled_Stylesheet, the Webfont_Bundle and the Provenance_Record, **against the state tasks 27 and 29 leave them in**, for the purposes of Requirement 17 (Req 17 c13). Change 3 is documentation and workflow only; a README rewrite that also tidied a stylesheet fails here. The Provenance_Record entry does double duty, since §6.3 relies on two statements already being present in it rather than writing them there.
    - Add the unit assertion: `static.yml`'s prune step names **`docs`** alongside `tools` and `.kiro`.
    - **Validates: Requirements 17.11, 17.13**

- [ ] 31. Final checkpoint — pre-push verification gate for Change Set 3
  - **Do not push to `main`.** `.github/workflows/static.yml` still deploys the whole repository to production on every push and there is still no staging environment. Land Change Set 3 as **one revertible commit** on the current feature branch and open a PR; `git revert` of that commit restores the shipped Change Set 2 state completely — the change is confined to text artifacts, with no state and nothing to unwind.
  - Run `cd tools/typography-check && npm ci && npm test` (Checks A–F, plus I and J) against the working tree. **Change Set 3 adds no check and extends three:** Check B gains Property 18 (file reading and link resolving, no browser, no font), Check C gains the §6.2 advance-width comparison, and Check D gains Property 17 with the runtime substitution helper. All 18 properties and the integration checks must pass.
  - Confirm the two expected first-run failures are now **closed and were seen**: Property 17 failed on four of five label cases before the edit (S3 excepted) and Property 18 failed on the 134-line README and the missing Sync_Document. **A Property 17 or Property 18 that passed on the unmodified tree is a broken check, not good news** — for 17 it means the divider box was read from the `li` rect, for 18 it means the line and existence clauses are not wired up.
  - Confirm every attribution clause of Property 18 **still** passes. A clause that flipped from pass to fail during task 30.1 means content was lost rather than moved (Req 17 c6, risk R11).
  - Confirm all nine Content_Pages are **byte-identical** to their pre-change state — this is the first change set since Change Set 1 that can assert file-level identity, and it is free (Req 15 c12, Req 17 c13).
  - Confirm the pre- and post-change Copyright_Row heights are **equal** at 768/1024/1440 (Req 15 c10), and that `main.css:4677` still declares `font-weight: 900` while `:4660` and `:4753` now declare `800`. Confirm the duplicate `font-size: 0.9rem` at `_navPanel.scss:85–86` and `main.css:4751–4752` is still present.
  - Read Check J's reported numbers, not just its exit status: both scroll controls must still report first movement inside the 150 ms budget (18–50 ms expected), and zero `scroll-behavior` / `prefers-reduced-motion` **declarations** must remain in both artifacts, with the DO-NOT-REINTRODUCE comments at `_page.scss:31–41` and `main.css:145–155` intact.
  - **Visual review, and this step carries Req 16 c18 plus one instruction that is not a criterion.** c18: at 0.9rem and 0.8rem at weight 800, with the nav panel **open** at 320px and 768px — the only widths where the two elements are not `display: none` — no two adjacent glyph outlines may overlap or touch and every enclosed counter must stay open. That is a rendering judgement, not a bounding-box computation. **Then look at the footer divider at 481px**, the narrowest width at which the Side_By_Side_Layout applies: Req 15 c2 names 768/1024/1440 and c7 names 320, so nothing asserts anything at the layout's own lower edge, where the two fixed halves are narrowest relative to the labels.
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
- **The CSS smooth-scroll block is not added, and its original justification was wrong.** `preventDefault()` suppresses fragment navigation, not `scroll-behavior` applied to jQuery's own per-frame `scrollTop` writes — measured 1056 ms to first movement on the intro down-arrow against 32–50 ms without it (task 22.1). The Back to top control ships as an instant fragment jump, which Req 13 c2 asks for; task 22.5's Check J guards the latency of both scroll controls.
- **The HTML5 UP credit is not removable under this spec.** CC BY 3.0 attaches attribution to adaptations, and HTML5 UP sells attribution-free usage separately through Pixelarity. Task 22.2 rewords it; Property 16 asserts its presence, wording and link target on all nine pages so a future removal fails a check (risk R8).
- **Tasks 16–25 are Change Set 2, shipped** (commits `4723384` and `fec1de6`). They are retained as history and marked complete; do not re-run them.
- **Task 22.1 shipped more than it now describes.** It landed `html { scroll-behavior: smooth }` alongside its two `#copyright` declarations, and `fec1de6` removed the smooth-scroll block again after Check J measured 1056 ms to first movement. Its task text was rewritten after the reversal, so it is annotated rather than plainly ticked: the surviving delta is the two declarations plus the DO-NOT-REINTRODUCE comments at `_page.scss:31–41` and `main.css:145–155`, which Change Set 3 must leave intact.
- **Change Set 3 edits no Content_Page.** All nine pages stay byte-identical (Req 15 c12, Req 17 c13), which is why Property 8's page clause tightens to file-level identity for tasks 26–31 and why the Req 15 c4 label substitution is performed **at runtime in the page under test**, never in markup.
- **Tasks 27.2 and 27.3 are one change and ship together.** A flex container lays its items out in a row regardless of their `display` value, so the flex `ul` without the `<=xsmall` revert stops the Stacked_Layout stacking and puts two items side by side at 320px with a divider that should not exist.
- **`text-align: inherit` must be declared on both the `li` rule and its `:first-child` in the `<=xsmall` block.** The base `:first-child { text-align: right }` is `(1,1,2)` and outranks a media-query `li` rule at `(1,0,2)`, so a reset written only on the `li` leaves the stacked first item right-aligned at 320px while every divider check reports a pass. It is asserted as a literal (27.6) because it is a specificity trap, not a value question.
- **`min-width: 0` on the `li` is load-bearing, not stylistic.** Without it a label wider than half the row grows its item past 50% and displaces the divider — content-dependence reintroduced for the long-label case Req 15 c4 exists to cover. S1 and S3 would both still pass without it; S2 and the sampled arm are what catch its removal (risk R10).
- **Properties 17 and 18 are both expected to FAIL on the unmodified tree** (tasks 26.3, 26.4). Property 17 fails on four of five label cases with **S3 passing** — S3's labels are 0.17px apart, so the broken mechanism already centres them, which is exactly why an equal-length pair must never be the only substitution. Property 18 fails on two clauses only: the 134-line README and the missing Sync_Document. **A pass on either means a broken check, not good news.**
- **Do not touch `main.css:4677`.** It is the Font Awesome `:before` glyph's `font-weight: 900`, 17 lines below the toggle declaration that does change. Two `font-weight` declarations in one region is where a hand-mirrored edit goes wrong.
- **The duplicate `font-size: 0.9rem` at `_navPanel.scss:85–86` stays.** It is the live example behind Req 7 c12's last-declaration-wins caveat, and 29.4 asserts it is still present so a well-meant cleanup cannot delete the illustration along with the duplicate.
- **The README target text is the owner's, not design §6.3's draft.** The design's version editorialises about licence conditions; the shipped file keeps the owner's short structure and bullet style (26 lines, 3-line fonts bullet). Because it drops the inline `FONT-PROVENANCE.md` link, **Req 17 c10's provenance reference lives in `docs/stylesheet-sync.md`** — if 30.2 omits it, c10 fails silently, since nothing else points at the Provenance_Record.
- **The move to the Sync_Document is a relocation with no editorial reduction.** Req 7 c12 enumerates eight items that must survive in their execution positions and c13 makes an omission a defect naming it. Risk R11 is that the line count is the visible goal and the procedure is what gets shortened to hit it — a dropped step produces no failing check, only a wrong edit months later.
- **Req 16 c18 belongs to visual review, not to any property**, on the same footing as Req 11 c7: glyph collisions and closed counters at 0.9rem/0.8rem and weight 800 are a rendering judgement. Task 31 carries it, with the panel open at 320px and 768px, and adds one non-criterion instruction — inspect the footer divider at **481px**, the lower edge of the Side_By_Side_Layout, which no criterion names.

## Task Dependency Graph

Change Set 1's and Change Set 2's leaf tasks are complete and are omitted. The waves below cover the incomplete **Change Set 3** leaves only. `assets/css/main.css` is written by 27.2, 27.3 and 29.2, so those three are serialised one per wave; every baseline measurement runs in wave 1 against the unmodified tree, and no two tasks in a wave write the same harness file (`fixtures.mjs`, `advance-widths.py`, `properties-changeset3.test.mjs`, `readme-sync.test.mjs`, `divider-geometry.mjs`, `navpanel-geometry.mjs`, `properties-changeset2.test.mjs`, `smoke.test.mjs`).

```json
{
  "waves": [
    { "id": 0, "tasks": ["26.1"] },
    { "id": 1, "tasks": ["26.2", "26.3", "26.4", "27.1", "29.1"] },
    { "id": 2, "tasks": ["27.2"] },
    { "id": 3, "tasks": ["27.3"] },
    { "id": 4, "tasks": ["27.4", "27.5"] },
    { "id": 5, "tasks": ["27.6", "29.2"] },
    { "id": 6, "tasks": ["27.7", "29.3"] },
    { "id": 7, "tasks": ["29.4", "30.1"] },
    { "id": 8, "tasks": ["29.5", "30.2"] },
    { "id": 9, "tasks": ["29.6", "30.3"] },
    { "id": 10, "tasks": ["30.4"] },
    { "id": 11, "tasks": ["30.5"] }
  ]
}
```
