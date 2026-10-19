"use strict";

const GVP = (function () {

  const CONFIG_KEY = "gvp_config";
  const GAME_LIMIT_KEY = "gvp_plays";
  const RECENT_KEY = "gvp_recent";
  const RATINGS_KEY = "gvp_ratings";

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

  function basePath() {
    const p = location.pathname.replace(/\\/g, "/");
    if (/\/(pages|admin)(\/|$)/.test(p)) return "../";
    return "./";
  }

  function playURL(id) {
    return basePath() + "pages/play.html?id=" + encodeURIComponent(id);
  }

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

  function gameCardHTML(g) {
    const thumb = g.thumb
      ? '<img src="' + basePath() + g.thumb + '" alt="' + g.title + '" loading="lazy" width="400" height="225">'
      : "";
    const thumbClass = g.thumb ? "game-thumb" : "game-thumb emoji-only";
    const myRating = getRating(g.id);
    const ratingBit = myRating
      ? '<span class="card-stars" title="Apnar rating: ' + myRating + '/5">' + starsHTML(myRating) + "</span>"
      : "";
    const catBadge = '<span class="cat-badge badge-' + g.category + '">' + (CATEGORIES.find(function (c) { return c.id === g.category; }) || { icon: "" }).icon + "</span>";
    return '<article class="game-card">' +
      '<div class="' + thumbClass + '" style="background:' + (g.thumb ? "var(--raised)" : "linear-gradient(135deg," + g.color + "33," + g.color + "14)") + '">' +
      (thumb || g.icon) + catBadge + '</div>' +
      '<div class="game-body">' +
      '<h3>' + g.title + '</h3>' +
      '<p>' + g.description + '</p>' +
      '<div class="game-meta"><span class="tag">' + g.players + '</span><span class="tag">' + g.tags.slice(0, 2).join(", ") + '</span>' + ratingBit + '</div>' +
      '<a class="play-btn" href="' + playURL(g.id) + '">▶ KHELN</a>' +
      '</div></article>';
  }

  function renderGames(targetId, list) {
    const el = document.getElementById(targetId);
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<div class="empty"><div class="big">🎮</div><p>Kono game pawa jacche na ekhon.</p></div>';
      return;
    }
    el.innerHTML = list.map(gameCardHTML).join("");
  }

  function renderCategories(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.innerHTML = CATEGORIES.map(function (c) {
      const count = getGamesByCategory(c.id).length;
      return '<a class="cat-card" href="' + basePath() + 'pages/games.html?cat=' + c.id + '">' +
        '<span class="cat-count">' + count + ' GAMES</span>' +
        '<div class="cat-icon">' + c.icon + '</div>' +
        '<h3>' + c.title + '</h3><p>' + c.desc + '</p></a>';
    }).join("");
  }

  function renderCategoryShortcuts(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const pills = CATEGORIES.map(function (c) {
      return '<a class="cat-pill" href="' + basePath() + 'pages/games.html?cat=' + c.id + '">' + c.icon + ' ' + c.title + '</a>';
    });
    pills.push('<a class="cat-pill" href="' + basePath() + 'pages/games.html">🕹️ All Games</a>');
    el.innerHTML = pills.join("");
  }

  function getRecentGames() {
    try {
      const ids = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
      return ids.map(getGameById).filter(function (g) { return g && g.enabled; }).slice(0, 4);
    } catch (e) { return []; }
  }

  function initHome() {
    renderCategories("catGrid");
    renderCategoryShortcuts("catShortcuts");
    renderGames("featuredGrid", getFeaturedGames().slice(0, 8));
    renderGames("newGrid", getNewGames(4));
    renderGames("eduGrid", getEducationalPicks(4));
    const recent = getRecentGames();
    const recentSection = document.getElementById("recentSection");
    if (recentSection) {
      if (recent.length) {
        renderGames("recentGrid", recent);
        recentSection.hidden = false;
      }
    }
    const stat = document.getElementById("statGames");
    if (stat) stat.textContent = GAMES.filter(function (g) { return g.enabled; }).length;
    initMotion();
  }

  function initMotion() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

    document.querySelectorAll(".filter-btn").forEach(function (b) {
      if (b.dataset.cat === activeCat) b.classList.add("active");
      const catCount = b.dataset.cat === "all"
        ? GAMES.filter(function (g) { return g.enabled; }).length
        : getGamesByCategory(b.dataset.cat).length;
      const cnt = document.createElement("span");
      cnt.className = "fcount";
      cnt.textContent = catCount;
      b.appendChild(cnt);
      b.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        activeCat = b.dataset.cat;
        apply();
      });
    });

    function apply() {
      const q = (search && search.value || "").trim().toLowerCase();
      let list = GAMES.filter(function (g) { return g.enabled; });
      if (activeCat !== "all") list = list.filter(function (g) { return g.category === activeCat; });
      if (q) {
        list = list.filter(function (g) {
          return (g.title + " " + g.description + " " + g.tags.join(" ")).toLowerCase().indexOf(q) !== -1;
        });
      }
      renderGames("allGamesGrid", list);
      const c = document.getElementById("gameCount");
      if (c) c.textContent = list.length;
    }

    if (search) search.addEventListener("input", apply);
    apply();
  }

  function initGamePage() {
    const wrap = document.getElementById("gamePlayArea");
    if (!wrap) return;
    const id = wrap.dataset.game;
    const g = getGameById(id);
    if (!g) {
      wrap.innerHTML = '<div class="empty"><div class="big">😕</div><p>Ei game ti pawa jacche na.</p><a class="btn btn-primary" href="' + basePath() + 'pages/games.html" style="margin-top:14px">Shob Game Dekhun</a></div>';
      return;
    }
    document.title = g.title + " — Play Free Online | " + SITE_CONFIG.name;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", g.description + " — " + SITE_CONFIG.name + " theke free online kheln.");
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
      '<div class="frame-skeleton"><div class="sk-spinner"></div><div class="sk-text">Game load hocche...</div></div>' +
      '<iframe src="' + basePath() + g.iframe + '" title="' + g.title + '" loading="lazy" allowfullscreen sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"></iframe>';
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

    const share = document.getElementById("shareBtn");
    if (share) {
      share.addEventListener("click", function () {
        const url = location.href;
        if (navigator.share) {
          navigator.share({ title: g.title, url: url }).catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () { toast("Link copy hoyeche!"); });
        } else {
          toast("URL bar theke link copy kore nen.");
        }
      });
    }
    const copy = document.getElementById("copyBtn");
    if (copy) {
      copy.addEventListener("click", function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(location.href).then(function () { toast("Link copy hoyeche!"); });
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
      let html = '<span class="rating-label">Apnar rating:</span><span class="rating-stars">';
      for (let i = 1; i <= 5; i++) {
        html += '<button type="button" class="star' + (i <= cur ? " on" : "") + '" data-n="' + i + '" aria-label="' + i + ' star">&#9733;</button>';
      }
      html += "</span>";
      if (getRating(g.id)) html += '<span class="rating-thanks">Dhonnobad!</span>';
      box.innerHTML = html;
      box.querySelectorAll(".star").forEach(function (s) {
        s.addEventListener("click", function () {
          setRating(g.id, parseInt(s.dataset.n, 10));
          toast("Rating save hoyeche!");
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
        toast("🎲 " + pick.title + " khelcho!");
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

  let adsenseLoaded = false;
  let lastAdPush = 0;

  function loadAdsense(client) {
    if (adsenseLoaded) return;
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + client;
    document.head.appendChild(s);
    adsenseLoaded = true;
  }

  function isRealClient(id) {
    return !!id && /^ca-pub-\d{16}$/.test(String(id).trim());
  }

  function isRealSlot(id) {
    return !!id && /^\d+$/.test(String(id).trim());
  }

  function initAds() {
    const cfg = getConfig();
    const slots = document.querySelectorAll(".ad-slot");
    if (!cfg.adsEnabled || !isRealClient(cfg.adsenseClient)) {
      slots.forEach(function (el) {
        if (!cfg.adsEnabled) el.style.display = "none";
        else {
          const inner = el.querySelector(".ad-inner");
          if (inner) inner.innerHTML = '<div class="ad-placeholder">📢 Ad slot ready — admin control panel theke AdSense Client ID ar Slot ID set korle ekhane ad cholbe.</div>';
        }
      });
      return;
    }

    loadAdsense(cfg.adsenseClient.trim());

    const slotFor = function (el) {
      if (el.classList.contains("ad-top")) return cfg.adsenseSlotTop;
      if (el.classList.contains("ad-mid")) return cfg.adsenseSlotMid;
      return cfg.adsenseSlotBottom || cfg.adsenseSlotMid || cfg.adsenseSlotTop;
    };

    const minGap = (Number(cfg.minSecondsBetweenAds) || 0) * 1000;

    const pushAd = function (slotEl) {
      if (slotEl.dataset.adPushed === "1") return;
      const now = Date.now();
      if (minGap > 0 && now - lastAdPush < minGap) {
        setTimeout(function () { pushAd(slotEl); }, minGap - (now - lastAdPush));
        return;
      }
      const ins = slotEl.querySelector("ins.adsbygoogle");
      if (!ins) return;
      ins.setAttribute("data-ad-client", cfg.adsenseClient.trim());
      const slotId = isRealSlot(slotFor(slotEl)) ? slotFor(slotEl).trim() : "";
      if (slotId) ins.setAttribute("data-ad-slot", slotId);
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");
      slotEl.dataset.adPushed = "1";
      lastAdPush = now;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {}
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            pushAd(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "200px" });
      slots.forEach(function (s) { io.observe(s); });
    } else {
      slots.forEach(pushAd);
    }
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

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initAnnouncement();
    initHome();
    initGamesPage();
    initGamePage();
    initAds();
    initRandomButton();
    initBackToTop();
    initPWA();
    document.querySelectorAll("[data-site-name]").forEach(function (el) { el.textContent = SITE_CONFIG.name; });
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  });

  return {
    getConfig: getConfig,
    saveConfig: saveConfig,
    toast: toast,
    renderGames: renderGames,
    trackPlay: trackPlay,
    basePath: basePath
  };
})();
