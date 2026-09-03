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
  readSassFile,
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

test('Req 7 c9: neither artifact mentions Merriweather or Source Sans Pro', () => {
  const artifacts = {
    'assets/css/main.css': readCompiledStylesheet(),
    'assets/sass/libs/_vars.scss': readSassFile('libs/_vars.scss'),
    'assets/sass/base/_typography.scss': readSassFile('base/_typography.scss'),
    'assets/sass/layout/_main.scss': readSassFile('layout/_main.scss'),
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

test('$font map heads and the untouched fixed stack', () => {
  const vars = readSassFile('libs/_vars.scss');
  assert.match(vars, /family:\s*\('PP Telegraf',/, "family must begin with 'PP Telegraf'");
  assert.match(vars, /family-heading:\s*\('Horizon',/, "family-heading must begin with 'Horizon'");
  assert.match(vars, /family-fixed:\s*\('Courier New', monospace\)/, 'family-fixed must be unchanged');
  assert.match(vars, /weight-heading:\s*700/, 'weight-heading must equal Horizon usWeightClass 700');
  assert.match(vars, /weight-bold:\s*800/, 'weight-bold must equal the shipped Ultrabold weight');
  assert.match(vars, /letter-spacing-heading:\s*0\.05em/, 'the new letter-spacing key is missing');
  // Change Set 2 §5.1: was #4a5158.
  assert.match(
    vars,
    new RegExp(`fg-link:\\s*${FG_LINK}`),
    `the additive alt.fg-link palette key must be ${FG_LINK}`,
  );
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

test('p { text-align: justify } is retained — Req 4 c10', () => {
  assert.match(readSassFile('base/_typography.scss'), /p\s*\{[^}]*text-align:\s*justify/);
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

test('Req 1 c13: the superseded link colour occurs ZERO times in either artifact', () => {
  // A zero-occurrence rule, not a replacement rule — explanatory comments naming the old
  // value count as occurrences, because the source would then document a value it no
  // longer sets. Raw file text is scanned deliberately, comments included.
  const artifacts = {
    'assets/css/main.css': readCompiledStylesheet(),
    'assets/sass/libs/_vars.scss': readSassFile('libs/_vars.scss'),
    'assets/sass/layout/_footer.scss': readSassFile('layout/_footer.scss'),
    'assets/sass/layout/_main.scss': readSassFile('layout/_main.scss'),
    'assets/sass/base/_page.scss': readSassFile('base/_page.scss'),
    'assets/sass/layout/_nav.scss': readSassFile('layout/_nav.scss'),
    'assets/sass/components/_button.scss': readSassFile('components/_button.scss'),
  };
  for (const [name, text] of Object.entries(artifacts)) {
    for (const forbidden of FORBIDDEN_COLOUR_LITERALS) {
      assert.ok(!text.includes(forbidden), `${name} still contains ${forbidden}`);
    }
  }
});

test('Req 10: the Card_Header_Band centres, and the description paragraphs do not', () => {
  const sass = readSassFile('layout/_main.scss');
  const css = readCompiledStylesheet();

  // The band declares center in both artifacts.
  assert.match(
    css,
    /body\.home #main > \.posts > article header \{[^}]*text-align:\s*center/,
    'the compiled Card_Header_Band rule does not declare text-align: center',
  );

  // ...and the two card description paragraph rules still declare left (Req 10 c7).
  // Counted on declarations with comments stripped, so a comment mentioning alignment
  // cannot inflate or deflate either count.
  const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '');
  const sassLefts = (strip(sass).match(/text-align:\s*left/g) ?? []).length;
  const sassCenters = (strip(sass).match(/text-align:\s*center/g) ?? []).length;
  assert.equal(sassLefts, 2, `expected exactly 2 surviving left declarations, found ${sassLefts}`);
  assert.ok(sassCenters >= 1, 'the band lost its centring');

  // Both surviving left declarations belong to a 0.85rem card description rule.
  for (const m of strip(sass).matchAll(/text-align:\s*left/g)) {
    const before = strip(sass).slice(0, m.index);
    const ruleStart = before.lastIndexOf('{');
    assert.match(
      strip(sass).slice(ruleStart, m.index),
      /font-size:\s*0\.85rem/,
      'a surviving text-align: left is not on a card description paragraph rule',
    );
  }
});

test('Req 11: both weight declarations route through the $font map', () => {
  assert.match(
    readSassFile('layout/_nav.scss'),
    /&\.links\s*\{[\s\S]{0,600}?font-weight:\s*_font\(weight-bold\)/,
    '_nav.scss ul.links does not declare _font(weight-bold)',
  );
  assert.match(
    readSassFile('components/_button.scss'),
    /font-weight:\s*_font\(weight-bold\)/,
    '_button.scss base .button does not declare _font(weight-bold)',
  );

  // Req 11 c2 and c3: exactly TWO declarations, and no per-rule literal weight on the
  // pill. A third declaration would defeat the single-rule requirement.
  const pillRule = readSassFile('layout/_main.scss').match(
    /body\.home #main \.button\.skills \{[^}]*\}/,
  );
  assert.ok(pillRule, 'the homepage pill rule was not found');
  assert.ok(
    !/font-weight/.test(pillRule[0]),
    'the pill rule declares its own font-weight — Req 11 c2/c3 forbid a third declaration',
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

test('Req 12: the two pill geometries declare the §5.4 values', () => {
  const sass = readSassFile('layout/_main.scss');
  const css = readCompiledStylesheet();

  for (const [name, text] of [['SASS', sass], ['compiled', css]]) {
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

  // Wider-context geometry: line-height becomes a RATIO; height and padding are untouched.
  const wider = css.match(
    /body\.home #main \.button\.skills,\s*body\.home #main \.actions \.button \{[\s\S]*?\}/,
  );
  assert.ok(wider, 'compiled wider-context rule not found');
  const widerBody = wider[0].replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(widerBody, /line-height:\s*1\.4\s*;/, 'wider-context line-height must be the ratio 1.4');
  assert.ok(
    !/line-height:\s*2\.25rem/.test(widerBody),
    'wider-context line-height is still a LENGTH equal to height',
  );
  assert.match(widerBody, /height:\s*2\.25rem/, 'wider-context height must be unchanged');
  assert.match(widerBody, /padding:\s*0 1rem/, 'wider-context padding must be unchanged');
});

test('Req 13/14: the Copyright_Block declarations', () => {
  const sass = readSassFile('layout/_footer.scss');
  const css = readCompiledStylesheet();

  // Req 14: the transparentize amount, and its resolved mirror.
  assert.match(
    sass,
    /color:\s*transparentize\(_palette\(invert, fg\), 0\.35\)/,
    'the #copyright transparentize amount is not 0.35 (target alpha 0.65)',
  );
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
  const pageScss = readSassFile('base/_page.scss');
  for (const [name, text] of [['assets/css/main.css', css], ['assets/sass/base/_page.scss', pageScss]]) {
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

  // Req 7 c12 — the procedure clauses, at their new address.
  assert.match(sync, /byte-identical/, 'the Sync_Document does not state the Copyright_Block byte-identity check');
  assert.match(sync, /#4a5158/, 'the Sync_Document does not name the superseded colour as a zero-occurrence token');
  assert.match(sync, /last-declaration-wins/, 'the Sync_Document lost the last-declaration-wins caveat');
  assert.match(sync, /#ffffff/, "the caveat lost its detail that #copyright's FIRST colour is the mixin's opaque white");
  assert.match(sync, /fontawesome-all\.min\.css/, 'the Sync_Document lost the @import ordering step');
  // The eight steps, by heading, in order — the count is not asserted as prose ("seven steps")
  // because the procedure now carries eight and a sentence saying otherwise is the kind of
  // stale claim this test exists to catch.
  const headings = [...sync.matchAll(/^## (\d+)\./gm)].map((m) => Number(m[1]));
  assert.deepEqual(headings, [1, 2, 3, 4, 5, 6, 7, 8], `the Sync_Document declares steps ${headings.join(', ')} — Req 7 c12 wants all eight, in order`);
});

test('the intro h1 declared size is at or below 4rem — Req 3 c6', () => {
  const intro = readSassFile('layout/_intro.scss');
  const sizes = [...intro.matchAll(/font-size:\s*([\d.]+)rem/g)].map((m) => parseFloat(m[1]));
  for (const size of sizes) {
    assert.ok(size <= 4, `intro font-size ${size}rem exceeds the 4rem ceiling`);
  }
});
