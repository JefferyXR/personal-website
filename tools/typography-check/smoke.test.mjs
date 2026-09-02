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
  repoPath,
  readCompiledStylesheet,
  readSassFile,
  sfntFormat,
  contrastRatio,
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
  assert.match(vars, /fg-link:\s*#4a5158/, 'the additive alt.fg-link palette key is missing');
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

test('the footer email link declares the literal #4a5158 — Req 1 c12', () => {
  const css = readCompiledStylesheet();
  assert.match(css, /#footer a\[href\^="mailto:"\]\s*\{[^}]*color:\s*#4a5158/);
  assert.equal(round2(contrastRatio('#4a5158', '#f5f5f5')), 7.38);
});

test('the intro h1 declared size is at or below 4rem — Req 3 c6', () => {
  const intro = readSassFile('layout/_intro.scss');
  const sizes = [...intro.matchAll(/font-size:\s*([\d.]+)rem/g)].map((m) => parseFloat(m[1]));
  for (const size of sizes) {
    assert.ok(size <= 4, `intro font-size ${size}rem exceeds the 4rem ceiling`);
  }
});
