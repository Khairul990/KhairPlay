const http = require('http'); const fs = require('fs'); const path = require('path');
const puppeteer = require('puppeteer-core');
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8794;
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
  await page.goto(`http://127.0.0.1:${PORT}/pages/play.html?id=2048`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#gamePlayArea iframe');
  await new Promise(r => setTimeout(r, 800));
  console.log('enabled =', await page.evaluate(() => document.fullscreenEnabled));
  await page.click('#fullscreenBtn');
  await new Promise(r => setTimeout(r, 900));
  console.log('after enter, fullscreenElement =', await page.evaluate(() => !!document.fullscreenElement));
  console.log('button text =', await page.$eval('#fullscreenBtn', b => b.textContent));
  const r = await page.evaluate(async () => {
    try { await document.exitFullscreen(); return 'resolved'; } catch (e) { return 'rejected: ' + e.message; }
  });
  console.log('direct exitFullscreen ->', r);
  await new Promise(x => setTimeout(x, 700));
  console.log('after direct exit, fullscreenElement =', await page.evaluate(() => !!document.fullscreenElement));
  // now test the button path from a fresh entry
  await page.click('#fullscreenBtn');
  await new Promise(x => setTimeout(x, 900));
  console.log('re-entered =', await page.evaluate(() => !!document.fullscreenElement));
  await page.click('#fullscreenBtn');
  await new Promise(x => setTimeout(x, 1200));
  console.log('after button exit, fullscreenElement =', await page.evaluate(() => !!document.fullscreenElement));
  console.log('button text now =', await page.$eval('#fullscreenBtn', b => b.textContent));
  await browser.close(); server.close();
})();
