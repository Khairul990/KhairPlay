"use strict";

const GVP = (function () {

  const CONFIG_KEY = "gvp_config";
  const GAME_LIMIT_KEY = "gvp_plays";
  const RECENT_KEY = "gvp_recent";
  const RATINGS_KEY = "gvp_ratings";
  const FAVS_KEY = "gvp_favorites";
  const PROGRESS_KEY = "gvp_progress";

  let applyGameFilter = null;

  function getConfig() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) return Object.assign({}, SITE_CONFIG, JSON.parse(saved));
    } catch (e) {}
    return Object.assign({}, SITE_CONFIG);
  }

  function saveConfig(cfg) {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  function basePath() {
    const p = location.pathname.replace(/\\/g, "/");
    if (/\/(pages|admin)(\/|$)/.test(p)) return "../";
    return "./";
  }

  function playURL(id) {
    return basePath() + "pages/play.html?id=" + encodeURIComponent(id);
  }

  function initHeader() {
    const burger = document.querySelector(".burger");
    const links = document.querySelector(".nav-links");
    if (burger && links) {
      burger.addEventListener("click", function () {
        links.classList.toggle("open");
      });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A") links.classList.remove("open");
      });
    }

    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      const href = a.getAttribute("href");
      if (!href) return;
      const file = href.split("/").pop();
      if (file === path || (path === "" && file === "index.html")) a.classList.add("active");
    });

    const navForm = document.querySelector(".nav-search");
    if (navForm) {
      navForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const input = navForm.querySelector("input");
        const q = (input && input.value || "").trim();
        location.href = basePath() + "pages/games.html" + (q ? "?q=" + encodeURIComponent(q) : "");
      });
    }

    initHeaderWalletControls();
  }

  /* Header NovaWallet status pills & sound toggle */
  function initHeaderWalletControls() {
    const nav = document.querySelector(".site-header .nav");
    if (!nav || document.querySelector(".nova-wallet-bar")) return;

    const bar = document.createElement("div");
    bar.className = "nova-wallet-bar";
    bar.innerHTML =
      '<div class="wallet-pill coins" title="NovaCoins — Click to open Nova Vault">' +
        '<span>🪙</span> <b class="nova-val-coins">1,250</b>' +
      '</div>' +
      '<div class="wallet-pill gems" title="NovaGems — Premium Currency">' +
        '<span>💎</span> <b class="nova-val-gems">35</b>' +
      '</div>' +
      '<div class="wallet-pill vip" title="VIP Level Status">' +
        '<span class="nova-val-tier-icon">🥉</span> <b class="nova-val-tier" style="color:#cd7f32">Bronze VIP</b>' +
      '</div>' +
      '<button type="button" class="btn-daily-spin" id="headerSpinBtn" title="Daily Fortune Wheel">' +
        '🎡 <span>SPIN</span>' +
      '</button>' +
      '<button type="button" class="btn-sound-toggle" id="headerSoundBtn" title="Toggle Sound FX">' +
        '🔊' +
      '</button>';

    // Insert before burger
    const burger = nav.querySelector(".burger");
    if (burger) nav.insertBefore(bar, burger);
    else nav.appendChild(bar);

    // Bind clicks
    bar.querySelectorAll(".wallet-pill").forEach(function (pill) {
      pill.addEventListener("click", function () {
        if (window.NovaAudio) window.NovaAudio.playClick();
        openVaultModal("deposit");
      });
    });

    const spinBtn = document.getElementById("headerSpinBtn");
    if (spinBtn) {
      spinBtn.addEventListener("click", function () {
        if (window.NovaAudio) window.NovaAudio.playClick();
        openWheelModal();
      });
    }

    const soundBtn = document.getElementById("headerSoundBtn");
    if (soundBtn) {
      updateSoundButtonUI();
      soundBtn.addEventListener("click", function () {
        if (window.NovaAudio) {
          const on = window.NovaAudio.toggle();
          soundBtn.textContent = on ? "🔊" : "🔇";
          toast(on ? "Sound FX Enabled" : "Sound FX Muted");
        }
      });
    }

    if (window.NovaWallet) {
      window.NovaWallet.updateUIElements();
      window.NovaWallet.initGameListener();
    }
  }

  function updateSoundButtonUI() {
    const soundBtn = document.getElementById("headerSoundBtn");
    if (soundBtn && window.NovaAudio) {
      soundBtn.textContent = window.NovaAudio.isEnabled() ? "🔊" : "🔇";
    }
  }

  function initAnnouncement() {
    const cfg = getConfig();
    const bar = document.querySelector(".announce");
    if (!bar) return;
    if (cfg.announcementEnabled && cfg.announcement) {
      bar.textContent = cfg.announcement;
      bar.classList.add("show");
    }
  }

  /* Live Wins Marquee Ticker */
  function initLiveTicker() {
    if (document.querySelector(".live-ticker-bar")) return;
    const header = document.querySelector(".site-header");
    if (!header) return;

    const ticker = document.createElement("div");
    ticker.className = "live-ticker-bar";
    ticker.innerHTML =
      '<div class="ticker-badge">⚡ LIVE DROPS</div>' +
      '<div class="ticker-track" id="tickerTrack"></div>';

    header.parentNode.insertBefore(ticker, header.nextSibling);

    const winners = [
      { user: "NeonRider", game: "Cyber Velocity", win: "+450 🪙", type: "gold" },
      { user: "CosmoAce", game: "Cosmic Vanguard", win: "+800 🪙", type: "gold" },
      { user: "Viper_99", game: "Endless Runner", win: "Rank Up Lv 5!", type: "vip" },
      { user: "Sarah_Pro", game: "Brick Breaker", win: "+650 🪙", type: "gold" },
      { user: "AlphaWolf", game: "Daily Fortune Wheel", win: "15 💎 Jackpot!", type: "vip" },
      { user: "Shadow_X", game: "Block Fall", win: "+320 🪙", type: "gold" },
      { user: "NovaLegend", game: "Tournament", win: "Unlocked Gold VIP!", type: "vip" },
      { user: "CyberQueen", game: "Mine Field", win: "+500 🪙", type: "gold" }
    ];

    const track = document.getElementById("tickerTrack");
    if (track) {
      let html = "";
      // Repeat twice for seamless infinite scroll
      for (let repeat = 0; repeat < 2; repeat++) {
        winners.forEach(function (w) {
          const cls = w.type === "vip" ? "vip-drop" : "gold-drop";
          html += '<span class="ticker-item">' +
            '<b>' + w.user + '</b> in ' + w.game + ': <span class="' + cls + '">' + w.win + '</span>' +
          '</span>';
        });
      }
      track.innerHTML = html;
    }
  }

  /* Ratings */
  function getRatings() {
    try { return JSON.parse(localStorage.getItem(RATINGS_KEY)) || {}; } catch (e) { return {}; }
  }

  function getRating(id) {
    const v = getRatings()[id];
    return typeof v === "number" && v >= 1 && v <= 5 ? v : 0;
  }

  function setRating(id, stars) {
    try {
      const r = getRatings();
      r[id] = stars;
      localStorage.setItem(RATINGS_KEY, JSON.stringify(r));
    } catch (e) {}
  }

  function starsHTML(n) {
    let s = "";
    for (let i = 1; i <= 5; i++) s += i <= n ? "★" : "☆";
    return s;
  }

  /* Favorites */
  function getFavs() {
    try {
      const v = JSON.parse(localStorage.getItem(FAVS_KEY));
      return Array.isArray(v) ? v.filter(function (x) { return typeof x === "string"; }) : [];
    } catch (e) { return []; }
  }

  function isFav(id) { return getFavs().indexOf(id) !== -1; }

  function setFav(id, on) {
    const f = getFavs();
    const i = f.indexOf(id);
    if (on && i === -1) f.push(id);
    if (!on && i !== -1) f.splice(i, 1);
    try { localStorage.setItem(FAVS_KEY, JSON.stringify(f)); } catch (e) {}
    return on;
  }

  function getFavGames() {
    return getFavs().map(getGameById).filter(function (g) { return g && g.enabled; });
  }

  function favBtnHTML(id) {
    const on = isFav(id);
    return '<button class="fav-btn' + (on ? " on" : "") + '" type="button" data-fav="' + id + '"' +
      ' aria-pressed="' + on + '" aria-label="Favorite" title="Add to favorites">' +
      (on ? "♥" : "♡") + '</button>';
  }

  function refreshFavButtons(id) {
    document.querySelectorAll('.fav-btn[data-fav="' + id + '"]').forEach(function (b) {
      const on = isFav(id);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? "♥" : "♡";
    });
    const action = document.getElementById("favBtn");
    if (action && action.getAttribute("data-fav") === id) setFavActionState(action, id);
  }

  function setFavActionState(btn, id) {
    const on = isFav(id);
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "♥ In Favorites" : "♡ Add Favorite";
  }

  function initFavourites() {
    document.addEventListener("click", function (e) {
      const btn = e.target.closest ? e.target.closest(".fav-btn") : null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-fav");
      const g = getGameById(id);
      if (!g) return;
      const now = !isFav(id);
      setFav(id, now);
      refreshFavButtons(id);
      if (window.NovaAudio) window.NovaAudio.playClick();
      toast(now ? "♥ Added " + g.title + " to Favorites" : "Removed from Favorites");
      renderHomeSections();
      if (document.querySelector('.filter-btn[data-cat="favorites"].active') && applyGameFilter) applyGameFilter();
    }, false);
  }

  function getPlayCounts() {
    try {
      const s = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      return (s && typeof s.games === "object" && s.games) || {};
    } catch (e) { return {}; }
  }

  function getTrendingGames(n) {
    const counts = getPlayCounts();
    const enabled = GAMES.filter(function (g) { return g.enabled; });
    const played = enabled.filter(function (g) { return counts[g.id]; });
    if (played.length >= Math.min(n, 4)) {
      return played.sort(function (a, b) { return counts[b.id] - counts[a.id]; }).slice(0, n);
    }
    const seen = {};
    const out = [];
    enabled.filter(function (g) { return g.featured; }).forEach(function (g) {
      if (!seen[g.id]) { seen[g.id] = 1; out.push(g); }
    });
    getNewGames(n).forEach(function (g) {
      if (!seen[g.id]) { seen[g.id] = 1; out.push(g); }
    });
    enabled.forEach(function (g) {
      if (out.length < n && !seen[g.id]) { seen[g.id] = 1; out.push(g); }
    });
    return out.slice(0, n);
  }

  function getRecommendedGames(n) {
    const counts = getPlayCounts();
    const enabled = GAMES.filter(function (g) { return g.enabled; });
    const playedIds = Object.keys(counts);
    if (!playedIds.length) {
      return getFeaturedGames().concat(getEducationalPicks(n))
        .filter(function (g, i, arr) { return arr.findIndex(function (x) { return x.id === g.id; }) === i; })
        .slice(0, n);
    }
    const catWeight = {};
    playedIds.forEach(function (id) {
      const g = getGameById(id);
      if (g) catWeight[g.category] = (catWeight[g.category] || 0) + counts[id];
    });
    const score = function (g) { return (catWeight[g.category] || 0) * 100 + (counts[g.id] || 0); };
    const unplayed = enabled.filter(function (g) { return !counts[g.id]; })
      .sort(function (a, b) { return score(b) - score(a); });
    const rest = enabled.filter(function (g) { return counts[g.id]; })
      .sort(function (a, b) { return score(b) - score(a); });
    return unplayed.concat(rest).slice(0, n);
  }

  function gameCardHTML(g) {
    const thumb = g.thumb
      ? '<img src="' + basePath() + g.thumb + '" alt="' + g.title + '" loading="lazy" width="400" height="225">'
      : "";
    const thumbClass = g.thumb ? "game-thumb" : "game-thumb emoji-only";
    const myRating = getRating(g.id);
    const ratingBit = myRating
      ? '<span class="card-stars" title="Your rating: ' + myRating + '/5">' + starsHTML(myRating) + "</span>"
      : "";
    const catBadge = '<span class="cat-badge badge-' + g.category + '">' + (CATEGORIES.find(function (c) { return c.id === g.category; }) || { icon: "" }).icon + "</span>";
    return '<article class="game-card">' +
      '<div class="' + thumbClass + '" style="background:' + (g.thumb ? "var(--raised)" : "linear-gradient(135deg," + g.color + "33," + g.color + "14)") + '">' +
      (thumb || g.icon) + catBadge + favBtnHTML(g.id) + '</div>' +
      '<div class="game-info">' +
        '<div class="game-meta-row"><span class="game-players">' + g.players + "</span>" + ratingBit + "</div>" +
        '<h3 class="game-title">' + g.title + "</h3>" +
        '<p class="game-desc">' + g.description + "</p>" +
        '<a class="btn btn-primary" href="' + playURL(g.id) + '">▶ PLAY NOW</a>' +
      "</div>" +
    "</article>";
  }

  function renderGames(targetId, games) {
    const el = document.getElementById(targetId);
    if (!el) return;
    if (!games.length) {
      el.innerHTML = '<div class="empty"><div class="big">🔍</div><p>No games found matching your search.</p></div>';
      return;
    }
    el.innerHTML = games.map(gameCardHTML).join("");
  }

  function renderHomeSections() {
    renderGames("featuredGrid", getFeaturedGames().slice(0, 8));
    renderGames("trendingGrid", getTrendingGames(8));
    renderGames("newGrid", getNewGames(4));
    renderGames("eduGrid", getEducationalPicks(4));
    renderGames("recommendedGrid", getRecommendedGames(4));

    const favs = getFavGames();
    const favSec = document.getElementById("favSection");
    if (favSec) {
      if (favs.length) {
        favSec.hidden = false;
        renderGames("favGrid", favs.slice(0, 8));
      } else {
        favSec.hidden = true;
      }
    }

    let recents = [];
    try { recents = (JSON.parse(localStorage.getItem(RECENT_KEY)) || []).map(getGameById).filter(Boolean); } catch (e) {}
    const recSec = document.getElementById("recentSection");
    if (recSec) {
      if (recents.length) {
        recSec.hidden = false;
        renderGames("recentGrid", recents.slice(0, 6));
      } else {
        recSec.hidden = true;
      }
    }
  }

  function initHome() {
    const catGrid = document.getElementById("catGrid");
    if (catGrid) {
      catGrid.innerHTML = CATEGORIES.map(function (c) {
        const count = getGamesByCategory(c.id).length;
        return '<a class="cat-card cat-' + c.id + '" href="' + basePath() + 'pages/games.html?cat=' + c.id + '">' +
          '<div class="cat-icon">' + c.icon + "</div>" +
          '<div class="cat-body">' +
            "<h3>" + c.title + "</h3>" +
            "<p>" + c.desc + "</p>" +
            '<span class="cat-count">' + count + " Games</span>" +
          "</div>" +
        "</a>";
      }).join("");
    }

    const short = document.getElementById("catShortcuts");
    if (short) {
      short.innerHTML = CATEGORIES.map(function (c) {
        return '<a class="cat-pill" href="' + basePath() + 'pages/games.html?cat=' + c.id + '">' + c.icon + " " + c.title + "</a>";
      }).join("") + '<a class="cat-pill" href="' + basePath() + 'pages/games.html">⚡ All Games</a>';
    }

    const heroPlay = document.getElementById("heroPlay");
    if (heroPlay) {
      const featured = getFeaturedGames().filter(function (g) { return g.enabled; })[0] || GAMES[0];
      if (featured) {
        heroPlay.href = playURL(featured.id);
        heroPlay.setAttribute("aria-label", "Play " + featured.title + " now");
        heroPlay.title = "\u25B6 " + featured.title;
      }
    }

    renderHomeSections();
    initHeroMatrix();
    initScrollReveal();
  }

  /* Matrix animated particles for hero section */
  function initHeroMatrix() {
    const hero = document.querySelector(".hero");
    if (!hero || document.getElementById("heroMatrixCanvas")) return;

    const canvas = document.createElement("canvas");
    canvas.id = "heroMatrixCanvas";
    canvas.className = "hero-matrix-canvas";
    hero.insertBefore(canvas, hero.firstChild);

    const ctx = canvas.getContext("2d");
    let w, h;
    const particles = [];

    function resize() {
      w = canvas.width = hero.offsetWidth;
      h = canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * (w || 1000),
        y: Math.random() * (h || 400),
        r: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        color: Math.random() > 0.5 ? "rgba(0, 213, 255, " : "rgba(124, 77, 255, "
      });
    }

    function renderMatrix() {
      if (!ctx || !w) return;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.fillStyle = p.color + "0.6)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.strokeStyle = "rgba(124, 77, 255, " + (0.15 * (1 - dist / 100)) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(renderMatrix);
    }
    renderMatrix();
  }

  function initScrollReveal() {
    const targets = document.querySelectorAll(
      ".section .section-head, .cat-card, .game-card, .content-card, .hero-stats .stat"
    );
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    const groups = new Map();
    targets.forEach(function (el) {
      if (el.classList.contains("reveal")) return;
      el.classList.add("reveal");
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, 0);
      const i = groups.get(parent);
      el.style.setProperty("--reveal-delay", Math.min(i * 65, 400) + "ms");
      groups.set(parent, i + 1);
    });
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("in");
          io.unobserve(en.target);
          const b = en.target.querySelector("b[id]");
          if (b && /^\d+$/.test(b.textContent)) animateCount(b, parseInt(b.textContent, 10), 900);
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach(function (el) { io.observe(el); });
  }

  function animateCount(el, to, dur) {
    const start = performance.now();
    function frame(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initGamesPage() {
    const grid = document.getElementById("allGamesGrid");
    if (!grid) return;
    const params = new URLSearchParams(location.search);
    let activeCat = params.get("cat") || "all";
    const search = document.getElementById("gameSearch");
    const initialQ = params.get("q") || "";
    if (search && initialQ) search.value = initialQ;

    const countFor = function (cat) {
      if (cat === "all") return GAMES.filter(function (g) { return g.enabled; }).length;
      if (cat === "favorites") return getFavGames().length;
      return getGamesByCategory(cat).length;
    };

    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(function (b) {
      if (b.dataset.cat === activeCat) b.classList.add("active");
      b.appendChild(document.createElement("span")).className = "fcount";
      b.addEventListener("click", function () {
        filterBtns.forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        activeCat = b.dataset.cat;
        if (window.NovaAudio) window.NovaAudio.playClick();
        apply();
      });
    });

    function refreshCounts() {
      filterBtns.forEach(function (b) {
        const c = b.querySelector(".fcount");
        if (c) c.textContent = countFor(b.dataset.cat);
      });
    }

    function apply() {
      const q = (search && search.value || "").trim().toLowerCase();
      let list = GAMES.filter(function (g) { return g.enabled; });
      if (activeCat === "favorites") list = getFavGames();
      else if (activeCat !== "all") list = list.filter(function (g) { return g.category === activeCat; });
      if (q) {
        list = list.filter(function (g) {
          return (g.title + " " + g.description + " " + g.tags.join(" ")).toLowerCase().indexOf(q) !== -1;
        });
      }
      renderGames("allGamesGrid", list);
      const c = document.getElementById("gameCount");
      if (c) c.textContent = list.length;
      refreshCounts();
    }

    applyGameFilter = apply;

    if (search) search.addEventListener("input", apply);
    apply();
  }

  function initGamePage() {
    const wrap = document.getElementById("gamePlayArea");
    if (!wrap) return;
    const id = wrap.dataset.game;
    const g = getGameById(id);
    if (!g) {
      wrap.innerHTML = '<div class="empty"><div class="big">😕</div><p>Game not found.</p><a class="btn btn-primary" href="' + basePath() + 'pages/games.html" style="margin-top:14px">Browse All Games</a></div>';
      return;
    }
    document.title = g.title + " — Play Free Online | " + SITE_CONFIG.name;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", g.description + " — Play free online on " + SITE_CONFIG.name + ".");
    const ogT = document.querySelector('meta[property="og:title"]');
    if (ogT) ogT.setAttribute("content", g.title + " — Play Free Online | PlayNova");
    const ogD = document.querySelector('meta[property="og:description"]');
    if (ogD) ogD.setAttribute("content", g.description);
    injectGameSchema(g);
    const t = document.getElementById("gameTitle");
    if (t) t.textContent = g.title;
    const icon = document.getElementById("gameIcon");
    if (icon) icon.textContent = g.icon;
    const crumb = document.getElementById("crumbGame");
    if (crumb) crumb.textContent = g.title;
    const d = document.getElementById("gameDesc");
    if (d) d.textContent = g.description;
    const ctrl = document.getElementById("gameControls");
    if (ctrl) ctrl.textContent = "Controls: " + g.controls;
    const pl = document.getElementById("gamePlayers");
    if (pl) pl.textContent = g.players;
    wrap.innerHTML =
      '<div class="frame-skeleton"><div class="sk-spinner"></div><div class="sk-text">Loading game engine...</div></div>' +
      '<iframe src="' + basePath() + g.iframe + '" title="' + g.title + '" loading="lazy" allowfullscreen sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"></iframe>' +
      '<button class="fs-exit" type="button" id="fsExit">✕ Exit Fullscreen</button>';
    const fsExit = document.getElementById("fsExit");
    if (fsExit) {
      fsExit.addEventListener("click", function () {
        const p = document.exitFullscreen || document.webkitExitFullscreen;
        if (p) { const r = p.call(document); if (r && r.catch) r.catch(function () {}); }
      });
    }
    const iframe = wrap.querySelector("iframe");
    if (iframe) {
      iframe.addEventListener("load", function () {
        const sk = wrap.querySelector(".frame-skeleton");
        if (sk) sk.remove();
      });
      setTimeout(function () {
        const sk = wrap.querySelector(".frame-skeleton");
        if (sk) sk.remove();
      }, 6000);
    }
    const catTag = document.getElementById("gameCatTag");
    if (catTag) {
      const cat = CATEGORIES.find(function (c) { return c.id === g.category; });
      if (cat) catTag.innerHTML = cat.icon + ' <a href="' + basePath() + 'pages/games.html?cat=' + cat.id + '">' + cat.title + "</a>";
    }

    const favAction = document.getElementById("favBtn");
    if (favAction) {
      favAction.setAttribute("data-fav", g.id);
      setFavActionState(favAction, g.id);
      favAction.addEventListener("click", function () {
        const now = !isFav(g.id);
        setFav(g.id, now);
        setFavActionState(favAction, g.id);
        refreshFavButtons(g.id);
        if (window.NovaAudio) window.NovaAudio.playClick();
        toast(now ? "♥ Added to Favorites" : "Removed from Favorites");
      });
    }

    const frameBox = document.getElementById("gamePlayArea");
    const skeletonHTML = '<div class="frame-skeleton"><div class="sk-spinner"></div><div class="sk-text">Reloading game...</div></div>';

    const restartBtn = document.getElementById("restartBtn");
    if (restartBtn) {
      restartBtn.addEventListener("click", function () {
        const iframe = frameBox && frameBox.querySelector("iframe");
        if (!iframe) return;
        const old = frameBox.querySelector(".frame-skeleton");
        if (old) old.remove();
        frameBox.insertAdjacentHTML("afterbegin", skeletonHTML);
        let reloaded = false;
        try {
          const win = iframe.contentWindow;
          if (win && win.location && win.location.href) { win.location.reload(); reloaded = true; }
        } catch (e) {}
        if (!reloaded) iframe.src = iframe.src;
        if (window.NovaAudio) window.NovaAudio.playClick();
        toast("Restarting game session...");
      });
    }

    const fullscreenBtn = document.getElementById("fullscreenBtn");
    const playerNote = document.getElementById("playerNote");
    if (fullscreenBtn) {
      const box = frameBox;
      const supported = !!(document.fullscreenEnabled ||
        (document.webkitFullscreenEnabled !== undefined && document.webkitFullscreenEnabled));
      const canRequest = box && (box.requestFullscreen || box.webkitRequestFullscreen);
      if (!supported || !canRequest) {
        fullscreenBtn.disabled = true;
        fullscreenBtn.title = "Fullscreen not supported on this browser";
        fullscreenBtn.setAttribute("aria-disabled", "true");
        if (playerNote) playerNote.textContent = "Fullscreen is unavailable on this device.";
      } else {
        fullscreenBtn.addEventListener("click", function () {
          const inFull = document.fullscreenElement || document.webkitFullscreenElement;
          if (inFull) {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
            return;
          }
          const p = (box.requestFullscreen || box.webkitRequestFullscreen).call(box);
          if (p && p.catch) p.catch(function () { toast("Could not enter fullscreen."); });
        });
        document.addEventListener("fullscreenchange", function () {
          const on = !!document.fullscreenElement;
          fullscreenBtn.setAttribute("aria-pressed", String(on));
          fullscreenBtn.innerHTML = on ? "&#x26F6; Exit Fullscreen" : "&#x26F6; Fullscreen";
        });
      }
    }

    const share = document.getElementById("shareBtn");
    if (share) {
      share.addEventListener("click", function () {
        const url = location.href;
        if (navigator.share) {
          navigator.share({ title: g.title, url: url }).catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () { toast("Game link copied to clipboard!"); });
        } else {
          toast("Copy URL directly from browser bar.");
        }
      });
    }
    const copy = document.getElementById("copyBtn");
    if (copy) {
      copy.addEventListener("click", function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(location.href).then(function () { toast("Link copied!"); });
        }
      });
    }

    const rel = document.getElementById("relatedGrid");
    if (rel) {
      const related = GAMES.filter(function (x) { return x.enabled && x.id !== g.id; }).slice(0, 4);
      renderGames("relatedGrid", related);
    }
    initRatingWidget(g);
    trackPlay();
  }

  function initRatingWidget(g) {
    const box = document.getElementById("ratingWidget");
    if (!box) return;
    function paint(hover) {
      const cur = hover || getRating(g.id);
      let html = '<span class="rating-label">Your Rating:</span><span class="rating-stars">';
      for (let i = 1; i <= 5; i++) {
        html += '<button type="button" class="star' + (i <= cur ? " on" : "") + '" data-n="' + i + '" aria-label="' + i + ' star">&#9733;</button>';
      }
      html += "</span>";
      if (getRating(g.id)) html += '<span class="rating-thanks">Thank you!</span>';
      box.innerHTML = html;
      box.querySelectorAll(".star").forEach(function (s) {
        s.addEventListener("click", function () {
          setRating(g.id, parseInt(s.dataset.n, 10));
          if (window.NovaAudio) window.NovaAudio.playCoin();
          toast("Rating saved!");
          paint();
        });
        s.addEventListener("mouseenter", function () { paint(parseInt(s.dataset.n, 10)); });
      });
      box.addEventListener("mouseleave", function () { paint(); }, { once: true });
    }
    paint();
  }

  function initRandomButton() {
    document.querySelectorAll(".nav-random").forEach(function (b) {
      b.addEventListener("click", function () {
        const pool = GAMES.filter(function (g) { return g.enabled; });
        if (!pool.length) return;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (window.NovaAudio) window.NovaAudio.playClick();
        toast("🎲 Launching " + pick.title + "!");
        location.href = playURL(pick.id);
      });
    });
  }

  function initBackToTop() {
    const btn = document.createElement("button");
    btn.className = "back-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "Top");
    btn.textContent = "↑";
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.appendChild(btn);
    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        btn.classList.toggle("show", window.scrollY > 450);
        ticking = false;
      });
    }, { passive: true });
  }

  function initPWA() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(basePath() + "sw.js").catch(function () {});
    });
  }

  function initAds() {
    const cfg = getConfig();
    const slots = document.querySelectorAll(".ad-slot");
    slots.forEach(function (el) {
      el.style.display = "none";
    });
  }

  function injectGameSchema(g) {
    try {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": g.title,
        "description": g.description,
        "genre": g.category === "educational" ? "Educational" : "Arcade",
        "gamePlatform": "Web browser",
        "operatingSystem": "Any",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "author": { "@type": "Organization", "name": SITE_CONFIG.name }
      });
      document.head.appendChild(s);
    } catch (e) {}
  }

  function trackPlay() {
    try {
      const now = Date.now();
      let data = { count: 0, last: 0 };
      try { data = JSON.parse(localStorage.getItem(GAME_LIMIT_KEY)) || data; } catch (e) {}
      data.count = (data.count || 0) + 1;
      data.last = now;
      localStorage.setItem(GAME_LIMIT_KEY, JSON.stringify(data));
    } catch (e) {}
    try {
      const id = document.getElementById("gamePlayArea") && document.getElementById("gamePlayArea").dataset.game;
      if (id) {
        let ids = [];
        try { ids = JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) {}
        ids = [id].concat(ids.filter(function (x) { return x !== id; })).slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
      }
    } catch (e) {}
  }

  /* =========================================================
     NOVA VAULT & DAILY FORTUNE WHEEL MODALS
     ========================================================= */

  let activeDepositMethod = "bKash";

  function ensureModalsCreated() {
    if (document.getElementById("novaVaultModal")) return;

    // Vault Modal
    const vaultModal = document.createElement("div");
    vaultModal.id = "novaVaultModal";
    vaultModal.className = "nova-modal-backdrop";
    vaultModal.innerHTML =
      '<div class="nova-modal">' +
        '<button type="button" class="nova-modal-close" id="vaultCloseBtn" aria-label="Close">✕</button>' +
        '<div class="modal-head">' +
          '<div style="font-size:32px">🏦</div>' +
          '<div>' +
            '<h2>Nova Vault & VIP Rewards</h2>' +
            '<p>Deposit simulations, gift card redemptions, and VIP loyalty status.</p>' +
          '</div>' +
        '</div>' +
        '<div class="modal-tabs">' +
          '<button class="modal-tab-btn active" data-tab="tabDeposit">💳 Deposit Simulator</button>' +
          '<button class="modal-tab-btn" data-tab="tabRedeem">🎁 Redeem Store</button>' +
          '<button class="modal-tab-btn" data-tab="tabVip">👑 VIP Club</button>' +
          '<button class="modal-tab-btn" data-tab="tabHistory">📜 Ledger</button>' +
        '</div>' +
        '<div class="tab-pane active" id="tabDeposit">' +
          '<h3 style="font-size:14px;color:var(--text-2);margin-bottom:10px">SELECT PAYMENT METHOD</h3>' +
          '<div class="pay-methods-grid">' +
            '<div class="pay-method-btn selected" data-method="bKash">' +
              '<div class="pm-icon">📱</div><b>bKash</b><small>Fast Mobile Pay</small>' +
            '</div>' +
            '<div class="pay-method-btn" data-method="Nagad">' +
              '<div class="pm-icon">⚡</div><b>Nagad</b><small>Digital Post</small>' +
            '</div>' +
            '<div class="pay-method-btn" data-method="Visa/Card">' +
              '<div class="pm-icon">💳</div><b>Card</b><small>Visa / Master</small>' +
            '</div>' +
            '<div class="pay-method-btn" data-method="USDT">' +
              '<div class="pm-icon">💎</div><b>Crypto</b><small>USDT TRC-20</small>' +
            '</div>' +
          '</div>' +
          '<h3 style="font-size:14px;color:var(--text-2);margin-bottom:10px">SELECT TOP-UP PACKAGE</h3>' +
          '<div class="packages-grid" id="depositPackagesGrid"></div>' +
        '</div>' +
        '<div class="tab-pane" id="tabRedeem">' +
          '<div class="redeem-grid" id="redeemStoreGrid"></div>' +
        '</div>' +
        '<div class="tab-pane" id="tabVip">' +
          '<div class="vip-tier-list" id="vipTierList"></div>' +
        '</div>' +
        '<div class="tab-pane" id="tabHistory">' +
          '<div class="ledger-list" id="vaultHistoryList"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(vaultModal);

    // Fortune Wheel Modal
    const wheelModal = document.createElement("div");
    wheelModal.id = "novaWheelModal";
    wheelModal.className = "nova-modal-backdrop";
    wheelModal.innerHTML =
      '<div class="nova-modal" style="max-width:440px;text-align:center">' +
        '<button type="button" class="nova-modal-close" id="wheelCloseBtn" aria-label="Close">✕</button>' +
        '<h2 style="font-size:24px;margin-bottom:4px">🎡 Daily Fortune Wheel</h2>' +
        '<p style="color:var(--text-2);font-size:13px;margin-bottom:18px">Spin once daily for free NovaCoins, Gems & Multipliers!</p>' +
        '<div class="wheel-container">' +
          '<div class="wheel-wrapper">' +
            '<div class="wheel-pointer"></div>' +
            '<canvas id="wheelCanvas" width="320" height="320"></canvas>' +
          '</div>' +
          '<button type="button" class="wheel-spin-btn" id="wheelActionBtn">SPIN THE WHEEL</button>' +
          '<p id="wheelTimerText" style="margin-top:10px;font-size:12px;color:var(--text-muted)"></p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wheelModal);

    // Bind Close buttons
    document.getElementById("vaultCloseBtn").addEventListener("click", closeVaultModal);
    document.getElementById("wheelCloseBtn").addEventListener("click", closeWheelModal);

    vaultModal.addEventListener("click", function (e) {
      if (e.target === vaultModal) closeVaultModal();
    });
    wheelModal.addEventListener("click", function (e) {
      if (e.target === wheelModal) closeWheelModal();
    });

    // Bind Vault Tab Switching
    vaultModal.querySelectorAll(".modal-tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        vaultModal.querySelectorAll(".modal-tab-btn").forEach(function (b) { b.classList.remove("active"); });
        vaultModal.querySelectorAll(".tab-pane").forEach(function (p) { p.classList.remove("active"); });
        btn.classList.add("active");
        const pane = document.getElementById(btn.dataset.tab);
        if (pane) pane.classList.add("active");
        if (window.NovaAudio) window.NovaAudio.playClick();
      });
    });

    // Bind Payment Method Selector
    vaultModal.querySelectorAll(".pay-method-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        vaultModal.querySelectorAll(".pay-method-btn").forEach(function (b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
        activeDepositMethod = btn.dataset.method;
        if (window.NovaAudio) window.NovaAudio.playClick();
      });
    });

    // Populate Deposit Packages
    populateDepositPackages();
    // Populate Redeem Store
    populateRedeemStore();
    // Populate VIP Tiers
    populateVipTiers();
    // Populate Ledger
    populateLedger();
    // Setup Wheel Canvas
    setupWheel();
  }

  function populateDepositPackages() {
    const grid = document.getElementById("depositPackagesGrid");
    if (!grid || !window.NovaWallet) return;

    grid.innerHTML = window.NovaWallet.DEPOSIT_PACKAGES.map(function (pkg) {
      const hl = pkg.bonus ? " highlight" : "";
      return '<div class="pkg-card' + hl + '" data-pkg="' + pkg.id + '">' +
        (pkg.bonus ? '<div class="pkg-badge">' + pkg.bonus + '</div>' : "") +
        '<div class="pkg-price">$' + pkg.usd + ' <span style="font-size:12px;color:var(--text-2);font-weight:400">(৳' + pkg.bdt + ')</span></div>' +
        '<div class="pkg-coins">+' + pkg.coins.toLocaleString() + ' 🪙 NovaCoins</div>' +
        '<div class="pkg-gems">+' + pkg.gems + ' 💎 Gems</div>' +
        '<button class="btn btn-primary" style="width:100%;margin-top:10px;padding:6px;font-size:12px">Instant Top-Up</button>' +
      '</div>';
    }).join("");

    grid.querySelectorAll(".pkg-card").forEach(function (card) {
      card.addEventListener("click", function () {
        const pkgId = card.dataset.pkg;
        if (window.NovaWallet) {
          const receipt = window.NovaWallet.simulateDeposit(activeDepositMethod, pkgId);
          toast("✅ " + receipt.coinsAdded + " Top-Up Confirmed! (TX: " + receipt.txCode + ")");
          populateLedger();
          populateVipTiers();
        }
      });
    });
  }

  function populateRedeemStore() {
    const grid = document.getElementById("redeemStoreGrid");
    if (!grid || !window.NovaWallet) return;

    grid.innerHTML = window.NovaWallet.REDEEM_ITEMS.map(function (item) {
      const isCoins = item.type === "coins";
      const costStr = item.cost.toLocaleString() + (isCoins ? " 🪙" : " 💎");
      const costCls = isCoins ? "redeem-cost" : "redeem-cost gems";
      return '<div class="redeem-card">' +
        '<div class="redeem-icon">' + item.icon + '</div>' +
        '<div class="redeem-title">' + item.title + '</div>' +
        '<div class="redeem-brand">' + item.brand + '</div>' +
        '<div class="' + costCls + '">' + costStr + '</div>' +
        '<button class="btn-redeem" data-redeem="' + item.id + '">Claim Reward</button>' +
      '</div>';
    }).join("");

    grid.querySelectorAll(".btn-redeem").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.dataset.redeem;
        if (window.NovaWallet) {
          const res = window.NovaWallet.simulateRedeem(id);
          if (res.success) {
            toast("🎉 Redeemed! Voucher Code: " + res.code);
            populateLedger();
          } else {
            toast("⚠️ " + res.msg);
          }
        }
      });
    });
  }

  function populateVipTiers() {
    const list = document.getElementById("vipTierList");
    if (!list || !window.NovaWallet) return;

    const data = window.NovaWallet.load();
    const currentTier = window.NovaWallet.getTier(data.xp);

    list.innerHTML = window.NovaWallet.TIERS.map(function (tier) {
      const isCur = tier.id === currentTier.id;
      return '<div class="vip-tier-row' + (isCur ? ' current' : '') + '">' +
        '<div class="vip-tier-info">' +
          '<div class="vip-tier-icon">' + tier.icon + '</div>' +
          '<div>' +
            '<div class="vip-tier-name" style="color:' + tier.color + '">' + tier.name + (isCur ? ' (Active)' : '') + '</div>' +
            '<div class="vip-tier-perk">' + tier.minXp + ' XP Requirement · ' + tier.bonus + ' Bonus Multiplier</div>' +
          '</div>' +
        '</div>' +
        (isCur ? '<b style="color:#00d5ff;font-size:13px">CURRENT TIER</b>' : '<span style="color:var(--text-muted);font-size:12px">Locked</span>') +
      '</div>';
    }).join("");
  }

  function populateLedger() {
    const list = document.getElementById("vaultHistoryList");
    if (!list || !window.NovaWallet) return;

    const data = window.NovaWallet.load();
    if (!data.history || !data.history.length) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px">No transaction history yet.</p>';
      return;
    }

    list.innerHTML = data.history.map(function (tx) {
      const cls = tx.type === "credit" ? "ledger-amt credit" : "ledger-amt debit";
      return '<div class="ledger-row">' +
        '<div>' +
          '<div class="ledger-desc">' + tx.desc + '</div>' +
          '<div class="ledger-date">' + tx.date + ' · ID: ' + tx.id + '</div>' +
        '</div>' +
        '<div class="' + cls + '">' + tx.amount + '</div>' +
      '</div>';
    }).join("");
  }

  function openVaultModal(initialTab) {
    ensureModalsCreated();
    const m = document.getElementById("novaVaultModal");
    if (!m) return;
    populateVipTiers();
    populateLedger();
    m.classList.add("open");
  }

  function closeVaultModal() {
    const m = document.getElementById("novaVaultModal");
    if (m) m.classList.remove("open");
  }

  /* Wheel Drawing & Spinning Physics */
  let wheelCanvas, wheelCtx;
  let wheelAngle = 0;
  let wheelSpinning = false;

  function setupWheel() {
    wheelCanvas = document.getElementById("wheelCanvas");
    if (!wheelCanvas) return;
    wheelCtx = wheelCanvas.getContext("2d");
    drawWheel();

    const spinBtn = document.getElementById("wheelActionBtn");
    const timerText = document.getElementById("wheelTimerText");
    if (spinBtn) {
      const ready = window.NovaWallet && window.NovaWallet.canSpin();
      spinBtn.disabled = !ready;
      if (!ready && timerText) timerText.textContent = "Come back tomorrow for your next free spin!";

      spinBtn.addEventListener("click", function () {
        if (wheelSpinning || (window.NovaWallet && !window.NovaWallet.canSpin())) return;
        spinWheel();
      });
    }
  }

  function drawWheel() {
    if (!wheelCtx || !wheelCanvas || !window.NovaWallet) return;
    const ctx = wheelCtx;
    const sectors = window.NovaWallet.WHEEL_SECTORS;
    const num = sectors.length;
    const arc = (Math.PI * 2) / num;
    const cx = 160, cy = 160, r = 150;

    ctx.clearRect(0, 0, 320, 320);

    for (let i = 0; i < num; i++) {
      const angle = wheelAngle + i * arc;
      const s = sectors[i];

      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + arc);
      ctx.closePath();
      ctx.fill();

      // Outer border arc
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text labels
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + arc / 2);
      ctx.fillStyle = s.text;
      ctx.font = "bold 13px Orbitron, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(s.label, r - 20, 5);
      ctx.restore();
    }

    // Center hub
    ctx.shadowColor = "#7c4dff";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#101930";
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#00d5ff";
    ctx.font = "bold 14px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NOVA", cx, cy);
  }

  function spinWheel() {
    if (wheelSpinning || !window.NovaWallet) return;
    wheelSpinning = true;

    const spinBtn = document.getElementById("wheelActionBtn");
    if (spinBtn) spinBtn.disabled = true;

    const sectors = window.NovaWallet.WHEEL_SECTORS;
    const num = sectors.length;
    const arc = (Math.PI * 2) / num;

    // Pick winning sector
    const winningIndex = Math.floor(Math.random() * num);
    const targetSector = sectors[winningIndex];

    // Pointer is at TOP (-PI/2)
    const targetAngle = (Math.PI * 3 / 2) - (winningIndex * arc + arc / 2);
    const fullRotations = Math.PI * 2 * (6 + Math.floor(Math.random() * 3));
    const totalRotation = fullRotations + (targetAngle - (wheelAngle % (Math.PI * 2)));

    const startAngle = wheelAngle;
    const duration = 4500;
    const startTime = performance.now();
    let lastTickAngle = startAngle;

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quintic ease-out deceleration curve
      const eased = 1 - Math.pow(1 - progress, 4);

      wheelAngle = startAngle + totalRotation * eased;
      drawWheel();

      // Audio tick on sector crossings
      if (Math.abs(wheelAngle - lastTickAngle) >= arc) {
        if (window.NovaAudio) window.NovaAudio.playWheelTick();
        lastTickAngle = wheelAngle;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        wheelSpinning = false;
        window.NovaWallet.recordSpin();

        if (targetSector.coins) {
          window.NovaWallet.addCoins(targetSector.coins, "Daily Fortune Wheel Prize", 50);
        }
        if (targetSector.gems) {
          window.NovaWallet.addGems(targetSector.gems, "Daily Fortune Wheel Gem Prize");
        }

        if (window.NovaAudio) window.NovaAudio.playFanfare();
        toast("🎉 YOU WON: " + targetSector.label + "!");

        const timerText = document.getElementById("wheelTimerText");
        if (timerText) timerText.textContent = "Daily reward claimed! Next spin in 24 hours.";
      }
    }
    requestAnimationFrame(animate);
  }

  function openWheelModal() {
    ensureModalsCreated();
    const m = document.getElementById("novaWheelModal");
    if (!m) return;
    m.classList.add("open");
    drawWheel();
  }

  function closeWheelModal() {
    const m = document.getElementById("novaWheelModal");
    if (m) m.classList.remove("open");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initAnnouncement();
    initLiveTicker();
    initFavourites();
    initHome();
    initGamesPage();
    initGamePage();
    initAds();
    initRandomButton();
    initBackToTop();
    initPWA();
    ensureModalsCreated();
    document.querySelectorAll("[data-site-name]").forEach(function (el) { el.textContent = SITE_CONFIG.name; });
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  });

  return {
    getConfig: getConfig,
    saveConfig: saveConfig,
    toast: toast,
    renderGames: renderGames,
    trackPlay: trackPlay,
    basePath: basePath,
    openVaultModal: openVaultModal,
    openWheelModal: openWheelModal
  };
})();
