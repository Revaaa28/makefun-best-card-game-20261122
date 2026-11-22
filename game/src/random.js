// SIGILFALL — a tiny seeded random source so every shot scene and every
// scripted playthrough is reproducible from one number.
export function createRandom(seed) {
  let a = seed >>> 0;
  if (a === 0) a = 0x9e3779b9;
  function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function int(n) {
    return Math.floor(next() * n);
  }
  // Fisher-Yates shuffle, in place, driven by this source.
  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = int(i + 1);
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }
  function pick(list) {
    return list[int(list.length)];
  }
  return { next, int, shuffle, pick };
}
