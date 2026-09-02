# Requirements Document

## Introduction

This feature refreshes the typography and footer contact legibility of the personal engineering portfolio site (a static HTML5 UP–derived site deployed to GitHub Pages). Two outcomes are in scope:

1. The footer email link becomes visibly darker and meets a measurable contrast target on all nine content pages.
2. All heading and subheading text switches to a geometric display typeface, and all descriptive/body text switches to a modern grotesque typeface, each with defined sizes and weights, self-hosted webfonts, and defined fallback behaviour.

The chosen typefaces are the two the site owner originally named:

- **Horizon** by **Alberto Fontense** (also spelled Fontese) for Heading_Text — a bold, extra-wide geometric sans serif with round circular edges and tight apertures. The designer distributes it free for personal use; a commercial licence is required for client work, commercial branding, or any monetised use. It is distributed in OTF and WOFF2, and WOFF2 is present in the free demo. Character support covers Basic Latin, Latin-1 and Latin Extended. The designer's own channels appear to be VP Creative Shop and [Creative Market](https://edocs.creativemarket.com/fontense/2189003-Horizon-Wide-Sans-Serif); the aggregator mirror [fontdownloader.net](https://fontdownloader.net/horizon-font/) was consulted for the specification above but is not an approved download source (see Requirement 9).
- **Telegraf** by **Pangram Pangram Foundry** for Body_Text — a neo-grotesque with technical detailing that stays readable at text sizes. The [foundry's product page](https://pangrampangram.com/products/telegraf/) offers a free-to-try tier, and the [foundry FAQ](https://pangrampangram.com/pages/faq) describes that tier as covering personal, non-commercial use and names personal portfolios — in PDF, print, or on the web — among the permitted uses. Free downloads carry the complete glyph set but only a few selected styles and weights; WOFF and WOFF2 ship only with a paid licence. The foundry's terms restrict customising or modifying the font file itself. Paid Web licences are scoped per domain and priced by monthly pageviews.

Both licences are usable here **only because this Site is strictly a personal, non-commercial showcase built to support job applications**. No purchase is therefore required. That non-commercial status is not an incidental fact about the Site — it is a standing constraint on what the Site may ever contain. Requirement 9 makes the constraint explicit and testable: if the Site later advertises paid services, freelance availability, rates, or any other monetisation, both licences cease to apply and paid licences must be bought before deployment.

The site currently loads Merriweather and Source Sans Pro through a Google Fonts `@import` at the top of `assets/css/main.css`. Fonts resolve through the SASS maps `family`, `family-heading`, `weight`, and `weight-heading` in `assets/sass/libs/_vars.scss`, with a small number of hardcoded overrides such as the project card `h2` rule in `assets/sass/layout/_main.scss`. The repository contains no build tooling, so `assets/css/main.css` is edited alongside the SASS source and both are shipped artifacts.

*Licence terms above are summarised, not quoted; verbatim-quotation limits were respected and font licence details were rephrased for compliance with licensing restrictions. The linked sources are authoritative for the actual terms.*

## Glossary

- **Site**: The static portfolio site rooted at the repository root, deployed to GitHub Pages by `.github/workflows/static.yml`.
- **Content_Page**: Any of the nine deployed HTML pages: `index.html`, `arduino.html`, `cad.html`, `calculator.html`, `church.html`, `fluid_sim.html`, `killerbyte.html`, `launchtoy.html`, `vexlego.html`.
- **Stylesheet_Source**: The SASS sources under `assets/sass/`, including `libs/_vars.scss`, `base/_typography.scss`, `layout/_footer.scss`, `layout/_main.scss`, and the files under `components/`.
- **Compiled_Stylesheet**: The browser-loaded CSS file `assets/css/main.css`, which every Content_Page links directly.
- **Heading_Font**: The Horizon typeface by Alberto Fontense, applied to Heading_Text.
- **Body_Font**: The Telegraf typeface by Pangram Pangram Foundry, applied to Body_Text and Chrome_Text.
- **Heading_Text**: Text rendered by the `h1` through `h6` elements on any Content_Page, including the intro `h1`, the project card `h2` elements, and the footer `h3` labels.
- **Body_Text**: Text rendered by paragraph, list, `input`, `select`, and `textarea` elements, plus any element inheriting the body font through the `family` SASS map value, including project card description paragraphs.
- **Chrome_Text**: Small interface text with a declared `font-size` below 0.9rem that currently inherits `family-heading`: skills and Read More button labels (`components/_button.scss`), form labels (`components/_form.scss`), pagination links (`components/_pagination.scss`), table headers (`components/_table.scss`), navigation panel links (`layout/_navPanel.scss`), and the `#copyright` block (`layout/_footer.scss`).
- **Card_Heading**: The project card `h2` element, which currently carries a hardcoded `font-family: Merriweather, Georgia, serif` declaration at approximately line 360 of `assets/sass/layout/_main.scss`.
- **Footer_Email_Link**: The `mailto:` anchor inside the footer contact `<section>` labelled by `<h3>Email</h3>` on each Content_Page.
- **Footer_Background**: The footer surface colour, currently `#f5f5f5` (the `alt` palette `bg` value).
- **Webfont_Bundle**: The self-hosted font files for Heading_Font and Body_Font stored under `assets/webfonts/`, together with their `@font-face` declarations.
- **Vendor_Supplied_Format**: A font file format obtained directly from the designer or foundry for the licence tier in use, without local conversion, subsetting, or any other modification of the file.
- **Fallback_Stack**: The ordered list of substitute font families declared after Heading_Font or Body_Font in a `font-family` declaration.
- **Contrast_Ratio**: The WCAG 2.1 relative luminance contrast ratio between a foreground colour and its background colour.
- **Monospace_Text**: Text rendered by `code` and `pre` elements, governed by the `family-fixed` SASS map value.
- **Non_Commercial_Use**: Use of the Site solely as a personal showcase supporting job applications, with no advertisement of paid services, freelance availability, rates, sponsorship, or any other monetisation.

## Requirements

### Requirement 1: Darker Footer Email Link

**User Story:** As a visitor reading the footer, I want the email address to be clearly legible against the footer background, so that I can read and use the contact address without straining.

The Footer_Email_Link currently renders at `#717981` on Footer_Background `#f5f5f5`, a Contrast_Ratio of 4.05:1 at a font size of 0.8rem, which falls below the WCAG AA threshold of 4.5:1 for text of that size. The replacement colour is now decided: `#4a5158`, which measures 7.4:1 against Footer_Background and therefore clears the 7.0:1 target below. See Assumptions and Open Questions item 7, which records that decision.

#### Acceptance Criteria

1. WHILE the Footer_Email_Link is in its default state (not hovered, not focused, not active), THE Site SHALL render its text at a colour whose Contrast_Ratio against Footer_Background `#f5f5f5` is at least 7.0:1.
2. THE Site SHALL render the Footer_Email_Link at a colour with a lower relative luminance than `#717981`.
3. THE Site SHALL apply one identical Footer_Email_Link default-state colour value on all nine Content_Pages.
4. WHEN a visitor moves the pointer onto the Footer_Email_Link, THE Site SHALL apply the existing accent colour `#18bfef` as the text colour within 200 ms of the pointer entering the link area.
5. WHEN a visitor moves the pointer off the Footer_Email_Link, THE Site SHALL restore the default-state colour defined by criterion 1 within 200 ms.
6. WHILE the Footer_Email_Link holds keyboard focus, THE Site SHALL render a focus indicator that is at least 2 CSS pixels thick, spans at least the full width of the link text, and has a Contrast_Ratio of at least 3.0:1 against Footer_Background, and SHALL retain that indicator while the pointer is simultaneously hovering the link.
7. THE Site SHALL render the Footer_Email_Link underline in the default, hover, and focused states at a Contrast_Ratio against Footer_Background of at least 3.0:1.
8. THE Site SHALL render the Footer_Email_Link at a declared `font-size` of at least 0.8rem on all nine Content_Pages.
9. THE Site SHALL preserve the `mailto:jefferyxross@gmail.com` destination and the visible email address text of the Footer_Email_Link on all nine Content_Pages.
10. THE Site SHALL restrict the darker colour change to the Footer_Email_Link only.
11. THE Site SHALL leave the declared colour values of the `<h3>Email</h3>` label, the footer social icon links, and the `#copyright` block identical to their pre-change values on all nine Content_Pages.
12. THE Site SHALL declare the Footer_Email_Link default-state colour as the literal value `#4a5158`, which measures a Contrast_Ratio of 7.4:1 against Footer_Background `#f5f5f5` and a lower relative luminance than `#717981`, and therefore satisfies criteria 1 and 2.

### Requirement 2: Self-Hosted Webfont Provisioning

**User Story:** As the site owner, I want Horizon and Telegraf served from the repository, so that pages render in the intended typefaces without depending on a third-party font service.

Horizon is distributed with a WOFF2 face in its free tier, so Heading_Font is served in WOFF2. Telegraf's free tier ships desktop formats (OTF/TTF) only — WOFF2 requires a paid Web licence, and converting the supplied file locally may breach the foundry's restriction on modifying the font file. The delivery decision is now settled: Body_Font is served as the vendor-supplied OTF or TTF file exactly as the foundry supplies it, with no conversion and no purchase, and the larger transfer size is accepted under a 600 KB Webfont_Bundle budget. See Assumptions and Open Questions item 1, which records that decision. Because OTF and TTF are not pre-compressed the way WOFF2 is, the per-file bound in criterion 13 and the minimum-face-count rule in criterion 16 exist to keep the payload in check.

#### Acceptance Criteria

1. THE Site SHALL store the Webfont_Bundle files for Heading_Font and Body_Font under `assets/webfonts/`, alongside the existing Font Awesome webfont files.
2. THE Site SHALL provide each Heading_Font face in WOFF2 format, and SHALL reference no other font format for Heading_Font.
3. THE Site SHALL provide each Body_Font face as the unconverted OTF or TTF file supplied by Pangram Pangram Foundry under its free tier, that file being the Vendor_Supplied_Format for the licence tier in use, and SHALL reference no Body_Font file in any other format and no Body_Font file produced by local format conversion.
4. THE Webfont_Bundle SHALL include exactly one Heading_Font face, at the single `weight-heading` value declared for Heading_Text.
5. THE Webfont_Bundle SHALL include exactly one Body_Font face per weight declared for Body_Text in Requirement 4, and each included face SHALL be a style present in the licensed Telegraf download.
6. THE Compiled_Stylesheet SHALL declare exactly one `@font-face` rule per Heading_Font and Body_Font file in the Webfont_Bundle, and each rule SHALL declare a `font-family` name identical to the first family named in the corresponding `family-heading` or `family` stack, a `font-weight` equal to the weight of the referenced file, and a `format()` hint matching the referenced file's actual format: `opentype` for an OTF Body_Font file, `truetype` for a TTF Body_Font file, and `woff2` for the Heading_Font file.
7. THE Compiled_Stylesheet SHALL reference each webfont file using a path relative to `assets/css/main.css`, containing no absolute path and no URL scheme or host.
8. THE Compiled_Stylesheet SHALL declare `font-display: swap` in every `@font-face` rule for Heading_Font and Body_Font.
9. THE Compiled_Stylesheet SHALL declare a `unicode-range` covering at minimum the Basic Latin and Latin-1 Supplement character ranges for each `@font-face` rule that references a subset font file.
10. WHEN the GitHub Pages workflow in `.github/workflows/static.yml` deploys the repository, THE Site SHALL serve every Webfont_Bundle file referenced by the `@font-face` rules from the same origin as the requesting Content_Page, with each request returning a successful response.
11. THE Site SHALL remove the Google Fonts `@import` declaration for Merriweather and Source Sans Pro from the Compiled_Stylesheet, and SHALL declare no `@font-face` rule and no `font-family` value naming Merriweather or Source Sans Pro.
12. THE Site SHALL keep the sum of the stored file sizes of the Heading_Font and Body_Font files in the Webfont_Bundle at or below 600 KB, excluding the existing Font Awesome webfont files, because uncompressed desktop formats transfer substantially more bytes than WOFF2.
13. THE Site SHALL keep each individual Body_Font file in the Webfont_Bundle at or below 400 KB stored, because OTF and TTF files are not pre-compressed the way WOFF2 files are and each face is therefore paid for in full at transfer time.
14. THE Compiled_Stylesheet and every Content_Page SHALL contain no reference to a font resource hosted on any origin other than the deployed Site origin.
15. IF a request for a Webfont_Bundle file referenced by an `@font-face` rule returns an unsuccessful response, THEN THE Site SHALL continue to render all affected text using the declared Fallback_Stack, with no text hidden and no change to declared sizes, weights, or colours.
16. THE Webfont_Bundle SHALL include no Body_Font face beyond those required to satisfy the `weight` and `weight-bold` values declared for Body_Text in Requirement 4, because each additional uncompressed face adds its full stored size to the transfer cost.
17. WHEN the design phase fixes the `@font-face` rules for Body_Font, THE Site SHALL record in the design document, for each Body_Font file requested from the deployed GitHub Pages origin, the `Content-Encoding` response header value and the measured over-the-wire transfer size in bytes, so that the real transfer cost of the OTF or TTF delivery is established rather than assumed.
18. THE Site SHALL keep the measured over-the-wire transfer size of each Body_Font file at or below its stored file size as bounded by criterion 13.

### Requirement 3: Display Typeface for Headings

**User Story:** As a visitor, I want headings rendered in a distinctive geometric display typeface, so that the page hierarchy reads clearly and conveys a technical identity.

Horizon ships one solid text face. The remaining styles in the family — Outline, Outline Two, Lines, Lines Two — are decorative variants, not additional weights, so the heading hierarchy is carried by size alone. Horizon is also extra-wide, which drives the letter-spacing and `h1` sizing criteria below.

#### Acceptance Criteria

1. THE Stylesheet_Source SHALL set the `family-heading` value in `assets/sass/libs/_vars.scss` to a stack whose first family is Heading_Font.
2. THE Site SHALL resolve the computed `font-family` of every `h1`, `h2`, `h3`, `h4`, `h5`, and `h6` element on all nine Content_Pages to a stack whose first family is Heading_Font.
3. THE Site SHALL render the Card_Heading in Heading_Font by replacing the hardcoded `Merriweather, Georgia, serif` declaration in `assets/sass/layout/_main.scss`, and SHALL leave no remaining `font-family` declaration in the Stylesheet_Source or the Compiled_Stylesheet that applies a family other than Heading_Font to Heading_Text.
4. THE Stylesheet_Source SHALL define exactly one `weight-heading` value, equal to the weight of the single solid Heading_Font face present in the Webfont_Bundle, and SHALL declare that same value for every heading level so that no browser-synthesized bold is applied to Heading_Text. Heading_Font is inherently heavy, so no visual weight is lost by declaring a single weight.
5. THE Site SHALL declare an explicit `font-size` for each heading level giving a strictly decreasing scale in which each level is at least 0.1rem larger than the level below it, with `h2` at 1.75rem, `h3` at 1.25rem, `h4` at 1rem, `h5` at 0.9rem, and `h6` at 0.8rem.
6. THE Site SHALL declare the intro `h1` `font-size` at the largest value at or below 4rem that satisfies criteria 10, 11, and 12, reducing the value from 4rem as far as Heading_Font's advance widths require.
7. THE Site SHALL declare a `letter-spacing` value for uppercase Heading_Text of at least -0.02em and at most 0.02em, because Heading_Font is an extra-wide face whose default letterforms already carry generous horizontal space and would read as over-tracked under positive letter-spacing.
8. THE Site SHALL declare a `line-height` for the intro `h1` of at least 1.05 and at most 1.20, and a `line-height` for `h2` through `h6` of at least 1.20 and at most 1.50.
9. THE Site SHALL preserve the existing `text-transform: uppercase` treatment of Heading_Text and the existing `color` resolution of Heading_Text through the `fg-bold` palette value.
10. WHILE the viewport width matches a breakpoint at or below `large`, THE Site SHALL scale Heading_Text through the existing root `font-size` steps of 12pt at `<=xlarge`, 11pt at `<=large`, and 10pt at `<=xxsmall`, keeping the rem values of criteria 5 and 6 unchanged.
11. THE Site SHALL render every Heading_Text element on all nine Content_Pages at viewport widths of 320px, 768px, 1024px, and 1440px with no character visually truncated by its containing block and with the document producing no horizontal scrollbar.
12. THE Site SHALL render the intro `h1` text "Jeffery Ross" on a single line at viewport widths of 768px, 1024px, and 1440px.
13. THE Site SHALL render the intro `h1` text "Jeffery Ross" on at most two lines at a viewport width of 320px, with no character truncated and no horizontal scrollbar.
14. THE Site SHALL render Heading_Text at a Contrast_Ratio of at least 4.5:1 against the background of its containing block on all nine Content_Pages.
15. THE Webfont_Bundle `unicode-range` declared for Heading_Font under Requirement 2 criterion 9 SHALL fall within Heading_Font's Basic Latin, Latin-1 and Latin Extended coverage.
16. IF a Heading_Text string contains a character absent from Heading_Font, THEN THE Site SHALL render that character from the first Fallback_Stack family that provides it, without substituting the whole string.

### Requirement 4: Grotesque Typeface for Body Text

**User Story:** As a visitor reading project descriptions, I want body text rendered in a clean modern grotesque, so that longer passages remain comfortable to read.

The free Telegraf tier supplies the complete glyph set but only a selection of styles, so the availability of a true 700 face is not yet established. The weight criteria below are written against the styles actually present in the licensed download.

#### Acceptance Criteria

1. THE Stylesheet_Source SHALL set the `family` value in `assets/sass/libs/_vars.scss` to a stack beginning with Body_Font.
2. THE Site SHALL render all Body_Text on every Content_Page in Body_Font.
3. THE Stylesheet_Source SHALL define the `weight` and `weight-bold` values for Body_Text as weights of Body_Font faces present in the licensed download and included in the Webfont_Bundle.
4. IF the licensed Body_Font download provides no bold face, THEN THE Site SHALL define `weight-bold` equal to `weight`, SHALL apply an alternative emphasis treatment to `strong` and `b` elements that does not rely on a browser-synthesized bold, and SHALL record the limitation in the Credits or typography notes section of `README.md`.
5. THE Site SHALL declare a single `line-height` value for Body_Text in the inclusive range 1.6 to 1.9, replacing the existing value of 2.375, because Body_Font has a larger x-height than the serif typeface it replaces.
6. THE Site SHALL declare a `font-size` of 1rem for Body_Text and SHALL preserve the existing root `font-size` values of 16pt at the default breakpoint, 12pt at `<=xlarge`, 11pt at `<=large`, and 10pt at `<=xxsmall`.
7. THE Site SHALL render Body_Text at a Contrast_Ratio of at least 4.5:1 against the background of its containing block.
8. THE Site SHALL render Monospace_Text in the existing `family-fixed` stack.
9. THE Site SHALL render project card description text within the bounds of the card, with no text clipped by the card boundary and no horizontal page scrollbar, at viewport widths of 320px, 768px, 1024px, and 1440px.
10. THE Site SHALL preserve the justified paragraph alignment declared in `assets/sass/base/_typography.scss`.
11. WHERE the Webfont_Bundle omits a true italic Body_Font face, THE Site SHALL render `em` and `i` elements in the Body_Font family with a synthesized oblique slant and SHALL NOT substitute a family from the Fallback_Stack for those elements.
12. WHEN Body_Text is enclosed in a `strong` or `b` element, THE Site SHALL render that text at the `weight-bold` value defined by criterion 3, or apply the alternative treatment defined by criterion 4.
13. THE Site SHALL render Body_Text at a computed font size of at least 13px at viewport widths of 320px and above.
14. IF a Body_Text string contains a character absent from Body_Font, THEN THE Site SHALL render that character from the first Fallback_Stack family that provides it.

### Requirement 5: Legibility of Small Interface Text

**User Story:** As a visitor scanning skill tags and the copyright line, I want small interface text to stay readable, so that the compact labels remain useful.

Heading_Font is an extra-wide display face with tight, closed apertures, which collapse into one another well before the smallest Chrome_Text size is reached. Chrome_Text currently inherits the heading font at sizes as small as 0.55rem, where Heading_Font would be markedly less legible than a normal-width display face. Its extra-wide letterforms also consume far more horizontal space per character, which makes single-line skills-button labels harder to fit and gives added weight to criteria 4 and 7 below. All Chrome_Text is therefore routed to Body_Font.

#### Acceptance Criteria

1. THE Site SHALL render every Chrome_Text element — skills button labels, Read More button labels, form labels, pagination links, table headers, navigation panel links, and the `#copyright` block — in Body_Font, and SHALL NOT resolve any Chrome_Text element to Heading_Font.
2. THE Site SHALL render Chrome_Text at a `font-weight` equal to a weight of a Body_Font face present in the Webfont_Bundle, and SHALL NOT depend on a browser-synthesized intermediate or emboldened weight.
3. THE Site SHALL render every Chrome_Text element at a computed font size of at least 0.7rem (11.2px at a 16px root font size) at each of the viewport widths 320px, 768px, 1024px, and 1440px.
4. THE Site SHALL render each skills button label of 20 characters or fewer on a single line within the bounds of its project card, with no clipped characters and no horizontal overflow, at viewport widths of 320px, 768px, 1024px, and 1440px.
5. THE Site SHALL preserve the existing uppercase transform and background treatment of the skills and Read More buttons.
6. THE Site SHALL render Chrome_Text at a Contrast_Ratio of at least 4.5:1 against the background of its containing block in both its default state and its hover state.
7. IF a skills button label exceeds the single-line width available inside its project card at any of the viewport widths 320px, 768px, 1024px, or 1440px, THEN THE Site SHALL wrap the label onto additional lines inside the card bounds, keeping every character visible and producing no horizontal page overflow.
8. THE Site SHALL declare a `letter-spacing` for uppercase Chrome_Text between 0.025em and 0.075em inclusive.

### Requirement 6: Font Loading Resilience

**User Story:** As a visitor on a slow or restricted connection, I want the page to remain readable when a custom font does not load, so that I can still read the content.

Heading_Font is extra-wide, so its advance widths exceed those of every commonly installed fallback family by a wide margin. The fallback-to-webfont swap will therefore shift heading layout more than a normal-width display face would, and the swap criteria below are written to bound that heightened reflow risk.

#### Acceptance Criteria

1. THE Site SHALL declare a Fallback_Stack of at least two families after Heading_Font in every `font-family` declaration naming Heading_Font, where each named family is installed by default on at least one of Windows, macOS, iOS, or Android, and where the families are ordered so that the widest available faces are named first as the closest match to Heading_Font's advance widths.
2. THE Site SHALL declare a Fallback_Stack of at least two families after Body_Font in every `font-family` declaration naming Body_Font, where each named family is installed by default on at least one of Windows, macOS, iOS, or Android.
3. THE Site SHALL terminate each Fallback_Stack for Heading_Font and Body_Font with the CSS generic family keyword `sans-serif`.
4. IF a Webfont_Bundle file request returns an error response, is blocked, or does not complete within 3 seconds, THEN THE Site SHALL render the affected text in the first available family of its Fallback_Stack.
5. IF a Webfont_Bundle file fails to load, THEN THE Site SHALL render all page content at the same `font-size`, `font-weight`, `line-height`, and colour values declared for the webfont case, with no text hidden, clipped, or truncated.
6. WHILE a Webfont_Bundle file is downloading, THE Site SHALL render the affected text in its Fallback_Stack from the first paint onward, with an invisible-text block period of 0 ms.
7. WHILE the Fallback_Stack is in use, THE Site SHALL render every Content_Page without horizontal overflow and SHALL keep every heading, paragraph, and skills button label within the bounds of its containing block, at viewport widths of 320px, 768px, 1024px, and 1440px.
8. WHEN the Heading_Font file finishes loading after fallback text has been painted, THE Site SHALL replace the fallback rendering with Heading_Font without introducing horizontal overflow, without truncating any Heading_Text character, and while keeping the intro `h1` text "Jeffery Ross" on a single line at viewport widths of 768px and above, notwithstanding the larger advance-width increase produced by an extra-wide face.
9. WHEN the Body_Font file finishes loading after fallback text has been painted, THE Site SHALL replace the fallback rendering with Body_Font without introducing horizontal overflow and without clipping project card description text.
10. IF a Webfont_Bundle file fails to load, THEN THE Site SHALL present no error message, empty text run, or placeholder glyph to the visitor for the affected text.
11. IF every family in a Fallback_Stack is unavailable, THEN THE Site SHALL render the affected text using the terminating generic family keyword at the declared sizes and weights.

### Requirement 7: Stylesheet Source and Compiled Output Parity

**User Story:** As the site owner maintaining the repository, I want the SASS source and the shipped CSS to express the same typography, so that a future edit to either artifact does not silently undo this refresh.

#### Acceptance Criteria

1. THE Stylesheet_Source SHALL declare the `font-family`, `font-size`, `font-weight`, `line-height`, and `letter-spacing` values required for Heading_Text, Body_Text, and Chrome_Text by Requirements 3, 4, and 5, and the Footer_Email_Link colour and hover colour required by Requirement 1.
2. THE Compiled_Stylesheet SHALL declare the same set of values listed in criterion 1, together with one `@font-face` rule for each file in the Webfont_Bundle as required by Requirement 2.
3. THE Compiled_Stylesheet SHALL declare, for every selector that governs Heading_Text, Body_Text, or Chrome_Text, `font-family`, `font-size`, `font-weight`, `line-height`, and `letter-spacing` values identical to the values the Stylesheet_Source resolves for that same selector, with zero differing declarations across the nine Content_Pages.
4. THE Stylesheet_Source SHALL resolve every `font-family` declaration for Heading_Text, Body_Text, and Chrome_Text through the `$font` map in `assets/sass/libs/_vars.scss`, and SHALL contain zero per-rule literal typeface names in those declarations outside the `$font` map, the `@font-face` rules, and the Font Awesome icon families.
5. THE Site SHALL document in `README.md` a procedure for regenerating the Compiled_Stylesheet from the Stylesheet_Source that lists the steps in execution order, names every file that must be edited or produced, and states how to verify the parity required by criterion 3.
6. THE Site SHALL retain the `@import url(fontawesome-all.min.css)` declaration in the Compiled_Stylesheet and SHALL render every Font Awesome icon on all nine Content_Pages with no missing-glyph substitution.
7. THE Site SHALL retain every existing Font Awesome webfont file under `assets/webfonts/` unchanged in filename, count, and file content.
8. WHEN the Stylesheet_Source is edited to change any value listed in criterion 1, THE Site SHALL ship a Compiled_Stylesheet carrying the same edited value before the GitHub Pages workflow deploys the repository.
9. THE Stylesheet_Source and the Compiled_Stylesheet SHALL each contain zero occurrences of the family names `Merriweather` and `Source Sans Pro`.
10. THE Site SHALL declare all Heading_Text, Body_Text, and Chrome_Text `font-family`, `font-size`, `font-weight`, and `line-height` values in the Compiled_Stylesheet only, and SHALL contain zero inline `style` attributes and zero in-page `<style>` blocks declaring those four properties on any of the nine Content_Pages.

### Requirement 8: Cross-Page Visual Consistency

**User Story:** As a visitor navigating between the project pages, I want typography to look the same everywhere, so that the site feels like one coherent portfolio.

#### Acceptance Criteria

1. THE Site SHALL render, for each of `h1` through `h6`, the same computed Heading_Text font-family stack, font-weight, font-size, and letter-spacing on all nine Content_Pages, with no difference in computed font-size greater than 0.01rem, measured at viewport widths of 320px, 768px, 1024px, and 1440px.
2. THE Site SHALL render the same computed Body_Text font-family stack, font-weight, font-size, and line-height on all nine Content_Pages, with no difference in computed font-size greater than 0.01rem and no difference in computed line-height greater than 0.05, measured at viewport widths of 320px, 768px, 1024px, and 1440px.
3. THE Site SHALL render the same computed Chrome_Text font-family stack and font-weight on all nine Content_Pages, and SHALL render each Chrome_Text class of element (skills button labels, Read More button labels, form labels, pagination links, table headers, navigation panel links, and the `#copyright` block) at the same computed font-size on every Content_Page on which that element appears, measured at viewport widths of 320px, 768px, 1024px, and 1440px.
4. THE Site SHALL link every Content_Page to the Compiled_Stylesheet `assets/css/main.css` as its only typography source, and SHALL declare no inline `style` attribute and no embedded `<style>` rule on any Content_Page that sets `font-family`, `font-size`, `font-weight`, `line-height`, or `letter-spacing` for Heading_Text, Body_Text, or Chrome_Text.
5. THE Site SHALL preserve on each Content_Page the same set, count, order, and nesting of the intro block, navigation, project card, footer contact section, footer social icon, and copyright block elements that the page contained before this change, adding and removing no such element.
6. WHEN a Content_Page finishes loading, THE Site SHALL initialise and animate the water particle canvas defined in `assets/js/waterParticles.js` and SHALL respond to project card hover, expand, and Read More interactions defined in `assets/js/projectCards.js`, with no uncaught script error reported by the browser.
7. THE Site SHALL preserve every palette value in `assets/sass/libs/_vars.scss` and in the Compiled_Stylesheet unchanged, except the single Footer_Email_Link colour value, which changes to `#4a5158` to satisfy Requirement 1.
8. THE Site SHALL preserve the exact `href` value of every navigation link and project link on all nine Content_Pages, and each internal `href` SHALL resolve to a file present in the deployed repository.
9. IF a Content_Page renders Heading_Text or Body_Text whose computed font-family stack differs from the stack resolved by the Compiled_Stylesheet for the same element type and viewport width, THEN THE Site SHALL be treated as failing this requirement and the discrepancy SHALL be reported as a defect identifying the affected page and element, with no other Content_Page modified.

### Requirement 9: Font Licence Compliance and Provenance

**User Story:** As the site owner publishing a public repository, I want the licence terms of both typefaces satisfied and their origin documented, so that the Site stays within its free personal-use grants and the fonts are known to be the designers' unmodified releases.

Both fonts are used under free personal-use grants that depend on the Site remaining Non_Commercial_Use. Provenance matters independently of licensing: aggregator mirror sites may ship files that have been altered, subsetted, or repackaged, and may restate licence terms that no longer match the designer's own.

#### Acceptance Criteria

1. THE Site SHALL obtain every Heading_Font and Body_Font file in the Webfont_Bundle from the designer's or foundry's official distribution channel, and SHALL obtain no such file from an aggregator or mirror download site.
2. THE Site SHALL store, alongside the font files under `assets/webfonts/`, the licence or end-user licence agreement text supplied by the designer for Heading_Font and the text supplied by the foundry for Body_Font, together with the download source URL and download date for each font.
3. THE Site SHALL credit Heading_Font to Alberto Fontense and Body_Font to Pangram Pangram Foundry, each with its licence tier, in the Credits section of `README.md`.
4. THE Site SHALL restrict its content to Non_Commercial_Use, and SHALL present no advertisement of paid services, no statement of freelance or contract availability, no rates or pricing, no sponsorship or affiliate content, and no other monetisation, on any of the nine Content_Pages, because both font licences are conditioned on non-commercial use.
5. IF the purpose of the Site changes to include commercial use, THEN THE Site SHALL obtain a paid licence for each affected typeface before the next deployment, including for Body_Font a Pangram Pangram Web licence covering the deployed domain and the anticipated monthly pageview tier.
6. THE Site SHALL ship every Heading_Font and Body_Font file in its Vendor_Supplied_Format, byte-for-byte as the designer or foundry supplied it, and SHALL apply no format conversion, subsetting, renaming of internal font data, or other modification to any font file. Shipping Body_Font unconverted is the load-bearing condition of the delivery path chosen in Requirement 2 criterion 3, not merely a precaution: the free Telegraf tier grants no converted format, so a converted Body_Font file would leave the Site with no licensed delivery route at all.
7. WHERE the Body_Font delivery path recorded in Requirement 2 criterion 3 is later abandoned in favour of a converted file, THE Site SHALL first obtain written permission to convert from the foundry and store that permission in the repository alongside the licence text required by criterion 2, before shipping any converted file.
8. WHEN a font file in the Webfont_Bundle is added or replaced, THE Site SHALL record the source URL, download date, licence tier, and file format for that file in the same repository location required by criterion 2.

## Assumptions and Open Questions

1. **RESOLVED — Body_Font delivery format (Requirement 2).** The free Telegraf tier ships desktop formats only; WOFF and WOFF2 are paid-licence deliverables, and the foundry's terms restrict modifying the font file. Of the four options considered — (a) request written permission to convert, (b) purchase a Web licence for WOFF2, (c) serve the vendor-supplied OTF/TTF, (d) substitute another body typeface — **option (c) was chosen**: Body_Font is served as the vendor-supplied OTF or TTF file through `@font-face`, with no conversion, no purchase, and no font substitution, under a 600 KB Webfont_Bundle budget rather than the 250 KB budget an all-WOFF2 bundle would have allowed. The accepted trade-off is a materially larger font payload than WOFF2 would give. Requirement 2 criteria 3, 6, 12, 13, 16, 17, and 18 encode this decision, and Requirement 9 criterion 6 now depends on it.
2. **Horizon has no bold weight (Requirement 3).** Horizon's free release provides a single solid face; Outline, Outline Two, Lines and Lines Two are decorative styles, not weights. The heading hierarchy therefore relies on size alone, and no synthesized bold may be applied. Confirm this single-weight hierarchy is acceptable, or say whether a decorative style should be used for a specific heading level.
3. **`h1` sizing must be retuned empirically (Requirement 3).** Horizon's extra-wide advance widths make the existing 4rem `h1` unlikely to fit "Jeffery Ross" on one line at 768px. Requirement 3 criterion 6 caps the size at 4rem and requires reduction as needed; the actual value must be measured against Horizon's metrics during design or implementation rather than assumed.
4. **Provenance (Requirement 9).** Both fonts must be downloaded from the designer's or foundry's own channels — Creative Market / VP Creative Shop for Horizon, [pangrampangram.com](https://pangrampangram.com/products/telegraf/) for Telegraf. The aggregator link supplied during requirements gathering, [fontdownloader.net](https://fontdownloader.net/horizon-font/), informed the format and glyph-coverage facts recorded here but must not be the download source.
5. **Non-commercial status is a standing obligation, not a one-time check (Requirement 9).** Both licences remain valid only while the Site stays a personal job-application showcase. Adding freelance solicitation, rates, or any monetisation later would breach both licences, so this constraint must survive future content changes.
6. **OPEN — which Telegraf styles the free tier includes (Requirement 4).** The free download is described as a selection of key styles with the full glyph set, so it is not established that both a 400 and a 700 face are available. Confirm the exact styles in the download before fixing `weight` and `weight-bold`. This question carries more weight under the item 1 decision than it did before: every shipped face is now an uncompressed OTF or TTF file counting in full against the 600 KB budget and the 400 KB per-file bound, so the answer determines both which weights Requirement 4 can declare and how many large files the Webfont_Bundle must carry. Requirement 2 criterion 16 caps the count at the minimum Requirement 4 needs.
7. **RESOLVED — Footer_Email_Link colour (Requirement 1).** The default-state colour is `#4a5158`, which measures a Contrast_Ratio of 7.4:1 against Footer_Background `#f5f5f5` and so clears the 7.0:1 WCAG AAA threshold retained as the target in Requirement 1 criterion 1. The darker alternative `#3a4148` (9.5:1) was not chosen. Requirement 1 criterion 12 declares the literal value and Requirement 8 criterion 7 names it as the single permitted palette change.
8. **Source of truth (Requirement 7).** The repository has no `package.json` or SASS compiler, and `assets/css/main.css` is hand-edited alongside the SASS files. Requirement 7 keeps both in sync and adds a documented regeneration procedure rather than introducing a build step.

*Licence facts in this section are paraphrased from the linked sources; content was rephrased for compliance with licensing restrictions.*
