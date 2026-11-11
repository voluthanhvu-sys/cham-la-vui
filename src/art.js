// Procedural art: cute animal faces, stars, bushes. s = head radius.
const TAU = Math.PI * 2;

export const ANIMALS = {
  cat: { name: 'Con mèo', c: '#ffa94d', d: '#d9792a' },
  dog: { name: 'Con chó', c: '#c8935f', d: '#7a5230' },
  cow: { name: 'Con bò', c: '#fbfbfb', d: '#5a4a42' },
  duck: { name: 'Con vịt', c: '#ffd43b', d: '#e0a800' },
  pig: { name: 'Con heo', c: '#ffb3c8', d: '#e0789a' },
};

const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
const ellipse = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); };
function tri(ctx, ax, ay, bx, by, cx, cy) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill(); }

export function drawAnimal(ctx, kind, x, y, s, t = 0) {
  const a = ANIMALS[kind]; if (!a) return;
  ctx.save(); ctx.translate(x, y);
  ctx.lineWidth = s * 0.06; ctx.strokeStyle = a.d; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // ears / horns behind the head
  if (kind === 'cat') { ctx.fillStyle = a.c; for (const k of [-1, 1]) tri(ctx, k * s * 0.85, -s * 0.2, k * s * 0.7, -s * 1.15, k * s * 0.2, -s * 0.8); ctx.fillStyle = '#ffc9d6'; for (const k of [-1, 1]) tri(ctx, k * s * 0.72, -s * 0.35, k * s * 0.66, -s * 0.95, k * s * 0.35, -s * 0.75); }
  if (kind === 'dog') { ctx.fillStyle = a.d; for (const k of [-1, 1]) ellipse(ctx, k * s * 0.9, s * 0.05, s * 0.28, s * 0.6, k * 0.35); }
  if (kind === 'cow') { ctx.fillStyle = '#f2d98d'; for (const k of [-1, 1]) tri(ctx, k * s * 0.35, -s * 0.8, k * s * 0.75, -s * 1.25, k * s * 0.6, -s * 0.7); ctx.fillStyle = a.c; for (const k of [-1, 1]) ellipse(ctx, k * s * 1.05, -s * 0.35, s * 0.32, s * 0.16, k * 0.3); }
  if (kind === 'pig') { ctx.fillStyle = a.d; for (const k of [-1, 1]) tri(ctx, k * s * 0.8, -s * 0.4, k * s * 0.75, -s * 1.05, k * s * 0.3, -s * 0.85); }
  if (kind === 'duck') { ctx.fillStyle = a.d; for (const k of [-1, 0, 1]) ellipse(ctx, k * s * 0.15, -s * 1.0, s * 0.08, s * 0.22, k * 0.4); }
  // head
  ctx.fillStyle = a.c; circle(ctx, 0, 0, s); ctx.stroke();
  if (kind === 'cow') { ctx.fillStyle = a.d; ellipse(ctx, s * 0.5, -s * 0.62, s * 0.24, s * 0.16, -0.5); }
  // cheeks
  ctx.fillStyle = 'rgba(255,110,140,.35)'; for (const k of [-1, 1]) circle(ctx, k * s * 0.58, s * 0.28, s * 0.14);
  // eyes (blink every ~3 s)
  const blink = (t + x * 0.001) % 3.2 < 0.13;
  for (const k of [-1, 1]) {
    const ex = k * s * 0.33, ey = -s * 0.12;
    if (blink) { ctx.strokeStyle = '#2b2020'; ctx.beginPath(); ctx.moveTo(ex - s * 0.1, ey); ctx.lineTo(ex + s * 0.1, ey); ctx.stroke(); }
    else { ctx.fillStyle = '#2b2020'; circle(ctx, ex, ey, s * 0.13); ctx.fillStyle = '#fff'; circle(ctx, ex + s * 0.04, ey - s * 0.05, s * 0.045); }
  }
  ctx.strokeStyle = '#2b2020'; ctx.lineWidth = s * 0.05;
  // snout / beak / nose
  if (kind === 'cat') {
    ctx.fillStyle = '#ff8fab'; tri(ctx, -s * 0.09, s * 0.12, s * 0.09, s * 0.12, 0, s * 0.22);
    ctx.beginPath(); ctx.arc(-s * 0.09, s * 0.25, s * 0.09, 0, Math.PI); ctx.arc(s * 0.09, s * 0.25, s * 0.09, 0, Math.PI); ctx.stroke();
    ctx.lineWidth = s * 0.025; for (const k of [-1, 1]) for (const dy of [-0.05, 0.08]) { ctx.beginPath(); ctx.moveTo(k * s * 0.3, s * (0.2 + dy)); ctx.lineTo(k * s * 0.85, s * (0.12 + dy * 2)); ctx.stroke(); }
  } else if (kind === 'dog') {
    ctx.fillStyle = '#f1d7b5'; ellipse(ctx, 0, s * 0.35, s * 0.38, s * 0.28);
    ctx.fillStyle = '#2b2020'; ellipse(ctx, 0, s * 0.2, s * 0.13, s * 0.09);
    ctx.beginPath(); ctx.arc(0, s * 0.33, s * 0.15, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = '#ff7b8f'; ellipse(ctx, 0, s * 0.52, s * 0.08, s * 0.1);
  } else if (kind === 'cow') {
    ctx.fillStyle = '#ffc2c2'; ellipse(ctx, 0, s * 0.45, s * 0.55, s * 0.32);
    ctx.fillStyle = '#7a3e3e'; for (const k of [-1, 1]) ellipse(ctx, k * s * 0.2, s * 0.42, s * 0.07, s * 0.1);
  } else if (kind === 'pig') {
    ctx.fillStyle = '#ff8fb0'; ellipse(ctx, 0, s * 0.3, s * 0.35, s * 0.25); ctx.strokeStyle = a.d; ctx.stroke();
    ctx.fillStyle = '#b4466a'; for (const k of [-1, 1]) ellipse(ctx, k * s * 0.12, s * 0.3, s * 0.06, s * 0.1);
  } else if (kind === 'duck') {
    ctx.fillStyle = '#ff9f1c'; ellipse(ctx, 0, s * 0.3, s * 0.42, s * 0.16); ellipse(ctx, 0, s * 0.42, s * 0.34, s * 0.11);
  }
  ctx.restore();
}

export function drawStar(ctx, x, y, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}

export function drawBush(ctx, x, y, s) {
  const blobs = [[-0.75, 0.15, 0.55], [0.75, 0.15, 0.55], [-0.4, -0.25, 0.6], [0.4, -0.25, 0.6], [0, -0.45, 0.62], [0, 0.2, 0.7]];
  ctx.fillStyle = '#3f9e4d'; for (const [dx, dy, r] of blobs) circle(ctx, x + dx * s, y + dy * s + s * 0.06, r * s);
  ctx.fillStyle = '#58c26a'; for (const [dx, dy, r] of blobs) circle(ctx, x + dx * s, y + dy * s, r * s * 0.92);
  ctx.fillStyle = '#ff6b8b'; for (const [dx, dy] of [[-0.5, -0.3], [0.45, -0.1], [0.05, 0.25]]) circle(ctx, x + dx * s, y + dy * s, s * 0.08);
}
