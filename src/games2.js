// More scenes (same contract as scenes.js: resize, enter, tap, drag, update, draw; a tap ANYWHERE does something).
import { drawAnimal, drawStar } from './art.js';
import { TAU, rnd, pick, COLORS, buzz, makeParticles, makeBag, animalBag, sayAnimal, rrect } from './fx.js';

const sky = (ctx, W, H, a, b) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
const smiley = (ctx, x, y, r) => {
  ctx.fillStyle = '#2b2020'; for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(x + k * r * 0.3, y - r * 0.1, r * 0.1, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#2b2020'; ctx.lineWidth = r * 0.08; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y + r * 0.05, r * 0.28, 0.3, Math.PI - 0.3); ctx.stroke();
};

// 4) Xylophone: 8 colored bars; tap = note + bounce, slide across = glissando.
function xyloScene(audio) {
  let W = 1, H = 1, S = 1, t = 0, lastBar = -1;
  const bars = [...Array(8)].map((_, i) => ({ i, x: 0, y: 0, w: 0, h: 0, hit: 0 })), notes = [], parts = makeParticles();
  function layout() {
    const land = W > H;
    for (const b of bars) {
      if (land) { b.w = W * 0.09; b.h = H * (0.72 - b.i * 0.045); b.x = W * (0.07 + b.i * 0.11); b.y = H * 0.52 - b.h / 2; }
      else { b.h = H * 0.08; b.w = W * (0.9 - b.i * 0.05); b.x = (W - b.w) / 2; b.y = H * (0.1 + b.i * 0.105); }
    }
  }
  function barAt(x, y) {
    let best = bars[0], bd = Infinity;
    for (const b of bars) { const d = Math.hypot(x - (b.x + b.w / 2), y - (b.y + b.h / 2)) - (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h ? 1e6 : 0); if (d < bd) { bd = d; best = b; } }
    return best;
  }
  function hit(b, x, y) {
    b.hit = 1; lastBar = b.i; audio.note(b.i); buzz(10);
    parts.burst(x, y, 8, S * 0.014, [COLORS[b.i], '#fff'], 180);
    notes.push({ x, y, age: 0, c: COLORS[b.i] }); if (notes.length > 20) notes.shift();
  }
  return {
    name: 'xylo',
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { notes.length = 0; lastBar = -1; },
    tap(x, y) { hit(barAt(x, y), x, y); },
    drag(x, y) { const b = barAt(x, y); if (b.i !== lastBar) hit(b, x, y); },
    update(dt) { t += dt; parts.update(dt, 200); for (const b of bars) b.hit = Math.max(0, b.hit - dt * 4); for (const n of notes) { n.age += dt; n.y -= dt * S * 0.15; } },
    draw(ctx) {
      sky(ctx, W, H, '#fff4d6', '#ffd6e0');
      for (const b of bars) {
        const k = 1 - Math.sin(b.hit * Math.PI) * 0.08, w = b.w * k, h = b.h * k, x = b.x + (b.w - w) / 2, y = b.y + (b.h - h) / 2;
        ctx.fillStyle = 'rgba(0,0,0,.12)'; rrect(ctx, x + 4, y + 6, w, h, S * 0.03); ctx.fill();
        ctx.fillStyle = COLORS[b.i]; rrect(ctx, x, y, w, h, S * 0.03); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; rrect(ctx, x + w * 0.12, y + h * 0.08, w * 0.25, h * 0.84, S * 0.02); ctx.fill();
        const land = W > H, r = Math.min(w, h) * 0.12;
        ctx.fillStyle = '#e9e2d0'; for (const f of [0.12, 0.88]) { ctx.beginPath(); ctx.arc(land ? x + w / 2 : x + w * f, land ? y + h * f : y + h / 2, r, 0, TAU); ctx.fill(); }
        if (b.hit > 0.3) smiley(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.35);
      }
      for (const n of notes) { ctx.globalAlpha = Math.max(0, 1 - n.age / 1.5); ctx.fillStyle = n.c; ctx.font = `bold ${Math.round(S * 0.08)}px system-ui`; ctx.fillText('♪', n.x, n.y); }
      ctx.globalAlpha = 1; parts.draw(ctx);
    },
  };
}

// 5) Fireworks at night: tap launches a rocket to that spot -> big colorful burst. Auto-launch when idle.
function fireworkScene(audio) {
  let W = 1, H = 1, S = 1, t = 0, idle = 0;
  const rockets = [], parts = makeParticles(), stars = [], city = [];
  function launch(x, y) { rockets.push({ x, y: H, tx: x, ty: Math.min(y, H * 0.75), c: pick(COLORS) }); audio.whoosh(); }
  return {
    name: 'fireworks',
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
          parts.burst(r.tx, r.ty, 45, S * 0.022, [r.c, pick(COLORS), '#ffffff'], S * 0.6);
          audio.pop(); audio.chime(Math.random() * 8 | 0);
        }
      }
    },
    draw(ctx) {
      sky(ctx, W, H, '#14193a', '#3b2f6b');
      for (const s of stars) { ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2 + s.ph); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
      for (const r of rockets) { ctx.fillStyle = r.c; ctx.beginPath(); ctx.arc(r.x, r.y, S * 0.012, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,240,180,.5)'; ctx.fillRect(r.x - 1.5, r.y, 3, S * 0.06); }
      parts.draw(ctx);
      for (const b of city) {
        ctx.fillStyle = '#241f45'; ctx.fillRect(b.x, H - b.h, b.w, b.h);
        ctx.fillStyle = '#ffd96a'; for (let y = H - b.h + 10; y < H - 10; y += 18) for (let x = b.x + 8; x < b.x + b.w - 8; x += 16) if ((x * 7 + y * 3 + b.win * 100) % 5 < 2) ctx.fillRect(x, y, 6, 8);
      }
    },
  };
}

// 6) Fish tank: tap = ripple + the nearest fish swims there; tap ON a fish = it spins and blows bubbles.
function fishScene(audio) {
  let W = 1, H = 1, S = 1, t = 0;
  const fish = [], ripples = [], bubbles = makeParticles();
  function add() { fish.push({ x: rnd(0.1, 0.9) * W, y: rnd(0.2, 0.75) * H, tx: rnd(0.1, 0.9) * W, ty: rnd(0.2, 0.75) * H, c: pick(COLORS), s: S * rnd(0.06, 0.09), dir: 1, spin: 0, wait: rnd(0, 2) }); }
  return {
    name: 'fish',
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { fish.length = 0; for (let i = 0; i < 6; i++) add(); },
    tap(x, y) {
      ripples.push({ x, y, age: 0 });
      let best = fish[0], bd = Infinity; for (const f of fish) { const d = Math.hypot(x - f.x, y - f.y); if (d < bd) { bd = d; best = f; } }
      if (bd < best.s * 1.6) { best.spin = 1; bubbles.burst(best.x, best.y - best.s * 0.5, 10, S * 0.012, ['#ffffff', '#cdeffd'], 80); audio.pop(); audio.say('Con cá', 300); buzz(15); }
      else { best.tx = x; best.ty = Math.max(H * 0.12, Math.min(H * 0.82, y)); best.wait = 0; audio.twinkle(); }
    },
    drag(x, y) { if (Math.random() < 0.15) bubbles.burst(x, y, 1, S * 0.012, ['#ffffff'], 30); },
    update(dt) {
      t += dt; bubbles.update(dt, -120);
      for (const r of ripples) r.age += dt; while (ripples.length && ripples[0].age > 1) ripples.shift();
      for (const f of fish) {
        f.spin = Math.max(0, f.spin - dt * 1.5);
        const dx = f.tx - f.x, dy = f.ty - f.y, d = Math.hypot(dx, dy);
        if (d > 5) { const v = Math.min(d, S * 0.25 * dt * (f.wait === 0 ? 2 : 1)); f.x += (dx / d) * v; f.y += (dy / d) * v; if (Math.abs(dx) > 2) f.dir = Math.sign(dx); }
        else if ((f.wait -= dt) < -2) { f.tx = rnd(0.1, 0.9) * W; f.ty = rnd(0.2, 0.75) * H; f.wait = 1; }
        if (Math.random() < dt * 0.3) bubbles.burst(f.x + f.dir * f.s, f.y, 1, S * 0.008, ['#ffffff'], 20);
      }
    },
    draw(ctx) {
      sky(ctx, W, H, '#7fd8f5', '#1f7fb8');
      ctx.fillStyle = '#f3dca2'; ctx.beginPath(); ctx.moveTo(0, H * 0.9); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.9 + Math.sin(x * 0.03) * 6); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = S * 0.02; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const bx = W * (0.08 + i * 0.17); ctx.beginPath(); ctx.moveTo(bx, H * 0.93); for (let k = 1; k <= 6; k++) ctx.lineTo(bx + Math.sin(t * 1.5 + k + i) * S * 0.02, H * 0.93 - k * S * 0.045); ctx.stroke(); }
      for (const r of ripples) { ctx.globalAlpha = 1 - r.age; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, S * 0.03 + r.age * S * 0.12, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
      for (const f of fish) {
        ctx.save(); ctx.translate(f.x, f.y + Math.sin(t * 3 + f.s) * 3); ctx.rotate(f.spin * TAU); ctx.scale(f.dir, 1);
        const s = f.s, wag = Math.sin(t * 10) * s * 0.15;
        ctx.fillStyle = f.c; ctx.beginPath(); ctx.moveTo(-s * 0.8, 0); ctx.lineTo(-s * 1.5, -s * 0.55 + wag); ctx.lineTo(-s * 1.5, s * 0.55 + wag); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-s * 0.1, s * 0.25, s * 0.6, s * 0.25, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 0.45, -s * 0.15, s * 0.22, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2b2020'; ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.15, s * 0.12, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#2b2020'; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.arc(s * 0.6, s * 0.15, s * 0.15, 0.2, 1.8); ctx.stroke();
        ctx.restore();
      }
      bubbles.draw(ctx);
    },
  };
}

// 7) Animal train: a train loops across; each wagon carries an animal. Tap a wagon = it jumps and talks; tap elsewhere = toot.
function trainScene(audio) {
  let W = 1, H = 1, S = 1, t = 0, head = 0, loop = -1;
  const cars = [...Array(4)].map(() => ({ kind: null, jump: 0, c: pick(COLORS) })), smoke = makeParticles();
  const cw = () => S * 0.3, gap = () => cw() * 1.12, len = () => gap() * 5;
  const carX = (i) => head - (i + 1) * gap();
  return {
    name: 'train',
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { head = W * 0.6; loop = -1; cars.forEach((c) => (c.kind = animalBag.next())); },
    tap(x, y) {
      let bi = -1, bd = Infinity; cars.forEach((c, i) => { const d = Math.abs(x - (carX(i) + cw() / 2)); if (d < bd) { bd = d; bi = i; } });
      if (bi >= 0 && bd < cw() * 0.8) { const c = cars[bi]; c.jump = 1; sayAnimal(audio, c.kind, 50); buzz(15); }
      else { audio.toot(); smoke.burst(head - cw() * 0.3, H * 0.72 - S * 0.32, 8, S * 0.04, ['#ffffff', '#e8e8f0'], 60); }
    },
    drag() {},
    update(dt) {
      t += dt; smoke.update(dt, -40);
      head += dt * S * 0.16;
      if (head - len() > W) { head = 0; cars.forEach((c) => { c.kind = animalBag.next(); c.c = pick(COLORS); }); audio.toot(); }
      for (const c of cars) c.jump = Math.max(0, c.jump - dt * 1.6);
      if (Math.random() < dt * 3) smoke.burst(head - cw() * 0.3, H * 0.72 - S * 0.3, 1, S * 0.035, ['#ffffff', '#eeeeee'], 30);
    },
    draw(ctx) {
      sky(ctx, W, H, '#bde6ff', '#e8f7ff');
      ctx.fillStyle = '#a6e3a0'; ctx.beginPath(); ctx.ellipse(W * 0.25, H * 0.75, W * 0.4, H * 0.25, 0, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(W * 0.8, H * 0.76, W * 0.35, H * 0.2, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#8fd17f'; ctx.fillRect(0, H * 0.74, W, H * 0.26);
      const ry = H * 0.72;
      ctx.fillStyle = '#a0522d'; for (let x = (-t * S * 0.16) % 30; x < W; x += 30) ctx.fillRect(x, ry + S * 0.03, 14, S * 0.02);
      ctx.fillStyle = '#6b6b7a'; ctx.fillRect(0, ry + S * 0.025, W, S * 0.01);
      const w = cw(), wheel = (x) => { ctx.fillStyle = '#3b3b48'; ctx.beginPath(); ctx.arc(x, ry, S * 0.035, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; const a = head / (S * 0.035); ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + Math.cos(a) * S * 0.03, ry + Math.sin(a) * S * 0.03); ctx.stroke(); };
      cars.forEach((c, i) => {
        const x = carX(i); if (x > W || x + w < 0) return;
        const j = Math.sin(c.jump * Math.PI) * S * 0.12;
        drawAnimal(ctx, c.kind, x + w / 2, ry - S * 0.17 - j, S * 0.085, t);
        ctx.fillStyle = c.c; rrect(ctx, x, ry - S * 0.14, w, S * 0.12, S * 0.02); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + w * 0.1, ry - S * 0.12, w * 0.8, S * 0.02);
        wheel(x + w * 0.22); wheel(x + w * 0.78);
      });
      const ex = head - w; // engine
      ctx.fillStyle = '#ff5d73'; rrect(ctx, ex, ry - S * 0.2, w, S * 0.18, S * 0.02); ctx.fill();
      ctx.fillStyle = '#3a86ff'; rrect(ctx, ex, ry - S * 0.32, w * 0.45, S * 0.14, S * 0.02); ctx.fill();
      ctx.fillStyle = '#bde0fe'; ctx.fillRect(ex + w * 0.08, ry - S * 0.29, w * 0.28, S * 0.07);
      ctx.fillStyle = '#333'; ctx.fillRect(ex + w * 0.65, ry - S * 0.3, w * 0.14, S * 0.1);
      smiley(ctx, ex + w * 0.8, ry - S * 0.11, S * 0.06);
      wheel(ex + w * 0.25); wheel(ex + w * 0.75);
      smoke.draw(ctx);
    },
  };
}

// 8) Shapes with faces bounce around; tap one = squish + its name; tap empty space = a new shape appears there.
const SHAPES = { circle: 'Hình tròn', square: 'Hình vuông', triangle: 'Hình tam giác', star: 'Ngôi sao', heart: 'Trái tim' };
function drawShape(ctx, type, x, y, r) {
  ctx.beginPath();
  if (type === 'circle') ctx.arc(x, y, r, 0, TAU);
  else if (type === 'square') rrect(ctx, x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, r * 0.25);
  else if (type === 'triangle') { ctx.moveTo(x, y - r * 1.05); ctx.lineTo(x + r * 1.05, y + r * 0.8); ctx.lineTo(x - r * 1.05, y + r * 0.8); ctx.closePath(); }
  else if (type === 'heart') { ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.1, x - r * 0.6, y - r * 1.3, x, y - r * 0.45); ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.1, x, y + r * 0.9); }
  if (type === 'star') drawStar(ctx, x, y, r * 1.15, -Math.PI / 2); else ctx.fill();
}
function shapeScene(audio) {
  let W = 1, H = 1, S = 1, t = 0;
  const list = [], parts = makeParticles(), bag = makeBag(Object.keys(SHAPES));
  function add(x, y) {
    const a = rnd(0, TAU), v = S * rnd(0.08, 0.15);
    list.push({ type: bag.next(), x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: S * rnd(0.08, 0.11), c: pick(COLORS), sq: 0, rot: 0 });
    if (list.length > 7) list.shift();
  }
  return {
    name: 'shapes',
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { list.length = 0; for (let i = 0; i < 4; i++) add(rnd(0.2, 0.8) * W, rnd(0.2, 0.8) * H); },
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
      sky(ctx, W, H, '#fdf0ff', '#d9f2ff');
      for (const s of list) {
        const k = Math.sin(s.sq * Math.PI) * 0.25;
        ctx.save(); ctx.translate(s.x, s.y); ctx.scale(1 + k, 1 - k);
        ctx.fillStyle = 'rgba(0,0,0,.1)'; drawShape(ctx, s.type, 4, 6, s.r);
        ctx.fillStyle = s.c; drawShape(ctx, s.type, 0, 0, s.r);
        smiley(ctx, 0, s.type === 'triangle' ? s.r * 0.2 : 0, s.r * 0.75);
        ctx.restore();
      }
      parts.draw(ctx);
    },
  };
}

// 9) Fruit tree: tap = the nearest fruit drops into the basket and is named; it grows back.
const FRUITS = { apple: ['Quả táo', '#ff4d4d'], orange: ['Quả cam', '#ff9f1c'], banana: ['Quả chuối', '#ffe14d'], straw: ['Quả dâu', '#ff3b6b'], grape: ['Chùm nho', '#9b5de5'], pear: ['Quả lê', '#b5e655'], mango: ['Quả xoài', '#ffc93c'] };
function drawFruit(ctx, type, x, y, r) {
  const c = FRUITS[type][1]; ctx.fillStyle = c;
  if (type === 'banana') { ctx.strokeStyle = c; ctx.lineWidth = r * 0.7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y - r * 0.6, r * 1.1, 0.5, Math.PI - 0.5); ctx.stroke(); }
  else if (type === 'grape') { for (const [dx, dy] of [[-0.4, -0.4], [0.4, -0.4], [0, -0.45], [-0.2, 0.1], [0.2, 0.1], [0, 0.6]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, r * 0.42, 0, TAU); ctx.fill(); } }
  else if (type === 'pear') { ctx.beginPath(); ctx.arc(x, y + r * 0.25, r * 0.85, 0, TAU); ctx.arc(x, y - r * 0.45, r * 0.55, 0, TAU); ctx.fill(); }
  else if (type === 'straw') { ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.5); ctx.quadraticCurveTo(x, y - r * 0.9, x + r, y - r * 0.5); ctx.quadraticCurveTo(x + r * 0.8, y + r * 0.6, x, y + r); ctx.quadraticCurveTo(x - r * 0.8, y + r * 0.6, x - r, y - r * 0.5); ctx.fill(); ctx.fillStyle = '#fff3b0'; for (const [dx, dy] of [[-0.4, -0.2], [0.3, -0.25], [0, 0.2], [-0.2, 0.5], [0.35, 0.3]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, r * 0.07, 0, TAU); ctx.fill(); } }
  else { ctx.beginPath(); if (type === 'mango') ctx.ellipse(x, y, r * 1.1, r * 0.85, 0.4, 0, TAU); else ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#3fae5a'; ctx.beginPath(); ctx.ellipse(x + r * 0.25, y - r * 1.0, r * 0.3, r * 0.14, -0.5, 0, TAU); ctx.fill();
  if (type !== 'banana' && type !== 'grape') smiley(ctx, x, y + r * 0.1, r * 0.6);
}
function fruitScene(audio) {
  let W = 1, H = 1, S = 1, t = 0, shake = 0;
  const slots = [], falling = [], basket = [], parts = makeParticles(), bag = makeBag(Object.keys(FRUITS));
  let cx = 0, cy = 0, cr = 0, bx = 0, by = 0;
  function layout() {
    cx = W / 2; cy = H * 0.36; cr = Math.min(W * 0.4, H * 0.3); bx = W > H ? W * 0.82 : W / 2; by = H * 0.88;
    const pts = [[-0.5, -0.3], [0, -0.55], [0.5, -0.3], [-0.6, 0.2], [0, 0.05], [0.6, 0.2], [-0.25, 0.45], [0.3, 0.45]];
    slots.length = 0; for (const [dx, dy] of pts) slots.push({ x: cx + dx * cr, y: cy + dy * cr, type: bag.next(), grow: 1 });
  }
  return {
    name: 'fruit',
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { basket.length = 0; falling.length = 0; for (const s of slots) { s.type = bag.next(); s.grow = 1; } },
    tap(x, y) {
      let best = null, bd = Infinity; for (const s of slots) if (s.grow >= 1) { const d = Math.hypot(x - s.x, y - s.y); if (d < bd) { bd = d; best = s; } }
      if (!best) { shake = 1; audio.rustle(); parts.burst(cx, cy, 10, S * 0.02, ['#58c26a', '#3fae5a'], 200); return; }
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
      sky(ctx, W, H, '#c9ecff', '#f0fbff');
      ctx.fillStyle = '#9be38a'; ctx.fillRect(0, H * 0.8, W, H * 0.2);
      const sx = Math.sin(t * 40) * shake * S * 0.01;
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(cx - cr * 0.12, cy, cr * 0.24, H * 0.82 - cy);
      ctx.fillStyle = '#3fae5a'; for (const [dx, dy, r] of [[-0.5, 0, 0.6], [0.5, 0, 0.6], [0, -0.35, 0.65], [0, 0.2, 0.6]]) { ctx.beginPath(); ctx.arc(cx + dx * cr + sx, cy + dy * cr, r * cr, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#58c26a'; for (const [dx, dy, r] of [[-0.45, -0.05, 0.5], [0.45, -0.05, 0.5], [0, -0.38, 0.55]]) { ctx.beginPath(); ctx.arc(cx + dx * cr + sx, cy + dy * cr, r * cr, 0, TAU); ctx.fill(); }
      const fr = S * 0.05;
      for (const s of slots) if (s.grow > 0) drawFruit(ctx, s.type, s.x + sx, s.y, fr * Math.min(1, s.grow));
      // basket: fruits peek out of the top
      basket.forEach((ty, i) => drawFruit(ctx, ty, bx + (i - (basket.length - 1) / 2) * fr * 1.2, by - S * 0.08 - (i % 2) * fr * 0.5, fr * 0.9));
      ctx.fillStyle = '#c68642'; rrect(ctx, bx - S * 0.2, by - S * 0.08, S * 0.4, S * 0.13, S * 0.03); ctx.fill();
      ctx.strokeStyle = '#a0662a'; ctx.lineWidth = 3; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(bx - S * 0.2 + i * S * 0.08, by - S * 0.08); ctx.lineTo(bx - S * 0.2 + i * S * 0.08, by + S * 0.05); ctx.stroke(); }
      for (const f of falling) drawFruit(ctx, f.type, f.x, f.y, fr);
      parts.draw(ctx);
    },
  };
}

// 10) Finger paint: drag paints a rainbow line, tap = paint splat + star stamp. Paint slowly fades.
function paintScene(audio) {
  let W = 1, H = 1, S = 1, t = 0, hue = 0, last = null, lastTw = 0, off = null, octx = null;
  return {
    name: 'paint',
    resize(w, h) {
      W = w; H = h; S = Math.min(w, h);
      const k = Math.min(2, devicePixelRatio || 1); off = document.createElement('canvas'); off.width = w * k; off.height = h * k;
      octx = off.getContext('2d'); octx.setTransform(k, 0, 0, k, 0, 0); octx.lineCap = 'round'; octx.lineJoin = 'round';
    },
    enter() { octx?.clearRect(0, 0, W, H); last = null; },
    tap(x, y) {
      hue = (hue + 47) % 360; last = { x, y };
      octx.fillStyle = `hsl(${hue},90%,62%)`;
      for (let i = 0; i < 9; i++) { const a = rnd(0, TAU), d = rnd(0, S * 0.06); octx.beginPath(); octx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, S * rnd(0.02, 0.05), 0, TAU); octx.fill(); }
      octx.fillStyle = `hsl(${(hue + 180) % 360},90%,70%)`; drawStar(octx, x, y, S * 0.04, rnd(0, TAU));
      audio.note(Math.floor((x / W) * 8)); buzz(10);
    },
    drag(x, y) {
      if (!last) { last = { x, y }; return; }
      hue = (hue + 4) % 360;
      octx.strokeStyle = `hsl(${hue},90%,60%)`; octx.lineWidth = S * 0.045;
      octx.beginPath(); octx.moveTo(last.x, last.y); octx.lineTo(x, y); octx.stroke(); last = { x, y };
      if (t - lastTw > 0.15) { audio.twinkle(); lastTw = t; }
    },
    update(dt) {
      t += dt;
      if (octx && (t % 0.25) < dt) { octx.globalCompositeOperation = 'destination-out'; octx.fillStyle = 'rgba(0,0,0,0.03)'; octx.fillRect(0, 0, W, H); octx.globalCompositeOperation = 'source-over'; }
    },
    draw(ctx) {
      sky(ctx, W, H, '#ffffff', '#fff8e7');
      if (off) ctx.drawImage(off, 0, 0, W, H);
    },
  };
}

// 11) House with windows: tap = the nearest window opens and an animal waves hello.
function houseScene(audio) {
  let W = 1, H = 1, S = 1, t = 0;
  const wins = [], parts = makeParticles();
  let hx = 0, hy = 0, hw = 0, hh = 0;
  function layout() {
    const land = W > H, cols = land ? 3 : 2, rows = land ? 2 : 3;
    hw = land ? Math.min(W * 0.7, H * 1.1) : W * 0.84; hh = land ? H * 0.58 : H * 0.6; hx = (W - hw) / 2; hy = H * 0.92 - hh;
    wins.length = 0;
    const ww = hw / cols * 0.62, wh = hh / rows * 0.62;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) wins.push({ x: hx + (c + 0.5) * hw / cols - ww / 2, y: hy + (r + 0.45) * hh / rows - wh / 2, w: ww, h: wh, kind: null, open: 0, timer: 0 });
  }
  return {
    name: 'house',
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { for (const w of wins) { w.kind = null; w.open = 0; w.timer = 0; } },
    tap(x, y) {
      let best = wins[0], bd = Infinity; for (const w of wins) { const d = Math.hypot(x - (w.x + w.w / 2), y - (w.y + w.h / 2)); if (d < bd) { bd = d; best = w; } }
      if (!best.kind || best.timer <= 0) best.kind = animalBag.next();
      best.timer = 3.2; sayAnimal(audio, best.kind); audio.rustle(); buzz(15);
      parts.burst(best.x + best.w / 2, best.y + best.h / 2, 10, S * 0.014, ['#ffd43b', '#ffffff', '#ff8fab'], 200);
    },
    drag() {},
    update(dt) {
      t += dt; parts.update(dt, 300);
      for (const w of wins) { w.timer -= dt; w.open += ((w.timer > 0 ? 1 : 0) - w.open) * Math.min(1, dt * 8); }
    },
    draw(ctx) {
      sky(ctx, W, H, '#ffd9b3', '#fff1e0');
      ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(W * 0.12, H * 0.12, S * 0.07, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9be38a'; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      ctx.fillStyle = '#ff7a59'; ctx.beginPath(); ctx.moveTo(hx - hw * 0.08, hy); ctx.lineTo(hx + hw / 2, hy - hh * 0.38); ctx.lineTo(hx + hw * 1.08, hy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff6d6'; ctx.fillRect(hx, hy, hw, hh);
      for (const w of wins) {
        ctx.fillStyle = '#ffe8a3'; ctx.fillRect(w.x, w.y, w.w, w.h);
        if (w.kind && w.open > 0.05) {
          ctx.save(); ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.clip();
          drawAnimal(ctx, w.kind, w.x + w.w / 2, w.y + w.h * (1.15 - 0.6 * w.open) + Math.sin(t * 6) * 2, Math.min(w.w, w.h) * 0.36, t);
          ctx.restore();
        }
        const sw = (w.w / 2) * (1 - w.open);
        ctx.fillStyle = '#4cc9f0'; ctx.fillRect(w.x, w.y, sw, w.h); ctx.fillRect(w.x + w.w - sw, w.y, sw, w.h);
        ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = Math.max(3, S * 0.008); ctx.strokeRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#c0f0a0'; ctx.fillRect(w.x - w.w * 0.05, w.y + w.h, w.w * 1.1, w.h * 0.08);
      }
      parts.draw(ctx);
    },
  };
}

export function moreScenes(audio) {
  return [xyloScene(audio), fireworkScene(audio), fishScene(audio), trainScene(audio), shapeScene(audio), fruitScene(audio), paintScene(audio), houseScene(audio)];
}
