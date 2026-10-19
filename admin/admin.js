"use strict";

(function () {

  var DRAFT_KEY = "gvp_admin_draft";
  var SESSION_KEY = "gvp_admin_session";
  var FAIL_KEY = "gvp_admin_fails";
  var MAX_FAILS = 5;
  var LOCK_MS = 30000;

  var cfg = null;
  var games = null;
  var categories = null;
  var editingId = null;

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 3000);
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function loadFromGlobals() {
    cfg = clone(SITE_CONFIG);
    games = clone(GAMES);
    categories = clone(CATEGORIES);
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      var d = JSON.parse(raw);
      if (!d || !d.cfg || !Array.isArray(d.games)) return false;
      cfg = d.cfg;
      games = d.games;
      if (Array.isArray(d.categories) && d.categories.length) categories = d.categories;
      return true;
    } catch (e) { return false; }
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ cfg: cfg, games: games, categories: categories, savedAt: Date.now() }));
    } catch (e) {}
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }

  function isRealClient(id) { return /^ca-pub-\d{16}$/.test(String(id || "").trim()); }
  function isRealSlot(id) { return /^\d+$/.test(String(id || "").trim()); }

  function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------- LOGIN ---------- */

  function sessionOK() {
    try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch (e) { return false; }
  }

  function getFails() {
    try {
      var f = JSON.parse(localStorage.getItem(FAIL_KEY)) || { n: 0, until: 0 };
      return f;
    } catch (e) { return { n: 0, until: 0 }; }
  }

  function setFails(n, until) {
    try { localStorage.setItem(FAIL_KEY, JSON.stringify({ n: n, until: until || 0 })); } catch (e) {}
  }

  function hasCreds() {
    return !!(cfg && cfg.adminUser && cfg.adminPass);
  }

  function showSetupIfNeeded() {
    var needSetup = !hasCreds();
    $("#setupForm").classList.toggle("hidden", !needSetup);
    $("#loginForm").classList.toggle("hidden", needSetup);
    return needSetup;
  }

  function initSetup() {
    $("#setupForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var u = $("#setupUser").value.trim();
      var p = $("#setupPass").value;
      var p2 = $("#setupPass2").value;
      var hint = $("#setupHint");
      if (p.length < 6) {
        hint.textContent = "Password komtute 6 character lagbe.";
        return;
      }
      if (p !== p2) {
        hint.textContent = "Duita password mile na — abar likhun.";
        return;
      }
      cfg.adminUser = u;
      cfg.adminPass = p;
      saveDraft();
      showSetupIfNeeded();
      toast("🔑 Password draft-e save hoyeche. Ekhon login korun.");
    });
  }

  function initLogin() {
    initSetup();
    var form = $("#loginForm");
    var hint = $("#loginHint");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!hasCreds()) {
        hint.textContent = "⚠️ Prothom-e upore nijer password set korun.";
        return;
      }
      var f = getFails();
      if (f.until && Date.now() < f.until) {
        hint.textContent = "🔒 Khub beshi bhar noy — 30 second por abar cheshta korun.";
        return;
      }
      var u = $("#loginUser").value.trim();
      var p = $("#loginPass").value;
      if (u === cfg.adminUser && p === cfg.adminPass) {
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e2) {}
        setFails(0, 0);
        showApp();
      } else {
        var n = (f.n || 0) + 1;
        if (n >= MAX_FAILS) {
          setFails(0, Date.now() + LOCK_MS);
          hint.textContent = "🔒 5 bar bhul — 30 second lock.";
          n = 0;
        } else {
          setFails(n, 0);
          hint.textContent = "❌ Nam ba password bhul (" + n + "/5).";
        }
      }
    });
  }

  function showApp() {
    $("#loginScreen").classList.add("hidden");
    $("#appScreen").classList.remove("hidden");
    renderAll();
  }

  function logout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    location.reload();
  }

  /* ---------- TABS ---------- */

  function initTabs() {
    $all(".tab-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        $all(".tab-btn").forEach(function (x) { x.classList.remove("active"); });
        $all(".tab-panel").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        var panel = document.getElementById(b.dataset.tab);
        if (panel) panel.classList.add("active");
      });
    });
  }

  /* ---------- DASHBOARD ---------- */

  function renderDashboard() {
    var enabled = games.filter(function (g) { return g.enabled; }).length;
    var featured = games.filter(function (g) { return g.enabled && g.featured; }).length;
    var plays = 0;
    try {
      var p = JSON.parse(localStorage.getItem("gvp_plays"));
      plays = (p && p.count) || 0;
    } catch (e) {}

    $("#statGames").textContent = enabled + "/" + games.length;
    $("#statFeatured").textContent = featured;
    $("#statPlays").textContent = plays;
    var adOK = isRealClient(cfg.adsenseClient);
    $("#statAds").textContent = adOK ? "✅ Live" : "⏳ Setup pending";

    var bests = [
      ["🐍 Neon Snake", "gvp_snake_best"],
      ["🧮 Math Whiz", "gvp_math_best"],
      ["🌍 Flag Explorer", "gvp_flag_best"],
      ["📚 Word Builder", "gvp_word_best"],
      ["🔢 2048", "gvp_2048_best"],
      ["🐦 Flappy Bird", "gvp_flappy_best"],
      ["🧱 Brick Breaker", "gvp_breakout_best"],
      ["⚡ Reaction Rush", "gvp_reaction_best"],
      ["💣 Mine Field", "gvp_mines_best"],
      ["🎨 Color Sequence", "gvp_simon_best"],
      ["⌨️ Typing Speed", "gvp_typing_best"],
      ["🧊 Block Fall", "gvp_block_best"],
      ["🔡 Hangman", "gvp_hangman_best"],
      ["🔴 Connect Four", "gvp_c4_best"],
      ["🔨 Whack-a-Mole", "gvp_whack_best"],
      ["🚀 Space Shooter", "gvp_space_best"],
      ["🏃 Endless Runner", "gvp_runner_best"],
      ["🏎️ Racing Challenge", "gvp_racing_best"],
      ["🎮 Platform Adventure", "gvp_platform_best"],
      ["🏰 Tower Defense", "gvp_td_best"],
      ["🔢 Slide Puzzle 3x3", "gvp_slide_best_3"],
      ["🔢 Slide Puzzle 4x4", "gvp_slide_best_4"],
      ["💡 Lights Out 4x4", "gvp_lights_best_4"],
      ["💡 Lights Out 5x5", "gvp_lights_best_5"]
    ];
    var html = "";
    var any = false;
    bests.forEach(function (b) {
      var v = null;
      try { v = localStorage.getItem(b[1]); } catch (e) {}
      if (v) {
        any = true;
        html += '<div class="stat-box"><b>' + esc(v) + '</b><span>' + b[0] + '</span></div>';
      }
    });
    var wrap = $("#bestScores");
    if (!any) wrap.innerHTML = '<p class="mini-note">Ei browser-e ekhono kono high score save hoyni — khele shuru korle ekhane dekhabe.</p>';
    else wrap.innerHTML = '<div class="stats">' + html + '</div>';
    $("#bestNote").style.display = plays > 0 ? "none" : "block";
  }

  /* ---------- GAMES ---------- */

  function renderGames() {
    var wrap = $("#gameList");
    wrap.innerHTML = games.map(function (g) {
      return '<div class="game-row">' +
        '<div class="gicon" style="background:linear-gradient(135deg,' + esc(g.color) + '33,' + esc(g.color) + '14)">' + esc(g.icon) + '</div>' +
        '<div class="gmeta"><b>' + esc(g.title) + '</b><span>' + esc(g.category) + ' · ' + esc(g.id) + (g.featured ? " · ⭐ featured" : "") + '</span></div>' +
        '<span class="badge ' + (g.enabled ? "on" : "off") + '">' + (g.enabled ? "ON" : "OFF") + '</span>' +
        '<div class="gactions">' +
        '<button class="btn small ghost" data-act="edit" data-id="' + esc(g.id) + '">✏️ Edit</button>' +
        '<button class="btn small ghost" data-act="toggle" data-id="' + esc(g.id) + '">' + (g.enabled ? "🚫 Disable" : "✅ Enable") + '</button>' +
        '<a class="btn small ghost" href="../pages/play.html?id=' + encodeURIComponent(g.id) + '" target="_blank">▶ Preview</a>' +
        '<button class="btn small danger" data-act="del" data-id="' + esc(g.id) + '">🗑</button>' +
        '</div></div>';
    }).join("");
  }

  function openGameForm(id) {
    editingId = id || null;
    var box = $("#gameForm");
    box.classList.add("open");
    var g = id ? games.find(function (x) { return x.id === id; }) : null;
    $("#gfTitle").textContent = g ? "✏️ Game Edit: " + g.title : "➕ Notun Game Add";
    $("#gf_id").value = g ? g.id : "";
    $("#gf_id").disabled = !!g;
    $("#gf_title").value = g ? g.title : "";
    $("#gf_category").value = g ? g.category : "kids";
    $("#gf_tags").value = g ? g.tags.join(", ") : "";
    $("#gf_icon").value = g ? g.icon : "🎮";
    $("#gf_color").value = g ? g.color : "#7C4DFF";
    $("#gf_desc").value = g ? g.description : "";
    $("#gf_players").value = g ? g.players : "1 Player";
    $("#gf_controls").value = g ? g.controls : "Click / Tap";
    $("#gf_iframe").value = g ? g.iframe : "games/new-game.html";
    $("#gf_featured").checked = g ? !!g.featured : false;
    $("#gf_enabled").checked = g ? !!g.enabled : true;
    if (box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closeGameForm() {
    $("#gameForm").classList.remove("open");
    editingId = null;
  }

  function saveGameForm() {
    var id = editingId || slugify($("#gf_id").value || $("#gf_title").value);
    var title = $("#gf_title").value.trim();
    if (!id || !title) { toast("ID ar Title duitai lagbe."); return; }
    if (!editingId && games.some(function (g) { return g.id === id; })) {
      toast("Ei ID-te game already ache — arekta ID nen.");
      return;
    }
    var data = {
      id: id,
      title: title,
      category: $("#gf_category").value,
      tags: $("#gf_tags").value.split(",").map(function (t) { return t.trim(); }).filter(Boolean),
      icon: $("#gf_icon").value.trim() || "🎮",
      color: $("#gf_color").value.trim() || "#7C4DFF",
      description: $("#gf_desc").value.trim(),
      players: $("#gf_players").value.trim() || "1 Player",
      controls: $("#gf_controls").value.trim() || "Click / Tap",
      iframe: $("#gf_iframe").value.trim(),
      featured: $("#gf_featured").checked,
      enabled: $("#gf_enabled").checked
    };
    if (editingId) {
      var i = games.findIndex(function (g) { return g.id === editingId; });
      if (i !== -1) games[i] = data;
    } else {
      games.push(data);
    }
    saveDraft();
    renderGames();
    renderDashboard();
    closeGameForm();
    toast("✅ Game save hocche (draft-e). Live korte Export file upload korun.");
    remindPublish();
  }

  function initGamesTab() {
    $("#gameList").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]");
      if (!b) return;
      var id = b.dataset.id;
      if (b.dataset.act === "edit") openGameForm(id);
      else if (b.dataset.act === "toggle") {
        var g = games.find(function (x) { return x.id === id; });
        if (g) {
          g.enabled = !g.enabled;
          saveDraft();
          renderGames();
          renderDashboard();
          toast(g.title + " → " + (g.enabled ? "✅ enabled" : "🚫 disabled"));
          remindPublish();
        }
      } else if (b.dataset.act === "del") {
        var gg = games.find(function (x) { return x.id === id; });
        if (gg && confirm('"' + gg.title + '" delete korte chan? File delete hobe na — sirf list theke sorbe.')) {
          games = games.filter(function (x) { return x.id !== id; });
          saveDraft();
          renderGames();
          renderDashboard();
          if (editingId === id) closeGameForm();
          toast("🗑 Game list theke soriyeche. Export korle live hobe.");
          remindPublish();
        }
      }
    });
    $("#addGameBtn").addEventListener("click", function () { openGameForm(null); });
    $("#gfCancel").addEventListener("click", closeGameForm);
    $("#gfSave").addEventListener("click", saveGameForm);
  }

  /* ---------- SETTINGS ---------- */

  function fillSettings() {
    $("#s_name").value = cfg.name || "";
    $("#s_tagline").value = cfg.tagline || "";
    $("#s_client").value = cfg.adsenseClient || "";
    $("#s_slotTop").value = cfg.adsenseSlotTop || "";
    $("#s_slotMid").value = cfg.adsenseSlotMid || "";
    $("#s_slotBottom").value = cfg.adsenseSlotBottom || "";
    $("#s_adsOn").checked = !!cfg.adsEnabled;
    $("#s_minSec").value = cfg.minSecondsBetweenAds != null ? cfg.minSecondsBetweenAds : 20;
    $("#s_annOn").checked = !!cfg.announcementEnabled;
    $("#s_ann").value = cfg.announcement || "";
    $("#s_email").value = cfg.contactEmail || "";
    $("#s_user").value = cfg.adminUser || "";
    $("#s_pass").value = cfg.adminPass || "";
    updateAdStatus();
  }

  function updateAdStatus() {
    var client = $("#s_client").value.trim();
    var el = $("#adStatus");
    if (isRealClient(client)) {
      el.className = "note ok";
      el.textContent = "✅ Client ID valid mone hocche (" + client + "). Slot ID guloo dile best hobe.";
    } else {
      el.className = "note";
      el.textContent = "⏳ Ekhone real Client ID nai — placeholder ache. AdSense account theke ca-pub-XXXXXXXXXXXXXXXX idta boshan.";
    }
  }

  function initSettingsTab() {
    $("#s_client").addEventListener("input", updateAdStatus);
    $("#settingsForm").addEventListener("submit", function (e) {
      e.preventDefault();
      cfg.name = $("#s_name").value.trim() || "PlayNova";
      cfg.tagline = $("#s_tagline").value.trim();
      cfg.adsenseClient = $("#s_client").value.trim();
      cfg.adsenseSlotTop = $("#s_slotTop").value.trim();
      cfg.adsenseSlotMid = $("#s_slotMid").value.trim();
      cfg.adsenseSlotBottom = $("#s_slotBottom").value.trim();
      cfg.adsEnabled = $("#s_adsOn").checked;
      cfg.minSecondsBetweenAds = Number($("#s_minSec").value) || 20;
      cfg.announcementEnabled = $("#s_annOn").checked;
      cfg.announcement = $("#s_ann").value.trim();
      cfg.contactEmail = $("#s_email").value.trim();
      cfg.adminUser = $("#s_user").value.trim() || cfg.adminUser || "";
      cfg.adminPass = $("#s_pass").value || cfg.adminPass || "";
      saveDraft();
      renderDashboard();
      toast("✅ Settings draft-e save. Export file upload korle live hobe.");
      remindPublish();
    });
  }

  function remindPublish() {
    var el = $("#publishBar");
    el.classList.remove("hidden");
  }

  /* ---------- EXPORT / IMPORT ---------- */

  function buildExportText() {
    var out = '"use strict";\n\n';
    out += 'const SITE_CONFIG = ' + JSON.stringify(cfg, null, 2) + ';\n\n';
    out += 'const GAMES = ' + JSON.stringify(games, null, 2) + ';\n\n';
    out += 'const CATEGORIES = ' + JSON.stringify(categories, null, 2) + ';\n\n';
    out += 'function getGamesByCategory(cat) {\n  return GAMES.filter(function (g) { return g.enabled && g.category === cat; });\n}\n\n';
    out += 'function getFeaturedGames() {\n  return GAMES.filter(function (g) { return g.enabled && g.featured; });\n}\n\n';
    out += 'function getGameById(id) {\n  return GAMES.find(function (g) { return g.id === id; }) || null;\n}\n\n';
    out += 'function getNewGames(limit) {\n  return GAMES\n    .filter(function (g) { return g.enabled; })\n    .slice()\n    .sort(function (a, b) { return String(b.addedAt || "").localeCompare(String(a.addedAt || "")); })\n    .slice(0, limit || 4);\n}\n\n';
    out += 'function getEducationalPicks(limit) {\n  return getGamesByCategory("educational").slice(0, limit || 4);\n}\n';
    return out;
  }

  function exportFile() {
    var text = buildExportText();
    var blob = new Blob([text], { type: "application/javascript;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "games-data.js";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 400);
    toast("⬇️ games-data.js download hoyeche — hosting-e upload korun.");
  }

  function parseDataFile(text) {
    var fn = new Function(text + "\n;return {cfg:SITE_CONFIG, games:GAMES, cats:CATEGORIES};");
    var r = fn();
    if (!r.cfg || !Array.isArray(r.games)) throw new Error("bad file");
    return r;
  }

  function initExportTab() {
    $("#exportBtn").addEventListener("click", exportFile);
    $("#exportPreview").textContent = buildExportText().slice(0, 600) + "\n... (puro file export korle download hobe)";

    $("#importFile").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var r = parseDataFile(String(reader.result));
          cfg = r.cfg;
          games = r.games;
          if (Array.isArray(r.cats) && r.cats.length) categories = r.cats;
          saveDraft();
          renderAll();
          toast("✅ File load hoyeche ar draft-e save.");
        } catch (err) {
          toast("❌ File parse kora gelo na — nischoy eta apnar exported games-data.js?");
        }
      };
      reader.readAsText(file);
    });

    $("#loadLiveBtn").addEventListener("click", function () {
      if (confirm("Draft moriye live file-ta (js/games-data.js) load korben? Apnar unsaved changes delete hobe.")) {
        clearDraft();
        loadFromGlobals();
        renderAll();
        toast("📄 Live file load hoyeche.");
      }
    });

    $("#resetDraftBtn").addEventListener("click", function () {
      if (confirm("Sob draft changes morano — thik ache?")) {
        clearDraft();
        loadFromGlobals();
        renderAll();
        toast("🧹 Draft reset.");
      }
    });
  }

  /* ---------- GUIDE ---------- */

  function initGuide() {
    var checklist = $all("#adsCheck input[type=checkbox]");
    checklist.forEach(function (c, i) {
      try {
        c.checked = localStorage.getItem("gvp_adscheck_" + i) === "1";
      } catch (e) {}
      c.addEventListener("change", function () {
        try { localStorage.setItem("gvp_adscheck_" + i, c.checked ? "1" : "0"); } catch (e) {}
      });
    });
    var copyBtn = $("#copyAdsTxt");
    copyBtn.addEventListener("click", function () {
      var pub = isRealClient(cfg.adsenseClient) ? cfg.adsenseClient.replace("ca-pub-", "") : "ca-pub-XXXXXXXXXXXXXXXX";
      var text = "google.com, pub-" + pub + ", DIRECT, f08c47fec0942fa0";
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () { toast("📋 ads.txt copy hoyeche!"); });
      }
    });
  }

  /* ---------- BOOT ---------- */

  function renderAll() {
    renderDashboard();
    renderGames();
    fillSettings();
    $("#exportPreview").textContent = buildExportText().slice(0, 600) + "\n... (puro file export korle download hobe)";
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadFromGlobals();
    var hadDraft = loadDraft();
    initTabs();
    initLogin();
    initGamesTab();
    initSettingsTab();
    initExportTab();
    initGuide();
    $("#logoutBtn").addEventListener("click", logout);
    if (hadDraft) $("#draftBanner").classList.remove("hidden");
    showSetupIfNeeded();
    if (sessionOK() && hasCreds()) showApp();
  });

})();
