// SIGILFALL — sound: a tiny WebAudio synth, no audio files, no network.
// Every effect is an oscillator (or two) with an envelope. Audio starts
// only after the player's first gesture, so browsers never block it.
export function createAudio() {
  return { ctx: null, enabled: true, musicTimer: null };
}

function ctx(audio) {
  if (!audio.ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audio.ctx = new AC();
    } catch {
      return null;
    }
  }
  if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume().catch(() => {});
  return audio.ctx;
}

function tone(audio, freq, dur, type, vol, when, slideTo) {
  const c = ctx(audio);
  if (!c || !audio.enabled) return;
  const t0 = c.currentTime + (when || 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function sfxPlay(audio) {
  tone(audio, 520, 0.12, 'triangle', 0.14, 0, 780);
  tone(audio, 1040, 0.1, 'sine', 0.06, 0.02);
}

export function sfxDraw(audio) {
  tone(audio, 700, 0.07, 'triangle', 0.08, 0, 900);
}

export function sfxHit(audio) {
  tone(audio, 180, 0.16, 'sawtooth', 0.16, 0, 70);
  tone(audio, 90, 0.2, 'square', 0.1, 0, 50);
}

export function sfxBond(audio) {
  tone(audio, 660, 0.1, 'triangle', 0.12);
  tone(audio, 880, 0.1, 'triangle', 0.12, 0.07);
  tone(audio, 1320, 0.16, 'sine', 0.1, 0.14);
}

export function sfxHeal(audio) {
  tone(audio, 440, 0.18, 'sine', 0.1, 0, 660);
  tone(audio, 660, 0.22, 'sine', 0.08, 0.08, 880);
}

export function sfxWin(audio) {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((n, i) => tone(audio, n, 0.28, 'triangle', 0.13, i * 0.11));
  tone(audio, 262, 0.7, 'sine', 0.08, 0.1);
}

export function sfxLose(audio) {
  const notes = [392, 330, 262, 196];
  notes.forEach((n, i) => tone(audio, n, 0.3, 'triangle', 0.11, i * 0.13));
}

export function sfxClick(audio) {
  tone(audio, 900, 0.05, 'square', 0.05);
}
