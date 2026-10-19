"use strict";

/**
 * PlayNova VIP Rewards, Payment & Vault Ecosystem (NovaWallet)
 * Features:
 * - Real-time Coin / Gem balance & XP calculation
 * - VIP Tier Progression (Bronze -> Silver -> Gold -> Platinum -> Diamond -> Cyber Legend)
 * - Payment Simulation (bKash, Nagad, Visa/Mastercard, USDT Crypto)
 * - Rewards Store / Gift Card Cashout with claimable codes
 * - Daily Fortune Wheel (Daily Spin) with canvas animation & physics
 * - Real-time live wins marquee generation
 * - In-game coin reward listeners
 */
const NovaWallet = (function () {
  const STORAGE_KEY = "nova_wallet_v2";
  const LAST_SPIN_KEY = "nova_last_spin";

  const TIERS = [
    { id: "bronze", name: "Bronze VIP", minXp: 0, color: "#cd7f32", icon: "🥉", bonus: "1.0x" },
    { id: "silver", name: "Silver VIP", minXp: 500, color: "#c0c0c0", icon: "🥈", bonus: "1.1x" },
    { id: "gold", name: "Gold VIP", minXp: 1500, color: "#ffd700", icon: "🥇", bonus: "1.25x" },
    { id: "platinum", name: "Platinum VIP", minXp: 3500, color: "#00e5ff", icon: "💎", bonus: "1.5x" },
    { id: "diamond", name: "Diamond Master", minXp: 8000, color: "#b983ff", icon: "👑", bonus: "1.75x" },
    { id: "legend", name: "Cyber Legend", minXp: 15000, color: "#ff2a6d", icon: "⚡", bonus: "2.0x" }
  ];

  const DEPOSIT_PACKAGES = [
    { id: "starter", name: "Starter Crate", usd: 5, bdt: 550, coins: 500, gems: 10, bonus: "Popular" },
    { id: "pro", name: "Pro Gamer Pack", usd: 10, bdt: 1100, coins: 1100, gems: 25, bonus: "+10% Bonus" },
    { id: "elite", name: "Elite Cyber Bundle", usd: 25, bdt: 2750, coins: 3000, gems: 75, bonus: "+20% Extra" },
    { id: "champion", name: "Champion Vault", usd: 50, bdt: 5500, coins: 6500, gems: 200, bonus: "+30% High Roller" },
    { id: "titan", name: "Titan Whale Chest", usd: 100, bdt: 11000, coins: 15000, gems: 500, bonus: "MAX VALUE 🔥" }
  ];

  const REDEEM_ITEMS = [
    { id: "steam_10", title: "Steam Wallet $10", cost: 10000, type: "coins", icon: "🎮", brand: "Steam Code" },
    { id: "gplay_10", title: "Google Play $10", cost: 10000, type: "coins", icon: "📱", brand: "Play Store Code" },
    { id: "netflix_1m", title: "Netflix 1-Month HD", cost: 14000, type: "coins", icon: "🎬", brand: "Subscription Gift" },
    { id: "razer_15", title: "Razer Gold $15", cost: 14500, type: "coins", icon: "⚡", brand: "Pin Code" },
    { id: "amazon_25", title: "Amazon eGift $25", cost: 24000, type: "coins", icon: "📦", brand: "Gift Card" },
    { id: "vip_badge", title: "VIP Cyber Avatar Frame", cost: 40, type: "gems", icon: "🛡️", brand: "Permanent Perk" },
    { id: "neon_theme", title: "Ultra Hologram Theme", cost: 25, type: "gems", icon: "✨", brand: "Theme Customizer" }
  ];

  const WHEEL_SECTORS = [
    { label: "100 🪙", coins: 100, gems: 0, color: "#1a2542", text: "#f7f9ff" },
    { label: "5 💎", coins: 0, gems: 5, color: "#7c4dff", text: "#ffffff" },
    { label: "250 🪙", coins: 250, gems: 0, color: "#00d5ff", text: "#080b16" },
    { label: "50 🪙", coins: 50, gems: 0, color: "#111b2f", text: "#f7f9ff" },
    { label: "15 💎", coins: 0, gems: 15, color: "#ff3d9a", text: "#ffffff" },
    { label: "500 🪙", coins: 500, gems: 0, color: "#ffb703", text: "#080b16" },
    { label: "2x XP", coins: 75, gems: 0, xp: 150, color: "#20c997", text: "#080b16" },
    { label: "🔥 1,000 🪙", coins: 1000, gems: 10, color: "#e11d48", text: "#ffffff" }
  ];

  function getInitialData() {
    return {
      coins: 1250,
      gems: 35,
      xp: 220,
      totalEarned: 1250,
      history: [
        { id: "TX-WELCOME", desc: "Welcome Bonus & Starter Pack", date: "Just now", amount: "+1,250 🪙", type: "credit" },
        { id: "TX-GEMINIT", desc: "VIP Pioneer Gems Gift", date: "Just now", amount: "+35 💎", type: "credit" }
      ]
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.coins === "number") return parsed;
      }
    } catch (e) {}
    const init = getInitialData();
    save(init);
    return init;
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
    dispatchChange();
  }

  function dispatchChange() {
    const data = load();
    updateUIElements(data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nova_wallet_update", { detail: data }));
    }
  }

  function getTier(xp) {
    let current = TIERS[0];
    for (let i = 0; i < TIERS.length; i++) {
      if (xp >= TIERS[i].minXp) current = TIERS[i];
    }
    return current;
  }

  function getNextTier(xp) {
    for (let i = 0; i < TIERS.length; i++) {
      if (xp < TIERS[i].minXp) return TIERS[i];
    }
    return null;
  }

  function addCoins(amount, reason, xpAmount) {
    const data = load();
    amount = Math.max(0, Math.floor(amount));
    xpAmount = xpAmount || Math.ceil(amount / 5);
    data.coins += amount;
    data.xp += xpAmount;
    data.totalEarned = (data.totalEarned || 0) + amount;

    const txId = "TX-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    data.history.unshift({
      id: txId,
      desc: reason || "Game Reward",
      date: "Just now",
      amount: "+" + amount.toLocaleString() + " 🪙",
      type: "credit"
    });
    if (data.history.length > 20) data.history.pop();
    save(data);

    if (window.NovaAudio) window.NovaAudio.playCoin();
    showFloatingReward("+" + amount + " 🪙", "coin");
    return data;
  }

  function addGems(amount, reason) {
    const data = load();
    amount = Math.max(0, Math.floor(amount));
    data.gems += amount;
    const txId = "TX-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    data.history.unshift({
      id: txId,
      desc: reason || "Special Gem Award",
      date: "Just now",
      amount: "+" + amount.toLocaleString() + " 💎",
      type: "credit"
    });
    if (data.history.length > 20) data.history.pop();
    save(data);

    if (window.NovaAudio) window.NovaAudio.playFanfare();
    showFloatingReward("+" + amount + " 💎", "gem");
    return data;
  }

  function deductCoins(amount, reason) {
    const data = load();
    if (data.coins < amount) return false;
    data.coins -= amount;
    const txId = "TX-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    data.history.unshift({
      id: txId,
      desc: reason || "Reward Purchase",
      date: "Just now",
      amount: "-" + amount.toLocaleString() + " 🪙",
      type: "debit"
    });
    if (data.history.length > 20) data.history.pop();
    save(data);
    return true;
  }

  function deductGems(amount, reason) {
    const data = load();
    if (data.gems < amount) return false;
    data.gems -= amount;
    const txId = "TX-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    data.history.unshift({
      id: txId,
      desc: reason || "VIP Perk Unlock",
      date: "Just now",
      amount: "-" + amount.toLocaleString() + " 💎",
      type: "debit"
    });
    if (data.history.length > 20) data.history.pop();
    save(data);
    return true;
  }

  function canSpin() {
    try {
      const last = localStorage.getItem(LAST_SPIN_KEY);
      if (!last) return true;
      const lastTime = parseInt(last, 10);
      const diff = Date.now() - lastTime;
      return diff >= 24 * 60 * 60 * 1000;
    } catch (e) {
      return true;
    }
  }

  function getTimeUntilNextSpin() {
    try {
      const last = localStorage.getItem(LAST_SPIN_KEY);
      if (!last) return 0;
      const lastTime = parseInt(last, 10);
      const diff = 24 * 60 * 60 * 1000 - (Date.now() - lastTime);
      return Math.max(0, diff);
    } catch (e) {
      return 0;
    }
  }

  function recordSpin() {
    try {
      localStorage.setItem(LAST_SPIN_KEY, String(Date.now()));
    } catch (e) {}
  }

  function showFloatingReward(text, type) {
    const el = document.createElement("div");
    el.className = "nova-float-reward " + (type || "coin");
    el.innerHTML = text;
    document.body.appendChild(el);
    setTimeout(function () {
      el.classList.add("animate");
    }, 10);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1800);
  }

  function updateUIElements(data) {
    data = data || load();
    const tier = getTier(data.xp);

    const coinEls = document.querySelectorAll(".nova-val-coins");
    coinEls.forEach(function (el) {
      el.textContent = data.coins.toLocaleString();
    });

    const gemEls = document.querySelectorAll(".nova-val-gems");
    gemEls.forEach(function (el) {
      el.textContent = data.gems.toLocaleString();
    });

    const tierEls = document.querySelectorAll(".nova-val-tier");
    tierEls.forEach(function (el) {
      el.textContent = tier.name;
      el.style.color = tier.color;
    });

    const tierIconEls = document.querySelectorAll(".nova-val-tier-icon");
    tierIconEls.forEach(function (el) {
      el.textContent = tier.icon;
    });

    const spinBadges = document.querySelectorAll(".nova-spin-badge");
    const ready = canSpin();
    spinBadges.forEach(function (el) {
      el.style.display = ready ? "inline-flex" : "none";
    });
  }

  // Generate simulated deposit receipt
  function simulateDeposit(method, packageId, accountNumber) {
    const pkg = DEPOSIT_PACKAGES.find(function (p) { return p.id === packageId; }) || DEPOSIT_PACKAGES[0];
    const data = load();
    data.coins += pkg.coins;
    data.gems += pkg.gems;
    data.xp += pkg.usd * 20;

    const txCode = method.toUpperCase().substring(0, 3) + "-" + Math.floor(100000 + Math.random() * 900000);
    const receipt = {
      txCode: txCode,
      method: method,
      pkgName: pkg.name,
      amount: "$" + pkg.usd + " / ৳" + pkg.bdt,
      coinsAdded: "+" + pkg.coins.toLocaleString() + " 🪙",
      gemsAdded: "+" + pkg.gems + " 💎",
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      account: accountNumber || "Direct Instant"
    };

    data.history.unshift({
      id: txCode,
      desc: method.toUpperCase() + " Top-up (" + pkg.name + ")",
      date: "Just now",
      amount: "+" + pkg.coins.toLocaleString() + " 🪙",
      type: "credit"
    });
    if (data.history.length > 20) data.history.pop();
    save(data);

    if (window.NovaAudio) window.NovaAudio.playFanfare();
    showFloatingReward("+" + pkg.coins + " 🪙 Top-Up Success!", "coin");
    return receipt;
  }

  // Generate simulated redeem voucher
  function simulateRedeem(itemId) {
    const item = REDEEM_ITEMS.find(function (it) { return it.id === itemId; });
    if (!item) return { success: false, msg: "Item not found" };

    const data = load();
    if (item.type === "coins") {
      if (data.coins < item.cost) {
        return { success: false, msg: "Insufficient NovaCoins. Need " + (item.cost - data.coins).toLocaleString() + " more." };
      }
      deductCoins(item.cost, "Redeemed: " + item.title);
    } else {
      if (data.gems < item.cost) {
        return { success: false, msg: "Insufficient NovaGems. Need " + (item.cost - data.gems) + " more." };
      }
      deductGems(item.cost, "Redeemed: " + item.title);
    }

    const claimCode = "NV-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    if (window.NovaAudio) window.NovaAudio.playFanfare();

    return {
      success: true,
      item: item,
      code: claimCode,
      date: new Date().toLocaleDateString()
    };
  }

  // Setup message listener for iframe games
  function initGameListener() {
    if (typeof window === "undefined") return;
    window.addEventListener("message", function (event) {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "NOVA_EARN_COINS") {
        const amt = parseInt(event.data.amount, 10) || 10;
        const reason = event.data.reason || "Game High Score Reward";
        addCoins(amt, reason, event.data.xp);
      }
    });
  }

  return {
    TIERS: TIERS,
    DEPOSIT_PACKAGES: DEPOSIT_PACKAGES,
    REDEEM_ITEMS: REDEEM_ITEMS,
    WHEEL_SECTORS: WHEEL_SECTORS,
    load: load,
    save: save,
    getTier: getTier,
    getNextTier: getNextTier,
    addCoins: addCoins,
    addGems: addGems,
    deductCoins: deductCoins,
    deductGems: deductGems,
    canSpin: canSpin,
    getTimeUntilNextSpin: getTimeUntilNextSpin,
    recordSpin: recordSpin,
    simulateDeposit: simulateDeposit,
    simulateRedeem: simulateRedeem,
    updateUIElements: updateUIElements,
    showFloatingReward: showFloatingReward,
    initGameListener: initGameListener
  };
})();

if (typeof window !== "undefined") {
  window.NovaWallet = NovaWallet;
}
