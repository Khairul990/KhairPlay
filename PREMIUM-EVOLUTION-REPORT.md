# PlayNova Premium Evolution — Delivery Report

**Branch:** `feature/premium-evolution` (12 commits ahead of `origin/main` @ `73bea88`)
**Head:** `6f11d9b`
**Changed:** 57 files (+5028 / −65)
**Production:** https://khairplay.vercel.app/ — **unchanged**, still serving `main` @ `73bea88` (verified: 200, no discovery sections, 17 games)

---

## Verification (actually run, in this repo)

```
node tests/audit.js          → PASS (0 failures, 5 warnings)
node tests/browser-test.js   → 117 pass / 0 fail / 0 warnings / 0 runtime errors
```

Both suites are committed and reproducible: `tests/audit.js` (zero-dependency static audit) and `tests/browser-test.js` (real headless Chrome via `puppeteer-core`, 10 sections). `.vercelignore` keeps `tests/` out of the deployment.

Sections covered by the browser suite: header/nav, search + deep links, **every registry game launching cleanly**, 404 page, responsive overflow at 320/375/768/1024/1440, keyboard accessibility, manifest + service worker, discovery/favourites, player restart + fullscreen, and playability of the two newest games.

The 5 remaining audit warnings are intentional, not defects: `404.html` has no canonical (it is `noindex`, so a canonical would contradict it) and 4 `innerHTML` sink review notes for code that only ever receives registry data or escaped values.

### A test bug that was found and fixed

The audit parsed `games-data.js` with one lazy regex over the whole `GAMES` array. Because the `thumb` capture group was optional and the quantifiers lazy, `thumb` never matched for **any** entry — every game reported "has no thumb", and a genuinely missing thumbnail was indistinguishable from the noise. Confirmed by deleting `thumb-snake.svg` (audit failed) and restoring it (audit passed). Warnings dropped 29 → 5.

---

## Commits (oldest first)

| Commit | What |
|--------|------|
| `9ac37b5` | Phase 1 audit fixes: SW stale-while-revalidate, absolute sitemap/canonical/JSON-LD, PNG share card, og meta |
| `2c1eadc` | Phase 3: pause + sounds (flappy/breakout), merge/eat sounds (2048/snake), instruction lines |
| `af93986` | Phase 4: 5 original games (space shooter, runner, racing, platformer, tower defence) → 22 games |
| `299f1b6` | Phase 5: progress system (`js/progress.js`) — XP/levels, 8 achievements, daily challenge |
| `f198bed` | earlier delivery report (superseded by this file) |
| `9f161e1` | QA harness: `tests/audit.js` + `tests/browser-test.js`, `.vercelignore` |
| `69de275` | **Two critical fixes** — invalid `allow-fullscreen` iframe sandbox flag; nav overflow at 761–825px |
| `555857e` | Discovery: favourites, trending, recommended, hero "Play Now" |
| `55d0c06` | Player restart + fullscreen, with a reachable in-frame exit control |
| `06cfd4a` | **Two new games** — Slide Puzzle + Lights Out → 24 games |
| `75b9549` | SEO: canonical on `play.html` + all 24 game pages, hidden `<h1>`, SW cache `v6` |
| `6f11d9b` | Audit parser fix (thumbnail check) |

## Two critical defects fixed (`69de275`)

1. **Invalid `allow-fullscreen` iframe sandbox flag** in `js/main.js` — it is not a real sandbox token and produced a console error on **all** game pages.
2. **Nav overflowed the viewport by up to 49px** in the 761–825px band — the burger/dropdown breakpoint was `760px` while the nav could not fit until `860px`.

## Games: 17 (production) → 24 (this branch)

| id | Title | Category |
|----|-------|----------|
| `space-shooter` | Space Shooter | Challenge |
| `runner` | Endless Runner | Kids |
| `racing` | Racing Challenge | Challenge |
| `platformer` | Platform Adventure | Kids |
| `tower-defense` | Tower Defense | Challenge |
| `slide-puzzle` | Slide Puzzle | Educational |
| `lights-out` | Lights Out | Challenge |

The seven are original, self-contained HTML (no external assets, no third-party code). Each ships with an SVG thumbnail, a `games-data.js` entry, a sitemap URL, and an admin high-score row.

The two newest were verified **playable**, not merely loadable (browser-test section [10]): board sizes render, 3x3↔4x4 mode switch resets the counter, tapping advances moves, arrow keys move a tile, the "lights left" HUD tracks the board after every move, and reset deals a fresh board.

## Discovery and player

- Favourites (heart on every card, `?cat=favorites` filter, section on home), trending and recommended rails driven by real play counts, hero "Play Now" wired to the top featured game.
- Player toolbar: **restart** (reloads the iframe in place, restores the loading skeleton, game verified interactive afterwards) and **fullscreen** (feature-detected; disabled with an honest note where unsupported). Because the toolbar sits outside the fullscreened element, an in-frame **"Exit Fullscreen"** button is rendered inside the player box, CSS-gated on `:fullscreen` — exit is reachable by click as well as Esc.

## SEO / performance

- Absolute canonicals on every indexable page, including `pages/play.html`, which had none.
- All 24 game pages: canonical pointing at the play page that embeds them, plus a visually hidden `<h1>` (absolutely positioned and clipped — no layout impact).
- `sitemap.xml`: 30 URLs. `robots.txt` allows everything except `/admin/` and points at the sitemap.
- Card thumbnails already ship `loading="lazy"` with explicit `width`/`height`.
- Service worker uses stale-while-revalidate; cache bumped to `playnova-v6` because core shell assets changed.
- `public/brand/share-card.png` (1200×630, 140 KB) exists **in this branch** — production currently 404s on it because `main` does not have it.

---

## Honest limitations

- **The preview deployment could not be publicly verified.** Vercel Deployment Protection is enabled for this project: `https://khairplay-git-feature-premium-evolution-khairul18-s-projects1.vercel.app/` returns `200 title="Login - Vercel"`. The Vercel *build* succeeded for `75b9549` (commit status `context=Vercel state=success`), but its output cannot be inspected without a logged-in session.
- Game feel, balance and touch comfort are **not** human play-tested. The suites catch crashes, broken wiring, console errors, overflow and dead links — not whether a game is fun.
- No accounts, no global leaderboard, no backend. Progress is device-local and every UI surface says so.
- Ads stay **disabled** (`SITE_CONFIG.adsEnabled = false`) until a real AdSense config is supplied.
- The admin panel is client-side only.
- The PWA has an SVG icon only; Android installability wants 192/512 PNGs, which cannot be generated without an image toolchain here.

## What needs you (owner-only)

1. **Verify the preview** — either disable Deployment Protection for the preview environment (Vercel → Project → Settings → Deployment Protection), or supply a `VERCEL_TOKEN` so the deployment can be checked, or open the preview URL while logged into Vercel and playtest it.
2. **Approve going live** — merging `feature/premium-evolution` into `main` deploys to production. Say the word and it will be merged.

Nothing else is blocking.
