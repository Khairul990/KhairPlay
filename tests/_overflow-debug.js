const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8792;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404).end('404'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    res.end(b);
  });
});
(async () => {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 768, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle2' });
  const report = await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const res = { docW, scrollW: document.documentElement.scrollWidth, offenders: [] };
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > docW + 1 || r.left < -1) {
        res.offenders.push({
          sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
          left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width)
        });
      }
    });
    return res;
  });
  console.log('viewport', report.docW, 'scrollWidth', report.scrollW, 'overflow', report.scrollW - report.docW);
  report.offenders.slice(0, 25).forEach((o) => console.log(`  ${o.sel}  left=${o.left} right=${o.right} w=${o.w}`));
  await browser.close(); server.close();
})();
