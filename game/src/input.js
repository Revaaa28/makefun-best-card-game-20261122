// SIGILFALL — input: mouse clicks and the keyboard, translated into game
// actions. One file, one job: it knows where things are on the table and
// turns a click or a key into "select card N", "play into lane L",
// "end turn", "mulligan", "play again" — nothing else.
import { LAYOUT, TABLE } from './config.js';

export const ACTION_CONFIRM = 'confirm';

// Where the player's hand cards sit (the renderer lays them out the same
// way, so clicks and paint agree).
export function handCardRect(index, handSize) {
  const { cardW, cardH, gap, y } = LAYOUT.playerHand;
  const total = handSize * cardW + (handSize - 1) * gap;
  const x0 = (TABLE.width - total) / 2;
  return { x: x0 + index * (cardW + gap), y, w: cardW, h: cardH };
}

export function laneRect(lane) {
  const { x, y, w, gap, laneH } = LAYOUT.lanes;
  const laneW = (w - gap * 2) / 3;
  return { x: x + lane * (laneW + gap), y, w: laneW, h: laneH };
}

function inside(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function createInput(canvas, game, hooks) {
  const state = { hover: -1 };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * TABLE.width,
      y: ((event.clientY - rect.top) / rect.height) * TABLE.height,
    };
  }

  function onClick(event) {
    const p = toLogical(event);
    hooks.onGesture();
    handlePoint(game, p, hooks);
  }

  function onMove(event) {
    const p = toLogical(event);
    state.hover = -1;
    if (game.screen === 'play' && game.phase === 'player') {
      for (let i = 0; i < game.player.hand.length; i += 1) {
        if (inside(p.x, p.y, handCardRect(i, game.player.hand.length))) { state.hover = i; break; }
      }
    }
    hooks.onHover(state.hover);
  }

  function onKey(event) {
    hooks.onGesture();
    const key = event.key.toLowerCase();
    if (game.screen === 'title' && (key === 'enter' || key === ' ')) { hooks.onStart(); return; }
    if (game.screen === 'interlude' && (key === 'enter' || key === ' ')) { hooks.onInterludeNext(); return; }
    if ((game.screen === 'duelwin' || game.screen === 'duelloss' || game.screen === 'campaignwin' || game.screen === 'campaignloss')
      && (key === 'enter' || key === ' ')) { hooks.onAgain(); return; }
    if (game.screen !== 'play') return;
    if (key >= '1' && key <= '7') {
      const idx = Number(key) - 1;
      if (idx < game.player.hand.length) hooks.onSelect(idx);
      return;
    }
    if (key === 'q' || key === 'w' || key === 'e') {
      const lane = key === 'q' ? 0 : key === 'w' ? 1 : 2;
      hooks.onLane(lane);
      return;
    }
    if (key === 'enter') { hooks.onEndTurn(); return; }
    if (key === 'm') { hooks.onMulligan(); return; }
    if (key === 'escape') { hooks.onSelect(-1); }
  }

  canvas.addEventListener('click', onClick);
  canvas.addEventListener('mousemove', onMove);
  window.addEventListener('keydown', onKey);
  return state;
}

// The shared click logic: buttons first, then hand, then lanes.
export function handlePoint(game, p, hooks) {
  const screen = game.screen;
  if (screen === 'title') {
    if (inside(p.x, p.y, { x: 490, y: 560, w: 300, h: 80 })) hooks.onStart();
    return;
  }
  if (screen === 'interlude') {
    if (inside(p.x, p.y, { x: 490, y: 600, w: 300, h: 80 })) hooks.onInterludeNext();
    return;
  }
  if (screen === 'duelwin') {
    if (inside(p.x, p.y, { x: 490, y: 600, w: 300, h: 80 })) hooks.onNextDuel();
    return;
  }
  if (screen === 'campaignwin' || screen === 'campaignloss') {
    if (inside(p.x, p.y, { x: 490, y: 600, w: 300, h: 80 })) hooks.onAgain();
    return;
  }
  if (screen !== 'play') return;

  // Mulligan button (top of the hand area, first turn only).
  if (game.mulliganOffered && inside(p.x, p.y, { x: 30, y: 540, w: 130, h: 40 })) {
    hooks.onMulligan();
    return;
  }
  // End Turn button.
  if (game.phase === 'player' && inside(p.x, p.y, LAYOUT.endTurn)) {
    hooks.onEndTurn();
    return;
  }
  // Hand: click a card to select it; click a selected card again to play
  // a spell that needs no lane.
  if (game.phase === 'player') {
    for (let i = 0; i < game.player.hand.length; i += 1) {
      if (inside(p.x, p.y, handCardRect(i, game.player.hand.length))) {
        const card = game.player.hand[i];
        if (game.selected === i && card.kind === 'spell' && !card.target) {
          hooks.onPlay(i, null);
        } else {
          hooks.onSelect(i);
        }
        return;
      }
    }
  }
  // Lanes: a selected card plays into the clicked lane.
  if (game.selected >= 0) {
    for (let lane = 0; lane < 3; lane += 1) {
      if (inside(p.x, p.y, laneRect(lane))) {
        hooks.onPlay(game.selected, lane);
        return;
      }
    }
    hooks.onSelect(-1); // clicked empty table: deselect
  }
}
