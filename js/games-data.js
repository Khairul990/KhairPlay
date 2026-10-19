"use strict";

const SITE_CONFIG = {
  name: "PlayNova",
  tagline: "PLAY • LEARN • EXPLORE",
  version: "3.0.0-nextgen",
  adsenseClient: "ca-pub-XXXXXXXXXXXXXXXX",
  adsenseSlotTop: "",
  adsenseSlotMid: "",
  adsenseSlotBottom: "",
  adsEnabled: false,
  minSecondsBetweenAds: 20,
  announcement: "⚡ Welcome to PlayNova Next-Gen! Spin the Daily Fortune Wheel to claim free NovaCoins & Gems!",
  announcementEnabled: true,
  contactEmail: "khairul2052007@gmail.com",
  adminUser: "",
  adminPass: ""
};

const GAMES = [
  {
    id: "snake",
    title: "Neon Snake",
    category: "kids",
    tags: ["classic", "arcade", "retro", "easy"],
    icon: "🐍",
    color: "#20C997",
    thumb: "public/brand/games/thumb-snake.svg",
    addedAt: "2026-09-01",
    description: "Navigate the cyber grid, devour glowing energy orbs, and grow your digital serpent without hitting the perimeter walls!",
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
    tags: ["puzzle", "2-player", "strategy", "quick"],
    icon: "⭕",
    color: "#00D5FF",
    thumb: "public/brand/games/thumb-tic-tac-toe.svg",
    addedAt: "2026-09-01",
    description: "The timeless grid battle. Play solo against the AI or challenge a friend in pass-and-play mode to connect 3 in a row.",
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
    tags: ["memory", "cards", "brain", "focus"],
    icon: "🃏",
    color: "#7C4DFF",
    thumb: "public/brand/games/thumb-memory.svg",
    addedAt: "2026-09-01",
    description: "Flip the holographic cards, remember icon locations, and pair matching symbols in minimum moves to sharpen your visual memory.",
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
    tags: ["math", "quiz", "learning", "speed"],
    icon: "🧮",
    color: "#FFB020",
    thumb: "public/brand/games/thumb-math-quiz.svg",
    addedAt: "2026-09-01",
    description: "Test your mental agility! Solve rapid arithmetic equations across addition, subtraction, and multiplication against the clock.",
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
    tags: ["english", "vocabulary", "word", "quiz"],
    icon: "📚",
    color: "#00D5FF",
    thumb: "public/brand/games/thumb-word-builder.svg",
    addedAt: "2026-09-01",
    description: "Construct correct English vocabulary words from scrambled letters and expand your lexicon while climbing the global leaderboard.",
    players: "1 Player",
    controls: "Keyboard / Tap",
    iframe: "games/word-builder.html",
    featured: false,
    enabled: true
  },
  {
    id: "flag-quiz",
    title: "Flag Explorer",
    category: "educational",
    tags: ["geography", "quiz", "world", "knowledge"],
    icon: "🌍",
    color: "#20C997",
    thumb: "public/brand/games/thumb-flag-quiz.svg",
    addedAt: "2026-09-01",
    description: "Embark on a global expedition. Identify national flags across 190+ countries and master world geography trivia.",
    players: "1 Player",
    controls: "Click / Tap",
    iframe: "games/flag-quiz.html",
    featured: false,
    enabled: true
  },
  {
    id: "2048",
    title: "2048 Cyber",
    category: "adult",
    tags: ["puzzle", "numbers", "strategy", "brain"],
    icon: "🔢",
    color: "#FF647C",
    thumb: "public/brand/games/thumb-2048.svg",
    addedAt: "2026-09-01",
    description: "Slide numerical blocks, merge identical values into higher powers of 2, and unlock the legendary 2048 crown tile.",
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
    tags: ["arcade", "reflex", "physics", "fun"],
    icon: "🐦",
    color: "#FFB020",
    thumb: "public/brand/games/thumb-flappy.svg",
    addedAt: "2026-09-01",
    description: "Tap with pinpoint timing to flap wings, maneuver through narrow pipe obstacles, and set unbeatable high scores.",
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
    tags: ["arcade", "classic", "action", "retro"],
    icon: "🧱",
    color: "#FF3D9A",
    thumb: "public/brand/games/thumb-breakout.svg",
    addedAt: "2026-09-01",
    description: "Demolish vibrant neon brick walls with bouncy plasma spheres. Catch multiballs, laser cannons, and extended paddle power-ups.",
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
    tags: ["speed", "reflex", "challenge", "esports"],
    icon: "⚡",
    color: "#FFB020",
    thumb: "public/brand/games/thumb-reaction.svg",
    addedAt: "2026-09-01",
    description: "Benchmark your neurological response time down to milliseconds. Click the instant the signal changes to green!",
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
    tags: ["puzzle", "mines", "classic", "deduction"],
    icon: "💣",
    color: "#FF3D9A",
    thumb: "public/brand/games/thumb-minesweeper.svg",
    addedAt: "2026-10-17",
    description: "Exercise pure mathematical logic to sweep hazardous minefields. Flag hidden charges without triggering a single detonation.",
    players: "1 Player",
    controls: "Click / Right-click / Long-press",
    iframe: "games/minesweeper.html",
    featured: true,
    enabled: true
  },
  {
    id: "simon",
    title: "Color Sequence",
    category: "kids",
    tags: ["memory", "sequence", "brain", "audio"],
    icon: "🎨",
    color: "#20C997",
    thumb: "public/brand/games/thumb-simon.svg",
    addedAt: "2026-10-17",
    description: "Follow the hypnotic rhythmic flashes and synth chimes. Repeat progressively longer color sequences to conquer all stages.",
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
    tags: ["typing", "english", "speed", "productivity"],
    icon: "⌨️",
    color: "#7C4DFF",
    thumb: "public/brand/games/thumb-typing.svg",
    addedAt: "2026-10-17",
    description: "Measure your Words Per Minute (WPM) and typing accuracy against dynamic English text prompts in a 60-second typing sprint.",
    players: "1 Player",
    controls: "Keyboard",
    iframe: "games/typing.html",
    featured: false,
    enabled: true
  },
  {
    id: "blockfall",
    title: "Block Fall",
    category: "adult",
    tags: ["puzzle", "classic", "tetris", "geometry"],
    icon: "🧊",
    color: "#00D5FF",
    thumb: "public/brand/games/thumb-blockfall.svg",
    addedAt: "2026-10-17",
    description: "Rotate and slot descending tetrominoes to clear full horizontal lines before the matrix overflows under accelerating gravity.",
    players: "1 Player",
    controls: "Arrow keys + Space / Touch buttons",
    iframe: "games/blockfall.html",
    featured: true,
    enabled: true
  },
  {
    id: "hangman",
    title: "Hangman",
    category: "educational",
    tags: ["words", "english", "vocabulary", "puzzle"],
    icon: "🔡",
    color: "#FFB020",
    thumb: "public/brand/games/thumb-hangman.svg",
    addedAt: "2026-10-17",
    description: "Decode secret mystery words one letter at a time using category clues before exhausting your allowed incorrect attempts.",
    players: "1 Player",
    controls: "Keyboard / Click",
    iframe: "games/hangman.html",
    featured: false,
    enabled: true
  },
  {
    id: "connect4",
    title: "Connect Four",
    category: "kids",
    tags: ["strategy", "2-player", "board", "tactics"],
    icon: "🔴",
    color: "#FF3D9A",
    thumb: "public/brand/games/thumb-connect4.svg",
    addedAt: "2026-10-17",
    description: "Drop colored gravity tokens into vertical slots. Form a horizontal, vertical, or diagonal quartet while outthinking your rival.",
    players: "1-2 Players",
    controls: "Click / Tap",
    iframe: "games/connect4.html",
    featured: false,
    enabled: true
  },
  {
    id: "whack",
    title: "Whack-a-Mole",
    category: "kids",
    tags: ["arcade", "reflex", "fun", "action"],
    icon: "🔨",
    color: "#20C997",
    thumb: "public/brand/games/thumb-whack.svg",
    addedAt: "2026-10-17",
    description: "Smash pop-up cyber moles as fast as possible to build multiplier combos, but stay vigilant and dodge explosive trap bombs!",
    players: "1 Player",
    controls: "Click / Tap",
    iframe: "games/whack.html",
    featured: false,
    enabled: true
  },
  {
    id: "space-shooter",
    title: "Cosmic Vanguard",
    category: "adult",
    tags: ["arcade", "action", "shooter", "scifi", "realtime"],
    icon: "🚀",
    color: "#00D5FF",
    thumb: "public/brand/games/thumb-space-shooter.svg",
    addedAt: "2026-10-19",
    description: "High-octane space combat interceptor! Blast alien armadas with dual plasma cannons, deploy energy shields, and defeat titan bosses.",
    players: "1 Player",
    controls: "Arrow keys + Space / Touch buttons",
    iframe: "games/space-shooter.html",
    featured: true,
    enabled: true
  },
  {
    id: "runner",
    title: "Endless Runner",
    category: "kids",
    tags: ["runner", "reflex", "parkour", "infinite"],
    icon: "🏃",
    color: "#20C997",
    thumb: "public/brand/games/thumb-runner.svg",
    addedAt: "2026-10-19",
    description: "Sprint across neon rooftops! Perform double jumps, slide underneath barriers, gather floating NovaCoins, and survive at terminal velocity.",
    players: "1 Player",
    controls: "Space / Tap / Arrow keys",
    iframe: "games/runner.html",
    featured: true,
    enabled: true
  },
  {
    id: "racing",
    title: "Cyber Velocity",
    category: "adult",
    tags: ["racing", "speed", "supercars", "nitro", "arcade"],
    icon: "🏎️",
    color: "#FF647C",
    thumb: "public/brand/games/thumb-racing.svg",
    addedAt: "2026-10-19",
    description: "Real-feel 60FPS supercar highway racer! Weave through dense night traffic, hit Nitro Turbo Boost, drift tight curves, and avoid fatal crashes.",
    players: "1 Player",
    controls: "Arrow keys / A-D + Space Nitro / Touch controls",
    iframe: "games/racing.html",
    featured: true,
    enabled: true
  },
  {
    id: "platformer",
    title: "Platform Adventure",
    category: "kids",
    tags: ["platformer", "adventure", "jumping", "coins"],
    icon: "🎮",
    color: "#7C4DFF",
    thumb: "public/brand/games/thumb-platformer.svg",
    addedAt: "2026-10-19",
    description: "Classic platforming action! Traverse treacherous platforms, collect gleaming star coins, bounce on patrolling minions, and reach the victory banner.",
    players: "1 Player",
    controls: "Arrow keys + Space / Touch buttons",
    iframe: "games/platformer.html",
    featured: true,
    enabled: true
  },
  {
    id: "tower-defense",
    title: "Tower Defense",
    category: "adult",
    tags: ["strategy", "defense", "wave", "upgrades"],
    icon: "🏰",
    color: "#FFB020",
    thumb: "public/brand/games/thumb-tower-defense.svg",
    addedAt: "2026-10-19",
    description: "Construct tactical defensive batteries along choke points, upgrade turret firing rates, and neutralize escalating waves of mechanical intruders.",
    players: "1 Player",
    controls: "Click / Tap",
    iframe: "games/tower-defense.html",
    featured: true,
    enabled: true
  },
  {
    id: "slide-puzzle",
    title: "Slide Puzzle",
    category: "educational",
    tags: ["puzzle", "logic", "numbers", "math"],
    icon: "🔢",
    color: "#00D5FF",
    thumb: "public/brand/games/thumb-slide-puzzle.svg",
    addedAt: "2026-10-19",
    description: "Slide numerical tiles into empty spaces to restore sequential order. Choose between 3x3 casual and 4x4 grandmaster difficulty grids.",
    players: "1 Player",
    controls: "Click / Tap / Arrow keys",
    iframe: "games/slide-puzzle.html",
    featured: false,
    enabled: true
  },
  {
    id: "lights-out",
    title: "Lights Out",
    category: "adult",
    tags: ["puzzle", "brain", "logic", "matrix"],
    icon: "💡",
    color: "#FFB020",
    thumb: "public/brand/games/thumb-lights-out.svg",
    addedAt: "2026-10-19",
    description: "Toggling any neon bulb inverts its state and adjacent neighbors. Calculate the minimal move sequence to turn off the entire grid.",
    players: "1 Player",
    controls: "Click / Tap",
    iframe: "games/lights-out.html",
    featured: false,
    enabled: true
  }
];

const CATEGORIES = [
  { id: "kids", title: "Kids & Family", icon: "🧸", color: "#00D5FF", desc: "Wholesome, colorful, and fun games suitable for all ages" },
  { id: "educational", title: "Educational & Brain", icon: "🎓", color: "#FFB020", desc: "Learn while having fun — mathematics, vocabulary, and global trivia" },
  { id: "adult", title: "Arcade & Challenge", icon: "🎯", color: "#FF3D9A", desc: "High-octane reflex testers, cyber racers, and strategic tactical challenges" }
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

if (typeof window !== "undefined") {
  window.SITE_CONFIG = SITE_CONFIG;
  window.GAMES = GAMES;
  window.CATEGORIES = CATEGORIES;
}
