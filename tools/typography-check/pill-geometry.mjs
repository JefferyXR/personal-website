/**
 * Skills_Pill geometry — the Requirement 12 oracle, plus the design §5.4 "Layer 2"
 * measurement recorder that discharges Req 12 c13.
 *
 * Two things live here so Property 15 and the recording CLI cannot drift apart:
 *
 *   1. `evaluatePill()` — the pure oracle. Given one measured pill it returns every
 *      Requirement 12 bound with its measured value and a pass/fail verdict.
 *   2. `measurePage()` / the CLI — the Playwright pass that feeds it, with the real fonts
 *      confirmed loaded first. A measurement taken during the `font-display: swap`
 *      fallback window measures Helvetica, not Telegraf, and would be silently wrong.
 *
 * LAYER 2 IS THE AUTHORITY. Where it disagrees with §5.4's arithmetic, Layer 2 wins —
 * subpixel rounding, hinting and the `skills-box` flex gap all sit outside the arithmetic.
 *
 * Run: node pill-geometry.mjs            (table for every page/viewport)
 *      node pill-geometry.mjs --json     (machine-readable)
 */

import {
  NINE_PAGES,
  VIEWPORTS,
  ROOT_PX_BY_VIEWPORT,
  getBrowser,
  closeAll,
  repoPath,
  measureLabelBoxes,
  contentBox,
  assertFontsLoaded,
  WEBFONT_REQUEST_PATTERN,
} from './fixtures.mjs';

// ---------------------------------------------------------------------------
// Requirement 12 bounds, in one place
// ---------------------------------------------------------------------------

export const BOUNDS = {
  symmetryTolerancePx: 1, // c2, c3
  padToGap: [1.5, 3.5], // c4
  widthRatio: [0.4, 0.88], // c5
  heightRatio: [0.4, 0.85], // c5
  multiLineHeightRatioMax: 0.9, // c6
};

const within = (v, [lo, hi]) => v >= lo - 1e-9 && v <= hi + 1e-9;

/**
 * Which geometry a measured pill resolved to, decided from its COMPUTED font-size rather
 * than from its selector. Classification stays computed-value based even though only the
 * homepage geometry now has a rule: several selectors can reach the same pill, so what
 * actually computed is the only reliable discriminator.
 */
export function classifyGeometry(pill, rootPx) {
  const rem = pill.style.fontSize / rootPx;
  return Math.abs(rem - 0.55) < Math.abs(rem - 0.7) ? 'homepage' : 'wider';
}

/**
 * Evaluate every Requirement 12 bound against one measured pill.
 *
 * `pill` comes from `measureLabelBoxes()`, so `pill.lines` are text-node `Range` rects —
 * ONE PER RENDERED LINE — and never the anchor's own rect. That distinction is the whole
 * property: the anchor IS the pill, so measuring the element rect would compare the pill
 * to itself and report every ratio as 1.000, a vacuous pass.
 */
export function evaluatePill(pill, { rootPx, geometry }) {
  const { box, style } = pill;
  const cb = contentBox(pill);
  const results = [];
  const add = (criterion, name, measured, ok, detail) =>
    results.push({ criterion, name, measured, ok, detail });

  if (!pill.lines.length) {
    add('c1', 'label has a rendered line box', null, false, 'Range produced no rects');
    return { geometry, text: pill.text, lines: 0, results, ok: false };
  }

  // A Range rect is the inline box's CONTENT AREA (font ascent + descent), which is not
  // the line box: at 0.55rem/1.4 the content area measures ~8px and the line box 12.32px.
  // Requirement 12 c2, c5 and c6 are all stated against the LINE BOX, so each rect is
  // expanded to the resolved `line-height` about its own centre — half-leading is
  // distributed equally above and below the content area, so the line box is centred on
  // it. Using the raw rect instead understates the height ratio by ~35% and reports a
  // spurious c5 floor breach on perfectly good geometry.
  const lineBoxHeight = parseFloat(style.lineHeight) || pill.lines[0].height;
  const lines = pill.lines.map((l) => {
    const centre = l.top + l.height / 2;
    return {
      ...l,
      textTop: l.top,
      textBottom: l.bottom,
      textHeight: l.height,
      top: centre - lineBoxHeight / 2,
      bottom: centre + lineBoxHeight / 2,
      height: lineBoxHeight,
    };
  });

  const first = lines[0];
  const last = lines[lines.length - 1];
  const leftMost = Math.min(...lines.map((l) => l.left));
  const rightMost = Math.max(...lines.map((l) => l.right));

  // c1 — label wholly inside the padding box, no glyph outside the border box.
  const paddingBox = {
    left: box.left + style.borderLeftWidth,
    right: box.right - style.borderRightWidth,
    top: box.top + style.borderTopWidth,
    bottom: box.bottom - style.borderBottomWidth,
  };
  // c1 uses the painted GLYPH extent (the text rects), not the line box: the criterion is
  // about clipping, and half-leading is not painted.
  const insidePadding =
    leftMost >= paddingBox.left - 0.5 &&
    rightMost <= paddingBox.right + 0.5 &&
    first.textTop >= paddingBox.top - 0.5 &&
    last.textBottom <= paddingBox.bottom + 0.5;
  add('c1', 'label inside the padding box', null, insidePadding, {
    label: { left: +leftMost.toFixed(2), right: +rightMost.toFixed(2), top: +first.textTop.toFixed(2), bottom: +last.textBottom.toFixed(2) },
    paddingBox: Object.fromEntries(Object.entries(paddingBox).map(([k, v]) => [k, +v.toFixed(2)])),
  });

  // c2 — vertical symmetry against the CONTENT box.
  const gapTop = first.top - cb.top;
  const gapBottom = cb.bottom - last.bottom;
  const vAsym = Math.abs(gapTop - gapBottom);
  add('c2', 'vertical symmetry (px)', +vAsym.toFixed(2), vAsym <= BOUNDS.symmetryTolerancePx, {
    gapTop: +gapTop.toFixed(2),
    gapBottom: +gapBottom.toFixed(2),
  });

  // c3 — horizontal symmetry against the CONTENT box.
  const gapLeft = leftMost - cb.left;
  const gapRight = cb.right - rightMost;
  const hAsym = Math.abs(gapLeft - gapRight);
  add('c3', 'horizontal symmetry (px)', +hAsym.toFixed(2), hAsym <= BOUNDS.symmetryTolerancePx, {
    gapLeft: +gapLeft.toFixed(2),
    gapRight: +gapRight.toFixed(2),
  });

  // c4 — declared horizontal padding as a multiple of the effective vertical gap.
  //
  // The two geometries define that gap differently, and the fixed-height definition is the
  // one that can degenerate: if `line-height` ever resolves to a LENGTH equal to `height`
  // the gap is zero, and any non-zero horizontal padding is then an infinite multiple of
  // it. That is reported as `Infinity`, not as a pass.
  const effectiveVerticalGap =
    geometry === 'homepage' ? style.paddingTop : (box.height - style.borderTopWidth - style.borderBottomWidth - lineBoxHeight) / 2;
  const padToGap = effectiveVerticalGap === 0 ? Infinity : style.paddingLeft / effectiveVerticalGap;
  add('c4', 'horizontal padding / effective vertical gap', Number.isFinite(padToGap) ? +padToGap.toFixed(3) : 'Infinity',
    Number.isFinite(padToGap) && within(padToGap, BOUNDS.padToGap), {
      horizontalPaddingPx: +style.paddingLeft.toFixed(2),
      effectiveVerticalGapPx: +effectiveVerticalGap.toFixed(2),
      gapSource: geometry === 'homepage' ? 'declared vertical padding' : '(height - line box) / 2',
    });

  if (lines.length === 1) {
    // c5 — single-line width and height ratios against the BORDER box.
    const widthRatio = first.width / box.width;
    const heightRatio = first.height / box.height;
    add('c5w', 'label width / border-box width', +widthRatio.toFixed(3), within(widthRatio, BOUNDS.widthRatio), {
      labelWidthPx: +first.width.toFixed(2),
      boxWidthPx: +box.width.toFixed(2),
      bound: BOUNDS.widthRatio,
    });
    add('c5h', 'line box height / border-box height', +heightRatio.toFixed(3), within(heightRatio, BOUNDS.heightRatio), {
      lineBoxHeightPx: +first.height.toFixed(2),
      boxHeightPx: +box.height.toFixed(2),
      bound: BOUNDS.heightRatio,
    });
  } else {
    // c6 — multi-line summed line-box height ratio.
    const summed = lines.reduce((a, l) => a + l.height, 0);
    const ratio = summed / box.height;
    add('c6', 'summed line heights / border-box height', +ratio.toFixed(3), ratio <= BOUNDS.multiLineHeightRatioMax, {
      lines: lines.length,
      summedPx: +summed.toFixed(2),
      boxHeightPx: +box.height.toFixed(2),
      max: BOUNDS.multiLineHeightRatioMax,
    });
  }

  // c7 — the pill's MINIMUM box can never clip a single line.
  //
  // Read as the effective minimum: `min-height` for the homepage geometry, and the fixed
  // `height` for the wider geometry, which is where the guarantee comes from there. Taking
  // `min-height` alone would fail the wider geometry for having none, which misreads the
  // criterion's intent ("a single-line label can never be vertically clipped by the pill's
  // minimum box").
  const declaredMinPx = parseFloat(style.minHeight) || 0;
  const declaredHeightPx = style.heightDeclared === 'auto' ? 0 : parseFloat(style.heightDeclared) || 0;
  const effectiveMinPx = Math.max(declaredMinPx, declaredHeightPx);
  const requiredMinPx =
    lineBoxHeight + style.paddingTop + style.paddingBottom + style.borderTopWidth + style.borderBottomWidth;
  add('c7', 'effective min box height >= line box + padding + borders', +effectiveMinPx.toFixed(2),
    effectiveMinPx >= requiredMinPx - 0.01, {
      requiredPx: +requiredMinPx.toFixed(2),
      requiredRem: +(requiredMinPx / rootPx).toFixed(3),
      minHeight: style.minHeight,
      height: style.heightDeclared,
    });

  // c9 — appearance untouched. Not a fit bound, but cheap to carry here so a "fix" that
  // silently restyled the capsule cannot pass.
  add('c9', 'capsule silhouette preserved', style.borderRadius, /999px|50%/.test(style.borderRadius) || parseFloat(style.borderRadius) >= 8, {
    borderRadius: style.borderRadius,
    backgroundColor: style.backgroundColor,
    color: style.color,
  });

  return {
    geometry,
    text: pill.text,
    lines: lines.length,
    fontSizeRem: +(style.fontSize / rootPx).toFixed(3),
    fontWeight: style.fontWeight,
    label: { width: +first.width.toFixed(2), height: +first.height.toFixed(2) },
    borderBox: { width: +box.width.toFixed(2), height: +box.height.toFixed(2) },
    results,
    ok: results.every((r) => r.ok),
  };
}

/** c12 — no pill overlaps another, and none extends past its card's content box. */
export function evaluatePillLayout(pillBoxes, cardBoxes) {
  const problems = [];
  for (let i = 0; i < pillBoxes.length; i += 1) {
    for (let j = i + 1; j < pillBoxes.length; j += 1) {
      const a = pillBoxes[i];
      const b = pillBoxes[j];
      const overlap =
        a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      if (overlap) problems.push(`pills overlap: "${a.text}" / "${b.text}"`);
    }
  }
  for (const p of pillBoxes) {
    const card = cardBoxes.find((c) => c.index === p.cardIndex);
    if (!card) continue;
    if (p.left < card.left - 0.5 || p.right > card.right + 0.5 || p.bottom > card.bottom + 0.5) {
      problems.push(`pill "${p.text}" escapes its card content box`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Layer 2 measurement pass
// ---------------------------------------------------------------------------

const SKILLS_PILL = 'a.button.skills, .button.skills';

export async function measurePage(browser, contentPage, viewport, { fontState = 'loaded' } = {}) {
  const context = await browser.newContext({
    viewport: { width: viewport, height: 900 },
    deviceScaleFactor: 1,
  });
  if (fontState === 'blocked') await context.route(WEBFONT_REQUEST_PATTERN, (r) => r.abort());
  const page = await context.newPage();
  await page.goto(`file://${repoPath(contentPage)}`, { waitUntil: 'load' });
  await page
    .waitForFunction(() => !document.body.classList.contains('is-preload'), { timeout: 5000 })
    .catch(() => {});
  if (fontState === 'loaded') await assertFontsLoaded(page);

  const rootPx = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  const pills = await measureLabelBoxes(page, SKILLS_PILL);

  const layout = await page.evaluate((sel) => {
    const cards = [...document.querySelectorAll('#main > .posts > article')];
    const cardBoxes = cards.map((c, index) => {
      const r = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      return {
        index,
        left: r.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft),
        right: r.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight),
        top: r.top,
        bottom: r.bottom,
      };
    });
    const pillBoxes = [...document.querySelectorAll(sel)].map((p) => {
      const r = p.getBoundingClientRect();
      const card = p.closest('#main > .posts > article');
      return {
        text: (p.textContent || '').trim(),
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        cardIndex: card ? cards.indexOf(card) : -1,
        scrollClipped: p.scrollWidth > p.clientWidth + 1 || p.scrollHeight > p.clientHeight + 1,
      };
    });
    return { cardBoxes, pillBoxes, hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
  }, SKILLS_PILL);

  await context.close();

  const evaluated = pills.map((p) => evaluatePill(p, { rootPx, geometry: classifyGeometry(p, rootPx) }));
  return {
    page: contentPage,
    viewport,
    rootPx,
    declaredRootPx: ROOT_PX_BY_VIEWPORT[viewport],
    pills: evaluated,
    layoutProblems: evaluatePillLayout(layout.pillBoxes, layout.cardBoxes),
    clipped: layout.pillBoxes.filter((p) => p.scrollClipped).map((p) => p.text),
    hScroll: layout.hScroll,
  };
}

/** Narrowest and widest label of each geometry — the Req 12 c13 record. */
export function extremesByGeometry(measurements) {
  const out = {};
  for (const m of measurements) {
    for (const pill of m.pills) {
      const key = `${pill.geometry}|${m.viewport}`;
      const bucket = (out[key] ??= { geometry: pill.geometry, viewport: m.viewport, narrowest: null, widest: null });
      if (!bucket.narrowest || pill.label.width < bucket.narrowest.label.width) bucket.narrowest = pill;
      if (!bucket.widest || pill.label.width > bucket.widest.label.width) bucket.widest = pill;
    }
  }
  return out;
}

function printBreaches(measurements) {
  const seen = new Map();
  for (const m of measurements) {
    for (const pill of m.pills) {
      for (const r of pill.results) {
        if (r.ok) continue;
        const key = `${pill.geometry}|${r.criterion}`;
        const entry = seen.get(key) ?? { criterion: r.criterion, name: r.name, geometry: pill.geometry, samples: [] };
        entry.samples.push(`${m.page}@${m.viewport} "${pill.text}" = ${r.measured}`);
        seen.set(key, entry);
      }
    }
  }
  if (!seen.size) {
    console.log('  no Requirement 12 breach at any page/viewport.');
    return [];
  }
  for (const e of seen.values()) {
    console.log(`  BREACH ${e.geometry} ${e.criterion} — ${e.name}`);
    for (const s of e.samples.slice(0, 4)) console.log(`      ${s}`);
    if (e.samples.length > 4) console.log(`      ... and ${e.samples.length - 4} more`);
  }
  return [...seen.values()];
}

async function main() {
  const browser = await getBrowser();
  const measurements = [];
  for (const contentPage of NINE_PAGES) {
    for (const viewport of VIEWPORTS) {
      const m = await measurePage(browser, contentPage, viewport);
      if (m.pills.length) measurements.push(m);
    }
  }
  await closeAll();

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ measurements, extremes: extremesByGeometry(measurements) }, null, 2));
    return;
  }

  const pageSet = [...new Set(measurements.map((m) => m.page))];
  console.log('\nLayer 2 — rendered Skills_Pill geometry (design §5.4, Req 12 c13)');
  console.log(`  pages with pills: ${pageSet.join(', ') || 'none'}`);
  console.log(`  pills per page:   ${measurements[0]?.pills.length ?? 0}\n`);

  console.log('  narrowest / widest label of each geometry, per viewport:');
  console.log(
    '  ' +
      'geometry'.padEnd(10) +
      'vw'.padStart(5) +
      'label'.padStart(24) +
      'labelWxH'.padStart(16) +
      'boxWxH'.padStart(16) +
      'w-ratio'.padStart(9) +
      'h-ratio'.padStart(9) +
      'vAsym'.padStart(8) +
      'pad/gap'.padStart(9),
  );
  const ex = extremesByGeometry(measurements);
  for (const key of Object.keys(ex).sort()) {
    const { geometry, viewport, narrowest, widest } = ex[key];
    for (const [tag, pill] of [['narrowest', narrowest], ['widest', widest]]) {
      const get = (c) => pill.results.find((r) => r.criterion === c);
      const w = get('c5w');
      const h = get('c5h');
      const v = get('c2');
      const pg = get('c4');
      console.log(
        '  ' +
          geometry.padEnd(10) +
          String(viewport).padStart(5) +
          `${tag}:${pill.text}`.slice(0, 23).padStart(24) +
          `${pill.label.width}x${pill.label.height}`.padStart(16) +
          `${pill.borderBox.width}x${pill.borderBox.height}`.padStart(16) +
          String(w?.measured ?? '—').padStart(9) +
          String(h?.measured ?? '—').padStart(9) +
          String(v?.measured ?? '—').padStart(8) +
          String(pg?.measured ?? '—').padStart(9),
      );
    }
  }

  console.log('\n  Requirement 12 verdict (rendered arm):');
  const breaches = printBreaches(measurements);

  const layoutProblems = measurements.flatMap((m) => m.layoutProblems.map((p) => `${m.page}@${m.viewport}: ${p}`));
  const clipped = measurements.filter((m) => m.clipped.length).map((m) => `${m.page}@${m.viewport}: ${m.clipped.join(', ')}`);
  const hScroll = measurements.filter((m) => m.hScroll).map((m) => `${m.page}@${m.viewport}`);
  console.log(`\n  c12 layout problems: ${layoutProblems.length ? layoutProblems.join(' | ') : 'none'}`);
  console.log(`  clipped pills:       ${clipped.length ? clipped.join(' | ') : 'none'}`);
  console.log(`  horizontal scroll:   ${hScroll.length ? hScroll.join(' | ') : 'none'}`);
  console.log(`\n  ${breaches.length} distinct breach class(es).\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
