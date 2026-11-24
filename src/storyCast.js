// Story cast, drawn as cartoons from the family's own photos (photos stay in /character, git-ignored, never published):
// Tô (hero), dad, mom and the 5 plush toys. (x, y) = point between the feet, s = unit.
// pose: dir (+-1), walk 0..1, t, arms 0..1, sleep, happy, look -1..1, rot, sx, sy, belly 0..1, mud 0..1, mouth 0..1, box
import { TAU } from './fx.js';

export const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(0.001, rx), Math.max(0.001, ry), rot, 0, TAU); c.fill(); };
const line = (c, x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
const box = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); c.fill(); };
const poly = (c, pts) => { c.beginPath(); for (const [x, y] of pts) c.lineTo(x, y); c.closePath(); c.fill(); };
const INK = '#33241e', SKIN = '#ffdcc0', HAIR = '#2b211f';
// All shapes below are in units of s (the context is scaled by s).

function eyes(c, p, xs, y, r, t) {
  const shut = p.sleep || p.happy || Math.sin(t * 1.3) > 0.985;
  for (const x of xs) {
    if (shut) { c.strokeStyle = INK; c.lineWidth = r * 0.6; c.beginPath(); if (p.happy) c.arc(x, y + r * 0.4, r, Math.PI, TAU); else c.arc(x, y, r, 0.1, Math.PI - 0.1); c.stroke(); }
    else { c.fillStyle = INK; ell(c, x, y, r, r * 1.2); c.fillStyle = '#fff'; ell(c, x + r * 0.35, y - r * 0.45, r * 0.4, r * 0.45); }
  }
}
function mouth(c, p, x, y, w) {
  const m = p.mouth || 0;
  if (m > 0.15) { c.fillStyle = '#8c2f3d'; ell(c, x, y + w * 0.2, w * 0.6, w * (0.2 + m * 0.5)); } else { c.strokeStyle = INK; c.lineWidth = w * 0.22; c.beginPath(); c.arc(x, y - w * 0.3, w * 0.7, 0.35, Math.PI - 0.35); c.stroke(); }
}
const cheeks = (c, xs, y, r) => { c.fillStyle = 'rgba(255,110,130,.4)'; for (const x of xs) ell(c, x, y, r, r * 0.7); };
// Two walking legs; returns nothing. w = leg width, h = hip height, g = half gap
function legs(c, sw, col, shoe, w, h, g) {
  for (const d of [-1, 1]) { const fx = d * g + d * sw * 0.42; c.strokeStyle = col; c.lineWidth = w; line(c, d * g, -h, fx, -0.18); c.fillStyle = shoe; ell(c, fx + 0.1, -0.1, w * 0.75, 0.15); }
}
function arms(c, p, sw, t, col, hand, x, y, len, w) {
  const up = p.arms || 0;
  for (const d of [-1, 1]) {
    const a = 1.05 - up * 2 + (up ? Math.sin(t * 14 + d) * 0.3 * up : d * sw * 0.5), hx = d * (x + Math.cos(a) * len), hy = y + Math.sin(a) * len;
    c.strokeStyle = col; c.lineWidth = w; line(c, d * x, y, hx, hy); if (hand) { c.fillStyle = hand; ell(c, hx, hy, w * 0.58, w * 0.58); }
  }
}
function head(c, p, x, y, t, f) { c.save(); c.translate(x, y); c.rotate((p.look || 0) * 0.25 + Math.sin(t * 2) * 0.03); f(); if (p.box) { c.fillStyle = '#c99a5b'; box(c, -1, -1, 2, 1.6, 0.08); c.fillStyle = '#b08040'; box(c, -1, -0.3, 2, 0.14, 0); } c.restore(); }

const DRAW = {
  // Tô: short dark hair, gold party crown, white shirt with stripes, beige vest, red bow, beige trousers
  to(c, p, sw, t) {
    const b = 1 + (p.belly || 0) * 0.3;
    legs(c, sw, '#b9a887', '#fff', 0.36, 0.6, 0.28);
    arms(c, p, sw, t, '#f6f1e6', SKIN, 0.5, -1.3, 0.55, 0.28);
    c.fillStyle = '#f6f1e6'; ell(c, 0, -0.98, 0.64 * b, 0.62);
    c.fillStyle = '#cdbb98'; for (const d of [-1, 1]) ell(c, d * 0.36 * b, -0.95, 0.3 * b, 0.6);
    c.strokeStyle = '#d8cbb0'; c.lineWidth = 0.04; for (const d of [-0.1, 0, 0.1]) line(c, d, -1.4, d, -0.5);
    head(c, p, 0, -2.2, t, () => {
      c.fillStyle = SKIN; for (const d of [-1, 1]) ell(c, d * 0.82, 0.05, 0.17, 0.2);
      c.fillStyle = HAIR; ell(c, 0, -0.2, 0.84, 0.66); c.fillStyle = SKIN; ell(c, 0, 0.08, 0.82, 0.7);
      c.fillStyle = HAIR; c.beginPath(); c.moveTo(-0.76, -0.2); c.quadraticCurveTo(-0.5, -0.9, 0, -0.84); c.quadraticCurveTo(0.5, -0.9, 0.76, -0.2); c.quadraticCurveTo(0.3, -0.5, 0.05, -0.42); c.quadraticCurveTo(-0.4, -0.48, -0.76, -0.2); c.fill();
      c.fillStyle = '#ffc93c'; poly(c, [[-0.36, -0.74], [-0.42, -1.2], [-0.18, -0.96], [0, -1.28], [0.18, -0.96], [0.42, -1.2], [0.36, -0.74]]); c.fillStyle = '#ff5d73'; ell(c, 0, -0.87, 0.09, 0.09);
      cheeks(c, [-0.5, 0.56], 0.3, 0.17); eyes(c, p, [-0.26, 0.34], 0.06, 0.13, t); c.fillStyle = '#eeb996'; ell(c, 0.05, 0.24, 0.08, 0.05); mouth(c, p, 0.05, 0.44, 0.2);
    });
    c.fillStyle = '#d8303f'; poly(c, [[0, -1.43], [-0.3, -1.6], [-0.3, -1.26]]); poly(c, [[0, -1.43], [0.3, -1.6], [0.3, -1.26]]); ell(c, 0, -1.43, 0.1, 0.1);
  },
  // Dad: white tee, light blue jeans, black hair
  dad(c, p, sw, t) {
    legs(c, sw, '#b9c6dc', '#fff', 0.5, 1.35, 0.3);
    arms(c, p, sw, t, SKIN, SKIN, 0.75, -2.55, 0.95, 0.27);
    c.fillStyle = '#fbfbfb'; box(c, -0.75, -2.85, 1.5, 1.6, 0.4); for (const d of [-1, 1]) ell(c, d * 0.75, -2.5, 0.3, 0.36);
    c.fillStyle = SKIN; box(c, -0.2, -3.05, 0.4, 0.35, 0.1);
    head(c, p, 0, -3.5, t, () => {
      c.fillStyle = SKIN; for (const d of [-1, 1]) ell(c, d * 0.66, 0.05, 0.14, 0.18); ell(c, 0, 0.05, 0.66, 0.72);
      c.fillStyle = HAIR; c.beginPath(); c.moveTo(-0.7, 0); c.quadraticCurveTo(-0.8, -0.95, 0.05, -0.92); c.quadraticCurveTo(0.8, -0.95, 0.7, 0); c.quadraticCurveTo(0.55, -0.4, 0.2, -0.45); c.quadraticCurveTo(-0.1, -0.2, -0.55, -0.35); c.fill();
      c.strokeStyle = HAIR; c.lineWidth = 0.07; line(c, -0.38, -0.16, -0.14, -0.18); line(c, 0.2, -0.18, 0.44, -0.16);
      eyes(c, p, [-0.25, 0.31], 0.04, 0.09, t); c.fillStyle = '#eeb996'; ell(c, 0.04, 0.2, 0.08, 0.06);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0.04, 0.34, 0.24, 0.1, Math.PI - 0.1); c.fill(); c.strokeStyle = '#b5534f'; c.lineWidth = 0.05; c.stroke();
    });
  },
  // Mom: red sleeveless top, black trousers, round glasses, tied-back hair
  mom(c, p, sw, t) {
    legs(c, sw, '#2f2b33', '#d8303f', 0.46, 1.3, 0.27);
    c.fillStyle = HAIR; ell(c, -0.62, -3.15, 0.26, 0.55, 0.35);
    arms(c, p, sw, t, SKIN, SKIN, 0.6, -2.4, 0.85, 0.23);
    c.fillStyle = '#d8303f'; box(c, -0.6, -2.65, 1.2, 1.5, 0.35); c.fillStyle = SKIN; box(c, -0.17, -2.9, 0.34, 0.4, 0.12);
    head(c, p, 0, -3.3, t, () => {
      c.fillStyle = HAIR; ell(c, 0, -0.1, 0.72, 0.74); c.fillStyle = SKIN; ell(c, 0.03, 0.1, 0.62, 0.62);
      c.fillStyle = HAIR; c.beginPath(); c.moveTo(-0.66, 0.1); c.quadraticCurveTo(-0.6, -0.8, 0.05, -0.8); c.quadraticCurveTo(0.7, -0.8, 0.68, 0.1); c.quadraticCurveTo(0.5, -0.3, -0.05, -0.5); c.quadraticCurveTo(-0.45, -0.3, -0.66, 0.1); c.fill();
      cheeks(c, [-0.36, 0.44], 0.3, 0.13); eyes(c, p, [-0.22, 0.3], 0.08, 0.09, t);
      c.strokeStyle = '#3a3a44'; c.lineWidth = 0.05; for (const d of [-0.22, 0.3]) { c.beginPath(); c.arc(d, 0.08, 0.21, 0, TAU); c.stroke(); } line(c, -0.01, 0.08, 0.09, 0.08);
      c.strokeStyle = '#d8303f'; c.lineWidth = 0.09; c.beginPath(); c.arc(0.04, 0.3, 0.18, 0.3, Math.PI - 0.3); c.stroke();
    });
  },
  shark(c, p, sw, t) {
    c.fillStyle = '#1f5078'; c.save(); c.translate(-1.15, -0.95); c.rotate(Math.sin(t * 6) * 0.25); poly(c, [[0.2, 0], [-0.75, -0.85], [-0.5, 0], [-0.75, 0.6]]); c.restore();
    poly(c, [[-0.4, -1.5], [-0.3, -2.3], [0.3, -1.55]]);
    ell(c, 0.05, -0.95, 1.35, 0.78); c.fillStyle = '#f4f7fb'; ell(c, 0.25, -0.55, 1.05, 0.42);
    c.fillStyle = '#e0426b'; c.beginPath(); c.arc(0.82, -0.68, 0.34, 0, Math.PI); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) poly(c, [[0.5 + i * 0.16, -0.69], [0.66 + i * 0.16, -0.69], [0.58 + i * 0.16, -0.54]]);
    c.strokeStyle = '#143852'; c.lineWidth = 0.05; for (let i = 0; i < 3; i++) line(c, 0.06 + i * 0.13, -1.25, 0.02 + i * 0.13, -0.95);
    eyes(c, p, [0.82], -1.08, 0.12, t); c.fillStyle = '#1a466b'; c.save(); c.translate(-0.05, -0.65); c.rotate(0.5 + (p.arms || 0) * -1.6 * Math.abs(Math.sin(t * 9)) + sw * 0.4); ell(c, -0.2, 0.3, 0.22, 0.5); c.restore();
  },
  capy(c, p, sw, t) {
    legs(c, sw, '#7b432c', '#7b432c', 0.3, 0.4, 0.4);
    c.fillStyle = '#c39a6f'; ell(c, -0.1, -1.1, 0.9, 1.0);
    head(c, p, 0.15, -2.0, t, () => {
      c.fillStyle = '#6d3a26'; ell(c, -0.45, -0.55, 0.18, 0.2); c.fillStyle = '#c39a6f'; ell(c, 0, 0, 0.82, 0.68); c.fillStyle = '#6d3a26'; ell(c, 0.5, 0.15, 0.48, 0.42);
      c.fillStyle = '#4c2517'; for (const d of [0.4, 0.64]) ell(c, d, 0.02, 0.06, 0.05); mouth(c, p, 0.52, 0.3, 0.16);
      if (p.happy || !p.sleep) { c.strokeStyle = INK; c.lineWidth = 0.08; line(c, -0.1, -0.22, 0.14, -0.2); }
    });
    c.fillStyle = '#8a55b8'; c.save(); c.translate(0.45, -0.85); c.rotate(0.15); box(c, -0.3, -0.65, 0.65, 1.2, 0.28); c.fillStyle = '#fff'; box(c, -0.24, -0.2, 0.53, 0.5, 0.06); c.restore();
    arms(c, p, sw, t, '#7b432c', null, 0.55, -1.15, 0.4, 0.26);
  },
  tart(c, p, sw, t) {
    c.strokeStyle = '#ffd83a'; legs(c, sw, '#ffd83a', '#ffd83a', 0.28, 0.6, 0.5);
    c.fillStyle = '#ffe04d'; c.beginPath(); c.moveTo(-1.15, -1.7); c.quadraticCurveTo(-1.05, -0.45, 0, -0.42); c.quadraticCurveTo(1.05, -0.45, 1.15, -1.7); c.fill();
    c.fillStyle = '#ffd21f'; ell(c, 0, -1.7, 1.25, 0.34); c.fillStyle = '#ffb92e'; ell(c, 0, -1.74, 1.08, 0.24); c.fillStyle = '#8f4a20'; for (const [a, d, r] of [[-0.5, -1.78, 0.24], [0.2, -1.68, 0.3], [0.65, -1.8, 0.16]]) ell(c, a, d, r, 0.09);
    cheeks(c, [-0.5, 0.5], -0.92, 0.13); eyes(c, p, [-0.3, 0.3], -1.08, 0.15, t); mouth(c, p, 0, -0.84, 0.16);
    if (p.arms) arms(c, p, sw, t, '#ffd83a', null, 0.9, -1.2, 0.45, 0.2);
  },
  bamboo(c, p, sw, t) {
    c.save(); c.transform(1, 0, Math.sin(t * 2.2) * 0.05 + sw * 0.08, 1, 0, 0);
    c.fillStyle = '#f6e3a0'; box(c, -0.58, -3.3, 1.16, 3.25, 0.56); c.fillStyle = '#eed68a'; box(c, -0.58, -3.3, 0.25, 3.25, 0.2);
    c.strokeStyle = '#6f9f3f'; c.lineWidth = 0.1; for (const y of [-2.05, -0.95]) line(c, -0.6, y, 0.6, y);
    c.fillStyle = '#7db24a'; c.save(); c.translate(0.58, -0.95); c.rotate(0.5 + Math.sin(t * 4) * 0.2 - (p.arms || 0) * 1.5); ell(c, 0.3, 0.05, 0.34, 0.11); c.restore(); c.save(); c.translate(-0.58, -2.05); c.rotate(2.2 + Math.sin(t * 4) * 0.2 + (p.arms || 0) * 1.5); ell(c, 0.3, 0, 0.34, 0.11); c.restore();
    c.fillStyle = 'rgba(255,90,150,.55)'; for (const d of [-0.38, 0.4]) ell(c, d, -2.5, 0.11, 0.08); eyes(c, p, [-0.22, 0.26], -2.72, 0.08, t); mouth(c, { mouth: 0.5 }, 0.02, -2.45, 0.2);
    c.restore();
  },
  // round fluffy brown bird: white face patches, long orange beak, long black wings
  bird(c, p, sw, t) {
    legs(c, sw, '#ff9a3c', '#ff9a3c', 0.14, 0.5, 0.3);
    c.fillStyle = '#8a4a2c'; ell(c, -0.95, -1.2, 0.5, 0.32, -0.5); c.fillStyle = '#fff'; ell(c, -0.8, -0.85, 0.5, 0.26, -0.3);
    c.fillStyle = '#c08d5c'; ell(c, 0, -1.25, 0.98, 0.95); c.fillStyle = '#cf9f6e'; for (let i = 0; i < 9; i++) ell(c, Math.cos(i * 0.7) * 0.85, -1.25 + Math.sin(i * 0.7) * 0.82, 0.2, 0.2);
    c.fillStyle = '#fff'; for (const d of [0.02, 0.62]) ell(c, d, -1.4, 0.31, 0.36); eyes(c, p, [0.08, 0.66], -1.38, 0.13, t);
    const m = p.mouth || 0; c.fillStyle = '#ff9a3c'; poly(c, [[0.22, -1.18], [0.62, -1.18], [0.95, -0.55 + m * 0.2], [0.7, -0.5 + m * 0.2]]);
    c.strokeStyle = '#26221f'; c.lineWidth = 0.24; for (const d of [-1, 1]) { const a = 1.15 - (p.arms || 0) * 1.9 + Math.sin(t * (p.arms ? 14 : 3)) * 0.2 + sw * 0.4 * d; line(c, d * 0.95, -1.15, d * (0.95 + Math.cos(a) * 0.6), -1.15 + Math.sin(a) * 0.75); }
  },
};
// The next three are original designs (only the animal kinds come from the stickers, which show branded characters).
Object.assign(DRAW, {
  panda(c, p, sw, t) { // blue scarf
    legs(c, sw, '#2d2a30', '#2d2a30', 0.4, 0.6, 0.36);
    c.fillStyle = '#fff'; ell(c, 0, -1.0, 0.8, 0.75); arms(c, p, sw, t, '#2d2a30', null, 0.62, -1.3, 0.5, 0.32);
    head(c, p, 0.08, -2.1, t, () => { c.fillStyle = '#2d2a30'; for (const d of [-1, 1]) ell(c, d * 0.58, -0.55, 0.27, 0.27); c.fillStyle = '#fff'; ell(c, 0, 0, 0.84, 0.74); c.fillStyle = '#2d2a30'; ell(c, -0.3, 0, 0.22, 0.28, 0.4); ell(c, 0.4, 0, 0.22, 0.28, -0.4); c.fillStyle = '#fff'; for (const d of [-0.28, 0.4]) ell(c, d, 0, 0.14, 0.16); eyes(c, p, [-0.27, 0.41], 0, 0.1, t); c.fillStyle = '#2d2a30'; ell(c, 0.07, 0.24, 0.1, 0.07); mouth(c, p, 0.07, 0.42, 0.18); });
    c.fillStyle = '#3f8fe0'; box(c, -0.5, -1.48, 1.05, 0.22, 0.11); box(c, 0.2, -1.4, 0.28, 0.7, 0.1);
  },
  puppy(c, p, sw, t) { // brown with a cream belly, floppy ears, green collar
    legs(c, sw, '#9c5a36', '#f3dcc0', 0.32, 0.55, 0.34);
    c.strokeStyle = '#9c5a36'; c.lineWidth = 0.26; c.beginPath(); c.moveTo(-0.6, -0.8); c.quadraticCurveTo(-1.3, -1, -1.15 + Math.sin(t * 12) * 0.2, -1.6); c.stroke();
    c.fillStyle = '#9c5a36'; ell(c, 0, -1.0, 0.72, 0.72); c.fillStyle = '#f3dcc0'; ell(c, 0.15, -0.9, 0.44, 0.52); arms(c, p, sw, t, '#9c5a36', '#f3dcc0', 0.52, -1.25, 0.45, 0.26);
    head(c, p, 0.1, -2.05, t, () => { c.fillStyle = '#9c5a36'; ell(c, 0, 0, 0.78, 0.68); c.fillStyle = '#6f3c22'; for (const d of [-1, 1]) ell(c, d * 0.74, 0.05 + Math.abs(sw) * 0.1, 0.22, 0.5, d * -0.25); c.fillStyle = '#f3dcc0'; ell(c, 0.18, 0.28, 0.42, 0.3); eyes(c, p, [-0.2, 0.42], -0.08, 0.12, t); c.fillStyle = '#33241e'; ell(c, 0.2, 0.16, 0.13, 0.09); mouth(c, p, 0.2, 0.4, 0.18); });
    c.fillStyle = '#58b368'; box(c, -0.45, -1.55, 1.0, 0.18, 0.09);
  },
  dino(c, p, sw, t) { // mint baby dinosaur with orange back plates and spots
    legs(c, sw, '#6fd0b0', '#4fb394', 0.4, 0.55, 0.36);
    c.fillStyle = '#6fd0b0'; poly(c, [[-0.4, -1.2], [-1.6, -0.35 + Math.sin(t * 5) * 0.12], [-0.2, -0.35]]);
    c.fillStyle = '#ff9f5a'; for (const [a, d] of [[-0.75, -1.6], [-0.95, -1.1], [-1.1, -0.7]]) poly(c, [[a + 0.3, d - 0.15], [a - 0.18, d - 0.22], [a + 0.25, d + 0.3]]);
    c.fillStyle = '#6fd0b0'; ell(c, 0, -1.0, 0.8, 0.8); c.fillStyle = '#e4f7d2'; ell(c, 0.2, -0.92, 0.5, 0.58); c.fillStyle = '#4fb394'; for (const [a, d] of [[-0.5, -1.2], [-0.58, -0.8], [-0.36, -1.5]]) ell(c, a, d, 0.1, 0.1);
    arms(c, p, sw, t, '#4fb394', null, 0.55, -1.2, 0.38, 0.24);
    head(c, p, 0.15, -2.05, t, () => { c.fillStyle = '#ff9f5a'; for (const a of [-0.35, 0, 0.35]) poly(c, [[a - 0.17, -0.5], [a, -1.0], [a + 0.17, -0.5]]); c.fillStyle = '#6fd0b0'; ell(c, 0, 0, 0.76, 0.64); ell(c, 0.4, 0.18, 0.55, 0.42); eyes(c, p, [-0.12, 0.45], -0.15, 0.13, t); c.fillStyle = '#3a8a70'; for (const a of [0.68, 0.84]) ell(c, a, 0.08, 0.04, 0.05); cheeks(c, [-0.3], 0.2, 0.15); mouth(c, p, 0.55, 0.36, 0.2); });
  },
});
export const SIZE = { to: 1, dad: 1.12, mom: 1.08, shark: 1.15, capy: 1.1, tart: 0.95, bamboo: 1.1, bird: 1, panda: 1.05, puppy: 1, dino: 1.05 };

export function drawChar(c, kind, x, y, s, p) {
  const t = p.t, w = p.walk || 0, sw = Math.sin(t * 13) * w, k = s * (SIZE[kind] || 1);
  c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,.13)'; ell(c, 0, 0, k * 0.95, k * 0.17);
  c.scale((p.dir || 1) * (p.sx || 1) * k, (p.sy || 1) * k); c.lineCap = 'round'; c.lineJoin = 'round';
  if (p.rot) { c.translate(0, -1.2); c.rotate(p.rot); c.translate(0, 1.2); }
  if (p.sleep && kind !== 'mom' && kind !== 'dad') { c.translate(1, -0.7); c.rotate(-1.35); }
  c.translate(0, -Math.abs(sw) * 0.14);
  (DRAW[kind] || DRAW.to)(c, p, sw, t);
  if (p.mud > 0.05) { c.globalAlpha = Math.min(1, p.mud); c.fillStyle = '#7a4d2b'; for (const [a, d, r] of [[-0.35, -1.2, 0.2], [0.3, -0.7, 0.22], [-0.1, -0.5, 0.17], [0.4, -1.4, 0.13], [0.58, -1.85, 0.12], [-0.6, -2.35, 0.1]]) if (kind === 'to' || d > -1.7) ell(c, a, d, r, r * 0.8); c.globalAlpha = 1; }
  c.restore();
}
