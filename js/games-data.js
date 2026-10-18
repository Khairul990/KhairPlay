"use strict";

const SITE_CONFIG = {
  name: "PlayNova",
  tagline: "PLAY • LEARN • EXPLORE",
  version: "2.0.0-playnova",
  adsenseClient: "ca-pub-XXXXXXXXXXXXXXXX",
  adsenseSlotTop: "",
  adsenseSlotMid: "",
  adsenseSlotBottom: "",
  adsEnabled: false,
  minSecondsBetweenAds: 20,
  announcement: "",
  announcementEnabled: false,
  contactEmail: "khairul2052007@gmail.com",
  adminUser: "",
  adminPass: ""
};

const GAMES = [
  {
    id: "snake",
    title: "Neon Snake",
    category: "kids",
    tags: ["classic", "arcade", "easy"],
    icon: "🐍",
    color: "#20C997",
    thumb: "public/brand/games/thumb-snake.svg",
    addedAt: "2026-09-01",
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
    color: "#00D5FF",
    thumb: "public/brand/games/thumb-tic-tac-toe.svg",
    addedAt: "2026-09-01",
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
    color: "#7C4DFF",
    thumb: "public/brand/games/thumb-memory.svg",
    addedAt: "2026-09-01",
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
    color: "#FFB020",
    thumb: "public/brand/games/thumb-math-quiz.svg",
    addedAt: "2026-09-01",
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
    color: "#00D5FF",
    thumb: "public/brand/games/thumb-word-builder.svg",
    addedAt: "2026-09-01",
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
    color: "#20C997",
    thumb: "public/brand/games/thumb-flag-quiz.svg",
    addedAt: "2026-09-01",
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
    color: "#FF647C",
    thumb: "public/brand/games/thumb-2048.svg",
    addedAt: "2026-09-01",
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
    color: "#FFB020",
    thumb: "public/brand/games/thumb-flappy.svg",
    addedAt: "2026-09-01",
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
    color: "#FF3D9A",
    thumb: "public/brand/games/thumb-breakout.svg",
    addedAt: "2026-09-01",
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
    color: "#FFB020",
    thumb: "public/brand/games/thumb-reaction.svg",
    addedAt: "2026-09-01",
    description: "Koto druto react korte paran? Probar koren — chokh ar dimag ekshathe!",
    players: "1 Player",
    controls: "Click / Tap",
    iframe: "games/reaction.html",
    featured: false,
    enabled: true
  },
  {
    id: "minesweeper",
    title: "Mine Field",
    category: "adult",
    tags: ["puzzle", "mines", "classic"],
    icon: "💣",
    color: "#FF3D9A",
    thumb: "public/brand/games/thumb-minesweeper.svg",
    addedAt: "2026-10-17",
    description: "Mine bhora mati — nirdishto kore shob mine olkai felun, ekta bhul-e shesh!",
    players: "1 Player",
    controls: "Click / Right-click / Tap",
    iframe: "games/minesweeper.html",
    featured: true,
    enabled: true
  },
  {
    id: "simon",
    title: "Color Sequence",
    category: "kids",
    tags: ["memory", "sequence", "brain"],
    icon: "🎨",
    color: "#20C997",
    thumb: "public/brand/games/thumb-simon.svg",
    addedAt: "2026-10-17",
    description: "Ranger sequence mune rakhun ar repeat korun — level barle sequence boro hobe!",
    players: "1 Player",
    controls: "Click / Tap",
    iframe: "games/simon.html",
    featured: true,
    enabled: true
  },
  {
    id: "typing",
    title: "Typing Speed",
    category: "educational",
    tags: ["typing", "english", "speed"],
    icon: "⌨️",
    color: "#7C4DFF",
    thumb: "public/brand/games/thumb-typing.svg",
    addedAt: "2026-10-17",
    description: "60 second-e toto beshi shabdho — typing ar WPM hobe proshikshan!",
    players: "1 Player",
    controls: "Keyboard",
    iframe: "games/typing.html",
    featured: false,
    enabled: true
  }
];

const CATEGORIES = [
  { id: "kids", title: "Kids Games", icon: "🧸", color: "#00D5FF", desc: "Shishuder jonno surakshit, rangin ar anoondokor khel" },
  { id: "educational", title: "Educational Games", icon: "🎓", color: "#FFB020", desc: "Khelar shathe shikhun — gonit, bhasha ar biswer gyan" },
  { id: "adult", title: "Challenge Games", icon: "🎯", color: "#FF3D9A", desc: "Dimag ar chokher porikkha — strategy ar speed" }
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

function getNewGames(limit) {
  return GAMES
    .filter(function (g) { return g.enabled; })
    .slice()
    .sort(function (a, b) { return String(b.addedAt || "").localeCompare(String(a.addedAt || "")); })
    .slice(0, limit || 4);
}

function getEducationalPicks(limit) {
  return getGamesByCategory("educational").slice(0, limit || 4);
}
