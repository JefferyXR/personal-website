/**
 * Copyright_Divider geometry — the Req 15 c14 record (design §6.1).
 *
 * Layer 2 of the same two-layer method §5.4 used for the Skills_Pill: §6.1's numbers below
 * its horizontal rule are DERIVED from the shipped binaries and the declared CSS, and
 * Req 15 c14 is discharged only by RENDERED figures. This script produces them.
 *
 * For each of 768 / 1024 / 1440px and each of the four pinned label pairs it records the
 * Copyright_Row content-box left and right x, the row centre x, the Copyright_Divider
 * centre x, the signed offset (divider centre − row centre, positive to the right), and the
 * row's border-box height. At 320px it records the item box widths and the line count
 * instead, because the Stacked_Layout renders no divider at all.
 *
 * THE ROW HEIGHT COLUMN IS NOT DECORATION. In the shipped inline layout the `ul`
 * establishes an inline formatting context whose line box is floored by the STRUT — the
 * `ul`'s own inherited 0.8rem font-size times its 1.5 line-height, i.e. 1.2rem. A flex
 * container generates no strut, so the row can lose ~0.4rem of height with no other
 * symptom: the divider would stay exactly where it was put while every footer element below
 * the row moved up, contradicting Req 15 c10. Recording the height pre- and post-change is
 * what turns that argument into a check.
 *
 * Labels are substituted AT RUNTIME by the fixtures helper and never by editing a page
 * (Req 15 c12, Req 17 c13).
 *
 * Run: node divider-geometry.mjs [--json] [--page index.html] [--all-pages]
 */

import {
  NINE_PAGES,
  SIDE_BY_SIDE_VIEWPORTS,
  COPYRIGHT_LABEL_PAIRS,
  DIVIDER_CENTRE_TOLERANCE_PX,
  LABEL_CLEARANCE_FLOOR_PX,
  getRenderedPage,
  assertFontsLoaded,
  measureCopyrightRow,
  withCopyrightLabels,
  labelIntersectsDivider,
  closeAll,
} from './fixtures.mjs';

const round1 = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);
const round2 = (n) => (n === null || n === undefined ? null : Math.round(n * 100) / 100);

async function measure(contentPage, viewport, pair) {
  const page = await getRenderedPage(contentPage, viewport, 'loaded');
  // Req 15 c14's measurement precondition: a reading taken inside the `font-display: swap`
  // window measures Helvetica, not Telegraf, and every width in the record would be wrong
  // in the same direction — which looks like a plausible result rather than an error.
  await assertFontsLoaded(page, '0.8rem "PP Telegraf"');
  return withCopyrightLabels(page, pair, () => measureCopyrightRow(page));
}

function row(contentPage, viewport, pair, m) {
  return {
    page: contentPage,
    viewport,
    pair: pair.name,
    deltaChars: pair.deltaChars,
    labels: [m.items[0].text, m.items[1].text],
    rowLeftX: round2(m.row.content.left),
    rowRightX: round2(m.row.content.right),
    rowCentreX: round2(m.row.centre),
    dividerCentreX: round2(m.divider ? m.divider.centre : null),
    signedOffsetPx: round2(m.signedOffset),
    rowHeightPx: round2(m.row.box.height),
    rowCentreVsBlockCentrePx: round2(m.rowCentreVsBlockCentre),
    dividerWidthPx: m.divider ? round2(m.divider.width) : null,
    dividerColour: m.divider ? m.divider.colour : null,
    clearanceLeftPx: round2(m.clearances ? m.clearances.left : null),
    clearanceRightPx: round2(m.clearances ? m.clearances.right : null),
    glyphOverlapsDivider: labelIntersectsDivider(m),
    itemWidths: m.items.map((i) => round2(i.box.width)),
    itemDisplays: m.items.map((i) => i.style.display),
    lineCounts: m.items.map((i) => i.lineCount),
    rowDisplay: m.row.style.display,
    dividerRendered: m.dividerRendered,
    horizontalOverflow: m.documentOverflowsHorizontally,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const allPages = args.includes('--all-pages');
  const pageArgIndex = args.indexOf('--page');
  const pages = allPages
    ? NINE_PAGES
    : pageArgIndex !== -1
      ? [args[pageArgIndex + 1]]
      : ['index.html'];

  const sideBySide = [];
  const stacked = [];

  for (const contentPage of pages) {
    for (const viewport of SIDE_BY_SIDE_VIEWPORTS) {
      for (const pair of COPYRIGHT_LABEL_PAIRS) {
        sideBySide.push(row(contentPage, viewport, pair, await measure(contentPage, viewport, pair)));
      }
    }
    // 320px: the Stacked_Layout. No divider exists, so item box widths and line count are
    // what the record carries (Req 15 c5, c6).
    for (const pair of COPYRIGHT_LABEL_PAIRS) {
      stacked.push(row(contentPage, 320, pair, await measure(contentPage, 320, pair)));
    }
  }

  const result = { sideBySide, stacked, tolerancePx: DIVIDER_CENTRE_TOLERANCE_PX, clearanceFloorPx: LABEL_CLEARANCE_FLOOR_PX };

  if (asJson) {
    process.stdout.write(JSON.stringify(result, null, 1));
    await closeAll();
    return;
  }

  console.log('\nReq 15 c14 record — Copyright_Row and Copyright_Divider, rendered (design §6.1)');
  console.log(`pages: ${pages.join(', ')}   fonts: confirmed loaded before every measurement\n`);
  console.log(
    '  vw    pair      row left   row right  row centre  div centre   offset   height   row-vs-block  clear L  clear R  overlap',
  );
  for (const r of sideBySide) {
    console.log(
      `  ${String(r.viewport).padEnd(5)} ${r.pair.padEnd(9)} ` +
        `${String(r.rowLeftX).padStart(9)} ${String(r.rowRightX).padStart(11)} ` +
        `${String(r.rowCentreX).padStart(11)} ${String(r.dividerCentreX).padStart(11)} ` +
        `${String(r.signedOffsetPx > 0 ? '+' + r.signedOffsetPx : r.signedOffsetPx).padStart(8)} ` +
        `${String(r.rowHeightPx).padStart(8)} ${String(r.rowCentreVsBlockCentrePx).padStart(13)} ` +
        `${String(r.clearanceLeftPx).padStart(8)} ${String(r.clearanceRightPx).padStart(8)} ` +
        `${r.glyphOverlapsDivider ? '  YES' : '   no'}`,
    );
  }

  console.log('\n  320px — Stacked_Layout (no divider; item box widths and line count instead)');
  console.log('  vw    pair      item widths            displays          lines    divider?   row display');
  for (const r of stacked) {
    console.log(
      `  ${String(r.viewport).padEnd(5)} ${r.pair.padEnd(9)} ` +
        `${JSON.stringify(r.itemWidths).padEnd(22)} ${JSON.stringify(r.itemDisplays).padEnd(17)} ` +
        `${JSON.stringify(r.lineCounts).padEnd(8)} ${String(r.dividerRendered).padEnd(10)} ${r.rowDisplay}`,
    );
  }

  const worst = sideBySide.reduce((a, b) => (Math.abs(b.signedOffsetPx) > Math.abs(a.signedOffsetPx) ? b : a));
  console.log(
    `\n  worst |offset| = ${round1(Math.abs(worst.signedOffsetPx))}px  (${worst.pair} @ ${worst.viewport}px, page ${worst.page}), tolerance ${DIVIDER_CENTRE_TOLERANCE_PX}px`,
  );
  const minClear = Math.min(
    ...sideBySide.flatMap((r) => [r.clearanceLeftPx, r.clearanceRightPx].filter((v) => v !== null)),
  );
  console.log(`  min clearance = ${round2(minClear)}px, floor ${LABEL_CLEARANCE_FLOOR_PX}px (Req 15 c8)\n`);

  await closeAll();
}

main().catch(async (e) => {
  console.error(e);
  await closeAll();
  process.exit(1);
});
