// SIGILFALL — motion: floating damage numbers, sigil sparks, screen
// shake, and the slide of a card from hand to lane. One file, one job:
// everything that moves over time. The renderer asks it for offsets; the
// state pushes events into it through game.events.
export function createAnim() {
  return {
    floaters: [], // {x, y, text, color, size, life, maxLife}
    sparks: [], // {x, y, vx, vy, color, size, life, maxLife}
    shake: 0, // remaining shake magnitude, decays each frame
    shakeX: 0,
    shakeY: 0,
    time: 0,
  };
}

export function addFloater(anim, x, y, text, color, size) {
  anim.floaters.push({ x, y, text, color, size: size || 28, life: 1, maxLife: 1 });
}

export function burst(anim, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
    const v = (speed || 220) * (0.4 + Math.random() * 0.8);
    anim.sparks.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 60,
      color, size: 3 + Math.random() * 5,
      life: 1, maxLife: 1,
    });
  }
}

export function victoryBurst(anim, cx, cy) {
  const colors = ['#f2c94c', '#e5484d', '#3e9bff', '#43b581', '#9b7bea'];
  for (let i = 0; i < 90; i += 1) {
    burst(anim, cx + (Math.random() - 0.5) * 500, cy + (Math.random() - 0.5) * 200, colors[i % colors.length], 1, 320);
  }
}

export function kickShake(anim, amount) {
  anim.shake = Math.max(anim.shake, amount);
}

export function stepAnim(anim, dt) {
  anim.time += dt;
  for (let i = anim.floaters.length - 1; i >= 0; i -= 1) {
    const f = anim.floaters[i];
    f.life -= dt / 1.1;
    f.y -= 46 * dt;
    if (f.life <= 0) anim.floaters.splice(i, 1);
  }
  for (let i = anim.sparks.length - 1; i >= 0; i -= 1) {
    const s = anim.sparks[i];
    s.life -= dt / 1.4;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 260 * dt;
    if (s.life <= 0) anim.sparks.splice(i, 1);
  }
  if (anim.shake > 0) {
    anim.shake = Math.max(0, anim.shake - dt * 26);
    anim.shakeX = (Math.random() - 0.5) * anim.shake;
    anim.shakeY = (Math.random() - 0.5) * anim.shake;
  } else {
    anim.shakeX = 0;
    anim.shakeY = 0;
  }
}

// A card slides from (x0,y0) to (x1,y1) with a little arc: t in [0,1].
export function slidePoint(x0, y0, x1, y1, t) {
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return {
    x: x0 + (x1 - x0) * eased,
    y: y0 + (y1 - y0) * eased - Math.sin(eased * Math.PI) * 40,
  };
}
