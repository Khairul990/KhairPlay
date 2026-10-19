"use strict";

(function () {
  var KEY = "gvp_progress";
  var LEVEL_STEP = 50;
  var DAILY_GOAL = 3;

  var BADGES = [
    { id: "first", icon: "👶", title: "First Steps", desc: "Play your first game", coins: 100 },
    { id: "five", icon: "🧭", title: "Cyber Explorer", desc: "Play 5 distinct games", coins: 250 },
    { id: "ten", icon: "🗂️", title: "Game Collector", desc: "Experience 10 distinct titles", coins: 500 },
    { id: "all", icon: "👑", title: "Completionist", desc: "Play every game on the platform", coins: 1500 },
    { id: "cat", icon: "🎨", title: "All-Rounder", desc: "Play games across all 3 categories", coins: 300 },
    { id: "lvl5", icon: "⭐", title: "Rising Star", desc: "Reach Level 5 rank", coins: 400 },
    { id: "streak3", icon: "🔥", title: "On Fire", desc: "Maintain a 3-day login streak", coins: 350 },
    { id: "daily", icon: "📅", title: "Daily Champion", desc: "Complete today's daily challenge", coins: 200 }
  ];

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!s || typeof s !== "object") s = {};
    s.xp = s.xp || 0;
    s.badges = s.badges || {};
    s.days = s.days || {};
    s.games = s.games || {};
    return s;
  }

  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  function levelOf(xp) { return Math.floor(xp / LEVEL_STEP) + 1; }
  function xpInLevel(xp) { return xp % LEVEL_STEP; }

  function streakOf(days) {
    var d = new Date();
    var n = 0;
    var t = today();
    if (!(days[t] && days[t].count > 0)) d.setDate(d.getDate() - 1);
    for (var i = 0; i < 400; i++) {
      var k = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
      if (days[k] && days[k].count > 0) n++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function categoriesPlayed(s) {
    var set = {};
    var ids = Object.keys(s.games);
    for (var i = 0; i < ids.length; i++) {
      var g = typeof getGameById === "function" ? getGameById(ids[i]) : null;
      if (g) set[g.category] = true;
    }
    return Object.keys(set).length;
  }

  function totalGames() {
    return typeof GAMES !== "undefined" ? GAMES.filter(function (g) { return g.enabled; }).length : 24;
  }

  function unlock(s, id, list) {
    if (s.badges[id]) return false;
    s.badges[id] = Date.now();
    var b = null;
    for (var i = 0; i < BADGES.length; i++) {
      if (BADGES[i].id === id) b = BADGES[i];
    }
    if (b && list) {
      list.push(b);
      if (window.NovaWallet) {
        window.NovaWallet.addCoins(b.coins || 100, "Achievement: " + b.title, 50);
      }
    }
    return true;
  }

  function checkBadges(s, list) {
    var n = Object.keys(s.games).length;
    var lvl = levelOf(s.xp);
    if (n >= 1) unlock(s, "first", list);
    if (n >= 5) unlock(s, "five", list);
    if (n >= 10) unlock(s, "ten", list);
    if (n >= totalGames()) unlock(s, "all", list);
    if (categoriesPlayed(s) >= 3) unlock(s, "cat", list);
    if (lvl >= 5) unlock(s, "lvl5", list);
    if (streakOf(s.days) >= 3) unlock(s, "streak3", list);
    var t = s.days[today()];
    if (t && t.count >= DAILY_GOAL) unlock(s, "daily", list);
  }

  function addXP(s, amount, badges) {
    var before = levelOf(s.xp);
    s.xp += amount;
    var after = levelOf(s.xp);
    if (after > before) {
      badges.push({ levelUp: after });
      if (window.NovaWallet) {
        window.NovaWallet.addCoins(200 * after, "Level Up to Lv " + after, 100);
      }
    }
    return amount;
  }

  function onPlay(gameId) {
    if (!gameId) return;
    var s = load();
    var badges = [];
    var t = s.days[today()] || { count: 0 };
    var gamesToday = s.days[today()] ? t.games || [] : [];
    var gain = 10;
    if (gamesToday.indexOf(gameId) === -1) gain += 20;
    addXP(s, gain, badges);
    t.count = (t.count || 0) + 1;
    gamesToday.push(gameId);
    t.games = gamesToday;
    s.days[today()] = t;
    s.games[gameId] = (s.games[gameId] || 0) + 1;
    checkBadges(s, badges);
    save(s);
    notify(badges);
    return gain;
  }

  function notify(badges) {
    if (!badges.length) return;
    var wrap = document.createElement("div");
    wrap.className = "xp-toasts";
    badges.forEach(function (b) {
      var el = document.createElement("div");
      el.className = "xp-toast";
      if (b.levelUp) {
        el.innerHTML = "🎉 <b>Rank Advanced to Level " + b.levelUp + "!</b> +Bonus Coins Awarded!";
      } else {
        el.innerHTML = b.icon + " <b>" + b.title + "</b> — " + b.desc + " (+" + (b.coins || 100) + " 🪙)";
      }
      wrap.appendChild(el);
    });
    document.body.appendChild(wrap);
    if (window.NovaAudio) window.NovaAudio.playFanfare();
    setTimeout(function () {
      wrap.classList.add("gone");
      setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 400);
    }, 2800);
  }

  function render(panel) {
    var s = load();
    var lvl = levelOf(s.xp);
    var inLvl = xpInLevel(s.xp);
    var pct = Math.round((inLvl / LEVEL_STEP) * 100);
    var t = s.days[today()] || { count: 0 };
    var played = Object.keys(s.games).length;
    var total = totalGames();
    var streak = streakOf(s.days);
    var html = "";

    html += '<div class="prog-head">';
    html += '<div class="prog-level"><span class="prog-badge">LVL ' + lvl + "</span><div><b>" + s.xp + " XP Total</b><small>" + (LEVEL_STEP - inLvl) + " XP to next rank</small></div></div>";
    html += '<div class="prog-bar"><span style="width:' + pct + '%"></span></div>';
    html += "</div>";

    html += '<div class="prog-stats">';
    html += '<div class="stat-box"><b>' + played + "/" + total + "</b><span>Games Explored</span></div>";
    html += '<div class="stat-box"><b>' + Math.min(t.count, DAILY_GOAL) + "/" + DAILY_GOAL + "</b><span>Daily Target</span></div>";
    html += '<div class="stat-box"><b>' + streak + "</b><span>Days Active Streak 🔥</span></div>";
    html += "</div>";

    var done = 0;
    var badgesHtml = BADGES.map(function (b) {
      var has = !!s.badges[b.id];
      if (has) done++;
      return '<div class="prog-badge-card ' + (has ? "got" : "locked") + '"><span class="pb-icon">' + (has ? b.icon : "🔒") + "</span><b>" + b.title + "</b><small>" + b.desc + "</small></div>";
    }).join("");
    html += '<div class="prog-sub">🏅 Cyber Achievements <span class="prog-count">' + done + "/" + BADGES.length + "</span></div>";
    html += '<div class="prog-badges">' + badgesHtml + "</div>";
    html += '<p class="mini-note">⚡ Your gamer progress, high scores, and virtual coin balance are safely preserved on your local profile.</p>';

    panel.innerHTML = html;
  }

  function init() {
    var area = document.getElementById("gamePlayArea");
    if (area && area.dataset && area.dataset.game) onPlay(area.dataset.game);
    var panel = document.getElementById("progressPanel");
    if (panel) render(panel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.GVPProgress = {
    onPlay: onPlay,
    render: render,
    load: load,
    levelOf: levelOf,
    streakOf: streakOf
  };
})();
