// Baby v2 tap games (2026-11-18): pump, feed, band, chase, coconut. Same scene contract as scenes.js:
// resize(W,H), enter(), tap(x,y), drag(x,y), update(dt), draw(ctx). A tap ANYWHERE does something.
import { drawAnimal, drawHeart } from './art.js';
import { TAU, rnd, pick, COLORS, makeParticles, bagFor, sayAnimal } from './fx.js';

export const sky = (ctx, W, H, a, b) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
export const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
export const variants = (audio, mech, factory, themes) => Object.entries(themes).map(([k, th]) => ({ name: `${mech}.${k}`, make: () => factory(audio, th) }));
export function face(ctx, x, y, r, open = 0) {
  ctx.fillStyle = '#2b2020';
  for (const k of [-1, 1]) circle(ctx, x + k * r * 0.32, y - r * 0.12, r * 0.1);
  ctx.fillStyle = '#fff'; for (const k of [-1, 1]) circle(ctx, x + k * r * 0.32 + r * 0.03, y - r * 0.15, r * 0.035);
  ctx.fillStyle = 'rgba(255,110,140,.4)'; for (const k of [-1, 1]) circle(ctx, x + k * r * 0.55, y + r * 0.12, r * 0.13);
  if (open > 0.05) { ctx.fillStyle = '#7a2b2b'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.25, r * 0.2, r * 0.2 * open, 0, 0, TAU); ctx.fill(); return; }
  ctx.strokeStyle = '#2b2020'; ctx.lineWidth = r * 0.07; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y + r * 0.08, r * 0.25, 0.35, Math.PI - 0.35); ctx.stroke();
}
function near(list, x, y) { let b = null, d = Infinity; for (const o of list) { const k = Math.hypot(x - o.x, y - o.y); if (k < d) { d = k; b = o; } } return [b, d]; }
function note(ctx, x, y, r, c) { // a music note glyph
  ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = r * 0.25;
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.6, r * 0.45, -0.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + r * 0.5, y); ctx.lineTo(x + r * 0.5, y - r * 2); ctx.lineTo(x + r * 1.2, y - r * 1.5); ctx.stroke();
}
const floaters = () => { // rising notes / hearts
  const L = [];
  return {
    add(x, y, kind, c = pick(COLORS)) { L.push({ x, y, kind, c, t: 0, vx: rnd(-30, 30) }); },
    update(dt) { for (let i = L.length - 1; i >= 0; i--) { const f = L[i]; f.t += dt; f.y -= 70 * dt; f.x += f.vx * dt; if (f.t > 1.4) L.splice(i, 1); } },
    draw(ctx, S) {
      for (const f of L) {
        ctx.globalAlpha = 1 - f.t / 1.4;
        if (f.kind === 'heart') { ctx.fillStyle = f.c; drawHeart(ctx, f.x, f.y, S * 0.035); } else note(ctx, f.x, f.y, S * 0.025, f.c);
      }
      ctx.globalAlpha = 1;
    },
  };
};

// 1) Pump: every tap blows the thing up a bit (rising squeak); after 5-8 taps it goes BOOM and a surprise pops out.
const PUMP = {
  balloon: { bg: ['#9be7ff', '#e8f9ff'], obj: 'balloon', group: 'all' },
  gift: { bg: ['#ffd6e8', '#fff3f8'], obj: 'gift', group: 'farm' },
  puffer: { bg: ['#4cc9f0', '#1d6fa3'], obj: 'puffer', group: 'water' },
  cloud: { bg: ['#bde0fe', '#fefae0'], obj: 'cloud', group: 'sky', prize: 'rainbow' },
  bud: { bg: ['#caffbf', '#fdffb6'], obj: 'bud', group: 'small', prize: 'flower' },
  pig: { bg: ['#ffe5ec', '#fff8e7'], obj: 'pig', group: 'farm' },
  egg: { bg: ['#fff1c1', '#ffe0a8'], obj: 'egg', group: 'small' },
};
function pumpScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, taps = 0, need = 6, wob = 0, boomT = -1, c = pick(COLORS), prize = null;
  const parts = makeParticles(), bag = bagFor(th.group);
  const reset = () => { taps = 0; need = 5 + (Math.random() * 4 | 0); c = pick(COLORS); };
  function drawObj(ctx, x, y, r) {
    ctx.lineWidth = r * 0.05; ctx.strokeStyle = 'rgba(0,0,0,.25)';
    if (th.obj === 'balloon') {
      ctx.strokeStyle = '#888'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + r * 1.15);
      ctx.quadraticCurveTo(x + r * 0.3, y + r * 1.8, x, y + r * 2.5); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, r * 0.9, r * 1.1, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - r * 0.12, y + r * 1.18); ctx.lineTo(x + r * 0.12, y + r * 1.18); ctx.lineTo(x, y + r * 1.05); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(x - r * 0.4, y - r * 0.5, r * 0.15, r * 0.28, -0.5, 0, TAU); ctx.fill();
      face(ctx, x, y, r * 0.8);
    } else if (th.obj === 'gift') {
      ctx.fillStyle = c; ctx.fillRect(x - r, y - r * 0.7, r * 2, r * 1.6);
      ctx.fillStyle = '#ffd60a'; ctx.fillRect(x - r * 0.15, y - r * 0.7, r * 0.3, r * 1.6);
      const lift = taps / need * r * 0.3 + Math.abs(Math.sin(t * 20)) * wob * r * 0.15;
      ctx.fillStyle = c; ctx.fillRect(x - r * 1.1, y - r * 0.95 - lift, r * 2.2, r * 0.35);
      ctx.fillStyle = '#ffd60a'; ctx.fillRect(x - r * 0.15, y - r * 0.95 - lift, r * 0.3, r * 0.35);
      for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + k * r * 0.3, y - r * 1.1 - lift, r * 0.3, r * 0.17, k * 0.5, 0, TAU); ctx.fill(); }
    } else if (th.obj === 'puffer') {
      ctx.fillStyle = '#ffd166'; const n = 10 + taps * 2;
      for (let i = 0; i < n; i++) { const a = i / n * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a - 0.12) * r, y + Math.sin(a - 0.12) * r); ctx.lineTo(x + Math.cos(a) * r * (1.15 + taps * 0.03), y + Math.sin(a) * r * (1.15 + taps * 0.03)); ctx.lineTo(x + Math.cos(a + 0.12) * r, y + Math.sin(a + 0.12) * r); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(x + r * 0.9, y); ctx.lineTo(x + r * 1.5, y - r * 0.4); ctx.lineTo(x + r * 1.5, y + r * 0.4); ctx.fill();
      circle(ctx, x, y, r); ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.4, r * 0.7, r * 0.45, 0, 0, TAU); ctx.fill();
      face(ctx, x - r * 0.15, y - r * 0.05, r * 0.8, taps > need / 2 ? 0.6 : 0);
    } else if (th.obj === 'cloud') {
      const g = 235 - taps / need * 120 | 0; ctx.fillStyle = `rgb(${g},${g},${g + 15})`;
      for (const [dx, dy, k] of [[-0.6, 0.1, 0.55], [0, -0.2, 0.75], [0.6, 0.1, 0.55], [0, 0.25, 0.6]]) circle(ctx, x + dx * r, y + dy * r, k * r);
      face(ctx, x, y + r * 0.05, r * 0.7, 0);
    } else if (th.obj === 'bud') {
      ctx.strokeStyle = '#2d9a3f'; ctx.lineWidth = r * 0.15; ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, H); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, r * 0.65, r, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#52b788'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y + r * 0.4, r * 0.35, r * 0.75, 0.4, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + r * 0.35, y + r * 0.4, r * 0.35, r * 0.75, -0.4, 0, TAU); ctx.fill();
    } else if (th.obj === 'egg') {
      ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 1.05, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = c; for (let i = 0; i < 5; i++) circle(ctx, x + Math.cos(i * 2.4) * r * 0.45, y + Math.sin(i * 1.7) * r * 0.6, r * 0.12);
      ctx.strokeStyle = '#6b4f3a'; ctx.lineWidth = r * 0.04; ctx.beginPath();
      for (let i = 0; i < taps; i++) { const a = i * 1.3; ctx.moveTo(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2); ctx.lineTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.9); }
      ctx.stroke();
    } else drawAnimal(ctx, 'pig', x, y, r, t);
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { reset(); boomT = -1; prize = null; },
    tap(x, y) {
      if (boomT >= 0) { if (prize?.kind) { prize.jump = 1; sayAnimal(audio, prize.kind, 0); } return; }
      taps++; wob = 1; audio.inflate(taps);
      if (taps >= need) {
        boomT = 0; audio.boom();
        parts.burst(W / 2, H * 0.48, 60, S * 0.03, COLORS, S * 1.4);
        prize = th.prize ? { type: th.prize } : { kind: bag.next(), jump: 1 };
        if (prize.kind) sayAnimal(audio, prize.kind, 500); else setTimeout(() => audio.chime(4), 300);
      }
    },
    drag() {},
    update(dt) {
      t += dt; wob = Math.max(0, wob - dt * 3); parts.update(dt, 350);
      if (prize?.jump) prize.jump = Math.max(0, prize.jump - dt * 1.5);
      if (boomT >= 0 && (boomT += dt) > 3.2) { boomT = -1; prize = null; reset(); }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      const x = W / 2, y = H * 0.48;
      if (boomT < 0) {
        const r = S * (0.1 + 0.2 * taps / need) * (1 + Math.sin(t * 25) * wob * 0.08), shake = taps / need > 0.7 ? Math.sin(t * 40) * S * 0.006 : 0;
        drawObj(ctx, x + shake, y, r);
      } else if (prize.type === 'rainbow') {
        ctx.lineWidth = S * 0.04; ['#ff5d73', '#ffb627', '#ffe066', '#7bd389', '#4cc9f0', '#b388ff'].forEach((c2, i) => {
          ctx.strokeStyle = c2; ctx.beginPath(); ctx.arc(x, H * 0.8, S * (0.5 - i * 0.04) * Math.min(1, boomT * 2), Math.PI, TAU); ctx.stroke();
        });
        ctx.fillStyle = '#ffd60a'; circle(ctx, x, y - S * 0.1, S * 0.12); face(ctx, x, y - S * 0.1, S * 0.12);
      } else if (prize.type === 'flower') {
        const r = S * 0.22 * Math.min(1, boomT * 2.5);
        ctx.fillStyle = c; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.5; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.42, r * 0.22, a, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#ffd60a'; circle(ctx, x, y, r * 0.4); face(ctx, x, y, r * 0.4);
      } else {
        const k = Math.min(1, boomT * 3), r = S * 0.2 * (0.3 + 0.7 * k);
        drawAnimal(ctx, prize.kind, x, y - Math.sin(prize.jump * Math.PI) * S * 0.12, r, t);
      }
      parts.draw(ctx);
    },
  };
}

// 2) Feed: tap -> the nearest food flies into the animal's mouth; chomp chomp; 3 foods -> burp, hearts, next animal.
const FEED = {
  farm: { bg: ['#bde0fe', '#e9f5db'], ground: '#95d5b2', group: 'farm', foods: ['apple', 'carrot', 'banana'] },
  wild: { bg: ['#ffe8a3', '#fff5d6'], ground: '#e9c46a', group: 'wild', foods: ['banana', 'berry', 'apple'] },
  pond: { bg: ['#a8e6cf', '#dcedc1'], ground: '#4cc9f0', group: 'water', foods: ['fish', 'berry', 'cookie'] },
  party: { bg: ['#ffc8dd', '#ffafcc'], ground: '#cdb4db', group: 'all', foods: ['cake', 'cookie', 'berry'] },
  snow: { bg: ['#cfe6ff', '#ffffff'], ground: '#f1f7ff', group: 'cold', foods: ['fish', 'cookie', 'apple'] },
  night: { bg: ['#22223b', '#4a4e69'], ground: '#3d405b', group: 'small', foods: ['cookie', 'cake', 'banana'] },
};
function drawFood(ctx, type, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  if (type === 'apple') { ctx.fillStyle = '#e63946'; circle(ctx, 0, 0, r); ctx.fillStyle = '#52b788'; ctx.beginPath(); ctx.ellipse(r * 0.3, -r * 1.05, r * 0.35, r * 0.18, -0.5, 0, TAU); ctx.fill(); }
  else if (type === 'banana') { ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = r * 0.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, -r * 0.6, r, 0.4, Math.PI - 0.4); ctx.stroke(); }
  else if (type === 'carrot') { ctx.fillStyle = '#f77f00'; ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.7); ctx.lineTo(r * 0.5, -r * 0.7); ctx.lineTo(0, r * 1.1); ctx.fill(); ctx.fillStyle = '#52b788'; ctx.fillRect(-r * 0.15, -r * 1.2, r * 0.3, r * 0.5); }
  else if (type === 'fish') { ctx.fillStyle = '#4895ef'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.55, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(r * 0.8, 0); ctx.lineTo(r * 1.4, -r * 0.5); ctx.lineTo(r * 1.4, r * 0.5); ctx.fill(); }
  else if (type === 'berry') { ctx.fillStyle = '#9d4edd'; for (const [a, b] of [[-0.4, 0.2], [0.4, 0.2], [0, -0.35], [0, 0.55]]) circle(ctx, a * r, b * r, r * 0.45); }
  else if (type === 'cake') { ctx.fillStyle = '#ffafcc'; ctx.fillRect(-r, -r * 0.3, r * 2, r); ctx.fillStyle = '#fff'; ctx.fillRect(-r, -r * 0.5, r * 2, r * 0.3); ctx.fillStyle = '#e63946'; circle(ctx, 0, -r * 0.75, r * 0.25); }
  else { ctx.fillStyle = '#c68642'; circle(ctx, 0, 0, r); ctx.fillStyle = '#5a3825'; for (let i = 0; i < 5; i++) circle(ctx, Math.cos(i * 2.5) * r * 0.55, Math.sin(i * 2.5) * r * 0.55, r * 0.14); }
  ctx.restore();
}
function feedScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, kind = null, eaten = 0, chew = 0, swapT = -1, enterK = 0, jump = 0;
  const foods = [], flying = [], fl = floaters(), bag = bagFor(th.group);
  const mouth = () => [W / 2, H * 0.68 + S * 0.08 - Math.sin(jump * Math.PI) * S * 0.05];
  function layout() {
    const n = W > H ? 5 : 4; foods.length = 0;
    for (let i = 0; i < n; i++) foods.push({ x: W * (i + 0.5) / n, y: H * (0.2 + (i % 2) * 0.08), type: th.foods[i % th.foods.length], grow: 1 });
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { kind = bag.next(); eaten = 0; swapT = -1; enterK = 0; setTimeout(() => sayAnimal(audio, kind, 0), 400); },
    tap(x, y) {
      if (swapT >= 0) return;
      const ready = foods.filter((f) => f.grow >= 1); if (!ready.length) return;
      const [f] = near(ready, x, y); f.grow = 0;
      flying.push({ type: f.type, x0: f.x, y0: f.y, k: 0 }); audio.pop();
    },
    drag() {},
    update(dt) {
      t += dt; enterK = Math.min(1, enterK + dt * 2); fl.update(dt); chew = Math.max(0, chew - dt); jump = Math.max(0, jump - dt * 2);
      for (const f of foods) if (f.grow < 1) f.grow = Math.min(1, f.grow + dt * 0.8);
      for (let i = flying.length - 1; i >= 0; i--) {
        const f = flying[i]; f.k += dt * 1.6;
        if (f.k >= 1) {
          flying.splice(i, 1); chew = 1; jump = 1; audio.chomp(); eaten++;
          const [mx, my] = mouth(); for (let j = 0; j < 3; j++) fl.add(mx + rnd(-40, 40), my - S * 0.15, 'heart', '#ff5d73');
          if (eaten >= 3 && swapT < 0) { swapT = 0; setTimeout(() => { audio.burp(); }, 900); }
        }
      }
      if (swapT >= 0 && (swapT += dt) > 2.6) { kind = bag.next(); eaten = 0; swapT = -1; enterK = 0; sayAnimal(audio, kind, 300); }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      ctx.fillStyle = th.ground; ctx.fillRect(0, H * 0.8, W, H * 0.2);
      for (const f of foods) if (f.grow > 0) drawFood(ctx, f.type, f.x, f.y + Math.sin(t * 2 + f.x) * S * 0.01, S * 0.06 * f.grow);
      const [mx, my] = mouth(), r = S * 0.2 * enterK, ay = H * 0.68 - Math.sin(jump * Math.PI) * S * 0.05;
      ctx.save(); if (swapT > 1.6) { ctx.translate(W / 2, ay); const k = 1 + (swapT - 1.6) * 0.15; ctx.scale(k, k); ctx.translate(-W / 2, -ay); }
      if (r > 1) drawAnimal(ctx, kind, W / 2, ay, r, t);
      const open = flying.length ? 0.9 : chew > 0 ? Math.abs(Math.sin(chew * 12)) : 0;
      if (open > 0.05 && r > 1) { ctx.fillStyle = '#7a2b2b'; ctx.beginPath(); ctx.ellipse(mx, my + r * 0.05, r * 0.22, r * 0.18 * open, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
      for (const f of flying) {
        const k = f.k, x = f.x0 + (mx - f.x0) * k, y = f.y0 + (my - f.y0) * k - Math.sin(k * Math.PI) * S * 0.2;
        drawFood(ctx, f.type, x, y, S * 0.06 * (1 - k * 0.5));
      }
      fl.draw(ctx, S);
    },
  };
}

// 3) Band: a row of animals; tap one -> it jumps and plays its note. Fast tapping makes the whole band dance faster.
const BAND = {
  stage: { bg: ['#3c096c', '#7b2cbf'], floor: '#9d4edd', group: 'all', lights: true },
  forest: { bg: ['#b7e4c7', '#f1faee'], floor: '#74c69d', group: 'wild' },
  farm: { bg: ['#fde68a', '#fef9c3'], floor: '#d4a373', group: 'farm' },
  beach: { bg: ['#90e0ef', '#fff1d0'], floor: '#f4d58d', group: 'water' },
  snow: { bg: ['#cfe6ff', '#f8fbff'], floor: '#ffffff', group: 'cold' },
  night: { bg: ['#0b132b', '#1c2541'], floor: '#3a506b', group: 'small', lights: true },
};
function bandScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, energy = 0, beat = 0, beatN = 0;
  const band = [], fl = floaters(), bag = bagFor(th.group);
  function layout() {
    const n = W > H ? 5 : 4; band.length = 0;
    for (let i = 0; i < n; i++) band.push({ x: W * (i + 0.5) / n, y: H * 0.6, kind: bag.next(), j: 0, i });
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { energy = 0; for (const a of band) a.kind = bag.next(); },
    tap(x, y) {
      const [a] = near(band, x, y); a.j = 1; energy = Math.min(1, energy + 0.18);
      audio.note(a.i * 2 + (Math.random() < 0.5 ? 0 : 1)); if (Math.random() < 0.25) audio.animal(a.kind);
      fl.add(a.x, a.y - S * 0.15, 'note');
    },
    drag() {},
    update(dt) {
      t += dt; energy = Math.max(0, energy - dt * 0.12); fl.update(dt);
      for (const a of band) a.j = Math.max(0, a.j - dt * 2.2);
      if (energy > 0.45 && (beat += dt) > 0.42) { beat = 0; audio.drum(beatN++ % 2 ? 2 : 0); }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      if (th.lights) for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.18 + energy * 0.2; ctx.fillStyle = COLORS[(i + (t * 2 | 0)) % COLORS.length];
        const x = W * (i + 0.5) / 4 + Math.sin(t + i) * W * 0.1;
        ctx.beginPath(); ctx.moveTo(x - 10, 0); ctx.lineTo(x + 10, 0); ctx.lineTo(x + W * 0.12, H * 0.8); ctx.lineTo(x - W * 0.12, H * 0.8); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.fillStyle = th.floor; ctx.fillRect(0, H * 0.78, W, H * 0.22);
      const sp = 3 + energy * 9, r = Math.min(S * 0.13, W / band.length * 0.36);
      for (const a of band) {
        const bob = Math.abs(Math.sin(t * sp + a.i)) * S * 0.03 * (0.3 + energy), jy = Math.sin(a.j * Math.PI) * S * 0.12;
        ctx.save(); ctx.translate(a.x, a.y - bob - jy); ctx.rotate(Math.sin(t * sp * 0.5 + a.i) * 0.12 * (0.3 + energy));
        drawAnimal(ctx, a.kind, 0, 0, r * (1 + a.j * 0.15), t); ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(a.x, H * 0.6 + r * 1.2, r * 0.8, r * 0.18, 0, 0, TAU); ctx.fill();
      }
      fl.draw(ctx, S);
    },
  };
}

// 4) Chase: an animal strolls around; tap anywhere -> it hops toward the finger; tap ON it -> it giggles, spins and runs off.
const CHASE = {
  meadow: { bg: ['#a0e7ff', '#d8f3dc'], ground: '#80ed99', group: 'farm', deco: 'flowers' },
  jungle: { bg: ['#95d5b2', '#d8f3dc'], ground: '#52b788', group: 'wild', deco: 'leaves' },
  pond: { bg: ['#90e0ef', '#caf0f8'], ground: '#48cae4', group: 'water', deco: 'bubbles' },
  sky: { bg: ['#74c0fc', '#e7f5ff'], ground: null, group: 'sky', deco: 'clouds' },
  snow: { bg: ['#d0ebff', '#ffffff'], ground: '#f8f9fa', group: 'cold', deco: 'snow' },
  night: { bg: ['#14213d', '#3a0ca3'], ground: '#283618', group: 'small', deco: 'fireflies' },
};
function chaseScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, kind = null, catches = 0, spin = 0;
  const a = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, hop: 0 }, parts = makeParticles(), bag = bagFor(th.group);
  const newTarget = () => { a.tx = rnd(0.15, 0.85) * W; a.ty = rnd(0.35, 0.8) * H; };
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); if (!a.x) { a.x = W / 2; a.y = H * 0.6; } newTarget(); },
    enter() { kind = bag.next(); catches = 0; a.x = W / 2; a.y = H * 0.6; newTarget(); },
    tap(x, y) {
      const r = S * 0.13;
      if (Math.hypot(x - a.x, y - a.y) < r * 1.9) {
        audio.giggle(); spin = 1; catches++; parts.burst(a.x, a.y, 24, S * 0.025, COLORS, S * 0.8);
        if (Math.random() < 0.4) sayAnimal(audio, kind, 900);
        a.tx = Math.min(W * 0.88, Math.max(W * 0.12, a.x + (a.x < W / 2 ? 1 : -1) * W * 0.4)); a.ty = rnd(0.35, 0.8) * H;
        if (catches % 4 === 0) setTimeout(() => { kind = bag.next(); sayAnimal(audio, kind, 0); }, 1300);
      } else { a.tx = x; a.ty = Math.max(H * 0.3, Math.min(H * 0.85, y)); a.hop = 1; audio.boing(); }
    },
    drag() {},
    update(dt) {
      t += dt; spin = Math.max(0, spin - dt * 1.2); a.hop = Math.max(0, a.hop - dt * 2); parts.update(dt, 300);
      const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy), sp = S * (spin > 0 ? 0.9 : 0.25);
      if (d < 8) newTarget(); else { a.x += dx / d * Math.min(d, sp * dt); a.y += dy / d * Math.min(d, sp * dt); a.vx = dx; }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      if (th.ground) { ctx.fillStyle = th.ground; ctx.fillRect(0, H * 0.7, W, H * 0.3); }
      for (let i = 0; i < 14; i++) {
        const x = (i * 197) % W, y = th.deco === 'clouds' || th.deco === 'fireflies' || th.deco === 'snow' ? (i * 131 + (th.deco === 'snow' ? t * 30 : 0)) % H : H * 0.75 + (i * 53) % (H * 0.22);
        if (th.deco === 'flowers') { ctx.fillStyle = COLORS[i % 8]; circle(ctx, x, y, S * 0.018); ctx.fillStyle = '#ffd60a'; circle(ctx, x, y, S * 0.007); }
        else if (th.deco === 'leaves') { ctx.fillStyle = '#2d6a4f'; ctx.beginPath(); ctx.ellipse(x, y, S * 0.04, S * 0.015, i, 0, TAU); ctx.fill(); }
        else if (th.deco === 'bubbles') { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, (y - t * 40 + H) % H, S * 0.015, 0, TAU); ctx.stroke(); }
        else if (th.deco === 'clouds') { ctx.fillStyle = 'rgba(255,255,255,.85)'; const cx = (x + t * 15) % (W + 100) - 50; circle(ctx, cx, y * 0.6, S * 0.05); circle(ctx, cx + S * 0.05, y * 0.6, S * 0.04); }
        else if (th.deco === 'snow') { ctx.fillStyle = '#fff'; circle(ctx, x + Math.sin(t + i) * 10, y, 3); }
        else { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillStyle = '#ffee99'; circle(ctx, x + Math.sin(t + i) * 20, y * 0.7, 3); ctx.globalAlpha = 1; }
      }
      const r = S * 0.13, step = Math.abs(Math.sin(t * 9)) * S * 0.02 + Math.sin(a.hop * Math.PI) * S * 0.08;
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(a.x, a.y + r * 1.1, r * 0.8, r * 0.18, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(a.x, a.y - step); ctx.rotate(spin * TAU * 2 + Math.sin(t * 9) * 0.08);
      drawAnimal(ctx, kind, 0, 0, r, t); ctx.restore();
      parts.draw(ctx);
    },
  };
}

// 5) Coconut: a dancing coconut; every tap plays the next bit of the song (the parent's file, or the built-in tune).
// More taps -> more coconut friends join the dance.
const COCO = {
  beach: { bg: ['#4cc9f0', '#fff1d0'], sea: '#00b4d8', sand: '#f4d58d', sun: '#ffd60a' },
  sunset: { bg: ['#ff7b00', '#ffd6a5'], sea: '#c75146', sand: '#e9c46a', sun: '#ff4d6d' },
  disco: { bg: ['#10002b', '#3c096c'], sea: '#5a189a', sand: '#7b2cbf', sun: null, lights: true },
  island: { bg: ['#90e0ef', '#caf0f8'], sea: '#0096c7', sand: '#ffe8a3', sun: '#ffd60a', palms: 3 },
  moon: { bg: ['#03045e', '#0077b6'], sea: '#023e8a', sand: '#adb5bd', sun: '#f8f9fa', stars: true },
};
function cocoScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, dance = 0, taps = 0, jump = 0;
  const fl = floaters(), friends = [];
  function coconut(ctx, x, y, r, ph) {
    const sq = 1 + Math.sin(ph * 2) * 0.08 * (0.3 + dance);
    ctx.save(); ctx.translate(x, y); ctx.scale(1 / sq, sq);
    ctx.strokeStyle = '#5a3825'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
    for (const k of [-1, 1]) { const w = Math.sin(ph * 2 + k) * (0.4 + dance); ctx.beginPath(); ctx.moveTo(k * r * 0.85, 0); ctx.lineTo(k * r * 1.4, -r * 0.3 - w * r * 0.5); ctx.stroke(); }
    ctx.fillStyle = '#7f5539'; circle(ctx, 0, 0, r);
    ctx.fillStyle = '#9c6644'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.3, r * 0.2, -0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#52b788'; for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.ellipse(k * r * 0.35, -r * 1.05, r * 0.15, r * 0.4, k * 0.6, 0, TAU); ctx.fill(); }
    face(ctx, 0, r * 0.1, r * 0.75, dance > 0.3 ? 0.5 + Math.sin(ph * 4) * 0.3 : 0);
    ctx.restore();
  }
  function palm(ctx, x, h) {
    ctx.strokeStyle = '#8d5524'; ctx.lineWidth = S * 0.025; ctx.beginPath(); ctx.moveTo(x, H * 0.82); ctx.quadraticCurveTo(x + S * 0.05, H * 0.82 - h / 2, x - S * 0.02, H * 0.82 - h); ctx.stroke();
    ctx.fillStyle = '#2d6a4f'; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.6 + Math.sin(t * 2) * 0.05 * (1 + dance); ctx.beginPath(); ctx.ellipse(x - S * 0.02 + Math.cos(a) * S * 0.08, H * 0.82 - h + Math.sin(a) * S * 0.05 + S * 0.03, S * 0.1, S * 0.025, a, 0, TAU); ctx.fill(); }
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { dance = 0; taps = 0; friends.length = 0; },
    tap(x) {
      audio.song(0.9); dance = 1; jump = 1; taps++;
      fl.add(rnd(0.3, 0.7) * W, H * 0.5, 'note');
      if (taps % 6 === 0 && friends.length < 4) { friends.push({ side: friends.length % 2 ? 1 : -1, row: friends.length >> 1, k: 0 }); audio.boing(); }
      if (taps % 12 === 0) audio.say('Dừa ơi dừa!', 900);
    },
    drag() {},
    update(dt) {
      t += dt * (1 + dance * 2); dance = Math.max(0, dance - dt * 0.9); jump = Math.max(0, jump - dt * 2.5); fl.update(dt);
      for (const f of friends) f.k = Math.min(1, f.k + dt * 2);
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      if (th.stars) { ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t + i); ctx.fillRect((i * 137) % W, (i * 71) % (H * 0.5), 2, 2); } ctx.globalAlpha = 1; }
      if (th.sun) { ctx.fillStyle = th.sun; circle(ctx, W * 0.82, H * 0.2, S * 0.08); }
      if (th.lights) for (let i = 0; i < 6; i++) { ctx.globalAlpha = 0.25 + dance * 0.3; ctx.fillStyle = COLORS[(i + (t * 3 | 0)) % 8]; circle(ctx, (i * 0.18 + 0.05) * W + Math.sin(t + i) * 30, H * (0.15 + 0.1 * Math.sin(t * 2 + i)), S * 0.06); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = th.sea; ctx.fillRect(0, H * 0.55, W, H * 0.3);
      ctx.fillStyle = th.sand; ctx.beginPath(); ctx.moveTo(0, H * 0.78); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.78 + Math.sin(x * 0.02) * 6); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      for (let i = 0; i < (th.palms || 2); i++) palm(ctx, W * (0.08 + i * 0.84 / Math.max(1, (th.palms || 2) - 1)), H * 0.42);
      const r = S * 0.16;
      for (const f of friends) coconut(ctx, W / 2 + f.side * (r * 2.2 + f.row * r * 1.5), H * 0.74 - Math.abs(Math.sin(t * 4 + f.side)) * S * 0.04 * (0.3 + dance), r * 0.6 * f.k, t * 4 + f.side);
      coconut(ctx, W / 2, H * 0.62 - Math.sin(jump * Math.PI) * S * 0.08 - Math.abs(Math.sin(t * 4)) * S * 0.03 * dance, r, t * 4);
      fl.draw(ctx, S);
    },
  };
}

export function tapGames(audio) {
  return [
    ...variants(audio, 'pump', pumpScene, PUMP),
    ...variants(audio, 'feed', feedScene, FEED),
    ...variants(audio, 'band', bandScene, BAND),
    ...variants(audio, 'chase', chaseScene, CHASE),
    ...variants(audio, 'coco', cocoScene, COCO),
  ];
}
