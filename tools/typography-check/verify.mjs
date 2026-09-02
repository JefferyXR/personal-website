/**
 * Ad-hoc verification sweep across all nine pages and all four viewports, in both font
 * states. This is not one of the 13 correctness properties — it is the "did the change
 * actually land, and did anything break" pass that Checks D/E/F formalise later.
 *
 * Run: node verify.mjs
 */

import {
  getBrowser,
  closeAll,
  repoPath,
  NINE_PAGES,
  VIEWPORTS,
  ROLE_SELECTORS,
  contrastRatio,
  round2,
  WEBFONT_REQUEST_PATTERN,
} from './fixtures.mjs';

const HEADING_STACK = '"Horizon", "Arial Black", Verdana, "Trebuchet MS", sans-serif';
const BODY_STACK = '"PP Telegraf", "Helvetica Neue", "Segoe UI", Roboto, sans-serif';

const problems = [];
const note = (msg) => problems.push(msg);

async function open(browser, file, width, fontState = 'loaded') {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  if (fontState === 'blocked') await context.route(WEBFONT_REQUEST_PATTERN, (r) => r.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`file://${repoPath(file)}`, { waitUntil: 'load' });
  await page.waitForFunction(() => !document.body.classList.contains('is-preload'), { timeout: 5000 }).catch(() => {});
  if (fontState === 'loaded') await page.evaluate(() => document.fonts.ready);
  return { context, page, errors };
}

// ---------------------------------------------------------------------------

async function checkFamiliesAndWeights(browser) {
  console.log('\n=== computed font-family / weight per role (index.html + killerbyte.html, 1440px) ===');
  for (const file of ['index.html', 'killerbyte.html']) {
    const { context, page } = await open(browser, file, 1440);
    for (const [role, selector] of Object.entries(ROLE_SELECTORS)) {
      const got = await page.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)];
        if (!els.length) return null;
        const cs = getComputedStyle(els[0]);
        return {
          n: els.length,
          family: cs.fontFamily,
          weight: cs.fontWeight,
          size: cs.fontSize,
          lh: cs.lineHeight,
          ls: cs.letterSpacing,
        };
      }, selector);
      if (!got) continue;
      const expectHeading = role.startsWith('heading-');
      // Compare on normalised text: Chromium strips the quotes from single-word family
      // names in getComputedStyle output, so "Horizon" comes back as Horizon. Comparing
      // the raw strings reports a false failure on a perfectly correct stack.
      const norm = (s) => s.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      const stackOk = expectHeading
        ? norm(got.family) === norm(HEADING_STACK)
        : norm(got.family) === norm(BODY_STACK);
      console.log(
        `  ${file.padEnd(16)} ${role.padEnd(24)} n=${String(got.n).padStart(2)} ` +
          `w=${got.weight} sz=${got.size.padStart(9)} lh=${got.lh.padStart(9)} ls=${got.ls.padStart(9)} ` +
          `${stackOk ? 'OK ' : 'BAD'} ${stackOk ? '' : got.family}`,
      );
      if (!stackOk) note(`${file} ${role}: unexpected family ${got.family}`);
      // Req 3 c4 / Req 5 c2: only weights with a shipped face.
      if (!['400', '700', '800'].includes(got.weight)) {
        note(`${file} ${role}: weight ${got.weight} has no shipped face`);
      }
      if (expectHeading && got.weight !== '700') {
        note(`${file} ${role}: heading weight ${got.weight} != 700 (synthesis risk)`);
      }
    }
    await context.close();
  }
}

async function checkNoHorizonInChrome(browser) {
  console.log('\n=== Req 5 c1: no small chrome resolves to Horizon; #header .logo still does ===');
  for (const file of NINE_PAGES) {
    const { context, page } = await open(browser, file, 1440);
    const bad = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (!/Horizon/.test(cs.fontFamily)) continue;
        const px = parseFloat(cs.fontSize);
        // closest(), not tagName: <a> and <br> INSIDE a heading legitimately inherit
        // Horizon. Testing the element's own tag reports every such child as a leak.
        const isHeading = !!el.closest('h1, h2, h3, h4, h5, h6');
        const isLogo = !!el.closest('#header .logo');
        if (!isHeading && !isLogo) {
          out.push(`${el.tagName}${el.className ? '.' + String(el.className).split(' ')[0] : ''} @${px}px`);
        }
      }
      return [...new Set(out)];
    });
    const logo = await page.evaluate(() => {
      const el = document.querySelector('#header .logo');
      return el ? getComputedStyle(el).fontFamily : null;
    });
    const logoOk = logo === null || /Horizon/.test(logo);
    console.log(`  ${file.padEnd(17)} stray-Horizon: ${bad.length ? bad.join(', ') : 'none'}  logo-on-Horizon: ${logo === null ? 'n/a' : logoOk}`);
    if (bad.length) note(`${file}: Horizon leaked onto non-heading elements: ${bad.join(', ')}`);
    if (!logoOk) note(`${file}: #header .logo lost the heading font`);
    await context.close();
  }
}

async function checkOverflow(browser) {
  console.log('\n=== Req 3 c11 / 4 c9 / 5 c4,c7 / 6 c7: overflow + containment, both font states ===');
  for (const fontState of ['loaded', 'blocked']) {
    for (const file of NINE_PAGES) {
      for (const width of VIEWPORTS) {
        const { context, page } = await open(browser, file, width, fontState);
        const r = await page.evaluate(() => {
          const doc = document.documentElement;
          const hScroll = doc.scrollWidth > doc.clientWidth + 1;
          const clipped = [];
          const check = (sel, label) => {
            for (const el of document.querySelectorAll(sel)) {
              if (!el.offsetParent && el.offsetHeight === 0) continue; // hidden
              // scrollWidth > clientWidth means content is cut off by the box.
              if (el.scrollWidth > el.clientWidth + 1) {
                clipped.push(`${label}:${(el.textContent || '').trim().slice(0, 28)}`);
              }
            }
          };
          check('h1, h2, h3, h4, h5, h6', 'heading');
          check('#main p', 'para');
          check('.button.skills', 'skill');
          check('#main .actions .button', 'readmore');
          check('#header .logo', 'logo');
          check('#nav ul.links li a', 'navlink');
          check('#copyright', 'copyright');
          return { hScroll, clipped: [...new Set(clipped)] };
        });
        const bad = r.hScroll || r.clipped.length;
        if (bad) {
          const msg = `${file} @${width}px [${fontState}] h-scroll=${r.hScroll} clipped=${r.clipped.join(' | ')}`;
          console.log(`  FAIL ${msg}`);
          note(msg);
        }
        await context.close();
      }
    }
  }
  console.log('  (only failures are printed above)');
}

async function checkSkillsWrap(browser) {
  console.log('\n=== Req 5 c7: an over-wide skills label wraps INSIDE the card ===');
  const { context, page } = await open(browser, 'index.html', 320);
  const r = await page.evaluate(() => {
    const pill = document.querySelector('.button.skills');
    if (!pill) return null;
    const card = pill.closest('article');
    const original = pill.textContent;
    // Longer than any real label — today's maximum is exactly 20 characters, so real
    // content never exercises the wrap path.
    pill.textContent = 'Computational fluid dynamics simulation harness';
    void pill.offsetHeight;
    const pb = pill.getBoundingClientRect();
    const cb = card.getBoundingClientRect();
    const cs = getComputedStyle(pill);
    const out = {
      whiteSpace: cs.whiteSpace,
      height: cs.height,
      minHeight: cs.minHeight,
      lineHeight: cs.lineHeight,
      containerWrap: getComputedStyle(pill.parentElement).flexWrap,
      pillHeight: Math.round(pb.height),
      insideCard: pb.left >= cb.left - 1 && pb.right <= cb.right + 1 && pb.bottom <= cb.bottom + 1,
      notClipped: pill.scrollWidth <= pill.clientWidth + 1 && pill.scrollHeight <= pill.clientHeight + 1,
      hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
    pill.textContent = original;
    return out;
  });
  console.log('  ', JSON.stringify(r, null, 2).replace(/\n/g, '\n   '));
  if (r && !(r.insideCard && r.notClipped && !r.hScroll)) {
    note(`skills pill fails Req 5 c7: ${JSON.stringify(r)}`);
  }
  await context.close();
}

async function checkFooterLink(browser) {
  console.log('\n=== Requirement 1: footer email link, all nine pages ===');
  for (const file of NINE_PAGES) {
    const { context, page } = await open(browser, file, 1440);
    const r = await page.evaluate(() => {
      const a = document.querySelector('#footer a[href^="mailto:"]');
      if (!a) return null;
      const cs = getComputedStyle(a);
      return {
        href: a.getAttribute('href'),
        text: a.textContent.trim(),
        color: cs.color,
        underline: cs.borderBottomColor,
        underlineWidth: cs.borderBottomWidth,
        fontSize: cs.fontSize,
        transition: cs.transitionDuration,
        backdrop: getComputedStyle(document.querySelector('#footer')).backgroundColor,
      };
    });
    if (!r) {
      note(`${file}: no #footer a[href^="mailto:"] matched — the selector misses this page`);
      console.log(`  ${file.padEnd(17)} NO MATCH`);
      await context.close();
      continue;
    }
    const cText = round2(contrastRatio(r.color, '#f5f5f5'));
    const cUnder = round2(contrastRatio(r.underline, '#f5f5f5'));
    const ok = cText >= 7.0 && cUnder >= 3.0 && parseFloat(r.fontSize) >= 0.8 * 14.667 - 0.5;
    console.log(
      `  ${file.padEnd(17)} ${r.color.padEnd(20)} text ${String(cText).padStart(5)}:1  ` +
        `underline ${r.underline.padEnd(20)} ${String(cUnder).padStart(5)}:1  ` +
        `${r.fontSize}  ${r.transition}  ${ok ? 'OK' : 'FAIL'}`,
    );
    if (!ok) note(`${file}: footer email link contrast/size — text ${cText}:1, underline ${cUnder}:1`);
    if (r.href !== 'mailto:jefferyxross@gmail.com') note(`${file}: mailto href changed to ${r.href}`);
    await context.close();
  }

  // Req 1 c6 + c11: focus ring survives simultaneous hover; siblings untouched.
  const { context, page } = await open(browser, 'index.html', 1440);
  const states = await page.evaluate(async () => {
    const a = document.querySelector('#footer a[href^="mailto:"]');
    a.focus();
    const cs = getComputedStyle(a);
    const h3 = document.querySelector('#footer h3');
    const copyright = document.querySelector('#copyright');
    const social = document.querySelector('#footer .icons a');
    return {
      focusOutlineWidth: cs.outlineWidth,
      focusOutlineColor: cs.outlineColor,
      focusOutlineStyle: cs.outlineStyle,
      focusOutlineOffset: cs.outlineOffset,
      linkBoxWidth: Math.round(a.getBoundingClientRect().width),
      footerH3Color: h3 ? getComputedStyle(h3).color : null,
      copyrightColor: copyright ? getComputedStyle(copyright).color : null,
      socialColor: social ? getComputedStyle(social).color : null,
    };
  });
  console.log('\n  focus + untouched-sibling check:', JSON.stringify(states, null, 2).replace(/\n/g, '\n  '));
  if (parseFloat(states.focusOutlineWidth) < 2) note('focus indicator thinner than 2px (Req 1 c6)');
  if (round2(contrastRatio(states.focusOutlineColor, '#f5f5f5')) < 3.0) note('focus ring below 3:1');
  if (states.footerH3Color !== 'rgb(113, 121, 129)') note(`footer h3 colour changed to ${states.footerH3Color}`);
  if (states.socialColor !== 'rgb(113, 121, 129)') note(`footer social colour changed to ${states.socialColor}`);
  // Req 14: this is now the INTENDED value. The Req 1 c11 exemption reaches the
  // Copyright_Block and nothing else, which is why the two lines above are unchanged.
  if (states.copyrightColor !== 'rgba(255, 255, 255, 0.65)') note(`#copyright colour is ${states.copyrightColor}, expected rgba(255, 255, 255, 0.65)`);

  console.log('\n  accepted exceptions, re-measured:');
  console.log(`    C2 #footer h3       ${round2(contrastRatio('#717981', '#f5f5f5'))}:1  (recorded 4.05) — known-and-accepted`);
  console.log(`    C4 hover accent     ${round2(contrastRatio('#18bfef', '#f5f5f5'))}:1  — mandated by Req 1 c4, scoped out, NOT an exception entry`);
  console.log(
    `    C3 #copyright       RETIRED by Change Set 2 (Req 14 c7) — now ${round2(contrastRatio('rgba(255,255,255,0.65)', '#1e252d'))}:1, ` +
      'checked against the ordinary >=4.5:1 threshold like any other tuple',
  );
  await context.close();
}

async function checkCopyrightControl(browser) {
  console.log('\n=== Requirement 13 / 14: Back to top control and copyright bar, all nine pages ===');
  for (const file of NINE_PAGES) {
    const { context, page, errors } = await open(browser, file, 1440);
    const r = await page.evaluate(() => {
      const block = document.querySelector('#copyright');
      const control = document.querySelector('#copyright a[href^="#"]');
      const credit = document.querySelector('#copyright a[href="https://html5up.net"]');
      const items = [...document.querySelectorAll('#copyright ul li')];
      if (!block || !control || !credit) return null;
      control.focus();
      const cc = getComputedStyle(control);
      return {
        blockColor: getComputedStyle(block).color,
        controlHref: control.getAttribute('href'),
        controlText: control.textContent.trim(),
        controlClass: control.className || '(none)',
        controlAriaLabel: control.getAttribute('aria-label'),
        creditText: items.find((li) => li.contains(credit))?.textContent.trim(),
        items: items.length,
        separateElements: control !== credit,
        cursor: cc.cursor,
        outline: `${cc.outlineWidth} ${cc.outlineStyle} ${cc.outlineColor}`,
        outlineOffset: cc.outlineOffset,
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        clipped: block.scrollWidth > block.clientWidth + 1,
        fontFamily: getComputedStyle(block).fontFamily,
        fontSize: getComputedStyle(block).fontSize,
        textTransform: getComputedStyle(block).textTransform,
        textAlign: getComputedStyle(block).textAlign,
        lineHeight: getComputedStyle(block).lineHeight,
      };
    });

    if (!r) {
      note(`${file}: Copyright_Block, Back_To_Top_Control or Design_Credit missing`);
      console.log(`  ${file.padEnd(17)} MISSING`);
      await context.close();
      continue;
    }

    const ratio = round2(contrastRatio(r.blockColor, '#1e252d'));
    const ok =
      ratio >= 4.5 &&
      r.controlHref === '#top' &&
      r.controlText === 'Back to top' &&
      r.items === 2 &&
      r.separateElements &&
      r.cursor === 'pointer' &&
      parseFloat(r.outline) >= 2 &&
      !r.clipped &&
      !/fonts?|icons?/i.test(r.creditText ?? '');

    console.log(
      `  ${file.padEnd(17)} ${r.blockColor.padEnd(26)} ${String(ratio).padStart(5)}:1  ` +
        `href=${r.controlHref} items=${r.items} cursor=${r.cursor} outline="${r.outline}" ` +
        `credit="${r.creditText}" ${ok ? 'OK' : 'FAIL'}`,
    );

    if (ratio < 4.5) note(`${file}: Copyright_Block contrast ${ratio}:1 below 4.5:1 (Req 14 c1)`);
    if (r.controlHref !== '#top') note(`${file}: control href is ${r.controlHref}`);
    if (r.controlClass !== '(none)') note(`${file}: control carries class "${r.controlClass}" — scrolly makes it script-dependent`);
    if (r.controlAriaLabel) note(`${file}: control carries a redundant aria-label`);
    if (r.items !== 2) note(`${file}: ${r.items} <li> in the Copyright_Block, expected 2 (Req 13 c12)`);
    if (!r.separateElements) note(`${file}: control and credit are the same element`);
    if (r.cursor !== 'pointer') note(`${file}: control cursor is ${r.cursor} (Req 13 c17)`);
    if (parseFloat(r.outline) < 2) note(`${file}: focus indicator ${r.outline} thinner than 2px (Req 13 c9)`);
    if (/fonts?|icons?/i.test(r.creditText ?? '')) note(`${file}: the credit still references fonts or icons (Req 13 c11)`);
    if (r.clipped) note(`${file}: the Copyright_Block clips its content (Req 13 c16)`);
    // Req 13 c15: typography preserved.
    if (!/PP Telegraf/.test(r.fontFamily)) note(`${file}: Copyright_Block family is ${r.fontFamily}`);
    if (r.textTransform !== 'uppercase') note(`${file}: Copyright_Block text-transform is ${r.textTransform}`);
    if (r.textAlign !== 'center') note(`${file}: Copyright_Block text-align is ${r.textAlign}`);
    if (errors.length) note(`${file}: console errors: ${errors.join(' | ')}`);
    await context.close();
  }
}

async function checkScrollBehaviourInterference(browser) {
  // Check F extension: the design names this as the documented trigger for dropping the
  // smooth-scroll block, so it is measured rather than assumed.
  console.log('\n=== Check F extension: scroll-behavior vs the scrolly / scrollex anchors ===');
  const { context, page, errors } = await open(browser, 'index.html', 1440);
  const r = await page.evaluate(async () => {
    const arrow = document.querySelector('a.scrolly[href="#main"]');
    const main = document.querySelector('#main');
    if (!arrow || !main) return { arrow: !!arrow, main: !!main };
    window.scrollTo({ top: 0, behavior: 'instant' });
    arrow.click();
    await new Promise((res) => setTimeout(res, 1600));
    const y = window.scrollY;
    const target = main.getBoundingClientRect().top + y;
    return {
      arrow: true,
      main: true,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      landedNear: Math.abs(y - target) < 80,
      y: Math.round(y),
      target: Math.round(target),
      introVisible: !!document.querySelector('#intro'),
    };
  });
  console.log('  ', JSON.stringify(r), 'errors:', errors.length);
  if (r.arrow && r.main && !r.landedNear) {
    note(`scroll-behavior: smooth disturbed the scrolly anchor (landed ${r.y}, target ${r.target}) — the design's documented trigger for dropping the block`);
  }
  if (errors.length) note(`Check F: console errors with scroll-behavior: smooth — ${errors.join(' | ')}`);
  await context.close();
}

async function checkFontAwesomeAndScripts(browser) {
  console.log('\n=== Checks E & F: Font Awesome icons, canvas, card interactions, console ===');
  for (const file of NINE_PAGES) {
    const { context, page, errors } = await open(browser, file, 1440);
    const r = await page.evaluate(async () => {
      await document.fonts.ready;
      const faLoaded = [...document.fonts]
        .filter((f) => /Font Awesome/.test(f.family))
        .map((f) => `${f.family}/${f.weight}:${f.status}`);
      const iconEls = [...document.querySelectorAll('.icon, [class*="fa-"]')];
      // A rendered icon has a non-empty ::before box.
      let rendered = 0;
      for (const el of iconEls) {
        const w = parseFloat(getComputedStyle(el, '::before').width);
        if (w > 0) rendered += 1;
      }
      return {
        faLoaded,
        icons: iconEls.length,
        iconsRendered: rendered,
        canvas: !!document.querySelector('canvas'),
        cards: document.querySelectorAll('#main > .posts > article').length,
      };
    });
    const bold = await page.evaluate(() => ({
      hasStrong: document.querySelectorAll('strong, b').length,
      boldFaceUsable: document.fonts.check('800 1rem "PP Telegraf"'),
      strongWeight: document.querySelector('strong, b')
        ? getComputedStyle(document.querySelector('strong, b')).fontWeight
        : null,
    }));
    console.log(
      `  ${file.padEnd(17)} FA=[${r.faLoaded.join(' ')}] icons ${r.iconsRendered}/${r.icons} ` +
        `canvas=${r.canvas} cards=${r.cards} strong=${bold.hasStrong}@${bold.strongWeight} ` +
        `boldFaceUsable=${bold.boldFaceUsable} errors=${errors.length}`,
    );
    if (!r.faLoaded.some((s) => /loaded/.test(s))) note(`${file}: no Font Awesome face loaded`);
    if (r.icons && r.iconsRendered === 0) note(`${file}: ${r.icons} icon elements, none rendered`);
    if (errors.length) note(`${file}: console errors: ${errors.join(' | ')}`);
    if (bold.hasStrong && !bold.boldFaceUsable) {
      note(`${file}: has <strong> but the 800 face is not usable`);
    }
    await context.close();
  }
}

async function checkCanvasAnimates(browser) {
  console.log('\n=== Check F: water particle canvas actually animates ===');
  const { context, page, errors } = await open(browser, 'index.html', 1440);
  const r = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { canvas: false };
    const snap = () => canvas.toDataURL().length + ':' + canvas.toDataURL().slice(-64);
    const a = snap();
    await new Promise((res) => setTimeout(res, 600));
    const b = snap();
    return { canvas: true, changed: a !== b, w: canvas.width, h: canvas.height };
  });
  console.log('  ', JSON.stringify(r), 'errors:', errors.length);
  if (r.canvas && !r.changed) note('the water particle canvas did not change over 600ms');
  await context.close();
}

async function main() {
  const browser = await getBrowser();
  await checkFamiliesAndWeights(browser);
  await checkNoHorizonInChrome(browser);
  await checkFooterLink(browser);
  await checkCopyrightControl(browser);
  await checkSkillsWrap(browser);
  await checkFontAwesomeAndScripts(browser);
  await checkCanvasAnimates(browser);
  await checkScrollBehaviourInterference(browser);
  await checkOverflow(browser);
  await closeAll();

  console.log('\n' + '='.repeat(78));
  if (problems.length === 0) {
    console.log('ALL CLEAR — no problems found.');
  } else {
    console.log(`${problems.length} PROBLEM(S):`);
    for (const p of problems) console.log('  - ' + p);
  }
  console.log('='.repeat(78));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
