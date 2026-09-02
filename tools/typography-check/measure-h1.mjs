/**
 * Check G step 3 — browser confirmation of the intro and project-page `h1` sizes.
 *
 * The fontTools advance-width arithmetic in design §3.3 sums `hmtx` advances, which
 * EXCLUDES Horizon's GPOS kerning. At 768px the arithmetic cap for "JEFFERY ROSS" is
 * 4.033rem against 650.7px of content width -- about 0.8% of margin. That is too thin to
 * trust from arithmetic alone, so this harness renders the real page with the real fonts
 * and measures the laid-out result.
 *
 * Selection rule: the largest candidate at or below 4rem, in 0.25rem steps, that holds
 * ONE line at 768/1024/1440 with at least ~2% of width margin.
 *
 * Run: node measure-h1.mjs
 */

import { getBrowser, closeAll, repoPath, VIEWPORTS } from './fixtures.mjs';

const MARGIN_TARGET = 0.02; // 2% of the content box
const CANDIDATES = [4, 3.75, 3.5, 3.25, 3];

/**
 * Measure a heading under an overridden font-size.
 *
 * scrollWidth vs clientWidth is not sufficient on its own here: the h1 is a block that
 * wraps rather than overflowing, so an over-wide string produces a second LINE, not a
 * horizontal overflow. Line count is therefore the primary oracle and the width figures
 * are what quantify the remaining margin.
 */
async function measure(page, selector, sizeRem) {
  return page.evaluate(
    ({ selector, sizeRem }) => {
      const el = document.querySelector(selector);
      if (!el) return null;

      const previous = el.style.fontSize;
      if (sizeRem !== null) el.style.fontSize = `${sizeRem}rem`;
      // Force layout.
      void el.offsetHeight;

      const cs = getComputedStyle(el);
      const parent = el.parentElement;
      const pcs = getComputedStyle(parent);
      const available =
        parent.clientWidth -
        parseFloat(pcs.paddingLeft) -
        parseFloat(pcs.paddingRight);

      // Widest laid-out line, from the client rects of a range over the text.
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);

      // Distinct baselines => distinct lines. Round to 1px to absorb subpixel jitter.
      const tops = new Set(rects.map((r) => Math.round(r.top)));
      const widest = rects.length ? Math.max(...rects.map((r) => r.width)) : 0;

      const result = {
        text: el.textContent.replace(/\s+/g, ' ').trim(),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
        lineCount: tops.size,
        widestLinePx: Math.round(widest * 100) / 100,
        availablePx: Math.round(available * 100) / 100,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        docOverflows: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
      result.marginPct =
        Math.round(((available - widest) / available) * 10000) / 100;

      el.style.fontSize = previous;
      return result;
    },
    { selector, sizeRem },
  );
}

async function loadPage(browser, file, width) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`file://${repoPath(file)}`, { waitUntil: 'load' });
  await page
    .waitForFunction(() => !document.body.classList.contains('is-preload'), { timeout: 5000 })
    .catch(() => {});
  // Confirm the real webfonts actually loaded before trusting any measurement.
  const fontsOk = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      horizon: document.fonts.check('700 1rem Horizon'),
      telegraf: document.fonts.check('400 1rem "PP Telegraf"'),
      telegrafBold: document.fonts.check('800 1rem "PP Telegraf"'),
      loaded: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`),
    };
  });
  return { context, page, fontsOk };
}

async function main() {
  const browser = await getBrowser();

  console.log('='.repeat(78));
  console.log('INTRO h1 — "Jeffery Ross" (index.html)');
  console.log('='.repeat(78));

  // Confirm the fonts are genuinely loaded, once.
  {
    const { context, fontsOk } = await loadPage(browser, 'index.html', 768);
    console.log('font-face availability:', JSON.stringify(fontsOk, null, 2));
    await context.close();
  }

  const oneLineViewports = [768, 1024, 1440]; // Req 3 c12
  const results = {};

  for (const width of oneLineViewports) {
    const { context, page } = await loadPage(browser, 'index.html', width);
    results[width] = {};
    for (const size of CANDIDATES) {
      results[width][size] = await measure(page, '#intro h1', size);
    }
    await context.close();
  }

  console.log('\n  size   ' + oneLineViewports.map((w) => `${w}px: lines widest/avail (margin)`).join('   '));
  for (const size of CANDIDATES) {
    const cells = oneLineViewports.map((w) => {
      const r = results[w][size];
      return `${r.lineCount}L ${r.widestLinePx}/${r.availablePx} (${r.marginPct}%)`;
    });
    console.log(`  ${String(size).padEnd(6)} ${cells.join('   ')}`);
  }

  const chosen = CANDIDATES.find((size) =>
    oneLineViewports.every((w) => {
      const r = results[w][size];
      return r.lineCount === 1 && !r.docOverflows && r.marginPct >= MARGIN_TARGET * 100;
    }),
  );
  console.log(`\n  => SELECTED intro h1 (default): ${chosen}rem`);
  console.log(`     (largest <=4rem holding one line at 768/1024/1440 with >=2% margin)`);

  // 320px: Req 3 c13 permits at most two lines, no truncation, no h-scroll.
  {
    const { context, page } = await loadPage(browser, 'index.html', 320);
    console.log('\n  320px (<=small step, declared 2.75rem):');
    for (const size of [3.25, 3, 2.75, 2.5]) {
      const r = await measure(page, '#intro h1', size);
      const ok = r.lineCount <= 2 && !r.docOverflows && r.widestLinePx <= r.availablePx;
      console.log(
        `    ${size}rem -> ${r.lineCount} line(s), widest ${r.widestLinePx}px / avail ${r.availablePx}px, ` +
          `h-scroll ${r.docOverflows} ${ok ? 'OK' : 'FAIL'}`,
      );
    }
    await context.close();
  }

  console.log('\n' + '='.repeat(78));
  console.log('PROJECT-PAGE h1 — widest title, "KillerByte ..." (killerbyte.html)');
  console.log('='.repeat(78));
  for (const width of VIEWPORTS) {
    const { context, page } = await loadPage(browser, 'killerbyte.html', width);
    const sizes = width <= 736 ? [2.4, 2.25, 2, 1.75] : [2.75, 2.5, 2.25];
    console.log(`\n  ${width}px:`);
    for (const size of sizes) {
      const r = await measure(page, 'body.project-page #main > .post header.major > h1', size);
      if (!r) {
        console.log('    (no project h1 on this page)');
        break;
      }
      const fits = r.widestLinePx <= r.availablePx + 0.5 && !r.docOverflows;
      console.log(
        `    ${size}rem -> ${r.lineCount} line(s), widest ${r.widestLinePx}px / avail ${r.availablePx}px ` +
          `(margin ${r.marginPct}%), h-scroll ${r.docOverflows} ${fits ? 'OK' : 'OVERFLOW'}`,
      );
    }
    await context.close();
  }

  console.log('\n' + '='.repeat(78));
  console.log('AS DECLARED — every page, every viewport, no font-size override');
  console.log('='.repeat(78));
  for (const [file, selector, label] of [
    ['index.html', '#intro h1', 'intro h1'],
    ['killerbyte.html', 'body.project-page #main > .post header.major > h1', 'project h1'],
    ['church.html', 'body.project-page #main > .post header.major > h1', 'project h1 (Hallgrimskirkja)'],
  ]) {
    for (const width of VIEWPORTS) {
      const { context, page } = await loadPage(browser, file, width);
      const r = await measure(page, selector, null);
      if (r) {
        console.log(
          `  ${file.padEnd(17)} ${label.padEnd(30)} ${String(width).padStart(4)}px  ` +
            `${r.fontSize.padStart(8)}  ${r.lineCount}L  widest ${String(r.widestLinePx).padStart(7)}px / ` +
            `avail ${String(r.availablePx).padStart(7)}px  h-scroll ${r.docOverflows}`,
        );
      }
      await context.close();
    }
  }

  await closeAll();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
