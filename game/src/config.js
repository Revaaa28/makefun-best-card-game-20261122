// SIGILFALL — every tuning number, colour and layout constant in one place.
// The table is a fixed 1280x800 logical area; the renderer scales it to the window,
// so no rule below depends on the screen size.
export const TABLE = { width: 1280, height: 800 };

export const RULES = {
  startLife: 20,
  deckSize: 24,
  openingHand: 4,
  lanes: 3,
  maxHand: 7,
  maxEnergy: 6,
  duelsToWin: 3,
};

// The four suits: told apart by colour AND shape, never by text alone.
export const SUITS = {
  ember: { name: 'Ember', color: '#e5484d', dark: '#8f1d22', light: '#ffb3a7', shape: 'triangle', glow: '#ff6b5e' },
  tide: { name: 'Tide', color: '#3e9bff', dark: '#144a8a', light: '#bfe0ff', shape: 'circle', glow: '#6ec1ff' },
  thorn: { name: 'Thorn', color: '#43b581', dark: '#14532d', light: '#b8f0cd', shape: 'diamond', glow: '#5ed69a' },
  umbra: { name: 'Umbra', color: '#9b7bea', dark: '#4c2d8f', light: '#ddd0ff', shape: 'square', glow: '#b79cff' },
};
export const SUIT_KEYS = ['ember', 'tide', 'thorn', 'umbra'];

// Layout of the table (logical pixels).
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 58 },
  enemyHand: { y: 66, cardW: 62, cardH: 84, gap: 10 },
  intentRow: { y: 158, h: 34 },
  lanes: { x: 150, y: 200, w: 980, gap: 18, laneH: 330 },
  // inside a lane: enemy creature slot (top) and player creature slot (bottom)
  enemySlot: { h: 150 },
  playerSlot: { h: 150 },
  playerHand: { y: 566, cardW: 148, cardH: 196, gap: 12 },
  endTurn: { x: 1110, y: 700, w: 140, h: 62 },
  energy: { x: 30, y: 700 },
  deckCount: { x: 30, y: 600 },
};

export const PALETTE = {
  backdrop: '#14101f',
  tableFelt: '#1d2b3a',
  tableFelt2: '#22384a',
  tableEdge: '#3a2f5e',
  panel: '#241d33',
  panelEdge: '#4b3f6e',
  text: '#f4efe6',
  muted: '#a89ec4',
  gold: '#f2c94c',
  life: '#ff5d73',
  energy: '#58c8f2',
  white: '#ffffff',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
export const FONT_DISPLAY = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
