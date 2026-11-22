# SIGILFALL — a sigil-duel card game

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Revaaa28/makefun-best-card-game-20261122/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Revaaa28/makefun-best-card-game-20261122/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

An original card game built for the make.fun competition
**best-card-game-20261122-1826** — "Make the best card game".

## The game

Three wardens. Four suits. One ladder to climb.

SIGILFALL is a sigil-duel card game. You climb a 3-duel campaign against
three named wardens — Pyra of the Ember Court, Nessa of the Tide Court,
Vex of the Umbra Court — each with their own deck, personality and table
mood. Win all three duels to take the campaign.

A duel: each side has 20 life, a 24-card deck, an opening hand of 4 (one
mulligan), and 3 lanes. Each turn you draw 1, your energy refills and
grows (1, 2, 3 … cap 6), you play creatures and spells, and then your
creatures strike: each lane's creature hits the opposing creature, and
excess power hits the enemy warden's life. First to 0 life loses the duel.

- **Four suits, told by colour AND shape:** Ember (red, triangle), Tide
  (blue, circle), Thorn (green, diamond), Umbra (violet, square).
- **Bond combos:** playing a second card of the same suit in one turn
  triggers that card's Bond effect — draw, heal, burn, buff.
- **A readable opponent:** the warden TELEGRAPHS its intent — icons
  above its side show what it will do next turn (summon in a lane,
  strike, or hoard energy) — so you can read it and counter it.
- **Feel:** cards slide from hand, flip face-up, snap into lanes,
  floating damage numbers, screen shake on warden hits, a dealt-hand
  animation, and a victory flourish of sigil sparks.

## How to play

- **Mouse:** click a card in your hand, then click a lane to play it.
  Spells with no lane target play on a second click. Click **END TURN**
  when done.
- **Keyboard:** `1–5` select a card, `Q`/`W`/`E` play into lane 1/2/3,
  `Enter` ends the turn, `M` mulligans (first turn only).

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot scenes are staged by the game itself:
`?shot=table|title|win|loss&seed=N`.

## Structure

```
game/
  index.html
  src/
    config.js    — tuning, palette, suits, layout
    cards.js     — the 18-card pool and the decks
    campaign.js  — the three wardens and the campaign score
    state.js     — game state and the turn flow
    ai.js        — the warden AI and its telegraphed intent
    combat.js    — strike previews and lane values
    render.js    — everything painted on the canvas
    anim.js      — floaters, sparks, shake, slides
    audio.js     — WebAudio synth sounds (no audio files)
    input.js     — mouse + keyboard → game actions
    shots.js     — the ?shot= screenshot scenes
    main.js      — boot, loop, event → sound/motion
    random.js    — seeded random source
```

No network, no external assets, no build step — plain static files.
