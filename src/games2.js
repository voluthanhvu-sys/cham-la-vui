// More scenes (same contract as scenes.js: resize, enter, tap, drag, update, draw; a tap ANYWHERE does something).
// Each factory takes a theme object; moreScenes() turns every THEMES table into 5 named variants (mech.theme).
import { drawAnimal, drawStar, drawHeart } from './art.js';
import { TAU, rnd, pick, COLORS, buzz, makeParticles, makeBag, bagFor, sayAnimal, rrect } from './fx.js';

const sky = (ctx, W, H, a, b) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
const smiley = (ctx, x, y, r) => {
  ctx.fillStyle = '#2b2020'; for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(x + k * r * 0.3, y - r * 0.1, r * 0.1, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#2b2020'; ctx.lineWidth = r * 0.08; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y + r * 0.05, r * 0.28, 0.3, Math.PI - 0.3); ctx.stroke();
};
// Copy of scenes.js variants() (scenes.js imports this file, so importing back would be circular).
const variants = (audio, mech, factory, themes) => Object.entries(themes).map(([k, th]) => ({ name: `${mech}.${k}`, make: () => factory(audio, th) }));

// 4) Xylophone family: 8 instruments in a row/grid; tap = note + bounce, slide across = glissando.
const XYLO = {
  wood: { style: 'bar', bg: ['#fff4d6', '#ffd6e0'] },
  piano: { style: 'piano', bg: ['#e9f5ff', '#cfe3ff'] },
  bells: { style: 'bell', bg: ['#fff0f6', '#ffe3b3'] },
  drums: { style: 'drum', bg: ['#e6ffe9', '#c9f2ff'] },
  glasses: { style: 'glass', bg: ['#f3eaff', '#dff6ff'] },
};
function xyloScene(audio, th = XYLO.wood) {
  let W = 1, H = 1, S = 1, t = 0, lastBar = -1;
  const bars = [...Array(8)].map((_, i) => ({ i, x: 0, y: 0, w: 0, h: 0, hit: 0 })), notes = [], parts = makeParticles();
  const rows = th.style === 'bar' || th.style === 'piano';
  function layout() {
    const land = W > H;
    for (const b of bars) {
      if (rows) {
        const k = th.style === 'piano' ? 0 : b.i;
        if (land) { b.w = W * 0.09; b.h = H * (0.72 - k * 0.045); b.x = W * (0.07 + b.i * 0.11); b.y = H * 0.52 - b.h / 2; }
        else { b.h = H * 0.08; b.w = W * (0.9 - k * 0.05); b.x = (W - b.w) / 2; b.y = H * (0.1 + b.i * 0.105); }
      } else {
        const cols = land ? 4 : 2, cw = W * 0.92 / cols, ch = H * 0.88 / (8 / cols);
        b.w = cw * 0.8; b.h = ch * 0.8; b.x = W * 0.04 + (b.i % cols) * cw + cw * 0.1; b.y = H * 0.06 + (b.i / cols | 0) * ch + ch * 0.1;
      }
    }
  }
  function barAt(x, y) {
    let best = bars[0], bd = Infinity;
    for (const b of bars) { const d = Math.hypot(x - (b.x + b.w / 2), y - (b.y + b.h / 2)) - (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h ? 1e6 : 0); if (d < bd) { bd = d; best = b; } }
    return best;
  }
  function hit(b, x, y) {
    b.hit = 1; lastBar = b.i; buzz(10);
    if (th.style === 'drum') audio.drum(b.i); else if (th.style === 'bell' || th.style === 'glass') audio.chime(b.i); else audio.note(b.i);
    parts.burst(x, y, 8, S * 0.014, [COLORS[b.i], '#fff'], 180);
    notes.push({ x, y, age: 0, c: COLORS[b.i] }); if (notes.length > 20) notes.shift();
  }
  function body(ctx, b, x, y, w, h) {
    const c = COLORS[b.i], land = W > H, cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.45;
    if (th.style === 'bar') {
      ctx.fillStyle = 'rgba(0,0,0,.12)'; rrect(ctx, x + 4, y + 6, w, h, S * 0.03); ctx.fill();
      ctx.fillStyle = c; rrect(ctx, x, y, w, h, S * 0.03); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; rrect(ctx, x + w * 0.12, y + h * 0.08, w * 0.25, h * 0.84, S * 0.02); ctx.fill();
      const pr = Math.min(w, h) * 0.12;
      ctx.fillStyle = '#e9e2d0'; for (const f of [0.12, 0.88]) { ctx.beginPath(); ctx.arc(land ? cx : x + w * f, land ? y + h * f : cy, pr, 0, TAU); ctx.fill(); }
      if (b.hit > 0.3) smiley(ctx, cx, cy, Math.min(w, h) * 0.35);
    } else if (th.style === 'piano') {
      ctx.fillStyle = 'rgba(0,0,0,.12)'; rrect(ctx, x + 4, y + 6, w, h, S * 0.02); ctx.fill();
      ctx.fillStyle = b.hit > 0.2 ? c : '#ffffff'; rrect(ctx, x, y, w, h, S * 0.02); ctx.fill();
      ctx.fillStyle = c; if (land) rrect(ctx, x, y + h * 0.78, w, h * 0.22, S * 0.02); else rrect(ctx, x + w * 0.85, y, w * 0.15, h, S * 0.02); ctx.fill();
      smiley(ctx, land ? cx : x + w * 0.5, land ? y + h * 0.6 : cy, Math.min(w, h) * 0.35);
    } else if (th.style === 'bell') {
      ctx.save(); ctx.translate(cx, cy - r * 0.5); ctx.rotate(Math.sin(t * 18) * b.hit * 0.45);
      ctx.fillStyle = '#b08a3e'; ctx.beginPath(); ctx.arc(0, -r * 0.35, r * 0.14, 0, TAU); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-r * 0.85, r * 1.1); ctx.quadraticCurveTo(-r * 0.6, r * 0.9, -r * 0.6, r * 0.3);
      ctx.arc(0, r * 0.3, r * 0.6, Math.PI, 0); ctx.quadraticCurveTo(r * 0.6, r * 0.9, r * 0.85, r * 1.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(Math.sin(t * 18) * b.hit * r * 0.2, r * 1.18, r * 0.16, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, r * 0.35, r * 0.1, r * 0.35, 0.2, 0, TAU); ctx.fill();
      smiley(ctx, 0, r * 0.6, r * 0.5); ctx.restore();
    } else if (th.style === 'drum') {
      const top = cy - r * 0.45;
      ctx.fillStyle = c; ctx.fillRect(cx - r, top, r * 2, r * 1.1); ctx.beginPath(); ctx.ellipse(cx, top + r * 1.1, r, r * 0.32, 0, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = r * 0.06; ctx.beginPath();
      for (let k = 0; k <= 6; k++) ctx.lineTo(cx - r + (k / 6) * r * 2, top + r * (k % 2 ? 0.95 : 0.35)); ctx.stroke();
      ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.ellipse(cx, top - b.hit * r * 0.08, r, r * 0.32, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#d9c9a3'; ctx.lineWidth = r * 0.05; ctx.stroke();
      if (b.hit > 0.2) smiley(ctx, cx, top, r * 0.55);
    } else { // glass: water level falls with pitch
      const gw = r * 1.5, gh = r * 1.9, gx = cx - gw / 2, gy = cy - gh / 2, lvl = 0.88 - b.i * 0.085, wob = Math.sin(t * 25) * b.hit * r * 0.08;
      const path = () => { ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.lineTo(gx + gw * 0.88, gy + gh); ctx.lineTo(gx + gw * 0.12, gy + gh); ctx.closePath(); };
      ctx.save(); path(); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(gx, gy, gw, gh);
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(gx, gy + gh * (1 - lvl) + wob); ctx.lineTo(gx + gw, gy + gh * (1 - lvl) - wob); ctx.lineTo(gx + gw, gy + gh); ctx.lineTo(gx, gy + gh); ctx.fill();
      ctx.restore();
      path(); ctx.strokeStyle = '#8fb3d0'; ctx.lineWidth = Math.max(2, r * 0.06); ctx.stroke();
      smiley(ctx, cx, gy + gh * (1 - lvl / 2), Math.min(r * 0.5, gh * lvl * 0.45));
    }
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { notes.length = 0; lastBar = -1; },
    tap(x, y) { hit(barAt(x, y), x, y); },
    drag(x, y) { const b = barAt(x, y); if (b.i !== lastBar) hit(b, x, y); },
    update(dt) { t += dt; parts.update(dt, 200); for (const b of bars) b.hit = Math.max(0, b.hit - dt * 4); for (const n of notes) { n.age += dt; n.y -= dt * S * 0.15; } },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      for (const b of bars) {
        const k = 1 - Math.sin(b.hit * Math.PI) * 0.08, w = b.w * k, h = b.h * k;
        body(ctx, b, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h);
      }
      for (const n of notes) { ctx.globalAlpha = Math.max(0, 1 - n.age / 1.5); ctx.fillStyle = n.c; ctx.font = `bold ${Math.round(S * 0.08)}px system-ui`; ctx.fillText('♪', n.x, n.y); }
      ctx.globalAlpha = 1; parts.draw(ctx);
    },
  };
}

// 5) Fireworks at night: tap launches a rocket to that spot -> big colorful burst. Auto-launch when idle.
const FIRE = {
  city: { bg: ['#14193a', '#3b2f6b'], ground: 'city', colors: COLORS },
  beach: { bg: ['#1b2a5a', '#6b4b8a'], ground: 'beach', colors: ['#ffd43b', '#4cc9f0', '#ff8fab', '#ffffff', '#7bd389'] },
  hills: { bg: ['#0f2338', '#2f5b6b'], ground: 'hills', colors: ['#ff5d73', '#ffb627', '#b388ff', '#ffffff'] },
  space: { bg: ['#05061a', '#1a1240'], ground: 'space', colors: ['#b388ff', '#4cc9f0', '#ffffff', '#ff8fab'] },
  lanterns: { bg: ['#1a1030', '#4a2a4a'], ground: 'garden', colors: ['#ffb627', '#ff7a59', '#ffd43b', '#ff5d73'] },
};
function fireworkScene(audio, th = FIRE.city) {
  let W = 1, H = 1, S = 1, t = 0, idle = 0;
  const rockets = [], parts = makeParticles(), stars = [], city = [];
  function launch(x, y) { rockets.push({ x, y: H, tx: x, ty: Math.min(y, H * 0.75), c: pick(th.colors) }); audio.whoosh(); }
  function ground(ctx) {
    const g = th.ground;
    if (g === 'city') for (const b of city) {
      ctx.fillStyle = '#241f45'; ctx.fillRect(b.x, H - b.h, b.w, b.h);
      ctx.fillStyle = '#ffd96a'; for (let y = H - b.h + 10; y < H - 10; y += 18) for (let x = b.x + 8; x < b.x + b.w - 8; x += 16) if ((x * 7 + y * 3 + b.win * 100) % 5 < 2) ctx.fillRect(x, y, 6, 8);
    } else if (g === 'beach') {
      ctx.fillStyle = '#1f2f66'; ctx.fillRect(0, H * 0.8, W, H * 0.2);
      ctx.fillStyle = 'rgba(255,240,180,.35)'; for (let i = 0; i < 12; i++) ctx.fillRect((i * 97 + t * 20) % W, H * (0.83 + (i % 4) * 0.025), S * 0.05, 2);
      ctx.fillStyle = '#3a2f4a'; ctx.beginPath(); ctx.ellipse(W * 0.5, H * 1.02, W * 0.7, H * 0.1, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2a2238'; ctx.lineWidth = S * 0.025; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(W * 0.86, H); ctx.quadraticCurveTo(W * 0.84, H * 0.8, W * 0.88, H * 0.66); ctx.stroke();
      ctx.fillStyle = '#2a2238'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(W * 0.88 + Math.cos(k * 1.05) * S * 0.07, H * 0.66 + Math.sin(k * 1.05) * S * 0.03, S * 0.08, S * 0.02, k * 1.05, 0, TAU); ctx.fill(); }
    } else if (g === 'hills') {
      ctx.fillStyle = '#1d3d4a'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.75); ctx.lineTo(W * 0.25, H * 0.6); ctx.lineTo(W * 0.5, H * 0.78); ctx.lineTo(W * 0.72, H * 0.58); ctx.lineTo(W, H * 0.76); ctx.lineTo(W, H); ctx.fill();
      ctx.fillStyle = '#eaf4ff'; for (const [px, py] of [[0.25, 0.6], [0.72, 0.58]]) { ctx.beginPath(); ctx.moveTo(W * px, H * py); ctx.lineTo(W * px - S * 0.05, H * py + S * 0.04); ctx.lineTo(W * px + S * 0.05, H * py + S * 0.04); ctx.fill(); }
      ctx.fillStyle = '#132a33'; ctx.beginPath(); ctx.ellipse(W * 0.3, H * 1.05, W * 0.5, H * 0.17, 0, 0, TAU); ctx.ellipse(W * 0.85, H * 1.05, W * 0.4, H * 0.14, 0, 0, TAU); ctx.fill();
    } else if (g === 'space') {
      const px = W * 0.84, py = H * 0.8, pr = S * 0.13;
      ctx.fillStyle = '#ff9f6b'; ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(px - pr * 0.3, py - pr * 0.3, pr * 0.35, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd6a0'; ctx.lineWidth = S * 0.012; ctx.beginPath(); ctx.ellipse(px, py, pr * 1.7, pr * 0.4, -0.3, 0, TAU); ctx.stroke();
      smiley(ctx, px, py + pr * 0.1, pr * 0.6);
      ctx.fillStyle = '#d9d9f0'; ctx.beginPath(); ctx.arc(W * 0.12, H * 0.2, S * 0.05, 0, TAU); ctx.fill();
    } else { // garden with a string of lanterns
      ctx.fillStyle = '#1f3326'; for (let x = 0; x < W + 60; x += 70) { ctx.beginPath(); ctx.arc(x, H, S * 0.11 + (x % 3) * 8, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 20; i++) { const f = i / 20; ctx.lineTo(W * f, H * 0.1 + Math.sin(f * Math.PI * 2) ** 2 * H * 0.06); } ctx.stroke();
      for (let i = 1; i < 10; i++) {
        const f = i / 10, x = W * f, y = H * 0.1 + Math.sin(f * Math.PI * 2) ** 2 * H * 0.06 + S * 0.035, c = th.colors[i % th.colors.length];
        ctx.fillStyle = c; ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 3 + i); ctx.beginPath(); ctx.arc(x, y, S * 0.05, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1; ctx.beginPath(); ctx.ellipse(x, y, S * 0.022, S * 0.03, 0, 0, TAU); ctx.fill();
      }
    }
  }
  return {
    resize(w, h) {
      W = w; H = h; S = Math.min(w, h); stars.length = 0; city.length = 0;
      for (let i = 0; i < 50; i++) stars.push({ x: Math.random() * w, y: Math.random() * h * 0.7, r: rnd(0.8, 2.2), ph: rnd(0, TAU) });
      for (let x = 0; x < w; x += rnd(30, 70)) city.push({ x, w: rnd(35, 80), h: rnd(0.06, 0.18) * h, win: Math.random() });
    },
    enter() { rockets.length = 0; idle = 2; },
    tap(x, y) { idle = 0; launch(x, y); buzz(10); },
    drag(x, y) { if (Math.random() < 0.3) parts.burst(x, y, 2, S * 0.01, ['#fff3b0', '#ffffff'], 60); },
    update(dt) {
      t += dt; idle += dt; parts.update(dt, 70);
      if (idle > 3) { idle = 1.5; launch(rnd(W * 0.15, W * 0.85), rnd(H * 0.15, H * 0.45)); }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]; r.y -= dt * H * 1.6; r.x += (r.tx - r.x) * Math.min(1, dt * 6);
        if (r.y <= r.ty) {
          rockets.splice(i, 1);
          parts.burst(r.tx, r.ty, 45, S * 0.022, [r.c, pick(th.colors), '#ffffff'], S * 0.6);
          audio.pop(); audio.chime(Math.random() * 8 | 0);
        }
      }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      for (const s of stars) { ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2 + s.ph); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
      for (const r of rockets) { ctx.fillStyle = r.c; ctx.beginPath(); ctx.arc(r.x, r.y, S * 0.012, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,240,180,.5)'; ctx.fillRect(r.x - 1.5, r.y, 3, S * 0.06); }
      parts.draw(ctx);
      ground(ctx);
    },
  };
}

// 6) Aquarium family: tap = ripple + the nearest swimmer goes there; tap ON one = it spins and blows bubbles.
const FISH = {
  sea: { kind: 'fish', bg: ['#7fd8f5', '#1f7fb8'], floor: 'sand', say: 'Con cá', colors: COLORS },
  koi: { kind: 'fish', bg: ['#a8e6cf', '#2f7f6a'], floor: 'pebbles', say: 'Con cá chép', colors: ['#ff7a59', '#ffb627', '#ffffff', '#ff5d73'] },
  jelly: { kind: 'jelly', bg: ['#4a6be0', '#0b1d5a'], floor: 'sand', say: 'Con sứa', colors: ['#ff8fab', '#b388ff', '#4cc9f0', '#ffd6f0'] },
  pond: { kind: 'animal', group: 'water', bg: ['#b5f0d0', '#3fae8a'], floor: 'lily' },
  stars: { kind: 'star', bg: ['#1a1f4a', '#3b2f6b'], floor: 'none', say: 'Ngôi sao', colors: ['#ffd43b', '#fff3b0', '#ffb627', '#ff8fab'] },
};
function fishScene(audio, th = FISH.sea) {
  let W = 1, H = 1, S = 1, t = 0;
  const fish = [], ripples = [], bubbles = makeParticles(), bag = bagFor(th.group);
  const bub = th.kind === 'star' ? ['#fff3b0', '#ffffff'] : ['#ffffff', '#cdeffd'];
  function add() { fish.push({ x: rnd(0.1, 0.9) * W, y: rnd(0.2, 0.75) * H, tx: rnd(0.1, 0.9) * W, ty: rnd(0.2, 0.75) * H, c: pick(th.colors || COLORS), s: S * rnd(0.06, 0.09), dir: 1, spin: 0, wait: rnd(0, 2), kind: th.kind === 'animal' ? bag.next() : null }); }
  function drawOne(ctx, f) {
    const s = f.s;
    if (th.kind === 'animal') { drawAnimal(ctx, f.kind, 0, 0, s * 1.1, t); return; }
    if (th.kind === 'star') { ctx.fillStyle = f.c; drawStar(ctx, 0, 0, s * 1.1, -Math.PI / 2); smiley(ctx, 0, s * 0.05, s * 0.7); return; }
    if (th.kind === 'jelly') {
      const p = 1 + Math.sin(t * 4 + s) * 0.08;
      ctx.strokeStyle = f.c; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round';
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * s * 0.3, 0); for (let j = 1; j <= 4; j++) ctx.lineTo(k * s * 0.3 + Math.sin(t * 5 + j + k) * s * 0.12, j * s * 0.3); ctx.stroke(); }
      ctx.fillStyle = f.c; ctx.beginPath(); ctx.ellipse(0, 0, s * p, s * 0.85 / p, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-s * 0.35, -s * 0.45, s * 0.2, s * 0.12, -0.5, 0, TAU); ctx.fill();
      smiley(ctx, 0, -s * 0.35, s * 0.6); return;
    }
    const wag = Math.sin(t * 10) * s * 0.15;
    ctx.fillStyle = f.c; ctx.beginPath(); ctx.moveTo(-s * 0.8, 0); ctx.lineTo(-s * 1.5, -s * 0.55 + wag); ctx.lineTo(-s * 1.5, s * 0.55 + wag); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = th.floor === 'pebbles' ? 'rgba(255,90,60,.55)' : 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-s * 0.1, th.floor === 'pebbles' ? -s * 0.2 : s * 0.25, s * 0.45, s * 0.25, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 0.45, -s * 0.15, s * 0.22, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2b2020'; ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.15, s * 0.12, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2b2020'; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.arc(s * 0.6, s * 0.15, s * 0.15, 0.2, 1.8); ctx.stroke();
  }
  function floor(ctx) {
    if (th.floor === 'none') { ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 2 + i); ctx.fillRect((i * 137) % W, (i * 89) % H, 2, 2); } ctx.globalAlpha = 1; return; }
    if (th.floor === 'lily') {
      for (let i = 0; i < 7; i++) { const x = W * ((i * 0.37) % 1), y = H * (0.15 + ((i * 0.53) % 0.7)); ctx.fillStyle = '#5fbf6a'; ctx.beginPath(); ctx.ellipse(x, y, S * 0.07, S * 0.03, 0, 0.3, TAU - 0.3); ctx.lineTo(x, y); ctx.fill(); if (i % 2) { ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(x + S * 0.02, y - S * 0.01, S * 0.015, 0, TAU); ctx.fill(); } }
      ctx.strokeStyle = '#2f8f4f'; ctx.lineWidth = S * 0.012; for (let i = 0; i < 10; i++) { const x = W * (0.03 + i * 0.105); ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + Math.sin(t + i) * S * 0.01, H * 0.82); ctx.stroke(); }
      return;
    }
    ctx.fillStyle = th.floor === 'pebbles' ? '#7a8f6a' : '#f3dca2'; ctx.beginPath(); ctx.moveTo(0, H * 0.9); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.9 + Math.sin(x * 0.03) * 6); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    if (th.floor === 'pebbles') { for (let i = 0; i < 18; i++) { ctx.fillStyle = ['#c9c2b0', '#9f9a8a', '#e0d8c4'][i % 3]; ctx.beginPath(); ctx.ellipse((i * 61) % W, H * (0.93 + (i % 3) * 0.02), S * 0.025, S * 0.015, 0, 0, TAU); ctx.fill(); } }
    ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = S * 0.02; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const bx = W * (0.08 + i * 0.17); ctx.beginPath(); ctx.moveTo(bx, H * 0.93); for (let k = 1; k <= 6; k++) ctx.lineTo(bx + Math.sin(t * 1.5 + k + i) * S * 0.02, H * 0.93 - k * S * 0.045); ctx.stroke(); }
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { fish.length = 0; for (let i = 0; i < 6; i++) add(); },
    tap(x, y) {
      ripples.push({ x, y, age: 0 });
      let best = fish[0], bd = Infinity; for (const f of fish) { const d = Math.hypot(x - f.x, y - f.y); if (d < bd) { bd = d; best = f; } }
      if (bd < best.s * 1.6) {
        best.spin = 1; bubbles.burst(best.x, best.y - best.s * 0.5, 10, S * 0.012, bub, 80); audio.pop(); buzz(15);
        if (best.kind) sayAnimal(audio, best.kind, 200); else audio.say(th.say, 300);
      } else { best.tx = x; best.ty = Math.max(H * 0.12, Math.min(H * 0.82, y)); best.wait = 0; audio.twinkle(); }
    },
    drag(x, y) { if (Math.random() < 0.15) bubbles.burst(x, y, 1, S * 0.012, [bub[0]], 30); },
    update(dt) {
      t += dt; bubbles.update(dt, -120);
      for (const r of ripples) r.age += dt; while (ripples.length && ripples[0].age > 1) ripples.shift();
      for (const f of fish) {
        f.spin = Math.max(0, f.spin - dt * 1.5);
        const dx = f.tx - f.x, dy = f.ty - f.y, d = Math.hypot(dx, dy);
        if (d > 5) { const v = Math.min(d, S * 0.25 * dt * (f.wait === 0 ? 2 : 1)); f.x += (dx / d) * v; f.y += (dy / d) * v; if (Math.abs(dx) > 2) f.dir = Math.sign(dx); }
        else if ((f.wait -= dt) < -2) { f.tx = rnd(0.1, 0.9) * W; f.ty = rnd(0.2, 0.75) * H; f.wait = 1; }
        if (Math.random() < dt * 0.3) bubbles.burst(f.x + f.dir * f.s, f.y, 1, S * 0.008, [bub[0]], 20);
      }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      floor(ctx);
      for (const r of ripples) { ctx.globalAlpha = 1 - r.age; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, S * 0.03 + r.age * S * 0.12, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
      for (const f of fish) {
        ctx.save(); ctx.translate(f.x, f.y + Math.sin(t * 3 + f.s) * 3); ctx.rotate(f.spin * TAU); if (th.kind === 'fish') ctx.scale(f.dir, 1);
        drawOne(ctx, f); ctx.restore();
      }
      bubbles.draw(ctx);
    },
  };
}

// 7) Animal convoy: a train (bus, boats, balloons, sleighs) loops across, each car carries an animal.
// Tap a car = it jumps and the animal talks; tap elsewhere = toot.
const TRAIN = {
  train: { car: 'train', bg: ['#bde6ff', '#e8f7ff'], group: 'all' },
  bus: { car: 'bus', bg: ['#cfefff', '#f2fbff'], group: 'farm' },
  boat: { car: 'boat', bg: ['#ffe0b8', '#bfe8ff'], group: 'water' },
  balloon: { car: 'balloon', bg: ['#8fd0ff', '#e3f5ff'], group: 'sky' },
  sleigh: { car: 'sleigh', bg: ['#c9dcf2', '#f4f8ff'], group: 'cold' },
};
function trainScene(audio, th = TRAIN.train) {
  let W = 1, H = 1, S = 1, t = 0, head = 0;
  const cars = [...Array(4)].map(() => ({ kind: null, jump: 0, c: pick(COLORS) })), smoke = makeParticles(), bag = bagFor(th.group);
  const cw = () => S * 0.3, gap = () => cw() * 1.12, len = () => gap() * 5;
  const carX = (i) => head - (i + 1) * gap();
  const ryOf = () => H * (th.car === 'balloon' ? 0.66 : 0.72);
  const bob = (i) => th.car === 'boat' ? Math.sin(t * 2.5 + i) * S * 0.012 : th.car === 'balloon' ? Math.sin(t * 1.5 + i * 1.3) * S * 0.03 : 0;
  const puffY = () => ryOf() - S * (th.car === 'boat' ? 0.34 : 0.3);
  function wheel(ctx, x, ry) { ctx.fillStyle = '#3b3b48'; ctx.beginPath(); ctx.arc(x, ry, S * 0.035, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; const a = head / (S * 0.035); ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + Math.cos(a) * S * 0.03, ry + Math.sin(a) * S * 0.03); ctx.stroke(); }
  function ground(ctx, ry) {
    const c = th.car;
    if (c === 'boat') {
      ctx.fillStyle = '#4cb4e8'; ctx.beginPath(); ctx.moveTo(0, ry - S * 0.03); for (let x = 0; x <= W; x += 15) ctx.lineTo(x, ry - S * 0.03 + Math.sin(x * 0.04 + t * 2) * S * 0.008); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 10; i++) ctx.fillRect((i * 113 - t * 30 + W * 10) % W, ry + S * (0.04 + (i % 3) * 0.05), S * 0.06, 3);
      return;
    }
    if (c === 'balloon') {
      ctx.fillStyle = '#a6e3a0'; ctx.beginPath(); ctx.ellipse(W * 0.3, H * 1.02, W * 0.5, H * 0.14, 0, 0, TAU); ctx.ellipse(W * 0.85, H * 1.03, W * 0.4, H * 0.12, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 5; i++) { const x = ((i * 0.27 + t * 0.01) % 1.2 - 0.1) * W, y = H * (0.12 + (i % 3) * 0.1); for (const [dx, r] of [[-1, 0.035], [0, 0.05], [1, 0.035]]) { ctx.beginPath(); ctx.arc(x + dx * S * 0.05, y, S * r, 0, TAU); ctx.fill(); } }
      return;
    }
    const snow = c === 'sleigh';
    ctx.fillStyle = snow ? '#e6eef8' : '#a6e3a0'; ctx.beginPath(); ctx.ellipse(W * 0.25, H * 0.75, W * 0.4, H * 0.25, 0, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(W * 0.8, H * 0.76, W * 0.35, H * 0.2, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = snow ? '#ffffff' : '#8fd17f'; ctx.fillRect(0, H * 0.74, W, H * 0.26);
    if (c === 'train') {
      ctx.fillStyle = '#a0522d'; for (let x = (-t * S * 0.16) % 30; x < W; x += 30) ctx.fillRect(x, ry + S * 0.03, 14, S * 0.02);
      ctx.fillStyle = '#6b6b7a'; ctx.fillRect(0, ry + S * 0.025, W, S * 0.01);
    } else if (c === 'bus') {
      ctx.fillStyle = '#7a7a88'; ctx.fillRect(0, ry + S * 0.02, W, S * 0.07);
      ctx.fillStyle = '#fff'; for (let x = 0; x < W; x += S * 0.12) ctx.fillRect(x, ry + S * 0.05, S * 0.06, S * 0.01);
    } else {
      ctx.fillStyle = '#fff'; for (let i = 0; i < 30; i++) { const x = (i * 71) % W, y = ((i * 53 + t * S * 0.05) % (H * 0.74)); ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#4f8f6a'; for (const fx of [0.08, 0.6, 0.93]) { const x = W * fx, y = H * 0.74; ctx.beginPath(); ctx.moveTo(x, y - S * 0.2); ctx.lineTo(x - S * 0.07, y); ctx.lineTo(x + S * 0.07, y); ctx.fill(); }
    }
  }
  function car(ctx, x, ry, w, c, lead) {
    const k = th.car, hh = lead ? 0.2 : 0.12;
    if (k === 'train') {
      if (lead) {
        ctx.fillStyle = '#ff5d73'; rrect(ctx, x, ry - S * 0.2, w, S * 0.18, S * 0.02); ctx.fill();
        ctx.fillStyle = '#3a86ff'; rrect(ctx, x, ry - S * 0.32, w * 0.45, S * 0.14, S * 0.02); ctx.fill();
        ctx.fillStyle = '#bde0fe'; ctx.fillRect(x + w * 0.08, ry - S * 0.29, w * 0.28, S * 0.07);
        ctx.fillStyle = '#333'; ctx.fillRect(x + w * 0.65, ry - S * 0.3, w * 0.14, S * 0.1);
        smiley(ctx, x + w * 0.8, ry - S * 0.11, S * 0.06);
      } else { ctx.fillStyle = c; rrect(ctx, x, ry - S * 0.14, w, S * 0.12, S * 0.02); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + w * 0.1, ry - S * 0.12, w * 0.8, S * 0.02); }
      wheel(ctx, x + w * 0.22, ry); wheel(ctx, x + w * 0.78, ry);
    } else if (k === 'bus') {
      ctx.fillStyle = c; rrect(ctx, x, ry - S * (hh + 0.02), w, S * hh, S * 0.04); ctx.fill();
      ctx.fillStyle = '#d6f0ff'; if (lead) { for (let i = 0; i < 3; i++) rrect(ctx, x + w * (0.08 + i * 0.22), ry - S * 0.19, w * 0.17, S * 0.07, S * 0.015); rrect(ctx, x + w * 0.78, ry - S * 0.19, w * 0.18, S * 0.09, S * 0.015); ctx.fill(); smiley(ctx, x + w * 0.86, ry - S * 0.07, S * 0.05); }
      else { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + w * 0.1, ry - S * 0.12, w * 0.8, S * 0.02); }
      wheel(ctx, x + w * 0.22, ry); wheel(ctx, x + w * 0.78, ry);
    } else if (k === 'boat') {
      if (lead) {
        ctx.fillStyle = '#fff'; rrect(ctx, x + w * 0.2, ry - S * 0.24, w * 0.5, S * 0.14, S * 0.02); ctx.fill();
        ctx.fillStyle = '#333'; ctx.fillRect(x + w * 0.3, ry - S * 0.32, w * 0.12, S * 0.09);
        smiley(ctx, x + w * 0.5, ry - S * 0.17, S * 0.05);
      }
      ctx.fillStyle = lead ? '#ff5d73' : c; ctx.beginPath(); ctx.moveTo(x - w * 0.05, ry - S * 0.11); ctx.lineTo(x + w * 1.05, ry - S * 0.11); ctx.lineTo(x + w * 0.85, ry); ctx.lineTo(x + w * 0.15, ry); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x + w * 0.05, ry - S * 0.08, w * 0.9, S * 0.015);
    } else if (k === 'balloon') {
      const ey = ry - S * (lead ? 0.3 : 0.38), er = w * (lead ? 0.5 : 0.42);
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w * 0.32, ry - S * 0.09); ctx.lineTo(x + w / 2 - er * 0.6, ey + er * 0.7); ctx.moveTo(x + w * 0.68, ry - S * 0.09); ctx.lineTo(x + w / 2 + er * 0.6, ey + er * 0.7); ctx.stroke();
      ctx.fillStyle = lead ? '#ff5d73' : c; ctx.beginPath(); ctx.arc(x + w / 2, ey, er, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(x + w / 2, ey, er * 0.35, er, 0, 0, TAU); ctx.fill();
      if (lead) smiley(ctx, x + w / 2, ey, er * 0.7);
      ctx.fillStyle = '#c68642'; rrect(ctx, x + w * 0.3, ry - S * 0.1, w * 0.4, S * 0.08, S * 0.01); ctx.fill();
    } else { // sleigh
      ctx.fillStyle = lead ? '#ff5d73' : c; rrect(ctx, x, ry - S * (hh + 0.03), w, S * hh, S * 0.03); ctx.fill();
      ctx.strokeStyle = '#b08a3e'; ctx.lineWidth = S * 0.012; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + w * 1.05, ry); ctx.arc(x + w * 1.05, ry - S * 0.03, S * 0.03, Math.PI / 2, -Math.PI / 2, true); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w * 0.25, ry); ctx.lineTo(x + w * 0.25, ry - S * 0.03); ctx.moveTo(x + w * 0.75, ry); ctx.lineTo(x + w * 0.75, ry - S * 0.03); ctx.stroke();
      if (lead) smiley(ctx, x + w * 0.6, ry - S * 0.13, S * 0.06);
    }
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { head = W * 0.6; cars.forEach((c) => (c.kind = bag.next())); },
    tap(x, y) {
      let bi = -1, bd = Infinity; cars.forEach((c, i) => { const d = Math.abs(x - (carX(i) + cw() / 2)); if (d < bd) { bd = d; bi = i; } });
      if (bi >= 0 && bd < cw() * 0.8) { const c = cars[bi]; c.jump = 1; sayAnimal(audio, c.kind, 50); buzz(15); }
      else { audio.toot(); smoke.burst(head - cw() * 0.3, puffY(), 8, S * 0.04, ['#ffffff', '#e8e8f0'], 60); }
    },
    drag() {},
    update(dt) {
      t += dt; smoke.update(dt, -40);
      head += dt * S * 0.16;
      if (head - len() > W) { head = 0; cars.forEach((c) => { c.kind = bag.next(); c.c = pick(COLORS); }); audio.toot(); }
      for (const c of cars) c.jump = Math.max(0, c.jump - dt * 1.6);
      if ((th.car === 'train' || th.car === 'boat') && Math.random() < dt * 3) smoke.burst(head - cw() * (th.car === 'boat' ? 0.64 : 0.3), puffY(), 1, S * 0.035, ['#ffffff', '#eeeeee'], 30);
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      const ry = ryOf(), w = cw(); ground(ctx, ry);
      cars.forEach((c, i) => {
        const x = carX(i); if (x > W || x + w < 0) return;
        const y = ry + bob(i), j = Math.sin(c.jump * Math.PI) * S * 0.12;
        if (th.car === 'balloon') { ctx.save(); ctx.translate(0, -j); car(ctx, x, y, w, c.c, false); drawAnimal(ctx, c.kind, x + w / 2, y - S * 0.14, S * 0.07, t); ctx.restore(); return; }
        drawAnimal(ctx, c.kind, x + w / 2, y - S * 0.17 - j, S * 0.085, t);
        car(ctx, x, y, w, c.c, false);
      });
      car(ctx, head - w, ry + bob(-1), w, '#ff5d73', true);
      smoke.draw(ctx);
    },
  };
}

// 8) Shapes with faces bounce around; tap one = squish + its name; tap empty space = a new shape appears there.
const SHAPES = { circle: 'Hình tròn', square: 'Hình vuông', triangle: 'Hình tam giác', star: 'Ngôi sao', heart: 'Trái tim' };
const SHAPE_T = {
  rainbow: {},
  big: { bg: ['#fff6d6', '#ffe0e9'], r: [0.15, 0.19], max: 4, start: 3 },
  tiny: { bg: ['#e8fff0', '#d6f0ff'], r: [0.045, 0.065], max: 14, start: 9 },
  night: { bg: ['#1d1b3a', '#2e2a5a'], colors: ['#ffd43b', '#4cc9f0', '#ff8fab', '#b388ff', '#7bd389'], glow: true },
  love: { bg: ['#fff0f5', '#ffd6e5'], types: ['heart', 'star', 'circle'], colors: ['#ff5d73', '#ff8fab', '#ffb3c6', '#ffd43b'] },
};
function drawShape(ctx, type, x, y, r) {
  ctx.beginPath();
  if (type === 'circle') ctx.arc(x, y, r, 0, TAU);
  else if (type === 'square') rrect(ctx, x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, r * 0.25);
  else if (type === 'triangle') { ctx.moveTo(x, y - r * 1.05); ctx.lineTo(x + r * 1.05, y + r * 0.8); ctx.lineTo(x - r * 1.05, y + r * 0.8); ctx.closePath(); }
  else if (type === 'heart') { ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.1, x - r * 0.6, y - r * 1.3, x, y - r * 0.45); ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.1, x, y + r * 0.9); }
  if (type === 'star') drawStar(ctx, x, y, r * 1.15, -Math.PI / 2); else ctx.fill();
}
function shapeScene(audio, theme = SHAPE_T.rainbow) {
  const th = { bg: ['#fdf0ff', '#d9f2ff'], r: [0.08, 0.11], max: 7, start: 4, colors: COLORS, types: Object.keys(SHAPES), ...theme };
  let W = 1, H = 1, S = 1, t = 0;
  const list = [], parts = makeParticles(), bag = makeBag(th.types);
  function add(x, y) {
    const a = rnd(0, TAU), v = S * rnd(0.08, 0.15);
    list.push({ type: bag.next(), x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: S * rnd(...th.r), c: pick(th.colors), sq: 0, rot: 0 });
    if (list.length > th.max) list.shift();
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { list.length = 0; for (let i = 0; i < th.start; i++) add(rnd(0.2, 0.8) * W, rnd(0.2, 0.8) * H); },
    tap(x, y) {
      let best = null, bd = Infinity; for (const s of list) { const d = Math.hypot(x - s.x, y - s.y) / s.r; if (d < bd) { bd = d; best = s; } }
      if (best && bd < 1.8) { best.sq = 1; best.vy -= S * 0.3; parts.burst(best.x, best.y, 12, S * 0.015, [best.c, '#fff'], 220); audio.note(Math.random() * 8 | 0); audio.say(SHAPES[best.type], 250); buzz(15); }
      else { add(x, y); const s = list[list.length - 1]; s.sq = 1; parts.burst(x, y, 10, S * 0.014); audio.pop(); audio.say(SHAPES[s.type], 300); }
    },
    drag() {},
    update(dt) {
      t += dt; parts.update(dt, 200);
      for (const s of list) {
        s.sq = Math.max(0, s.sq - dt * 2.5); s.x += s.vx * dt; s.y += s.vy * dt; s.vy += S * 0.2 * dt * (s.vy < 0 ? 1 : 0);
        if (s.x < s.r || s.x > W - s.r) { s.vx *= -1; s.x = Math.max(s.r, Math.min(W - s.r, s.x)); }
        if (s.y < s.r || s.y > H - s.r) { s.vy *= -1; s.y = Math.max(s.r, Math.min(H - s.r, s.y)); }
      }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      for (const s of list) {
        const k = Math.sin(s.sq * Math.PI) * 0.25;
        ctx.save(); ctx.translate(s.x, s.y); ctx.scale(1 + k, 1 - k);
        if (th.glow) { ctx.shadowColor = s.c; ctx.shadowBlur = s.r * 0.8; } else { ctx.fillStyle = 'rgba(0,0,0,.1)'; drawShape(ctx, s.type, 4, 6, s.r); }
        ctx.fillStyle = s.c; drawShape(ctx, s.type, 0, 0, s.r); ctx.shadowBlur = 0;
        smiley(ctx, 0, s.type === 'triangle' ? s.r * 0.2 : 0, s.r * 0.75);
        ctx.restore();
      }
      parts.draw(ctx);
    },
  };
}

// 9) Fruit tree: tap = the nearest fruit drops into the basket and is named; it grows back.
const FRUITS = {
  apple: ['Quả táo', '#ff4d4d'], orange: ['Quả cam', '#ff9f1c'], banana: ['Quả chuối', '#ffe14d'], straw: ['Quả dâu', '#ff3b6b'], grape: ['Chùm nho', '#9b5de5'],
  pear: ['Quả lê', '#b5e655'], mango: ['Quả xoài', '#ffc93c'], tomato: ['Quả cà chua', '#ff5a3c'], carrot: ['Củ cà rốt', '#ff8c1a'], eggplant: ['Quả cà tím', '#8e44ad'],
};
const FRUIT_T = {
  tree: { items: ['apple', 'orange', 'banana', 'straw', 'grape', 'pear', 'mango'], bg: ['#c9ecff', '#f0fbff'], leaf: ['#3fae5a', '#58c26a'], grass: '#9be38a', trunk: true },
  apples: { items: ['apple', 'pear'], bg: ['#ffe9c9', '#fff8ec'], leaf: ['#2f9e4a', '#4cbf63'], grass: '#c9e27a', trunk: true },
  tropic: { items: ['banana', 'mango', 'orange'], bg: ['#ffe28a', '#fff6d6'], leaf: ['#1f9e6a', '#35c486'], grass: '#f3dca2', trunk: true },
  berries: { items: ['straw', 'grape'], bg: ['#ffe0ef', '#fff5fa'], leaf: ['#e88bb4', '#f7b0cf'], grass: '#9be38a', trunk: true },
  veg: { items: ['tomato', 'carrot', 'eggplant'], bg: ['#d9f5ff', '#f7fff0'], leaf: ['#2f8f3f', '#47a857'], grass: '#a0794f', trunk: false },
};
function drawFruit(ctx, type, x, y, r) {
  const c = FRUITS[type][1]; ctx.fillStyle = c;
  if (type === 'banana') { ctx.strokeStyle = c; ctx.lineWidth = r * 0.7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y - r * 0.6, r * 1.1, 0.5, Math.PI - 0.5); ctx.stroke(); }
  else if (type === 'grape') { for (const [dx, dy] of [[-0.4, -0.4], [0.4, -0.4], [0, -0.45], [-0.2, 0.1], [0.2, 0.1], [0, 0.6]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, r * 0.42, 0, TAU); ctx.fill(); } }
  else if (type === 'pear') { ctx.beginPath(); ctx.arc(x, y + r * 0.25, r * 0.85, 0, TAU); ctx.arc(x, y - r * 0.45, r * 0.55, 0, TAU); ctx.fill(); }
  else if (type === 'straw') { ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.5); ctx.quadraticCurveTo(x, y - r * 0.9, x + r, y - r * 0.5); ctx.quadraticCurveTo(x + r * 0.8, y + r * 0.6, x, y + r); ctx.quadraticCurveTo(x - r * 0.8, y + r * 0.6, x - r, y - r * 0.5); ctx.fill(); ctx.fillStyle = '#fff3b0'; for (const [dx, dy] of [[-0.4, -0.2], [0.3, -0.25], [0, 0.2], [-0.2, 0.5], [0.35, 0.3]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, r * 0.07, 0, TAU); ctx.fill(); } }
  else if (type === 'carrot') { ctx.beginPath(); ctx.moveTo(x - r * 0.75, y - r * 0.7); ctx.lineTo(x + r * 0.75, y - r * 0.7); ctx.lineTo(x, y + r * 1.3); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3fae5a'; for (const a of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(x + a * r * 0.6, y - r * 1.05, r * 0.14, r * 0.4, a, 0, TAU); ctx.fill(); } }
  else { ctx.beginPath(); if (type === 'mango') ctx.ellipse(x, y, r * 1.1, r * 0.85, 0.4, 0, TAU); else if (type === 'eggplant') ctx.ellipse(x, y + r * 0.1, r * 0.8, r * 1.15, 0.3, 0, TAU); else ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  if (type !== 'carrot') { ctx.fillStyle = '#3fae5a'; ctx.beginPath(); ctx.ellipse(x + r * 0.25, y - r * 1.0, r * 0.3, r * 0.14, -0.5, 0, TAU); ctx.fill(); }
  if (type !== 'banana' && type !== 'grape') smiley(ctx, x, y + (type === 'carrot' ? -r * 0.2 : r * 0.1), r * 0.6);
}
function fruitScene(audio, th = FRUIT_T.tree) {
  let W = 1, H = 1, S = 1, t = 0, shake = 0;
  const slots = [], falling = [], basket = [], parts = makeParticles(), bag = makeBag(th.items);
  let cx = 0, cy = 0, cr = 0, bx = 0, by = 0;
  function layout() {
    cx = W / 2; cy = H * (th.trunk ? 0.36 : 0.5); cr = Math.min(W * 0.4, H * 0.3); bx = W > H ? W * 0.82 : W / 2; by = H * 0.88;
    const pts = [[-0.5, -0.3], [0, -0.55], [0.5, -0.3], [-0.6, 0.2], [0, 0.05], [0.6, 0.2], [-0.25, 0.45], [0.3, 0.45]];
    slots.length = 0; for (const [dx, dy] of pts) slots.push({ x: cx + dx * cr, y: cy + dy * cr, type: bag.next(), grow: 1 });
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { basket.length = 0; falling.length = 0; for (const s of slots) { s.type = bag.next(); s.grow = 1; } },
    tap(x, y) {
      let best = null, bd = Infinity; for (const s of slots) if (s.grow >= 1) { const d = Math.hypot(x - s.x, y - s.y); if (d < bd) { bd = d; best = s; } }
      if (!best) { shake = 1; audio.rustle(); parts.burst(cx, cy, 10, S * 0.02, th.leaf, 200); return; }
      falling.push({ type: best.type, x: best.x, y: best.y, vy: 0, vx: (bx - best.x) * 1.1 });
      best.grow = 0; shake = 0.6; audio.rustle(); audio.say(FRUITS[best.type][0], 500); buzz(15);
    },
    drag() {},
    update(dt) {
      t += dt; parts.update(dt, 300); shake = Math.max(0, shake - dt * 2);
      for (const s of slots) if (s.grow < 1) { s.grow += dt / 2.5; if (s.grow >= 1) { s.grow = 1; s.type = bag.next(); } }
      for (let i = falling.length - 1; i >= 0; i--) {
        const f = falling[i]; f.vy += S * 2.2 * dt; f.y += f.vy * dt; f.x += f.vx * dt;
        if (f.y >= by - S * 0.05) {
          falling.splice(i, 1); basket.push(f.type); if (basket.length > 6) basket.shift();
          parts.burst(bx, by - S * 0.06, 12, S * 0.015); audio.note(2 + (Math.random() * 5 | 0));
        }
      }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      ctx.fillStyle = th.grass; ctx.fillRect(0, H * 0.8, W, H * 0.2);
      const sx = Math.sin(t * 40) * shake * S * 0.01;
      if (th.trunk) { ctx.fillStyle = '#8b5a2b'; ctx.fillRect(cx - cr * 0.12, cy, cr * 0.24, H * 0.82 - cy); }
      ctx.fillStyle = th.leaf[0]; for (const [dx, dy, r] of [[-0.5, 0, 0.6], [0.5, 0, 0.6], [0, -0.35, 0.65], [0, 0.2, 0.6]]) { ctx.beginPath(); ctx.arc(cx + dx * cr + sx, cy + dy * cr, r * cr, 0, TAU); ctx.fill(); }
      ctx.fillStyle = th.leaf[1]; for (const [dx, dy, r] of [[-0.45, -0.05, 0.5], [0.45, -0.05, 0.5], [0, -0.38, 0.55]]) { ctx.beginPath(); ctx.arc(cx + dx * cr + sx, cy + dy * cr, r * cr, 0, TAU); ctx.fill(); }
      const fr = S * 0.05;
      for (const s of slots) if (s.grow > 0) drawFruit(ctx, s.type, s.x + sx, s.y, fr * Math.min(1, s.grow));
      basket.forEach((ty, i) => drawFruit(ctx, ty, bx + (i - (basket.length - 1) / 2) * fr * 1.2, by - S * 0.08 - (i % 2) * fr * 0.5, fr * 0.9));
      ctx.fillStyle = '#c68642'; rrect(ctx, bx - S * 0.2, by - S * 0.08, S * 0.4, S * 0.13, S * 0.03); ctx.fill();
      ctx.strokeStyle = '#a0662a'; ctx.lineWidth = 3; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(bx - S * 0.2 + i * S * 0.08, by - S * 0.08); ctx.lineTo(bx - S * 0.2 + i * S * 0.08, by + S * 0.05); ctx.stroke(); }
      for (const f of falling) drawFruit(ctx, f.type, f.x, f.y, fr);
      parts.draw(ctx);
    },
  };
}

// 10) Finger paint: drag paints, tap = stamp. Paint slowly fades.
const PAINT = {
  rainbow: { bg: ['#ffffff', '#fff8e7'], stamp: 'splat' },
  stars: { bg: ['#1a1f4a', '#3b2f6b'], stamp: 'star', trail: 'stars' },
  animals: { bg: ['#f6fff0', '#fff8e7'], stamp: 'animal' },
  chalk: { bg: ['#2f5d46', '#264d3a'], stamp: 'heart', chalk: true },
  glow: { bg: ['#0b0b1a', '#141432'], stamp: 'splat', glow: true },
};
function paintScene(audio, th = PAINT.rainbow) {
  let W = 1, H = 1, S = 1, t = 0, hue = 0, last = null, lastTw = 0, off = null, octx = null, acc = 0;
  const bag = bagFor('all');
  const col = (h) => th.chalk ? `hsl(${h},80%,82%)` : `hsl(${h},95%,${th.glow ? 62 : 60}%)`;
  const glowOn = (c) => { if (th.glow) { octx.shadowColor = c; octx.shadowBlur = S * 0.03; } };
  return {
    resize(w, h) {
      W = w; H = h; S = Math.min(w, h);
      const k = Math.min(2, devicePixelRatio || 1); off = document.createElement('canvas'); off.width = w * k; off.height = h * k;
      octx = off.getContext('2d'); octx.setTransform(k, 0, 0, k, 0, 0); octx.lineCap = 'round'; octx.lineJoin = 'round';
    },
    enter() { octx?.clearRect(0, 0, W, H); last = null; },
    tap(x, y) {
      hue = (hue + 47) % 360; last = { x, y };
      const c = col(hue); octx.fillStyle = c; glowOn(c);
      if (th.stamp === 'animal') { const k = bag.next(); drawAnimal(octx, k, x, y, S * 0.08, 0); sayAnimal(audio, k, 200); }
      else if (th.stamp === 'star') { drawStar(octx, x, y, S * 0.07, rnd(0, TAU)); for (let i = 0; i < 5; i++) { octx.fillStyle = col(hue + i * 40); drawStar(octx, x + rnd(-1, 1) * S * 0.1, y + rnd(-1, 1) * S * 0.1, S * 0.02, rnd(0, TAU)); } }
      else if (th.stamp === 'heart') drawHeart(octx, x, y, S * 0.06);
      else {
        for (let i = 0; i < 9; i++) { const a = rnd(0, TAU), d = rnd(0, S * 0.06); octx.beginPath(); octx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, S * rnd(0.02, 0.05), 0, TAU); octx.fill(); }
        octx.fillStyle = col((hue + 180) % 360); drawStar(octx, x, y, S * 0.04, rnd(0, TAU));
      }
      octx.shadowBlur = 0;
      audio.note(Math.floor((x / W) * 8)); buzz(10);
    },
    drag(x, y) {
      if (!last) { last = { x, y }; return; }
      hue = (hue + 4) % 360; const c = col(hue);
      if (th.trail === 'stars') {
        acc += Math.hypot(x - last.x, y - last.y); last = { x, y };
        if (acc > S * 0.045) { acc = 0; octx.fillStyle = c; drawStar(octx, x, y, S * 0.025, rnd(0, TAU)); }
      } else {
        glowOn(c); octx.strokeStyle = c; octx.lineWidth = S * (th.chalk ? 0.03 : 0.045); octx.globalAlpha = th.chalk ? 0.85 : 1;
        octx.beginPath(); octx.moveTo(last.x, last.y); octx.lineTo(x, y); octx.stroke(); last = { x, y };
        octx.globalAlpha = 1; octx.shadowBlur = 0;
      }
      if (t - lastTw > 0.15) { audio.twinkle(); lastTw = t; }
    },
    update(dt) {
      t += dt;
      if (octx && (t % 0.25) < dt) { octx.globalCompositeOperation = 'destination-out'; octx.fillStyle = 'rgba(0,0,0,0.03)'; octx.fillRect(0, 0, W, H); octx.globalCompositeOperation = 'source-over'; }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      if (th.chalk) { ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = S * 0.03; ctx.strokeRect(0, 0, W, H); }
      if (off) ctx.drawImage(off, 0, 0, W, H);
    },
  };
}

// 11) House with windows: tap = the nearest window opens and an animal waves hello.
const HOUSE = {
  house: { bg: ['#ffd9b3', '#fff1e0'], wall: '#fff6d6', roof: '#ff7a59', roofKind: 'tri', shutter: '#4cc9f0', frame: '#8b5a2b', ground: '#9be38a', sun: '#ffd43b', group: 'all' },
  barn: { bg: ['#cfefff', '#fffbe8'], wall: '#d9483b', roof: '#7a3b2e', roofKind: 'tri', shutter: '#fff6e0', frame: '#ffffff', ground: '#9be38a', sun: '#ffd43b', group: 'farm' },
  castle: { bg: ['#d6ccff', '#fff0fa'], wall: '#d8d2e6', roof: '#b388ff', roofKind: 'castle', shutter: '#ff8fab', frame: '#8a7fa0', ground: '#9be38a', sun: '#fff3b0', group: 'wild' },
  tree: { bg: ['#c9f0ff', '#effbff'], wall: '#c68642', roof: '#3fae5a', roofKind: 'leaves', shutter: '#ffd43b', frame: '#7a4a1e', ground: '#9be38a', sun: '#ffd43b', group: 'small' },
  igloo: { bg: ['#bfe3ff', '#eef7ff'], wall: '#f4fbff', roof: '#ffffff', roofKind: 'dome', shutter: '#4cc9f0', frame: '#9fc4dd', ground: '#ffffff', sun: '#fff3b0', group: 'cold' },
};
function houseScene(audio, th = HOUSE.house) {
  let W = 1, H = 1, S = 1, t = 0;
  const wins = [], parts = makeParticles(), bag = bagFor(th.group);
  let hx = 0, hy = 0, hw = 0, hh = 0;
  function layout() {
    const land = W > H, cols = land ? 3 : 2, rows = land ? 2 : 3;
    hw = land ? Math.min(W * 0.7, H * 1.1) : W * 0.84; hh = land ? H * 0.58 : H * 0.6; hx = (W - hw) / 2; hy = H * 0.92 - hh;
    wins.length = 0;
    const ww = hw / cols * 0.62, wh = hh / rows * 0.62;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) wins.push({ x: hx + (c + 0.5) * hw / cols - ww / 2, y: hy + (r + 0.45) * hh / rows - wh / 2, w: ww, h: wh, kind: null, open: 0, timer: 0 });
  }
  function roof(ctx) {
    const k = th.roofKind; ctx.fillStyle = th.roof;
    if (k === 'tri') { ctx.beginPath(); ctx.moveTo(hx - hw * 0.08, hy); ctx.lineTo(hx + hw / 2, hy - hh * 0.38); ctx.lineTo(hx + hw * 1.08, hy); ctx.closePath(); ctx.fill(); }
    else if (k === 'castle') {
      const tw = hw * 0.16, th2 = hh * 0.3;
      for (const x of [hx - tw * 0.6, hx + hw - tw * 0.4]) {
        ctx.fillStyle = th.wall; ctx.fillRect(x, hy - th2, tw, hh + th2);
        ctx.fillStyle = th.roof; ctx.beginPath(); ctx.moveTo(x - tw * 0.15, hy - th2); ctx.lineTo(x + tw / 2, hy - th2 - tw * 1.3); ctx.lineTo(x + tw * 1.15, hy - th2); ctx.fill();
        ctx.fillStyle = '#ff5d73'; ctx.beginPath(); ctx.moveTo(x + tw / 2, hy - th2 - tw * 1.3); ctx.lineTo(x + tw / 2 + tw * 0.5, hy - th2 - tw * 1.15 + Math.sin(t * 4) * 3); ctx.lineTo(x + tw / 2, hy - th2 - tw); ctx.fill();
      }
      ctx.fillStyle = th.wall; const n = 7, bw = hw / (n * 2 - 1); for (let i = 0; i < n; i++) ctx.fillRect(hx + i * 2 * bw, hy - bw, bw, bw + 1);
    } else if (k === 'leaves') {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(hx + hw * 0.4, hy + hh * 0.5, hw * 0.2, H - hy - hh * 0.5);
      for (const [dx, dy, r] of [[0.1, -0.05, 0.3], [0.5, -0.18, 0.38], [0.9, -0.05, 0.3], [0.3, -0.2, 0.28], [0.72, -0.2, 0.28]]) { ctx.fillStyle = dy < -0.15 ? '#58c26a' : th.roof; ctx.beginPath(); ctx.arc(hx + hw * dx, hy + hh * dy, hw * r * 0.5, 0, TAU); ctx.fill(); }
    } else { // dome
      ctx.beginPath(); ctx.ellipse(hx + hw / 2, hy, hw / 2, hh * 0.4, 0, Math.PI, TAU); ctx.fill();
      ctx.strokeStyle = '#cfe3f2'; ctx.lineWidth = 2; for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.ellipse(hx + hw / 2, hy, hw / 2, hh * 0.4 * i / 3, 0, Math.PI, TAU); ctx.stroke(); }
    }
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { for (const w of wins) { w.kind = null; w.open = 0; w.timer = 0; } },
    tap(x, y) {
      let best = wins[0], bd = Infinity; for (const w of wins) { const d = Math.hypot(x - (w.x + w.w / 2), y - (w.y + w.h / 2)); if (d < bd) { bd = d; best = w; } }
      if (!best.kind || best.timer <= 0) best.kind = bag.next();
      best.timer = 3.2; sayAnimal(audio, best.kind); audio.rustle(); buzz(15);
      parts.burst(best.x + best.w / 2, best.y + best.h / 2, 10, S * 0.014, ['#ffd43b', '#ffffff', '#ff8fab'], 200);
    },
    drag() {},
    update(dt) {
      t += dt; parts.update(dt, 300);
      for (const w of wins) { w.timer -= dt; w.open += ((w.timer > 0 ? 1 : 0) - w.open) * Math.min(1, dt * 8); }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      ctx.fillStyle = th.sun; ctx.beginPath(); ctx.arc(W * 0.12, H * 0.12, S * 0.07, 0, TAU); ctx.fill();
      ctx.fillStyle = th.ground; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      roof(ctx);
      ctx.fillStyle = th.wall; ctx.fillRect(hx, hy, hw, hh);
      if (th.roofKind === 'dome') { ctx.strokeStyle = '#cfe3f2'; ctx.lineWidth = 2; for (let y = hy + hh / 3; y < hy + hh; y += hh / 3) { ctx.beginPath(); ctx.moveTo(hx, y); ctx.lineTo(hx + hw, y); ctx.stroke(); } }
      if (th.roofKind === 'tri' && th.wall === '#d9483b') { ctx.strokeStyle = '#fff'; ctx.lineWidth = S * 0.01; ctx.strokeRect(hx, hy, hw, hh); }
      for (const w of wins) {
        ctx.fillStyle = '#ffe8a3'; ctx.fillRect(w.x, w.y, w.w, w.h);
        if (w.kind && w.open > 0.05) {
          ctx.save(); ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.clip();
          drawAnimal(ctx, w.kind, w.x + w.w / 2, w.y + w.h * (1.15 - 0.6 * w.open) + Math.sin(t * 6) * 2, Math.min(w.w, w.h) * 0.36, t);
          ctx.restore();
        }
        const sw = (w.w / 2) * (1 - w.open);
        ctx.fillStyle = th.shutter; ctx.fillRect(w.x, w.y, sw, w.h); ctx.fillRect(w.x + w.w - sw, w.y, sw, w.h);
        ctx.strokeStyle = th.frame; ctx.lineWidth = Math.max(3, S * 0.008); ctx.strokeRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#c0f0a0'; ctx.fillRect(w.x - w.w * 0.05, w.y + w.h, w.w * 1.1, w.h * 0.08);
      }
      parts.draw(ctx);
    },
  };
}

export function moreScenes(audio) {
  return [
    ...variants(audio, 'xylo', xyloScene, XYLO), ...variants(audio, 'fireworks', fireworkScene, FIRE), ...variants(audio, 'fish', fishScene, FISH),
    ...variants(audio, 'train', trainScene, TRAIN), ...variants(audio, 'shapes', shapeScene, SHAPE_T), ...variants(audio, 'fruit', fruitScene, FRUIT_T),
    ...variants(audio, 'paint', paintScene, PAINT), ...variants(audio, 'house', houseScene, HOUSE),
  ];
}
