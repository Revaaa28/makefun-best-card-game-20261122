// SIGILFALL — the game state and the turn flow. One file, one job: what
// the game IS and how a turn moves. It draws nothing and hears no input.
//
// A duel: each side 20 life, a 24-card deck, an opening hand of 4 (one
// mulligan). Each turn: draw 1, energy refills and grows (1, 2, 3 ... cap 6),
// play cards, then your creatures strike: each lane's creature hits the
// opposing creature, and excess power hits the enemy warden's life.
// First side to 0 life loses the duel.
import { RULES } from './config.js';
import { PLAYER_DECK_IDS, buildDeck, makeCreature, cardById } from './cards.js';
import { wardenForDuel, campaignScore } from './campaign.js';
import { createRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_INTERLUDE = 'interlude';
export const SCREEN_PLAY = 'play';
export const SCREEN_DUEL_WIN = 'duelwin';
export const SCREEN_DUEL_LOSS = 'duelloss';
export const SCREEN_CAMPAIGN_WIN = 'campaignwin';
export const SCREEN_CAMPAIGN_LOSS = 'campaignloss';

export function newSide(deckIds, rng) {
  return {
    life: RULES.startLife,
    deck: buildDeck(deckIds, rng),
    hand: [],
    discard: [],
    energy: 0,
    maxEnergy: 0,
    turnCount: 0,
    suitsPlayedThisTurn: [],
    mulliganUsed: false,
  };
}

export function createGame(seed) {
  const rng = createRandom(seed >>> 0 || 1);
  const game = {
    seed,
    rng,
    screen: SCREEN_TITLE,
    duelIndex: 0,
    campaignWins: 0,
    scoreLifeBank: 0,
    turn: 1,
    phase: 'player', // 'player' | 'ai' | 'combat' | 'over'
    player: null,
    enemy: null,
    lanes: [null, null, null].map(() => ({ player: null, enemy: null })),
    intent: null, // the AI's telegraphed plan for its next turn
    selected: -1, // index into the player's hand, -1 = none
    log: [],
    floaters: [], // filled by render/anim, kept here so shots can stage them
    events: [], // one-frame event flags the renderer/audio consume
    mulliganOffered: false,
    lastBond: null,
  };
  return game;
}

export function warden(game) {
  return wardenForDuel(game.duelIndex);
}

export function score(game) {
  return campaignScore(game);
}

export function log(game, text) {
  game.log.unshift(text);
  if (game.log.length > 5) game.log.length = 5;
}

export function drawCard(side, game) {
  if (side.deck.length === 0) {
    // An empty deck mills the warden: fatigue, 1 damage per empty draw.
    side.life -= 1;
    log(game, (side === game.player ? 'You' : 'The warden') + ' run out of cards and take 1 fatigue.');
    return null;
  }
  if (side.hand.length >= RULES.maxHand) {
    const burned = side.deck.pop();
    log(game, 'Hand full — ' + burned.name + ' is discarded.');
    return null;
  }
  const card = side.deck.pop();
  side.hand.push(card);
  return card;
}

export function startDuel(game, duelIndex) {
  game.duelIndex = duelIndex;
  game.turn = 1;
  game.phase = 'player';
  game.player = newSide(PLAYER_DECK_IDS, game.rng);
  game.enemy = newSide(warden(game).deckIds, game.rng);
  game.lanes = [null, null, null].map(() => ({ player: null, enemy: null }));
  game.selected = -1;
  game.intent = null;
  game.lastBond = null;
  game.log = [];
  game.mulliganOffered = false;
  for (let i = 0; i < RULES.openingHand; i += 1) {
    drawCard(game.player, game);
    drawCard(game.enemy, game);
  }
  game.player.maxEnergy = 1;
  game.player.energy = 1;
  game.player.turnCount = 1;
  game.screen = SCREEN_PLAY;
  game.mulliganOffered = true;
  log(game, 'Duel ' + (duelIndex + 1) + ' of 3 — ' + warden(game).name + ' takes the table.');
}

export function mulligan(game) {
  if (!game.mulliganOffered || game.player.mulliganUsed) return false;
  game.player.mulliganUsed = true;
  game.mulliganOffered = false;
  const hand = game.player.hand;
  game.player.deck.push(...hand);
  game.rng.shuffle(game.player.deck);
  game.player.hand = [];
  for (let i = 0; i < RULES.openingHand; i += 1) drawCard(game.player, game);
  log(game, 'You mulligan — a fresh hand of 4.');
  return true;
}

// ---- playing cards -------------------------------------------------------

export function canPlaySide(game, side, handIndex, lane) {
  const me = side === 'player' ? game.player : game.enemy;
  const card = me.hand[handIndex];
  if (!card) return false;
  if (card.cost > me.energy) return false;
  if (card.kind === 'creature') {
    if (lane === null || lane === undefined) return false;
    if (game.lanes[lane][side]) return false;
    return true;
  }
  if (card.target === 'ownLane') {
    if (lane === null || lane === undefined) return false;
    if (!game.lanes[lane][side]) return false;
    return true;
  }
  return true; // spells that need no lane
}

// Play a card for either side. The player-facing playCard is this with
// side 'player'; the AI plays through the same function, same rules.
export function playCardSide(game, side, handIndex, lane) {
  if (!canPlaySide(game, side, handIndex, lane)) return false;
  const me = side === 'player' ? game.player : game.enemy;
  const card = me.hand[handIndex];
  me.hand.splice(handIndex, 1);
  me.energy -= card.cost;
  me.discard.push(card);
  const bonded = me.suitsPlayedThisTurn.includes(card.suit);
  me.suitsPlayedThisTurn.push(card.suit);
  if (side === 'player') game.selected = -1;

  if (card.kind === 'creature') {
    const creature = makeCreature(card);
    game.lanes[lane][side] = creature;
    game.events.push({ type: 'summon', lane, side, card });
    log(game, (side === 'player' ? 'You summon ' : 'The warden summons ') + card.name + ' to lane ' + (lane + 1) + '.');
    if (bonded) triggerBond(game, side, card, lane);
    return true;
  }
  resolveSpell(game, side, card, lane);
  game.events.push({ type: 'spell', side, card });
  log(game, (side === 'player' ? 'You cast ' : 'The warden casts ') + card.name + '.');
  if (bonded) triggerBond(game, side, card, lane);
  checkEnd(game);
  return true;
}

export function canPlay(game, handIndex, lane) {
  if (game.screen !== SCREEN_PLAY || game.phase !== 'player') return false;
  return canPlaySide(game, 'player', handIndex, lane);
}

export function playCard(game, handIndex, lane) {
  if (game.screen !== SCREEN_PLAY || game.phase !== 'player') return false;
  return playCardSide(game, 'player', handIndex, lane);
}

// Bond effects resolve through the same helpers spells use.
export function triggerBond(game, side, card, lane) {
  const bond = card.bond;
  if (!bond) return;
  game.lastBond = { card: card.name, text: card.bondText };
  game.events.push({ type: 'bond', side, card });
  log(game, 'BOND — ' + card.name + ': ' + card.bondText);
  applyEffect(game, side, bond, lane);
}

export function applyEffect(game, side, effect, lane) {
  const me = side === 'player' ? game.player : game.enemy;
  const foe = side === 'player' ? game.enemy : game.player;
  const myLanes = game.lanes;
  switch (effect.effect) {
    case 'damageWarden':
      damageWarden(game, foe, effect.amount, side);
      break;
    case 'heal':
      me.life = Math.min(RULES.startLife, me.life + effect.amount);
      game.events.push({ type: 'heal', side, amount: effect.amount });
      break;
    case 'draw':
      for (let i = 0; i < effect.amount; i += 1) drawCard(me, game);
      break;
    case 'selfPower': {
      const c = lane !== null && lane !== undefined ? myLanes[lane][side] : null;
      if (c) c.power += effect.amount;
      break;
    }
    case 'selfHealth': {
      const c = lane !== null && lane !== undefined ? myLanes[lane][side] : null;
      if (c) { c.health += effect.amount; c.maxHealth += effect.amount; }
      break;
    }
    case 'teamPower':
      myLanes.forEach((l) => { if (l[side]) l[side].power += effect.amount; });
      break;
    case 'teamHealth':
      myLanes.forEach((l) => { if (l[side]) { l[side].health += effect.amount; l[side].maxHealth += effect.amount; } });
      break;
    case 'damageLane': {
      const targetLane = lane !== null && lane !== undefined ? lane : pickFoeLane(game, side);
      const foeSide = side === 'player' ? 'enemy' : 'player';
      const foeCreature = myLanes[targetLane][foeSide];
      if (foeCreature) damageCreature(game, targetLane, foeSide, effect.amount);
      else damageWarden(game, foe, effect.amount, side);
      break;
    }
    case 'damageAllFoes': {
      const foeSide = side === 'player' ? 'enemy' : 'player';
      myLanes.forEach((l, i) => { if (l[foeSide]) damageCreature(game, i, foeSide, effect.amount); });
      break;
    }
    case 'drain':
      damageWarden(game, foe, effect.amount, side);
      me.life = Math.min(RULES.startLife, me.life + effect.amount);
      break;
    default:
      break;
  }
  checkEnd(game);
}

export function resolveSpell(game, side, card, lane) {
  applyEffect(game, side, { effect: card.effect, amount: card.amount }, lane);
}

function pickFoeLane(game, side) {
  const foeSide = side === 'player' ? 'enemy' : 'player';
  const filled = [0, 1, 2].filter((i) => game.lanes[i][foeSide]);
  if (filled.length) return filled[game.rng.int(filled.length)];
  return game.rng.int(3);
}

// ---- damage --------------------------------------------------------------

export function damageWarden(game, side, amount, bySide) {
  side.life -= amount;
  game.events.push({ type: 'wardenHit', side: side === game.player ? 'player' : 'enemy', amount, by: bySide });
}

export function damageCreature(game, lane, side, amount) {
  const creature = game.lanes[lane][side];
  if (!creature) return;
  creature.health -= amount;
  game.events.push({ type: 'creatureHit', lane, side, amount });
  if (creature.health <= 0) {
    game.lanes[lane][side] = null;
    game.events.push({ type: 'creatureDies', lane, side, name: creature.def.name });
    log(game, creature.def.name + ' falls in lane ' + (lane + 1) + '.');
  }
}

// ---- combat --------------------------------------------------------------
// One side's creatures strike: each lane's creature hits the opposing
// creature in its lane; excess power hits the enemy warden's life.
export function strike(game, side) {
  const foeSide = side === 'player' ? 'enemy' : 'player';
  const foe = side === 'player' ? game.enemy : game.player;
  for (let lane = 0; lane < RULES.lanes; lane += 1) {
    const attacker = game.lanes[lane][side];
    if (!attacker) continue;
    const defender = game.lanes[lane][foeSide];
    if (defender) {
      const power = attacker.power;
      const healthBefore = defender.health;
      damageCreature(game, lane, foeSide, power);
      // Excess is the power beyond what killed the defender.
      const excess = healthBefore <= power ? power - healthBefore : 0;
      if (excess > 0) damageWarden(game, foe, excess, side);
    } else {
      damageWarden(game, foe, attacker.power, side);
    }
    if (checkEnd(game)) return;
  }
}

// ---- turn flow -----------------------------------------------------------

export function endPlayerTurn(game) {
  if (game.screen !== SCREEN_PLAY || game.phase !== 'player') return false;
  game.selected = -1;
  game.phase = 'combat';
  log(game, 'Your creatures strike.');
  strike(game, 'player');
  if (game.screen !== SCREEN_PLAY) return true;
  game.phase = 'ai';
  runAiTurn(game);
  return true;
}

export function beginPlayerTurn(game) {
  game.turn += 1;
  game.phase = 'player';
  game.player.turnCount += 1;
  game.player.maxEnergy = Math.min(RULES.maxEnergy, game.player.turnCount);
  game.player.energy = game.player.maxEnergy;
  game.player.suitsPlayedThisTurn = [];
  game.mulliganOffered = false;
  drawCard(game.player, game);
  log(game, 'Turn ' + game.turn + ' — you draw, ' + game.player.energy + ' energy.');
  checkEnd(game);
}

function runAiTurn(game) {
  game.enemy.turnCount += 1;
  game.enemy.maxEnergy = Math.min(RULES.maxEnergy, game.enemy.turnCount);
  game.enemy.energy = game.enemy.maxEnergy;
  game.enemy.suitsPlayedThisTurn = [];
  drawCard(game.enemy, game);
  // The AI plays by its plan (see ai.js), then its creatures strike.
  const { playAiTurn } = aiModule();
  playAiTurn(game);
  if (game.screen !== SCREEN_PLAY) return;
  log(game, 'The warden’s creatures strike.');
  strike(game, 'enemy');
  if (game.screen !== SCREEN_PLAY) return;
  game.intent = computeIntent(game);
  beginPlayerTurn(game);
}

// Lazy import avoids a module cycle (ai.js imports state helpers, and
// main.js registers the AI module here at boot).
let cachedAi = null;
function aiModule() {
  if (!cachedAi) throw new Error('AI module not registered — main.js must call registerAi.');
  return cachedAi;
}

// Filled in by main.js at boot (ai.js registers itself here).
export function registerAi(module) {
  cachedAi = module;
}

function computeIntent(game) {
  const { planIntent } = aiModule();
  return planIntent(game);
}

// ---- endings -------------------------------------------------------------

export function checkEnd(game) {
  if (game.screen !== SCREEN_PLAY) return false;
  if (game.enemy.life <= 0 && game.player.life <= 0) {
    // A mutual fall counts as a loss: the warden holds the table.
    return endDuel(game, false);
  }
  if (game.enemy.life <= 0) return endDuel(game, true);
  if (game.player.life <= 0) return endDuel(game, false);
  return false;
}

function endDuel(game, won) {
  game.phase = 'over';
  game.selected = -1;
  if (won) {
    game.campaignWins += 1;
    game.scoreLifeBank += game.player.life;
    game.events.push({ type: 'duelWin' });
    if (game.campaignWins >= RULES.duelsToWin) {
      game.screen = SCREEN_CAMPAIGN_WIN;
      log(game, 'CAMPAIGN WON — all three wardens fall!');
    } else {
      game.screen = SCREEN_DUEL_WIN;
      log(game, 'Duel won! ' + warden(game).short + ' falls.');
    }
  } else {
    game.events.push({ type: 'duelLoss' });
    game.screen = SCREEN_CAMPAIGN_LOSS;
    log(game, 'Defeat — ' + warden(game).short + ' holds the table.');
  }
  return true;
}

// Start the next duel after a duel win, or restart the campaign.
export function nextDuel(game) {
  if (game.screen === SCREEN_DUEL_WIN) {
    game.screen = SCREEN_INTERLUDE;
    return true;
  }
  return false;
}

export function restartCampaign(game) {
  const fresh = createGame(game.seed);
  fresh.screen = SCREEN_INTERLUDE;
  return fresh;
}
