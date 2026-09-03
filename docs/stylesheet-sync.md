# Stylesheet maintenance notes (`assets/css/main.css`)

`assets/css/main.css` is the stylesheet **source**, not a build output. There is no SASS tree
and no compiler in this repository, so a change is made here once and there is nothing to
mirror it into.

There is also no staging environment: `.github/workflows/static.yml` deploys the whole
repository to GitHub Pages on every push to `main`. Verify **before** pushing, not after:

```bash
cd tools/typography-check && npm ci && npx playwright install chromium && npm test
```

The rest of this file is the short list of things about `main.css` that are not obvious from
reading it, and that break the site quietly when they are got wrong.

---

## 1. Keep the `@import` / `@font-face` order

`@import url(fontawesome-all.min.css)` stays on **line 1** of `assets/css/main.css` and every
`@font-face` block stays **below** it. CSS requires every `@import` to precede all other rules,
so an `@font-face` placed above line 1 silently invalidates the Font Awesome import and **every
icon on all nine pages disappears** (Req 7 c6). Nothing errors; the glyphs simply stop
rendering.

## 2. The zero-occurrence rules

These are zero-occurrence rules, not replacement rules — a partial replacement ships two
different values for one token:

- `Merriweather` — zero occurrences (Req 7 c9)
- `Source Sans Pro` — zero occurrences (Req 7 c9)
- `#4a5158`, the superseded footer link colour — zero occurrences as a link or underline
  colour, **including inside comments** that would otherwise document a value the stylesheet no
  longer sets (Req 1 c13)
- `scroll-behavior` and `prefers-reduced-motion` — zero **declarations**. Strip comments before
  the scan: the surviving comment names both properties deliberately, so a text search reports a
  false positive on the very note that explains the removal.

## 3. Do not re-add the CSS smooth scroll

Guarded at the line where someone would re-add it: the `DO NOT REINTRODUCE` comment in the
`html` rule near the top of `assets/css/main.css`. A global `scroll-behavior: smooth` on the
scrolling element defeats `jquery.scrolly`, which animates with `.animate({scrollTop}, 1000)`:
jQuery writes `scrollTop` once per frame and every write starts its own smooth scroll, so the
intro down-arrow does not visibly move until the 1000 ms animation ends. Measured at 1440px:
**1056 ms** to first movement with smooth, **48 ms** with auto. The control still *lands*
correctly, which is why a final-position assertion passed it — Check J
(`tools/typography-check/scroll-latency.test.mjs`) adds the timing clause that catches it.

## 4. Read declarations as last-declaration-wins

`main.css` legitimately carries the same property twice in one rule, so a reader — human or
checker — that takes the *first* match draws the wrong conclusion. Two live instances, **both
left exactly as they are**:

| Rule | Duplicate | Why it matters |
|---|---|---|
| `#footer` | `color: #717981` then `color: #909498` | an artifact of the original `color(alt)` mixin output |
| `#copyright` | `color` twice | **the first value is the opaque `#ffffff`, not the value that renders.** The block paints the *second* declaration, `rgba(255, 255, 255, 0.65)`. A maintainer who trusts the first `color` will conclude the copyright bar is opaque white and compute a contrast ratio for a colour that is never painted |

## 5. Apply any `#copyright` markup change to all nine pages

`div#copyright` is hand-written per page, so this is the one change that `main.css` cannot
carry. After editing, verify the inner `<ul>…</ul>` is **byte-identical** across all nine.
Three pages (`killerbyte.html`, `launchtoy.html`, `vexlego.html`) write the whole div on one
source line and six write it multi-line, so the *surrounding* whitespace legitimately differs
while the inner markup must not — edit in place rather than reformatting.

The current wording contains **no ampersand**; do not reintroduce an entity. `vexlego.html`
used to write `&amp;` where the others wrote a bare `&`, which is exactly the divergence
per-page hand editing produces.

---

## Licence conditions the repository has to keep

**The HTML5 UP credit in `README.md` and in the footer of all nine pages is a licence
condition, not an acknowledgement.** The Massively template is used under Creative Commons
Attribution 3.0, which attaches attribution to *adaptations* as well as verbatim copies, so the
extent to which this site has diverged from the published demo does not discharge it. HTML5 UP
sells attribution-free usage separately through Pixelarity, which is the only supported route to
removing the credit. Do not drop it while compacting either file. *Licence terms are summarised,
not quoted; the linked licence page is authoritative.*

### Font licensing: a standing obligation, not a one-time check

Both typefaces are used under free personal-use grants, and **both hold only while this site
remains a personal, non-commercial job-application showcase.** That is a standing obligation
that survives future content changes: if any page ever advertises paid services, freelance or
contract availability, rates, sponsorship, affiliate content, or any other monetisation, both
grants lapse and paid licences must be bought **before the next deploy** — including a Pangram
Pangram **Web** licence scoped to this domain and its monthly pageview tier for Telegraf, and a
commercial licence from the designer for Horizon.

Per-file source URLs, download dates, licence tiers, SHA-256 hashes, stored sizes, the declared
weights inventory (700 against `Horizon.woff2`, 400 against `PPTelegraf-Regular.otf`, 800
against `PPTelegraf-Ultrabold.otf`) and the no-italic-face note are all in
[`assets/webfonts/FONT-PROVENANCE.md`](../assets/webfonts/FONT-PROVENANCE.md). That record is the
authority for provenance; this document does not duplicate it.
