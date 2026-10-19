const http = require('http'); const fs = require('fs'); const path = require('path');
const puppeteer = require('puppeteer-core');
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8793;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(path.join(ROOT, p), (e, b) => { if (e) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' }); res.end(b); });
});
(async () => {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  console.log('width | navRight | navLinksRight | burgerShown | overflow');
  for (const w of [700, 760, 761, 800, 840, 860, 880, 900, 920, 950, 980, 1000, 1024]) {
    await page.setViewport({ width: w, height: 800 });
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle2' });
    const r = await page.evaluate(() => {
      const nl = document.querySelector('.nav-links');
      const burger = document.querySelector('.burger');
      const nav = document.querySelector('.nav');
      const de = document.documentElement;
      return {
        navRight: nav ? Math.round(nav.getBoundingClientRect().right) : -1,
        linksRight: nl ? Math.round(nl.getBoundingClientRect().right) : -1,
        burgerShown: burger ? getComputedStyle(burger).display !== 'none' : false,
        overflow: de.scrollWidth - de.clientWidth
      };
    });
    console.log(`${String(w).padStart(5)} | ${String(r.navRight).padStart(8)} | ${String(r.linksRight).padStart(13)} | ${String(r.burgerShown).padStart(10)} | ${r.overflow}`);
  }
  await browser.close(); server.close();
})();
