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
 * Accepted contrast shortfalls — Property 1. EXACTLY TWO ENTRIES.
 *
 * Both are settled by explicit owner decision ("email link only"), which makes Req 1 c11
 * win over Req 3 c14 and Req 5 c6. They are reported as known-and-accepted with their
 * conflict IDs, NOT as failures, and they must NOT be "fixed" under this spec.
 *
 * Adding a third entry is an owner scope decision, not a test fix.
 */
export const ACCEPTED_CONTRAST_EXCEPTIONS = [
  {
    conflict: 'C2',
    what: '#footer h3 (Heading_Text)',
    foreground: '#717981',
    backdrop: '#f5f5f5',
    measured: 4.05,
    threshold: 4.5,
    ruling: 'Req 1 c11 wins over Req 3 c14 — leave unchanged.',
  },
  {
    conflict: 'C3',
    what: '#copyright (Chrome_Text)',
    foreground: 'rgba(255, 255, 255, 0.25)',
    backdrop: '#1e252d',
    measured: 2.29,
    threshold: 4.5,
    ruling: 'Req 1 c11 wins over Req 5 c6 — leave unchanged.',
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
