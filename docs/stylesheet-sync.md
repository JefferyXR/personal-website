# Compiled stylesheet sync procedure

**There is no SASS compiler in this repository.** `assets/sass/**` and `assets/css/main.css`
are *both* shipped artifacts, and `main.css` is the one browsers execute. A correct SASS edit
with a forgotten CSS mirror is invisible until a visitor notices it, which is why this
procedure exists and why the steps that look like trivia are the ones that catch real
breakage.

There is also no staging environment: `.github/workflows/static.yml` deploys the whole
repository to GitHub Pages on every push to `main`. Verify **before** pushing, not after.

Every typography or footer-layout change follows these steps **in order**.

---

## 1. Edit the SASS source

`assets/sass/libs/_vars.scss` **first** — the `$font` map and the `$palette` maps — because
every rule-level file reads values out of those maps and a map value settled afterwards means
editing the rules twice.

Then the rule-level files:

- `assets/sass/base/_typography.scss`
- `assets/sass/layout/_intro.scss`
- `assets/sass/layout/_main.scss`
- `assets/sass/layout/_footer.scss`
- `assets/sass/layout/_nav.scss`
- `assets/sass/layout/_navPanel.scss`
- `assets/sass/components/_button.scss`
- `assets/sass/components/_form.scss`
- `assets/sass/components/_pagination.scss`
- `assets/sass/components/_table.scss`

## 2. Resolve each map reference by hand

There is no compiler, so a person expands the lookups. Quote family names exactly as the
compiler would emit them:

| Reference | Resolves to |
|---|---|
| `_font(family)` | `"PP Telegraf", "Helvetica Neue", "Segoe UI", Roboto, sans-serif` |
| `_font(family-heading)` | `"Horizon", "Arial Black", Verdana, "Trebuchet MS", sans-serif` |
| `_font(weight)` / `_font(weight-bold)` / `_font(weight-heading)` | `400` / `800` / `700` |
| `_font(letter-spacing-heading)` | `0.05em` |
| `_palette(alt, fg-link)` | `#3a4148` |

## 3. Apply the change at **every** location in `assets/css/main.css`

Map-driven values appear many times. `family-heading` resolved at **11** sites when this
procedure was first written; the body stack currently resolves at 10 and the heading stack at
3, plus the `@font-face` rules. **Change all of them, not the first one you find** — changing
the first is the default mistake, and it ships two different values for one token.

Change Set 3's four compiled sites, for reference: the `#copyright ul`, `#copyright ul li` and
`#copyright ul li:first-child` rules and the `max-width: 480px` block that reverts them; and
the `font-weight` declarations in the `#navPanelToggle` rule and the `#navPanel .links li a`
rule. **The `font-weight: 900` in `#navPanelToggle:before` is Font Awesome's and is not one of
them.** Line numbers move whenever a comment is added, so locate these by selector rather than
by the numbers recorded in the spec, which were taken before Change Set 3's comments existed.

## 4. Keep the `@import` / `@font-face` order

`@import url(fontawesome-all.min.css)` stays on **line 1** of `assets/css/main.css` and every
`@font-face` block stays **below** it. CSS requires every `@import` to precede all other
rules, so an `@font-face` placed above line 1 silently invalidates the Font Awesome import and
**every icon on all nine pages disappears** (Req 7 c6). Nothing errors; the glyphs simply stop
rendering.

## 5. Verify parity

For every selector governing heading, body or small-interface text, the value resolved from
the SASS must equal the value declared in `main.css`, with zero differing declarations across
the nine pages. Run the checks:

```bash
cd tools/typography-check && npm ci && npx playwright install chromium && npm test
```

**When comparing, apply last-declaration-wins within each rule.** The compiled CSS
legitimately carries the same property twice in one rule, and a checker that reads the *first*
match reports a false failure. Three live instances, all pre-existing, all harmless, all
identical in both artifacts, and **all left exactly as they are**:

| Rule | Duplicate | Why it matters |
|---|---|---|
| `#footer` | `color: #717981` then `color: #909498` | an artifact of the `color(alt)` mixin |
| `#copyright` | `color` twice, also from `color(alt)` | **the first value is the mixin's opaque `#ffffff`, not the value that renders.** The block paints the *second* declaration, `rgba(255, 255, 255, 0.65)`. A maintainer who trusts the first `color` here will conclude the copyright bar is opaque white and compute a contrast ratio for a colour that is never painted |
| `#navPanel .links li a` | `font-size: 0.9rem` twice (`_navPanel.scss:85–86`, mirrored in `main.css`) | added by Change Set 3's neighbourhood; this is the rule where a maintainer will actually meet the behaviour |

**Skills pill geometry is measured in a browser *before* it is mirrored, not after.** The pill
box depends on layout — the card's content width, the skills-row flex gap, how many pills share
a row — none of which font metrics can predict. Run `node pill-geometry.mjs`, read the ratios,
*then* write the values.

The same rule applies to the two Change Set 3 geometries, for the same reason: `node
divider-geometry.mjs` for the Copyright_Divider position and the Copyright_Row height, and
`node navpanel-geometry.mjs` for the nav panel toggle's border box and its clearance from the
`#header` title. **The label substitution those checks need is performed at runtime, in the
page under test, and never by editing the nine pages.**

Also verify, for the documentation half of the change: `README.md` at **40 lines or fewer**
with every Markdown link resolving **against the repository**, and `docs` present in the
`static.yml` prune step. Property 18 is the authority there, as Property 16 is for step 7.

## 6. Confirm the zero-occurrence rules

These are zero-occurrence rules, not replacement rules — a partial replacement that leaves one
mirror behind ships two different values:

- `Merriweather` — zero occurrences in both artifacts (Req 7 c9)
- `Source Sans Pro` — zero occurrences in both artifacts (Req 7 c9)
- `#4a5158`, the superseded footer link colour — zero occurrences in either artifact as a link
  or underline colour, **including inside comments** that would otherwise document a value the
  source no longer sets (Req 1 c13)
- `scroll-behavior` and `prefers-reduced-motion` — zero **declarations** in either artifact.
  Strip comments before the scan: the surviving comment names both properties deliberately, so
  a text search reports a false positive on the very note that explains the removal.

## 7. Apply any Copyright_Block markup change to all nine pages

Steps 1–6 cover the stylesheet pair only. This step exists because `div#copyright` is
hand-written per page. After editing, verify the inner `<ul>…</ul>` is **byte-identical**
across all nine. Three pages (`killerbyte.html`, `launchtoy.html`, `vexlego.html`) write the
whole div on one source line and six write it multi-line, so the *surrounding* whitespace
legitimately differs while the inner markup must not — edit in place rather than reformatting.

The current wording contains **no ampersand**; do not reintroduce an entity. `vexlego.html`
used to write `&amp;` where the others wrote a bare `&`, which is exactly the divergence
per-page hand editing produces.

Change Set 3 edits **no** page: Req 15 c12 forbids touching the Copyright_Block markup and
Req 17 c13 restricts the documentation change to three files, so all nine pages are
byte-identical to their pre-change state and are checked that way.

## 8. Do not re-add the CSS smooth scroll

Carried forward, and guarded at the line where someone would re-add it: the
`DO-NOT-REINTRODUCE` comments at `assets/sass/base/_page.scss:31–41` and
`assets/css/main.css:145–155`. A global `scroll-behavior: smooth` on the scrolling element
defeats `jquery.scrolly`, which animates with `.animate({scrollTop}, 1000)`: jQuery writes
`scrollTop` once per frame and every write starts its own smooth scroll, so the intro
down-arrow does not visibly move until the 1000 ms animation ends. Measured at 1440px:
**1056 ms** to first movement with smooth, **48 ms** with auto. The control still *lands*
correctly, which is why a final-position assertion passed it — Check J
(`tools/typography-check/scroll-latency.test.mjs`) adds the timing clause that catches it.

---

## Licence conditions the repository has to keep

**The HTML5 UP credit in `README.md` and in the footer of all nine pages is a licence
condition, not an acknowledgement.** The Massively template is used under Creative Commons
Attribution 3.0, which attaches attribution to *adaptations* as well as verbatim copies, so the
extent to which this site has diverged from the published demo does not discharge it. HTML5 UP
sells attribution-free usage separately through Pixelarity, which is the only supported route
to removing the credit. Do not drop it while compacting either file. *Licence terms are
summarised, not quoted; the linked licence page is authoritative.*

### Font licensing: a standing obligation, not a one-time check

Both typefaces are used under free personal-use grants, and **both hold only while this site
remains a personal, non-commercial job-application showcase.** That is a standing obligation
that survives future content changes: if any page ever advertises paid services, freelance or
contract availability, rates, sponsorship, affiliate content, or any other monetisation, both
grants lapse and paid licences must be bought **before the next deploy** — including a Pangram
Pangram **Web** licence scoped to this domain and its monthly pageview tier for Telegraf, and
a commercial licence from the designer for Horizon.

Per-file source URLs, download dates, licence tiers, SHA-256 hashes, stored sizes, the declared
weights inventory (`weight-heading` 700 against `Horizon.woff2`, `weight` 400 against
`PPTelegraf-Regular.otf`, `weight-bold` 800 against `PPTelegraf-Ultrabold.otf`) and the
no-italic-face note are all in
[`assets/webfonts/FONT-PROVENANCE.md`](../assets/webfonts/FONT-PROVENANCE.md). That record is
the authority for provenance; this document does not duplicate it.

---

## Why `docs/` is pruned from the deployed site

`.github/workflows/static.yml` uploads `path: '.'` with no build step, so everything the CI
checkout retains is published. Its prune step removes `tools`, `.kiro` and `docs` from the
**ephemeral checkout** — never from the repository — because all three are repository content
rather than site content.

The intended consequence, recorded so it is not later mistaken for a broken link: the README's
link to `docs/stylesheet-sync.md` resolves **on GitHub**, which is where the README is
actually read, and does **not** resolve on the deployed Pages origin, where nothing links to
the README at all. Link checks therefore resolve relative targets against the repository; one
pointed at the live site would report a false failure on a file whose absence is the design.
