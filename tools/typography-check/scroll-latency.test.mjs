/**
 * Check J — scroll LATENCY of the two same-document scroll controls.
 *
 * Why this check exists, in one sentence: the Change Set 2 Check F extension asserted
 * where the intro down-arrow ENDED UP (`landedNear: true`, y 900) and that the console was
 * clean, and a scroll that did not begin for a full second satisfied both, so a plainly
 * broken interaction passed verification.
 *
 * The two controls reach the same class of outcome by different mechanisms and are
 * therefore both measured:
 *
 *   - `#intro .actions a.scrolly` -> jQuery, `.animate({scrollTop: t}, 1000, 'swing')`.
 *   - `#copyright a[href="#top"]` -> native fragment navigation, no script at all (Req 13 c5).
 *
 * A global `scroll-behavior` on the scrolling element breaks only the first: jQuery writes
 * `scrollTop` once per frame and each write starts its own smooth scroll, so the element
 * stays put until the 1000ms animation's final write sticks. Measuring only the native
 * control, or only the final position, misses it entirely.
 *
 * Integration, one run per control — like Checks E and F, not a property. The oracle is a
 * wall-clock bound, so extra fast-check iterations would add runtime and jitter without
 * widening the input space.
 *
 * Sampling runs from the NODE side on a timer. `page.waitForFunction` polls on
 * requestAnimationFrame, which is throttled in these headless contexts; an in-page poller
 * reports late or never. That trap is documented at the Check I call site in
 * properties-changeset2.test.mjs and it applies with more force here, where the quantity
 * under test IS the timing.
 */

import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  INTRO_DOWN_ARROW,
  INTRO_DOWN_ARROW_TARGET,
  BACK_TO_TOP_CONTROL,
  FIRST_MOVEMENT_BUDGET_MS,
  openUncachedPage,
  measureScrollLatency,
  timeToReach,
  scrollLatencyDiagnosis,
  closeAll,
} from './fixtures.mjs';

after(async () => {
  await closeAll();
});

/** Computed `scroll-behavior` of the element that actually scrolls the document. */
const scrollBehaviourOf = (page) =>
  page.evaluate(() => getComputedStyle(document.scrollingElement ?? document.documentElement).scrollBehavior);

/** Compact timeline for the run log — the first movement is what the eye reads. */
const timeline = (m) =>
  m.samples
    .filter((s, i) => i < 4 || s.t % 96 < 20)
    .slice(0, 12)
    .map((s) => `${s.t}ms:${Math.round(s.y)}`)
    .join(' ');

test('Check J: the intro down-arrow begins scrolling within the first-movement budget', async () => {
  const { context, page, consoleErrors } = await openUncachedPage('index.html', 1440);
  try {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

    const target = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
    }, INTRO_DOWN_ARROW_TARGET);
    assert.ok(target !== null && target > 0, `${INTRO_DOWN_ARROW_TARGET} is absent or already at the top`);

    const behaviour = await scrollBehaviourOf(page);
    const m = await measureScrollLatency(page, INTRO_DOWN_ARROW, { durationMs: 2000 });

    console.log(
      `  down-arrow: first movement ${m.firstMovementMs}ms, half-way ${timeToReach(m.samples, (y) => y >= target / 2)}ms, ` +
        `target ${timeToReach(m.samples, (y) => Math.abs(y - target) < 80)}ms, final ${Math.round(m.finalY)} ` +
        `(target ${target}, scroll-behavior: ${behaviour})\n  ${timeline(m)}`,
    );

    // The latency clause — the one the Check F extension was missing.
    assert.notEqual(m.firstMovementMs, null, scrollLatencyDiagnosis('intro down-arrow', m, behaviour));
    assert.ok(
      m.firstMovementMs <= FIRST_MOVEMENT_BUDGET_MS,
      scrollLatencyDiagnosis('intro down-arrow', m, behaviour),
    );

    // ...and the clause it did have, retained: the arrow must still land on #main.
    assert.ok(
      Math.abs(m.finalY - target) < 80,
      `intro down-arrow landed at ${Math.round(m.finalY)}, expected within 80px of the ${INTRO_DOWN_ARROW_TARGET} target ${target}`,
    );
    assert.deepEqual(consoleErrors, [], `console errors during the arrow scroll: ${consoleErrors.join(' | ')}`);
  } finally {
    await context.close();
  }
});

test('Check J: the footer Back to top control returns to the top promptly', async () => {
  const { context, page, consoleErrors } = await openUncachedPage('index.html', 1440);
  try {
    // Scroll away from the top instantly, so the measurement starts from a known y and no
    // easing from the setup can be mistaken for the control's own movement.
    await page.evaluate(() => window.scrollTo({ top: 1e6, behavior: 'instant' }));
    const startY = await page.evaluate(() => window.scrollY);
    assert.ok(startY > 0, 'index.html does not scroll at this viewport, so the control cannot be exercised');

    const behaviour = await scrollBehaviourOf(page);
    const m = await measureScrollLatency(page, BACK_TO_TOP_CONTROL, { durationMs: 2000 });

    console.log(
      `  back-to-top: first movement ${m.firstMovementMs}ms, reached 0 at ${timeToReach(m.samples, (y) => y === 0)}ms, ` +
        `final ${Math.round(m.finalY)} (start ${Math.round(startY)}, scroll-behavior: ${behaviour})\n  ${timeline(m)}`,
    );

    assert.notEqual(m.firstMovementMs, null, scrollLatencyDiagnosis('footer Back to top', m, behaviour));
    assert.ok(
      m.firstMovementMs <= FIRST_MOVEMENT_BUDGET_MS,
      scrollLatencyDiagnosis('footer Back to top', m, behaviour),
    );

    // Req 13 c2: the top of the document is brought into the viewport. Check I proves this
    // on all nine pages with scripting off; here it guards the latency measurement against
    // passing on a control that starts moving and then stops short.
    assert.equal(Math.round(m.finalY), 0, `Back to top settled at ${Math.round(m.finalY)}, expected 0`);
    assert.deepEqual(consoleErrors, [], `console errors during the Back to top scroll: ${consoleErrors.join(' | ')}`);
  } finally {
    await context.close();
  }
});
