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
  'regular-navpanel-link': '#navPanel .links li a',
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
