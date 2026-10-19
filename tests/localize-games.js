const fs = require('fs');
const path = require('path');
const gamesDir = path.join(__dirname, '..', 'games');

const replacements = [
  // blockfall
  { file: 'blockfall.html', from: '🔁 Abar Khelun', to: '🔁 Play Again' },
  // connect4
  { file: 'connect4.html', from: 'statusEl.textContent=mode==="ai"?"🤖 AI jeetlo — punoriddhar koro!":"🟡 Player 2 jeetlo!";', to: 'statusEl.textContent=mode==="ai"?"🤖 AI Won — Try Again!":"🟡 Player 2 Won!";' },
  // flag-quiz
  { file: 'flag-quiz.html', from: '<h2 id="ovTitle">🎉 Shesh!</h2>', to: '<h2 id="ovTitle">🎉 Quiz Complete!</h2>' },
  { file: 'flag-quiz.html', from: '<button class="btn" id="ovBtn">▶ Abar Kheln</button>', to: '<button class="btn" id="ovBtn">▶ Play Again</button>' },
  { file: 'flag-quiz.html', from: 'ovTitle.textContent="🎉 Shesh!";', to: 'ovTitle.textContent="🎉 Quiz Complete!";' },
  // flappy
  { file: 'flappy.html', from: '<div class="hint">Click / Space / Tap — udan shuru korun!</div>', to: '<div class="hint">Click / Space / Tap — Take flight! Avoid pipes!</div>' },
  { file: 'flappy.html', from: '<button class="btn" id="ovBtn">▶ Abar Kheln</button>', to: '<button class="btn" id="ovBtn">▶ Play Again</button>' },
  { file: 'flappy.html', from: 'ctx.fillText("P diye continue koro",W/2,H/2+22);', to: 'ctx.fillText("Press P to Resume",W/2,H/2+22);' },
  // hangman
  { file: 'hangman.html', from: '["television","Video dekhar upokoron"]', to: '["television","Device for viewing broadcast video"]' },
  // math-quiz
  { file: 'math-quiz.html', from: '<h2 id="ovTitle">Shesh!</h2>', to: '<h2 id="ovTitle">Quiz Complete!</h2>' },
  { file: 'math-quiz.html', from: '<button class="btn" id="ovBtn">▶ Abar Kheln</button>', to: '<button class="btn" id="ovBtn">▶ Play Again</button>' },
  { file: 'math-quiz.html', from: 'ovTitle.textContent="🎉 Shesh!";', to: 'ovTitle.textContent="🎉 Quiz Complete!";' },
  // memory
  { file: 'memory.html', from: '<button class="btn" id="ovBtn">▶ Abar Kheln</button>', to: '<button class="btn" id="ovBtn">▶ Play Again</button>' },
  // minesweeper
  { file: 'minesweeper.html', from: '<p class="hint">Dig mode-e tap kore khodao, Flag mode-e mine marked koro. Computer-e right-click-o flag kaj kore. Prothom click kokhono mine-e lage na.</p>', to: '<p class="hint">Tap in Dig mode to uncover tiles, Flag mode to mark mines. Right-click flags on desktop. First click is always safe!</p>' },
  { file: 'minesweeper.html', from: '<button class="btn" id="ovBtn">🔁 Abar Kheln</button>', to: '<button class="btn" id="ovBtn">🔁 Play Again</button>' },
  { file: 'minesweeper.html', from: 'ovMsg.textContent="Mine felo! Ar ekbar try koro — prothom click-e mine thake na.";', to: 'ovMsg.textContent="Detonated a mine! Try again — the first click is always safe.";' },
  // reaction
  { file: 'reaction.html', from: 'setArena("idle","<h2>😿 Kono valid round hoyni</h2><p>Early click royeche. Abar cheshta korun!</p>");', to: 'setArena("idle","<h2>😿 No Valid Rounds</h2><p>False start detected. Try again!</p>");' },
  { file: 'reaction.html', from: 'var title="🎉 Shesh!",extra="";', to: 'var title="🎉 Test Complete!",extra="";' },
  { file: 'reaction.html', from: 'startBtn.textContent="▶ Abar Kheln";', to: 'startBtn.textContent="▶ Test Again";' },
  // simon
  { file: 'simon.html', from: '<div class="status" id="status">Start doro — sequence mone rakho ar repeat koro!</div>', to: '<div class="status" id="status">Press Start — Memorize and repeat the light sequence!</div>' },
  { file: 'simon.html', from: '<p class="hint">Sequence dekho, tarpor oi order-ei colors tap koro. Bhul korle streak shesh — notun shuru!</p>', to: '<p class="hint">Watch the pattern sequence, then tap each pad in order. One mistake ends the streak!</p>' },
  { file: 'simon.html', from: 'statusEl.textContent="Ekhon tap koro!";', to: 'statusEl.textContent="Your turn — Repeat pattern!";' },
  // slide-puzzle
  { file: 'slide-puzzle.html', from: '<div class="hint">Tap kore blank er sathe lagano tile soriyan. Keyboard-e arrow key o kaj kore.</div>', to: '<div class="hint">Tap adjacent tiles to slide into the blank space. Arrow keys also supported.</div>' },
  // snake
  { file: 'snake.html', from: '<button class="btn" id="ovBtn">▶ Abar Kheln</button>', to: '<button class="btn" id="ovBtn">▶ Play Again</button>' },
  // tic-tac-toe
  { file: 'tic-tac-toe.html', from: '<div id="msg">X diye shuru korun!</div>', to: '<div id="msg">Player X moves first!</div>' },
  { file: 'tic-tac-toe.html', from: 'msg.textContent=vsAI?"X diye shuru korun!":"Player X er palon!";', to: 'msg.textContent=vsAI?"Player X moves first!":"Player X\'s Turn!";' },
  { file: 'tic-tac-toe.html', from: 'stats.d++;msg.textContent="🤝 Draw hoyeche! Abar kheln.";', to: 'stats.d++;msg.textContent="🤝 It\'s a Draw! Play again.";' },
  // typing
  { file: 'typing.html', from: 'placeholder="Type here... (shuru holle timer start hobe)"', to: 'placeholder="Type here... (timer starts on first keystroke)"' },
  { file: 'typing.html', from: '<button class="btn" id="againBtn">🔁 Abar Khelun</button>', to: '<button class="btn" id="againBtn">🔁 Play Again</button>' },
  { file: 'typing.html', from: 'resTitle.textContent=isBest?"🏆 NOTUN BEST!":"⏱ Shesh!";', to: 'resTitle.textContent=isBest?"🏆 NEW BEST SPEED!":"⏱ Speed Test Complete!";' },
  // whack
  { file: 'whack.html', from: '<p class="hint">Mole ber hoyle taratari tap koro! 💣 bomb tap korle score kete jabe. Combo banale bonus point!</p>', to: '<p class="hint">Whack cyber moles as they emerge! Avoid 💣 bombs to protect your score and build combos!</p>' },
  { file: 'whack.html', from: 'comboEl.textContent=isBest?"🏆 NOTUN BEST! "+score:"Shesh! Score: "+score;', to: 'comboEl.textContent=isBest?"🏆 NEW BEST! "+score:"Time\'s Up! Score: "+score;' },
  { file: 'whack.html', from: 'startBtn.textContent="🔁 Abar Khelun";', to: 'startBtn.textContent="🔁 Play Again";' },
  // word-builder
  { file: 'word-builder.html', from: '<h2 id="ovTitle">🎉 Shesh!</h2>', to: '<h2 id="ovTitle">🎉 Round Complete!</h2>' },
  { file: 'word-builder.html', from: '<button class="btn" id="ovBtn">▶ Abar Kheln</button>', to: '<button class="btn" id="ovBtn">▶ Play Again</button>' },
  { file: 'word-builder.html', from: 'ovTitle.textContent=dead?"😿 Lives Shesh!":"🎉 Shesh!";', to: 'ovTitle.textContent=dead?"😿 Out of Lives!":"🎉 Word Master Complete!";' }
];

let applied = 0;
replacements.forEach(r => {
  const filePath = path.join(gamesDir, r.file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(r.from)) {
    content = content.replace(r.from, r.to);
    fs.writeFileSync(filePath, content, 'utf8');
    applied++;
  } else {
    console.log('MISS: ' + r.file + ' -> ' + r.from);
  }
});

console.log('Applied ' + applied + ' replacements out of ' + replacements.length);
