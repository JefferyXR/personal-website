# Personal Website

You can visit my website [here](https://jefferyxr.github.io/personal-website/index.html)

---

## Credits

- **Inspo:**  
  [Massively](https://html5up.net/massively) by [HTML5 UP](https://html5up.net) | @ajlkn  

- **Icons:**  
  [Font Awesome](https://fontawesome.io)  

- **Typefaces:**  
  - **Horizon** — headings — by **Alberto Fontense**, used under the designer's **free
    personal-use** tier ([Creative Market](https://edocs.creativemarket.com/fontense/2189003-Horizon-Wide-Sans-Serif)).
    A commercial licence is required for client work, commercial branding, or any
    monetised use.
  - **Telegraf** (`PP Telegraf`) — body and small interface text — by **Pangram Pangram
    Foundry**, used under the foundry's **free personal / non-commercial** tier
    ([pangrampangram.com](https://pangrampangram.com/products/telegraf/)). The free tier
    ships desktop formats only, so the OTF files are served exactly as supplied, with no
    conversion — WOFF/WOFF2 require a paid Web licence and the foundry's terms restrict
    modifying the font file.

- **Other Libraries & Tools:**  
  - [jQuery](https://jquery.com)  
  - [Scrollex](https://github.com/ajlkn/jquery.scrollex)  
  - [Responsive Tools](https://github.com/ajlkn/responsive-tools)  

---

## Typography notes

Per-file source URLs, download dates, licence tiers, SHA-256 hashes and stored sizes live
in [`assets/webfonts/FONT-PROVENANCE.md`](assets/webfonts/FONT-PROVENANCE.md), which also
records the font-intake measurements the type scale was derived from.

**Both licences are conditioned on this site staying non-commercial.** That is a standing
obligation, not a one-time check: it holds only while the site remains a personal
job-application showcase. If a page ever advertises paid services, freelance availability,
rates, sponsorship, or any other monetisation, both grants lapse and paid licences —
including a Pangram Pangram **Web** licence scoped to this domain and pageview tier — must
be bought before the next deploy.

### Weights, and why they are the numbers they are

Every declared weight corresponds to a face that actually ships, so no browser ever
synthesizes one:

| Token | Value | Face |
|---|---|---|
| `weight-heading` | **700** | `Horizon.woff2` (`usWeightClass` 700, subfamily "Bold") |
| `weight` | **400** | `PPTelegraf-Regular.otf` |
| `weight-bold` | **800** | `PPTelegraf-Ultrabold.otf` |

`weight-bold` is 800 rather than the conventional 700 because the free Telegraf download
contains no 700 face. Declaring 700 against an 800 file would either snap to 800 anyway or
invite synthesis.

No italic face ships. The download offers Oblique and Slanted styles at every weight, but
the site's markup contains no `<em>` and no `<i>` — only `<strong>` — so shipping them
would add ~302 KB of unused font data. If an `<em>` is ever added the browser synthesizes
an oblique from `PP Telegraf` Regular and stays inside the family, which is the intended
behaviour. Nothing in the stylesheet sets `font-synthesis: none`, and nothing should.

### Regenerating the compiled stylesheet

**There is no SASS compiler in this repository.** `assets/sass/**` and
`assets/css/main.css` are *both* shipped artifacts, and `main.css` is the one browsers
execute. A correct SASS edit with a forgotten CSS mirror is invisible until a visitor
notices, so every typography change follows these six steps in order:

1. **Edit the SASS source.** `libs/_vars.scss` first — the `$font` map and the `$palette`
   maps — then the rule-level files: `base/_typography.scss`, `layout/_intro.scss`,
   `layout/_main.scss`, `layout/_footer.scss`, `layout/_nav.scss`,
   `layout/_navPanel.scss`, `components/_button.scss`, `components/_form.scss`,
   `components/_pagination.scss`, `components/_table.scss`.
2. **Resolve each map reference by hand.** `_font(family)` expands to the full
   comma-separated stack, with family names quoted the way the compiler would emit them:
   `"PP Telegraf", "Helvetica Neue", "Segoe UI", Roboto, sans-serif`.
3. **Apply the same change to `assets/css/main.css` at *every* location.** Map-driven
   values appear many times — `family-heading` resolves at **11** sites today. Change all
   of them, not the first one you find.
4. **Keep the `@import`/`@font-face` order.** `@import url(fontawesome-all.min.css)` must
   stay on line 1 and the `@font-face` blocks must stay *below* it. CSS requires every
   `@import` to precede all other rules, so an `@font-face` placed above line 1 silently
   invalidates the Font Awesome import and every icon on all nine pages disappears.
5. **Verify parity.** For every selector governing heading, body, or small-interface text,
   the value resolved from the SASS must equal the value declared in `main.css`, with zero
   differing declarations across the nine pages. Run the checks in
   `tools/typography-check/`:
   ```bash
   cd tools/typography-check && npm ci && npx playwright install chromium && npm test
   ```
   **When comparing, apply last-declaration-wins within each rule.** The compiled CSS
   legitimately carries duplicate declarations for one property in one rule — `#footer`
   and `#copyright` each carry `color` twice, an artifact of the `color(alt)` mixin — so a
   checker that reads the *first* match reports a false failure.
6. **Confirm zero occurrences** of `Merriweather` and `Source Sans Pro` in both artifacts.

`tools/` and `.kiro/` are pruned from the CI checkout by
`.github/workflows/static.yml` before the Pages artifact is uploaded, so neither is
published. The workflow uploads `path: '.'`, so anything else added to the repository *is*
published.

There is no staging environment — a push to `main` deploys straight to production — so
verify before pushing, not after.
