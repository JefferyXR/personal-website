/**
 * Check A — files present at expected paths, and the handful of single literal
 * assertions the design reserves for unit tests rather than properties
 * (Testing Strategy, "Unit and integration tests").
 *
 * The 13 correctness properties live in their own files; this is the smoke gate that
 * makes a missing artifact fail fast instead of surfacing as a confusing property failure.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  NINE_PAGES,
  WEBFONT_BUNDLE,
  BUNDLE_BUDGET_BYTES,
  PER_FILE_BUDGET_BYTES,
  FORBIDDEN_FAMILY_NAMES,
  FORBIDDEN_COLOUR_LITERALS,
  FG_LINK,
  NINE_PAGES as PAGES,
  repoPath,
  readCompiledStylesheet,
  readContentPage,
  sfntFormat,
  contrastRatio,
  relativeLuminance,
  round2,
} from './fixtures.mjs';

test('Check A: all nine Content_Pages exist', () => {
  for (const page of NINE_PAGES) {
    assert.ok(fs.existsSync(repoPath(page)), `missing Content_Page ${page}`);
  }
});

test('Check A: every bundle font file exists, with the recorded size and real format', () => {
  for (const font of WEBFONT_BUNDLE) {
    const abs = repoPath('assets', 'webfonts', font.file);
    assert.ok(fs.existsSync(abs), `missing font file ${font.file}`);
    assert.equal(fs.statSync(abs).size, font.storedBytes, `${font.file} stored size drifted`);
    // Format from the sfnt signature, not the extension — Req 2 c6.
    assert.equal(sfntFormat(abs), font.format, `${font.file} format() hint would be wrong`);
  }
});

test('Check A: bundle sits inside the Req 2 c12 and c13 budgets', () => {
  let total = 0;
  for (const font of WEBFONT_BUNDLE) {
    const size = fs.statSync(repoPath('assets', 'webfonts', font.file)).size;
    total += size;
    if (font.format !== 'woff2') {
      assert.ok(size <= PER_FILE_BUDGET_BYTES, `${font.file} exceeds the per-file bound`);
    }
  }
  assert.ok(total <= BUNDLE_BUDGET_BYTES, `bundle total ${total} exceeds ${BUNDLE_BUDGET_BYTES}`);
});

test('Check A: only the three bundle faces ship — Req 2 c16 minimum face count', () => {
  const nonFa = fs
    .readdirSync(repoPath('assets', 'webfonts'))
    .filter((f) => /\.(woff2?|otf|ttf)$/i.test(f) && !/^fa-/.test(f))
    .sort();
  assert.deepEqual(nonFa, WEBFONT_BUNDLE.map((f) => f.file).sort());
});

test('Check A: the fifteen Font Awesome files are still present — Req 7 c7', () => {
  const fa = fs.readdirSync(repoPath('assets', 'webfonts')).filter((f) => /^fa-/.test(f));
  assert.equal(fa.length, 15, `expected 15 fa-* files, found ${fa.length}`);
});

test('Req 7 c9: main.css does not mention Merriweather or Source Sans Pro', () => {
  const artifacts = {
    'assets/css/main.css': readCompiledStylesheet(),
  };
  for (const [name, text] of Object.entries(artifacts)) {
    for (const forbidden of FORBIDDEN_FAMILY_NAMES) {
      assert.ok(!text.includes(forbidden), `${name} still mentions ${forbidden}`);
    }
  }
});

test('Req 7 c6: the @font-face blocks sit AFTER the Font Awesome @import', () => {
  const css = readCompiledStylesheet();
  const importIndex = css.indexOf('@import url(fontawesome-all.min.css)');
  const firstFontFace = css.indexOf('@font-face');
  assert.notEqual(importIndex, -1, 'the Font Awesome @import was removed');
  assert.notEqual(firstFontFace, -1, 'no @font-face rule found');
  assert.ok(
    importIndex < firstFontFace,
    'an @font-face rule precedes the @import, which invalidates it and breaks every icon',
  );
  assert.ok(!/fonts\.googleapis\.com/.test(css), 'the Google Fonts @import is still present');
});

test('every @font-face declares font-display: swap — Req 2 c8, Req 6 c6', () => {
  const css = readCompiledStylesheet();
  const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
  assert.ok(blocks.length >= WEBFONT_BUNDLE.length, 'fewer @font-face rules than bundle files');
  for (const block of blocks) {
    if (!/Horizon|PP Telegraf/.test(block)) continue;
    assert.match(block, /font-display:\s*swap/, `missing font-display: swap in ${block}`);
    assert.ok(!/https?:|\/\//.test(block.replace(/\.\.\/webfonts\//g, '')), 'off-origin font URL');
  }
});

test(`the footer email link declares the literal ${FG_LINK} — Req 1 c12`, () => {
  const css = readCompiledStylesheet();
  assert.match(css, new RegExp(`#footer a\\[href\\^="mailto:"\\]\\s*\\{[^}]*color:\\s*${FG_LINK}`));
  assert.equal(round2(contrastRatio(FG_LINK, '#f5f5f5')), 9.49);
  // Req 1 c2: strictly lower relative luminance than the sibling footer text colour.
  // Checked directly rather than inferred from the ratio.
  assert.ok(relativeLuminance(FG_LINK) < relativeLuminance('#717981'));

  // All THREE resolved literals must have moved together (§5.1). A partial replacement
  // ships two different email colours across the site.
  const occurrences = (css.match(new RegExp(FG_LINK, 'g')) ?? []).length;
  assert.equal(occurrences, 3, `expected 3 resolved ${FG_LINK} literals, found ${occurrences}`);
});

test('Req 1 c13: the superseded link colour occurs ZERO times in main.css', () => {
  // A zero-occurrence rule, not a replacement rule — explanatory comments naming the old
  // value count as occurrences, because the source would then document a value it no
  // longer sets. Raw file text is scanned deliberately, comments included.
  const artifacts = {
    'assets/css/main.css': readCompiledStylesheet(),
  };
  for (const [name, text] of Object.entries(artifacts)) {
    for (const forbidden of FORBIDDEN_COLOUR_LITERALS) {
      assert.ok(!text.includes(forbidden), `${name} still contains ${forbidden}`);
    }
  }
});

test('Req 10: the Card_Header_Band centres, and the description paragraphs do not', () => {
  const css = readCompiledStylesheet();

  // The band declares center.
  assert.match(
    css,
    /body\.home #main > \.posts > article header \{[^}]*text-align:\s*center/,
    'the compiled Card_Header_Band rule does not declare text-align: center',
  );

  // ...and the card description paragraph rule still declares left (Req 10 c7), on a rule
  // that is a 0.85rem card description and not something else that happens to be left.
  // Comments are stripped so a comment mentioning alignment cannot fake the match.
  const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(
    strip(css),
    /body\.home #main > \.posts > article p \{[^}]*font-size:\s*0\.85rem[^}]*text-align:\s*left/,
    'the 0.85rem card description rule no longer declares text-align: left — Req 10 c7',
  );
});

test('Req 11 c4: no font file added and no @font-face rule changed', () => {
  const css = readCompiledStylesheet();
  const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
  const telegrafWeights = blocks
    .filter((b) => /PP Telegraf/.test(b))
    .map((b) => (b.match(/font-weight:\s*(\d+)/) ?? [])[1])
    .sort();
  assert.deepEqual(telegrafWeights, ['400', '800'], 'the PP Telegraf @font-face set changed');
  const total = WEBFONT_BUNDLE.reduce(
    (a, f) => a + fs.statSync(repoPath('assets', 'webfonts', f.file)).size,
    0,
  );
  assert.equal(total, 103324, `bundle total moved to ${total} — Req 11 c4 adds no file`);
});

test('Req 12: the homepage pill geometry declares the §5.4 values', () => {
  const css = readCompiledStylesheet();

  for (const [name, text] of [['compiled', css]]) {
    const homepage = text.match(/body\.home #main \.button\.skills \{[\s\S]*?\}/);
    assert.ok(homepage, `${name}: homepage pill rule not found`);
    const body = homepage[0].replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '');
    assert.match(body, /padding:\s*0\.2rem 0\.55rem/, `${name}: homepage padding`);
    assert.match(body, /min-height:\s*1\.35rem/, `${name}: homepage min-height`);
    assert.match(body, /display:\s*inline-flex/, `${name}: homepage display`);
    assert.match(body, /align-items:\s*center/, `${name}: homepage align-items`);
    assert.match(body, /justify-content:\s*center/, `${name}: homepage justify-content`);
    // Req 12 c8, c11 — these must NOT have moved.
    assert.match(body, /font-size:\s*0\.55rem/, `${name}: font-size must be unchanged`);
    assert.match(body, /line-height:\s*1\.4/, `${name}: line-height must be unchanged`);
    assert.match(body, /white-space:\s*normal/, `${name}: white-space must stay normal`);
    assert.match(body, /height:\s*auto/, `${name}: height must stay auto`);
    // Req 12 c9 — appearance untouched.
    assert.match(body, /border-radius:\s*999px/, `${name}: capsule silhouette`);
  }

});

test('Req 13/14: the Copyright_Block declarations', () => {
  const css = readCompiledStylesheet();

  // Req 14: the resolved alpha. main.css is the source, so the resolved value IS the value —
  // there is no longer a `transparentize(..., 0.35)` expression upstream of it to agree with.
  const block = css.match(/#copyright \{[\s\S]*?\}/)[0];
  // last-declaration-wins: the color(alt) mixin declares color first, as opaque #ffffff.
  const colours = [...block.matchAll(/color:\s*([^;]+);/g)].map((m) => m[1].trim());
  assert.equal(colours.at(-1), 'rgba(255, 255, 255, 0.65)', `resolved #copyright colour is ${colours.at(-1)}`);
  assert.equal(round2(contrastRatio('rgba(255, 255, 255, 0.65)', '#1e252d')), 7.33);

  // Req 13 c17 and c9.
  assert.match(css, /#copyright a \{[^}]*cursor:\s*pointer/, 'the #copyright link cursor override is missing');
  assert.match(
    css,
    /#copyright a:focus-visible \{[^}]*outline:\s*2px solid currentColor[^}]*outline-offset:\s*2px/,
    'the #copyright focus indicator is missing or not 2px currentColor',
  );

  // Req 13 c2 is satisfied by the native fragment jump, NOT by CSS easing.
  //
  // The global `scroll-behavior: smooth` Change Set 2 added is REMOVED and must stay
  // removed: jquery.scrolly animates the intro down-arrow with
  // `.animate({scrollTop}, 1000)`, jQuery writes scrollTop once per frame, and with smooth
  // scrolling in force every one of those writes restarts a smooth scroll — measured 1056ms
  // to first movement, against 48ms with `auto`. Design §5.5 makes the block optional to
  // the requirement, so dropping it is conforming rather than a regression.
  //
  // A ZERO-OCCURRENCE rule on the DECLARATIONS, in the same spirit as Req 1 c13 — but
  // scanned with comments stripped, because the surviving comment names the property on
  // purpose. Check J measures the behaviour; this is the cheap static guard that fails
  // first and points at the right line.
  const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '');
  for (const [name, text] of [['assets/css/main.css', css]]) {
    const code = stripComments(text);
    assert.ok(
      !/scroll-behavior/.test(code),
      `${name} declares scroll-behavior again — it defeats jquery.scrolly's .animate({scrollTop})`,
    );
    // No empty media query left behind: with no CSS smooth scroll there is no unrequested
    // motion to suppress, so the arm is not merely emptied, it is gone.
    assert.ok(
      !/prefers-reduced-motion/.test(code),
      `${name} still carries a prefers-reduced-motion block, which now guards nothing`,
    );
    // The `html` rule keeps its original job.
    assert.match(code, /html \{[^}]*box-sizing:\s*border-box/, `${name} lost html { box-sizing: border-box }`);
    // The measured figures stay recorded where someone would re-add the declaration.
    assert.ok(
      /1056ms/.test(text) && /48ms/.test(text),
      `${name} no longer records why the smooth-scroll block was removed — keep the measured figures`,
    );
  }
});

test('Req 13 c13/c14: the Copyright_Block <ul> is byte-identical on all nine pages', () => {
  const uls = PAGES.map((page) => {
    const m = readContentPage(page).match(/<div id="copyright">[\s\S]*?<\/div>/);
    assert.ok(m, `${page}: no #copyright div`);
    const ul = m[0].match(/<ul>[\s\S]*?<\/ul>/);
    assert.ok(ul, `${page}: no <ul> inside #copyright`);
    return ul[0];
  });
  assert.equal(new Set(uls).size, 1, `the nine <ul> strings diverge: ${[...new Set(uls)].join(' || ')}`);
  const ul = uls[0];
  assert.equal(
    ul,
    '<ul><li><a href="#top">Back to top</a></li><li>Design: <a href="https://html5up.net">HTML5 UP</a></li></ul>',
  );
  // c14 is satisfied vacuously — the wording contains no ampersand. Do not reintroduce one.
  assert.ok(!ul.includes('&'), 'the new wording must contain no ampersand and no entity');
  // c11: the credit is a DESIGN credit and must not mention fonts or icons.
  assert.ok(!/fonts?|icons?/i.test(ul), 'the Design_Credit still references fonts or icons');
});

test('Req 9 c11: the Horizon provenance record carries the sentinel, not a TODO', () => {
  const provenance = fs.readFileSync(repoPath('assets', 'webfonts', 'FONT-PROVENANCE.md'), 'utf8');
  const horizon = provenance.split(/^## /m).find((s) => s.startsWith('Horizon.woff2'));
  assert.ok(horizon, 'no Horizon.woff2 record');
  // Assert the SENTINEL IS PRESENT, not merely that the check is skipped for Horizon —
  // skipping would also pass a record that had quietly lost the field.
  assert.match(horizon, /\|\s*`licence_text_file`\s*\|\s*\*none — accepted, see note\*\s*\|/);
  // A surviving TODO is what distinguishes an unresolved action from a recorded position.
  assert.ok(!/TODO/.test(provenance), 'a TODO marker survives in FONT-PROVENANCE.md');
  // Req 9 c11 forbids inventing a substitute, so a file materialising where the record
  // says none exists is a defect, not an improvement.
  assert.ok(
    !fs.existsSync(repoPath('assets', 'webfonts', 'Horizon-LICENSE.txt')),
    'Horizon-LICENSE.txt exists alongside a "none — accepted" sentinel',
  );
  // Body_Font must still name a file that is actually present.
  const telegraf = provenance.split(/^## /m).find((s) => s.startsWith('PPTelegraf-Regular.otf'));
  const named = telegraf.match(/`licence_text_file`\s*\|\s*`([^`]+)`/)[1];
  assert.ok(fs.existsSync(repoPath('assets', 'webfonts', named)), `${named} is named but absent`);
});

test('Req 7 c5 / Req 9 c3: the credits stay in the README, the procedure moves to the Sync_Document', () => {
  // AMENDED BY CHANGE SET 3, and the amendment is the point of the test rather than a
  // concession to it. Req 7 c5 previously required the regeneration procedure to live in
  // `README.md`; as amended it permits the Sync_Document, Req 17 c7 requires the README to link
  // it in one line, and Req 7 c12/c13 pin the procedure's contents THERE. So the clauses split:
  // the attributions are still asserted against the README, and every procedure clause is now
  // asserted against `docs/stylesheet-sync.md`. Property 18 owns the full version of both
  // halves; these are the single fixed facts.
  const readme = fs.readFileSync(repoPath('README.md'), 'utf8');
  const sync = fs.readFileSync(repoPath('docs', 'stylesheet-sync.md'), 'utf8');

  // Req 17 c3, c5 — the attributions, which the compaction does not reach.
  assert.match(readme, /html5up\.net\/massively/, 'the Massively credit link is gone');
  assert.match(readme, /\]\(https:\/\/html5up\.net\)/, 'the HTML5 UP link is gone — it is the CC BY 3.0 attribution condition');
  assert.match(readme, /Alberto Fontense/);
  assert.match(readme, /Pangram Pangram/);
  // Req 17 c7 / Req 7 c11 — one line of body text reaching the procedure.
  assert.match(readme, /\]\(docs\/stylesheet-sync\.md\)/, 'the README no longer links the Sync_Document');

  // Req 7 c12 — the maintenance clauses, at their new address.
  assert.match(sync, /byte-identical/, 'the Sync_Document does not state the #copyright byte-identity check');
  assert.match(sync, /#4a5158/, 'the Sync_Document does not name the superseded colour as a zero-occurrence token');
  assert.match(sync, /last-declaration-wins/, 'the Sync_Document lost the last-declaration-wins caveat');
  assert.match(sync, /#ffffff/, "the caveat lost its detail that #copyright's FIRST colour is the opaque white");
  assert.match(sync, /fontawesome-all\.min\.css/, 'the Sync_Document lost the @import ordering step');

  // The numbered items, by heading, in order. The count is asserted rather than described in
  // prose because a sentence claiming a different number is exactly the stale claim this test
  // exists to catch — it was "eight steps" while the document reconciled two artifacts, and it
  // is five now that `main.css` is the only one.
  const headings = [...sync.matchAll(/^## (\d+)\./gm)].map((m) => Number(m[1]));
  assert.deepEqual(headings, [1, 2, 3, 4, 5], `the Sync_Document declares items ${headings.join(', ')} — Req 7 c12 wants all five, in order`);

  // The SASS procedure is GONE, and its absence is asserted rather than assumed: this document
  // is where a maintainer would most plausibly re-add "edit the SASS first", and the tree it
  // would point at no longer exists.
  assert.doesNotMatch(sync, /assets\/sass|\.scss|_font\(|_palette\(/, 'the Sync_Document describes a SASS source that no longer exists');

  // Req 17 c10 — the provenance link, which the README depends on. Nothing else points at it.
  assert.match(sync, /assets\/webfonts\/FONT-PROVENANCE\.md/, 'the Sync_Document lost the Provenance_Record link — Req 17 c10 leaves it unreferenced');
});


// ---------------------------------------------------------------------------
// RETARGETED BY THE SASS REMOVAL
//
// These three checks used to read `assets/sass/**`. The tree is gone, but what they pinned are
// properties of the SHIPPED stylesheet rather than of the removed source, so they are
// re-pointed at `assets/css/main.css` instead of dropped — the coverage was never really about
// the SASS.
//
// A FOURTH check is deliberately NOT retargeted and must not come back: the one asserting that
// both weight declarations routed through the `$font` map. It asserted the MECHANISM of a map
// lookup, and with no map there is no mechanism to assert. The weight values it protected are
// covered by the @font-face inventory below, and their computed values by verify.mjs.
// ---------------------------------------------------------------------------

/**
 * Bodies of every rule whose selector list is EXACTLY `selector`.
 *
 * Comments are stripped first, so a commented-out rule cannot satisfy an assertion. The
 * leading `[{}]` boundary is what keeps `p` from also matching `#intro p` or `h1, p`: only
 * whitespace may sit between the previous brace and the selector.
 */
function rulesFor(css, selector) {
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = new RegExp(`(?:^|[{}])\\s*${selector}\\s*\\{([^}]*)\\}`, 'g');
  return [...code.matchAll(re)].map((m) => m[1]);
}

test('Req 4 c10: the bare `p` rule still declares text-align: justify', () => {
  const bodies = rulesFor(readCompiledStylesheet(), 'p');
  assert.ok(bodies.length > 0, 'no bare `p` rule found in main.css at all');

  // last-declaration-wins, the caveat the Sync_Document records: a rule may carry the same
  // property twice, and the one that paints is the LAST. Reading the first match would pass a
  // rule that declares justify and then overrides it.
  const withAlign = bodies.filter((b) => /text-align:/.test(b));
  assert.ok(withAlign.length > 0, 'no bare `p` rule declares text-align');
  for (const body of withAlign) {
    const values = [...body.matchAll(/text-align:\s*([^;]+);/g)].map((m) => m[1].trim());
    assert.equal(
      values.at(-1),
      'justify',
      `a bare \`p\` rule resolves text-align to ${values.at(-1)}, not justify — Req 4 c10`,
    );
  }
});

test('Req 3 c6: every declared #intro h1 font-size is at or below 4rem', () => {
  const bodies = rulesFor(readCompiledStylesheet(), '#intro h1');
  // The ceiling is only meaningful if the rules are actually being found. main.css declares
  // the size twice — the base rule and the narrow-viewport step — and a regex that silently
  // matched neither would "pass" a 10rem heading.
  assert.ok(bodies.length >= 2, `expected at least 2 #intro h1 rules, found ${bodies.length}`);

  const sizes = bodies.flatMap((b) => [...b.matchAll(/font-size:\s*([\d.]+)rem/g)].map((m) => parseFloat(m[1])));
  assert.ok(sizes.length >= 2, `expected at least 2 declared #intro h1 font-sizes, found ${sizes.length}`);
  for (const size of sizes) {
    assert.ok(size <= 4, `an #intro h1 font-size of ${size}rem exceeds the 4rem ceiling — Req 3 c6`);
  }
});

test('the two font stacks lead with their webfont, and only 400/700/800 faces are declared', () => {
  const css = readCompiledStylesheet();

  // Stack HEADS, checked on every multi-family declaration rather than on one known site: a
  // stack that lists the webfont second falls back for every visitor whose system happens to
  // have the earlier name, which is invisible on the machine that made the change.
  const stacks = [...css.matchAll(/font-family:\s*([^;]+);/g)]
    .map((m) => m[1].trim())
    .filter((v) => v.includes(','));
  assert.ok(stacks.length > 0, 'no multi-family font stacks found');

  for (const stack of stacks) {
    const head = stack.split(',')[0].replace(/["']/g, '').trim();
    if (/PP Telegraf/.test(stack)) {
      assert.equal(head, 'PP Telegraf', `body stack does not lead with PP Telegraf: ${stack}`);
    } else if (/Horizon/.test(stack)) {
      assert.equal(head, 'Horizon', `heading stack does not lead with Horizon: ${stack}`);
    }
  }
  // Both stacks must actually be present — an empty filter would vacuously satisfy the loop.
  assert.ok(stacks.some((s) => /PP Telegraf/.test(s)), 'the PP Telegraf body stack is gone');
  assert.ok(stacks.some((s) => /Horizon/.test(s)), 'the Horizon heading stack is gone');

  // Declared weights: every @font-face weight must be one the bundle actually ships, and the
  // full set must be exactly 400/700/800. Font Awesome's own faces are excluded — their
  // font-weight: 900 is the icon font's and has always been out of scope.
  const declared = (css.match(/@font-face\s*\{[^}]*\}/g) ?? [])
    .filter((b) => /'(?:Horizon|PP Telegraf)'/.test(b))
    .map((b) => (b.match(/font-weight:\s*(\d+)/) ?? [])[1]);
  assert.deepEqual(
    [...new Set(declared)].sort(),
    ['400', '700', '800'],
    `declared webfont weights are ${[...new Set(declared)].sort().join('/')}, expected 400/700/800`,
  );
});
