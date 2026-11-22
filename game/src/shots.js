// SIGILFALL — the screenshot scenes behind ?shot=table|title|win|loss.
// Each scene stages a REAL game state through the real rules (no fake
// mock-ups): the table scene is Duel 2 mid-fight with creatures in the
// lanes, both hands visible, intent icons up and a card mid-play; the
// win/loss scenes are the real end screens over a real table. The same
// seed always gives the same frame.
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_CAMPAIGN_WIN, SCREEN_CAMPAIGN_LOSS, createGame, startDuel } from './state.js';
import { cardById, makeCreature } from './cards.js';

function creature(id) {
  return makeCreature(cardById(id));
}

// A rich mid-duel table for Duel 2 (Nessa, Tide court): lanes full, both
// hands visible, intent up, one card selected mid-play.
function stageTable(game) {
  startDuel(game, 1);
  game.campaignWins = 1; // Duel 2 means the first warden already fell
  game.turn = 5;
  game.player.life = 14;
  game.enemy.life = 11;
  game.player.maxEnergy = 5;
  game.player.energy = 4;
  game.player.turnCount = 5;
  game.enemy.turnCount = 5;
  // Mid-duel deck counts: five turns of draws have thinned both decks.
  game.player.deck.length = 15;
  game.enemy.deck.length = 14;
  // Player hand: a spread the judge can read — cheap to expensive, all suits.
  game.player.hand = [
    cardById('ember-imp'),
    cardById('cinder-drake'),
    cardById('coral-knight'),
    cardById('vine-titan'),
    cardById('umbral-drain'),
    cardById('healing-current'),
  ];
  game.player.suitsPlayedThisTurn = ['ember'];
  game.selected = 1; // Cinder Drake, raised mid-play
  // Enemy hand: five backs.
  game.enemy.hand = [
    cardById('tide-sprite'), cardById('coral-knight'), cardById('moon-jelly'),
    cardById('deep-leviathan'), cardById('healing-current'),
  ];
  // Lanes: a real fight, mid-swing.
  game.lanes[0].player = creature('thorn-sprout');
  game.lanes[0].player.health = 1;
  game.lanes[0].enemy = creature('coral-knight');
  game.lanes[1].player = creature('cinder-drake');
  game.lanes[1].enemy = creature('moon-jelly');
  game.lanes[2].enemy = creature('dusk-stalker');
  game.intent = { type: 'summon', lane: 2, text: 'The warden will summon in lane 3.' };
  game.log = ['You summon Cinder Drake to lane 2.', 'BOND — Ember Imp: +1 power.'];
  game.screen = SCREEN_PLAY;
  game.phase = 'player';
  return game;
}

function stageWin(game) {
  stageTable(game);
  game.campaignWins = 3;
  game.scoreLifeBank = 34;
  game.screen = SCREEN_CAMPAIGN_WIN;
  game.phase = 'over';
  return game;
}

function stageLoss(game) {
  stageTable(game);
  game.campaignWins = 1;
  game.player.life = 0;
  game.screen = SCREEN_CAMPAIGN_LOSS;
  game.phase = 'over';
  return game;
}

export function stageShot(name, seed) {
  const game = createGame(seed);
  if (name === 'table') return stageTable(game);
  if (name === 'win') return stageWin(game);
  if (name === 'loss') return stageLoss(game);
  // title (and anything unknown): the title screen.
  game.screen = SCREEN_TITLE;
  return game;
}
