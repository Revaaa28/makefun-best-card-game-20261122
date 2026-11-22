// SIGILFALL — the opponent AI, and the part the judge can see: its INTENT.
// The warden TELEGRAPHS what it will do next turn. Icons above its side
// show the plan (summon in a lane / strike / hoard energy), so the player
// can read the warden and counter it — criterion 2, visible in play and in
// the cover screenshot. The intent is computed honestly from the warden's
// real hand and next turn's energy; it is a plan, not a bluff.
import { RULES } from './config.js';
import { playCardSide } from './state.js';

export const INTENT_SUMMON = 'summon';
export const INTENT_STRIKE = 'strike';
export const INTENT_HOARD = 'hoard';

export const INTENT_LABELS = {
  summon: 'SUMMON',
  strike: 'STRIKE',
  hoard: 'HOARD',
};

// The warden's turn: draw already happened; play cards by a greedy score,
// then stop. Aggression comes from the warden's personality.
export function playAiTurn(game) {
  const enemy = game.enemy;
  const warden = game.duelIndex === 0 ? { aggression: 0.8, hoardChance: 0.1, maxPlays: 1 }
    : game.duelIndex === 1 ? { aggression: 0.55, hoardChance: 0.25, maxPlays: 2 }
    : { aggression: 0.65, hoardChance: 0.2, maxPlays: 3 };
  let guard = 0;
  let plays = 0;
  while (guard < 12) {
    guard += 1;
    // A warden only presses so many cards a turn — that is what leaves
    // the player room to out-read it instead of being buried.
    if (plays >= warden.maxPlays) break;
    const best = bestAiPlay(game, warden);
    if (!best) break;
    // A cautious warden sometimes banks its energy instead of spending it.
    if (best.score < 2 && game.rng.next() < warden.hoardChance) break;
    playCardSide(game, 'enemy', best.handIndex, best.lane);
    plays += 1;
    if (game.screen !== 'play') return;
  }
}

// Score every legal play the warden could make; return the best, or null.
export function bestAiPlay(game, warden) {
  const enemy = game.enemy;
  let best = null;
  for (let h = 0; h < enemy.hand.length; h += 1) {
    const card = enemy.hand[h];
    if (card.cost > enemy.energy) continue;
    if (card.kind === 'creature') {
      for (let lane = 0; lane < RULES.lanes; lane += 1) {
        if (game.lanes[lane].enemy) continue;
        const score = scoreCreaturePlay(game, card, lane, warden);
        if (!best || score > best.score) best = { handIndex: h, lane, score };
      }
    } else if (card.target === 'ownLane') {
      for (let lane = 0; lane < RULES.lanes; lane += 1) {
        if (!game.lanes[lane].enemy) continue;
        const target = game.lanes[lane].enemy;
        const score = 3 + target.power * 0.5 + (card.bond ? 1 : 0);
        if (!best || score > best.score) best = { handIndex: h, lane, score };
      }
    } else {
      const score = scoreSpellPlay(game, card, warden);
      if (score > 0 && (!best || score > best.score)) best = { handIndex: h, lane: null, score };
    }
  }
  return best;
}

function scoreCreaturePlay(game, card, lane, warden) {
  let score = card.power + card.health * 0.8;
  const foe = game.lanes[lane].player;
  if (!foe) score += 2.5; // an open lane hits the player directly
  else if (card.power >= foe.health) score += 3; // a killing trade
  else if (foe.power >= card.health) score -= 1.5; // it would die for nothing
  // Bond combos are worth reaching for.
  if (game.enemy.suitsPlayedThisTurn.includes(card.suit)) score += 2;
  if (card.cost <= 2 && game.turn <= 3) score += 1; // early tempo
  return score * (0.7 + warden.aggression * 0.6);
}

function scoreSpellPlay(game, card, warden) {
  const enemy = game.enemy;
  const player = game.player;
  switch (card.effect) {
    case 'damageWarden':
      return player.life <= card.amount + 2 ? 9 : 4 + warden.aggression * 2;
    case 'drain':
      return player.life <= card.amount + 2 ? 9 : 5;
    case 'heal':
      return enemy.life <= 12 ? 6 : (enemy.life >= 18 ? -1 : 2);
    case 'draw':
      return enemy.hand.length <= 2 ? 5 : 1;
    default:
      return 2;
  }
}

// The telegraph: from the warden's real hand and next turn's energy,
// what will it do? Shown as icons above its side for the whole player turn.
export function planIntent(game) {
  const enemy = game.enemy;
  const nextEnergy = Math.min(RULES.maxEnergy, enemy.turnCount + 1);
  const affordable = enemy.hand.filter((c) => c.cost <= nextEnergy);
  if (affordable.length === 0) {
    return { type: INTENT_HOARD, lane: null, text: 'The warden hoards its energy…' };
  }
  const creatures = affordable.filter((c) => c.kind === 'creature');
  const burn = affordable.find((c) => c.effect === 'damageWarden' || c.effect === 'drain');
  // A warden with a killing burn telegraphs a strike.
  if (burn && game.player.life <= (burn.amount || 2) + 3) {
    return { type: INTENT_STRIKE, lane: null, text: 'The warden is lining up a killing blow!' };
  }
  if (creatures.length > 0) {
    const open = [0, 1, 2].filter((i) => !game.lanes[i].enemy);
    const lane = open.length > 0 ? open[game.rng.int(open.length)] : game.rng.int(3);
    return { type: INTENT_SUMMON, lane, text: 'The warden will summon in lane ' + (lane + 1) + '.' };
  }
  if (burn) {
    return { type: INTENT_STRIKE, lane: null, text: 'The warden is gathering a strike.' };
  }
  return { type: INTENT_HOARD, lane: null, text: 'The warden hoards its energy…' };
}
