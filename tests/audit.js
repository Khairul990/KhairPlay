/* PlayNova static audit: links, assets, registry, SEO, XSS, a11y basics.
   Run: node tests/audit.js   (no dependencies) */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://khairplay.vercel.app';
const results = { pass: [], warn: [], fail: [] };
const ok = (m) => results.pass.push(m);
const warn = (m) => results.warn.push(m);
const fail = (m) => results.fail.push(m);

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name === 'tests') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const htmlFiles = files.filter((f) => f.endsWith('.html'));

/* ---------- 1. registry integrity ---------- */
const gd = read('js/games-data.js');
const entries = [];
/* parse object-by-object: a single lazy regex over the whole array can never
   capture optional fields (thumb), which silently disabled that check. */
const field = (block, key) => {
  const mm = block.match(new RegExp(`\\b${key}:\\s*"([^"]*)"`));
  return mm ? mm[1] : '';
};
for (const block of gd.split(/\{\s*\r?\n\s*id:/).slice(1)) {
  const id = (block.match(/^\s*"([^"]+)"/) || [])[1];
  if (!id) continue;
  entries.push({
    id,
    title: field(block, 'title'),
    cat: field(block, 'category'),
    thumb: field(block, 'thumb'),
    iframe: field(block, 'iframe')
  });
}
if (!entries.length) fail('games-data.js: no registry entries could be parsed');

const ids = new Set();
for (const e of entries) {
  if (ids.has(e.id)) fail(`duplicate registry id: ${e.id}`);
  ids.add(e.id);
  if (!exists(e.iframe)) fail(`registry ${e.id} -> missing file ${e.iframe}`);
  else ok(`registry ${e.id} -> ${e.iframe}`);
  if (!e.title) fail(`registry ${e.id} has no title`);
  if (!e.cat) fail(`registry ${e.id} has no category`);
  if (e.thumb && !exists(e.thumb)) fail(`registry ${e.id} missing thumb ${e.thumb}`);
  if (!e.thumb) warn(`registry ${e.id} has no thumb`);
}

/* every games/*.html must be reachable from registry */
const gameFiles = files.filter((f) => f.includes(`${path.sep}games${path.sep}`) && f.endsWith('.html'));
const iframes = new Set(entries.map((e) => e.iframe));
for (const g of gameFiles) {
  const rel = path.relative(ROOT, g).replace(/\\/g, '/');
  if (!iframes.has(rel)) fail(`orphan game file not in registry: ${rel}`);
}

/* ---------- 2. internal link check ---------- */
const ext = /^(https?:|mailto:|tel:|javascript:|data:|#|\/\/)/;
const linkRe = /(?:href|src)\s*=\s*"([^"]+)"/g;
const broken = new Set();
let linkCount = 0;
for (const f of htmlFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const baseDir = path.posix.dirname(rel);
  const html = fs.readFileSync(f, 'utf8');
  let lm;
  while ((lm = linkRe.exec(html))) {
    const raw = lm[1].trim();
    if (!raw || ext.test(raw)) continue;
    linkCount++;
    const clean = raw.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = path.posix.normalize(path.posix.join(baseDir, clean));
    if (!exists(target.replace(/\//g, path.sep))) broken.add(`${rel} -> ${raw}`);
  }
}
if (broken.size) [...broken].forEach((b) => fail(`broken link: ${b}`));
else ok(`checked ${linkCount} internal links across ${htmlFiles.length} html files, none broken`);

/* ---------- 3. SEO / meta per page ---------- */
const pages = ['index.html', '404.html',
  'pages/games.html', 'pages/play.html', 'pages/about.html', 'pages/contact.html',
  'pages/privacy.html', 'pages/terms.html'];
for (const p of pages) {
  if (!exists(p)) { fail(`missing page ${p}`); continue; }
  const html = read(p);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (!title.trim()) fail(`${p}: empty <title>`);
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (!desc.trim()) fail(`${p}: missing meta description`);
  else if (desc.length < 40) warn(`${p}: short meta description (${desc.length})`);
  if (!/property="og:image"/.test(html)) warn(`${p}: missing og:image`);
  if (!/property="og:title"/.test(html)) warn(`${p}: missing og:title`);
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  if (p === 'index.html' || p === '404.html') {
    if (canon && !/^https?:\/\//.test(canon)) fail(`${p}: non-absolute canonical "${canon}"`);
    else if (canon) ok(`${p}: canonical absolute`);
    else warn(`${p}: no canonical`);
  }
  const ogimg = (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1];
  if (ogimg && !/^https?:\/\//.test(ogimg)) fail(`${p}: non-absolute og:image "${ogimg}"`);
  if (ogimg && /\.(svg)($|\?)/i.test(ogimg)) fail(`${p}: og:image is SVG (unsupported by social platforms)`);
  if (!/<html[^>]+lang=/.test(html)) warn(`${p}: missing lang attribute`);
}

/* ---------- 4. headings / alt ---------- */
for (const f of htmlFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const html = fs.readFileSync(f, 'utf8');
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 === 0) warn(`${rel}: no <h1>`);
  if (h1 > 1) warn(`${rel}: ${h1} <h1> elements`);
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)];
  for (const im of imgs) {
    if (!/\balt\s*=/.test(im[0])) warn(`${rel}: <img> without alt: ${im[0].slice(0, 70)}`);
  }
}

/* ---------- 5. XSS-prone sinks fed by URL/query ---------- */
const sinks = ['innerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'outerHTML'];
for (const f of files.filter((x) => x.endsWith('.js'))) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const src = fs.readFileSync(f, 'utf8');
  for (const s of sinks) {
    const count = src.split(s).length - 1;
    if (count) warn(`${rel}: ${count}x \`${s}\` (review for untrusted data)`);
  }
  if (/\b(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']+["']/i.test(src)) {
    const hit = src.match(/\b(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']+["']/i)[0];
    fail(`${rel}: possible embedded secret -> ${hit.slice(0, 40)}...`);
  }
}

/* ---------- 6. secrets in tracked files ---------- */
const tracked = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
for (const must of ['node_modules', '.vercel']) {
  if (!tracked.includes(must)) warn(`.gitignore missing ${must}`);
}
for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (/\.(env|pem|key)$/i.test(rel)) fail(`sensitive file tracked: ${rel}`);
}

/* ---------- 7. sitemap sanity ---------- */
if (exists('sitemap.xml')) {
  const sm = read('sitemap.xml');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
  if (!locs.length) fail('sitemap has no <loc>');
  else ok(`sitemap: ${locs.length} urls`);
  for (const l of locs) {
    if (!/^https:\/\//.test(l)) fail(`sitemap non-absolute url: ${l}`);
    const q = l.split('?')[0];
    const rel = q.replace(SITE + '/', '');
    if (!exists(rel.replace(/\//g, path.sep))) fail(`sitemap points to missing file: ${l}`);
  }
  const gameIds = new Set(entries.map((e) => e.id));
  for (const l of locs) {
    const id = (l.match(/[?&]id=([a-z0-9-]+)/) || [])[1];
    if (id && !gameIds.has(id)) fail(`sitemap unknown game id: ${id}`);
  }
}

/* ---------- 8. AdSense must stay disabled ---------- */
if (/adsEnabled\s*:\s*true/.test(gd)) warn('adsEnabled is true');
else ok('ads disabled (as documented)');

/* ---------- report ---------- */
const pad = (s) => '  ' + s;
console.log(`\n=== PlayNova audit ===`);
console.log(`files: ${files.length}, html: ${htmlFiles.length}, registry games: ${entries.length}`);
console.log(`\nFAIL (${results.fail.length})`);
results.fail.forEach((x) => console.log(pad('X ' + x)));
console.log(`\nWARN (${results.warn.length})`);
results.warn.forEach((x) => console.log(pad('! ' + x)));
console.log(`\nPASS (${results.pass.length})`);
results.pass.forEach((x) => console.log(pad('+ ' + x)));
console.log(`\nRESULT: ${results.fail.length === 0 ? 'PASS' : 'FAIL'} (${results.fail.length} failures, ${results.warn.length} warnings)`);
process.exit(results.fail.length ? 1 : 0);
