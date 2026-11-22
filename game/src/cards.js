// SIGILFALL — the card pool. Every card is an original design.
// A creature has cost / power / health printed big on the card.
// A spell has a cost and an effect; some need a lane target.
// BOND: playing a second card of the same suit in one turn triggers the
// card's bond effect (bondText). The bond is what turns a good hand into
// a combo — the judge's "cards that combine in more than one way".
//
// Card definition fields:
//   id, name, suit, kind ('creature' | 'spell'), cost,
//   power, health (creatures), text (what it does), bondText,
//   effect: 'damageWarden' | 'heal' | 'draw' | 'buffLane' | 'damageLane' | 'drain'
//   amount: the effect's number, target: 'warden' | 'self' | 'lane' | 'ownLane'

export const CARD_POOL = [
  // ---- EMBER (red triangle): fast, aggressive, burns the warden ----
  { id: 'ember-imp', name: 'Ember Imp', suit: 'ember', kind: 'creature', cost: 1, power: 2, health: 1,
    text: 'Quick and hungry.', bondText: 'Bond: +1 power.',
    bond: { effect: 'selfPower', amount: 1 } },
  { id: 'cinder-drake', name: 'Cinder Drake', suit: 'ember', kind: 'creature', cost: 3, power: 3, health: 3,
    text: 'Its wings trail sparks.', bondText: 'Bond: burn the warden for 1.',
    bond: { effect: 'damageWarden', amount: 1 } },
  { id: 'flamecaller', name: 'Flamecaller', suit: 'ember', kind: 'creature', cost: 4, power: 4, health: 4,
    text: 'She speaks and the air ignites.', bondText: 'Bond: burn a foe creature for 2.',
    bond: { effect: 'damageLane', amount: 2 } },
  { id: 'pyre-burst', name: 'Pyre Burst', suit: 'ember', kind: 'spell', cost: 2,
    text: 'Deal 3 damage to the enemy warden.', bondText: 'Bond: deal 2 more.',
    effect: 'damageWarden', amount: 3, bond: { effect: 'damageWarden', amount: 2 } },
  { id: 'ember-phoenix', name: 'Ember Phoenix', suit: 'ember', kind: 'creature', cost: 6, power: 6, health: 6,
    text: 'It dies in flame and returns.', bondText: 'Bond: burn ALL foe creatures for 2.',
    bond: { effect: 'damageAllFoes', amount: 2 } },

  // ---- TIDE (blue circle): deep, patient, draws and heals ----
  { id: 'tide-sprite', name: 'Tide Sprite', suit: 'tide', kind: 'creature', cost: 1, power: 1, health: 2,
    text: 'It rides the smallest wave.', bondText: 'Bond: draw a card.',
    bond: { effect: 'draw', amount: 1 } },
  { id: 'coral-knight', name: 'Coral Knight', suit: 'tide', kind: 'creature', cost: 2, power: 2, health: 3,
    text: 'Armour grown, not forged.', bondText: 'Bond: heal 2 life.',
    bond: { effect: 'heal', amount: 2 } },
  { id: 'moon-jelly', name: 'Moon Jelly', suit: 'tide', kind: 'creature', cost: 3, power: 2, health: 4,
    text: 'It glows; the dark steps back.', bondText: 'Bond: heal 3 life.',
    bond: { effect: 'heal', amount: 3 } },
  { id: 'deep-leviathan', name: 'Deep Leviathan', suit: 'tide', kind: 'creature', cost: 5, power: 5, health: 6,
    text: 'The whole sea in one shape.', bondText: 'Bond: draw a card.',
    bond: { effect: 'draw', amount: 1 } },
  { id: 'healing-current', name: 'Healing Current', suit: 'tide', kind: 'spell', cost: 2,
    text: 'Restore 4 life to yourself.', bondText: 'Bond: draw a card.',
    effect: 'heal', amount: 4, bond: { effect: 'draw', amount: 1 } },

  // ---- THORN (green diamond): grows, toughens, overruns ----
  { id: 'thorn-sprout', name: 'Thorn Sprout', suit: 'thorn', kind: 'creature', cost: 1, power: 2, health: 2,
    text: 'Small, sharp, everywhere.', bondText: 'Bond: +1 health.',
    bond: { effect: 'selfHealth', amount: 1 } },
  { id: 'bramble-guard', name: 'Bramble Guard', suit: 'thorn', kind: 'creature', cost: 2, power: 1, health: 4,
    text: 'A wall that bites back.', bondText: 'Bond: all your creatures +2 health.',
    bond: { effect: 'teamHealth', amount: 2 } },
  { id: 'vine-titan', name: 'Vine Titan', suit: 'thorn', kind: 'creature', cost: 4, power: 4, health: 5,
    text: 'The forest stands up.', bondText: 'Bond: all your creatures +1 power.',
    bond: { effect: 'teamPower', amount: 1 } },
  { id: 'overgrowth', name: 'Overgrowth', suit: 'thorn', kind: 'spell', cost: 3, target: 'ownLane',
    text: 'A friendly creature in a lane gains +2 power and +2 health.', bondText: 'Bond: heal 2 life.',
    effect: 'buffLane', amount: 2, bond: { effect: 'heal', amount: 2 } },

  // ---- UMBRA (violet square): drains, strikes from the dark ----
  { id: 'shade-wisp', name: 'Shade Wisp', suit: 'umbra', kind: 'creature', cost: 1, power: 1, health: 2,
    text: 'It is gone before you look.', bondText: 'Bond: drain the warden for 1.',
    bond: { effect: 'damageWarden', amount: 1 } },
  { id: 'dusk-stalker', name: 'Dusk Stalker', suit: 'umbra', kind: 'creature', cost: 3, power: 3, health: 2,
    text: 'It hunts the lane it stands in.', bondText: 'Bond: strike a foe creature for 2.',
    bond: { effect: 'damageLane', amount: 2 } },
  { id: 'nightmare-herald', name: 'Nightmare Herald', suit: 'umbra', kind: 'creature', cost: 5, power: 5, health: 5,
    text: 'Dreams end where it walks.', bondText: 'Bond: drain the warden for 2.',
    bond: { effect: 'damageWarden', amount: 2 } },
  { id: 'umbral-drain', name: 'Umbral Drain', suit: 'umbra', kind: 'spell', cost: 2,
    text: 'Deal 2 to the enemy warden and heal 2 life.', bondText: 'Bond: deal 2 more.',
    effect: 'drain', amount: 2, bond: { effect: 'damageWarden', amount: 2 } },
];

export function cardById(id) {
  return CARD_POOL.find((c) => c.id === id);
}

// A fresh creature on the table: its own mutable copy of the definition.
export function makeCreature(def) {
  return { def, power: def.power, health: def.health, maxHealth: def.health, justPlayed: true };
}

// How many copies of each card go into a deck built from a list of ids.
export function buildDeck(ids, rng) {
  const deck = ids.map((id) => cardById(id));
  return rng.shuffle(deck.slice());
}

// The player's balanced ladder deck: 24 cards, two copies of the cheap
// workhorses, one of each finisher.
export const PLAYER_DECK_IDS = [
  'ember-imp', 'ember-imp', 'cinder-drake', 'flamecaller', 'pyre-burst', 'pyre-burst',
  'tide-sprite', 'tide-sprite', 'coral-knight', 'coral-knight', 'moon-jelly', 'healing-current', 'healing-current',
  'thorn-sprout', 'thorn-sprout', 'bramble-guard', 'bramble-guard', 'vine-titan', 'overgrowth',
  'shade-wisp', 'shade-wisp', 'dusk-stalker', 'umbral-drain', 'umbral-drain',
];

// Warden decks escalate: more expensive cards, tighter suit focus.
export const WARDEN_DECK_IDS = [
  // Duel 1 — Pyra, Ember court: cheap and fast.
  ['ember-imp', 'ember-imp', 'ember-imp', 'cinder-drake', 'cinder-drake', 'pyre-burst', 'pyre-burst',
   'thorn-sprout', 'thorn-sprout', 'bramble-guard', 'bramble-guard', 'vine-titan',
   'tide-sprite', 'tide-sprite', 'coral-knight', 'coral-knight',
   'shade-wisp', 'shade-wisp', 'dusk-stalker', 'umbral-drain',
   'ember-imp', 'cinder-drake', 'thorn-sprout', 'coral-knight'],
  // Duel 2 — Nessa, Tide court: deep, healing, card draw.
  ['tide-sprite', 'tide-sprite', 'coral-knight', 'coral-knight', 'moon-jelly', 'moon-jelly',
   'deep-leviathan', 'healing-current', 'healing-current', 'healing-current',
   'ember-imp', 'ember-imp', 'cinder-drake', 'flamecaller', 'pyre-burst',
   'thorn-sprout', 'bramble-guard', 'vine-titan', 'overgrowth',
   'shade-wisp', 'dusk-stalker', 'umbral-drain', 'umbral-drain', 'nightmare-herald'],
  // Duel 3 — Vex, Umbra court: heavy finishers, drains, no mercy.
  ['shade-wisp', 'shade-wisp', 'dusk-stalker', 'dusk-stalker', 'nightmare-herald', 'nightmare-herald',
   'umbral-drain', 'umbral-drain', 'umbral-drain',
   'ember-phoenix', 'flamecaller', 'flamecaller', 'cinder-drake', 'pyre-burst', 'pyre-burst',
   'deep-leviathan', 'moon-jelly', 'healing-current', 'healing-current',
   'vine-titan', 'overgrowth', 'bramble-guard', 'thorn-sprout', 'coral-knight'],
];
