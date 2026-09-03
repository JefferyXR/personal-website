/**
 * Change Set 3 correctness properties — Checks B, C and D.
 *
 * Implements the design's Properties 17 and 18 (new) and the Change Set 3 extensions to
 * Properties 1, 4, 5, 6 and 8. Every property runs a minimum of 100 iterations via
 * fast-check and carries a comment naming the design property it implements.
 *
 * Two criteria are DELIBERATELY ABSENT and that is recorded rather than quietly skipped:
 *   - Req 16 c18 (no adjacent glyph outlines touching, counters open at 0.9rem/0.8rem and
 *     weight 800) is a rendering judgement, not a bounding-box computation, exactly as
 *     Req 11 c7 was. It belongs to the task 31 visual review, with the nav panel open.
 *   - Req 15's own visual check at 481px — the narrowest width at which the
 *     Side_By_Side_Layout applies — is a reviewer instruction, not a criterion. Nothing in
 *     Requirement 15 asserts anything at the layout's lower edge, which is why the review
 *     step names it.
 *
 * The Property 4, 5, 6, 10 and 16 extensions live where their generators already live:
 * Property 4's partition and Property 6's inline-style oracle are DATA in fixtures.mjs, so
 * the Change Set 2 tests pick them up automatically and the nav panel arrives in the 800
 * half without a second implementation. What is added here is what needs a new oracle.
 */

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import fs from 'node:fs';

import { buildDocumentationClauses } from './docs-clauses.mjs';
import { execFileSync } from 'node:child_process';

import {
  NINE_PAGES,
  VIEWPORTS,
  ROOT_PX_BY_VIEWPORT,
  FONT_STATES,
  SIDE_BY_SIDE_VIEWPORTS,
  COPYRIGHT_LABEL_PAIRS,
  DIVIDER_CENTRE_TOLERANCE_PX,
  LABEL_CLEARANCE_FLOOR_PX,
  NAV_PANEL_VIEWPORTS,
  TOGGLE_PIN_REM,
  BANNED_INLINE_PROPERTIES,
  WEBFONT_BUNDLE,
  ACCEPTED_CONTRAST_EXCEPTIONS,
  contrastRatio,
  round2,
  getRenderedPage,
  assertFontsLoaded,
  measureCopyrightRow,
  measureNavPanelGeometry,
  withCopyrightLabels,
  labelIntersectsDivider,
  openNavPanel,
  closeNavPanel,
  closeAll,
  repoPath,
  readCompiledStylesheet,
  readContentPage,
  lastDeclaration,
  // Property 18's own oracles live in docs-clauses.mjs; only the prune-step reader is used
  // directly here, by the unit assertion that pins the three prune entries in order.
  PRUNE_REQUIRED_ENTRIES,
  pruneStepEntries,
} from './fixtures.mjs';

const RUNS = { numRuns: 100 };

/** The transition on both nav panel sites is 0.2s; a computed style read sooner returns the
 *  value mid-flight, which is a genuine trap: adding `.alt` and reading immediately reports
 *  the PLAIN colours and every `.alt` assertion then checks the wrong state. */
const TRANSITION_SETTLE_MS = 300;

after(async () => {
  await closeAll();
});

// ===========================================================================
// Property 17 — The Copyright_Divider is centred, whatever the labels say
// ===========================================================================

/**
 * A smart generator for the sampled arm: word-shaped tokens and short phrases, 1–40
 * characters, including SINGLE UNBROKEN TOKENS.
 *
 * The unbroken tokens are the point. They are where a flex item's automatic minimum size
 * would reassert content-dependence if `min-width: 0` were ever dropped from the `li` rule —
 * a 40-character unbreakable string has a min-content width wider than half the row at
 * 768px, so the item would grow past 50% and take the divider with it. Neither S1 nor S3
 * catches that; S2 and this arm do.
 */
const TOKEN_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const token = (max) => fc.stringOf(fc.constantFrom(...TOKEN_CHARS), { minLength: 1, maxLength: max });
const phrase = fc
  .array(token(9), { minLength: 1, maxLength: 5 })
  .map((words) => words.join(' ').slice(0, 40))
  .filter((s) => s.trim().length > 0);
const labelText = fc.oneof({ arbitrary: token(40), weight: 1 }, { arbitrary: phrase, weight: 2 });

const sampledPair = fc.tuple(labelText, labelText).map(([first, link]) => ({
  name: 'sampled',
  first,
  secondLead: 'Design: ',
  secondLink: link,
  deltaChars: Math.abs(first.length - ('Design: ' + link).length),
}));

const anyPair = fc.oneof(
  { arbitrary: fc.constantFrom(...COPYRIGHT_LABEL_PAIRS), weight: 2 },
  { arbitrary: sampledPair, weight: 3 },
);

/** The four Side_By_Side clauses of Property 17, as one oracle. Returns a list of failures. */
function dividerFailures(m, where) {
  const f = [];
  if (!m.dividerRendered) {
    f.push(`${where}: no Copyright_Divider rendered in the Side_By_Side_Layout (Req 15 c1)`);
    return f;
  }
  if (Math.abs(m.signedOffset) > DIVIDER_CENTRE_TOLERANCE_PX) {
    f.push(
      `${where}: divider centre ${round2(m.divider.centre)} vs row centre ${round2(m.row.centre)} ` +
        `= signed offset ${round2(m.signedOffset)}px, tolerance ±${DIVIDER_CENTRE_TOLERANCE_PX}px (Req 15 c1)`,
    );
  }
  if (Math.abs(m.rowCentreVsBlockCentre) > DIVIDER_CENTRE_TOLERANCE_PX) {
    f.push(`${where}: row centre is ${round2(m.rowCentreVsBlockCentre)}px from the block centre (Req 15 c3)`);
  }
  if (labelIntersectsDivider(m)) {
    f.push(`${where}: a rendered label glyph intersects the divider box (Req 15 c8)`);
  }
  for (const [side, value] of Object.entries(m.clearances)) {
    if (value === null) continue;
    if (value < LABEL_CLEARANCE_FLOOR_PX) {
      f.push(`${where}: ${side} clearance ${round2(value)}px < ${LABEL_CLEARANCE_FLOOR_PX}px floor (Req 15 c8)`);
    }
  }
  return f;
}

/**
 * The four PINNED pairs, swept deterministically across the three Side_By_Side viewports.
 *
 * Run as its own test rather than left to the sampler for two reasons. First, Req 15 c4 names
 * two specific cases and this is what guarantees they are exercised on every run. Second —
 * and this is what makes the baseline run legible — collecting every case before asserting
 * reports the whole DISTRIBUTION in one failure message. fast-check would abort on the first
 * failing pair, and "S1 fails" alone does not distinguish a broken mechanism from a broken
 * checker, whereas "shipped, S1 and S2 fail with opposite signs while S3 passes at −0.1px"
 * is the signature §6.1 predicts.
 */
test('Property 17 (pinned cases): the divider is centred for all four pinned label pairs', async () => {
  const results = [];
  for (const viewport of SIDE_BY_SIDE_VIEWPORTS) {
    for (const pair of COPYRIGHT_LABEL_PAIRS) {
      const page = await getRenderedPage('index.html', viewport, 'loaded');
      await assertFontsLoaded(page, '0.8rem "PP Telegraf"');
      const m = await withCopyrightLabels(page, pair, () => measureCopyrightRow(page));
      results.push({
        viewport,
        pair: pair.name,
        offset: round2(m.signedOffset),
        rowHeight: round2(m.row.box.height),
        clearances: m.clearances,
        failures: dividerFailures(m, `index.html@${viewport} ${pair.name}`),
      });
    }
  }

  const table = results
    .map(
      (r) =>
        `    ${String(r.viewport).padEnd(5)} ${r.pair.padEnd(8)} offset ${String(r.offset).padStart(7)}px  ` +
        `${r.failures.length ? 'FAIL' : 'pass'}`,
    )
    .join('\n');
  const failed = results.filter((r) => r.failures.length);

  assert.equal(
    failed.length,
    0,
    `Property 17 pinned cases — ${failed.length} of ${results.length} failed:\n${table}\n` +
      failed.flatMap((r) => r.failures).map((s) => `    ${s}`).join('\n'),
  );
});

test('Property 17: the Copyright_Divider is centred, whatever the labels say', async () => {
  // Feature: portfolio-typography-refresh, Property 17
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...NINE_PAGES),
      fc.constantFrom(...SIDE_BY_SIDE_VIEWPORTS),
      anyPair,
      async (contentPage, viewport, pair) => {
        const page = await getRenderedPage(contentPage, viewport, 'loaded');
        await assertFontsLoaded(page, '0.8rem "PP Telegraf"');
        const m = await withCopyrightLabels(page, pair, () => measureCopyrightRow(page));
        const failures = dividerFailures(
          m,
          `${contentPage}@${viewport} [${pair.name}] "${m.items[0].text}" / "${m.items[1].text}"`,
        );
        assert.equal(failures.length, 0, failures.join('\n    '));
        return true;
      },
    ),
    RUNS,
  );
});

/**
 * The 320px Stacked_Layout arm — a SEPARATE quantification, not an exclusion.
 *
 * Req 15 c6 scopes c1–c4 out of the Stacked_Layout, but c5 makes positive demands there, and
 * leaving the row a flex container at `<=xsmall` is the most likely way to break this change:
 * a flex container lays its items in a row REGARDLESS of their `display: block`, so the items
 * would sit side by side with a divider that should not exist. This arm fails on the
 * block-box and no-divider clauses at once, which is why it is written as its own property
 * rather than folded into a viewport dimension that would simply skip 320px.
 */
test('Property 17 (Stacked_Layout arm): at 320px each item is a full-width block and no divider renders', async () => {
  // Feature: portfolio-typography-refresh, Property 17
  await fc.assert(
    fc.asyncProperty(fc.constantFrom(...NINE_PAGES), anyPair, async (contentPage, pair) => {
      const page = await getRenderedPage(contentPage, 320, 'loaded');
      await assertFontsLoaded(page, '0.8rem "PP Telegraf"');
      const m = await withCopyrightLabels(page, pair, () => measureCopyrightRow(page));

      assert.equal(m.dividerRendered, false, `${contentPage}@320 [${pair.name}]: a divider box is rendered — Req 15 c5 removes it`);
      const rowWidth = m.row.content.right - m.row.content.left;
      for (const [i, item] of m.items.entries()) {
        assert.equal(item.style.display, 'block', `${contentPage}@320 item ${i} is ${item.style.display} — Req 15 c5`);
        assert.ok(
          Math.abs(item.box.width - rowWidth) <= 1,
          `${contentPage}@320 item ${i} width ${round2(item.box.width)} != row content width ${round2(rowWidth)} — Req 15 c5 full-width blocks`,
        );
        assert.equal(item.style.borderLeftWidth, 0, `${contentPage}@320 item ${i} still has a left border — Req 15 c5`);
      }
      // Each item on its OWN line: the second item's top must clear the first item's bottom.
      assert.ok(
        m.items[1].box.top >= m.items[0].box.bottom - 0.5,
        `${contentPage}@320: items share a line (item1 top ${round2(m.items[1].box.top)} < item0 bottom ${round2(m.items[0].box.bottom)}) — the row is still a flex container`,
      );
      return true;
    }),
    RUNS,
  );
});

// ===========================================================================
// Property 5 extension — label containment (Req 15 c7) and the nav panel (Req 16 c9–c12)
// ===========================================================================

test('Property 5 (Req 15 c7): both Copyright_Item labels are contained at all four viewports', async () => {
  // Feature: portfolio-typography-refresh, Property 5
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...NINE_PAGES),
      fc.constantFrom(...VIEWPORTS),
      fc.constantFrom(...FONT_STATES),
      async (contentPage, viewport, fontState) => {
        const page = await getRenderedPage(contentPage, viewport, fontState);
        const m = await measureCopyrightRow(page);
        for (const [i, item] of m.items.entries()) {
          assert.ok(item.text.length > 0, `${contentPage}@${viewport} item ${i} has no text`);
          assert.ok(item.lines.length > 0, `${contentPage}@${viewport} item ${i} renders no glyph box`);
          assert.equal(item.style.textOverflow, 'clip', `${contentPage}@${viewport} item ${i} declares text-overflow — Req 15 c7 forbids a truncation indicator`);
          for (const line of item.lines) {
            assert.ok(
              line.left >= m.row.content.left - 0.5 && line.right <= m.row.content.right + 0.5,
              `${contentPage}@${viewport} item ${i}: glyph box ${round2(line.left)}–${round2(line.right)} escapes the row content box ${round2(m.row.content.left)}–${round2(m.row.content.right)} — Req 15 c7`,
            );
          }
        }
        assert.equal(m.documentOverflowsHorizontally, false, `${contentPage}@${viewport}: horizontal page overflow — Req 15 c7`);
        return true;
      },
    ),
    RUNS,
  );
});

test('Property 5 (Req 16 c9–c12): the nav panel toggle and links are contained at 320 and 768', async () => {
  // Feature: portfolio-typography-refresh, Property 5
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...NINE_PAGES),
      fc.constantFrom(...NAV_PANEL_VIEWPORTS),
      fc.constantFrom(...FONT_STATES),
      async (contentPage, viewport, fontState) => {
        const page = await getRenderedPage(contentPage, viewport, fontState);
        await openNavPanel(page);
        const m = await measureNavPanelGeometry(page);
        await closeNavPanel(page);

        const rootPx = ROOT_PX_BY_VIEWPORT[viewport];
        const pin = TOGGLE_PIN_REM * rootPx;

        assert.ok(m.toggle, `${contentPage}@${viewport}: no Nav_Panel_Toggle — main.js injects it`);
        assert.equal(m.toggle.style.display, 'block', `${contentPage}@${viewport}: toggle is ${m.toggle.style.display} inside <=medium`);

        // c9 — label plus icon on ONE line, wholly inside the padding box, no truncation.
        assert.equal(m.toggle.lineCount, 1, `${contentPage}@${viewport}: toggle label renders on ${m.toggle.lineCount} lines — Req 16 c9`);
        assert.equal(m.toggle.style.textOverflow, 'clip', `${contentPage}@${viewport}: toggle declares text-overflow — Req 16 c9 forbids truncation`);
        const padBox = {
          left: m.toggle.box.left,
          right: m.toggle.box.right,
          top: m.toggle.box.top,
          bottom: m.toggle.box.bottom,
        };
        for (const line of m.toggle.lines) {
          assert.ok(
            line.left >= padBox.left - 0.5 && line.right <= padBox.right + 0.5 && line.top >= padBox.top - 0.5 && line.bottom <= padBox.bottom + 0.5,
            `${contentPage}@${viewport}: toggle label escapes its padding box — Req 16 c9`,
          );
        }

        // c10 — right and top border-box edges 0.75rem from the viewport edges. The box has
        // width: auto and a pinned right edge, so a heavier label extends it LEFTWARD; this
        // clause is what distinguishes "grew leftward" from "moved" or "overflowed".
        assert.ok(
          Math.abs(m.viewportWidth - m.toggle.box.right - pin) <= 1,
          `${contentPage}@${viewport}: toggle right gap ${round2(m.viewportWidth - m.toggle.box.right)} != ${round2(pin)} (0.75rem) — Req 16 c10`,
        );
        assert.ok(
          Math.abs(m.toggle.box.top - pin) <= 1,
          `${contentPage}@${viewport}: toggle top gap ${round2(m.toggle.box.top)} != ${round2(pin)} (0.75rem) — Req 16 c10`,
        );
        assert.ok(m.toggle.box.left >= 0, `${contentPage}@${viewport}: toggle left edge ${round2(m.toggle.box.left)} is outside the viewport — Req 16 c10`);

        // c11 — no glyph of the toggle overlaps any glyph of the `#header` title. Overlap is
        // two-dimensional: on index.html the horizontal clearance is negative and harmless,
        // because the full-width centred intro `h1` sits hundreds of pixels below a toggle
        // pinned 0.75rem from the top. See the fixtures note on titleOverlaps2D.
        assert.equal(
          m.titleOverlaps2D,
          false,
          `${contentPage}@${viewport}: toggle glyphs overlap the ${m.titleSource} glyphs — Req 16 c11`,
        );

        // c12 — every link on one line inside the panel content box, no overlaps.
        for (const link of m.links) {
          assert.equal(link.lineCount, 1, `${contentPage}@${viewport}: nav panel link "${link.text}" renders on ${link.lineCount} lines — Req 16 c12`);
          assert.ok(
            link.glyphLeft >= m.panel.left - 0.5 && link.glyphRight <= m.panel.right + 0.5,
            `${contentPage}@${viewport}: nav panel link "${link.text}" escapes the panel content box — Req 16 c12`,
          );
        }
        for (let i = 1; i < m.links.length; i++) {
          assert.ok(
            m.links[i].box.top >= m.links[i - 1].box.bottom - 0.5,
            `${contentPage}@${viewport}: nav panel links "${m.links[i - 1].text}" and "${m.links[i].text}" overlap — Req 16 c12`,
          );
        }
        if (m.close && m.links.length) {
          // GLYPH extents, not the link's block box. Every Nav_Panel_Link is `display: block`
          // and therefore spans the panel's full content width by design, while `.close` is
          // absolutely positioned at `top: 0; right: 0` with a 7rem box — so the two BOXES
          // legitimately intersect on the shipped template, before and after this change set,
          // and a box-level oracle reports a false failure on correct layout. What c12
          // forbids is a collision the visitor can see, which is a question about rendered
          // text: `PROJECTS` ends ~90px short of the close control's left edge.
          const closeBox = m.close.box;
          for (const link of m.links) {
            for (const line of link.lines) {
              const overlaps =
                line.right > closeBox.left + 0.01 &&
                line.left < closeBox.right - 0.01 &&
                line.bottom > closeBox.top + 0.01 &&
                line.top < closeBox.bottom - 0.01;
              assert.equal(
                overlaps,
                false,
                `${contentPage}@${viewport}: nav panel link "${link.text}" glyphs overlap the .close control — Req 16 c12`,
              );
            }
          }
        }
        assert.equal(m.documentOverflowsHorizontally, false, `${contentPage}@${viewport}: horizontal page overflow with the panel open — Req 16 c9`);
        return true;
      },
    ),
    RUNS,
  );
});

// ===========================================================================
// Property 1 extension — the two nav panel sites, default / hover / .alt (Req 16 c16)
// ===========================================================================

/**
 * Nothing is re-derived here: Req 16 c15 preserves every colour at both sites, and font
 * weight does not enter the WCAG formula. The point is that the claim is GENERATED rather
 * than asserted — and the `.alt` scrolled state is the one a hand check forgets, because it
 * only exists after a scroll.
 */
test('Property 1 (Req 16 c16): both nav panel sites clear 4.5:1 in every state', async () => {
  const WRAPPER_BG = '#1e252d'; // invert.bg — the surface the plain toggle sits over
  const PANEL_BG = '#ffffff'; // palette.bg — the panel surface

  const tuples = [
    { role: 'navPanelToggle', state: 'default', fg: 'rgb(255, 255, 255)', bg: WRAPPER_BG },
    { role: 'navPanelToggle.alt', state: 'default', fg: 'rgb(33, 41, 49)', bg: 'rgb(255, 255, 255)' },
    { role: 'navPanelToggle.alt', state: 'hover', fg: 'rgb(33, 41, 49)', bg: PANEL_BG },
    { role: 'navPanelLink', state: 'default', fg: 'rgb(33, 41, 49)', bg: PANEL_BG },
    { role: 'navPanelLink', state: 'hover', fg: 'rgb(33, 41, 49)', bg: PANEL_BG },
  ];

  // Feature: portfolio-typography-refresh, Property 1
  await fc.assert(
    fc.property(fc.constantFrom(...tuples), (t) => {
      const ratio = round2(contrastRatio(t.fg, t.bg));
      assert.ok(ratio >= 4.5, `${t.role} (${t.state}): ${t.fg} on ${t.bg} measures ${ratio}:1, below 4.5:1 — Req 16 c16`);
      return true;
    }),
    RUNS,
  );

  // The accepted-exceptions set must still hold EXACTLY ONE member. An entry added without
  // an owner decision, or the footer h3 ratio drifting, are the two real meanings of a red
  // Property 1 — neither is a Change Set 3 expectation.
  assert.equal(ACCEPTED_CONTRAST_EXCEPTIONS.length, 1);
  assert.equal(ACCEPTED_CONTRAST_EXCEPTIONS[0].conflict, 'C2');

  // And the rendered colours must be the ones the tuples assume. Reading them from the page
  // is what makes the table above a measurement rather than a restatement of the stylesheet.
  const page = await getRenderedPage('killerbyte.html', 320, 'loaded');
  await openNavPanel(page);
  const rendered = await page.evaluate(async (settle) => {
    const toggle = document.querySelector('#navPanelToggle');
    const link = document.querySelector('#navPanel .links li a');
    const plain = { color: getComputedStyle(toggle).color, background: getComputedStyle(toggle).backgroundColor };
    toggle.classList.add('alt');
    void toggle.offsetHeight;
    // The 0.2s transition on colour and background means an immediate read returns the
    // PLAIN values mid-flight — the `.alt` assertions would then check the wrong state.
    await new Promise((r) => setTimeout(r, settle));
    const alt = { color: getComputedStyle(toggle).color, background: getComputedStyle(toggle).backgroundColor };
    toggle.classList.remove('alt');
    return { plain, alt, link: { color: getComputedStyle(link).color } };
  }, TRANSITION_SETTLE_MS);
  await closeNavPanel(page);

  assert.equal(rendered.plain.color, 'rgb(255, 255, 255)');
  assert.equal(rendered.alt.color, 'rgb(33, 41, 49)');
  assert.equal(rendered.alt.background, 'rgba(255, 255, 255, 0.875)');
  assert.equal(rendered.link.color, 'rgb(33, 41, 49)');
  // rgba(255,255,255,0.875) over the dark wrapper still leaves the .alt label legible; this
  // is the composited pairing, which is the one that actually renders.
  assert.ok(round2(contrastRatio('rgb(33, 41, 49)', '#f0f1f1')) >= 4.5);
});

// ===========================================================================
// Property 8 extension — everything outside the intended delta (Req 15 c9/c10/c12, 16 c15, 17 c13)
// ===========================================================================

const gitShow = (ref, relPath) =>
  execFileSync('git', ['-C', repoPath('.'), 'show', `${ref}:${relPath}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

/**
 * The change set's own scope, as a file allowlist.
 *
 * Stating the scope as a set and comparing it against `git status` is the cheapest form of
 * Req 15 c12 and Req 17 c13 there is: a README rewrite that also "tidied" a stylesheet, or
 * a divider fix that touched a page, fails here by name rather than by a downstream symptom.
 *
 * The per-file `assets/sass/**` entries are GONE, along with the tree they named. The
 * compiled stylesheet is the only stylesheet artifact left, so an edit that would once have
 * been "SASS first, then its mirror" is now a single entry below.
 */
const ALLOWED_CHANGED_PATHS = [
  'assets/css/main.css',
  // `noscript.css` is in scope because the two dangling background layers were declared in
  // BOTH stylesheets, and removing them from only one would leave the defect live on exactly
  // the path where it actually costs something: with JS enabled `#wrapper > .bg` is
  // display:none and the layers are never fetched, so the 404s only materialise in the
  // noscript path, where this file is the one that applies. The same edit also removed a
  // broken `@import url(font-awesome.min.css)` from its first line — that file does not exist
  // and main.css already imports the real `fontawesome-all.min.css`.
  'assets/css/noscript.css',
  'README.md',
  'docs/stylesheet-sync.md',
  '.github/workflows/static.yml',
  'assets/js/main.js',
  'assets/js/waterParticles.js',
];
// `docs/` appears as a bare directory in `git status --porcelain` while it is untracked,
// which is why the prefix and not just the file path is listed.
//
// `assets/sass/` is a prefix rather than 31 filenames for one reason: the only in-scope
// change there is the DELETION of the whole tree. Listing the files individually would
// re-create, as test data, the inventory the change set exists to remove — and the gate is
// no weaker for it, because nothing under that prefix can be edited any more.
const ALLOWED_CHANGED_PREFIXES = ['tools/', '.kiro/', 'docs/', 'docs', 'assets/sass/'];
// The nine pages are permitted here because a later change adds the home glyph to the
// Projects nav anchor. The identity test above still pins the delta to exactly that
// anchor, so allowing the paths does not weaken it.
const ALLOWED_CHANGED_SUFFIXES = ['.html'];

/** Pre-change Copyright_Row border-box heights, MEASURED at task 27.1 by divider-geometry.mjs.
 *
 *  1.2rem = the `ul`'s own 0.8rem font-size x its 1.5 line-height — the strut that floored the
 *  inline layout's line box. A flex container generates none, so `min-height: 1.2rem` has to
 *  restore it; Req 15 c10 requires the height to be unchanged, and this is the baseline it is
 *  compared against. Nothing else about the row would look wrong if this regressed: the
 *  divider would stay centred while the whole footer below the row moved up ~0.4rem. */
const ROW_HEIGHT_BASELINE_PX = { 768: 17.59, 1024: 17.59, 1440: 19.19 };

test('Property 8: the nine Content_Pages are byte-identical to their pre-change state', async () => {
  // Feature: portfolio-typography-refresh, Property 8
  //
  // For THIS change set the page clause tightens from "element set, count, order and
  // nesting" to file-level identity, including the Copyright_Block inner markup that Change
  // Set 2 had moved out of the baseline (Req 15 c12, Req 17 c13). It is the first amendment
  // since Change Set 1 that can be checked this strictly, and doing so is free.
  await fc.assert(
    fc.property(fc.constantFrom(...NINE_PAGES), (contentPage) => {
      // The ONE intended page delta is the home glyph on the Projects nav anchor. It is
      // normalised out and the rest of the file must then be byte-identical, so this still
      // catches any other markup edit while permitting exactly the change that was asked for.
      const NAV_ICON = '<a href="index.html" class="icon solid fa-home">Projects</a>';
      const NAV_PLAIN = '<a href="index.html">Projects</a>';
      const working = readContentPage(contentPage).split(NAV_ICON).join(NAV_PLAIN);
      const baseline = gitShow('HEAD', contentPage).split(NAV_ICON).join(NAV_PLAIN);
      assert.equal(
        working,
        baseline,
        `${contentPage} differs from HEAD beyond the Projects nav glyph (Req 15 c12, Req 17 c13)`,
      );
      return true;
    }),
    RUNS,
  );

  // Req 17 c13's other unchanged artifacts. The Provenance_Record does double duty: §6.3
  // relies on two statements ALREADY being present in it, so the relocation check reads it
  // rather than writing to it — and that is only sound if the file is untouched.
  for (const relPath of ['assets/webfonts/FONT-PROVENANCE.md', ...WEBFONT_BUNDLE.map((f) => `assets/webfonts/${f.file}`)]) {
    const working = fs.readFileSync(repoPath(relPath));
    const baseline = execFileSync('git', ['-C', repoPath('.'), 'show', `HEAD:${relPath}`], { maxBuffer: 32 * 1024 * 1024 });
    assert.ok(working.equals(baseline), `${relPath} differs from HEAD — Req 17 c13 requires it unchanged`);
  }

  // The scope allowlist.
  const status = execFileSync('git', ['-C', repoPath('.'), 'status', '--porcelain'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter((p) => !p.startsWith('"'));
  for (const p of status) {
    const allowed = ALLOWED_CHANGED_PATHS.includes(p) || ALLOWED_CHANGED_PREFIXES.some((pre) => p.startsWith(pre)) || ALLOWED_CHANGED_SUFFIXES.some((suf) => p.endsWith(suf));
    assert.ok(allowed, `${p} is modified but is outside Change Set 3's scope (Req 15 c12, Req 16 c19, Req 17 c13)`);
  }
});

test('Property 8: the divider, the block box and the row height match their baselines', async () => {
  // Feature: portfolio-typography-refresh, Property 8
  const css = readCompiledStylesheet();

  // Req 15 c9 — the divider IS `border-left: solid 2px` with the colour OMITTED, so it
  // resolves to currentColor and therefore to the §5.6 block colour. The omission is the
  // load-bearing part: it is exactly what someone tidying the shorthand would "fix" into a
  // literal, silently unpinning the divider from the block colour.
  assert.match(css, /#copyright ul li \{[^}]*border-left:\s*solid 2px;/, 'the compiled Copyright_Divider shorthand lost its colour-less form — Req 15 c9');

  await fc.assert(
    fc.asyncProperty(fc.constantFrom(...NINE_PAGES), fc.constantFrom(...SIDE_BY_SIDE_VIEWPORTS), async (contentPage, viewport) => {
      const page = await getRenderedPage(contentPage, viewport, 'loaded');
      const m = await measureCopyrightRow(page);

      // Req 15 c9 — declared width 2px, colour inherited from the block.
      assert.equal(round2(m.divider.width), 2, `${contentPage}@${viewport}: divider width ${m.divider.width}px != 2px — Req 15 c9`);
      assert.equal(m.divider.colour, m.block.style.color, `${contentPage}@${viewport}: divider colour ${m.divider.colour} != block colour ${m.block.style.color} — Req 15 c9 (currentColor)`);

      // Req 15 c10 — the row's border-box height is unchanged. THIS is the strut check.
      assert.ok(
        Math.abs(m.row.box.height - ROW_HEIGHT_BASELINE_PX[viewport]) <= 0.1,
        `${contentPage}@${viewport}: Copyright_Row height ${round2(m.row.box.height)}px != pre-change ${ROW_HEIGHT_BASELINE_PX[viewport]}px — ` +
          'a flex container generates no strut, so min-height: 1.2rem must restore it (Req 15 c10)',
      );

      // Req 15 c10 / Req 13 c15 — block typography and box, unchanged.
      assert.equal(m.block.style.fontWeight, '400', `${contentPage}@${viewport}: Copyright_Block weight moved — Req 11 c15 keeps it at 400`);
      assert.equal(m.block.style.textTransform, 'uppercase');
      assert.equal(m.block.style.textAlign, 'center');
      // Compared NUMERICALLY, not as strings: at 768px the block resolves to 11.7336px, whose
      // 0.05em tracking Chromium reports as `0.586667px`. A string built from a 2-decimal
      // rounding of the same quantity ("0.59px") is not wrong about the tracking — it is wrong
      // about the formatting, and asserting it would fail on a correct stylesheet.
      assert.ok(
        Math.abs(parseFloat(m.block.style.letterSpacing) - 0.05 * m.block.style.fontSize) <= 0.01,
        `${contentPage}@${viewport}: Copyright_Block tracking ${m.block.style.letterSpacing} != 0.05em — Req 13 c15`,
      );
      assert.ok(
        Math.abs(m.block.style.fontSize / ROOT_PX_BY_VIEWPORT[viewport] - 0.8) <= 0.005,
        `${contentPage}@${viewport}: Copyright_Block font-size ${m.block.style.fontSize}px is not 0.8rem — Req 13 c15`,
      );
      assert.ok(
        Math.abs(parseFloat(m.block.style.lineHeight) - 1.5 * m.block.style.fontSize) <= 0.02,
        `${contentPage}@${viewport}: Copyright_Block line-height ${m.block.style.lineHeight} != 1.5 — Req 13 c15`,
      );
      return true;
    }),
    RUNS,
  );
});

test('Property 8: both nav panel sites keep every non-weight declaration (Req 16 c15)', async () => {
  const BASELINE = {
    // Measured on the Change Set 2 tree at task 29.1, before the weight edit.
    toggle: {
      color: 'rgb(255, 255, 255)',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      boxShadow: 'none',
      textTransform: 'uppercase',
      paddingRem: { 320: [0.25, 1], 768: [0.375, 1.25] },
    },
    alt: { color: 'rgb(33, 41, 49)', backgroundColor: 'rgba(255, 255, 255, 0.875)' },
    link: { color: 'rgb(33, 41, 49)', backgroundColor: 'rgba(0, 0, 0, 0)', textTransform: 'uppercase', paddingRem: 0.75 },
  };

  // Feature: portfolio-typography-refresh, Property 8
  await fc.assert(
    fc.asyncProperty(fc.constantFrom(...NINE_PAGES), fc.constantFrom(...NAV_PANEL_VIEWPORTS), async (contentPage, viewport) => {
      const page = await getRenderedPage(contentPage, viewport, 'loaded');
      await openNavPanel(page);
      const m = await measureNavPanelGeometry(page);
      await closeNavPanel(page);
      const rootPx = ROOT_PX_BY_VIEWPORT[viewport];

      const t = m.toggle.style;
      assert.equal(t.color, BASELINE.toggle.color, `${contentPage}@${viewport}: toggle colour changed — Req 16 c15`);
      assert.equal(t.backgroundColor, BASELINE.toggle.backgroundColor);
      assert.equal(t.boxShadow, BASELINE.toggle.boxShadow);
      assert.equal(t.textTransform, BASELINE.toggle.textTransform);
      const [pv, ph] = BASELINE.toggle.paddingRem[viewport];
      // Tolerance, not equality after rounding: 0.375rem is a three-decimal value and a
      // 2-decimal round reports it as 0.38, failing on an untouched declaration.
      assert.ok(Math.abs(t.paddingTop / rootPx - pv) <= 0.005, `${contentPage}@${viewport}: toggle vertical padding ${round2(t.paddingTop / rootPx)}rem != ${pv}rem — Req 16 c15`);
      assert.ok(Math.abs(t.paddingRight / rootPx - ph) <= 0.005, `${contentPage}@${viewport}: toggle horizontal padding ${round2(t.paddingRight / rootPx)}rem != ${ph}rem — Req 16 c15`);
      assert.match(t.transition, /0\.2s/, `${contentPage}@${viewport}: toggle transition timing changed — Req 16 c15`);

      // The `#navPanelToggle:before` icon rule is Font Awesome's OWN family and weight 900.
      // It is not Chrome_Text, it is not part of the weight partition, and it sits 17 lines
      // below the declaration that does change — which is precisely where a hand-mirrored
      // edit goes wrong.
      assert.match(m.toggleIcon.fontFamily, /Font Awesome/, `${contentPage}@${viewport}: the toggle icon lost its Font Awesome family`);
      assert.equal(m.toggleIcon.fontWeight, '900', `${contentPage}@${viewport}: the toggle icon weight is ${m.toggleIcon.fontWeight}, not 900 — main.css:4677 must not move`);

      for (const link of m.links) {
        assert.equal(link.style.color, BASELINE.link.color, `${contentPage}@${viewport}: nav panel link colour changed — Req 16 c15`);
        assert.equal(link.style.backgroundColor, BASELINE.link.backgroundColor);
        assert.equal(link.style.textTransform, BASELINE.link.textTransform);
        assert.ok(Math.abs(link.style.paddingTop / rootPx - BASELINE.link.paddingRem) <= 0.005, `${contentPage}@${viewport}: nav panel link padding changed — Req 16 c15`);
        // Req 16 c14 makes 0.05em a FLOOR: the heavier face reduces inter-glyph white space at
        // constant tracking, so tightening it is not available as a width lever.
        assert.ok(
          parseFloat(link.style.letterSpacing) >= 0.05 * link.style.fontSize - 0.01,
          `${contentPage}@${viewport}: nav panel link tracking ${link.style.letterSpacing} is below the 0.05em floor — Req 16 c14`,
        );
      }
      return true;
    }),
    RUNS,
  );

  // The `.alt` scrolled state, which only exists after a scroll and is the state a hand
  // check forgets. Read after the 0.2s transition settles — see TRANSITION_SETTLE_MS.
  const page = await getRenderedPage('killerbyte.html', 768, 'loaded');
  const alt = await page.evaluate(async (settle) => {
    const el = document.querySelector('#navPanelToggle');
    el.classList.add('alt');
    void el.offsetHeight;
    await new Promise((r) => setTimeout(r, settle));
    const cs = getComputedStyle(el);
    const out = { color: cs.color, backgroundColor: cs.backgroundColor, boxShadow: cs.boxShadow, fontWeight: cs.fontWeight };
    el.classList.remove('alt');
    return out;
  }, TRANSITION_SETTLE_MS);
  assert.equal(alt.color, BASELINE.alt.color, '#navPanelToggle.alt colour changed — Req 16 c15');
  assert.equal(alt.backgroundColor, BASELINE.alt.backgroundColor, '#navPanelToggle.alt background changed — Req 16 c15');
  assert.match(alt.boxShadow, /rgba\(30, 37, 45, 0\.25\)/, '#navPanelToggle.alt box shadow changed — Req 16 c15');
  assert.equal(alt.fontWeight, '800', '#navPanelToggle.alt lost the Ultrabold weight — Req 16 c1');
});

// ===========================================================================
// Property 6 extension — the widened inline-style oracle (Req 15 c13, Req 16 c19)
// ===========================================================================

test('Property 6: the inline-style oracle covers the layout properties the divider mechanism uses', () => {
  // Feature: portfolio-typography-refresh, Property 6
  //
  // The oracle itself lives in fixtures.mjs and is consumed by the Change Set 2 Property 6
  // test, which scans all nine pages. What is asserted here is that the four names were
  // actually added: a page that reproduced the flex mechanism inline would pass Property 17's
  // geometry check while sitting outside Property 2's parity check, and the only thing
  // standing between those two is this list.
  for (const prop of ['display', 'flex', 'flex-basis', 'min-height']) {
    assert.ok(BANNED_INLINE_PROPERTIES.includes(prop), `${prop} is missing from the inline-style oracle — Req 15 c13, Req 16 c19`);
  }
});

// ===========================================================================
// Property 18 — Every required attribution is present and every documentation link resolves
// ===========================================================================

test('Property 18: every required attribution is present and every documentation link resolves', async () => {
  /**
   * The clause set IS the generator, and it is DISCOVERED BY PARSING — see docs-clauses.mjs,
   * which builds it from the two documents rather than from a fixture list that would go
   * stale in exactly the edit it is meant to guard.
   *
   * It is built there rather than here so that a baseline run can report the WHOLE
   * distribution: fast-check stops at the first failing clause, and "which clauses fail
   * before the edit" is the evidence that this checker discriminates. Every attribution
   * clause is expected to pass before the README is rewritten and to keep passing after it;
   * one that flips means content was lost rather than moved (Req 17 c6, risk R11).
   */
  const clauses = buildDocumentationClauses();
  assert.ok(clauses.length >= 25, `only ${clauses.length} documentation clauses were discovered — the parser found too little to be checking anything`);

  // Feature: portfolio-typography-refresh, Property 18
  await fc.assert(
    fc.property(fc.constantFrom(...clauses), (clause) => {
      clause.check();
      return true;
    }),
    RUNS,
  );
});

// ===========================================================================
// Check C — the §6.2 advance-width table, from the font binaries (Req 16 c21)
// ===========================================================================

test('Check C: measured 400 -> 800 nav panel advance widths match the design §6.2 table', () => {
  const raw = execFileSync('python3', [repoPath('tools', 'typography-check', 'advance-widths.py'), '--json'], {
    encoding: 'utf8',
  });
  const data = JSON.parse(raw);
  const rows = data.navPanelRows;
  assert.equal(rows.length, 3, 'expected MENU, PROJECTS and CAD GALLERY');

  for (const row of rows) {
    for (const [viewport, cell] of Object.entries(row.px)) {
      const [expected400, expected800] = cell.expected;
      assert.ok(
        Math.abs(cell.w400 - expected400) <= 0.05,
        `${row.label}@${viewport}px at weight 400: ${cell.w400}px vs §6.2's ${expected400}px`,
      );
      assert.ok(
        Math.abs(cell.w800 - expected800) <= 0.05,
        `${row.label}@${viewport}px at weight 800: ${cell.w800}px vs §6.2's ${expected800}px`,
      );
      assert.ok(cell.w800 > cell.w400, `${row.label}@${viewport}px: Ultrabold is not wider than Regular, which cannot be right`);
    }
  }

  // MENU is the largest RELATIVE increase measured anywhere in this spec (+9.05%): a
  // four-character word gains proportionally more from Ultrabold than a longer label does,
  // so the smallest label carries the biggest percentage. Worth asserting because it is the
  // shape of the risk, not just a number — the toggle is also the tightest box.
  const menu = rows.find((r) => r.label === 'MENU');
  assert.ok(Math.abs(menu.increasePct - 9.05) <= 0.1, `MENU widens ${menu.increasePct}%, §6.2 measures +9.05%`);
  for (const other of rows.filter((r) => r.label !== 'MENU')) {
    assert.ok(menu.increasePct > other.increasePct, `${other.label} widens more than MENU, which contradicts §6.2`);
  }
});

// ===========================================================================
// Unit assertions — single fixed facts about single lines (design Testing Strategy)
// ===========================================================================

/**
 * Strip CSS comments before any DECLARATION-level scan.
 *
 * Not cosmetic. `main.css` carries comments that quote the declarations they explain — the
 * `#navPanelToggle` comment names the `font-weight: 900` it tells the reader not to touch. A
 * raw scan reports the explanation as the defect, and a last-declaration-wins reader stops
 * matching altogether because the comment breaks the `;`/`{` anchor before the real
 * declaration. This is the same hazard the maintenance note's zero-occurrence rules document
 * for `scroll-behavior`, applied to the checker rather than to the grep.
 */
const stripComments = (text) =>
  String(text)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

test('unit: §6.1 declares the flex mechanism in main.css, and reverts it at <=xsmall', () => {
  const css = stripComments(readCompiledStylesheet());

  // The base rule.
  assert.match(css, /#copyright ul \{[^}]*display: flex;/, 'main.css #copyright ul is not a flex container — Req 7 c3');
  assert.match(css, /#copyright ul li \{[^}]*flex: 0 0 calc\(50% \+ 1px\);/, 'main.css base li basis missing — Req 7 c3');
  assert.match(css, /#copyright ul li \{[^}]*min-width: 0;/, 'main.css base li is missing min-width: 0 — Req 7 c3');
  assert.match(css, /#copyright ul li:first-child \{[^}]*flex-basis: calc\(50% - 1px\);/, 'main.css first-child basis missing — Req 7 c3');

  // The <=xsmall revert. The `:first-child` repeat is asserted LITERALLY because it is a
  // SPECIFICITY TRAP rather than a value question: `#copyright ul li:first-child` is (1,1,2)
  // and a media-query `#copyright ul li` is (1,0,2), so the base rule OUTRANKS the media
  // block and the reset only lands when it is declared at the same `:first-child`
  // specificity. A reset written only on the `li` leaves the stacked first item
  // right-aligned at 320px while every check that looks at the divider reports a pass — and
  // a property quantified over viewports would report that failure without pointing at the
  // cause.
  // Locate the <=xsmall block by CONTENT rather than by a trailing section marker: the
  // comment stripper above removes the `/* Nav Panel */` comment that used to bound it, and
  // anchoring on a comment would make this assertion depend on a comment surviving.
  // Extract each 480px block by BRACE MATCHING. Neither shortcut works here: a fixed-size
  // window and a "slice to the next @media" both run past the block's own closing brace into
  // the unnested rules that follow, so an earlier, unrelated 480px block appears to contain the
  // copyright rules. There are five 480px blocks in this file and only one of them is ours.
  const braceBlock = (text, from) => {
    const open = text.indexOf('{', from);
    let depth = 0;
    for (let i = open; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}' && --depth === 0) return text.slice(open + 1, i);
    }
    throw new Error('unbalanced braces while extracting a media block');
  };
  const xsmallBlocks = [...css.matchAll(/@media screen and \(max-width: 480px\) \{/g)]
    .map((m) => braceBlock(css, m.index))
    .filter((block) => block.includes('#copyright ul {'));
  assert.equal(xsmallBlocks.length, 1, `found ${xsmallBlocks.length} max-width: 480px blocks containing #copyright ul, expected exactly 1`);
  const xsmall = [null, xsmallBlocks[0]];
  assert.match(xsmall[1], /#copyright ul \{[^}]*display: block;/, 'the <=xsmall block does not revert the ul to display: block — §6.1');
  assert.match(xsmall[1], /#copyright ul \{[^}]*min-height: 0;/, 'the <=xsmall block does not reset min-height — §6.1');
  assert.match(xsmall[1], /#copyright ul li \{[^}]*text-align: inherit;/, 'the <=xsmall li does not reset text-align — §6.1');
  assert.match(xsmall[1], /#copyright ul li:first-child \{[^}]*text-align: inherit;/, 'the <=xsmall :first-child does not repeat text-align: inherit — this is the specificity trap in §6.1');
  assert.match(xsmall[1], /#copyright ul li:first-child \{[^}]*padding-right: 0;/, 'the <=xsmall :first-child does not clear its clearance padding — §6.1');

  // The five Req 15 c5 declarations, untouched.
  for (const decl of [/border-left: 0;/, /margin: 1rem 0 0 0;/, /padding-left: 0;/, /display: block;/]) {
    assert.match(xsmall[1], decl, `the <=xsmall block lost ${decl} — Req 15 c5 pins it`);
  }
  assert.match(xsmall[1], /#copyright ul li:first-child \{[^}]*margin-top: 0;/, 'the <=xsmall first item lost its margin-top reset — Req 15 c5');
});

test('unit: §6.2 pins both nav panel weights at 800 and leaves their neighbours alone', () => {
  const css = stripComments(readCompiledStylesheet());

  // Asserted BY RULE, not by line number. The design records the mirrors at main.css:4660,
  // :4677, :4751–4752 and :4753, which were correct before this change set; §6.1's mirror
  // added comment lines above them, so every one of those numbers now points ~45 lines high.
  // A line-indexed assertion would fail on a perfectly correct file — and, worse, would pass
  // once someone "fixed" it by deleting the comments. The rule text is the invariant.
  const rule = (selector) => {
    const at = css.indexOf(selector + ' {');
    assert.notEqual(at, -1, `could not locate the ${selector} rule in main.css`);
    const open = css.indexOf('{', at);
    const close = css.indexOf('}', open);
    return css.slice(open + 1, close);
  };

  const toggleRule = rule('#navPanelToggle');
  assert.equal(lastDeclaration(toggleRule, 'font-weight'), '800', 'the compiled #navPanelToggle rule does not declare font-weight: 800 — Req 7 c3, Req 16 c19');
  assert.equal(lastDeclaration(toggleRule, 'font-size'), '0.9rem', 'the compiled #navPanelToggle font-size moved — Req 16 c5');
  assert.match(lastDeclaration(toggleRule, 'font-family'), /^"PP Telegraf"/, 'the compiled #navPanelToggle family changed — Req 16 c4');

  const linkRule = rule('#navPanel .links li a');
  assert.equal(lastDeclaration(linkRule, 'font-weight'), '800', 'the compiled #navPanel .links li a rule does not declare font-weight: 800 — Req 7 c3, Req 16 c19');
  // One declaration, not two: the rule used to carry `font-size: 0.9rem` twice.
  assert.equal((linkRule.match(/font-size:\s*0\.9rem;/g) || []).length, 1, 'the compiled #navPanel link rule should declare font-size: 0.9rem exactly once');
  assert.equal(lastDeclaration(linkRule, 'font-size'), '0.9rem', 'the compiled #navPanel link font-size moved — Req 16 c5');

  // The `#navPanelToggle:before` icon rule is Font Awesome's OWN family and weight 900. It is
  // not Chrome_Text, it is not part of the weight partition, and it sits seventeen lines below
  // the declaration that does change — which is precisely where a hand-mirrored edit goes wrong.
  const iconRule = rule('#navPanelToggle:before');
  assert.equal(lastDeclaration(iconRule, 'font-weight'), '900', 'the #navPanelToggle:before icon weight moved off 900 — that is the Font Awesome glyph, not Chrome_Text');
  assert.match(lastDeclaration(iconRule, 'font-family'), /Font Awesome/, 'the #navPanelToggle:before icon family changed');
});

test('unit: the static.yml prune step names docs alongside tools and .kiro', () => {
  // Req 17 c11. The workflow uploads `path: '.'` with no build step, so a new `docs/`
  // directory would otherwise be published. The consequence is intended: the README's link
  // to docs/stylesheet-sync.md resolves on GitHub, where the README is read, and not on the
  // deployed origin, where nothing links to the README at all.
  const entries = pruneStepEntries();
  assert.deepEqual(entries, ['tools', '.kiro', 'docs'], `prune step is \`rm -rf ${entries?.join(' ')}\` — Req 17 c11`);
});

test('Req 16 c18 is a visual-review obligation, not a property', () => {
  // Recorded rather than silently skipped, exactly as Req 11 c7 is. Whether two adjacent
  // glyph outlines touch and whether enclosed counters stay open at 0.9rem and 0.8rem at
  // weight 800 is a rendering judgement, not a bounding-box computation — no oracle here can
  // decide it. Task 31's visual review carries it, with the nav panel OPEN at 320px and
  // 768px, the only widths where either element is not `display: none`.
  assert.ok(true);
});
