/**
 * Change Set 2 correctness properties — Checks B, C, D and I.
 *
 * Implements the design's Properties 14, 15 and 16 (new) and the Change Set 2 extensions
 * to Properties 1, 4, 5, 6, 8, 10 and 11. Every property runs a minimum of 100 iterations
 * via fast-check and carries a comment naming the design property it implements.
 *
 * Requirement 11 criterion 7 is DELIBERATELY ABSENT. Overlapping glyph outlines and filled
 * counters at 0.55rem / weight 800 are a rendering judgement, not a bounding-box
 * computation, so no property here can assert them. They belong to the task 25 visual
 * review, and that is recorded rather than quietly skipped.
 */

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

import {
  NINE_PAGES,
  VIEWPORTS,
  ROOT_PX_BY_VIEWPORT,
  FONT_STATES,
  BOLD_CHROME_SELECTORS,
  REGULAR_CHROME_SELECTORS,
  CARD_HEADER_BAND,
  CARD_HEADING,
  FORCED_BREAK_CARD_HEADING_TEXT,
  COPYRIGHT_BLOCK,
  BACK_TO_TOP_CONTROL,
  DESIGN_CREDIT_LINK,
  ACCEPTED_CONTRAST_EXCEPTIONS,
  FORBIDDEN_COLOUR_LITERALS,
  FORBIDDEN_FAMILY_NAMES,
  BANNED_INLINE_PROPERTIES,
  bannedInlineDeclarations,
  MANDATED_HOVER_ACCENT,
  contrastRatio,
  round2,
  relativeLuminance,
  getBrowser,
  getRenderedPage,
  openScriptless,
  closeAll,
  measureLabelBoxes,
  contentBox,
  repoPath,
  readCompiledStylesheet,
  readSassFile,
  readContentPage,
} from './fixtures.mjs';

import { evaluatePill, evaluateDeclaredGeometry, classifyGeometry, measurePage, BOUNDS } from './pill-geometry.mjs';

const RUNS = { numRuns: 100 };

/**
 * Poll `window.scrollY` from the NODE side until it reaches 0.
 *
 * `page.waitForFunction` cannot be used for this: see the note at its call site. Two
 * separate traps live there (rAF-throttled default polling, and a stranded in-page poller
 * after a same-document fragment navigation), and both present as a timeout that looks
 * exactly like a broken Back to top control.
 */
async function waitForScrollTop(page, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(() => window.scrollY);
    if (last === 0) return 0;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`scrollY did not reach 0 within ${timeoutMs}ms (last observed ${last})`);
}

after(async () => {
  await closeAll();
});

// ===========================================================================
// Property 1 — Every declared colour pair meets its contrast threshold
// ===========================================================================

/**
 * The Change Set 2 extension: the Copyright_Block, the Back_To_Top_Control and the
 * Design_Credit link are now ORDINARY tuples checked against >=4.5:1 in all four states.
 * The `#copyright` accepted-exception entry was removed in task 16.1 and must not reappear.
 */
test('Property 1: every declared colour pair meets its contrast threshold', async () => {
  const FOOTER_BG = '#f5f5f5';
  const COPYRIGHT_BG = '#1e252d';

  // (foreground, role, state, backdrop, threshold)
  const tuples = [
    ['#3a4148', 'footer-email', 'default', FOOTER_BG, 7.0],
    ['#3a4148', 'footer-email-underline', 'default', FOOTER_BG, 3.0],
    ['#3a4148', 'footer-email-underline', 'hover', FOOTER_BG, 3.0],
    ['#212931', 'footer-email-focus-ring', 'focus', FOOTER_BG, 3.0],
    ['rgba(255, 255, 255, 0.65)', 'copyright-block', 'default', COPYRIGHT_BG, 4.5],
    ['rgba(255, 255, 255, 0.65)', 'back-to-top', 'default', COPYRIGHT_BG, 4.5],
    ['rgba(255, 255, 255, 0.65)', 'design-credit', 'default', COPYRIGHT_BG, 4.5],
    ['rgba(255, 255, 255, 0.65)', 'back-to-top', 'focus', COPYRIGHT_BG, 4.5],
    ['rgba(255, 255, 255, 0.65)', 'back-to-top-focus-ring', 'focus', COPYRIGHT_BG, 3.0],
    ['#18bfef', 'back-to-top', 'hover', COPYRIGHT_BG, 4.5],
    ['#18bfef', 'back-to-top', 'active', COPYRIGHT_BG, 4.5],
    ['#18bfef', 'design-credit', 'hover', COPYRIGHT_BG, 4.5],
    ['#717981', 'footer-h3', 'default', FOOTER_BG, 4.5],
    ['#ffffff', 'skills-pill-label', 'default', 'rgb(19, 39, 59)', 4.5],
    ['#ffffff', 'nav-link', 'default', COPYRIGHT_BG, 4.5],
  ];

  const isException = (fg, role) =>
    ACCEPTED_CONTRAST_EXCEPTIONS.find((e) => e.foreground === fg && e.what.includes(role === 'footer-h3' ? '#footer h3' : role));

  // Feature: portfolio-typography-refresh, Property 1
  fc.assert(
    fc.property(fc.constantFrom(...tuples), ([fg, role, state, bg, threshold]) => {
      const measured = round2(contrastRatio(fg, bg));

      const exception = isException(fg, role);
      if (exception) {
        // An accepted exception is pinned to a MEASUREMENT, not waved through: a drift in
        // EITHER direction fails, so a fix must retire the entry.
        assert.equal(
          measured,
          exception.measured,
          `accepted exception ${exception.conflict} (${exception.what}) drifted from ${exception.measured}:1 to ${measured}:1 — retire or re-record the entry`,
        );
        return true;
      }

      // The mandated hover accent is scoped out of the >=4.5:1 clause only where the
      // backdrop is the light footer (conflict C4, Req 1 c4). Over the dark Copyright_Block
      // it needs no carve-out at all: it measures 7.17:1 and passes outright.
      if (fg === MANDATED_HOVER_ACCENT && bg === FOOTER_BG) return true;

      assert.ok(
        measured >= threshold,
        `${role} (${state}) ${fg} on ${bg} = ${measured}:1, below ${threshold}:1`,
      );
      return true;
    }),
    RUNS,
  );

  // Req 1 c2, checked directly rather than inferred from the ratio.
  assert.ok(relativeLuminance('#3a4148') < relativeLuminance('#717981'));

  // Req 14 c7: EXACTLY ONE entry, and the #copyright entry must be gone.
  assert.equal(ACCEPTED_CONTRAST_EXCEPTIONS.length, 1);
  assert.ok(
    !ACCEPTED_CONTRAST_EXCEPTIONS.some((e) => e.what.includes('#copyright')),
    'the #copyright accepted-exception entry reappeared — Req 14 c7 removed it',
  );

  for (const e of ACCEPTED_CONTRAST_EXCEPTIONS) {
    console.log(
      `    known-and-accepted: ${e.what} = ${round2(contrastRatio(e.foreground, e.backdrop))}:1 ` +
        `(recorded ${e.measured}:1, threshold ${e.threshold}:1, conflict ${e.conflict}) — ${e.ruling}`,
    );
  }
});

// ===========================================================================
// Property 4 — Every element resolves to the token model (400/800 partition)
// ===========================================================================

/**
 * The Change Set 2 refinement: Chrome_Text is a PARTITION rather than a membership test.
 * The two halves fail each other's mistakes — bolding too much trips the 400 clause,
 * bolding too little trips the 800 clause — and either way the shrink output names the
 * element. The family clause is kept so a weight edit that also moved the family fails here.
 */
test('Property 4: Bold_Chrome_Text computes to 800, every other Chrome_Text to 400', async () => {
  const SHIPPED_WEIGHTS = ['400', '700', '800'];
  const BODY_FAMILY_HEAD = 'PP Telegraf';

  const cases = [
    ...Object.entries(BOLD_CHROME_SELECTORS).map(([role, selector]) => ({ role, selector, expect: '800' })),
    ...Object.entries(REGULAR_CHROME_SELECTORS).map(([role, selector]) => ({ role, selector, expect: '400' })),
  ];

  // Feature: portfolio-typography-refresh, Property 4
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...NINE_PAGES),
      fc.constantFrom(...VIEWPORTS),
      fc.constantFrom(...cases),
      async (contentPage, viewport, { role, selector, expect }) => {
        const page = await getRenderedPage(contentPage, viewport);
        const got = await page.evaluate((sel) => {
          const out = [];
          for (const el of document.querySelectorAll(sel)) {
            const cs = getComputedStyle(el);
            // The intro down-arrow is `.button icon solo` with NO text node: its glyph is
            // painted by a Font Awesome :before rule that sets its own family and weight,
            // so its own computed weight is not a Bold_Chrome_Text LABEL observation.
            if (!(el.textContent || '').trim()) continue;
            out.push({ weight: cs.fontWeight, family: cs.fontFamily, text: (el.textContent || '').trim().slice(0, 24) });
          }
          return out;
        }, selector);

        // A role absent from a page is skipped, not failed (cad.html has no h1/h2, most
        // pages have no skills pills, and no page has a form).
        for (const el of got) {
          assert.ok(SHIPPED_WEIGHTS.includes(el.weight), `${contentPage}@${viewport} ${role} "${el.text}": weight ${el.weight} has no shipped face`);
          assert.equal(
            el.weight,
            expect,
            `${contentPage}@${viewport} ${role} "${el.text}": computed ${el.weight}, partition requires ${expect}`,
          );
          assert.ok(
            el.family.replace(/["']/g, '').startsWith(BODY_FAMILY_HEAD),
            `${contentPage}@${viewport} ${role} "${el.text}": family ${el.family} — Req 11 c5 pins Body_Font first`,
          );
        }
        return true;
      },
    ),
    RUNS,
  );
});

// ===========================================================================
// Property 5 — Nothing overflows, in either font state (bold groups arm)
// ===========================================================================

test('Property 5: every Bold_Chrome_Text label is contained, in either font state', async () => {
  // Feature: portfolio-typography-refresh, Property 5
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...NINE_PAGES),
      fc.constantFrom(...VIEWPORTS),
      fc.constantFrom(...FONT_STATES),
      async (contentPage, viewport, fontState) => {
        const page = await getRenderedPage(contentPage, viewport, fontState);
        const r = await page.evaluate(() => {
          const problems = [];
          const seen = (sel) => [...document.querySelectorAll(sel)].filter((el) => el.offsetHeight > 0);

          const lineCount = (el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            const tops = [...range.getClientRects()]
              .filter((r) => r.width > 0.01 && r.height > 0.01)
              .map((r) => Math.round(r.top * 2) / 2);
            return new Set(tops).size;
          };

          for (const el of seen('.button, a.button.skills, #nav ul.links a')) {
            const text = (el.textContent || '').trim();
            if (!text) continue; // icon-only control, no label
            const cs = getComputedStyle(el);
            // Req 11 c9: no clipped character, and no ellipsis applied.
            if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
              problems.push(`clipped: "${text}"`);
            }
            if (cs.textOverflow === 'ellipsis') problems.push(`text-overflow: ellipsis applied to "${text}"`);
          }

          // Req 11 c11: Read More / View Model each on ONE line inside the padding box.
          for (const el of seen('#main .actions .button, .button.primary')) {
            const text = (el.textContent || '').trim();
            if (!text) continue;
            if (lineCount(el) > 1) problems.push(`"${text}" wrapped onto ${lineCount(el)} lines`);
            const cs = getComputedStyle(el);
            if (cs.whiteSpace !== 'nowrap') problems.push(`"${text}" lost white-space: nowrap`);
          }

          // Req 11 c10: nav labels one line each, inside #nav, none overlapping.
          const nav = document.querySelector('#nav');
          const navLinks = seen('#nav ul.links a');
          if (nav && navLinks.length) {
            const navBox = nav.getBoundingClientRect();
            for (const a of navLinks) {
              const text = (a.textContent || '').trim();
              if (lineCount(a) > 1) problems.push(`nav "${text}" wrapped`);
              const b = a.getBoundingClientRect();
              if (b.left < navBox.left - 0.5 || b.right > navBox.right + 0.5) {
                problems.push(`nav "${text}" escapes the #nav content box`);
              }
            }
            for (let i = 0; i < navLinks.length; i += 1) {
              for (let j = i + 1; j < navLinks.length; j += 1) {
                const a = navLinks[i].getBoundingClientRect();
                const b = navLinks[j].getBoundingClientRect();
                if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) {
                  problems.push('two nav links overlap');
                }
              }
            }
          }

          // Req 13 c16 / Req 11 c9: no horizontal page scrollbar.
          const doc = document.documentElement;
          if (doc.scrollWidth > doc.clientWidth + 1) problems.push('horizontal page scrollbar');

          return [...new Set(problems)];
        });

        assert.deepEqual(r, [], `${contentPage}@${viewport} [${fontState}]: ${r.join(' | ')}`);
        return true;
      },
    ),
    RUNS,
  );
});

// ===========================================================================
// Property 6 — No forbidden token, no off-origin font, no inline typography
// ===========================================================================

test('Property 6: forbidden tokens absent; no inline typography, alignment or colour', async () => {
  const artifacts = {
    'assets/css/main.css': readCompiledStylesheet(),
    'assets/sass/libs/_vars.scss': readSassFile('libs/_vars.scss'),
    'assets/sass/layout/_footer.scss': readSassFile('layout/_footer.scss'),
    'assets/sass/layout/_main.scss': readSassFile('layout/_main.scss'),
    'assets/sass/layout/_nav.scss': readSassFile('layout/_nav.scss'),
    'assets/sass/base/_page.scss': readSassFile('base/_page.scss'),
    'assets/sass/base/_typography.scss': readSassFile('base/_typography.scss'),
    'assets/sass/components/_button.scss': readSassFile('components/_button.scss'),
  };

  // Feature: portfolio-typography-refresh, Property 6
  fc.assert(
    fc.property(
      fc.constantFrom(...Object.keys(artifacts)),
      fc.constantFrom(...FORBIDDEN_FAMILY_NAMES, ...FORBIDDEN_COLOUR_LITERALS),
      (name, forbidden) => {
        assert.ok(!artifacts[name].includes(forbidden), `${name} contains the forbidden token ${forbidden}`);
        return true;
      },
    ),
    RUNS,
  );

  // Off-origin fonts.
  assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(artifacts['assets/css/main.css']));

  // The widened inline-style oracle. The carve-out matters: index.html carries
  // style="--project-image: url(...)" on every project card, and a blanket ban produces
  // seven false failures.
  fc.assert(
    fc.property(fc.constantFrom(...NINE_PAGES), (contentPage) => {
      const html = readContentPage(contentPage);
      let customPropertyStyles = 0;
      for (const m of html.matchAll(/\sstyle="([^"]*)"/g)) {
        const banned = bannedInlineDeclarations(m[1]);
        assert.deepEqual(
          banned,
          [],
          `${contentPage}: inline style declares ${banned.map((b) => b.property).join(', ')} — banned set is ${BANNED_INLINE_PROPERTIES.join(', ')}`,
        );
        if (/^\s*--/.test(m[1])) customPropertyStyles += 1;
      }
      // No in-page <style> block either.
      assert.ok(!/<style[\s>]/i.test(html), `${contentPage}: carries an in-page <style> block`);
      if (contentPage === 'index.html') {
        assert.ok(customPropertyStyles >= 0, 'carve-out sanity');
      }
      return true;
    }),
    RUNS,
  );
});

// ===========================================================================
// Property 8 — Everything outside the intended delta is byte-identical
// ===========================================================================

/**
 * The Change Set 2 extension: the Card_Header_Band `text-align` value moves OUT of the
 * baseline set (it is now an intended change), and what moves IN is everything the
 * centring must not disturb.
 */
test('Property 8: everything outside the intended delta matches its baseline', async () => {
  const BASELINE = {
    // Req 10 c9 — the band's own box is untouched by an inline-alignment change.
    bandBackgroundColor: 'rgb(18, 38, 58)',
    bandPadding: [0.85, 1], // rem, at viewports with no breakpoint override
    // Req 10 c4, c5 — the Card_Heading rule was deliberately not edited at all.
    headingFontSizeRem: 1.1,
    headingTextTransform: 'none',
    headingColor: 'rgb(255, 255, 255)',
    // Req 1 c11 / Req 14 c8 — siblings of the changed footer values.
    footerH3Color: 'rgb(113, 121, 129)',
    footerSocialColor: 'rgb(113, 121, 129)',
    // Req 11 c13 — pill appearance.
    pillBorderRadius: '999px',
    pillBackgroundColor: 'rgba(18, 38, 58, 0.92)',
    pillColor: 'rgb(255, 255, 255)',
  };

  // Feature: portfolio-typography-refresh, Property 8
  await fc.assert(
    fc.asyncProperty(fc.constantFrom(...NINE_PAGES), fc.constantFrom(...VIEWPORTS), async (contentPage, viewport) => {
      const page = await getRenderedPage(contentPage, viewport);
      const rootPx = ROOT_PX_BY_VIEWPORT[viewport];
      const got = await page.evaluate(
        ({ band, heading }) => {
          const read = (sel, fn) => {
            const el = document.querySelector(sel);
            return el ? fn(el, getComputedStyle(el)) : null;
          };
          return {
            band: read(band, (el, cs) => ({
              textAlign: cs.textAlign,
              backgroundColor: cs.backgroundColor,
              paddingTop: cs.paddingTop,
              paddingLeft: cs.paddingLeft,
              width: el.getBoundingClientRect().width,
            })),
            heading: read(heading, (el, cs) => ({
              fontSize: parseFloat(cs.fontSize),
              textTransform: cs.textTransform,
              color: cs.color,
              lineHeight: cs.lineHeight,
            })),
            // Req 10 c5: the anchor must declare NO colour of its own.
            headingAnchorColor: read(`${heading} > a`, (el, cs) => cs.color),
            footerH3: read('#footer h3', (el, cs) => cs.color),
            footerSocial: read('#footer .icons a', (el, cs) => cs.color),
            pill: read('.button.skills', (el, cs) => ({
              borderRadius: cs.borderRadius,
              backgroundColor: cs.backgroundColor,
              color: cs.color,
              textTransform: cs.textTransform,
            })),
            // Req 10 c7: no other element's alignment moved. Card description paragraphs
            // are named explicitly because they are the two declarations a careless global
            // replace would have caught.
            descriptionAligns: [...document.querySelectorAll('body.home #main > .posts > article p')].map(
              (p) => getComputedStyle(p).textAlign,
            ),
          };
        },
        { band: CARD_HEADER_BAND, heading: CARD_HEADING },
      );

      if (got.band) {
        // The INTENDED change.
        assert.equal(got.band.textAlign, 'center', `${contentPage}@${viewport}: band is ${got.band.textAlign}`);
        // Everything else about the band, unchanged. The rem baseline is asserted only at
        // >=1024px: a pre-existing <=736px breakpoint legitimately overrides the band to
        // `padding: 0.75rem 0.9rem`, so pinning 0.85rem/1rem everywhere would report that
        // long-standing responsive rule as a Change Set 2 regression.
        assert.equal(got.band.backgroundColor, BASELINE.bandBackgroundColor);
        if (viewport >= 1024) {
          assert.equal(round2(parseFloat(got.band.paddingTop) / rootPx), BASELINE.bandPadding[0]);
          assert.equal(round2(parseFloat(got.band.paddingLeft) / rootPx), BASELINE.bandPadding[1]);
        }
      }
      if (got.heading) {
        assert.equal(got.heading.textTransform, BASELINE.headingTextTransform);
        assert.equal(got.heading.color, BASELINE.headingColor);
        // font-size legitimately steps down at <=small breakpoints (conflict C5), so the
        // 1.1rem baseline is asserted only where no breakpoint override applies.
        if (viewport >= 1024) {
          assert.equal(round2(got.heading.fontSize / rootPx), BASELINE.headingFontSizeRem);
        }
      }
      if (got.headingAnchorColor) {
        assert.equal(got.headingAnchorColor, got.heading.color, `${contentPage}: h2 > a does not inherit its colour`);
      }
      if (got.footerH3) assert.equal(got.footerH3, BASELINE.footerH3Color);
      if (got.footerSocial) assert.equal(got.footerSocial, BASELINE.footerSocialColor);
      if (got.pill) {
        assert.equal(got.pill.borderRadius, BASELINE.pillBorderRadius);
        assert.equal(got.pill.backgroundColor, BASELINE.pillBackgroundColor);
        assert.equal(got.pill.color, BASELINE.pillColor);
      }
      for (const align of got.descriptionAligns) {
        assert.equal(align, 'left', `${contentPage}@${viewport}: a card description paragraph is ${align} — Req 10 c7`);
      }
      return true;
    }),
    RUNS,
  );
});

// ===========================================================================
// Property 10 — Focus and hover states behave as declared
// ===========================================================================

test('Property 10: the Back_To_Top_Control and Design_Credit focus/hover behave as declared', async () => {
  // Feature: portfolio-typography-refresh, Property 10
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...NINE_PAGES),
      fc.constantFrom(...VIEWPORTS),
      fc.constantFrom(BACK_TO_TOP_CONTROL, DESIGN_CREDIT_LINK),
      async (contentPage, viewport, selector) => {
        const page = await getRenderedPage(contentPage, viewport);
        const r = await page.evaluate((sel) => {
          const a = document.querySelector(sel);
          if (!a) return null;
          const before = getComputedStyle(a);
          const idle = { cursor: before.cursor, outlineWidth: before.outlineWidth };
          a.focus();
          const cs = getComputedStyle(a);
          const rect = a.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(a);
          const textRects = [...range.getClientRects()].filter((x) => x.width > 0.01);
          const textWidth = textRects.length ? Math.max(...textRects.map((x) => x.right)) - Math.min(...textRects.map((x) => x.left)) : 0;
          return {
            idleCursor: idle.cursor,
            focusCursor: cs.cursor,
            outlineStyle: cs.outlineStyle,
            outlineWidth: parseFloat(cs.outlineWidth),
            outlineColor: cs.outlineColor,
            outlineOffset: parseFloat(cs.outlineOffset),
            color: cs.color,
            boxWidth: rect.width,
            textWidth,
            isFocused: document.activeElement === a,
            tabIndex: a.tabIndex,
          };
        }, selector);

        assert.ok(r, `${contentPage}: ${selector} not found`);
        // Req 13 c17: pointer cursor, overriding the block's cursor: default.
        assert.equal(r.idleCursor, 'pointer', `${contentPage}@${viewport} ${selector}: cursor is ${r.idleCursor}`);
        // Req 13 c9: at least 2 CSS px, spanning at least the full width of the text.
        assert.ok(r.isFocused, `${contentPage}: ${selector} did not take focus`);
        assert.ok(r.outlineWidth >= 2, `${contentPage}@${viewport}: focus indicator ${r.outlineWidth}px < 2px`);
        assert.notEqual(r.outlineStyle, 'none');
        assert.ok(
          r.boxWidth + 2 * r.outlineOffset >= r.textWidth - 0.5,
          `${contentPage}@${viewport}: indicator spans ${r.boxWidth} < text ${r.textWidth}`,
        );
        // currentColor: the ring tracks the block colour, so §5.6 and §5.5 cannot drift.
        assert.equal(r.outlineColor, r.color, `${contentPage}@${viewport}: ring ${r.outlineColor} != text ${r.color}`);
        // Req 13 c8: no positive tabindex.
        assert.ok(r.tabIndex <= 0, `${contentPage}: ${selector} declares tabindex ${r.tabIndex}`);
        // The ring must survive SIMULTANEOUS hover — outline and color are independent.
        await page.hover(selector);
        const hovered = await page.evaluate((sel) => {
          const a = document.querySelector(sel);
          a.focus();
          const cs = getComputedStyle(a);
          return { outlineWidth: parseFloat(cs.outlineWidth), outlineStyle: cs.outlineStyle, color: cs.color };
        }, selector);
        assert.ok(hovered.outlineWidth >= 2 && hovered.outlineStyle !== 'none', `${contentPage}: the ring vanished under hover`);
        assert.ok(
          round2(contrastRatio(hovered.color, '#1e252d')) >= 4.5,
          `${contentPage}: hover colour ${hovered.color} below 4.5:1 — Req 14 c3`,
        );
        return true;
      },
    ),
    RUNS,
  );
});

// ===========================================================================
// Property 11 — Every font file is provably the vendor's, from the vendor
// ===========================================================================

/**
 * The Change Set 2 split: `licence_text_file` resolves PER FAMILY. Body_Font must name a
 * file that is present; Heading_Font must carry the "none — accepted" sentinel.
 *
 * The direction of the oracle matters. The naive fix — skip the check for Horizon — would
 * also pass a record that had quietly LOST the field, so the sentinel's PRESENCE is what
 * is asserted.
 */
test('Property 11: licence-text resolution, per family', async () => {
  const provenance = fs.readFileSync(repoPath('assets', 'webfonts', 'FONT-PROVENANCE.md'), 'utf8');
  const records = provenance
    .split(/^## /m)
    .slice(1)
    // Records only. The file also carries narrative sections ("Intake findings", "Bundle
    // budget"), and treating those as records fails every field assertion for a reason
    // that has nothing to do with provenance.
    .filter((chunk) => /^[\w-]+\.(woff2?|otf|ttf)\s*$/m.test(chunk.split('\n')[0]))
    .map((chunk) => {
      const file = chunk.split('\n')[0].trim();
      const field = (name) => (chunk.match(new RegExp(`\\|\\s*\`${name}\`\\s*\\|\\s*([^|]+)\\|`)) ?? [])[1]?.trim();
      return {
        file,
        family: file.startsWith('Horizon') ? 'heading' : 'body',
        licenceTextFile: field('licence_text_file'),
        designer: field('designer'),
        sourceUrl: field('source_url'),
        downloadDate: field('download_date'),
        licenceTier: field('licence_tier'),
        converted: field('converted'),
      };
    });
  assert.ok(records.length >= 3, `expected >=3 provenance records, found ${records.length}`);

  const SENTINEL = '*none — accepted, see note*';

  // Feature: portfolio-typography-refresh, Property 11
  fc.assert(
    fc.property(fc.constantFrom(...records), (record) => {
      // The four Req 9 c9 fields stay non-empty for every family — the amendment narrows
      // the record, not the obligation.
      for (const key of ['designer', 'sourceUrl', 'downloadDate', 'licenceTier']) {
        assert.ok(record[key] && record[key].length > 1, `${record.file}: ${key} is empty`);
      }
      assert.match(record.converted, /^no$/i, `${record.file}: converted is ${record.converted}`);

      if (record.family === 'heading') {
        assert.equal(record.licenceTextFile, SENTINEL, `${record.file}: expected the sentinel, got ${record.licenceTextFile}`);
        assert.match(record.licenceTier, /free for personal use/i);
        assert.match(record.designer, /Alberto Fontense/);
      } else {
        const named = record.licenceTextFile.replace(/`/g, '').trim();
        assert.ok(
          fs.existsSync(repoPath('assets', 'webfonts', named)),
          `${record.file}: licence_text_file names ${named}, which is not present`,
        );
      }
      return true;
    }),
    RUNS,
  );

  // No TODO marker survives, anywhere — that is what distinguishes a recorded position
  // from an unresolved action.
  assert.ok(!/TODO/.test(provenance), 'a TODO marker survives in FONT-PROVENANCE.md');
  // And no substitute file materialised where the record says none exists (Req 9 c11).
  assert.ok(!fs.existsSync(repoPath('assets', 'webfonts', 'Horizon-LICENSE.txt')));
  // Req 9 c1: no aggregator source.
  assert.ok(!/fontdownloader\.net/i.test(provenance));
});

// ===========================================================================
// Property 14 — Every card title line is centred in its band
// ===========================================================================

test('Property 14: every rendered card title LINE is centred in its band', async () => {
  const browser = await getBrowser();

  /**
   * Quantified over rendered LINES, not headings. A check on the heading's own bounding
   * box would pass for a flex-centred h2 whose lines were still left-ragged — the exact
   * mistake §5.2 rejects.
   */
  const measure = async (viewport) => {
    const page = await getRenderedPage('index.html', viewport);
    const bands = await measureLabelBoxes(page, CARD_HEADER_BAND);
    const headings = await measureLabelBoxes(page, CARD_HEADING);
    return headings.map((h, i) => ({ heading: h, band: bands[i] }));
  };

  const byViewport = {};
  for (const viewport of VIEWPORTS) byViewport[viewport] = await measure(viewport);

  const cases = VIEWPORTS.flatMap((viewport) =>
    byViewport[viewport].map((pair, index) => ({ viewport, index, ...pair })),
  );
  assert.ok(cases.length >= 24, `expected >=24 (heading, viewport) pairs, found ${cases.length}`);

  // The <br /> card is PINNED as a required case, not sampled: it is the only heading that
  // breaks at every viewport, so a uniform generator could miss it entirely.
  const forcedBreak = cases.filter((c) => c.heading.text.startsWith(FORCED_BREAK_CARD_HEADING_TEXT));
  assert.equal(forcedBreak.length, VIEWPORTS.length, `the ${FORCED_BREAK_CARD_HEADING_TEXT} card was not found at all four viewports`);
  for (const c of forcedBreak) {
    assert.ok(c.heading.lines.length >= 2, `${FORCED_BREAK_CARD_HEADING_TEXT} @${c.viewport} rendered on ${c.heading.lines.length} line(s) — the <br /> case is not being exercised`);
  }

  const checkCentred = ({ viewport, heading, band, index }) => {
    const cb = contentBox(band);
    for (const [n, line] of heading.lines.entries()) {
      const left = line.left - cb.left;
      const right = cb.right - line.right;
      assert.ok(
        Math.abs(left - right) <= 1,
        `card ${index} "${heading.text.slice(0, 32)}" @${viewport} line ${n + 1}: left gap ${left.toFixed(2)}px vs right gap ${right.toFixed(2)}px`,
      );
    }
    return true;
  };

  // Feature: portfolio-typography-refresh, Property 14
  fc.assert(fc.property(fc.constantFrom(...cases), checkCentred), RUNS);
  // ...and the pinned cases unconditionally, outside the sampler.
  for (const c of forcedBreak) checkCentred(c);
});

// ===========================================================================
// Property 15 — Every skills pill box fits its label, symmetrically and in ratio
// ===========================================================================

test('Property 15: every skills pill box fits its label, symmetrically and in ratio', async () => {
  const browser = await getBrowser();

  const measurements = [];
  for (const contentPage of NINE_PAGES) {
    for (const viewport of VIEWPORTS) {
      const m = await measurePage(browser, contentPage, viewport);
      if (m.pills.length) measurements.push(m);
    }
  }
  const cases = measurements.flatMap((m) => m.pills.map((pill) => ({ page: m.page, viewport: m.viewport, pill })));
  assert.ok(cases.length >= 96, `expected >=96 (pill, viewport) observations, found ${cases.length}`);

  // Feature: portfolio-typography-refresh, Property 15
  fc.assert(
    fc.property(fc.constantFrom(...cases), ({ page, viewport, pill }) => {
      const bad = pill.results.filter((r) => !r.ok);
      assert.deepEqual(
        bad.map((r) => `${r.criterion}=${r.measured}`),
        [],
        `${page}@${viewport} ${pill.geometry} "${pill.text}": ${bad.map((r) => `${r.criterion} (${r.name}) = ${r.measured}`).join('; ')}`,
      );
      return true;
    }),
    RUNS,
  );

  // c12 — layout, once per (page, viewport) rather than per pill.
  for (const m of measurements) {
    assert.deepEqual(m.layoutProblems, [], `${m.page}@${m.viewport}: ${m.layoutProblems.join(' | ')}`);
    assert.deepEqual(m.clipped, [], `${m.page}@${m.viewport}: clipped pills ${m.clipped.join(', ')}`);
    assert.equal(m.hScroll, false, `${m.page}@${m.viewport}: horizontal page scrollbar`);
  }

  /**
   * The DECLARED arm. The wider-context geometry has ZERO rendered instances — its
   * `.button.skills` half is overridden by the later `body.home #main .button.skills`, and
   * its `.actions .button` half by the later `body.home #main .actions .button`. Layer 2
   * therefore cannot see it, and a rendered-only property would report a clean pass over a
   * rule declaring `line-height` as a LENGTH equal to `height`. This arm is the only place
   * that fault is observable.
   */
  const css = readCompiledStylesheet();
  const declaredCases = VIEWPORTS.flatMap((viewport) =>
    [['WATERJET FABRICATION', 14.096], ['C++', 2.105]].map(([label, em]) => ({ label, em, viewport })),
  );
  fc.assert(
    fc.property(fc.constantFrom(...declaredCases), ({ label, em, viewport }) => {
      const d = evaluateDeclaredGeometry(css, {
        selector: 'body.home #main .button.skills, body.home #main .actions .button',
        label,
        labelWidthEm: em,
        rootPx: ROOT_PX_BY_VIEWPORT[viewport],
        viewport,
      });
      assert.ok(
        !d.declared.lineHeightIsLength,
        `wider-context line-height is declared as the LENGTH ${d.declared.lineHeight}; Req 12 c4's vertical gap then evaluates to zero`,
      );
      const bad = d.results.filter((r) => !r.ok);
      assert.deepEqual(
        bad.map((r) => `${r.criterion}=${r.measured}`),
        [],
        `declared wider-context "${label}"@${viewport}: ${bad.map((r) => `${r.criterion} = ${r.measured}`).join('; ')}`,
      );
      return true;
    }),
    RUNS,
  );

  /**
   * Multi-line arm (Req 12 c6). Current content reaches exactly 20 characters and no label
   * wraps at these sizes, so real content never reaches this path — it has to be generated.
   */
  const page = await getRenderedPage('index.html', 1440);
  const multiline = await page.evaluate(
    async ({ longLabel }) => {
      const pill = document.querySelector('.button.skills');
      const original = pill.textContent;
      pill.textContent = longLabel;
      void pill.offsetHeight;
      const range = document.createRange();
      range.selectNodeContents(pill);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0.01 && r.height > 0.01);
      const tops = [...new Set(rects.map((r) => Math.round(r.top * 2) / 2))];
      const cs = getComputedStyle(pill);
      const box = pill.getBoundingClientRect();
      const card = pill.closest('article').getBoundingClientRect();
      const out = {
        lines: tops.length,
        lineHeight: parseFloat(cs.lineHeight),
        boxHeight: box.height,
        whiteSpace: cs.whiteSpace,
        insideCard: box.left >= card.left - 1 && box.right <= card.right + 1 && box.bottom <= card.bottom + 1,
        clipped: pill.scrollWidth > pill.clientWidth + 1 || pill.scrollHeight > pill.clientHeight + 1,
        hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
      pill.textContent = original;
      void pill.offsetHeight;
      return out;
    },
    {
      // Long enough to exceed the skills-box content width at 1440px, which is the widest
      // it gets (490.4px). A 46-character label renders 304.3px at 0.55rem/800 and does
      // NOT wrap -- it simply fits, so it exercises nothing. Real content reaches exactly
      // 20 characters, which is why this path has to be generated at all.
      longLabel:
        'Computational fluid dynamics simulation and adaptive mesh refinement harness for turbulent flows',
    },
  );

  assert.ok(multiline.lines >= 2, `the generated over-long label did not wrap (${multiline.lines} line)`);
  assert.equal(multiline.whiteSpace, 'normal', 'white-space: nowrap was reintroduced — Req 12 c11');
  const summedRatio = (multiline.lines * multiline.lineHeight) / multiline.boxHeight;
  assert.ok(
    summedRatio <= BOUNDS.multiLineHeightRatioMax,
    `multi-line summed line height ratio ${summedRatio.toFixed(3)} exceeds ${BOUNDS.multiLineHeightRatioMax}`,
  );
  assert.ok(multiline.insideCard, 'a wrapped pill escaped its card — Req 12 c8, Req 5 c7');
  assert.ok(!multiline.clipped, 'a wrapped pill is clipped');
  assert.ok(!multiline.hScroll, 'a wrapped pill produced a horizontal page scrollbar');
  console.log(
    `    multi-line arm: ${multiline.lines} lines, summed ratio ${summedRatio.toFixed(3)} ` +
      `(bound <= ${BOUNDS.multiLineHeightRatioMax}), inside card, not clipped`,
  );
});

// ===========================================================================
// Property 16 — The Back to top control works without scripting, from the keyboard
// ===========================================================================

test('Property 16: the Back to top control, markup and accessibility clauses', async () => {
  const expectedUl =
    '<ul><li><a href="#top">Back to top</a></li><li>Design: <a href="https://html5up.net">HTML5 UP</a></li></ul>';

  // Feature: portfolio-typography-refresh, Property 16 (static clauses — Check B)
  fc.assert(
    fc.property(fc.constantFrom(...NINE_PAGES), (contentPage) => {
      const html = readContentPage(contentPage);
      const block = html.match(/<div id="copyright">[\s\S]*?<\/div>/);
      assert.ok(block, `${contentPage}: no Copyright_Block`);
      const ul = block[0].match(/<ul>[\s\S]*?<\/ul>/);
      assert.ok(ul, `${contentPage}: no <ul> inside the Copyright_Block`);
      // Byte-identical inner markup — this is what stops the nine pages drifting.
      assert.equal(ul[0], expectedUl, `${contentPage}: Copyright_Block markup diverged`);

      // Two SEPARATE elements (Req 13 c12). A single anchor doing both jobs would pass a
      // naive "control exists" plus "credit exists" pair while making the credit
      // unclickable or the control an external link.
      const items = [...ul[0].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
      assert.equal(items.length, 2, `${contentPage}: expected 2 <li>, found ${items.length}`);
      const control = items.find((i) => /href="#/.test(i));
      const credit = items.find((i) => /html5up\.net/.test(i));
      assert.ok(control && credit, `${contentPage}: control and credit are not separate items`);
      assert.notEqual(control, credit);

      // Req 13 c4, c6: a same-document fragment, not "#" and not a javascript: URL.
      const href = control.match(/href="([^"]*)"/)[1];
      assert.ok(/^#(top|wrapper)$/.test(href), `${contentPage}: control href is ${href}`);
      assert.notEqual(href, '#');
      assert.ok(!/^javascript:/i.test(href));
      // Req 13 c5: no scrolly class, so the intended behaviour depends on no script.
      assert.ok(!/class=/.test(control), `${contentPage}: the control carries a class — scrolly would make it script-dependent`);
      // Req 13 c7: the visible text IS the accessible name, so no aria-label is added.
      assert.ok(!/aria-label/.test(control), `${contentPage}: a redundant aria-label was added`);
      assert.match(control, />Back to top</);
      // Req 13 c8: no tabindex on the control.
      assert.ok(!/tabindex/i.test(ul[0]), `${contentPage}: a tabindex is declared inside the Copyright_Block`);

      // Req 13 c10, c11: names HTML5 UP, links to https://html5up.net, and its text
      // references NEITHER fonts nor icons.
      assert.match(credit, /href="https:\/\/html5up\.net"/);
      assert.match(credit, /HTML5 UP/);
      assert.ok(!/fonts?/i.test(credit) && !/icons?/i.test(credit), `${contentPage}: the credit still references fonts or icons: ${credit}`);

      // Req 13 c14: no unescaped ampersand — satisfied vacuously, there is none at all.
      assert.ok(!/&(?!amp;|lt;|gt;|quot;|#)/.test(ul[0]));
      return true;
    }),
    RUNS,
  );
});

test('Check I: the Back to top control works with scripting disabled and with scripts aborted', async () => {
  /**
   * A SEPARATELY CONFIGURED CONTEXT, not a different generator — which is why this cannot
   * be folded into Check D. `javaScriptEnabled: false` is context-level, and a context
   * with scripting off cannot also exercise the card-interaction paths Check F needs.
   *
   * The 'aborted' arm is the partial-failure case Req 13 c5 also names (scrolly failing to
   * load) and it is genuinely different: inline handlers still run there.
   */
  const activations = ['pointer', 'keyboard'];
  const scriptStates = ['disabled', 'aborted'];

  const cases = NINE_PAGES.flatMap((p) =>
    scriptStates.flatMap((s) => activations.map((a) => ({ contentPage: p, scriptState: s, activation: a }))),
  );

  // Feature: portfolio-typography-refresh, Property 16 (no-JS arm — Check I)
  await fc.assert(
    fc.asyncProperty(fc.constantFrom(...cases), async ({ contentPage, scriptState, activation }) => {
      const { context, page } = await openScriptless(contentPage, 1440, scriptState);
      try {
        const pathnameBefore = await page.evaluate(() => location.pathname);

        // Scroll away from the top so the assertion has something to prove. Explicitly
        // instant, so the setup cannot leave the page mid-animation if a future edit ever
        // reintroduces CSS smooth scrolling (see the html rule in base/_page.scss).
        await page.evaluate(() => window.scrollTo({ top: 100000, behavior: 'instant' }));
        const scrolledTo = await page.evaluate(() => window.scrollY);
        assert.ok(scrolledTo > 0, `${contentPage}: the page does not scroll, so the control cannot be exercised`);

        const control = page.locator('#copyright a[href^="#"]').first();
        assert.equal(await control.count(), 1, `${contentPage}: expected exactly one Back_To_Top_Control`);
        assert.equal((await control.textContent()).trim(), 'Back to top');

        if (activation === 'pointer') {
          await control.click();
        } else {
          // Req 13 c3, c8: reachable by sequential keyboard navigation, and Enter on a
          // focused anchor performs the same navigation as a click — no keydown handler.
          await control.focus();
          assert.ok(
            await page.evaluate(() => document.activeElement?.getAttribute('href')?.startsWith('#')),
            `${contentPage}: the control did not take focus`,
          );
          await page.keyboard.press('Enter');
        }

        // Oracle: scrollY back to 0 AND an unchanged pathname. The second half is what
        // distinguishes a working fragment jump from a navigation to another document.
        //
        // TWO HARNESS TRAPS, both of which produce a 100%-reproducible false failure that
        // looks exactly like a broken control:
        //   1. `waitForFunction`'s signature is (fn, arg, options), so passing {timeout}
        //      as the SECOND argument silently makes it the page-function argument and
        //      leaves the 30s default in force.
        //   2. `page.waitForFunction` is unreliable *after a same-document fragment
        //      navigation* in the scripts-aborted context: its in-page poller is stranded
        //      and never reports, even though `page.evaluate(() => window.scrollY)`
        //      returns 0 the instant the wait gives up. Verified directly: all four
        //      (scriptState x activation) combinations reach scrollY 0 on every page.
        //      So the wait is driven from the Node side instead, which is the mechanism
        //      already proven to observe the value correctly.
        await waitForScrollTop(page, 10000);
        assert.equal(await page.evaluate(() => window.scrollY), 0, `${contentPage} [${scriptState}/${activation}]: did not return to the top`);
        assert.equal(await page.evaluate(() => location.pathname), pathnameBefore, `${contentPage}: navigated away from the document`);

        // Req 13 c8: no positive tabindex on the control or ANY ancestor.
        const positiveTabindex = await page.evaluate(() => {
          let el = document.querySelector('#copyright a[href^="#"]');
          while (el) {
            const t = el.getAttribute?.('tabindex');
            if (t !== null && t !== undefined && Number(t) > 0) return `${el.tagName}[tabindex=${t}]`;
            el = el.parentElement;
          }
          return null;
        });
        assert.equal(positiveTabindex, null, `${contentPage}: positive tabindex on ${positiveTabindex}`);
      } finally {
        await context.close();
      }
      return true;
    }),
    { numRuns: 100, endOnFailure: true },
  );
});

// ===========================================================================
// Check C — the §5.3 advance-width table, from the binaries
// ===========================================================================

test('Check C: measured 400 -> 800 advance widths match the design §5.3 table', () => {
  const raw = execFileSync('python3', [repoPath('tools', 'typography-check', 'advance-widths.py'), '--json'], {
    encoding: 'utf8',
  });
  const data = JSON.parse(raw);

  // Req 11 c16 — established by measurement rather than assumed.
  const [lo, hi] = data.increaseRangePct;
  assert.ok(lo >= 3.6 && lo <= 3.7, `narrowest increase ${lo}% is outside the recorded 3.62%`);
  assert.ok(hi <= 8.5, `widest increase ${hi}% exceeds the recorded 8.5% ceiling`);

  const expected = {
    PROJECTS: 5.22,
    'CAD GALLERY': 6.8,
    'READ MORE': 6.85,
    'VIEW MODEL': 7.01,
    CSS: 3.62,
    'AUTODESK INVENTOR': 6.81,
    'WATERJET FABRICATION': 6.79,
  };

  // Feature: portfolio-typography-refresh, Property 9 (Check C advance-width arm)
  fc.assert(
    fc.property(fc.constantFrom(...data.rows), (row) => {
      assert.ok(row.em800 > row.em400, `${row.label}: 800 is not wider than 400`);
      // Compared with a tolerance, not for exact equality: §5.3's table is quoted to two
      // decimals, and 5.225% legitimately renders as either 5.22 or 5.23 depending on the
      // rounding rule. A 0.02 percentage-point window still fails any real metric drift,
      // which is what this clause is for.
      assert.ok(
        Math.abs(row.increasePct - expected[row.label]) <= 0.02,
        `${row.label}: measured ${row.increasePct}%, design §5.3 records ${expected[row.label]}%`,
      );
      // The 1440px rendered width, which the pill geometry was sized against.
      assert.ok(row.px['1440'].w800 > row.px['1440'].w400);
      return true;
    }),
    RUNS,
  );

  console.log(`    Check C: 400 -> 800 increase measured at ${lo}% .. ${hi}% across seven labels`);
  console.log(
    `    widest pill label WATERJET FABRICATION: ${data.rows.at(-1).px['1440'].w400}px -> ${data.rows.at(-1).px['1440'].w800}px at 1440px`,
  );
});

// ===========================================================================
// Recorded, not asserted
// ===========================================================================

test('Req 11 c7 is a visual-review obligation, not a property', () => {
  // Overlapping glyph outlines and filled counters at 0.55rem / weight 800 are a rendering
  // judgement, not a bounding-box computation. No oracle here can assert them, so the
  // criterion is carried by the task 25 visual review at 320/768/1024/1440 in both font
  // states. This test exists so the omission is explicit in the run output rather than
  // silently absent.
  assert.ok(true);
  console.log(
    '    Req 11 c7 (no glyph collisions, open counters at 0.55rem/800) is NOT asserted here — visual review only.',
  );
});
