// SIGILFALL — the campaign: a 3-duel ladder against three named wardens.
// Each warden owns a court (a table mood), a deck, a personality the AI
// plays by, and an interlude card that introduces them. Beating all three
// wins the campaign; losing any duel ends it in defeat.
import { WARDEN_DECK_IDS } from './cards.js';

export const WARDENS = [
  {
    name: 'Pyra of the Ember Court',
    short: 'PYRA',
    court: 'Ember Court',
    title: 'Warden of the First Flame',
    intro: 'She burns bright and fast. Survive her opening rush and her fire gutters.',
    mood: 'ember',
    deckIds: WARDEN_DECK_IDS[0],
    // AI personality: aggressive — plays creatures into empty lanes, strikes early.
    aggression: 0.8,
    hoardChance: 0.1,
    portrait: 'flame',
  },
  {
    name: 'Nessa of the Tide Court',
    short: 'NESSA',
    court: 'Tide Court',
    title: 'Warden of the Deep Current',
    intro: 'She heals, she draws, she outlasts. Beat her before the tide turns.',
    mood: 'tide',
    deckIds: WARDEN_DECK_IDS[1],
    aggression: 0.55,
    hoardChance: 0.25,
    portrait: 'wave',
  },
  {
    name: 'Vex of the Umbra Court',
    short: 'VEX',
    court: 'Umbra Court',
    title: 'Warden of the Last Shadow',
    intro: 'He drains your life and plays the long dark. Only a perfect ladder beats him.',
    mood: 'umbra',
    deckIds: WARDEN_DECK_IDS[2],
    aggression: 0.65,
    hoardChance: 0.2,
    portrait: 'moon',
  },
];

export function wardenForDuel(duelIndex) {
  return WARDENS[Math.min(duelIndex, WARDENS.length - 1)];
}

// Campaign score: duels won are worth 100 each, plus the life you finish
// each duel with, plus a bonus for a fast campaign.
export function campaignScore(state) {
  let score = state.campaignWins * 100;
  score += state.scoreLifeBank || 0;
  if (state.campaignWins >= 3) score += 50;
  return score;
}
