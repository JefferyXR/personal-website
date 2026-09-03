/**
 * Property 18's clause set — the documentation oracles, as `{ id, check }` pairs.
 *
 * Extracted from the test rather than inlined for one reason: fast-check stops at the FIRST
 * failing clause, and the baseline runs of tasks 26.4 and 31 need the whole distribution.
 * "Which clauses fail before the edit" is the evidence that the checker discriminates —
 * every attribution clause is expected to PASS before task 30.1 and to keep passing after
 * it, and a clause that flips from pass to fail means content was LOST rather than moved
 * (Req 17 c6, risk R11). A checker that could only report its first failure could not show
 * that.
 *
 * The clause set is DISCOVERED BY PARSING, never hardcoded: the Markdown link set and the
 * Req 7 c12 item set both change whenever either document is edited, which is exactly the
 * edit this property exists to guard.
 */

import assert from 'node:assert/strict';

import {
  README_MAX_LINES,
  FONTS_CREDIT_MAX_LINES,
  SYNC_DOCUMENT_PATH,
  README_STRUCTURE_PATTERNS,
  REQUIRED_ATTRIBUTIONS,
  SYNC_LINK_PATTERN,
  SYNC_REQUIRED_ITEMS,
  RELOCATED_STATEMENTS,
  PROVENANCE_REFERENCE_PATTERN,
  PRUNE_REQUIRED_ENTRIES,
  pruneStepEntries,
  readReadme,
  readSyncDocument,
  readProvenanceRecord,
  parseMarkdownLinks,
  resolveRepoLink,
  countLines,
  fontsCreditLines,
  fontsCreditFacts,
} from './fixtures.mjs';

/** Clause groups, so a baseline report can say WHICH kind of clause failed. */
export const CLAUSE_GROUPS = {
  structure: 'Req 17 c1 — README structure',
  length: 'Req 17 c2, c4 — the length bounds',
  attribution: 'Req 17 c3, c5, c6 — the four required attributions',
  fonts: 'Req 9 c3 — the four facts per typeface',
  link: 'Req 17 c12 — Markdown links resolve against the repository',
  sync: 'Req 17 c7, c8 — the Sync_Document is linked and exists',
  'sync-item': 'Req 7 c12, c13 — the eight retained procedure items',
  provenance: 'Req 17 c10 — the Provenance_Record reference',
  relocated: 'Req 17 c9 — relocation, not deletion',
  workflow: 'Req 17 c11 — the prune step',
};

export function buildDocumentationClauses() {
  const readme = readReadme();
  const sync = readSyncDocument();
  const provenance = readProvenanceRecord();
  const clauses = [];
  const add = (group, id, check) => clauses.push({ group, id: `${group}:${id}`, check });

  // Req 17 c1 — structure.
  for (const s of README_STRUCTURE_PATTERNS) {
    add('structure', s.id, () => assert.match(readme, s.pattern, `README.md is missing ${s.what} — Req 17 c1`));
  }

  // Req 17 c2 / c4 — the length bounds, checked at BOTH ends of the move. A 26-line README
  // whose Sync_Document is missing a step satisfies Req 17 c2 and fails Req 7 c13, and that
  // is the most plausible way this change set goes wrong.
  add('length', 'readme', () => {
    const n = countLines(readme);
    assert.ok(n <= README_MAX_LINES, `README.md is ${n} lines, ceiling ${README_MAX_LINES} — Req 17 c2`);
  });
  add('length', 'fonts-credit', () => {
    const lines = fontsCreditLines(readme);
    assert.ok(lines, 'README.md has no fonts credit bullet — Req 17 c3, c4');
    assert.ok(
      lines.length <= FONTS_CREDIT_MAX_LINES,
      `the fonts credit is ${lines.length} lines, cap ${FONTS_CREDIT_MAX_LINES} — Req 17 c4 / Req 9 c3`,
    );
  });

  // Req 17 c3, c5, c6 — PRESENCE is checked; ADEQUACY is not. Whether the credits are
  // SUFFICIENT attribution is a licence reading (§5.5, risk R8), not a computable oracle.
  for (const a of REQUIRED_ATTRIBUTIONS) {
    add('attribution', a.id, () => {
      const missing = a.patterns.filter((p) => !p.test(readme));
      assert.equal(
        missing.length,
        0,
        `README.md attribution "${a.what}" is incomplete — missing ${missing.map(String).join(', ')} (Req 17 c3, c6)`,
      );
    });
  }

  // Req 9 c3 — four facts per typeface. The tier is read PER TYPEFACE rather than as the
  // literal string "non-commercial": the owner's README words both tiers as "free for
  // personal use" and Telegraf's non-commercial condition is stated in full in the
  // Sync_Document and the Provenance_Record, so a literal match would report a false failure
  // against the owner's own wording.
  for (const fact of fontsCreditFacts(readme)) {
    add('fonts', fact.typeface, () => {
      assert.ok(fact.present, `${fact.typeface} is not named in README.md — Req 9 c3`);
      assert.ok(fact.designerFound, `${fact.typeface}'s designer/foundry is missing from its credit — Req 9 c3`);
      assert.ok(fact.tierFound, `${fact.typeface}'s licence tier is missing from its credit — Req 9 c3`);
    });
  }

  // Req 17 c12 — every Markdown link resolves, relative ones AGAINST THE REPOSITORY.
  const links = parseMarkdownLinks(readme);
  add('link', 'count', () =>
    assert.ok(links.length >= 5, `README.md declares only ${links.length} Markdown links — Req 17 c3 needs more than that`),
  );
  for (const link of links) {
    add('link', link.target, () => {
      const r = resolveRepoLink(link.target);
      assert.ok(
        r.exists,
        `README.md link [${link.label}](${link.target}) does not resolve to a file in the repository — Req 17 c12. ` +
          'Relative links resolve against the REPOSITORY, not the deployed origin: Req 17 c11 prunes `docs` deliberately.',
      );
    });
  }

  // Req 7 c11 / Req 17 c7 — one line of body text.
  add('sync', 'linked-once', () => {
    assert.match(readme, SYNC_LINK_PATTERN, `README.md does not link ${SYNC_DOCUMENT_PATH} — Req 7 c11, Req 17 c7`);
    const lines = readme.split('\n').filter((l) => SYNC_LINK_PATTERN.test(l));
    assert.equal(lines.length, 1, `the Sync_Document link appears on ${lines.length} lines, not one — Req 7 c11`);
  });
  add('sync', 'exists', () => assert.ok(sync !== null, `${SYNC_DOCUMENT_PATH} does not exist — Req 17 c8`));

  // Req 7 c12 / c13 — the eight retained items, each in its EXECUTION POSITION.
  for (const item of SYNC_REQUIRED_ITEMS) {
    add('sync-item', item.id, () => {
      assert.ok(sync !== null, `${SYNC_DOCUMENT_PATH} does not exist, so item ${item.n} (${item.what}) is missing — Req 7 c13`);
      assert.match(sync, item.anchor, `the Sync_Document is missing item ${item.n}: ${item.what} — Req 7 c12, c13`);
      const missing = item.patterns.filter((p) => !p.test(sync));
      assert.equal(
        missing.length,
        0,
        `the Sync_Document's item ${item.n} (${item.what}) omits ${missing.map(String).join(', ')} — ` +
          'Req 7 c13 makes an omitted step, file name or verification instruction a reportable defect',
      );
    });
  }
  add('sync-item', 'execution-order', () => {
    assert.ok(sync !== null, `${SYNC_DOCUMENT_PATH} does not exist — Req 7 c12 requires the items in execution order`);
    const positions = SYNC_REQUIRED_ITEMS.map((item) => ({ n: item.n, at: sync.search(item.anchor) }));
    for (let i = 1; i < positions.length; i++) {
      assert.ok(
        positions[i].at > positions[i - 1].at,
        `Sync_Document item ${positions[i].n} appears before item ${positions[i - 1].n} — Req 7 c12 requires each item in its execution position`,
      );
    }
  });

  // Req 17 c10 — the reference the owner's README no longer carries inline. It fails
  // SILENTLY if the Sync_Document omits it: nothing else points at the Provenance_Record.
  add('provenance', 'referenced', () => {
    const inReadme = PROVENANCE_REFERENCE_PATTERN.test(readme);
    const inSync = sync !== null && PROVENANCE_REFERENCE_PATTERN.test(sync);
    assert.ok(
      inReadme || inSync,
      'neither README.md nor the Sync_Document references assets/webfonts/FONT-PROVENANCE.md — Req 17 c10',
    );
  });
  add('provenance', 'present-and-complete', () => {
    assert.match(provenance, /Horizon\.woff2/, 'the Provenance_Record is missing its Horizon record — Req 17 c10');
    assert.ok(!/TODO/.test(provenance), 'the Provenance_Record carries a TODO marker — Req 9 c11 replaced it with the accepted position');
  });

  // Req 17 c9 — the relocation clause READS the Provenance_Record rather than writing to it,
  // which is how c9's permitted-destinations list and c13's unchanged list can both name it.
  for (const st of RELOCATED_STATEMENTS) {
    add('relocated', st.id, () => {
      const haystack = st.where === 'provenance' ? provenance : sync;
      const where = st.where === 'provenance' ? 'assets/webfonts/FONT-PROVENANCE.md' : SYNC_DOCUMENT_PATH;
      assert.ok(haystack !== null, `${where} does not exist, so "${st.what}" is present in no repository document — Req 17 c9`);
      const missing = st.patterns.filter((p) => !p.test(haystack));
      assert.equal(
        missing.length,
        0,
        `"${st.what}" is not fully present in ${where} — missing ${missing.map(String).join(', ')} (Req 17 c9)`,
      );
    });
  }

  // Req 17 c11 — kept in this property because §6.3 makes it the reason the link oracle reads
  // the repository: the prune step and the resolution rule are one decision.
  add('workflow', 'prune-step', () => {
    const entries = pruneStepEntries();
    assert.ok(entries, 'static.yml has no `rm -rf` prune step — Req 17 c11');
    for (const required of PRUNE_REQUIRED_ENTRIES) {
      assert.ok(
        entries.includes(required),
        `the static.yml prune step does not name \`${required}\` (found ${entries.join(' ')}) — Req 17 c11`,
      );
    }
  });

  return clauses;
}

/** Evaluate every clause, returning `{ id, group, ok, error }` — used by the baseline report. */
export function evaluateDocumentationClauses() {
  return buildDocumentationClauses().map((c) => {
    try {
      c.check();
      return { id: c.id, group: c.group, ok: true, error: null };
    } catch (e) {
      return { id: c.id, group: c.group, ok: false, error: e.message.split('\n')[0] };
    }
  });
}
