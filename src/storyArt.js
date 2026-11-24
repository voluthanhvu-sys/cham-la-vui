// Props and scrolling scenery of the story game (characters: storyCast.js).
import { TAU } from './fx.js';
import { drawStar } from './art.js';

export const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); c.fill(); };
const line = (c, x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
const box = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); c.fill(); };
// Props: (x, y) ground point, s = unit. o: w wobble 0..1, on open/used, c color, dirty
export function drawProp(c, type, x, y, s, t, o) {
  c.save(); c.translate(x, y); if (o.w > 0) c.rotate(Math.sin(o.w * 30) * 0.16 * o.w); c.lineCap = 'round';
  if (type !== 'puddle' && type !== 'balloon') { c.fillStyle = 'rgba(0,0,0,.12)'; ell(c, 0, 0, s * 1.2, s * 0.2); }
  switch (type) {
    case 'puddle': c.fillStyle = '#7a4d2b'; ell(c, 0, 0, s * 1.7, s * 0.45); c.fillStyle = '#95683f'; ell(c, -s * 0.2, -s * 0.06, s * 1.2, s * 0.26); break;
    case 'cake': c.fillStyle = '#fff'; ell(c, 0, -s * 0.1, s * 1.15, s * 0.22); c.fillStyle = '#f2b36b'; box(c, -s * 0.9, -s * 1.1, s * 1.8, s, s * 0.12); c.fillStyle = '#ff9ec4'; box(c, -s, -s * 1.35, s * 2, s * 0.5, s * 0.25); for (const d of [-0.6, 0, 0.6]) ell(c, d * s, -s * 0.85, s * 0.2, s * 0.28); c.fillStyle = '#e63950'; ell(c, 0, -s * 1.5, s * 0.2, s * 0.2); break;
    case 'tub': c.fillStyle = '#eef4ff'; box(c, -s * 1.5, -s * 1.1, s * 3, s * 1.05, s * 0.5); c.fillStyle = '#9fdcff'; ell(c, 0, -s * 1.1, s * 1.4, s * 0.3); c.fillStyle = '#fff'; for (let i = 0; i < 7; i++) ell(c, (i - 3) * s * 0.4, -s * 1.2 - Math.sin(t * 2 + i) * s * 0.08, s * 0.28, s * 0.26); break;
    case 'bed': c.fillStyle = '#a8713d'; box(c, -s * 1.8, -s * 1.8, s * 0.3, s * 1.8, s * 0.1); box(c, s * 1.5, -s * 1.1, s * 0.3, s * 1.1, s * 0.1); c.fillStyle = '#fff'; box(c, -s * 1.6, -s * 0.9, s * 3.2, s * 0.5, s * 0.15); ell(c, -s * 1.05, -s * 1.05, s * 0.5, s * 0.28); c.fillStyle = o.dirty ? '#a08060' : '#7aa7ff'; box(c, -s * 0.5, -s * 1.1, s * 2.1, s * 0.75, s * 0.2); break;
    case 'ball': c.fillStyle = '#ff5d73'; ell(c, 0, -s * 0.8, s * 0.8, s * 0.8); c.fillStyle = '#fff'; ell(c, 0, -s * 0.8, s * 0.3, s * 0.8, 0.4); c.fillStyle = '#4cc9f0'; ell(c, 0, -s * 0.8, s * 0.16, s * 0.16); break;
    case 'drum': c.fillStyle = '#e63950'; box(c, -s, -s * 1.3, s * 2, s * 1.3, s * 0.2); c.fillStyle = '#ffd23f'; box(c, -s * 1.05, -s * 1.35, s * 2.1, s * 0.2, s * 0.1); box(c, -s * 1.05, -s * 0.2, s * 2.1, s * 0.2, s * 0.1); c.fillStyle = '#fff8e6'; ell(c, 0, -s * 1.35, s, s * 0.28); break;
    case 'flower': { const g = 1 + Math.min(1, o.on || 0) * 0.5; c.strokeStyle = '#3f9e4d'; c.lineWidth = s * 0.16; line(c, 0, 0, 0, -s * 1.6 * g); c.fillStyle = o.c; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.sin(t) * 0.1; ell(c, Math.cos(a) * s * 0.5 * g, -s * 1.7 * g + Math.sin(a) * s * 0.5 * g, s * 0.34 * g, s * 0.34 * g); } c.fillStyle = '#ffd23f'; ell(c, 0, -s * 1.7 * g, s * 0.32 * g, s * 0.32 * g); break; }
    case 'gift': c.fillStyle = o.c; box(c, -s, -s * 1.5, s * 2, s * 1.5, s * 0.1); c.fillStyle = '#fff3b0'; box(c, -s * 0.16, -s * 1.5, s * 0.32, s * 1.5, 0); c.save(); if (o.on > 0) { c.translate(-s, -s * 1.5); c.rotate(-1.2 * Math.min(1, o.on)); c.translate(s, s * 1.5); } c.fillStyle = o.c; box(c, -s * 1.15, -s * 1.85, s * 2.3, s * 0.42, s * 0.1); c.fillStyle = '#fff3b0'; ell(c, -s * 0.3, -s * 2, s * 0.32, s * 0.18, 0.4); ell(c, s * 0.3, -s * 2, s * 0.32, s * 0.18, -0.4); c.restore(); break;
    case 'balloon': { const bx = Math.sin(t) * s * 0.2; c.strokeStyle = '#8a7a6a'; c.lineWidth = s * 0.06; line(c, 0, 0, bx, -s * 2); c.fillStyle = o.c; ell(c, bx, -s * 2.7, s * 0.75, s * 0.9); c.fillStyle = 'rgba(255,255,255,.5)'; ell(c, bx - s * 0.25, -s * 3, s * 0.14, s * 0.24, 0.4); break; }
    case 'lamp': c.strokeStyle = '#8a5c38'; c.lineWidth = s * 0.18; line(c, 0, 0, 0, -s * 2); c.fillStyle = o.on ? '#6a5a8a' : '#ffd23f'; c.beginPath(); c.moveTo(-s * 0.9, -s * 1.9); c.lineTo(s * 0.9, -s * 1.9); c.lineTo(s * 0.5, -s * 2.8); c.lineTo(-s * 0.5, -s * 2.8); c.fill(); break;
    case 'car': c.fillStyle = o.dirty ? '#a05a4a' : '#ff5d4d'; box(c, -s * 2, -s * 1.4, s * 4, s * 1.1, s * 0.4); box(c, -s * 1.2, -s * 2.3, s * 2.3, s * 1.2, s * 0.45); c.fillStyle = '#c8f0ff'; box(c, -s * 0.95, -s * 2.1, s * 0.85, s * 0.7, s * 0.15); box(c, s * 0.05, -s * 2.1, s * 0.85, s * 0.7, s * 0.15); for (const d of [-1.1, 1.1]) { c.fillStyle = '#333'; ell(c, d * s, -s * 0.3, s * 0.48, s * 0.48); c.fillStyle = '#ddd'; ell(c, d * s, -s * 0.3, s * 0.2, s * 0.2); } c.fillStyle = '#ffd23f'; ell(c, s * 1.9, -s, s * 0.2, s * 0.2); break;
    case 'boat': c.translate(0, Math.sin(t * 2) * s * 0.1); c.fillStyle = '#a8713d'; c.beginPath(); c.moveTo(-s * 2, -s); c.lineTo(s * 2, -s); c.lineTo(s * 1.3, 0); c.lineTo(-s * 1.3, 0); c.fill(); c.strokeStyle = '#7a4d2b'; c.lineWidth = s * 0.16; line(c, 0, -s, 0, -s * 3.6); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(s * 0.12, -s * 3.5); c.quadraticCurveTo(s * 2, -s * 2.4, s * 0.12, -s * 1.3); c.fill(); break;
    case 'rocket': if (o.w > 0) { c.fillStyle = '#ffb627'; ell(c, 0, 0, s * 0.4, s * 0.8); } c.fillStyle = '#ff5d4d'; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * s * 0.6, -s * 1.5); c.lineTo(d * s * 1.4, 0); c.lineTo(d * s * 0.5, -s * 0.4); c.fill(); } c.fillStyle = '#e9edfb'; ell(c, 0, -s * 1.9, s * 0.85, s * 1.8); c.fillStyle = '#ff5d4d'; c.beginPath(); c.moveTo(-s * 0.55, -s * 3.25); c.quadraticCurveTo(0, -s * 4.6, s * 0.55, -s * 3.25); c.fill(); c.fillStyle = '#4cc9f0'; ell(c, 0, -s * 2.3, s * 0.42, s * 0.42); break;
  }
  c.restore();
}

const hill = (c, W, H, y, amp, len, off) => { c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, y + Math.sin((x + off) / len) * amp + Math.sin((x + off) / len * 0.43) * amp * 0.6); c.lineTo(W + 20, H); c.fill(); };
// Scrolling scenery. cam = camera x, night 0..1, rain 0..1
export function drawWorld(c, place, W, H, S, gy, cam, t, night, rain) {
  const sky = { garden: ['#8fdcff', '#e6fbff'], beach: ['#6fcfff', '#fff3cf'], home: ['#ffd9b8', '#fff1e0'] }[place];
  const g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (place !== 'home') {
    c.fillStyle = '#ffd23f'; ell(c, W * 0.5, gy * 0.3 + Math.sin(t * 0.5) * 6, S * 0.08, S * 0.08);
    c.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 5; i++) { const span = W * 1.4, x = ((i * 0.31 * W + t * 14 - cam * 0.15) % span + span) % span - W * 0.2, y = gy * (0.15 + (i % 3) * 0.17); for (const [a, r] of [[-0.07, 0.04], [0, 0.06], [0.07, 0.045]]) ell(c, x + a * S, y, r * S * 1.2, r * S); }
  }
  if (place === 'garden') {
    c.fillStyle = '#a9dd8c'; hill(c, W, H, gy - S * 0.12, S * 0.07, 170, cam * 0.3); c.fillStyle = '#86ca6b'; hill(c, W, H, gy - S * 0.04, S * 0.05, 120, cam * 0.6);
    const step = S * 0.5; for (let i = 0; i * step < W + step * 2; i++) { const x = i * step - ((cam * 0.6) % step); c.fillStyle = '#8a5c38'; c.fillRect(x - S * 0.02, gy - S * 0.2, S * 0.04, S * 0.22); c.fillStyle = '#4ea64f'; ell(c, x + Math.sin(t + i) * 3, gy - S * 0.28, S * 0.13, S * 0.14); }
    c.fillStyle = '#74c25a'; c.fillRect(0, gy, W, H - gy);
  } else if (place === 'beach') {
    c.fillStyle = '#39b3e6'; c.fillRect(0, gy - S * 0.22, W, S * 0.3);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3; for (let r = 0; r < 4; r++) { c.beginPath(); for (let x = 0; x <= W + 12; x += 12) c.lineTo(x, gy - S * 0.18 + r * S * 0.05 + Math.sin((x + cam * 0.5) / 40 + t * 2 + r * 2) * 4); c.stroke(); }
    c.fillStyle = '#f5dc9a'; hill(c, W, H, gy + 4, 6, 90, cam);
  } else {
    const st = S * 0.16; c.strokeStyle = 'rgba(255,160,120,.35)'; c.lineWidth = S * 0.03; for (let i = 0; i * st < W + st * 2; i++) { const x = i * st - ((cam * 0.5) % st); line(c, x, 0, x, gy); }
    const gap = S * 0.9, w = S * 0.16; for (let i = 0; i * gap < W + gap * 2; i++) { const x = i * gap + gap * 0.5 - ((cam * 0.5) % gap); c.fillStyle = '#fff'; box(c, x - w * 1.1, gy * 0.22, w * 2.2, w * 2.2, 8); c.fillStyle = night > 0.5 ? '#26356b' : '#9fdcff'; c.fillRect(x - w, gy * 0.22 + w * 0.1, w * 2, w * 2); c.fillStyle = '#fff'; c.fillRect(x - 3, gy * 0.22, 6, w * 2.2); }
    c.fillStyle = '#d9a66f'; c.fillRect(0, gy, W, H - gy); c.strokeStyle = 'rgba(110,60,20,.16)'; c.lineWidth = 2; for (let y = gy + S * 0.08; y < H; y += S * 0.1) line(c, 0, y, W, y);
  }
  if (rain > 0) { c.globalAlpha = Math.min(1, rain) * 0.7; c.strokeStyle = '#5aa9e6'; c.lineWidth = 3; for (let i = 0; i < 50; i++) { const x = (i * 97.3 + t * 60) % W, y = (i * 61.7 + t * 620) % H; line(c, x, y, x - 4, y + S * 0.04); } c.globalAlpha = 1; }
}
export function drawNight(c, W, H, S, gy, t, n) {
  if (n <= 0.01) return;
  c.fillStyle = `rgba(18,24,74,${n * 0.55})`; c.fillRect(0, 0, W, H); c.fillStyle = '#fff3b0'; c.globalAlpha = n;
  for (let i = 0; i < 22; i++) drawStar(c, (i * 137.5) % W, (i * 71.3) % (gy * 0.8), S * 0.013 * (1.2 + Math.sin(t * 3 + i)), i);
  ell(c, W * 0.2, gy * 0.3, S * 0.07, S * 0.07); c.globalAlpha = 1;
}
