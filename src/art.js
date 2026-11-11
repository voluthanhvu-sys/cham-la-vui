// Procedural art: cute round animal faces (data-driven), stars, bushes. s = head radius.
// Each animal = base color c, dark d, light m + parts: back (behind head), ears, top, mark (inside head), face, snd (audio style).
const TAU = Math.PI * 2;

export const ANIMALS = {
  cat: { name: 'Con mèo', c: '#ffa94d', d: '#d9792a', ears: 'pointy', face: 'cat', snd: 'cat' },
  dog: { name: 'Con chó', c: '#c8935f', d: '#7a5230', m: '#f1d7b5', ears: 'floppy', face: 'dog', snd: 'dog' },
  cow: { name: 'Con bò', c: '#fbfbfb', d: '#5a4a42', m: '#ffc2c2', ears: 'side', top: 'horns', mark: 'spot', face: 'snout', snd: 'cow' },
  duck: { name: 'Con vịt', c: '#ffd43b', d: '#e0a800', top: 'tuft', face: 'beak', snd: 'duck' },
  pig: { name: 'Con heo', c: '#ffb3c8', d: '#e0789a', ears: 'pig', face: 'pig', snd: 'pig' },
  rabbit: { name: 'Con thỏ', c: '#f4f1ee', d: '#b9aaa0', ears: 'long', face: 'bunny', snd: 'squeak' },
  bear: { name: 'Con gấu', c: '#a8743f', d: '#6b4423', m: '#e3c29b', ears: 'round', face: 'bear', snd: 'roar' },
  panda: { name: 'Gấu trúc', c: '#ffffff', d: '#2b2b2b', m: '#ffffff', ears: 'round', ec: '#2b2b2b', mark: 'panda', face: 'bear', snd: 'squeak' },
  lion: { name: 'Sư tử', c: '#f7b538', d: '#c77d1a', m: '#fde7b0', back: 'mane', ears: 'round', face: 'cat2', snd: 'roar' },
  tiger: { name: 'Con hổ', c: '#ff9f43', d: '#7a3b10', m: '#fff1e0', ears: 'round', mark: 'stripes', face: 'cat2', snd: 'roar' },
  elephant: { name: 'Con voi', c: '#b8c4d6', d: '#7d8aa0', m: '#f3c4d0', ears: 'big', face: 'trunk', snd: 'trumpet' },
  monkey: { name: 'Con khỉ', c: '#9c6b3c', d: '#5e3b1c', m: '#f3d1a8', ears: 'monkey', mark: 'mface', face: 'monkey', snd: 'monkey' },
  giraffe: { name: 'Hươu cao cổ', c: '#ffd166', d: '#b5651d', m: '#f6c27a', ears: 'side', top: 'knobs', mark: 'spots', face: 'snout', snd: 'boop' },
  zebra: { name: 'Ngựa vằn', c: '#ffffff', d: '#2b2b2b', m: '#6b6b6b', ears: 'up', top: 'mohawk', mark: 'stripes', face: 'snout', snd: 'neigh' },
  horse: { name: 'Con ngựa', c: '#b07a4a', d: '#6e4626', m: '#d9a77a', ears: 'up', top: 'mohawk', face: 'snout', snd: 'neigh' },
  frog: { name: 'Con ếch', c: '#7bd389', d: '#3f9e4d', top: 'bumps', face: 'frog', snd: 'frog' },
  chick: { name: 'Gà con', c: '#ffe66d', d: '#e0b800', top: 'tuft', face: 'smallbeak', snd: 'chick' },
  sheep: { name: 'Con cừu', c: '#f5efe6', d: '#8a7f75', back: 'wool', ears: 'side', face: 'sheep', snd: 'baa' },
  fox: { name: 'Con cáo', c: '#ff7f3f', d: '#c4501a', ears: 'pointy', ein: '#fff', mark: 'fox', face: 'fox', snd: 'squeak' },
  penguin: { name: 'Chim cánh cụt', c: '#2f3542', d: '#1e222b', mark: 'penguin', face: 'smallbeak', snd: 'honk' },
  owl: { name: 'Con cú', c: '#a47148', d: '#6b4423', m: '#f3e1c7', ears: 'tufts', mark: 'owl', face: 'smallbeak', snd: 'hoot' },
  hippo: { name: 'Hà mã', c: '#b39ddb', d: '#7e67b0', m: '#d7c8f0', ears: 'tiny', face: 'hippo', snd: 'grunt' },
  croc: { name: 'Cá sấu', c: '#6ab04c', d: '#3d7a2a', top: 'bumps', face: 'croc', snd: 'grunt' },
  mouse: { name: 'Con chuột', c: '#c9c9d1', d: '#8b8b99', ears: 'mouse', face: 'cat', snd: 'squeak' },
  koala: { name: 'Gấu túi', c: '#a4a9b3', d: '#6d727d', m: '#e6e8ec', ears: 'fluffy', face: 'koala', snd: 'boop' },
  deer: { name: 'Con nai', c: '#c98b4f', d: '#8a5a2b', m: '#ecc9a0', ears: 'side', top: 'antlers', face: 'snout', snd: 'boop' },
};

const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
const ellipse = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); };
function tri(ctx, ax, ay, bx, by, cx, cy) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill(); }
const K = [-1, 1];

function back(ctx, a, s) {
  if (a.back === 'mane') { ctx.fillStyle = '#d9822b'; for (let i = 0; i < 14; i++) { const g = (i / 14) * TAU; circle(ctx, Math.cos(g) * s * 1.02, Math.sin(g) * s * 1.02, s * 0.36); } }
  if (a.back === 'wool') { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 12; i++) { const g = (i / 12) * TAU; circle(ctx, Math.cos(g) * s * 0.95, Math.sin(g) * s * 0.95 - s * 0.05, s * 0.32); } }
}

function ears(ctx, a, s) {
  const e = a.ears; if (!e) return;
  if (e === 'pointy') { ctx.fillStyle = a.c; for (const k of K) tri(ctx, k * s * 0.85, -s * 0.2, k * s * 0.7, -s * 1.15, k * s * 0.2, -s * 0.8); ctx.fillStyle = a.ein || '#ffc9d6'; for (const k of K) tri(ctx, k * s * 0.72, -s * 0.35, k * s * 0.66, -s * 0.95, k * s * 0.35, -s * 0.75); }
  else if (e === 'floppy') { ctx.fillStyle = a.d; for (const k of K) ellipse(ctx, k * s * 0.9, s * 0.05, s * 0.28, s * 0.6, k * 0.35); }
  else if (e === 'side') { ctx.fillStyle = a.c; for (const k of K) { ellipse(ctx, k * s * 1.05, -s * 0.35, s * 0.32, s * 0.16, k * 0.3); ctx.stroke(); } }
  else if (e === 'pig') { ctx.fillStyle = a.d; for (const k of K) tri(ctx, k * s * 0.8, -s * 0.4, k * s * 0.75, -s * 1.05, k * s * 0.3, -s * 0.85); }
  else if (e === 'long') { for (const k of K) { ctx.fillStyle = a.c; ellipse(ctx, k * s * 0.35, -s * 1.15, s * 0.22, s * 0.62, k * 0.15); ctx.stroke(); ctx.fillStyle = '#ffc9d6'; ellipse(ctx, k * s * 0.35, -s * 1.1, s * 0.11, s * 0.45, k * 0.15); } }
  else if (e === 'round' || e === 'fluffy' || e === 'mouse' || e === 'tiny' || e === 'monkey') {
    const [ex, ey, r] = { round: [0.72, -0.72, 0.3], fluffy: [0.88, -0.5, 0.42], mouse: [0.72, -0.78, 0.45], tiny: [0.55, -0.85, 0.15], monkey: [1.0, -0.05, 0.3] }[e];
    for (const k of K) { ctx.fillStyle = a.ec || a.c; circle(ctx, k * s * ex, s * ey, s * r); ctx.stroke(); ctx.fillStyle = e === 'mouse' ? '#ffc9d6' : (a.m || '#ffe0c0'); if (!a.ec) circle(ctx, k * s * ex, s * ey, s * r * 0.55); }
  }
  else if (e === 'big') { for (const k of K) { ctx.fillStyle = a.c; ellipse(ctx, k * s * 0.95, s * 0.05, s * 0.55, s * 0.72, k * 0.2); ctx.stroke(); ctx.fillStyle = a.m; ellipse(ctx, k * s * 0.98, s * 0.08, s * 0.33, s * 0.48, k * 0.2); } }
  else if (e === 'up') { ctx.fillStyle = a.c; for (const k of K) { ellipse(ctx, k * s * 0.5, -s * 0.9, s * 0.15, s * 0.32, k * 0.4); ctx.stroke(); } }
  else if (e === 'tufts') { ctx.fillStyle = a.d; for (const k of K) tri(ctx, k * s * 0.85, -s * 0.45, k * s * 0.8, -s * 1.1, k * s * 0.35, -s * 0.85); }
}

function top(ctx, a, s) {
  const t = a.top; if (!t) return;
  if (t === 'horns') { ctx.fillStyle = '#f2d98d'; for (const k of K) tri(ctx, k * s * 0.35, -s * 0.8, k * s * 0.75, -s * 1.25, k * s * 0.6, -s * 0.7); }
  else if (t === 'tuft') { ctx.fillStyle = a.d; for (const k of [-1, 0, 1]) ellipse(ctx, k * s * 0.15, -s * 1.0, s * 0.08, s * 0.22, k * 0.4); }
  else if (t === 'knobs') { ctx.strokeStyle = a.d; ctx.lineWidth = s * 0.12; for (const k of K) { ctx.beginPath(); ctx.moveTo(k * s * 0.25, -s * 0.8); ctx.lineTo(k * s * 0.32, -s * 1.22); ctx.stroke(); ctx.fillStyle = a.d; circle(ctx, k * s * 0.32, -s * 1.25, s * 0.12); } ctx.lineWidth = s * 0.06; }
  else if (t === 'mohawk') { ctx.fillStyle = a.d; for (let i = 0; i < 4; i++) ellipse(ctx, -s * 0.12 + i * s * 0.08, -s * (0.95 - i * 0.02), s * 0.1, s * 0.2, 0.2); }
  else if (t === 'antlers') { ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = s * 0.09; for (const k of K) { ctx.beginPath(); ctx.moveTo(k * s * 0.35, -s * 0.8); ctx.lineTo(k * s * 0.6, -s * 1.4); ctx.moveTo(k * s * 0.47, -s * 1.1); ctx.lineTo(k * s * 0.8, -s * 1.2); ctx.moveTo(k * s * 0.55, -s * 1.28); ctx.lineTo(k * s * 0.4, -s * 1.5); ctx.stroke(); } ctx.lineWidth = s * 0.06; ctx.strokeStyle = a.d; }
  else if (t === 'bumps') { ctx.fillStyle = a.c; for (const k of K) { circle(ctx, k * s * 0.42, -s * 0.78, s * 0.32); ctx.stroke(); } }
}

function mark(ctx, a, s) {
  const m = a.mark; if (!m) return;
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, s * 0.97, 0, TAU); ctx.clip();
  ctx.fillStyle = a.d;
  if (m === 'spot') ellipse(ctx, s * 0.5, -s * 0.62, s * 0.3, s * 0.2, -0.5);
  else if (m === 'spots') { ctx.globalAlpha = 0.55; for (const [x, y, r] of [[-0.55, -0.5, 0.18], [0.5, -0.55, 0.15], [-0.75, 0.15, 0.14], [0.78, 0.1, 0.16], [0, -0.82, 0.13]]) ellipse(ctx, x * s, y * s, r * s, r * s * 0.8, 0.4); ctx.globalAlpha = 1; }
  else if (m === 'stripes') { for (const x of [-0.35, 0, 0.35]) tri(ctx, x * s - s * 0.09, -s, x * s + s * 0.09, -s, x * s, -s * 0.58); for (const k of K) for (const y of [-0.3, 0.1]) tri(ctx, k * s, y * s - s * 0.08, k * s, y * s + s * 0.08, k * s * 0.62, y * s); }
  else if (m === 'panda') for (const k of K) ellipse(ctx, k * s * 0.33, -s * 0.08, s * 0.2, s * 0.27, k * 0.5);
  else if (m === 'penguin') { ctx.fillStyle = '#ffffff'; for (const k of K) circle(ctx, k * s * 0.3, -s * 0.05, s * 0.42); ellipse(ctx, 0, s * 0.35, s * 0.62, s * 0.5); }
  else if (m === 'mface') { ctx.fillStyle = a.m; for (const k of K) circle(ctx, k * s * 0.3, -s * 0.1, s * 0.36); ellipse(ctx, 0, s * 0.33, s * 0.58, s * 0.42); }
  else if (m === 'owl') { ctx.fillStyle = a.m; for (const k of K) circle(ctx, k * s * 0.36, -s * 0.1, s * 0.34); }
  else if (m === 'fox') { ctx.fillStyle = '#fff6ee'; ellipse(ctx, 0, s * 0.5, s * 0.75, s * 0.42); }
  ctx.restore();
}

function eyes(ctx, a, s, t, x) {
  const blink = (t + x * 0.001) % 3.2 < 0.13;
  const bump = a.top === 'bumps', owl = a.mark === 'owl';
  const ex0 = bump ? 0.42 : owl ? 0.36 : 0.33, ey = bump ? -s * 0.8 : owl ? -s * 0.1 : -s * 0.12, r = owl ? 0.17 : 0.13;
  for (const k of K) {
    const ex = k * s * ex0;
    if (bump && !blink) { ctx.fillStyle = '#fff'; circle(ctx, ex, ey, s * 0.2); }
    if (blink) { ctx.strokeStyle = '#2b2020'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(ex - s * 0.1, ey); ctx.lineTo(ex + s * 0.1, ey); ctx.stroke(); }
    else { ctx.fillStyle = '#2b2020'; circle(ctx, ex, ey, s * r); ctx.fillStyle = '#fff'; circle(ctx, ex + s * 0.04, ey - s * 0.05, s * 0.045); }
  }
}

function face(ctx, a, s) {
  const f = a.face, dark = '#2b2020';
  ctx.strokeStyle = dark; ctx.lineWidth = s * 0.05;
  const smile = (y, r) => { ctx.beginPath(); ctx.arc(0, y, r, 0.3, Math.PI - 0.3); ctx.stroke(); };
  const wMouth = () => { ctx.beginPath(); ctx.arc(-s * 0.09, s * 0.25, s * 0.09, 0, Math.PI); ctx.arc(s * 0.09, s * 0.25, s * 0.09, 0, Math.PI); ctx.stroke(); };
  if (f === 'cat' || f === 'bunny') {
    ctx.fillStyle = '#ff8fab'; tri(ctx, -s * 0.09, s * 0.12, s * 0.09, s * 0.12, 0, s * 0.22); wMouth();
    if (f === 'cat') { ctx.lineWidth = s * 0.025; for (const k of K) for (const dy of [-0.05, 0.08]) { ctx.beginPath(); ctx.moveTo(k * s * 0.3, s * (0.2 + dy)); ctx.lineTo(k * s * 0.85, s * (0.12 + dy * 2)); ctx.stroke(); } }
    else { ctx.fillStyle = '#fff'; ctx.fillRect(-s * 0.08, s * 0.3, s * 0.16, s * 0.12); ctx.lineWidth = s * 0.02; ctx.strokeRect(-s * 0.08, s * 0.3, s * 0.16, s * 0.12); }
  } else if (f === 'cat2') {
    ctx.fillStyle = a.m; for (const k of K) circle(ctx, k * s * 0.14, s * 0.3, s * 0.17);
    ctx.fillStyle = '#c0526a'; tri(ctx, -s * 0.1, s * 0.12, s * 0.1, s * 0.12, 0, s * 0.24);
    ctx.fillStyle = dark; ctx.lineWidth = s * 0.02; for (const k of K) for (const dy of [0.25, 0.35]) circle(ctx, k * s * 0.15, s * dy, s * 0.02);
  } else if (f === 'dog' || f === 'bear') {
    ctx.fillStyle = a.m; ellipse(ctx, 0, s * 0.35, s * 0.38, s * 0.28);
    ctx.fillStyle = dark; ellipse(ctx, 0, s * 0.22, s * 0.13, s * 0.09); smile(s * 0.33, s * 0.15);
    if (f === 'dog') { ctx.fillStyle = '#ff7b8f'; ellipse(ctx, 0, s * 0.52, s * 0.08, s * 0.1); }
  } else if (f === 'snout' || f === 'hippo') {
    const h = f === 'hippo';
    ctx.fillStyle = a.m; ellipse(ctx, 0, s * 0.45, s * (h ? 0.68 : 0.5), s * (h ? 0.4 : 0.3));
    ctx.fillStyle = a.d; for (const k of K) ellipse(ctx, k * s * (h ? 0.25 : 0.18), s * 0.4, s * 0.07, s * 0.1);
    ctx.lineWidth = s * 0.035; smile(s * 0.45, s * 0.15);
  } else if (f === 'pig') {
    ctx.fillStyle = '#ff8fb0'; ellipse(ctx, 0, s * 0.3, s * 0.35, s * 0.25); ctx.strokeStyle = a.d; ctx.stroke();
    ctx.fillStyle = '#b4466a'; for (const k of K) ellipse(ctx, k * s * 0.12, s * 0.3, s * 0.06, s * 0.1);
  } else if (f === 'beak') {
    ctx.fillStyle = '#ff9f1c'; ellipse(ctx, 0, s * 0.3, s * 0.42, s * 0.16); ellipse(ctx, 0, s * 0.42, s * 0.34, s * 0.11);
  } else if (f === 'smallbeak') {
    ctx.fillStyle = '#ff9f1c'; tri(ctx, -s * 0.14, s * 0.12, s * 0.14, s * 0.12, 0, s * 0.36);
  } else if (f === 'monkey') {
    ctx.fillStyle = a.d; for (const k of K) circle(ctx, k * s * 0.07, s * 0.2, s * 0.035); smile(s * 0.3, s * 0.22);
  } else if (f === 'trunk') {
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, s * 0.1); ctx.quadraticCurveTo(0, s * 0.85, s * 0.35, s * 0.85);
    ctx.strokeStyle = a.d; ctx.lineWidth = s * 0.34; ctx.stroke(); ctx.strokeStyle = a.c; ctx.lineWidth = s * 0.24; ctx.stroke();
    ctx.strokeStyle = a.d; ctx.lineWidth = s * 0.03; for (const y of [0.35, 0.5, 0.65]) { ctx.beginPath(); ctx.moveTo(-s * 0.09, s * y); ctx.lineTo(s * 0.09, s * y); ctx.stroke(); }
  } else if (f === 'frog') {
    ctx.lineWidth = s * 0.06; ctx.beginPath(); ctx.arc(0, -s * 0.1, s * 0.6, 0.45, Math.PI - 0.45); ctx.stroke();
    ctx.fillStyle = a.d; for (const k of K) circle(ctx, k * s * 0.12, -s * 0.05, s * 0.04);
  } else if (f === 'croc') {
    ctx.fillStyle = a.c; ctx.beginPath(); ctx.ellipse(0, s * 0.45, s * 0.55, s * 0.42, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = a.d; ctx.stroke();
    ctx.fillStyle = '#fff'; for (let i = -2; i <= 2; i++) tri(ctx, i * s * 0.18 - s * 0.06, s * 0.55, i * s * 0.18 + s * 0.06, s * 0.55, i * s * 0.18, s * 0.68);
    ctx.strokeStyle = dark; ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.moveTo(-s * 0.48, s * 0.55); ctx.lineTo(s * 0.48, s * 0.55); ctx.stroke();
    ctx.fillStyle = a.d; for (const k of K) circle(ctx, k * s * 0.12, s * 0.2, s * 0.05);
  } else if (f === 'fox') {
    ctx.fillStyle = dark; ellipse(ctx, 0, s * 0.3, s * 0.1, s * 0.07); smile(s * 0.36, s * 0.1);
  } else if (f === 'koala') {
    ctx.fillStyle = '#3b3b45'; ellipse(ctx, 0, s * 0.22, s * 0.17, s * 0.24); smile(s * 0.42, s * 0.1);
  } else if (f === 'sheep') {
    ctx.fillStyle = '#e8a0b0'; ellipse(ctx, 0, s * 0.25, s * 0.1, s * 0.07); smile(s * 0.3, s * 0.12);
  }
}

export function drawAnimal(ctx, kind, x, y, s, t = 0) {
  const a = ANIMALS[kind]; if (!a) return;
  ctx.save(); ctx.translate(x, y);
  ctx.lineWidth = s * 0.06; ctx.strokeStyle = a.d; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  back(ctx, a, s); ears(ctx, a, s);
  ctx.lineWidth = s * 0.06; ctx.strokeStyle = a.d; top(ctx, a, s);
  ctx.fillStyle = a.c; circle(ctx, 0, 0, s); ctx.lineWidth = s * 0.06; ctx.strokeStyle = a.d; ctx.stroke();
  mark(ctx, a, s);
  ctx.fillStyle = 'rgba(255,110,140,.35)'; for (const k of K) circle(ctx, k * s * 0.58, s * 0.28, s * 0.14);
  eyes(ctx, a, s, t, x);
  face(ctx, a, s);
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

// Covers an animal hides behind (same footprint as drawBush: about x±1.3s, y-1.05s..y+0.9s).
const BLOBS = [[-0.75, 0.15, 0.55], [0.75, 0.15, 0.55], [-0.4, -0.25, 0.6], [0.4, -0.25, 0.6], [0, -0.45, 0.62], [0, 0.2, 0.7]];
function blobs(ctx, x, y, s, dark, light) {
  ctx.fillStyle = dark; for (const [dx, dy, r] of BLOBS) circle(ctx, x + dx * s, y + dy * s + s * 0.06, r * s);
  ctx.fillStyle = light; for (const [dx, dy, r] of BLOBS) circle(ctx, x + dx * s, y + dy * s, r * s * 0.92);
}
export function drawCover(ctx, type, x, y, s, c = '#ff6b8b') {
  if (type === 'bush') return drawBush(ctx, x, y, s);
  if (type === 'snow') { blobs(ctx, x, y, s, '#c9d8ec', '#ffffff'); ctx.fillStyle = 'rgba(180,210,240,.6)'; circle(ctx, x - s * 0.3, y - s * 0.4, s * 0.12); return; }
  if (type === 'cloud') {
    blobs(ctx, x, y, s, '#d5e3f5', '#ffffff');
    ctx.fillStyle = '#ffb3c8'; circle(ctx, x - s * 0.45, y + s * 0.1, s * 0.12); circle(ctx, x + s * 0.45, y + s * 0.1, s * 0.12);
    ctx.fillStyle = '#5a6a8a'; circle(ctx, x - s * 0.25, y - s * 0.08, s * 0.07); circle(ctx, x + s * 0.25, y - s * 0.08, s * 0.07);
    return;
  }
  if (type === 'box') {
    const w = s * 1.15, top = y - s * 0.7, bot = y + s * 0.9;
    ctx.fillStyle = c; ctx.fillRect(x - w, top, w * 2, bot - top);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x - w, top, w * 2, s * 0.12);
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(x - s * 0.15, top, s * 0.3, bot - top);
    ctx.fillStyle = c; ctx.fillRect(x - w * 1.08, top - s * 0.3, w * 2.16, s * 0.34); // lid
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(x - s * 0.15, top - s * 0.3, s * 0.3, s * 0.34);
    ellipse(ctx, x - s * 0.32, top - s * 0.42, s * 0.3, s * 0.16, 0.4); ellipse(ctx, x + s * 0.32, top - s * 0.42, s * 0.3, s * 0.16, -0.4);
    return;
  }
  if (type === 'pot') {
    ctx.fillStyle = '#3f9e4d'; for (const k of [-1, 1]) ellipse(ctx, x + k * s * 0.9, y - s * 0.75, s * 0.4, s * 0.18, k * 0.5);
    ctx.fillStyle = c; ctx.beginPath();
    ctx.moveTo(x - s * 1.1, y - s * 0.55); ctx.lineTo(x + s * 1.1, y - s * 0.55); ctx.lineTo(x + s * 0.8, y + s * 0.9); ctx.lineTo(x - s * 0.8, y + s * 0.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x - s * 1.25, y - s * 0.75, s * 2.5, s * 0.3);
    ctx.fillStyle = c; ctx.fillRect(x - s * 1.25, y - s * 0.8, s * 2.5, s * 0.28);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; for (const k of [-1, 0, 1]) circle(ctx, x + k * s * 0.45, y + s * 0.2, s * 0.1);
  }
}

export function drawHeart(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.7, y - r * 1.2, x, y - r * 0.45);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.5, y - r * 0.1, x, y + r * 0.9); ctx.fill();
}
export function drawLeaf(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.8, 0, 0, r); ctx.quadraticCurveTo(-r * 0.8, 0, 0, -r); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.lineTo(0, r * 1.2); ctx.stroke();
  ctx.restore();
}
export function drawFlake(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineCap = 'round'; ctx.lineWidth = r * 0.12;
  for (let i = 0; i < 6; i++) {
    ctx.rotate(TAU / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r);
    ctx.moveTo(0, -r * 0.55); ctx.lineTo(-r * 0.25, -r * 0.75); ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.25, -r * 0.75); ctx.stroke();
  }
  ctx.restore();
}
