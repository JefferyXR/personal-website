/**
 * Nav_Panel_Toggle and Nav_Panel_Link geometry — the Req 16 c21 record (design §6.2).
 *
 * Layer 2 to `advance-widths.py`'s Layer 1: the advance-width table is derived from the
 * shipped binaries and says nothing about where the toggle's box actually sits. Req 16 c21
 * additionally requires the rendered label widths, the toggle's border-box width and the
 * x-coordinate of its LEFT border-box edge, and c11's clearance is a DIFFERENCE BETWEEN TWO
 * EDGES — so the `#header` title's right edge is recorded alongside, without which the
 * criterion is unverifiable from the record.
 *
 * Measured at 320px and 768px only. Both elements are `display: none` above the `<=medium`
 * breakpoint, so no other width is layout-relevant (Req 16 c8 still holds the declaration-
 * level clauses at all four, which is Property 4's business, not this script's).
 *
 * The toggle is `position: fixed` with `right: 0.75rem` and `width: auto`, so a heavier
 * label cannot move it: the box GROWS LEFTWARD, toward the title. That is the whole reason
 * this measurement exists.
 *
 * `index.html` has no `#header` — it carries `#intro h1` — so the clearance there is
 * measured against the intro heading, the element the fixed toggle actually overlays on that
 * page. The eight project pages carry `#header .logo` ("JR").
 *
 * Run: node navpanel-geometry.mjs [--json] [--all-pages]
 */

import {
  NINE_PAGES,
  NAV_PANEL_VIEWPORTS,
  TOGGLE_PIN_REM,
  getRenderedPage,
  assertFontsLoaded,
  measureNavPanelGeometry,
  openNavPanel,
  closeNavPanel,
  closeAll,
} from './fixtures.mjs';

const r2 = (n) => (n === null || n === undefined ? null : Math.round(n * 100) / 100);

async function measure(contentPage, viewport) {
  const page = await getRenderedPage(contentPage, viewport, 'loaded');
  await assertFontsLoaded(page, '0.9rem "PP Telegraf"');
  await openNavPanel(page);
  const m = await measureNavPanelGeometry(page);
  await closeNavPanel(page);
  return m;
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const pages = args.includes('--all-pages') ? NINE_PAGES : ['index.html', 'killerbyte.html'];

  const rows = [];
  for (const contentPage of pages) {
    for (const viewport of NAV_PANEL_VIEWPORTS) {
      const m = await measure(contentPage, viewport);
      const widest = m.links.length
        ? m.links.reduce((a, b) => ((b.glyphRight - b.glyphLeft) > (a.glyphRight - a.glyphLeft) ? b : a))
        : null;
      rows.push({
        page: contentPage,
        viewport,
        rootPx: r2(m.rootFontSizePx),
        toggleWeight: m.toggle ? m.toggle.style.fontWeight : null,
        toggleFontSizePx: m.toggle ? r2(m.toggle.style.fontSize) : null,
        toggleLabel: m.toggle ? m.toggle.text : null,
        toggleLabelWidthPx: m.toggle ? r2(m.toggle.glyphRight - m.toggle.glyphLeft) : null,
        toggleLabelLines: m.toggle ? m.toggle.lineCount : null,
        toggleBorderBoxWidthPx: m.toggle ? r2(m.toggle.box.width) : null,
        toggleLeftEdgeX: m.toggle ? r2(m.toggle.box.left) : null,
        toggleRightGapPx: m.toggle ? r2(m.viewportWidth - m.toggle.box.right) : null,
        toggleTopGapPx: m.toggle ? r2(m.toggle.box.top) : null,
        pinExpectedPx: r2(TOGGLE_PIN_REM * m.rootFontSizePx),
        toggleDisplay: m.toggle ? m.toggle.style.display : null,
        toggleIconWeight: m.toggleIcon ? m.toggleIcon.fontWeight : null,
        titleSource: m.titleSource,
        titleRightEdgeX: m.title ? r2(m.title.glyphRight) : null,
        clearancePx: r2(m.clearance),
        titleOverlaps2D: m.titleOverlaps2D,
        titleVerticalGapPx: r2(m.titleVerticalGap),
        panelContentWidthPx: m.panel ? r2(m.panel.width) : null,
        widestLinkLabel: widest ? widest.text : null,
        widestLinkWidthPx: widest ? r2(widest.glyphRight - widest.glyphLeft) : null,
        widestLinkOccupancyPct: widest && m.panel ? r2(((widest.glyphRight - widest.glyphLeft) / m.panel.width) * 100) : null,
        linkWeights: [...new Set(m.links.map((l) => l.style.fontWeight))],
        linkLines: m.links.map((l) => l.lineCount),
        linkCount: m.links.length,
        horizontalOverflow: m.documentOverflowsHorizontally,
      });
    }
  }

  if (asJson) {
    process.stdout.write(JSON.stringify(rows, null, 1));
    await closeAll();
    return;
  }

  console.log('\nReq 16 c21 record — Nav_Panel_Toggle and Nav_Panel_Link, rendered (design §6.2)\n');
  console.log(
    '  page              vw    w   size  MENU w  box w   left x  right gap  top gap   title src      title r  clearance',
  );
  for (const r of rows) {
    console.log(
      `  ${r.page.padEnd(17)} ${String(r.viewport).padEnd(5)} ${String(r.toggleWeight).padEnd(4)} ` +
        `${String(r.toggleFontSizePx).padStart(5)} ${String(r.toggleLabelWidthPx).padStart(7)} ` +
        `${String(r.toggleBorderBoxWidthPx).padStart(6)} ${String(r.toggleLeftEdgeX).padStart(8)} ` +
        `${String(r.toggleRightGapPx).padStart(10)} ${String(r.toggleTopGapPx).padStart(8)}   ` +
        `${String(r.titleSource).padEnd(14)} ${String(r.titleRightEdgeX).padStart(7)} ${String(r.clearancePx).padStart(10)}` +
        `  overlap2D=${r.titleOverlaps2D ? 'YES' : 'no '} vgap=${String(r.titleVerticalGapPx).padStart(7)}`,
    );
  }

  console.log('\n  nav panel links (panel open)');
  console.log('  page              vw    weights   widest label   width   panel content   occupancy   lines');
  for (const r of rows) {
    console.log(
      `  ${r.page.padEnd(17)} ${String(r.viewport).padEnd(5)} ${JSON.stringify(r.linkWeights).padEnd(9)} ` +
        `${String(r.widestLinkLabel).padEnd(14)} ${String(r.widestLinkWidthPx).padStart(6)} ` +
        `${String(r.panelContentWidthPx).padStart(14)} ${String(r.widestLinkOccupancyPct).padStart(10)}%  ${JSON.stringify(r.linkLines)}`,
    );
  }
  console.log();

  await closeAll();
}

main().catch(async (e) => {
  console.error(e);
  await closeAll();
  process.exit(1);
});
