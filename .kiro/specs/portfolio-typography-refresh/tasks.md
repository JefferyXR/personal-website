# Implementation Plan: portfolio-typography-refresh

## Overview

Two outcomes land in one revertible commit: a targeted darker footer email link, and a full typeface replacement (Horizon for headings, Telegraf for body and small chrome) with self-hosted fonts and Google Fonts removed.

Three things shape the ordering of this plan:

1. **Font acquisition is a manual prerequisite.** Neither face can be fetched programmatically (Req 9 c1 forbids the aggregator mirror). Until the files are in hand, Horizon's `OS/2.usWeightClass`, Horizon's advance widths, and whether the free Telegraf tier ships a bold face are all **unknown**. Task 1 is a manual owner action and Task 2 is the Check G intake gate that resolves those three unknowns. **No CSS is written before Task 2 completes.** The design's `3.5rem` / `2.75rem` / `2.5rem` intro and project `h1` values are *estimates* to be confirmed in 2.2, not values to copy.
2. **There is no SASS compiler.** `assets/sass/**` and `assets/css/main.css` are both shipped artifacts. Every task below that edits SASS mirrors the same resolved values into `main.css` in the *same* task, per the design's Compiled Stylesheet Sync Procedure. No task leaves the two artifacts divergent.
3. **`.github/workflows/static.yml` deploys the whole repo to production on every push to `main`, with no staging environment, and `main` is the current branch.** All work goes on a feature branch reviewed by PR. Task 14 is the pre-push verification gate.

Values, selectors, `@font-face` blocks, the `$font` map target state, the seven Chrome_Text sites, the provenance schema, and the 13 correctness properties are all fixed in `design.md`. Tasks reference them; they do not re-derive them.

## Tasks

- [ ] 1. Acquire fonts and record provenance
  - [ ] 1.1 **[MANUAL — OWNER ACTION, BLOCKS ALL OTHER FONT AND CSS WORK]** Download both faces from official channels and store them with their licence texts
    - Horizon (Alberto Fontense), free personal-use tier: download from the designer's own channel — VP Creative Shop or Creative Market (`https://edocs.creativemarket.com/fontense/2189003-Horizon-Wide-Sans-Serif`). Take the **WOFF2** face. Exactly one solid face; do not take Outline / Outline Two / Lines / Lines Two (decorative styles, not weights).
    - Telegraf (Pangram Pangram Foundry), free personal-use tier: download from `https://pangrampangram.com/products/telegraf/`. Take the **OTF or TTF exactly as supplied** — do not convert, subset, rename internal font data, or re-save. The free tier grants no WOFF/WOFF2, so a converted file would leave the site with no licensed delivery route (Req 9 c6 is load-bearing for the Req 2 c3 delivery path).
    - **`fontdownloader.net` and any other aggregator or mirror is forbidden as a download source** (Req 9 c1), even though it informed the requirements.
    - Place the font files under `assets/webfonts/` alongside the existing Font Awesome files. Do not touch, rename, or re-save any `fa-*` file (Req 7 c7).
    - Store the supplied licence text as `assets/webfonts/Horizon-LICENSE.txt` and `assets/webfonts/Telegraf-LICENSE.txt` (Req 9 c2).
    - _Requirements: 2.1, 9.1, 9.2, 9.6_

  - [ ] 1.2 Create `assets/webfonts/FONT-PROVENANCE.md` with one record per font file
    - Use the field schema in design §4.4 verbatim: `file`, `family`, `designer`, `source_url`, `download_date`, `licence_tier`, `licence_text_file`, `format`, `converted`, `sha256`, `stored_bytes`, `content_encoding`, `transfer_bytes`.
    - Compute `sha256` and `stored_bytes` for each shipped file now. Set `converted: no`. Leave `content_encoding` and `transfer_bytes` as `TBD — Check H` (filled in task 15.1).
    - Add a short note that this file must be updated whenever a font file is added or replaced (Req 9 c8).
    - _Requirements: 9.2, 9.8_

- [ ] 2. Check G — font intake gate (resolves the three unknowns)
  - [ ] 2.1 Read Horizon's weight and Telegraf's shipped styles; select Branch A or Branch B
    - Run the `fontTools` snippet in design §3.1 against the Horizon file to read `OS/2.usWeightClass` and the subfamily name. This value becomes `$HORIZON_WEIGHT` and is written **identically** into `weight-heading` and the `@font-face` `font-weight` so no synthesized bold is ever possible (Req 3 c4). Expected `400`, but use what is reported.
    - Enumerate every Telegraf face in the download with its `usWeightClass` and whether a **true italic** exists (Req 4 c11).
    - **Select the branch and record the decision:** Branch A if a bold face ships (`weight: 400`, `weight-bold: 700`, both files ship); Branch B if not (`weight-bold` == `weight` == 400, one file ships, alternative emphasis per design §3.4, README note required). This resolves open Assumption 6.
    - Append an "Intake findings" section to `assets/webfonts/FONT-PROVENANCE.md` recording `$HORIZON_WEIGHT`, the Telegraf face inventory, italic availability, and the selected branch.
    - _Requirements: 2.4, 2.5, 2.16, 3.4, 4.3, 4.4, 4.11_

  - [ ] 2.2 Measure Horizon's advance widths and derive the intro and project `h1` sizes
    - Run the per-string measurement script in design §3.3 for `JEFFERY ROSS`, `JEFFERY`, and `HALLGRÍMSKIRKJA`.
    - Apply the design's formula with the chosen letter-spacing: `max_rem = AVAIL / ((width_em + LS × len) × root_px)`, using the measured geometry table (266.7px at 320px/13.33px root, 650.7px at 768px/14.67px root, 906.7px at 1024px, 1312.0px at 1440px). **768px is the binding constraint.** Take the minimum across 768/1024/1440, cap at 4rem, round *down* to the nearest 0.25rem.
    - Record the three derived values (intro `h1` default, intro `h1` `<=small`, project-page `h1`) in the Intake findings section. The design's 3.5rem / 2.75rem / 2.5rem are estimates — replace them with measured values if they differ.
    - If the derived cap falls below ~2.5rem, follow the design §3.3 escalation order (−0.02em letter-spacing, then `<=medium` intro padding 4rem→2rem with owner sign-off, then escalate the Req 3 c6 vs c12 conflict). Do **not** mid-word-break the intro name.
    - _Requirements: 3.6, 3.12, 3.13_

  - [ ] 2.3 Audit glyph coverage for the three non-ASCII codepoints used on the site
    - Confirm U+00ED (í), U+00D7 (×), U+00B7 (·) are present in the `cmap` of both faces. U+00ED appears in **heading** text ("Hallgrímskirkja" on `church.html` and `index.html`), so Horizon itself must carry it — a gap here changes the design rather than merely failing a test.
    - Confirm the declared `unicode-range` (`U+0000-00FF, U+0100-017F, U+2000-206F, U+2212`) sits inside each face's real coverage (Req 3 c15).
    - Record results in the Intake findings section.
    - _Requirements: 2.9, 3.15, 3.16, 4.14_

- [ ] 3. Set up verification tooling and keep it out of the deployed site
  - [ ] 3.1 Create `tools/typography-check/` with its own manifest and harness
    - `tools/typography-check/package.json` declaring `fast-check` and `playwright` as dev dependencies, and a `test` script running `node --test`. The manifest lives here, not at the repository root, so the site stays a plain static tree.
    - Shared fixtures module exporting the nine Content_Page paths, the four viewport widths (320, 768, 1024, 1440), the in-scope element role selectors (Heading_Text, Body_Text, Chrome_Text per the glossary, with `#nav .links a` routed to Chrome_Text and `#header .logo` excluded per conflict C6), a WCAG 2.1 relative-luminance contrast helper that alpha-composites `rgba()` over its resolved backdrop, and a Playwright helper that launches headless with `--no-sandbox` and caches one context per (page, viewport, font-state) triple.
    - Webfont-blocking helper using Playwright request interception to abort `assets/webfonts/{Horizon,Telegraf}*`, for the `webfonts-blocked` font state.
    - Every property test in this plan runs a **minimum of 100 iterations** via `fc.assert(..., { numRuns: 100 })` and carries a comment naming its design property, per design Testing Strategy.
    - _Requirements: 7.3, 8.1_

  - [ ] 3.2 Add a prune step to `.github/workflows/static.yml`
    - Insert a `Prune non-site files` step running `rm -rf tools .kiro` between `Checkout` and `Setup Pages`, exactly as design Testing Strategy specifies. The workflow uploads `path: '.'`, so without this the verification tooling and the spec documents are published.
    - This runs against the ephemeral CI checkout only; it must not delete anything from the repository.
    - _Requirements: 9.4_

- [ ] 4. Checkpoint — intake gate closed
  - Confirm `$HORIZON_WEIGHT`, the Telegraf face inventory, the selected branch, the derived `h1` values, and the glyph audit are all recorded. Confirm `npm ci && npm test` runs in `tools/typography-check/`. Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Declare the webfonts and remove Google Fonts
  - [ ] 5.1 Insert the `@font-face` blocks into `assets/css/main.css` and delete the Google Fonts `@import`
    - **Insert the `@font-face` blocks immediately AFTER the Font Awesome `@import` on line 1, never before it.** CSS requires all `@import` rules to precede other rules; a rule placed above line 1 invalidates the Font Awesome import and breaks every icon on all nine pages (Req 7 c6).
    - Delete the Google Fonts `@import` on line 2 (`Merriweather` + `Source Sans Pro`).
    - Use the exact blocks in design §3.2, substituting the real filenames and the `$HORIZON_WEIGHT` from task 2.1. One rule per file; `font-family` identical to the head of the corresponding stack; `font-weight` equal to the referenced file's weight; `font-display: swap`; the `unicode-range` from §3.2.
    - **The `format()` hint must match the file's actual format:** `woff2` for Horizon, `opentype` for a `.otf` Telegraf file, `truetype` for a `.ttf` one. If the download supplied `.ttf`, the extension and the hint change together.
    - Paths relative to `main.css` (`../webfonts/…`) with no scheme and no host.
    - Ship the Telegraf bold `@font-face` block **only under Branch A**; omit it entirely under Branch B.
    - _Requirements: 2.2, 2.3, 2.6, 2.7, 2.8, 2.9, 2.11, 2.14, 6.6, 7.6_

  - [ ]* 5.2 Write property test for bundle/declaration agreement and budget
    - **Property 9: Bundle and declarations agree, within budget**
    - Determine each file's format from its real **sfnt signature**, not its extension. Exclude the fifteen `fa-*` files from the size bounds by name (they total ~2.9 MB and would swamp the 600 KB budget).
    - **Validates: Requirements 2.2, 2.3, 2.5, 2.6, 2.8, 2.12, 2.13, 2.16, 4.3**

  - [ ]* 5.3 Write property test for glyph coverage
    - **Property 7: Every character used is a character the font can render**
    - **Validates: Requirements 2.9, 3.15, 3.16, 4.14**

  - [ ]* 5.4 Write property test for font provenance
    - **Property 11: Every font file is provably the vendor's, from the vendor**
    - Include the explicit `fontdownloader.net` denylist entry and assert `converted: no` and SHA-256 equality with the recorded vendor hash.
    - **Validates: Requirements 9.1, 9.2, 9.6, 9.8**

- [ ] 6. Update the token model
  - [ ] 6.1 Rewrite the `$font` map and add the `alt.fg-link` palette key in `assets/sass/libs/_vars.scss`, mirroring into `assets/css/main.css`
    - `$font` target state per design §3.1: `family` → `('Telegraf', 'Helvetica Neue', 'Segoe UI', Roboto, sans-serif)`; `family-heading` → `('Horizon', 'Arial Black', Verdana, 'Trebuchet MS', sans-serif)` (widest-first per Req 6 c1); `family-fixed` unchanged; `weight` 300→400; `weight-bold` 700 (Branch A) or 400 (Branch B); `weight-heading` 900→`$HORIZON_WEIGHT`.
    - **Add the new `letter-spacing-heading: 0.05em` key.** `assets/sass/components/_pagination.scss:31` already reads `_font(letter-spacing-heading)` — a key that does not exist. Because there is no compiler this has never been evaluated; it would error on the first SASS run. Adding the key fixes that latent bug and centralises Req 5 c8. Also remove the now-dead duplicate `letter-spacing: 0.075em` on the preceding line 30.
    - **Add `fg-link: #4a5158` to the `alt` palette map as a new key. Do NOT edit `alt.fg` or `alt.fg-bold`** — `#717981` resolves at 15 sites in the compiled CSS and editing it would recolour the footer `h3`, social icons, table `th`, and pagination links, violating Req 1 c10/c11 (conflict C1). Every existing palette value stays byte-identical.
    - Mirror into `main.css`: `family-heading` resolves at **11** sites — change all of them, not the first. Quote family names as the compiler would emit them (`"Telegraf", "Helvetica Neue", "Segoe UI", Roboto, sans-serif`).
    - _Requirements: 3.1, 3.4, 4.1, 4.3, 5.8, 6.1, 6.2, 6.3, 7.1, 7.2, 7.4, 8.7_

  - [ ]* 6.2 Write property test for forbidden tokens, off-origin fonts, and inline typography
    - **Property 6: No forbidden token, no off-origin font, no inline typography**
    - Scope the inline-style oracle to the five typography properties specifically — `index.html` legitimately carries `style="--project-image: url(…)"` on every card, and a blanket ban produces seven false failures.
    - **Validates: Requirements 2.7, 2.11, 2.14, 7.4, 7.9, 7.10, 8.4**

- [ ] 7. Apply the heading type scale and overflow safety
  - [ ] 7.1 Set heading sizes, weight, letter-spacing, and line-height in `assets/sass/base/_typography.scss` and `assets/sass/layout/_intro.scss`, mirroring into `assets/css/main.css`
    - `h1`–`h6` letter-spacing `0.075em` → **`-0.01em`** (Req 3 c7 range −0.02em…0.02em); base `line-height` `1.5` → **`1.3`** (Req 3 c8 range 1.20–1.50).
    - `h2`–`h6` sizes are already correct per Req 3 c5 (1.75 / 1.25 / 1 / 0.9 / 0.8rem) — re-declare unchanged and confirm the strictly-decreasing ≥0.1rem scale holds with base `h1` at 4rem.
    - Intro `h1`: replace the current **5rem** with the value derived in task 2.2 (design estimate 3.5rem), and the `<=small` **3.25rem** override with the derived small value (estimate 2.75rem). Both declarations change, not one (finding F4). Intro `h1` `line-height` `1` → **`1.1`** (Req 3 c8 range 1.05–1.20).
    - Project-page `h1` (`body.project-page … header.major > h1`): 3.25rem → derived value (estimate 2.5rem).
    - Preserve `text-transform: uppercase` and `fg-bold` colour resolution (Req 3 c9). Do not touch the root font-size steps (Req 3 c10).
    - _Requirements: 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 7.1, 7.2_

  - [ ] 7.2 Add `overflow-wrap: break-word` to `h1`–`h6` in `assets/sass/base/_typography.scss`, mirroring into `assets/css/main.css`
    - "Hallgrímskirkja" is 15 characters with no break opportunity and **already overflows today** at 320px (357.5px needed vs 266.7px available) — a pre-existing defect. No font-size reduction fixes it; Horizon makes it worse. `overflow-wrap` is required for Req 3 c11, not advisory (finding F6 / risk R2).
    - Add `hyphens: auto` where supported. Apply to headings generally; do **not** apply mid-word breaking to the intro `h1`, which would split a person's name across lines.
    - _Requirements: 3.11, 3.13, 6.7_

  - [ ]* 7.3 Write property test for token-model resolution
    - **Property 4: Every element resolves to the token model**
    - The weight clause is the high-value one — it fails on any surviving hardcoded `font-weight: 700` against a single-weight Horizon.
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.7, 3.8, 3.10, 4.2, 4.5, 4.6, 4.11, 4.12, 5.1, 5.2, 5.8, 6.3**

  - [ ]* 7.4 Write property test for overflow and containment in both font states
    - **Property 5: Nothing overflows, in either font state**
    - Generate skills labels **longer than any current content** — today's maximum is exactly 20 characters, so real content never exercises the wrap path.
    - **This property is expected to fail until task 7.2 (`overflow-wrap`) and task 10.3 (elastic pill) have both landed.** A red result before then is the design's prediction, not a mistake.
    - **Validates: Requirements 3.11, 3.12, 3.13, 4.9, 5.4, 5.7, 6.7, 6.8, 6.9, 6.10**

- [ ] 8. Apply body text treatment
  - [ ] 8.1 Set body `line-height` and confirm body metrics in `assets/sass/base/_typography.scss`, mirroring into `assets/css/main.css`
    - `line-height` **2.375 → 1.7** (Req 4 c5 range 1.6–1.9). The old value was tuned for Merriweather's small x-height; Telegraf's larger x-height makes it read disconnected.
    - `font-size` stays `1rem`; `p { text-align: justify }` is retained (Req 4 c10); `family-fixed` untouched for `code`/`pre` (Req 4 c8).
    - Do **not** lower the root font-size steps — the smallest body size is 10pt = 13.33px, only 0.33px above the Req 4 c13 13px floor.
    - _Requirements: 4.5, 4.6, 4.8, 4.10, 4.13, 7.1, 7.2_

  - [ ] 8.2 **[BRANCH B ONLY — skip entirely under Branch A]** Add alternative emphasis for `strong`/`b`, mirroring into `assets/css/main.css`
    - Only unblocked once task 2.1 has selected the branch. Under Branch A, `strong`/`b` already resolve through `_font(weight-bold)` and nothing is needed here.
    - Under Branch B apply the design §3.4 block: `font-weight: _font(weight-bold)` (== `weight`, no delta), `font-synthesis: none`, `letter-spacing: 0.02em`, `background-color: rgba(24, 191, 239, 0.12)`, `padding: 0 0.15em`.
    - **Never apply `font-synthesis: none` globally or to `em`/`i`** — Req 4 c11 depends on the browser's synthesized oblique staying available within the Telegraf family, with no family substitution.
    - _Requirements: 4.4, 4.11, 4.12_

  - [ ]* 8.3 Write property test for fallback-state equality
    - **Property 13: Blocking the webfonts changes only the family**
    - Differential: compare two renders of the same page rather than either against a fixed expectation.
    - **Validates: Requirements 2.15, 6.4, 6.5**

- [ ] 9. Checkpoint — headings and body in place
  - Run Checks A–D locally. Properties 4, 6, 7, 9, 11, 13 should pass; Property 5 is still expected to fail pending task 10.3. Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Migrate small interface text off the heading font
  - [ ] 10.1 Route all seven Chrome_Text sites to the body font, mirroring each into `assets/css/main.css`
    - Each site changes `_font(family-heading)` → `_font(family)` **and** `_font(weight-heading)` → `_font(weight)` (Req 5 c2 — chrome must sit on a weight that actually ships). Chrome_Text currently inherits Horizon at sizes down to 0.55rem, where its tight closed apertures collapse.
    - The seven sites per design §3.5: `components/_button.scss:24` (skills + Read More), `components/_form.scss:73` (`label`), `components/_pagination.scss:26` (pagination links), `components/_table.scss:31` (`th`), `layout/_navPanel.scss:22` and `:84` (nav panel links), `layout/_footer.scss:188` (`#copyright`).
    - Also per conflict C6: route `#nav .links a` in `layout/_nav.scss` to `_font(family)`, and **keep `#header .logo` on `_font(family-heading)`** as a display element.
    - Chrome_Text letter-spacing `0.075em` → **`0.05em`** via the `letter-spacing-heading` key added in 6.1 (Req 5 c8 range 0.025–0.075em). Reduced deliberately: the longest skills label is exactly 20 characters ("Waterjet fabrication"), precisely at the Req 5 c4 single-line boundary.
    - Preserve the uppercase transform and background treatment of the skills and Read More buttons (Req 5 c5).
    - _Requirements: 5.1, 5.2, 5.5, 5.8, 7.1, 7.2, 7.4_

  - [ ] 10.2 Replace all three hardcoded values on the card `h2` in `assets/sass/layout/_main.scss` (~line 358-364), mirroring into `assets/css/main.css`
    - `font-family: Merriweather, Georgia, serif` → `_font(family-heading)`.
    - `font-weight: 700` → `_font(weight-heading)`. **This one matters as much as the family:** left in place against a single-weight Horizon it triggers exactly the browser-synthesized bold Req 3 c4 forbids.
    - `letter-spacing: 0` → `_font(letter-spacing-heading)`.
    - Retain `font-size: 1.1rem` and `text-transform: none` — deliberate card-design choices (conflict C5).
    - This is the only literal typeface name outside the `$font` map and the `@font-face` rules; removing it satisfies Req 7 c4.
    - _Requirements: 3.3, 3.4, 7.4_

  - [ ] 10.3 Make the skills pill vertically elastic in `assets/sass/layout/_main.scss`, mirroring into `assets/css/main.css`
    - Req 5 c7 requires an over-wide label to wrap **inside the card** with every character visible. That is impossible today: `body.home #main .button.skills` sets `white-space: nowrap`, `height: 1.7rem`, `line-height: 1.55rem`, and `body.home #main .skills-box` sets `flex-wrap: nowrap` — a wrapped label would be clipped even if it wrapped.
    - Apply the design §3.5 block: container `flex-wrap: wrap`; pill `white-space: normal`, `height: auto`, `min-height: 1.7rem` (preserves the silhouette), `line-height: 1.4` (must be a ratio once multi-line), `padding: 0.15rem 0.4rem` (restores vertical centring without a fixed height).
    - Leave background, border, radius, and uppercase treatment untouched (Req 5 c5).
    - _Requirements: 5.4, 5.5, 5.7_

  - [ ]* 10.4 Write property test for per-role cross-page invariance
    - **Property 3: Typography is invariant across pages, per role**
    - Compare **per role, not per tag** (conflict C5: base `h2` 1.75rem, card `h2` 1.1rem, post `h2` 1.5rem legitimately differ), and skip a page on which a role does not appear rather than failing it (`cad.html` has no `h1` and no `h2`).
    - **Validates: Requirements 1.3, 1.8, 4.13, 5.3, 8.1, 8.2, 8.3, 8.9**

- [ ] 11. Darken the footer email link
  - [ ] 11.1 Add the targeted footer email link rules in `assets/sass/layout/_footer.scss`, mirroring into `assets/css/main.css`
    - Selector **`#footer a[href^="mailto:"]`**. Chosen because the nine pages carry two different footer nesting depths (index/arduino/cad/calculator/church/fluid_sim nest one level deeper than killerbyte/launchtoy/vexlego); an attribute selector matches all nine identically with **no markup edits** (Req 1 c3, c9; Req 8 c5).
    - Default state: `color` and `border-bottom-color` both `#4a5158` (7.38:1 measured). **The underline must be solid** — the inherited `rgba(113,121,129,0.5)` composites to `#b3b7bb` = 1.85:1 and fails Req 1 c7; even `rgba(74,81,88,0.5)` reaches only 2.33:1 (finding F3).
    - Hover: `color: #18bfef !important` (the accent Req 1 c4 mandates) with `border-bottom-color: #4a5158` kept solid — the generic `#footer a:hover` sets `border-bottom-color: transparent`, which is at best an ambiguous Req 1 c7 pass.
    - Focus: `:focus-visible { outline: 2px solid #212931; outline-offset: 2px; }`. `outline` rather than a border so the indicator spans the full text box and cannot alter layout; because `outline` and `color` are independent, the ring survives simultaneous hover as Req 1 c6 demands.
    - No new transition — the inherited `a` transition is 0.2s on `color` and `border-color`, inside the Req 1 c4/c5 bound. Existing `0.8rem` sizing satisfies Req 1 c8 unchanged.
    - **Touch no other footer colour.** The `<h3>Email</h3>` label, social icon links, and `#copyright` keep their exact pre-change values (Req 1 c10, c11).
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 7.1, 7.2_

  - [ ]* 11.2 Write property test for declared colour contrast, with the accepted-exceptions allowlist
    - **Property 1: Every declared colour pair meets its contrast threshold**
    - Alpha-composite every `rgba()` value over its resolved backdrop before measuring — the defect this catches is precisely a translucent underline that looks fine and measures 1.85:1.
    - **Encode the accepted-exceptions set with exactly two entries, and do not "fix" either:** `#footer h3` Heading_Text at **4.05:1** (conflict C2) and `#copyright` `rgba(255,255,255,0.25)` on `#1e252d` → `#565c62` at **2.29:1** (conflict C3). The owner ruled **email-link-only**, so Req 1 c11 wins over Req 3 c14 and Req 5 c6. Both are reported as *known-and-accepted* with their conflict IDs, not as failures.
    - The set must fail in three ways: a tuple outside it missing its threshold; a tuple inside it whose measured ratio no longer equals the recorded value at two-decimal precision (in **either** direction — a fix must retire the entry); and it must never be silently extended. Adding a third entry is an owner scope decision, not a test fix.
    - The hover accent (conflict C4, 1.98:1) is **not** an entry — Req 1 c4 mandates it, so scope the transient hover state out of the ≥4.5:1 Body_Text clause instead.
    - **Validates: Requirements 1.1, 1.2, 1.6, 1.7, 3.14, 4.7, 5.6**

  - [ ]* 11.3 Write property test for focus and hover state behaviour
    - **Property 10: Focus and hover states behave as declared**
    - Geometric and state-machine oracle (thickness, extent, retention under simultaneous hover); the indicator's contrast is Property 1's business.
    - **Validates: Requirements 1.4, 1.5, 1.6**

- [ ] 12. Document the change
  - [ ] 12.1 Update `README.md` with credits, the regeneration procedure, and any Branch B limitation
    - Credits section: Horizon → Alberto Fontense, Telegraf → Pangram Pangram Foundry, each with its licence tier (Req 9 c3).
    - Reproduce the six-step Compiled Stylesheet Sync Procedure from the design, in execution order, naming every file edited or produced and stating how parity is verified (Req 7 c5). Include the last-declaration-wins note: `#footer` already carries `color` twice from the `color(alt)` mixin, so a checker reading the first match reports a false failure.
    - **Under Branch B only:** record the missing-bold limitation and the alternative emphasis treatment in the Credits or typography notes section (Req 4 c4).
    - _Requirements: 4.4, 7.5, 9.3_

- [ ] 13. Cross-cutting verification
  - [ ]* 13.1 Write property test for the intended-delta allowlist
    - **Property 8: Everything outside the intended delta is byte-identical to the baseline**
    - The allowlist *is* the specification of scope: every `$palette` entry (additive `alt.fg-link` excepted), footer `h3` / social icon / `#copyright` colours, heading `text-transform` and colour resolution, skills and Read More background and uppercase treatment, every `mailto:` href and visible text, every nav and project `href` resolving to a file present in the repo, the set/count/order/nesting of the six element groups on every page, and the name, count, and SHA-256 of all fifteen pre-existing Font Awesome files.
    - **Validates: Requirements 1.9, 1.10, 1.11, 3.9, 5.5, 7.7, 8.5, 8.7, 8.8**

  - [ ]* 13.2 Write property test for SASS/compiled-CSS parity
    - **Property 2: Compiled CSS is value-identical to the resolved SASS source**
    - Apply **last-declaration-wins** within each rule. Also assert zero occurrences of `Merriweather` and `Source Sans Pro` in both artifacts.
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.8**

  - [ ]* 13.3 Write property test for commercial-use markers
    - **Property 12: No page contains a commercial-use marker**
    - Both licences are conditioned on non-commercial use, an obligation that outlives this change. Running this on every invocation turns it into a detectable failure.
    - **Validates: Requirements 9.4**

  - [ ]* 13.4 Write integration guards for Font Awesome and page scripts (Checks E and F)
    - Check E: every Font Awesome icon renders on all nine pages with no missing-glyph substitution — the guard that the `@font-face` insertion point did not displace the `@import` (Req 7 c6).
    - Check F: the water particle canvas from `assets/js/waterParticles.js` initialises and animates, and the hover / expand / Read More interactions from `assets/js/projectCards.js` respond, with no uncaught console error.
    - One run each, not property tests — these do not vary with input.
    - _Requirements: 7.6, 8.6_

- [ ] 14. Checkpoint — pre-push verification gate
  - **Do not push to `main`.** `.github/workflows/static.yml` deploys the whole repository to production on every push to `main` and there is no staging environment. Commit this work as **one revertible commit** on a feature branch and open a PR for review; `git revert` of that single commit fully restores the previous typography.
  - Run `cd tools/typography-check && npm ci && npm test` (Checks A–F) against the working tree. All 13 properties and both integration checks must pass, including Property 5, which task 7.2 and task 10.3 have now unblocked.
  - Confirm Property 1 passes with its two accepted exceptions reported as known-and-accepted. A red Property 1 means one of three real things: a new contrast regression outside the set, an accepted ratio drifting from its recorded value, or an entry added without an owner decision.
  - Confirm zero occurrences of `Merriweather` and `Source Sans Pro` in both artifacts, and that the `@font-face` blocks sit after the Font Awesome `@import`.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Record post-deploy transfer measurements
  - [ ] 15.1 Run Check H against the live origin and fill in the provenance record
    - **Sequenced after the PR merges and the workflow deploys, by necessity** — Req 2 c10, c17, and c18 are assertions about the deployed GitHub Pages origin's compression and same-origin behaviour, which cannot be measured before the fonts are live.
    - Run the `curl` procedure in design §4.5 for each font file. `--compressed` advertises gzip/br so the response reflects what a real browser receives.
    - Record the measured `Content-Encoding` and `transfer_bytes` for every file in `assets/webfonts/FONT-PROVENANCE.md`, replacing the `TBD — Check H` placeholders. `font/otf` is commonly not compressed by GitHub Pages, so `identity` with `transfer_bytes == stored_bytes` is the expected result and `gzip` with a smaller count is a bonus. Either outcome changes nothing in the CSS.
    - The same run doubles as the Req 2 c10 same-origin check — `http=200` for every file.
    - _Requirements: 2.10, 2.17, 2.18, 9.8_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP.
- **Tasks 1.1 and 2.x gate everything else.** Task 1.1 is a manual owner action that cannot be automated; tasks 2.1–2.3 convert the design's estimates into measured facts. No CSS is written before task 4's checkpoint closes.
- **Task 8.2 is unblocked only once task 2.1 selects Branch A vs Branch B.** Under Branch A it is skipped entirely; under Branch B it is required, along with the README note in task 12.1 and the omission of the bold `@font-face` block in task 5.1.
- Every task that edits SASS mirrors the resolved values into `assets/css/main.css` in the same task. There is no compiler, and `main.css` is what browsers execute.
- Property 5 is expected to fail until tasks 7.2 and 10.3 land. That is the design's prediction, not a defect in the plan.
- Property 1's accepted-exceptions set carries two owner-ruled shortfalls that must **not** be fixed under this spec.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1", "3.2"] },
    { "id": 1, "tasks": ["1.2", "13.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "5.4"] },
    { "id": 4, "tasks": ["2.3"] },
    { "id": 5, "tasks": ["5.1"] },
    { "id": 6, "tasks": ["6.1", "5.2", "5.3"] },
    { "id": 7, "tasks": ["7.1", "6.2"] },
    { "id": 8, "tasks": ["7.2"] },
    { "id": 9, "tasks": ["8.1"] },
    { "id": 10, "tasks": ["8.2"] },
    { "id": 11, "tasks": ["10.1"] },
    { "id": 12, "tasks": ["10.2"] },
    { "id": 13, "tasks": ["10.3", "7.3", "7.4"] },
    { "id": 14, "tasks": ["11.1", "8.3", "10.4"] },
    { "id": 15, "tasks": ["12.1", "11.2", "11.3"] },
    { "id": 16, "tasks": ["13.1", "13.2", "13.4"] },
    { "id": 17, "tasks": ["15.1"] }
  ]
}
```
