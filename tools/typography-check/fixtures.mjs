/**
 * Shared fixtures for the portfolio-typography-refresh verification harness.
 *
 * Design references:
 *   §3.1 token model, §4.3 bundle manifest, Testing Strategy (fixtures, font states,
 *   conflict C6 element routing), Correctness Properties 1–13.
 *
 * This module holds no assertions. It supplies the domains the property tests quantify
 * over, the contrast oracle, and the Playwright plumbing (context cache + webfont
 * blocking). Keeping it assertion-free means a fixture bug surfaces as a harness error
 * rather than a silent pass.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Repository root — two levels up from tools/typography-check/. */
export const REPO_ROOT = path.resolve(HERE, '..', '..');

export const repoPath = (...parts) => path.join(REPO_ROOT, ...parts);

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------

/** The nine deployed Content_Pages (requirements glossary). */
export const NINE_PAGES = [
  'index.html',
  'arduino.html',
  'cad.html',
  'calculator.html',
  'church.html',
  'fluid_sim.html',
  'killerbyte.html',
  'launchtoy.html',
  'vexlego.html',
];

/** The four viewport widths every rendered property is measured at. */
export const VIEWPORTS = [320, 768, 1024, 1440];

/** Root font-size steps, as declared in base/_typography.scss (Req 3 c10, Req 4 c6). */
export const ROOT_PX_BY_VIEWPORT = {
  320: 13.333, // <=xxsmall, 10pt
  768: 14.667, // <=large,   11pt
  1024: 14.667, // <=large,   11pt
  1440: 16.0, // <=xlarge,  12pt
};

/** Playwright font states. 'blocked' reproduces the Req 6 c4 failure mode. */
export const FONT_STATES = ['loaded', 'blocked'];

// ---------------------------------------------------------------------------
// Element role selectors
// ---------------------------------------------------------------------------

/**
 * In-scope element roles, per the requirements glossary.
 *
 * Two routing decisions from the design's conflict list are encoded here rather than
 * left to each test:
 *   - C6: `#nav ul.links a` is Chrome_Text (small, and moved off the heading font).
 *   - C6: `#header .logo` is EXCLUDED from all three roles — it is a display element
 *     that legitimately stays on the heading font at 2.25rem.
 *   - C5: heading roles are split by context (base / card / post) because 1.75rem,
 *     1.1rem and 1.5rem coexist by design. Property 3 compares per role, not per tag.
 */
export const ROLE_SELECTORS = {
  // Heading_Text
  'heading-base': 'h1, h2, h3, h4, h5, h6',
  'heading-card': 'body.home #main > .posts > article h2',
  'heading-post': 'body.project-page #main > .post h2',
  'heading-footer': '#footer h3',

  // Body_Text
  'body-paragraph': '#main p, #footer p',
  'body-list': '#main ul li, #main ol li',
  'body-input': 'input[type="text"], input[type="email"], select, textarea',

  // Chrome_Text
  'chrome-button-skills': '.button.skills',
  'chrome-button-readmore': '#main .actions .button',
  'chrome-form-label': 'form label',
  'chrome-pagination': '.pagination a, .pagination span',
  'chrome-table-header': 'table th',
  'chrome-nav-link': '#nav ul.links li a',
  'chrome-navpanel-link': '#navPanel .links li a',
  'chrome-copyright': '#copyright',
};

/**
 * Change Set 2 element groups.
 *
 * Bold_Chrome_Text (Req 11 c1) is the set that must compute to 800. Everything else in
 * CHROME_ROLES must stay at 400 (Req 11 c15). Property 4 reads these as a PARTITION, so
 * the two halves catch each other's mistakes: bolding too much trips the 400 clause,
 * bolding too little trips the 800 clause.
 */
export const BOLD_CHROME_SELECTORS = {
  'bold-nav-link': '#nav ul.links a',
  'bold-button': '.button',
  'bold-button-primary': '.button.primary',
  'bold-button-primary-small-fit': '.button.primary.small.fit',
  'bold-skills-pill': 'a.button.skills',
  // Change Set 3 (Requirement 16). These two MOVED HERE from REGULAR_CHROME_SELECTORS —
  // Req 11 c15 was amended to remove the Nav_Panel_Link elements from its 400 list, and the
  // Nav_Panel_Toggle joins them. The move is the whole of Requirement 16 as far as
  // Property 4 is concerned: it is the same oracle read at a finer grain, which is why
  // Requirement 16 gets no property of its own.
  //
  // Req 16 c17 falls out of the partition for free. `assets/js/main.js` reparents the same
  // two anchors between `#nav` and `#navPanel` across the `<=medium` breakpoint, so the
  // generator's viewport dimension visits them under BOTH parents — inside `#navPanel` at
  // 320 and 768, inside `#nav` at 1024 and 1440. Requiring 800 everywhere is strictly
  // stronger than requiring two observations to be equal, so no cross-viewport comparison
  // needs writing, and an incomplete edit fails at exactly two of the four viewports.
  'bold-navpanel-toggle': '#navPanelToggle',
  'bold-navpanel-link': '#navPanel .links li a',
};

/**
 * Chrome_Text that Req 11 c15 pins at 400. Deliberately excludes `.button.skills`, which
 * is Bold_Chrome_Text, and excludes `#copyright a` for the same reason it excludes
 * `#copyright` itself: the Copyright_Block is named in c15 as staying at 400.
 */
export const REGULAR_CHROME_SELECTORS = {
  'regular-form-label': 'form label',
  'regular-pagination': '.pagination a, .pagination span',
  'regular-table-header': 'table th',
  // `regular-navpanel-link` was REMOVED by Change Set 3 and must not come back: Req 11 c15
  // as amended names exactly four groups at 400 — form labels, pagination links, table
  // headers and the Copyright_Block — and Requirement 16 moves the nav panel to 800. Both
  // halves of the partition are asserted, so a stale entry here would make the successful
  // weight change read as a red check.
  'regular-copyright': '#copyright',
  'regular-copyright-link': '#copyright a',
};

/**
 * The two Skills_Pill geometries (Req 12 c10). They are a GENERATOR DIMENSION for
 * Property 15, not two properties: the oracle is identical and only the declared
 * font-size and the effective-vertical-gap definition differ.
 *
 *   - homepage:  body.home #main .button.skills — 0.55rem, height auto + min-height,
 *                so the effective vertical gap is the declared vertical padding.
 *   - wider:     .button.skills outside the homepage card grid — 0.7rem with a fixed
 *                height, so the effective vertical gap is half the difference between
 *                the declared height and the rendered line box.
 */
export const SKILLS_PILL_GEOMETRIES = {
  homepage: {
    selector: 'body.home #main .button.skills',
    declaredFontSizeRem: 0.55,
    verticalGapSource: 'padding',
  },
  wider: {
    selector: 'body:not(.home) .button.skills, body.home #main .actions .button.skills',
    declaredFontSizeRem: 0.7,
    verticalGapSource: 'height-minus-linebox',
  },
};

/** Card_Header_Band and Card_Heading — Requirement 10. */
export const CARD_HEADER_BAND = 'body.home #main > .posts > article > header';
export const CARD_HEADING = 'body.home #main > .posts > article > header h2';

/**
 * The card whose heading carries an explicit <br /> (Req 10 c3). Pinned as a REQUIRED
 * case in Property 14 rather than left to the sampler: it is the only heading that
 * breaks at every viewport, so a uniform generator could miss it entirely.
 */
export const FORCED_BREAK_CARD_HEADING_TEXT = 'KillerByte';

/** Copyright_Block and its two child links — Requirement 13. */
export const COPYRIGHT_BLOCK = '#copyright';
export const BACK_TO_TOP_CONTROL = '#copyright a[href^="#"]';
export const DESIGN_CREDIT_LINK = '#copyright a[href="https://html5up.net"]';

export const HEADING_ROLES = Object.keys(ROLE_SELECTORS).filter((r) => r.startsWith('heading-'));
export const BODY_ROLES = Object.keys(ROLE_SELECTORS).filter((r) => r.startsWith('body-'));
export const CHROME_ROLES = Object.keys(ROLE_SELECTORS).filter((r) => r.startsWith('chrome-'));

/** Elements deliberately outside every role — see conflict C6. */
export const UNCLASSIFIED_SELECTORS = ['#header .logo'];

// ---------------------------------------------------------------------------
// Font bundle
// ---------------------------------------------------------------------------

/**
 * The Webfont_Bundle as shipped (§4.3, resolved by the Check G intake gate).
 * Weights are the measured OS/2.usWeightClass of each file, not assumptions.
 */
export const WEBFONT_BUNDLE = [
  {
    file: 'Horizon.woff2',
    cssFamily: 'Horizon',
    weight: 700,
    format: 'woff2',
    sha256: 'aaa66743b480d7ca8b33a44ccd95ef44852ec637386d5967a054f524e34d6305',
    storedBytes: 17084,
  },
  {
    file: 'PPTelegraf-Regular.otf',
    cssFamily: 'PP Telegraf',
    weight: 400,
    format: 'opentype',
    sha256: '2f2e07daf036ae192bcadc4c29493da4267d6b784459e3188fede316ebd81106',
    storedBytes: 41576,
  },
  {
    file: 'PPTelegraf-Ultrabold.otf',
    cssFamily: 'PP Telegraf',
    weight: 800,
    format: 'opentype',
    sha256: '7294de0d73f11a34658b9c09eb4a668d1e29145d517b2944cfe80737b2d1694a',
    storedBytes: 44664,
  },
];

/** Req 2 c12 / c13 budgets, in bytes. */
export const BUNDLE_BUDGET_BYTES = 600 * 1024;
export const PER_FILE_BUDGET_BYTES = 400 * 1024;

/** Font Awesome files are excluded from both budgets by name (Req 2 c12, Req 7 c7). */
export const isFontAwesomeFile = (name) => /^fa-/.test(name);

/** Forbidden family names — Req 7 c9. */
export const FORBIDDEN_FAMILY_NAMES = ['Merriweather', 'Source Sans Pro'];

/**
 * Forbidden colour literals — Property 6.
 *
 * Req 1 c13 is a ZERO-OCCURRENCE rule, not a replacement rule: after §5.1 the superseded
 * link colour must appear nowhere in either artifact as a link or underline colour,
 * including inside explanatory comments that would otherwise document a value the source
 * no longer sets. Scanning the raw file text (comments included) is therefore deliberate.
 */
export const FORBIDDEN_COLOUR_LITERALS = ['#4a5158'];

/** The Change Set 2 link colour — §5.1, 9.49:1 on #f5f5f5. */
export const FG_LINK = '#3a4148';

/**
 * Inline-style oracle — Property 6, widened by Req 10 c8 and Req 14 c9.
 *
 * Change Set 1 banned the five typography properties inline. Change Set 2 adds
 * `text-align` (Req 10 c8 forbids achieving the centring with an inline style) and
 * `color` (Req 14 c9 requires the colour change to live in the stylesheet pair).
 */
export const BANNED_INLINE_PROPERTIES = [
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'color',
  // Change Set 3 (Req 15 c13, Req 16 c19). The divider centring is a LAYOUT mechanism, so
  // a page that reproduced it inline would satisfy Property 17's geometry check while
  // sitting entirely outside Property 2's parity check — the stylesheet pair would look
  // untouched and the site would still centre. These four are the mechanism's own
  // properties, which is why they and not `justify-content`/`align-items` are named: a
  // page cannot make a non-flex container lay out as flex halves without them.
  'display',
  'flex',
  'flex-basis',
  'min-height',
];

/**
 * Custom-property carve-out for the inline-style oracle.
 *
 * `index.html` legitimately carries `style="--project-image: url(...)"` on every project
 * card. A blanket ban produces seven false failures, so declarations whose property name
 * begins with `--` are skipped. This is safe against the widened list because a custom
 * property is neither `text-align` nor `color` — it is a distinct name that only becomes
 * one of them through an explicit `var()` substitution in the stylesheet, which the
 * stylesheet does not do.
 */
export const isCustomPropertyDeclaration = (declaration) => /^\s*--/.test(declaration);

/**
 * Split an inline `style` attribute into `{ property, value }` pairs, skipping custom
 * properties. Returns the banned declarations only.
 */
export function bannedInlineDeclarations(styleAttr) {
  const out = [];
  for (const decl of String(styleAttr).split(';')) {
    if (!decl.trim()) continue;
    if (isCustomPropertyDeclaration(decl)) continue;
    const [rawProp, ...rest] = decl.split(':');
    const prop = rawProp.trim().toLowerCase();
    if (BANNED_INLINE_PROPERTIES.includes(prop)) {
      out.push({ property: prop, value: rest.join(':').trim() });
    }
  }
  return out;
}

/** Req 9 c1 — aggregator/mirror download sources that must never appear as a source_url. */
export const FORBIDDEN_SOURCE_HOSTS = ['fontdownloader.net'];

// ---------------------------------------------------------------------------
// Contrast oracle — WCAG 2.1 relative luminance
// ---------------------------------------------------------------------------

/** Parse `#rgb`, `#rrggbb`, `rgb(...)` or `rgba(...)` into {r,g,b,a} with 0–255 channels. */
export function parseColor(input) {
  const s = String(input).trim();

  let m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) {
    const [r, g, b] = [...m[1]].map((c) => parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }

  m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) {
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16),
      a: 1,
    };
  }

  m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(s);
  if (m) {
    let a = 1;
    if (m[4] !== undefined) {
      a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    }
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }

  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  throw new Error(`parseColor: unrecognised colour value ${JSON.stringify(input)}`);
}

/**
 * Composite a possibly-translucent foreground over an opaque backdrop.
 *
 * This is the step the defect in Req 1 c7 hides behind: `rgba(113,121,129,0.5)` looks
 * like a mid grey but composites to #b3b7bb against #f5f5f5 and measures 1.85:1.
 * Measuring the un-composited value would report a false pass.
 */
export function composite(fg, backdrop) {
  const f = parseColor(fg);
  const b = parseColor(backdrop);
  if (b.a !== 1) {
    throw new Error('composite: backdrop must be opaque; resolve the stack first');
  }
  return {
    r: f.a * f.r + (1 - f.a) * b.r,
    g: f.a * f.g + (1 - f.a) * b.g,
    b: f.a * f.b + (1 - f.a) * b.b,
    a: 1,
  };
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance(color) {
  const c = typeof color === 'string' ? parseColor(color) : color;
  const chan = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
}

/**
 * WCAG 2.1 contrast ratio between a foreground and an opaque backdrop.
 * The foreground is alpha-composited over the backdrop first.
 */
export function contrastRatio(foreground, backdrop) {
  const fg = composite(foreground, backdrop);
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(parseColor(backdrop));
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Accepted contrast shortfalls — Property 1. EXACTLY ONE ENTRY after Change Set 2.
 *
 * The surviving entry is settled by explicit owner decision, which makes Req 1 c11 win
 * over Req 3 c14. It is reported as known-and-accepted with its conflict ID, NOT as a
 * failure, and it must NOT be "fixed" under this spec (Req 14 c8 keeps C2 as decided).
 *
 * THE #copyright ENTRY WAS REMOVED BY CHANGE SET 2 (Req 14 c7) AND MUST NOT REAPPEAR.
 * It previously recorded rgba(255,255,255,0.25) over #1e252d -> #565c62 at 2.27:1 as an
 * accepted shortfall under conflict C3. §5.6 now FIXES that shortfall — alpha 0.65,
 * composited #b0b3b6, 7.33:1 — so the pairing is checked against the ordinary >=4.5:1
 * Chrome_Text threshold like any other tuple. Removal is mandatory, not tidy-up: this set
 * pins each member to a MEASURED ratio and fails when that ratio drifts in EITHER
 * direction, so a stale 2.27:1 entry would make the successful fix read as a red check.
 *
 * Adding an entry is an owner scope decision, not a test fix.
 */
export const ACCEPTED_CONTRAST_EXCEPTIONS = [
  {
    conflict: 'C2',
    what: '#footer h3 (Heading_Text)',
    foreground: '#717981',
    backdrop: '#f5f5f5',
    measured: 4.05,
    threshold: 4.5,
    ruling: 'Req 1 c11 wins over Req 3 c14 — leave unchanged (Req 14 c8).',
  },
];

/**
 * The hover accent is NOT an accepted exception (conflict C4). Req 1 c4 mandates
 * #18bfef, so the transient hover state is scoped out of the >=4.5:1 Body_Text clause
 * instead. Recorded here so a reader does not "helpfully" add it to the set above.
 */
export const MANDATED_HOVER_ACCENT = '#18bfef';

// ---------------------------------------------------------------------------
// Playwright plumbing
// ---------------------------------------------------------------------------

/** Regex matching the two families' font files, for request interception. */
export const WEBFONT_REQUEST_PATTERN = /assets\/webfonts\/(Horizon|PPTelegraf)[^/]*$/i;

const pageUrl = (page) => `file://${repoPath(page)}`;

let browserPromise = null;

/** Launch (once) a headless Chromium with --no-sandbox, as the design specifies. */
export async function getBrowser() {
  if (!browserPromise) {
    const { chromium } = await import('playwright');
    browserPromise = chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
    });
  }
  return browserPromise;
}

const contextCache = new Map();

/**
 * Return a loaded Playwright page for one (contentPage, viewport, fontState) triple,
 * caching it. Property 5 spans 9 x 4 x 2 triples over 100 runs; without this cache a
 * naive implementation launches a browser per iteration.
 */
export async function getRenderedPage(contentPage, viewport, fontState = 'loaded') {
  const key = `${contentPage}|${viewport}|${fontState}`;
  if (contextCache.has(key)) return contextCache.get(key);

  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: viewport, height: 900 },
    deviceScaleFactor: 1,
  });

  if (fontState === 'blocked') {
    await context.route(WEBFONT_REQUEST_PATTERN, (route) => route.abort());
  }

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  page.consoleErrors = consoleErrors;

  await page.goto(pageUrl(contentPage), { waitUntil: 'load' });
  // The site sets body.is-preload and clears it on load; settle before measuring.
  await page.waitForFunction(() => !document.body.classList.contains('is-preload'), {
    timeout: 5000,
  }).catch(() => {});

  if (fontState === 'loaded') {
    await page.evaluate(() => document.fonts.ready);
  }

  contextCache.set(key, page);
  return page;
}

/**
 * Return a page in a context with SCRIPTING DISABLED — Check I, Property 16's no-JS arm
 * (Req 13 c5).
 *
 * This needs a separately configured context rather than a different generator, which is
 * exactly why Check I cannot be folded into Check D: `javaScriptEnabled` is a
 * context-level flag, and a context with scripting off cannot also exercise the card
 * interaction paths Check F needs.
 *
 * `scriptState`:
 *   - 'disabled'  — javaScriptEnabled: false for the whole context.
 *   - 'aborted'   — scripting on, but every assets/js/* request is aborted. This is the
 *                   PARTIAL-failure case Req 13 c5 also names (jquery.scrolly.min.js
 *                   failing to load), which behaves differently from scripting-off:
 *                   inline handlers still run, so a control that depended on one would
 *                   pass the 'disabled' arm and fail here, or vice versa.
 *
 * Not cached: these contexts are used once per page by Check I, and caching a scrolled
 * page would corrupt the `window.scrollY === 0` oracle for the next assertion.
 */
export async function openScriptless(contentPage, viewport = 1440, scriptState = 'disabled') {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: viewport, height: 900 },
    deviceScaleFactor: 1,
    javaScriptEnabled: scriptState !== 'aborted',
  });

  if (scriptState === 'aborted') {
    await context.route(/assets\/js\/[^/]+$/i, (route) => route.abort());
  }

  const page = await context.newPage();
  await page.goto(pageUrl(contentPage), { waitUntil: 'load' });
  return { context, page };
}

/** Matches the page scripts, for the 'aborted' variant above. */
export const PAGE_SCRIPT_REQUEST_PATTERN = /assets\/js\/[^/]+$/i;

/**
 * Return an UNCACHED page plus its console-error sink — Check J.
 *
 * Deliberately not `getRenderedPage`: Check J scrolls the document, and handing a scrolled
 * page back to a cached triple corrupts the `window.scrollY` oracle of whatever asserts
 * next, exactly as the `openScriptless` note describes. The caller closes the context.
 */
export async function openUncachedPage(contentPage, viewport = 1440) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: viewport, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(msg.text()));
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  await page.goto(pageUrl(contentPage), { waitUntil: 'load' });
  await page
    .waitForFunction(() => !document.body.classList.contains('is-preload'), { timeout: 5000 })
    .catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  return { context, page, consoleErrors };
}

// ---------------------------------------------------------------------------
// Scroll-latency plumbing — Check J
// ---------------------------------------------------------------------------

/**
 * The two same-document scroll controls the site ships.
 *
 * They reach the same outcome by DIFFERENT mechanisms, which is why both are measured:
 * the arrow is animated by jQuery (`jquery.scrolly.min.js` -> `.animate({scrollTop}, 1000)`)
 * and the footer control is a native fragment jump. A global CSS `scroll-behavior` breaks
 * only the first, so a check that exercised one of them would miss the regression.
 */
export const INTRO_DOWN_ARROW = '#intro .actions a.scrolly';
export const INTRO_DOWN_ARROW_TARGET = '#main';

/** Node-side sampling interval, in ms. See the rAF note on `measureScrollLatency`. */
export const SCROLL_SAMPLE_INTERVAL_MS = 16;

/**
 * How long a scroll control may take to produce its FIRST observable movement.
 *
 * This is the bound the Change Set 2 Check F extension was missing: it asserted the
 * arrow's final position (`landedNear`, y 900) and the console, both of which a
 * one-second-late scroll satisfies. Measured on this repository at 1440px:
 *
 *   html { scroll-behavior: smooth }  ->  first movement 1056ms, y>400 at 1152ms
 *   html { scroll-behavior: auto }    ->  first movement   48ms, y>400 at  480ms
 *
 * 150ms sits an order of magnitude below the broken figure and roughly 3x above the
 * healthy one, so it discriminates the fault without tracking harness jitter.
 */
export const FIRST_MOVEMENT_BUDGET_MS = 150;

/** Scroll deltas smaller than this are treated as no movement (sub-pixel/rounding noise). */
export const SCROLL_MOVEMENT_EPSILON_PX = 1;

/**
 * Sample `window.scrollY` from the NODE side while a scroll control runs.
 *
 * TWO THINGS HERE ARE LOAD-BEARING:
 *
 *  1. **The clock and the sampler both live in Node.** `page.waitForFunction` polls on
 *     requestAnimationFrame, which is throttled in these headless contexts, so an in-page
 *     poller reports late or not at all — the same trap documented at the Check I call
 *     site. Every sample is therefore a `page.evaluate` round trip timed by `Date.now()`.
 *  2. **Activation is dispatched in-page rather than through `locator.click()`.** A
 *     Playwright click first scrolls the target into view, which would move the very
 *     quantity being measured before the clock is read. `element.click()` still runs the
 *     jQuery handler and still performs an anchor's default fragment navigation.
 *
 * The poller starts BEFORE activation and both are awaited together, so `t` is measured
 * from just before the click rather than from after its round trip.
 *
 * Returns `{ startY, finalY, samples, firstMovementMs, firstMovementY, maxY, minY }`,
 * where `samples` is `[{ t, y }]` and `firstMovementMs` is null if nothing ever moved.
 */
export async function measureScrollLatency(page, selector, options = {}) {
  const {
    durationMs = 2000,
    intervalMs = SCROLL_SAMPLE_INTERVAL_MS,
    movementEpsilonPx = SCROLL_MOVEMENT_EPSILON_PX,
  } = options;

  const startY = await page.evaluate(() => window.scrollY);
  const samples = [];
  const t0 = Date.now();

  const poll = (async () => {
    while (Date.now() - t0 < durationMs) {
      const y = await page.evaluate(() => window.scrollY);
      samples.push({ t: Date.now() - t0, y });
      const wait = t0 + samples.length * intervalMs - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    }
  })();

  const activate = page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`measureScrollLatency: no element matches ${sel}`);
    el.click();
  }, selector);

  await Promise.all([activate, poll]);

  const moved = samples.find((s) => Math.abs(s.y - startY) >= movementEpsilonPx);
  const ys = samples.map((s) => s.y);
  return {
    startY,
    finalY: samples.length ? samples[samples.length - 1].y : startY,
    samples,
    firstMovementMs: moved ? moved.t : null,
    firstMovementY: moved ? moved.y : null,
    maxY: ys.length ? Math.max(...ys) : startY,
    minY: ys.length ? Math.min(...ys) : startY,
  };
}

/** Elapsed ms of the first sample satisfying `predicate(y)`, or null. */
export function timeToReach(samples, predicate) {
  const hit = samples.find((s) => predicate(s.y));
  return hit ? hit.t : null;
}

/**
 * Failure text for a missed latency bound.
 *
 * The diagnosis is spelled out because it is genuinely non-obvious: the control ends up in
 * the RIGHT PLACE, no error is logged, and only the timing is wrong, so the natural
 * reading of a bare "too slow" is a slow machine rather than a CSS declaration.
 */
export function scrollLatencyDiagnosis(label, measurement, scrollBehavior, budgetMs = FIRST_MOVEMENT_BUDGET_MS) {
  const observed =
    measurement.firstMovementMs === null
      ? `never moved within ${measurement.samples.length} samples`
      : `first movement at ${measurement.firstMovementMs}ms`;
  return (
    `${label}: ${observed}, budget ${budgetMs}ms ` +
    `(start y=${measurement.startY}, final y=${measurement.finalY}, computed scroll-behavior=${scrollBehavior}).\n` +
    '    LIKELY CAUSE: a global `scroll-behavior: smooth` on the scrolling element fighting ' +
    "jquery.scrolly's `.animate({scrollTop}, 1000)`.\n" +
    '    jQuery writes scrollTop once per frame; with smooth scrolling in force EVERY one of ' +
    'those ~60 writes starts a new smooth scroll, so the page does not visibly move until the ' +
    "1000ms animation ends and the last write sticks. The control still LANDS correctly, which is why " +
    'a final-position assertion passes while the interaction feels broken.\n' +
    '    Check the `html` rule in assets/sass/base/_page.scss and its mirror in assets/css/main.css. ' +
    'Measured here: smooth 1056ms vs auto 48ms to first movement. `preventDefault()` in scrolly does ' +
    'NOT help — it suppresses native fragment navigation, not scroll-behavior applied to programmatic ' +
    'scrollTop writes.'
  );
}

// ---------------------------------------------------------------------------
// Label-box helper — Properties 14 and 15
// ---------------------------------------------------------------------------

/**
 * Read the rendered LINE BOXES of an element's text content, one rect per line, from a
 * `Range` over its text nodes via `getClientRects()`.
 *
 * THIS IS THE SINGLE EASIEST THING IN THE HARNESS TO GET WRONG, and getting it wrong
 * produces a vacuous PASS rather than a failure:
 *
 *   - For Property 15 the anchor IS the pill. Measuring `el.getBoundingClientRect()`
 *     compares the pill to itself, so every width and height ratio comes back as 1.000
 *     and the checker reports all-pass while measuring nothing.
 *   - For Property 14 the heading's own box spans the full band width, so a bounding-box
 *     check passes for a flex-centred h2 whose internal lines are still left-ragged —
 *     the exact mistake design §5.2 rejects.
 *
 * A Range's `getClientRects()` returns one rect per rendered line, which is what makes
 * the forced-<br /> case and the auto-wrap case fall out of the same code.
 *
 * Returns `{ lines: [{x, y, width, height, top, right, bottom, left}], text }`, with
 * zero-area rects dropped (Chromium emits them for collapsed whitespace between nodes).
 */
export const LABEL_LINE_RECTS_FN = `(el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = [...range.getClientRects()]
    .filter((r) => r.width > 0.01 && r.height > 0.01)
    .map((r) => ({
      x: r.x, y: r.y, width: r.width, height: r.height,
      top: r.top, right: r.right, bottom: r.bottom, left: r.left,
    }))
    .sort((a, b) => a.top - b.top || a.left - b.left);

  // Merge rects that share a line: a heading containing an <a> yields one rect per inline
  // box, and two rects on the same baseline are one rendered LINE, not two.
  const lines = [];
  for (const r of rects) {
    const same = lines.find((l) => Math.abs(l.top - r.top) < 0.75 && Math.abs(l.height - r.height) < 0.75);
    if (same) {
      same.left = Math.min(same.left, r.left);
      same.right = Math.max(same.right, r.right);
      same.width = same.right - same.left;
      same.bottom = Math.max(same.bottom, r.bottom);
    } else {
      lines.push({ ...r });
    }
  }
  return { lines, text: (el.textContent || '').replace(/\\s+/g, ' ').trim() };
}`;

/**
 * Evaluate LABEL_LINE_RECTS_FN against every match of `selector` on `page`, alongside the
 * element's own border box and its resolved box metrics. One round trip per selector.
 */
export async function measureLabelBoxes(page, selector) {
  return page.evaluate(
    ({ sel, fnSource }) => {
      const lineRects = eval(fnSource);
      const out = [];
      for (const el of document.querySelectorAll(sel)) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        const cs = getComputedStyle(el);
        out.push({
          ...lineRects(el),
          box: {
            x: rect.x, y: rect.y, width: rect.width, height: rect.height,
            top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left,
          },
          style: {
            fontSize: parseFloat(cs.fontSize),
            fontWeight: cs.fontWeight,
            fontFamily: cs.fontFamily,
            lineHeight: cs.lineHeight,
            letterSpacing: cs.letterSpacing,
            whiteSpace: cs.whiteSpace,
            display: cs.display,
            alignItems: cs.alignItems,
            justifyContent: cs.justifyContent,
            heightDeclared: cs.height,
            minHeight: cs.minHeight,
            paddingTop: parseFloat(cs.paddingTop),
            paddingRight: parseFloat(cs.paddingRight),
            paddingBottom: parseFloat(cs.paddingBottom),
            paddingLeft: parseFloat(cs.paddingLeft),
            borderTopWidth: parseFloat(cs.borderTopWidth),
            borderRightWidth: parseFloat(cs.borderRightWidth),
            borderBottomWidth: parseFloat(cs.borderBottomWidth),
            borderLeftWidth: parseFloat(cs.borderLeftWidth),
            borderRadius: cs.borderRadius,
            backgroundColor: cs.backgroundColor,
            borderTopColor: cs.borderTopColor,
            color: cs.color,
            textOverflow: cs.textOverflow,
            textAlign: cs.textAlign,
          },
        });
      }
      return out;
    },
    { sel: selector, fnSource: LABEL_LINE_RECTS_FN },
  );
}

/**
 * Content-box edges of an element, derived from its border box minus border and padding.
 * Req 12 c2/c3 and Req 10 c1 are both stated against the CONTENT box, not the border box.
 */
export function contentBox({ box, style }) {
  return {
    left: box.left + style.borderLeftWidth + style.paddingLeft,
    right: box.right - style.borderRightWidth - style.paddingRight,
    top: box.top + style.borderTopWidth + style.paddingTop,
    bottom: box.bottom - style.borderBottomWidth - style.paddingBottom,
  };
}

/** Confirm the real webfonts are loaded before measuring — a swap-window measurement
 *  measures Helvetica, not Telegraf (design §5.4 Layer 2). */
export async function assertFontsLoaded(page, spec = '0.55rem "PP Telegraf"') {
  const ok = await page.evaluate(async (s) => {
    await document.fonts.ready;
    return document.fonts.check(s);
  }, spec);
  if (!ok) throw new Error(`webfont not loaded for ${spec} — measurement would be of the fallback face`);
  return ok;
}

/** Tear down every cached context and the shared browser. Call from a test teardown. */
export async function closeAll() {
  for (const page of contextCache.values()) {
    await page.context().close().catch(() => {});
  }
  contextCache.clear();
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close().catch(() => {});
    browserPromise = null;
  }
}

// ---------------------------------------------------------------------------
// Static-artifact helpers
// ---------------------------------------------------------------------------

export const readCompiledStylesheet = () =>
  fs.readFileSync(repoPath('assets', 'css', 'main.css'), 'utf8');

export const readSassFile = (relative) =>
  fs.readFileSync(repoPath('assets', 'sass', relative), 'utf8');

export const readContentPage = (page) => fs.readFileSync(repoPath(page), 'utf8');

/**
 * Determine a font file's real format from its sfnt signature, never its extension.
 * A mismatched format() hint is a Req 2 c6 failure and the extension cannot detect it.
 */
export function sfntFormat(absPath) {
  const fd = fs.openSync(absPath, 'r');
  const buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);
  const tag = buf.toString('latin1');
  if (tag === 'wOF2') return 'woff2';
  if (tag === 'wOFF') return 'woff';
  if (tag === 'OTTO') return 'opentype';
  if (tag === 'true' || tag === 'ttcf') return 'truetype';
  if (buf.readUInt32BE(0) === 0x00010000) return 'truetype';
  return `unknown(${JSON.stringify(tag)})`;
}

/**
 * Apply last-declaration-wins within a CSS rule body.
 *
 * Required, not cosmetic: the compiled CSS already carries `color` twice inside
 * `#footer` (an artifact of the color(alt) mixin) and twice inside `#copyright`.
 * A checker reading the first match reports a false failure.
 */
export function lastDeclaration(ruleBody, property) {
  const re = new RegExp(`(?:^|[;{])\\s*${property}\\s*:\\s*([^;}]+)`, 'gi');
  let value = null;
  for (const m of ruleBody.matchAll(re)) value = m[1].trim();
  return value;
}


// ===========================================================================
// Change Set 3 — Copyright_Row geometry, nav panel roles, documentation oracles
// ===========================================================================
//
// Design references: §6.1 (divider centring), §6.2 (nav panel weights), §6.3 (README and
// the Sync_Document), Properties 17 and 18.
//
// Nothing here asserts. The three groups below supply, in order: the Copyright_Row
// geometry the divider check needs, the nav panel role selectors and toggle geometry, and
// the documentation parsers Property 18 quantifies over.

// ---------------------------------------------------------------------------
// Copyright_Row selectors and label pairs — Property 17
// ---------------------------------------------------------------------------

export const COPYRIGHT_ROW = '#copyright ul';
export const COPYRIGHT_ITEMS = '#copyright ul li';
export const COPYRIGHT_ITEM_FIRST = '#copyright ul li:first-child';
export const COPYRIGHT_ITEM_SECOND = '#copyright ul li:nth-child(2)';

/** Req 15 c1 / c3 tolerance, and the c8 clearance floor. */
export const DIVIDER_CENTRE_TOLERANCE_PX = 1.0;
export const LABEL_CLEARANCE_FLOOR_PX = 8.0;

/**
 * The Side_By_Side_Layout viewports (Req 15 c2). 320px is the Stacked_Layout and is a
 * SEPARATE arm of Property 17, not a member of this list — Req 15 c6 scopes c1–c4 out of
 * it while c5 makes positive demands there.
 */
export const SIDE_BY_SIDE_VIEWPORTS = [768, 1024, 1440];

/**
 * The four pinned label pairs, plus the shape the sampled arm uses.
 *
 * A pair is `{ first, secondLead, secondLink }` rather than two strings, because the
 * second Copyright_Item is `Design: <a>HTML5 UP</a>` — a leading text node plus an anchor
 * — and the substitution must write BOTH without disturbing the element structure. The
 * rendered second label is `secondLead + secondLink`.
 *
 * Why these four and not just the shipped pair (Req 15 c4, risk R10):
 *   - S1 and S2 have offsets of OPPOSITE SIGN under the shipped mechanism (§6.1 derives
 *     −49.6px and +45.4px), so between them they distinguish a centred divider from one
 *     displaced by a constant. One of them alone cannot.
 *   - S3 is a CONTROL that the shipped, broken mechanism already PASSES, at a derived
 *     −0.1px, because its two labels are 0.17px apart in width. Req 15 c4 names the
 *     equal-count case, and a suite built around it alone would report a clean pass
 *     against a mechanism that is 20.1px off in production.
 */
export const COPYRIGHT_LABEL_PAIRS = [
  {
    name: 'shipped',
    first: 'Back to top',
    secondLead: 'Design: ',
    secondLink: 'HTML5 UP',
    deltaChars: 5,
    note: 'the state that must keep working',
  },
  {
    name: 'S1',
    first: 'Top',
    secondLead: 'Design: ',
    secondLink: 'HTML5 UP',
    deltaChars: 13,
    note: 'first label much shorter — Req 15 c4 ≥8 case',
  },
  {
    name: 'S2',
    first: 'Back to the top of this page',
    secondLead: 'Design: ',
    secondLink: 'HTML5 UP',
    deltaChars: 12,
    note: 'first label much longer — the opposite sign',
  },
  {
    name: 'S3',
    first: 'Return to top',
    secondLead: 'Design: ',
    secondLink: 'HTML5',
    deltaChars: 0,
    note: 'equal counts — Req 15 c4 equal case, and a control',
  },
];

export const SHIPPED_LABEL_PAIR = COPYRIGHT_LABEL_PAIRS[0];

/** Look a pinned pair up by name, for the measurement scripts. */
export const labelPair = (name) => {
  const found = COPYRIGHT_LABEL_PAIRS.find((p) => p.name === name);
  if (!found) throw new Error(`labelPair: no pinned pair named ${name}`);
  return found;
};

/**
 * Assign the two Copyright_Item labels IN THE PAGE UNDER TEST, and force a layout flush.
 *
 * THE PAGES ARE NEVER EDITED. Req 15 c12 and Req 17 c13 both forbid it; a substitution
 * baked into markup would have to be reverted before push, which Property 8's
 * byte-identity clause catches only if someone remembers to run it; and the matrix is
 * nine pages x three viewports x four pairs. A runtime assignment also tests the
 * MECHANISM rather than a document: it changes only the text layout consumes, which is
 * exactly the variable Req 15 c4 quantifies over.
 *
 * THE TRAP IS MEASURING BEFORE LAYOUT SETTLES, and it fails silently rather than loudly:
 * `textContent = …` schedules layout but does not perform it, so a `getBoundingClientRect()`
 * read can return the OLD geometry and every substitution then "passes" against the
 * shipped labels. Two defences, both here rather than at the call sites:
 *   1. The assignment and a forced synchronous reflow (`offsetHeight`) happen in the SAME
 *      in-page task, so layout is already up to date when this function returns.
 *   2. `document.fonts.ready` is awaited, because a substituted label may introduce a
 *      character the face has not yet been asked for.
 *
 * requestAnimationFrame is deliberately NOT used to wait for the frame: rAF is throttled
 * in these headless contexts (see the Check J note above), so a rAF await can hang or
 * resolve arbitrarily late. The forced reflow is synchronous and sufficient.
 *
 * Returns the pair that was previously in place, so a caller can restore it.
 */
export async function substituteCopyrightLabels(page, pair) {
  const previous = await page.evaluate(
    async ({ first, secondLead, secondLink }) => {
      const items = [...document.querySelectorAll('#copyright ul li')];
      if (items.length !== 2) {
        throw new Error(`expected 2 Copyright_Item elements, found ${items.length}`);
      }

      const firstAnchor = items[0].querySelector('a');
      if (!firstAnchor) throw new Error('first Copyright_Item has no anchor');

      const secondAnchor = items[1].querySelector('a');
      if (!secondAnchor) throw new Error('second Copyright_Item has no anchor');
      const leadNode = [...items[1].childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
      if (!leadNode) throw new Error('second Copyright_Item has no leading text node');

      const before = {
        first: firstAnchor.textContent,
        secondLead: leadNode.nodeValue,
        secondLink: secondAnchor.textContent,
      };

      firstAnchor.textContent = first;
      leadNode.nodeValue = secondLead;
      secondAnchor.textContent = secondLink;

      // Forced synchronous reflow — see the note above. `void` so the read is not elided.
      void document.documentElement.offsetHeight;
      await document.fonts.ready;
      void document.documentElement.offsetHeight;

      return before;
    },
    { first: pair.first, secondLead: pair.secondLead, secondLink: pair.secondLink },
  );
  return previous;
}

/** Run `fn` with a substituted label pair in place, restoring the originals afterwards. */
export async function withCopyrightLabels(page, pair, fn) {
  const previous = await substituteCopyrightLabels(page, pair);
  try {
    return await fn();
  } finally {
    await substituteCopyrightLabels(page, previous);
  }
}

/**
 * Measure the Copyright_Row, the Copyright_Divider, the two labels and the Copyright_Block.
 *
 * Three oracle details are implemented here so that no call site can get them wrong:
 *
 *  1. **The divider box comes from the second item's `left` plus half its RESOLVED
 *     `border-left-width`**, never from the `li` rect and never from an assumed 2px. The
 *     divider is a border painted INSIDE the second item, so the `li` rect's centre is the
 *     half's centre — a completely different quantity that happens to be within a pixel of
 *     the right answer only once the fix has landed. Reading the `li` rect makes Property 17
 *     PASS on the unmodified tree, which is a broken checker rather than good news.
 *  2. **Label glyph extents come from a Range over each item's contents**, via the existing
 *     LABEL_LINE_RECTS_FN. The `li` IS the half after §6.1, so measuring the `li` rect
 *     would report every clearance back as the declared padding regardless of the text.
 *  3. **Content boxes are derived from the border box minus resolved border and padding**,
 *     because Req 15 c1 and c3 are both stated against content boxes.
 *
 * `dividerRendered` is false when the resolved `border-left-width` is 0 — the
 * Stacked_Layout case, where Req 15 c5/c6 apply instead of c1–c4.
 */
export async function measureCopyrightRow(page) {
  return page.evaluate((fnSource) => {
    const lineRects = eval(fnSource);
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left };
    };
    const metrics = (el) => {
      const cs = getComputedStyle(el);
      return {
        display: cs.display,
        textAlign: cs.textAlign,
        minHeight: cs.minHeight,
        alignItems: cs.alignItems,
        justifyContent: cs.justifyContent,
        flexBasis: cs.flexBasis,
        flexGrow: cs.flexGrow,
        flexShrink: cs.flexShrink,
        minWidth: cs.minWidth,
        marginLeft: parseFloat(cs.marginLeft),
        marginTop: parseFloat(cs.marginTop),
        paddingTop: parseFloat(cs.paddingTop),
        paddingRight: parseFloat(cs.paddingRight),
        paddingBottom: parseFloat(cs.paddingBottom),
        paddingLeft: parseFloat(cs.paddingLeft),
        borderLeftWidth: parseFloat(cs.borderLeftWidth),
        borderRightWidth: parseFloat(cs.borderRightWidth),
        borderTopWidth: parseFloat(cs.borderTopWidth),
        borderBottomWidth: parseFloat(cs.borderBottomWidth),
        borderLeftColor: cs.borderLeftColor,
        borderLeftStyle: cs.borderLeftStyle,
        color: cs.color,
        fontSize: parseFloat(cs.fontSize),
        lineHeight: cs.lineHeight,
        textOverflow: cs.textOverflow,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
      };
    };
    const content = (b, m) => ({
      left: b.left + m.borderLeftWidth + m.paddingLeft,
      right: b.right - m.borderRightWidth - m.paddingRight,
      top: b.top + m.borderTopWidth + m.paddingTop,
      bottom: b.bottom - m.borderBottomWidth - m.paddingBottom,
    });

    const block = document.querySelector('#copyright');
    const row = document.querySelector('#copyright ul');
    const items = [...document.querySelectorAll('#copyright ul li')];
    if (!block || !row || items.length !== 2) {
      throw new Error('measureCopyrightRow: Copyright_Block structure not as expected');
    }

    const blockBox = box(block);
    const blockM = metrics(block);
    const rowBox = box(row);
    const rowM = metrics(row);
    const rowContent = content(rowBox, rowM);

    // Group the Range rects that share a top into ONE rendered line.
    //
    // LABEL_LINE_RECTS_FN merges only rects whose top AND height agree within 0.75px, which
    // is right for Properties 14 and 15. A Copyright_Item is `<a>Back to top</a>` or
    // `Design: <a>HTML5 UP</a>`, so Chromium emits an inline-box rect and a text rect on the
    // SAME baseline whose heights differ by 1px — reporting two lines for one rendered line.
    // Left unadjusted, Req 15 c5's "one line each" clause at 320px would fail on a correct
    // layout. Grouping by top only, here, leaves the shared helper's semantics alone.
    const groupByTop = (lines) => {
      const groups = [];
      for (const r of lines) {
        const same = groups.find((g) => Math.abs(g.top - r.top) < 1.5);
        if (same) {
          same.left = Math.min(same.left, r.left);
          same.right = Math.max(same.right, r.right);
          same.bottom = Math.max(same.bottom, r.bottom);
          same.width = same.right - same.left;
        } else {
          groups.push({ ...r });
        }
      }
      return groups;
    };

    const itemData = items.map((el) => {
      const b = box(el);
      const m = metrics(el);
      const { lines, text } = lineRects(el);
      const visualLines = groupByTop(lines);
      const glyphLeft = lines.length ? Math.min(...lines.map((l) => l.left)) : null;
      const glyphRight = lines.length ? Math.max(...lines.map((l) => l.right)) : null;
      return {
        box: b,
        style: m,
        content: content(b, m),
        lines,
        visualLines,
        lineCount: visualLines.length,
        text,
        glyphLeft,
        glyphRight,
      };
    });

    // Detail 1: the divider is the second item's border-left, painted inside its left edge.
    const borderWidth = itemData[1].style.borderLeftWidth;
    const dividerRendered = borderWidth > 0;
    const divider = dividerRendered
      ? {
          left: itemData[1].box.left,
          right: itemData[1].box.left + borderWidth,
          centre: itemData[1].box.left + borderWidth / 2,
          width: borderWidth,
          colour: itemData[1].style.borderLeftColor,
          style: itemData[1].style.borderLeftStyle,
        }
      : null;

    const rowCentre = (rowContent.left + rowContent.right) / 2;
    const blockContent = content(blockBox, blockM);
    const blockCentre = (blockContent.left + blockContent.right) / 2;

    return {
      viewportWidth: window.innerWidth,
      rootFontSizePx: parseFloat(getComputedStyle(document.documentElement).fontSize),
      block: { box: blockBox, style: blockM, content: blockContent, centre: blockCentre },
      row: { box: rowBox, style: rowM, content: rowContent, centre: rowCentre },
      items: itemData,
      divider,
      dividerRendered,
      signedOffset: dividerRendered ? divider.centre - rowCentre : null,
      rowCentreVsBlockCentre: rowCentre - blockCentre,
      clearances: dividerRendered
        ? {
            left: itemData[0].glyphRight === null ? null : divider.left - itemData[0].glyphRight,
            right: itemData[1].glyphLeft === null ? null : itemData[1].glyphLeft - divider.right,
          }
        : null,
      documentOverflowsHorizontally:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  }, LABEL_LINE_RECTS_FN);
}

/**
 * Does any label glyph rect intersect the divider box? (Req 15 c8, no-overlap clause.)
 *
 * Separate from the clearance numbers because a NEGATIVE clearance and an INTERSECTION are
 * not the same failure: candidate (c) in §6.1 — an absolutely positioned divider — puts the
 * divider through a glyph while the arithmetic distance between the boxes stays positive.
 */
export function labelIntersectsDivider(measurement) {
  if (!measurement.dividerRendered) return false;
  const { left, right } = measurement.divider;
  return measurement.items.some((item) =>
    item.lines.some((line) => line.right > left + 0.01 && line.left < right - 0.01),
  );
}

// ---------------------------------------------------------------------------
// Nav panel roles and toggle geometry — Requirement 16
// ---------------------------------------------------------------------------

export const NAV_PANEL_TOGGLE = '#navPanelToggle';
export const NAV_PANEL_TOGGLE_ICON_RULE = '#navPanelToggle:before';
export const NAV_PANEL_LINK = '#navPanel .links li a';
export const NAV_PANEL_CLOSE = '#navPanel .close';
export const NAV_PANEL = '#navPanel';
export const NAV_PANEL_INNER = '#navPanel nav';

/**
 * The `#header` title, for the Req 16 c11 clearance.
 *
 * `#header .logo` exists on the EIGHT project pages. `index.html` has no `#header` at all —
 * it carries `#intro h1` instead — so the clearance there is measured against the intro
 * heading, which is the element the fixed toggle actually overlays on that page. Recording
 * `null` for index.html would leave c11 unverifiable on the one page whose title is largest.
 */
export const HEADER_TITLE = '#header .logo';
export const INTRO_TITLE = '#intro h1';

/** The `<=medium` viewports — the only widths where the toggle and panel are not `display: none`. */
export const NAV_PANEL_VIEWPORTS = [320, 768];

/** Req 16 c10: the toggle's pinned offsets, in rem. */
export const TOGGLE_PIN_REM = 0.75;

/**
 * Open the nav panel, without clicking the toggle.
 *
 * The panel's visibility is driven by `is-navPanel-visible` on `<body>` (main.js `.panel()`
 * with `visibleClass`), and clicking the toggle navigates to `#navPanel`, which scrolls the
 * document — corrupting any geometry read afterwards, exactly as the Check J activation note
 * describes. Adding the class reaches the same rendered state with no scroll and no
 * 500ms `delay` to wait out.
 */
export async function openNavPanel(page) {
  await page.evaluate(async () => {
    document.body.classList.add('is-navPanel-visible');
    void document.documentElement.offsetHeight;
    await document.fonts.ready;
    void document.documentElement.offsetHeight;
  });
  // The panel transitions on transform; settle before measuring.
  await new Promise((r) => setTimeout(r, 400));
}

export async function closeNavPanel(page) {
  await page.evaluate(() => {
    document.body.classList.remove('is-navPanel-visible');
    void document.documentElement.offsetHeight;
  });
  await new Promise((r) => setTimeout(r, 400));
}

/**
 * Measure the Nav_Panel_Toggle, the page title it grows toward, and the Nav_Panel_Links.
 *
 * The toggle is `position: fixed` with `right: 0.75rem` and `width: auto`, so a heavier
 * label cannot move it — the box GROWS LEFTWARD, toward the title. That makes the two
 * quantities Req 16 c21 names (border-box width, left border-box edge x) the ones worth
 * recording, and it makes the clearance a DIFFERENCE BETWEEN TWO EDGES: recording only the
 * toggle's edge would leave c11 unverifiable from the record.
 */
export async function measureNavPanelGeometry(page) {
  return page.evaluate((fnSource) => {
    const lineRects = eval(fnSource);
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left };
    };
    const describe = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const { lines, text } = lineRects(el);
      return {
        box: box(el),
        lines,
        lineCount: lines.length,
        text,
        glyphLeft: lines.length ? Math.min(...lines.map((l) => l.left)) : null,
        glyphRight: lines.length ? Math.max(...lines.map((l) => l.right)) : null,
        style: {
          display: cs.display,
          position: cs.position,
          fontFamily: cs.fontFamily,
          fontSize: parseFloat(cs.fontSize),
          fontWeight: cs.fontWeight,
          letterSpacing: cs.letterSpacing,
          textTransform: cs.textTransform,
          textOverflow: cs.textOverflow,
          whiteSpace: cs.whiteSpace,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          boxShadow: cs.boxShadow,
          border: cs.border,
          paddingTop: parseFloat(cs.paddingTop),
          paddingRight: parseFloat(cs.paddingRight),
          paddingBottom: parseFloat(cs.paddingBottom),
          paddingLeft: parseFloat(cs.paddingLeft),
          transition: cs.transitionProperty + ' ' + cs.transitionDuration,
        },
      };
    };

    const toggle = document.querySelector('#navPanelToggle');
    const headerTitle = document.querySelector('#header .logo');
    const introTitle = document.querySelector('#intro h1');
    const titleEl = headerTitle || introTitle;
    const panel = document.querySelector('#navPanel');
    const close = document.querySelector('#navPanel .close');
    const links = [...document.querySelectorAll('#navPanel .links li a')].map(describe);

    // The label's own glyph extent, excluding the :before icon glyph, comes from the Range;
    // the icon is a pseudo-element and Ranges never see it. That is exactly what Req 16 c21
    // wants for "rendered label width", and the border box below carries the icon's cost.
    const toggleData = describe(toggle);
    const titleData = describe(titleEl);

    let panelContent = null;
    if (panel) {
      const cs = getComputedStyle(panel);
      const b = box(panel);
      panelContent = {
        box: b,
        left: b.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft),
        right: b.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight),
        width:
          b.width -
          parseFloat(cs.borderLeftWidth) -
          parseFloat(cs.borderRightWidth) -
          parseFloat(cs.paddingLeft) -
          parseFloat(cs.paddingRight),
        display: cs.display,
      };
    }

    const iconStyle = toggle ? getComputedStyle(toggle, ':before') : null;

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      rootFontSizePx: parseFloat(getComputedStyle(document.documentElement).fontSize),
      toggle: toggleData,
      toggleIcon: iconStyle
        ? { fontFamily: iconStyle.fontFamily, fontWeight: iconStyle.fontWeight, content: iconStyle.content, marginRight: iconStyle.marginRight }
        : null,
      title: titleData,
      titleSource: headerTitle ? '#header .logo' : introTitle ? '#intro h1' : null,
      clearance:
        toggleData && titleData && titleData.glyphRight !== null
          ? toggleData.box.left - titleData.glyphRight
          : null,
      // Req 16 c11 is a NO-OVERLAP criterion, and overlap is two-dimensional. The
      // horizontal clearance above is the number the record needs (c21), but on
      // `index.html` it is negative and harmless: the intro `h1` is a full-width centred
      // heading far below a toggle pinned 0.75rem from the top, so the boxes share x-extent
      // and never touch. Asserting c11 on the horizontal figure alone would report a
      // non-defect on the one page that has no `#header` title at all.
      titleOverlaps2D:
        toggleData && titleData
          ? toggleData.lines.some((t) =>
              titleData.lines.some(
                (h) =>
                  t.right > h.left + 0.01 &&
                  t.left < h.right - 0.01 &&
                  t.bottom > h.top + 0.01 &&
                  t.top < h.bottom - 0.01,
              ),
            )
          : false,
      titleVerticalGap:
        toggleData && titleData
          ? Math.max(...titleData.lines.map((h) => h.top)) - Math.min(...toggleData.lines.map((t) => t.bottom))
          : null,
      panel: panelContent,
      close: close ? { box: box(close), display: getComputedStyle(close).display } : null,
      links,
      documentOverflowsHorizontally:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  }, LABEL_LINE_RECTS_FN);
}

// ---------------------------------------------------------------------------
// Documentation oracles — Property 18
// ---------------------------------------------------------------------------

export const README_PATH = 'README.md';
export const SYNC_DOCUMENT_PATH = path.join('docs', 'stylesheet-sync.md');
export const PROVENANCE_PATH = path.join('assets', 'webfonts', 'FONT-PROVENANCE.md');
export const WORKFLOW_PATH = path.join('.github', 'workflows', 'static.yml');

/** Req 17 c2 and c4 bounds. */
export const README_MAX_LINES = 40;
export const FONTS_CREDIT_MAX_LINES = 4;

export const readRepoText = (relative) => fs.readFileSync(repoPath(relative), 'utf8');
export const readReadme = () => readRepoText(README_PATH);
export const readSyncDocument = () =>
  fs.existsSync(repoPath(SYNC_DOCUMENT_PATH)) ? readRepoText(SYNC_DOCUMENT_PATH) : null;
export const readProvenanceRecord = () => readRepoText(PROVENANCE_PATH);
export const readWorkflow = () => readRepoText(WORKFLOW_PATH);

/** Line count as a reader sees it: a trailing newline does not add a line. */
export const countLines = (text) => text.replace(/\n$/, '').split('\n').length;

/**
 * Every Markdown inline link in `text`, as `{ label, target }`.
 *
 * DISCOVERED BY PARSING, never hardcoded. Both the link set and the required-item set
 * change whenever either document is edited — which is precisely the edit this check
 * exists to guard — so a fixture list would go stale at the worst possible moment.
 *
 * The label pattern allows one level of nested brackets so that a code-span label such as
 * [`docs/stylesheet-sync.md`] is captured whole.
 */
export function parseMarkdownLinks(text) {
  const out = [];
  const re = /\[((?:[^\][]|\[[^\]]*\])*)\]\(([^()\s]+)(?:\s+"[^"]*")?\)/g;
  for (const m of text.matchAll(re)) {
    out.push({ label: m[1], target: m[2] });
  }
  return out;
}

export const isAbsoluteLink = (target) => /^[a-z][a-z0-9+.-]*:/i.test(target);

/**
 * Resolve a relative Markdown target AGAINST THE REPOSITORY, not the deployed origin.
 *
 * Req 17 c11 adds `docs` to the workflow's prune step, so `docs/stylesheet-sync.md` is
 * DELIBERATELY absent from GitHub Pages (§6.3). A checker pointed at the live site would
 * report a false failure on a file whose absence is the design. The README is read on
 * GitHub, which is where its links must resolve.
 */
export function resolveRepoLink(target) {
  const clean = String(target).split('#')[0].split('?')[0];
  if (!clean) return { target, kind: 'fragment', exists: true };
  if (isAbsoluteLink(clean)) return { target, kind: 'absolute', exists: true };
  return {
    target,
    kind: 'relative',
    path: clean,
    exists: fs.existsSync(repoPath(clean)),
  };
}

/**
 * The four attributions Req 17 c3 enumerates, as PRESENCE oracles.
 *
 * PRESENCE IS CHECKED; ADEQUACY IS NOT. Whether the credits constitute sufficient
 * attribution is a licence reading (design §5.5, risk R8), not something a test decides.
 * What is checkable is the enumerated facts: the named parties per credit, and for each
 * typeface its name, its designer or foundry, and a licence tier.
 *
 * The fonts entry reads A LICENCE TIER PER TYPEFACE rather than matching the literal
 * string "non-commercial". The owner's README words both tiers as "free for personal use";
 * Telegraf's tier is a free personal / non-commercial tier and that condition is stated in
 * full in the Sync_Document's standing-obligation statement and in the Provenance_Record.
 * Matching "non-commercial" in the README would report a false failure against the owner's
 * own wording (task 30.1).
 */
export const REQUIRED_ATTRIBUTIONS = [
  {
    id: 'template',
    what: 'Massively / HTML5 UP template credit with a Markdown link to https://html5up.net',
    patterns: [/Massively/i, /HTML5\s*UP/i, /\]\(https:\/\/html5up\.net\)/],
  },
  {
    id: 'icons',
    what: 'Font Awesome icons credit',
    patterns: [/Font\s*Awesome/i],
  },
  {
    id: 'libraries',
    what: 'jQuery / Scrollex / Responsive Tools libraries credit',
    patterns: [/jQuery/i, /Scrollex/i, /Responsive\s*Tools/i],
  },
  {
    id: 'fonts',
    what: 'fonts credit naming both typefaces and both designers',
    patterns: [/Horizon/, /Alberto\s*Fontense/i, /Telegraf/, /Pangram\s*Pangram/i],
  },
];

/**
 * The per-typeface facts Req 17 c3 and Req 9 c3 require: the typeface name, its designer or
 * foundry, and a licence tier, for each of the two typefaces.
 *
 * Read from a WHITESPACE-NORMALISED segment rather than from a single line, because both
 * the current and the target README wrap the fonts credit across lines — the owner's
 * version uses trailing two-space hard breaks. A line-anchored matcher passes or fails on
 * where the wrap happens to fall, which is not what the criterion is about.
 */
export function normaliseMarkdown(text) {
  return String(text).replace(/\*\*|`/g, '').replace(/\s+/g, ' ');
}

export function fontsCreditFacts(readme = readReadme()) {
  const norm = normaliseMarkdown(readme);
  const specs = [
    { typeface: 'Horizon', designer: /Alberto\s*Fontense/i },
    { typeface: 'Telegraf', designer: /Pangram\s*Pangram/i },
  ];
  const tier = /free[^.]{0,80}personal/i;
  const indices = specs.map((s) => norm.indexOf(s.typeface));

  return specs.map((spec, i) => {
    const start = indices[i];
    if (start === -1) {
      return { ...spec, present: false, designerFound: false, tierFound: false, segment: '' };
    }
    const laterStarts = indices.filter((idx) => idx > start);
    const end = laterStarts.length ? Math.min(...laterStarts) : Math.min(norm.length, start + 400);
    const segment = norm.slice(start, end);
    return {
      typeface: spec.typeface,
      present: true,
      designerFound: spec.designer.test(segment),
      tierFound: tier.test(segment),
      segment,
    };
  });
}

/** Req 17 c1: heading, the deployed-site line, and a Credits section. */
export const README_STRUCTURE_PATTERNS = [
  { id: 'h1', pattern: /^#\s+\S/m, what: 'a level-1 heading naming the site' },
  {
    id: 'deployed-link',
    pattern: /\]\(https:\/\/jefferyxr\.github\.io\/personal-website\/index\.html\)/,
    what: 'one line of body text linking the deployed site',
  },
  { id: 'credits', pattern: /^##\s+Credits\s*$/m, what: 'a `## Credits` section' },
];

/** Req 7 c11 / Req 17 c7: the Sync_Document linked in ONE line of body text. */
export const SYNC_LINK_PATTERN = /\[[^\]]*docs\/stylesheet-sync\.md[^\]]*\]\(docs\/stylesheet-sync\.md\)/;

/**
 * The eight items Req 7 c12 pins, in EXECUTION ORDER.
 *
 * `anchor` locates the item; `patterns` are the details that must survive with it. The
 * order of this array is asserted against the order the items appear in the document,
 * because c12 requires each item "in its execution position" — a procedure with all eight
 * items shuffled is not the procedure.
 */
export const SYNC_REQUIRED_ITEMS = [
  {
    n: 1,
    id: 'sass-edit-step',
    anchor: /libs\/_vars\.scss/,
    patterns: [
      /libs\/_vars\.scss/,
      /base\/_typography\.scss/,
      /layout\/_footer\.scss/,
      /layout\/_navPanel\.scss/,
      /layout\/_main\.scss/,
      /layout\/_intro\.scss/,
      /layout\/_nav\.scss/,
      /components\/_button\.scss|_button\.scss/,
      /_form\.scss/,
      /_pagination\.scss/,
      /_table\.scss/,
    ],
    what: 'the SASS edit step naming libs/_vars.scss first and then every rule-level file',
  },
  {
    n: 2,
    id: 'map-resolution-step',
    anchor: /_font\(family\)/,
    patterns: [/_font\(family\)/, /"PP Telegraf",\s*"Helvetica Neue",\s*"Segoe UI",\s*Roboto,\s*sans-serif/],
    what: 'the by-hand map-resolution step with the expanded stack',
  },
  {
    n: 3,
    id: 'every-location-step',
    anchor: /every\*{0,2}\s*location/i,
    patterns: [/assets\/css\/main\.css/, /\b11\b/],
    what: 'the "apply the change at every location in assets/css/main.css" step',
  },
  {
    n: 4,
    id: 'import-order-step',
    anchor: /@import\s*url\(fontawesome-all\.min\.css\)/,
    patterns: [/@font-face/, /line 1/i, /icon/i],
    what: 'the @import / @font-face ordering step',
  },
  {
    n: 5,
    id: 'parity-step',
    anchor: /last[- ]declaration[- ]wins/i,
    patterns: [
      /parity/i,
      /#footer/,
      /#copyright/,
      /#ffffff/i,
      /rgba\(255,\s*255,\s*255,\s*0\.65\)/,
      /pill/i,
      /browser/i,
      /_navPanel\.scss:85/,
    ],
    what: 'the parity-verification step with the last-declaration-wins caveat and the browser-measured pill instruction',
  },
  {
    n: 6,
    id: 'zero-occurrence-step',
    anchor: /zero[- ]occurrence|zero occurrences/i,
    patterns: [/Merriweather/, /Source Sans Pro/, /#4a5158/i, /scroll-behavior/, /prefers-reduced-motion/],
    what: 'the zero-occurrence step for Merriweather, Source Sans Pro, #4a5158, scroll-behavior and prefers-reduced-motion',
  },
  {
    n: 7,
    id: 'copyright-markup-step',
    anchor: /Copyright_Block markup/i,
    patterns: [/killerbyte\.html/, /launchtoy\.html/, /vexlego\.html/, /byte-identical/i],
    what: 'the per-page Copyright_Block markup verification step',
  },
  {
    n: 8,
    id: 'scroll-behaviour-guard',
    anchor: /_page\.scss:31/,
    patterns: [/main\.css:145/, /re-?add/i],
    what: 'the carried-forward scroll-behavior guard note at the line where someone would re-add it',
  },
];

/**
 * Req 17 c9 — every statement removed from the README survives somewhere.
 *
 * THE ORACLE READS THE PROVENANCE_RECORD RATHER THAN WRITING IT. Req 17 c9 permits
 * relocation into the Sync_Document OR the Provenance_Record, and Req 17 c13 requires the
 * Provenance_Record to be UNCHANGED; both hold simultaneously because the two statements
 * routed there are already present in it (§6.3). A statement found in neither location
 * fails BY NAME.
 */
export const RELOCATED_STATEMENTS = [
  {
    id: 'declared-weights-table',
    where: 'provenance',
    patterns: [/usWeightClass/, /Horizon\.woff2/, /PPTelegraf-Regular\.otf/, /PPTelegraf-Ultrabold\.otf/, /\b700\b/, /\b800\b/],
    what: 'the declared-weights table (weight-heading 700, weight 400, weight-bold 800, each against its file)',
  },
  {
    id: 'no-italic-face-note',
    where: 'provenance',
    patterns: [/Italics/i, /none shipped/i, /<em>/],
    what: 'the no-italic-face note',
  },
  {
    id: 'non-commercial-standing-obligation',
    where: 'sync',
    patterns: [/non-commercial|non commercial/i, /standing/i, /Web\*{0,2}\s*licence|Web licence/i, /pageview/i],
    what: 'the non-commercial standing-obligation statement',
  },
  {
    id: 'regeneration-procedure',
    where: 'sync',
    patterns: [/assets\/css\/main\.css/, /parity/i],
    what: 'the regeneration procedure and its parity caveats',
  },
];

/** Req 17 c10 — the Provenance_Record reference, which the owner's README no longer carries. */
export const PROVENANCE_REFERENCE_PATTERN = /assets\/webfonts\/FONT-PROVENANCE\.md/;

/** Req 17 c11 — the prune step must name all three directories. */
export const PRUNE_STEP_PATTERN = /rm\s+-rf\s+([^\n]+)/;
export const PRUNE_REQUIRED_ENTRIES = ['tools', '.kiro', 'docs'];

/** Extract the prune-step targets from the workflow, in declaration order. */
export function pruneStepEntries(workflowText = readWorkflow()) {
  const m = PRUNE_STEP_PATTERN.exec(workflowText);
  if (!m) return null;
  return m[1].trim().split(/\s+/);
}

/**
 * The `**Fonts:**` bullet of the Readme_Credits, as its own lines (Req 17 c4: ≤4 lines).
 *
 * A bullet runs from its own marker to the next blank line or next top-level marker, so
 * continuation lines count — which is the point of the cap.
 */
export function fontsCreditLines(readme = readReadme()) {
  const lines = readme.replace(/\n$/, '').split('\n');
  // `Typefaces` is accepted alongside `Fonts` so that the PRE-change README yields a real
  // measurement (11 lines) rather than `null`. A null would make the c4 clause vacuous on
  // the tree the baseline run is taken against, which is the run that has to demonstrate
  // the checker discriminates.
  const start = lines.findIndex((l) => /^\s*[-*]\s+\*\*(Fonts?|Typefaces?):?\*\*/i.test(l));
  if (start === -1) return null;
  const out = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) break;
    // Break only on a TOP-LEVEL marker or a heading. An INDENTED sub-bullet is part of this
    // bullet and must be counted: the pre-change credit lists its two typefaces as nested
    // bullets across eleven lines, and a matcher that stopped at the first sub-bullet would
    // score it as one line and pass the ≤4 cap vacuously on the very tree the baseline run
    // has to discriminate.
    if (/^[-*]\s/.test(line)) break;
    if (/^#{1,6}\s/.test(line)) break;
    out.push(line);
  }
  return out;
}
