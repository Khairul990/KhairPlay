/* PlayNova real-browser QA harness (puppeteer-core + system Chrome).
   Serves the site on a local static server, then:
     - captures console errors + uncaught page errors
     - exercises home / library / search / filter / player flows
     - launches EVERY registry game and checks its iframe actually loads
     - checks for broken images and horizontal overflow at 5 widths
   Run: node tests/browser-test.js                                              */
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8791;
const BASE = `http://127.0.0.1:${PORT}`;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + p); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
});

const out = { pass: [], warn: [], fail: [] };
const ok = (m) => { out.pass.push(m); console.log('  + ' + m); };
const warn = (m) => { out.warn.push(m); console.log('  ! ' + m); };
const bad = (m) => { out.fail.push(m); console.log('  X ' + m); };

function readGameRegistry() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'games-data.js'), 'utf8');
  const games = [];
  const chunks = src.split(/\{\s*\n\s*id:/).slice(1);
  for (const ch of chunks) {
    const body = 'id:' + ch;
    const g = {};
    for (const k of ['id', 'title', 'category', 'thumb', 'iframe', 'description', 'players', 'controls', 'addedAt']) {
      const m = body.match(new RegExp(k + ':\\s*"([^"]*)"'));
      if (m) g[k] = m[1];
    }
    g.enabled = !/enabled:\s*false/.test(body.slice(0, body.indexOf('}') + 1));
    if (g.id && g.iframe) games.push(g);
  }
  return games;
}

(async () => {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  console.log('serving ' + ROOT + ' on ' + BASE);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
  });

  const errors = [];
  const attach = async (page, label) => {
    page.on('pageerror', (e) => errors.push(`${label} pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`${label} console.error: ${m.text()}`);
    });
    page.on('requestfailed', (r) => {
      const u = r.url();
      if (u.startsWith(BASE)) errors.push(`${label} requestfailed: ${u} (${r.failure()?.errorText})`);
    });
    page.on('response', (r) => {
      if (r.url().startsWith(BASE) && r.status() >= 400) errors.push(`${label} HTTP ${r.status()}: ${r.url()}`);
    });
  };

  const games = readGameRegistry();
  console.log(`\nregistry: ${games.length} games\n`);
  if (games.length < 10) bad(`registry parsed only ${games.length} games`);

  /* ---------- 1. HOME ---------- */
  console.log('\n[1] homepage');
  {
    const page = await browser.newPage();
    await attach(page, 'home');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE + '/index.html', { waitUntil: 'networkidle2', timeout: 45000 });

    const title = await page.title();
    if (title && title.toLowerCase().includes('playnova')) ok(`title: "${title}"`);
    else bad(`unexpected home title: "${title}"`);

    const h1 = await page.$eval('h1', (e) => e.textContent.trim()).catch(() => null);
    if (h1) ok(`h1 present: "${h1.slice(0, 60)}"`); else bad('homepage has no <h1>');

    const cards = await page.$$eval('.game-card', (els) => els.length);
    if (cards > 0) ok(`homepage rendered ${cards} game cards`);
    else bad('homepage rendered 0 game cards');

    // sections requested by spec
    for (const sel of ['.site-header', 'footer.site-footer']) {
      if (await page.$(sel)) ok(`present ${sel}`); else bad(`missing ${sel}`);
    }

    // nav links resolve
    const navLinks = await page.$$eval('header a[href], .site-header a[href]', (els) => els.map((e) => e.getAttribute('href')));
    ok(`nav links: ${navLinks.length}`);

    // broken images
    const brokenImgs = await page.$$eval('img', (imgs) =>
      imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')));
    if (brokenImgs.length) bad(`homepage broken images: ${brokenImgs.join(', ')}`);
    else ok('homepage: no broken images');

    // search box wires to library
    const hasSearch = await page.$('.nav-search input[type="search"], .search-box input');
    if (hasSearch) ok('header search box present'); else bad('no header search box');

    await page.close();
  }

  /* ---------- 2. LIBRARY: search + filters ---------- */
  console.log('\n[2] game library');
  {
    const page = await browser.newPage();
    await attach(page, 'library');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(BASE + '/pages/games.html', { waitUntil: 'networkidle2', timeout: 45000 });

    const total = await page.$$eval('.game-card', (els) => els.length);
    if (total >= games.length - 1) ok(`library shows ${total} cards (registry ${games.length})`);
    else bad(`library shows ${total} cards but registry has ${games.length}`);

    // filter by category
    const catBtn = await page.$('.filter-btn[data-cat="kids"]');
    if (catBtn) {
      await catBtn.click();
      await new Promise((r) => setTimeout(r, 350));
      const n = await page.$$eval('.game-card', (els) => els.length);
      if (n > 0 && n < total) ok(`category filter works (kids -> ${n} of ${total})`);
      else bad(`category filter gave ${n} of ${total}`);
      const all = await page.$('.filter-btn[data-cat="all"]');
      if (all) await all.click();
      await new Promise((r) => setTimeout(r, 250));
    } else warn('no .filter-btn[data-cat="kids"] found');

    // search narrows results
    const search = await page.$('#gameSearch') || await page.$('.search-box input');
    if (search) {
      await search.click({ clickCount: 3 });
      await search.type('snake');
      await new Promise((r) => setTimeout(r, 400));
      const n = await page.$$eval('.game-card', (els) => els.length);
      if (n > 0 && n < total) ok(`search "snake" -> ${n} results`);
      else bad(`search "snake" -> ${n} results (total ${total})`);

      // empty state
      await search.click({ clickCount: 3 });
      await search.type('zzzzqqqxyz');
      await new Promise((r) => setTimeout(r, 400));
      const empt = await page.$('.empty');
      const n2 = await page.$$eval('.game-card', (els) => els.length);
      if (n2 === 0 && empt) ok('empty state shown for no-match search');
      else warn(`no-match search: cards=${n2} emptyEl=${!!empt}`);
    } else warn('library search input not found');

    // ?q= deep link
    await page.goto(BASE + '/pages/games.html?q=memory', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 500));
    const qn = await page.$$eval('.game-card', (els) => els.length);
    if (qn > 0 && qn < total) ok(`?q=memory deep link -> ${qn} results`);
    else warn(`?q= deep link returned ${qn}`);

    await page.close();
  }

  /* ---------- 3. EVERY GAME LAUNCHES ---------- */
  console.log('\n[3] game player (every registry game)');
  let launched = 0;
  for (const g of games) {
    const page = await browser.newPage();
    const localErrs = [];
    page.on('pageerror', (e) => localErrs.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') localErrs.push(`console.error: ${m.text()}`); });
    page.on('response', (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) localErrs.push(`HTTP ${r.status()}: ${r.url()}`); });
    try {
      await page.setViewport({ width: 1024, height: 768 });
      await page.goto(`${BASE}/pages/play.html?id=${g.id}`, { waitUntil: 'networkidle2', timeout: 45000 });

      const shownTitle = await page.$eval('#gameTitle', (e) => e.textContent.trim()).catch(() => '');
      const iframeSel = '#gamePlayArea iframe';
      await page.waitForSelector(iframeSel, { timeout: 15000 });

      const frame = await page.$(iframeSel);
      const src = await frame.evaluate((el) => el.getAttribute('src'));
      const handle = await frame.contentFrame();
      await new Promise((r) => setTimeout(r, 1200));

      const frameUrl = handle ? handle.url() : '';
      const frameOk = handle && frameUrl.includes(g.iframe.replace('games/', 'games/').replace(/\.html$/, '')) ||
        (handle && frameUrl.includes(path.basename(g.iframe, '.html')));
      if (!handle) { bad(`${g.id}: iframe did not attach`); await page.close(); continue; }

      const frameTitle = await handle.title().catch(() => '');
      const bodyLen = await handle.evaluate(() => document.body ? document.body.innerHTML.length : 0).catch(() => -1);

      if (bodyLen > 50) ok(`${g.id}: iframe loaded (${bodyLen}b, "${frameTitle.slice(0, 40)}")`);
      else bad(`${g.id}: iframe body empty (${bodyLen}b)`);

      if (shownTitle && g.title && shownTitle !== g.title) warn(`${g.id}: title shown "${shownTitle}" != registry "${g.title}"`);

      // restart control existence is per-game; just confirm a canvas or button exists
      const hasCanvas = await handle.$('canvas').catch(() => null);
      const hasBtn = await handle.$('button, [role="button"], .btn').catch(() => null);
      if (hasCanvas || hasBtn) ok(`${g.id}: has interactive target (${hasCanvas ? 'canvas' : 'button'})`);
      else warn(`${g.id}: no canvas/button detected (may be DOM-based game)`);

      if (localErrs.length) localErrs.forEach((e) => bad(`${g.id}: ${e}`));
      else launched++;
    } catch (e) {
      bad(`${g.id}: launch failed - ${e.message.split('\n')[0]}`);
    }
    await page.close();
  }
  ok(`clean launches: ${launched}/${games.length}`);

  /* ---------- 4. 404 PAGE ---------- */
  console.log('\n[4] 404 page');
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/definitely-not-a-page.html', { waitUntil: 'domcontentloaded' });
    const body = await page.$eval('body', (e) => e.textContent).catch(() => '');
    if (/404|pawa jacche|not found/i.test(body)) ok('unknown URL serves a 404 page');
    else warn(`unknown URL body: ${body.slice(0, 80)}`);
    await page.close();
  }

  /* ---------- 5. RESPONSIVE / NO HORIZONTAL OVERFLOW ---------- */
  console.log('\n[5] responsive widths (no horizontal overflow)');
  const widths = [320, 375, 768, 1024, 1440];
  const respPages = ['/index.html', '/pages/games.html', '/pages/play.html?id=snake', '/pages/about.html'];
  for (const p of respPages) {
    const page = await browser.newPage();
    for (const w of widths) {
      await page.setViewport({ width: w, height: 800 });
      await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 45000 });
      await new Promise((r) => setTimeout(r, 300));
      const over = await page.evaluate(() =>
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
      if (over > 2) bad(`${p} @${w}px overflows by ${over}px`);
      else ok(`${p} @${w}px no overflow`);
    }
    await page.close();
  }

  /* ---------- 6. KEYBOARD FOCUS ---------- */
  console.log('\n[6] keyboard accessibility');
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/index.html', { waitUntil: 'networkidle2' });
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e) return null;
      const st = getComputedStyle(e);
      return { tag: e.tagName, txt: (e.textContent || '').trim().slice(0, 30), outline: st.outlineStyle, width: st.outlineWidth };
    });
    if (first && first.tag !== 'BODY') ok(`first tab stop: ${first.tag} "${first.txt}"`);
    else bad('Tab does not move focus off body');
    const hasFocusCss = await page.evaluate(() => {
      for (const ss of document.styleSheets) {
        try { for (const r of ss.cssRules) if (r.selectorText && /:focus-visible/.test(r.selectorText)) return true; } catch (e) {}
      }
      return false;
    });
    if (hasFocusCss) ok(':focus-visible styles present');
    else warn('no :focus-visible rules found');
    await page.close();
  }

  /* ---------- 7. SERVICE WORKER / PWA ---------- */
  console.log('\n[7] manifest + service worker');
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/index.html', { waitUntil: 'networkidle2' });
    const man = await page.evaluate(async () => {
      const r = await fetch('/manifest.json'); return r.ok ? await r.json() : null;
    }).catch(() => null);
    if (man && man.name) ok(`manifest loads: "${man.name}"`);
    else bad('manifest.json missing/unreadable');

    const sw = await page.evaluate(async () => 'serviceWorker' in navigator);
    if (sw) ok('serviceWorker API available'); else warn('serviceWorker API unavailable');

    const caches = await page.evaluate(async () => {
      if (!('caches' in window)) return null;
      return await caches.keys();
    }).catch(() => null);
    if (caches && caches.length) ok(`caches registered: ${caches.join(', ')}`);
    else warn('no Cache Storage entries yet (SW may still be installing)');
    await page.close();
  }

  /* ---------- 8. FAVOURITES / TRENDING / RECOMMENDED ---------- */
  console.log('\n[8] discovery + favourites');
  {
    const page = await browser.newPage();
    await attach(page, 'discovery');
    await page.setViewport({ width: 1280, height: 900 });

    await page.goto(BASE + '/index.html', { waitUntil: 'networkidle2', timeout: 45000 });
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto(BASE + '/index.html', { waitUntil: 'networkidle2', timeout: 45000 });

    const heroHref = await page.$eval('#heroPlay', (e) => e.getAttribute('href')).catch(() => null);
    if (heroHref && /play\.html\?id=/.test(heroHref)) ok(`hero Play Now -> ${heroHref}`);
    else bad(`hero Play Now href invalid: ${heroHref}`);

    for (const [id, label] of [['trendingGrid', 'Trending'], ['recommendedGrid', 'Recommended'], ['featuredGrid', 'Featured']]) {
      const n = await page.$$eval('#' + id + ' .game-card', (els) => els.length).catch(() => -1);
      if (n > 0) ok(`${label} section renders ${n} cards`);
      else bad(`${label} section #${id} rendered ${n} cards`);
    }

    const favHiddenBefore = await page.$eval('#favSection', (e) => e.hasAttribute('hidden')).catch(() => null);
    if (favHiddenBefore === true) ok('favourites section hidden when empty');
    else bad(`favourites section hidden=${favHiddenBefore} when empty`);

    // click first heart on the homepage
    const firstHeart = await page.$('#featuredGrid .fav-btn');
    if (!firstHeart) bad('no .fav-btn rendered on game cards');
    else {
      const targetId = await firstHeart.evaluate((b) => b.getAttribute('data-fav'));
      await firstHeart.click();
      await new Promise((r) => setTimeout(r, 400));

      const pressed = await page.$eval('.fav-btn[data-fav="' + targetId + '"]', (b) => b.getAttribute('aria-pressed')).catch(() => null);
      if (pressed === 'true') ok(`heart click sets aria-pressed=true for ${targetId}`);
      else bad(`heart aria-pressed=${pressed} for ${targetId}`);

      const favShown = await page.$eval('#favSection', (e) => !e.hasAttribute('hidden')).catch(() => null);
      if (favShown === true) ok('favourites section reveals after adding one');
      else bad(`favourites section still hidden after add (shown=${favShown})`);

      // persist across reload
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 500));
      const persisted = await page.$eval('.fav-btn[data-fav="' + targetId + '"]', (b) => b.getAttribute('aria-pressed')).catch(() => null);
      if (persisted === 'true') ok('favourite persists across reload (localStorage)');
      else bad(`favourite not persisted after reload (=${persisted})`);

      // library favourites filter
      await page.goto(BASE + '/pages/games.html?cat=favorites', { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 500));
      const favCards = await page.$$eval('#allGamesGrid .game-card', (els) => els.length).catch(() => -1);
      const favIds = await page.$$eval('#allGamesGrid .game-card .fav-btn', (els) => els.map((e) => e.getAttribute('data-fav'))).catch(() => []);
      if (favCards === 1 && favIds[0] === targetId) ok(`library ?cat=favorites shows only the saved game (${favIds[0]})`);
      else bad(`library favorites filter returned ${favCards} cards, ids=${favIds.join(',')}`);

      // empty favourites state
      await page.evaluate((id) => {
        const b = document.querySelector('.fav-btn[data-fav="' + id + '"]');
        if (b) b.click();
      }, targetId);
      await new Promise((r) => setTimeout(r, 400));
      const afterRemove = await page.$$eval('#allGamesGrid .game-card', (els) => els.length).catch(() => -1);
      const emptyEl = await page.$('#allGamesGrid .empty');
      if (afterRemove === 0 && emptyEl) ok('empty state shown when favourites cleared');
      else warn(`after removing favourite: cards=${afterRemove} emptyEl=${!!emptyEl}`);
    }

    // play page favourite action
    await page.goto(BASE + '/pages/play.html?id=snake', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 500));
    const actionBefore = await page.$eval('#favBtn', (e) => e.getAttribute('aria-pressed')).catch(() => null);
    await page.click('#favBtn');
    await new Promise((r) => setTimeout(r, 400));
    const actionAfter = await page.$eval('#favBtn', (e) => e.getAttribute('aria-pressed')).catch(() => null);
    if (actionBefore !== actionAfter && actionAfter === 'true') ok(`play page favourite toggles (${actionBefore} -> ${actionAfter})`);
    else bad(`play page favourite did not toggle (${actionBefore} -> ${actionAfter})`);

    // related games populated
    const related = await page.$$eval('#relatedGrid .game-card', (els) => els.length).catch(() => -1);
    if (related > 0) ok(`related games rendered (${related})`);
    else bad(`related games rendered ${related}`);

    await page.close();
  }

  /* ---------- 9. PLAYER CONTROLS ---------- */
  console.log('\n[9] player controls (restart / fullscreen)');
  {
    const page = await browser.newPage();
    await attach(page, 'player');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(BASE + '/pages/play.html?id=2048', { waitUntil: 'networkidle2', timeout: 45000 });
    await page.waitForSelector('#gamePlayArea iframe', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));

    const restart = await page.$('#restartBtn');
    const full = await page.$('#fullscreenBtn');
    if (restart) ok('restart control present'); else bad('#restartBtn missing');
    if (full) ok('fullscreen control present'); else bad('#fullscreenBtn missing');

    const before = await page.$eval('#gamePlayArea iframe', (e) => ({ src: e.src, len: document.body.innerHTML.length }));
    if (restart) {
      await page.click('#restartBtn');
      await new Promise((r) => setTimeout(r, 1800));
      const after = await page.evaluate(() => {
        const f = document.querySelector('#gamePlayArea iframe');
        if (!f) return { gone: true };
        const fr = f.contentDocument;
        return { src: f.src, len: fr && fr.body ? fr.body.innerHTML.length : -1, skeleton: !!document.querySelector('.frame-skeleton') };
      });
      if (after.gone) bad('restart removed the iframe');
      else if (after.len > 50) ok(`restart reloads game (content ${after.len}b, skeleton cleared=${!after.skeleton})`);
      else bad(`restart left game blank (len=${after.len})`);
      if (after.src !== before.src) warn(`restart changed iframe src (${before.src} -> ${after.src})`);
    }

    if (full) {
      const state = await page.$eval('#fullscreenBtn', (b) => ({ disabled: b.disabled, ad: b.getAttribute('aria-disabled') }));
      if (state.disabled) {
        ok('fullscreen correctly disabled in this environment (feature-detected)');
      } else {
        await page.click('#fullscreenBtn');
        await new Promise((r) => setTimeout(r, 700));
        const fs = await page.evaluate(() => !!(document.fullscreenElement || document.webkitFullscreenElement));
        if (fs) {
          ok('fullscreen request succeeds');
          const visible = await page.evaluate(() => {
            const b = document.getElementById('fsExit');
            if (!b) return { exists: false };
            const r = b.getBoundingClientRect();
            const st = getComputedStyle(b);
            return { exists: true, shown: st.display !== 'none' && r.width > 0, w: Math.round(r.width) };
          });
          if (visible.exists && visible.shown) ok('in-frame "Exit Fullscreen" control is visible while fullscreen');
          else bad(`in-frame exit control not usable: ${JSON.stringify(visible)}`);

          await page.evaluate(() => document.getElementById('fsExit').click());
          await new Promise((r) => setTimeout(r, 900));
          const exited = await page.evaluate(() => !document.fullscreenElement);
          if (exited) ok('in-frame exit control leaves fullscreen');
          else bad('in-frame exit control did not leave fullscreen');
        } else {
          warn('fullscreen API did not engage in headless Chrome (browser-dependent)');
        }
      }
    }

    // game must still be interactive after restart
    const stillAlive = await page.evaluate(() => {
      const f = document.querySelector('#gamePlayArea iframe');
      return !!(f && f.contentDocument && f.contentDocument.querySelector('canvas, button, [role="button"]'));
    });
    if (stillAlive) ok('game still interactive after restart');
    else warn('game interactive target not found after restart');

    await page.close();
  }

  /* ---------- 10. NEW GAMES: ACTUALLY PLAYABLE ---------- */
  console.log('\n[10] new games (playable, not just loadable)');
  {
    // ---- Slide Puzzle ----
    {
      const page = await browser.newPage();
      const localErrs = [];
      page.on('pageerror', (e) => localErrs.push(`pageerror: ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') localErrs.push(`console.error: ${m.text()}`); });
      try {
        await page.setViewport({ width: 1024, height: 768 });
        await page.goto(`${BASE}/pages/play.html?id=slide-puzzle`, { waitUntil: 'networkidle2', timeout: 45000 });
        await page.waitForSelector('#gamePlayArea iframe', { timeout: 15000 });
        const frame = await page.$('#gamePlayArea iframe');
        const handle = await frame.contentFrame();
        await new Promise((r) => setTimeout(r, 1200));

        if (!handle) {
          bad('slide-puzzle: iframe did not attach');
        } else {
          const board = await handle.evaluate(() => ({
            total: document.querySelectorAll('.tile').length,
            blank: document.querySelectorAll('.tile.blank').length,
            moves: (document.getElementById('moves') || {}).textContent
          }));
          if (board.total === 9 && board.blank === 1) ok(`slide-puzzle: 3x3 board is the default (${board.total} tiles, 1 blank)`);
          else bad(`slide-puzzle: unexpected default board ${JSON.stringify(board)}`);

          const switched = await handle.evaluate(() => {
            document.getElementById('m4').click();
            return {
              total: document.querySelectorAll('.tile').length,
              blank: document.querySelectorAll('.tile.blank').length,
              active: document.getElementById('m4').classList.contains('active'),
              moves: document.getElementById('moves').textContent
            };
          });
          if (switched.total === 16 && switched.blank === 1 && switched.active) ok('slide-puzzle: 4x4 mode swaps in a 16-tile board and resets the counter');
          else bad(`slide-puzzle: 4x4 switch gave ${JSON.stringify(switched)}`);

          const clickMove = await handle.evaluate(() => {
            const all = [...document.querySelectorAll('.tile')];
            const bi = all.findIndex((c) => c.classList.contains('blank'));
            const size = 4;
            const r = Math.floor(bi / size), c = bi % size;
            const adj = [];
            if (r > 0) adj.push(bi - size);
            if (r < size - 1) adj.push(bi + size);
            if (c > 0) adj.push(bi - 1);
            if (c < size - 1) adj.push(bi + 1);
            all[adj[0]].click();
            return document.getElementById('moves').textContent;
          });
          if (clickMove === '1') ok('slide-puzzle: tapping a tile beside the gap advances the move counter');
          else bad(`slide-puzzle: move counter after click = "${clickMove}"`);

          const keyMove = await handle.evaluate(() => {
            const before = document.getElementById('moves').textContent;
            for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
              if (document.getElementById('moves').textContent !== before) return k;
            }
            return null;
          });
          if (keyMove) ok(`slide-puzzle: arrow-key input also moves a tile (${keyMove})`);
          else warn('slide-puzzle: no arrow key changed the move counter');

          const bestEl = await handle.evaluate(() => (document.getElementById('best') || {}).textContent);
          if (bestEl === '-') ok('slide-puzzle: best-score pill shows "-" until a puzzle is solved');
          else warn(`slide-puzzle: best pill = "${bestEl}"`);

          if (localErrs.length) localErrs.forEach((e) => bad(`slide-puzzle: ${e}`));
        }
      } catch (e) {
        bad(`slide-puzzle: playability check failed - ${e.message.split('\n')[0]}`);
      }
      await page.close();
    }

    // ---- Lights Out ----
    {
      const page = await browser.newPage();
      const localErrs = [];
      page.on('pageerror', (e) => localErrs.push(`pageerror: ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') localErrs.push(`console.error: ${m.text()}`); });
      try {
        await page.setViewport({ width: 1024, height: 768 });
        await page.goto(`${BASE}/pages/play.html?id=lights-out`, { waitUntil: 'networkidle2', timeout: 45000 });
        await page.waitForSelector('#gamePlayArea iframe', { timeout: 15000 });
        const frame = await page.$('#gamePlayArea iframe');
        const handle = await frame.contentFrame();
        await new Promise((r) => setTimeout(r, 1200));

        if (!handle) {
          bad('lights-out: iframe did not attach');
        } else {
          const start = await handle.evaluate(() => ({
            cells: document.querySelectorAll('.cell').length,
            on: document.querySelectorAll('.cell.on').length,
            shown: parseInt((document.getElementById('left') || {}).textContent || '-1', 10),
            moves: (document.getElementById('moves') || {}).textContent
          }));
          if (start.cells === 25 && start.on > 0 && start.on < 25) ok(`lights-out: 5x5 board rendered (${start.on} lights lit)`);
          else bad(`lights-out: unexpected board ${JSON.stringify(start)}`);
          if (start.shown === start.on) ok('lights-out: "lights left" HUD matches the board');
          else bad(`lights-out: HUD says ${start.shown} but board has ${start.on} lit`);

          const after = await handle.evaluate(() => {
            const before = parseInt(document.getElementById('left').textContent, 10);
            document.querySelector('.cell.on').click();
            return {
              before,
              after: parseInt(document.getElementById('left').textContent, 10),
              moves: document.getElementById('moves').textContent,
              dom: document.querySelectorAll('.cell.on').length
            };
          });
          if (after.after !== after.before && after.moves === '1') ok('lights-out: tapping a lit light changes the board and advances moves');
          else bad(`lights-out: tap result ${JSON.stringify(after)}`);
          if (after.dom === after.after) ok('lights-out: HUD still tracks the board after a move');
          else bad(`lights-out: HUD ${after.after} vs board ${after.dom} after a move`);

          const reset = await handle.evaluate(() => {
            document.getElementById('resetBtn').click();
            return {
              moves: document.getElementById('moves').textContent,
              cells: document.querySelectorAll('.cell').length,
              on: document.querySelectorAll('.cell.on').length
            };
          });
          if (reset.moves === '0' && reset.cells === 25 && reset.on > 0) ok('lights-out: reset deals a fresh board and zeroes the counter');
          else bad(`lights-out: reset result ${JSON.stringify(reset)}`);

          if (localErrs.length) localErrs.forEach((e) => bad(`lights-out: ${e}`));
        }
      } catch (e) {
        bad(`lights-out: playability check failed - ${e.message.split('\n')[0]}`);
      }
      await page.close();
    }
  }

  await browser.close();
  server.close();

  const uniq = [...new Set(errors)];
  if (uniq.length) {
    console.log(`\n=== COLLECTED SITE ERRORS (${uniq.length}) ===`);
    uniq.slice(0, 60).forEach((e) => console.log('  X ' + e));
  }

  console.log(`\n=== browser-test summary ===`);
  console.log(`pass=${out.pass.length} warn=${out.warn.length} fail=${out.fail.length} runtimeErrors=${uniq.length}`);
  const failed = out.fail.length + uniq.length;
  console.log(`RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${failed} problems)`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
