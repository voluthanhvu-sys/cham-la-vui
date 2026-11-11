// Scenes: each has resize(W,H), enter(), tap(x,y), drag(x,y), update(dt), draw(ctx).
// Rule for every scene: a tap ANYWHERE does something (no misses, no fail state).
// Each mechanic takes a theme -> 5 variants per mechanic (names "mech.theme"), see makeScenes.
import { drawAnimal, drawCover, drawStar, drawHeart, drawLeaf, drawFlake } from './art.js';
import { TAU, rnd, pick, COLORS, buzz, makeParticles, bagFor, sayAnimal } from './fx.js';
import { moreScenes } from './games2.js';

export const grad = (ctx, W, H, a, b) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
function faceOn(ctx, r) { // tiny smiley at (0,0)
  ctx.fillStyle = '#3b2f2f';
  ctx.beginPath(); ctx.arc(-r * 0.12, -r * 0.06, r * 0.05, 0, TAU); ctx.arc(r * 0.12, -r * 0.06, r * 0.05, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3b2f2f'; ctx.lineWidth = r * 0.04; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, r * 0.04, r * 0.13, 0.2, Math.PI - 0.2); ctx.stroke();
}

// 1) Tap -> an item grows (flower/star/heart/leaf/snowflake) + confetti; drag -> sparkle trail.
const BLOOM = {
  flowers: { item: 'flower', bg: (t) => { const h = (t * 6) % 360; return [`hsl(${h},85%,88%)`, `hsl(${(h + 60) % 360},85%,82%)`]; }, colors: COLORS },
  stars: { item: 'star', bg: () => ['#1b2a4a', '#4a3f88'], colors: ['#ffd43b', '#fff3b0', '#ffb627', '#ffffff'] },
  hearts: { item: 'heart', bg: () => ['#ffe3ec', '#ffc2d4'], colors: ['#ff5d73', '#ff8fab', '#e63980', '#b388ff'] },
  leaves: { item: 'leaf', bg: () => ['#fff1c9', '#ffd59e'], colors: ['#ff7a59', '#ffb627', '#e85d3a', '#7bd389', '#c97b2a'] },
  snow: { item: 'flake', bg: () => ['#3d5a99', '#9cc3f0'], colors: ['#ffffff', '#dff3ff', '#bde0fe'] },
};
function bloomScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, lastDrag = null, lastTw = 0;
  const items = [], parts = makeParticles(), spin = th.item === 'flower' || th.item === 'flake';
  function drawItem(ctx, f, r) {
    ctx.fillStyle = f.c;
    if (th.item === 'flower') {
      for (let i = 0; i < f.petals; i++) { const a = (i / f.petals) * TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.6, r * 0.38, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = f.c2; ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, TAU); ctx.fill();
    } else if (th.item === 'star') drawStar(ctx, 0, 0, r * 1.1, -Math.PI / 2);
    else if (th.item === 'heart') drawHeart(ctx, 0, 0, r);
    else if (th.item === 'leaf') drawLeaf(ctx, 0, 0, r * 1.1);
    else { ctx.strokeStyle = f.c; drawFlake(ctx, 0, 0, r * 1.1); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, TAU); ctx.fill(); }
    if (spin) ctx.rotate(-(f.rot + f.age * 0.3)); // face stays upright
    faceOn(ctx, r);
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { items.length = 0; },
    tap(x, y) {
      items.push({ x, y, c: pick(th.colors), c2: pick(COLORS), age: 0, petals: pick([5, 6, 8]), r: S * rnd(0.09, 0.13), rot: spin ? rnd(0, TAU) : rnd(-0.3, 0.3) });
      if (items.length > 12) items.shift();
      parts.burst(x, y, 16, S * 0.018, th.colors);
      const n = Math.floor((x / W) * 8);
      if (th.item === 'star' || th.item === 'flake') audio.chime(n); else audio.note(n);
      buzz(15); lastDrag = { x, y };
    },
    drag(x, y) {
      if (lastDrag && Math.hypot(x - lastDrag.x, y - lastDrag.y) < S * 0.03) return;
      lastDrag = { x, y };
      parts.burst(x, y, 3, S * 0.014, th.colors, 60);
      if (t - lastTw > 0.12) { audio.twinkle(); lastTw = t; }
    },
    update(dt) {
      t += dt; parts.update(dt, th.item === 'star' ? 0 : 120);
      for (let i = items.length - 1; i >= 0; i--) if ((items[i].age += dt) > 6) items.splice(i, 1);
    },
    draw(ctx) {
      const [a, b] = th.bg(t); grad(ctx, W, H, a, b);
      for (const f of items) {
        const grow = Math.min(1, f.age / 0.35), k = grow * (2 - grow), fade = f.age > 5 ? 6 - f.age : 1;
        const r = f.r * k * (1 + 0.05 * Math.sin(f.age * 4));
        ctx.globalAlpha = fade;
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(spin ? f.rot + f.age * 0.3 : f.rot * Math.cos(f.age * 2)); drawItem(ctx, f, r); ctx.restore();
      }
      ctx.globalAlpha = 1;
      parts.draw(ctx);
    },
  };
}

// 2) Peekaboo: 5 covers (bushes/snow/gift boxes/clouds/pots); tap anywhere -> the nearest one shows an animal that "talks".
const PEEK = {
  bushes: { cover: 'bush', sky: ['#8fd3ff', '#d6f1ff'], ground: '#9be38a', group: 'all', sun: '#ffd43b', fx: ['#7bd389', '#a7e8a0', '#ffd43b'] },
  snow: { cover: 'snow', sky: ['#b8d8f5', '#eef6ff'], ground: '#f4f8ff', group: 'cold', sun: '#fff3b0', fx: ['#ffffff', '#dff3ff', '#bde0fe'], flakes: true },
  gifts: { cover: 'box', sky: ['#ffe3ec', '#fff4e0'], ground: '#e9c29b', group: 'small', fx: COLORS, room: true },
  clouds: { cover: 'cloud', sky: ['#7cc4ff', '#ffd6e8'], ground: null, group: 'sky', sun: '#ffd43b', fx: ['#ffffff', '#ffd43b', '#ff8fab'] },
  pots: { cover: 'pot', sky: ['#bdf0c8', '#fdfbe3'], ground: '#b98a5e', group: 'farm', sun: '#ffd43b', fx: ['#ff8fab', '#ffd43b', '#7bd389'] },
};
const POTS = ['#d9693f', '#e07a52', '#c75b33', '#e88a5a', '#cf6a40'];
function peekScene(audio, th) {
  let W = 1, H = 1, t = 0, idle = 0;
  const bag = bagFor(th.group);
  const holes = [0, 1, 2, 3, 4].map((i) => ({ x: 0, y: 0, s: 1, kind: null, phase: 0, timer: 0, wig: 0, bounce: 0, c: th.cover === 'box' ? COLORS[i] : POTS[i] }));
  const parts = makeParticles();
  const POP = 0.35, HOLD = 2.8;
  // Landscape: a zigzag row (back row higher). Portrait: zigzag column. Drawn back-to-front (sorted by y).
  const PORT = [[0.28, 0.3], [0.72, 0.42], [0.28, 0.56], [0.72, 0.7], [0.3, 0.86]];
  function layout() {
    const land = W > H;
    holes.forEach((h, i) => {
      if (land) { h.x = W * (0.1 + 0.2 * i); h.y = H * (i % 2 ? 0.6 : 0.82); h.s = Math.min(W * 0.075, H * 0.15); }
      else { h.x = W * PORT[i][0]; h.y = H * PORT[i][1]; h.s = Math.min(W * 0.16, H * 0.075); }
    });
  }
  function show(h) {
    if (h.kind && h.phase > 0) { h.bounce = 1; h.timer = 0; } // already out: bounce + talk again
    else { h.kind = bag.next(); h.timer = 0; h.phase = 0.001; if (th.cover === 'box') audio.pop(); else audio.rustle(); }
    sayAnimal(audio, h.kind);
    parts.burst(h.x, h.y - h.s * 1.2, 10, h.s * 0.08, th.fx, 200);
    buzz(20);
  }
  return {
    resize(w, h) { W = w; H = h; layout(); },
    enter() { holes.forEach((h) => { h.kind = null; h.phase = 0; }); idle = 3; },
    tap(x, y) {
      idle = 0;
      let best = holes[0], bd = Infinity;
      for (const h of holes) { const d = Math.hypot(x - h.x, y - (h.y - h.s * 0.5)); if (d < bd) { bd = d; best = h; } }
      show(best);
    },
    drag() {},
    update(dt) {
      t += dt; idle += dt; parts.update(dt, 400);
      for (const h of holes) {
        h.wig = Math.max(0, h.wig - dt); h.bounce = Math.max(0, h.bounce - dt * 2.5);
        if (!h.kind) continue;
        h.timer += dt;
        if (h.timer < POP) h.phase = h.timer / POP;
        else if (h.timer < POP + HOLD) h.phase = 1;
        else if (h.timer < POP * 2 + HOLD) h.phase = 1 - (h.timer - POP - HOLD) / POP;
        else { h.kind = null; h.phase = 0; }
      }
      if (idle > 6) { idle = 3; const h = pick(holes.filter((q) => !q.kind)); if (h) { h.wig = 0.8; audio.rustle(); } }
    },
    draw(ctx) {
      const S = Math.min(W, H);
      grad(ctx, W, H, th.sky[0], th.sky[1]);
      if (th.room) { ctx.fillStyle = '#ffd1dc'; for (let x = 0; x < W; x += S * 0.12) ctx.fillRect(x, 0, S * 0.05, H * 0.2); } // wallpaper stripes
      else {
        if (th.sun) { ctx.fillStyle = th.sun; ctx.beginPath(); ctx.arc(W * 0.85, H * 0.1, S * 0.08, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        for (let i = 0; i < 3; i++) {
          const cx = ((t * 12 + i * W * 0.4) % (W + 200)) - 100, cy = H * (0.07 + i * 0.05), r = S * 0.04;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.arc(cx + r, cy - r * 0.4, r * 1.2, 0, TAU); ctx.arc(cx + r * 2.1, cy, r, 0, TAU); ctx.fill();
        }
      }
      if (th.ground) {
        ctx.fillStyle = th.ground; ctx.beginPath(); ctx.moveTo(0, H * 0.2);
        for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.2 + (th.room ? 0 : Math.sin(x * 0.02) * 10));
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      }
      if (th.flakes) { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 30; i++) { const fx = (i * 97.3 + Math.sin(t + i) * 20 + W) % W, fy = (i * 53.7 + t * 30) % H; ctx.beginPath(); ctx.arc(fx, fy, 2 + (i % 3), 0, TAU); ctx.fill(); } }
      for (const h of [...holes].sort((p, q) => p.y - q.y)) {
        const wig = Math.sin(t * 30) * h.wig * h.s * 0.06;
        if (h.kind) {
          const e = h.phase * (2 - h.phase), b = Math.sin(h.bounce * Math.PI) * h.s * 0.25;
          ctx.save(); ctx.beginPath(); ctx.rect(h.x - h.s * 3, h.y - h.s * 4, h.s * 6, h.s * 4.2); ctx.clip();
          drawAnimal(ctx, h.kind, h.x, h.y + h.s * 0.5 - e * h.s * 2.1 - b, h.s * 0.8, t);
          ctx.restore();
        }
        drawCover(ctx, th.cover, h.x + wig, h.y, h.s, h.c);
      }
      parts.draw(ctx);
    },
  };
}

// 3) Things float by (bubbles/balloons/lanterns up, leaves/snowflakes down); tap pops the nearest one. Some carry an animal.
const FLOAT = {
  water: { item: 'bubble', dir: -1, bg: ['#a0e7e5', '#3fa7d6'], colors: COLORS, group: 'water' },
  balloons: { item: 'balloon', dir: -1, bg: ['#7cc4ff', '#e0f4ff'], colors: COLORS, group: 'sky' },
  lanterns: { item: 'lantern', dir: -1, bg: ['#2b1f4f', '#ff9a6b'], colors: ['#ff5d3a', '#ffb627', '#ff7a59', '#ffd43b'], group: 'all' },
  leaves: { item: 'leaf', dir: 1, bg: ['#ffe9b8', '#ffc58a'], colors: ['#ff7a59', '#ffb627', '#e85d3a', '#7bd389'], group: 'wild' },
  snow: { item: 'flake', dir: 1, bg: ['#30467a', '#8fb4e8'], colors: ['#ffffff', '#dff3ff', '#bde0fe'], group: 'cold' },
};
function bubbleScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, spawn = 0;
  const bag = bagFor(th.group), items = [], faces = [], parts = makeParticles();
  function add(y) {
    const r = S * rnd(0.09, 0.14);
    items.push({ x: rnd(r, W - r), y: y ?? (th.dir < 0 ? H + r * 2 : -r * 2), r, v: rnd(45, 75) * (S / 600), ph: rnd(0, TAU), c: pick(th.colors), kind: Math.random() < 0.35 ? bag.next() : null });
  }
  function popSound() {
    if (th.item === 'bubble' || th.item === 'balloon') audio.pop();
    else if (th.item === 'leaf') { audio.rustle(); audio.note(Math.random() * 8 | 0); }
    else audio.chime(Math.random() * 8 | 0);
  }
  function drawItem(ctx, b, x) {
    const r = b.r;
    if (th.item === 'bubble') {
      if (b.kind) drawAnimal(ctx, b.kind, x, b.y + r * 0.08, r * 0.55, t);
      const rg = ctx.createRadialGradient(x - r * 0.35, b.y - r * 0.35, r * 0.1, x, b.y, r);
      rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(0.6, b.c + '22'); rg.addColorStop(1, b.c + 'aa');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, b.y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = Math.max(2, r * 0.05); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(x - r * 0.4, b.y - r * 0.45, r * 0.16, r * 0.09, -0.7, 0, TAU); ctx.fill();
      return;
    }
    if (th.item === 'balloon') {
      ctx.strokeStyle = 'rgba(80,80,80,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, b.y + r * 1.15);
      ctx.quadraticCurveTo(x + Math.sin(b.ph) * r * 0.3, b.y + r * 1.7, x, b.y + r * 2.3); ctx.stroke();
      ctx.fillStyle = b.c; ctx.beginPath(); ctx.ellipse(x, b.y, r * 0.9, r * 1.1, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, b.y + r * 1.05); ctx.lineTo(x - r * 0.12, b.y + r * 1.22); ctx.lineTo(x + r * 0.12, b.y + r * 1.22); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - r * 0.4, b.y - r * 0.5, r * 0.15, r * 0.25, -0.5, 0, TAU); ctx.fill();
    } else if (th.item === 'lantern') {
      ctx.fillStyle = 'rgba(255,200,120,.25)'; ctx.beginPath(); ctx.arc(x, b.y, r * 1.5, 0, TAU); ctx.fill();
      ctx.fillStyle = b.c; ctx.beginPath(); ctx.ellipse(x, b.y, r * 0.95, r * 1.05, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7a3b1f'; ctx.fillRect(x - r * 0.45, b.y - r * 1.15, r * 0.9, r * 0.2); ctx.fillRect(x - r * 0.45, b.y + r * 0.95, r * 0.9, r * 0.2);
      ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = r * 0.05;
      for (const k of [0.5, 0.02]) { ctx.beginPath(); ctx.ellipse(x, b.y, r * 0.95 * k, r * 1.05, 0, 0, TAU); ctx.stroke(); }
    } else if (th.item === 'leaf') { ctx.fillStyle = b.c; drawLeaf(ctx, x, b.y, r * 1.2, Math.sin(b.ph) * 0.6 + 0.4); }
    else { ctx.strokeStyle = b.c; drawFlake(ctx, x, b.y, r * 1.1, b.ph * 0.3); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x, b.y, r * 0.55, 0, TAU); ctx.fill(); }
    if (b.kind) drawAnimal(ctx, b.kind, x, b.y, r * 0.5, t);
    else { ctx.save(); ctx.translate(x, b.y); faceOn(ctx, r * 1.4); ctx.restore(); }
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { items.length = 0; faces.length = 0; for (let i = 0; i < 4; i++) add(rnd(H * 0.2, H * 0.8)); },
    tap(x, y) {
      let best = -1, bd = Infinity;
      items.forEach((b, i) => { const d = Math.hypot(x - b.x, y - b.y) / b.r; if (d < bd) { bd = d; best = i; } });
      if (best >= 0 && bd < 2.2) {
        const b = items.splice(best, 1)[0];
        parts.burst(b.x, b.y, 18, b.r * 0.12, [b.c, '#ffffff', ...th.colors], 300);
        popSound(); buzz(20);
        if (b.kind) { faces.push({ x: b.x, y: b.y, kind: b.kind, age: 0, s: b.r * 0.8 }); sayAnimal(audio, b.kind, 120); }
      } else { parts.burst(x, y, 8, S * 0.015, ['#ffffff', ...th.colors], 150); audio.twinkle(); }
    },
    drag() {},
    update(dt) {
      t += dt; parts.update(dt, 250);
      spawn -= dt;
      if (spawn <= 0 && items.length < 7) { add(); spawn = rnd(0.7, 1.3); }
      for (let i = items.length - 1; i >= 0; i--) {
        const b = items[i]; b.y += th.dir * b.v * dt; b.ph += dt * 1.5;
        if (th.dir > 0) b.x += Math.sin(b.ph) * dt * 25;
        if (b.y < -b.r * 3 || b.y > H + b.r * 3) items.splice(i, 1);
      }
      for (let i = faces.length - 1; i >= 0; i--) { const f = faces[i]; f.age += dt; f.y -= dt * 20; if (f.age > 2.5) faces.splice(i, 1); }
    },
    draw(ctx) {
      grad(ctx, W, H, th.bg[0], th.bg[1]);
      for (const b of items) drawItem(ctx, b, b.x + (th.dir < 0 ? Math.sin(b.ph) * b.r * 0.25 : 0));
      for (const f of faces) {
        const k = Math.min(1, f.age / 0.3), fade = f.age > 2 ? (2.5 - f.age) * 2 : 1;
        ctx.globalAlpha = Math.max(0, fade); drawAnimal(ctx, f.kind, f.x, f.y, f.s * (0.7 + 0.5 * k), t); ctx.globalAlpha = 1;
      }
      parts.draw(ctx);
    },
  };
}

// End of session: calm night, lullaby; taps only make soft twinkles.
function sleepScene(audio) {
  let W = 1, H = 1, S = 1, t = 0;
  const stars = [], tw = makeParticles();
  return {
    name: 'sleep',
    resize(w, h) { W = w; H = h; S = Math.min(w, h); stars.length = 0; for (let i = 0; i < 40; i++) stars.push({ x: Math.random() * w, y: Math.random() * h * 0.7, r: rnd(1, 3), ph: rnd(0, TAU) }); },
    enter() { audio.lullaby(); },
    tap(x, y) { tw.burst(x, y, 6, S * 0.012, ['#fff3b0', '#ffffff'], 80); audio.twinkle(); },
    drag() {},
    update(dt) { t += dt; tw.update(dt, 0); },
    draw(ctx) {
      grad(ctx, W, H, '#1b2a4a', '#3a3f78');
      for (const s of stars) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 1.5 + s.ph); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
      const mx = W / 2, my = H * 0.4, mr = S * 0.18;
      ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#8a7a3a'; ctx.lineWidth = mr * 0.05; ctx.lineCap = 'round';
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(mx + sx * mr * 0.35, my - mr * 0.05, mr * 0.14, 0.15, Math.PI - 0.15); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(mx, my + mr * 0.3, mr * 0.15, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = `bold ${Math.round(S * 0.06)}px system-ui`;
      for (let i = 0; i < 3; i++) { const a = (t * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - a; ctx.fillText('z', mx + mr * (0.9 + a * 0.8), my - mr * (0.6 + a * 1.2)); }
      ctx.globalAlpha = 1;
      tw.draw(ctx);
    },
  };
}

// One entry per variant: {name: 'mech.theme', make()}; main.js builds a scene the first time it is played.
export const variants = (audio, mech, factory, themes) => Object.entries(themes).map(([k, th]) => ({ name: `${mech}.${k}`, make: () => factory(audio, th) }));
export function makeScenes(audio) {
  const play = [
    ...variants(audio, 'bloom', bloomScene, BLOOM),
    ...variants(audio, 'peek', peekScene, PEEK),
    ...variants(audio, 'bubbles', bubbleScene, FLOAT),
    ...moreScenes(audio),
  ];
  return { play, sleep: sleepScene(audio) };
}
