// SIGILFALL — combat previews and scoring. One file, one job: given a
// table, say what a strike will do before it happens. The renderer uses
// this to print predicted damage on each lane; the AI uses it to weigh a
// trade; the shot scenes use it to stage a table where the fight is
// visibly mid-swing.
import { RULES } from './config.js';

// For one side's strike: per lane, what hits the opposing creature and
// what spills over onto the warden.
export function previewStrike(game, side) {
  const foeSide = side === 'player' ? 'enemy' : 'player';
  const out = [];
  for (let lane = 0; lane < RULES.lanes; lane += 1) {
    const attacker = game.lanes[lane][side];
    if (!attacker) { out.push(null); continue; }
    const defender = game.lanes[lane][foeSide];
    if (!defender) {
      out.push({ toCreature: 0, toWarden: attacker.power, kills: false });
    } else {
      const kills = attacker.power >= defender.health;
      out.push({ toCreature: attacker.power, toWarden: kills ? attacker.power - defender.health : 0, kills });
    }
  }
  return out;
}

// Total warden damage one side's strike would deal right now.
export function strikeTotal(game, side) {
  return previewStrike(game, side).reduce((sum, p) => sum + (p ? p.toWarden : 0), 0);
}

// Is the game one strike away from ending for either side?
export function lethalCheck(game) {
  const playerLethal = strikeTotal(game, 'player') >= game.enemy.life;
  const enemyLethal = strikeTotal(game, 'enemy') >= game.player.life;
  return { playerLethal, enemyLethal };
}

// A lane's trade value for the AI: positive means the warden likes it.
export function laneValue(game, lane, side) {
  const me = game.lanes[lane][side];
  const foeSide = side === 'player' ? 'enemy' : 'player';
  const foe = game.lanes[lane][foeSide];
  if (!me && !foe) return 0;
  if (me && !foe) return me.power + 1;
  if (!me && foe) return -(foe.power + 1);
  return (me.power - foe.power) + (me.health - foe.health) * 0.5;
}
