// SIGILFALL — boot and the one loop. Input is read every frame, the game
// advances, and the renderer paints what is there. The game moves between
// title, interlude, play, duel win/loss and campaign win/loss screens.
//
// ?seed=N fixes the shuffle. ?shot=table|title|win|loss (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady (and the page title) for a screenshot.
// ?selftest=1 plays two full games through real clicks — one to a win,
// one to a loss — and writes the outcome into the status line.
import { TABLE } from './config.js';
import {
  createGame, startDuel, playCard, endPlayerTurn, mulligan,
  SCREEN_TITLE, SCREEN_INTERLUDE, SCREEN_PLAY,
  registerAi,
} from './state.js';
import * as ai from './ai.js';
import { createRenderer } from './render.js';
import { createInput, handCardRect, laneRect } from './input.js';
import { createAnim, stepAnim, addFloater, burst, victoryBurst, kickShake } from './anim.js';
import {
  createAudio, sfxPlay, sfxDraw, sfxHit, sfxBond, sfxHeal, sfxWin, sfxLose, sfxClick,
} from './audio.js';
import { stageShot } from './shots.js';

registerAi(ai);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const selftest = params.get('selftest') === '1';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
let game = createGame(seed);
const anim = createAnim();
const audio = createAudio();
const renderer = createRenderer(canvas);
let hover = -1;

// Test surface: the smoke tests drive the game through these same calls.
window.__sigil = { game: () => game, playCard, endPlayerTurn, startDuel, mulligan };

function setStatus(text) {
  status.textContent = text;
  document.title = text;
}

function consumeEvents() {
  for (const ev of game.events) {
    if (ev.type === 'summon') {
      sfxPlay(audio);
      const r = laneRect(ev.lane);
      burst(anim, r.x + r.w / 2, r.y + (ev.side === 'player' ? 260 : 100), '#f2c94c', 10, 160);
    } else if (ev.type === 'spell') {
      sfxPlay(audio);
    } else if (ev.type === 'bond') {
      sfxBond(audio);
      addFloater(anim, 640, 300, 'BOND!', '#f2c94c', 40);
    } else if (ev.type === 'wardenHit') {
      sfxHit(audio);
      kickShake(anim, 7);
      const y = ev.side === 'enemy' ? 40 : 620;
      addFloater(anim, 640, y, '-' + ev.amount, '#ff5d73', 34);
    } else if (ev.type === 'creatureHit') {
      sfxHit(audio);
      const r = laneRect(ev.lane);
      addFloater(anim, r.x + r.w / 2, r.y + 170, '-' + ev.amount, '#ffd166', 26);
    } else if (ev.type === 'heal') {
      sfxHeal(audio);
      addFloater(anim, 200, 620, '+' + ev.amount, '#43b581', 28);
    } else if (ev.type === 'duelWin') {
      sfxWin(audio);
      victoryBurst(anim, 640, 380);
    } else if (ev.type === 'duelLoss') {
      sfxLose(audio);
      kickShake(anim, 10);
    }
  }
  game.events.length = 0;
}

const hooks = {
  onGesture() {
    sfxClick(audio);
  },
  onHover(index) {
    hover = index;
  },
  onSelect(index) {
    if (game.screen !== SCREEN_PLAY || game.phase !== 'player') return;
    game.selected = game.selected === index ? -1 : index;
    sfxClick(audio);
  },
  onPlay(index, lane) {
    if (game.screen !== SCREEN_PLAY || game.phase !== 'player') return;
    const ok = playCard(game, index, lane);
    if (ok) sfxPlay(audio);
  },
  onLane(lane) {
    if (game.selected >= 0) hooks.onPlay(game.selected, lane);
  },
  onEndTurn() {
    if (game.screen === SCREEN_PLAY && game.phase === 'player') {
      sfxDraw(audio);
      endPlayerTurn(game);
    }
  },
  onMulligan() {
    if (mulligan(game)) sfxDraw(audio);
  },
  onStart() {
    if (game.screen === SCREEN_TITLE) {
      startDuel(game, 0);
      game.screen = SCREEN_INTERLUDE;
      sfxClick(audio);
    }
  },
  onInterludeNext() {
    if (game.screen === SCREEN_INTERLUDE) {
      game.screen = SCREEN_PLAY;
      sfxDraw(audio);
    }
  },
  onNextDuel() {
    if (game.screen === 'duelwin') {
      startDuel(game, game.duelIndex + 1);
      game.screen = SCREEN_INTERLUDE;
      sfxClick(audio);
    }
  },
  onAgain() {
    if (game.screen === 'campaignwin' || game.screen === 'campaignloss') {
      const fresh = createGame(Math.floor(Math.random() * 4294967296));
      Object.assign(game, fresh);
      startDuel(game, 0);
      game.screen = SCREEN_INTERLUDE;
      sfxClick(audio);
    }
  },
};

createInput(canvas, game, hooks);

function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000 || 0.016);
  frame.last = now;
  stepAnim(anim, dt);
  consumeEvents();
  renderer.draw(game, anim, hover);
  setStatus('SIGILFALL — ' + game.screen + ' · duel ' + (game.duelIndex + 1) + ' of 3 · turn ' + game.turn);
  requestAnimationFrame(frame);
}

function runShot(name) {
  game = stageShot(name, seed);
  window.__sigil = { game: () => game, playCard, endPlayerTurn, startDuel, mulligan };
  // Paint synchronously: headless --screenshot captures right after load,
  // and requestAnimationFrame may not fire before the capture. Paint now,
  // then repaint on the next frames for good measure.
  stepAnim(anim, 0.016);
  renderer.draw(game, anim, -1);
  stepAnim(anim, 0.016);
  renderer.draw(game, anim, -1);
  window.__shotReady = true;
  setStatus('SHOT-READY ' + name);
  requestAnimationFrame(() => renderer.draw(game, anim, -1));
}

// ---- self-test: two full games through real clicks -------------------------
// Clicks are dispatched on the canvas with real client coordinates, so the
// test exercises input.js, state.js, ai.js and combat.js together.
function clickAt(lx, ly) {
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + (lx / TABLE.width) * rect.width;
  const cy = rect.top + (ly / TABLE.height) * rect.height;
  canvas.dispatchEvent(new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true }));
}

function playOneDuelAggressive() {
  // Click PLAY, then BEGIN DUEL.
  clickAt(640, 600);
  clickAt(640, 640);
  let guard = 0;
  while (game.screen === 'play' && guard < 400) {
    guard += 1;
    if (game.phase !== 'player') break;
    // Play every affordable card into the first open lane, then end turn.
    let played = true;
    let inner = 0;
    while (played && inner < 10) {
      inner += 1;
      played = false;
      for (let i = 0; i < game.player.hand.length; i += 1) {
        const card = game.player.hand[i];
        if (card.cost > game.player.energy) continue;
        if (card.kind === 'creature') {
          for (let lane = 0; lane < 3; lane += 1) {
            if (!game.lanes[lane].player) {
              clickAt(handCardRect(i, game.player.hand.length).x + 74, 660);
              clickAt(laneRect(lane).x + 150, 380);
              played = true;
              break;
            }
          }
        } else if (!card.target) {
          clickAt(handCardRect(i, game.player.hand.length).x + 74, 660);
          clickAt(handCardRect(i, game.player.hand.length).x + 74, 660);
          played = true;
        }
        if (played) break;
      }
    }
    clickAt(1180, 731); // END TURN
  }
  return game.screen;
}

function playOneDuelPassive() {
  clickAt(640, 600);
  clickAt(640, 640);
  let guard = 0;
  while (game.screen === 'play' && guard < 400) {
    guard += 1;
    if (game.phase !== 'player') break;
    clickAt(1180, 731); // END TURN, never play a card
  }
  return game.screen;
}

function runSelftest() {
  const results = [];
  try {
    const first = playOneDuelAggressive();
    results.push('duel1=' + first);
    // Play again from the end screen (win or loss both offer a next step).
    if (game.screen === 'duelwin') {
      clickAt(640, 640); // NEXT DUEL
      clickAt(640, 640); // BEGIN DUEL
      let guard = 0;
      while (game.screen === 'play' && guard < 400) {
        guard += 1;
        if (game.phase !== 'player') break;
        clickAt(1180, 731);
      }
      results.push('duel2=' + game.screen);
    } else {
      clickAt(640, 640); // PLAY AGAIN
      const second = playOneDuelPassive();
      results.push('duel2passive=' + second);
    }
    // A fresh campaign, played passively, must end in defeat.
    const fresh = createGame(777);
    Object.assign(game, fresh);
    startDuel(game, 0);
    game.screen = 'interlude';
    const third = playOneDuelPassive();
    results.push('passive=' + third);
  } catch (err) {
    results.push('ERROR ' + err.message);
  }
  const text = 'SELFTEST ' + results.join(' ');
  setStatus(text);
  window.__selftest = text;
  window.__shotReady = true;
}

if (shot) {
  runShot(shot);
} else if (selftest) {
  // Paint once, then run the scripted games.
  requestAnimationFrame(() => {
    renderer.draw(game, anim, -1);
    setTimeout(runSelftest, 50);
  });
} else {
  requestAnimationFrame(frame);
}
