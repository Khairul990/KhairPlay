"use strict";

const SITE_CONFIG = {
  name: "KhairPlay",
  tagline: "Fun Games for Everyone",
  version: "1.1.0",
  adsenseClient: "ca-pub-XXXXXXXXXXXXXXXX",
  adsenseSlotTop: "",
  adsenseSlotMid: "",
  adsenseSlotBottom: "",
  adsEnabled: true,
  minSecondsBetweenAds: 20,
  announcement: "",
  announcementEnabled: false,
  contactEmail: "hello@khairplay.com",
  adminUser: "admin",
  adminPass: "REMOVED"
};

const GAMES = [
  {
    id: "snake",
    title: "Neon Snake",
    category: "kids",
    tags: ["classic", "arcade", "easy"],
    icon: "🐍",
    color: "#22c55e",
    description: "Classic snake game — kheye kheye boro hoye ja, deewar laagbe na!",
    players: "1 Player",
    controls: "Arrow keys / Swipe",
    iframe: "games/snake.html",
    featured: true,
    enabled: true
  },
  {
    id: "tic-tac-toe",
    title: "Tic Tac Toe",
    category: "kids",
    tags: ["puzzle", "2-player", "quick"],
    icon: "⭕",
    color: "#3b82f6",
    description: "Dui jon mile X-O kheln — 3-tai nirdishto line banan jeetar jonno.",
    players: "1-2 Players",
    controls: "Click / Tap",
    iframe: "games/tic-tac-toe.html",
    featured: true,
    enabled: true
  },
  {
    id: "memory",
    title: "Memory Match",
    category: "kids",
    tags: ["memory", "cards", "brain"],
    icon: "🃏",
    color: "#a855f7",
    description: "Card ghurai dekhun, match kore din — smruti shokti barbe!",
    players: "1 Player",
    controls: "Click / Tap",
    iframe: "games/memory.html",
    featured: true,
    enabled: true
  },
  {
    id: "math-quiz",
    title: "Math Whiz",
    category: "educational",
    tags: ["math", "quiz", "learning"],
    icon: "🧮",
    color: "#f59e0b",
    description: "Hishab-er porikkha! Plus, minus, gun-gunita te score banaun.",
    players: "1 Player",
    controls: "Click / Tap",
    iframe: "games/math-quiz.html",
    featured: true,
    enabled: true
  },
  {
    id: "word-search",
    title: "Word Builder",
    category: "educational",
    tags: ["english", "vocabulary", "quiz"],
    icon: "📚",
    color: "#06b6d4",
    description: "Ekta chhinno diye shuru — shobd ta thik mune din, boi barbe!",
    players: "1 Player",
    controls: "Keyboard",
    iframe: "games/word-builder.html",
    featured: false,
    enabled: true
  },
  {
    id: "flag-quiz",
    title: "Flag Explorer",
    category: "educational",
    tags: ["geography", "quiz", "general knowledge"],
    icon: "🌍",
    color: "#10b981",
    description: "Jacchaar desher flag chine nin — bishwer gyan barbe!",
    players: "1 Player",
    controls: "Click / Tap",
    iframe: "games/flag-quiz.html",
    featured: false,
    enabled: true
  },
  {
    id: "2048",
    title: "2048",
    category: "adult",
    tags: ["puzzle", "numbers", "strategy"],
    icon: "🔢",
    color: "#ef4444",
    description: "Number guloke soriye 2048 banan — chhoto shuru, boro sochon.",
    players: "1 Player",
    controls: "Arrow keys / Swipe",
    iframe: "games/2048.html",
    featured: true,
    enabled: true
  },
  {
    id: "flappy",
    title: "Flappy Bird",
    category: "kids",
    tags: ["arcade", "reflex", "fun"],
    icon: "🐦",
    color: "#f97316",
    description: "Touch kore udan — obstacle par kore high score toiri korun!",
    players: "1 Player",
    controls: "Click / Space / Tap",
    iframe: "games/flappy.html",
    featured: false,
    enabled: true
  },
  {
    id: "breakout",
    title: "Brick Breaker",
    category: "adult",
    tags: ["arcade", "classic", "action"],
    icon: "🧱",
    color: "#ec4899",
    description: "Ball diye shob brick bhenge din — power-up niye aro shoktishali hon.",
    players: "1 Player",
    controls: "Mouse / Arrow keys",
    iframe: "games/breakout.html",
    featured: false,
    enabled: true
  },
  {
    id: "reaction",
    title: "Reaction Rush",
    category: "adult",
    tags: ["speed", "reflex", "challenge"],
    icon: "⚡",
    color: "#eab308",
    description: "Koto druto react korte paren? Probar koren — chokh ar dimag ekshathe!",
    players: "1 Player",
    controls: "Click / Tap",
    iframe: "games/reaction.html",
    featured: false,
    enabled: true
  }
];

const CATEGORIES = [
  { id: "kids", title: "Kids Games", icon: "🧸", color: "#3b82f6", desc: "Shishuder jonno surakshit, rangin ar anoondokor khel" },
  { id: "educational", title: "Educational Games", icon: "🎓", color: "#f59e0b", desc: "Khelar shathe shikhun — gonit, bhasha ar biswer gyan" },
  { id: "adult", title: "Challenge Games", icon: "🎯", color: "#ef4444", desc: "Dimag ar chokher porikkha — strategy ar speed" }
];

function getGamesByCategory(cat) {
  return GAMES.filter(function (g) { return g.enabled && g.category === cat; });
}

function getFeaturedGames() {
  return GAMES.filter(function (g) { return g.enabled && g.featured; });
}

function getGameById(id) {
  return GAMES.find(function (g) { return g.id === id; }) || null;
}
