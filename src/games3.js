// Nine more mechanics x 5 themes (same scene contract as scenes.js; a tap ANYWHERE does something).
import { ANIMALS, drawAnimal, drawStar, drawLeaf, drawFlake } from './art.js';
import { TAU, rnd, pick, COLORS, buzz, makeParticles, makeBag, bagFor, sayAnimal, rrect } from './fx.js';

const sky = (ctx, W, H, a, b) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
const smiley = (ctx, x, y, r) => {
  ctx.fillStyle = '#2b2020'; for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(x + k * r * 0.3, y - r * 0.1, r * 0.1, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#2b2020'; ctx.lineWidth = r * 0.08; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y + r * 0.05, r * 0.28, 0.3, Math.PI - 0.3); ctx.stroke();
};
const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
const variants = (audio, mech, factory, themes) => Object.entries(themes).map(([k, th]) => ({ name: `${mech}.${k}`, make: () => factory(audio, th) }));
// Nearest object to (x, y) -> [obj, distance].
function near(list, x, y, fx = (o) => o.x, fy = (o) => o.y) {
  let b = null, d = Infinity; for (const o of list) { const k = Math.hypot(x - fx(o), y - fy(o)); if (k < d) { d = k; b = o; } }
  return [b, d];
}
const nightStars = (ctx, W, H, t) => { ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.35 + 0.3 * Math.sin(t * 2 + i); ctx.fillRect((i * 137) % W, (i * 89) % (H * 0.7), 2, 2); } ctx.globalAlpha = 1; };
const snowfall = (ctx, W, H, t, S) => { ctx.fillStyle = '#fff'; for (let i = 0; i < 30; i++) circle(ctx, (i * 71 + Math.sin(t + i) * 10) % W, (i * 53 + t * S * 0.05) % H, 2 + (i % 3)); };

// 12) Eggs: tap an egg 3 times -> it cracks open and a baby animal pops out and talks; a new egg comes back.
const EGGS = {
  nest: { bg: ['#cdeeff', '#fff6dc'], ground: '#9be38a', nest: '#c68642', colors: ['#fff3e0', '#ffe9b3', '#e8f4ff'], group: 'sky' },
  farm: { bg: ['#ffe9c2', '#fffaf0'], ground: '#e8c872', nest: '#b5873f', colors: ['#ffffff', '#fff1d6'], group: 'farm' },
  snow: { bg: ['#cfe6ff', '#f5faff'], ground: '#ffffff', nest: '#9fc4dd', colors: ['#e8f4ff', '#ffffff', '#d6ecff'], group: 'cold', snow: true },
  pond: { bg: ['#b5f0d0', '#e8fff4'], ground: '#7fd18a', nest: '#6a9f5a', colors: ['#d6ffe0', '#fff9c4'], group: 'water' },
  rainbow: { bg: ['#ffe0f0', '#e0f0ff'], ground: '#b8f0a0', nest: '#ff8fab', colors: COLORS, dots: true, group: 'all' },
};
function eggScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0;
  const eggs = [], parts = makeParticles(), bag = bagFor(th.group);
  const reset = (e) => { e.cracks = 0; e.kind = null; e.out = 0; e.timer = 0; e.jump = 0; e.c = pick(th.colors); e.grow = 0; };
  function layout() {
    const n = W > H ? 4 : 3, r = Math.min(W / n * 0.28, H * 0.15); eggs.length = 0;
    for (let i = 0; i < n; i++) { const e = { x: W * (i + 0.5) / n, y: H * 0.64, r, wob: 0 }; reset(e); e.grow = 1; eggs.push(e); }
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { for (const e of eggs) { reset(e); e.grow = 1; } },
    tap(x, y) {
      const [e] = near(eggs, x, y); e.wob = 1; buzz(12);
      if (e.kind) { e.jump = 1; e.timer = Math.max(e.timer, 2); sayAnimal(audio, e.kind, 50); return; }
      if (e.grow < 1) { audio.twinkle(); return; }
      e.cracks++; audio.note(e.cracks * 2); parts.burst(e.x, e.y - e.r * 0.3, 5, S * 0.01, ['#ffffff', e.c], 120);
      if (e.cracks >= 3) { e.kind = bag.next(); e.timer = 4.5; audio.pop(); sayAnimal(audio, e.kind, 250); parts.burst(e.x, e.y - e.r, 18, S * 0.015, ['#ffffff', e.c, '#ffd43b'], 260); }
    },
    drag() {},
    update(dt) {
      t += dt; parts.update(dt, 400);
      for (const e of eggs) {
        e.wob = Math.max(0, e.wob - dt * 2.5); e.jump = Math.max(0, e.jump - dt * 2); if (e.grow < 1) e.grow = Math.min(1, e.grow + dt * 1.5);
        if (e.kind) { e.out = Math.min(1, e.out + dt * 3); if ((e.timer -= dt) <= 0) reset(e); }
      }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg); if (th.snow) snowfall(ctx, W, H, t, S);
      ctx.fillStyle = th.ground; ctx.fillRect(0, H * 0.72, W, H * 0.28);
      for (const e of eggs) {
        const R = e.r, r = R * (e.kind ? 1 : e.grow);
        ctx.fillStyle = th.nest; ctx.beginPath(); ctx.ellipse(e.x, e.y + R * 0.75, R * 1.25, R * 0.4, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(e.x, e.y);
        if (e.kind) {
          drawAnimal(ctx, e.kind, 0, -e.out * R * 0.75 - Math.sin(e.jump * Math.PI) * R * 0.5, R * 0.7, t);
          ctx.fillStyle = e.c; ctx.beginPath(); ctx.moveTo(-R * 0.78, R * 0.1);
          for (let k = 1; k <= 6; k++) ctx.lineTo(-R * 0.78 + k * R * 0.26, R * (k % 2 ? -0.12 : 0.1));
          ctx.ellipse(0, 0, R * 0.78, R, 0, 0, Math.PI); ctx.fill();
        } else {
          ctx.rotate(Math.sin(t * 30) * e.wob * 0.25 + Math.sin(t * 2 + e.x) * 0.04);
          ctx.fillStyle = e.c; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.78, r, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2; ctx.stroke();
          if (th.dots) { ctx.fillStyle = 'rgba(255,255,255,.75)'; for (const [dx, dy] of [[-0.3, -0.45], [0.3, -0.15], [-0.25, 0.35], [0.35, 0.5]]) circle(ctx, dx * r, dy * r, r * 0.1); }
          ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.12, r * 0.25, 0.3, 0, TAU); ctx.fill();
          if (e.cracks) {
            ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.1);
            for (let k = 1; k <= e.cracks * 2; k++) ctx.lineTo(-r * 0.7 + k * r * 0.23, -r * 0.1 + (k % 2 ? -1 : 1) * r * 0.12); ctx.stroke();
            smiley(ctx, 0, r * 0.35, r * 0.4);
          } else { ctx.strokeStyle = '#2b2020'; ctx.lineWidth = r * 0.04; for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(k * r * 0.22, r * 0.25, r * 0.09, 0.2, Math.PI - 0.2); ctx.stroke(); } }
        }
        ctx.restore();
        ctx.fillStyle = th.nest; ctx.beginPath(); ctx.ellipse(e.x, e.y + R * 0.82, R * 1.15, R * 0.3, 0, 0, Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(e.x + k * R * 0.35, e.y + R * 0.85); ctx.lineTo(e.x + k * R * 0.35 + R * 0.2, e.y + R * 1.02); ctx.stroke(); }
      }
      parts.draw(ctx);
    },
  };
}

// 13) Vehicles drive along a 2-lane road; tap one = honk/siren + its name; tap the road = a new vehicle drives in.
const VEH = {
  car: ['Xe ô tô', '#ff5d73'], bus: ['Xe buýt', '#ffb627'], taxi: ['Xe taxi', '#ffd43b'], fire: ['Xe cứu hỏa', '#e63946'], police: ['Xe cảnh sát', '#3a86ff'],
  ambulance: ['Xe cứu thương', '#ffffff'], tractor: ['Máy cày', '#7bd389'], truck: ['Xe tải', '#4cc9f0'], icecream: ['Xe kem', '#ff8fab'],
};
const SIREN = { fire: 1, police: 1, ambulance: 1 };
const ROADS = {
  city: { types: ['car', 'bus', 'taxi', 'truck'], bg: ['#bde6ff', '#eef8ff'], ground: '#8fd17f', road: '#6b6b7a' },
  rescue: { types: ['fire', 'police', 'ambulance'], bg: ['#ffe0d0', '#fff6ee'], ground: '#9be38a', road: '#5f5f6e' },
  farm: { types: ['tractor', 'truck', 'car'], bg: ['#ffe9b3', '#fff8e1'], ground: '#c9e27a', road: '#b08a5a' },
  night: { types: ['car', 'taxi', 'bus', 'police'], bg: ['#14193a', '#3b2f6b'], ground: '#24304a', road: '#3a3a48', night: true },
  treats: { types: ['icecream', 'bus', 'car'], bg: ['#ffe0f0', '#fff5fa'], ground: '#b8f0a0', road: '#8a7f9a' },
};
function drawVehicle(ctx, type, w, t, night) { // origin = ground under the middle, facing right
  const h = w * 0.42, c = VEH[type][1], wr = h * 0.24;
  const wheel = (x, r) => { ctx.fillStyle = '#2b2b38'; circle(ctx, x, -r, r); ctx.fillStyle = '#dddddd'; circle(ctx, x, -r, r * 0.45); };
  const win = '#d6f0ff';
  if (night) { ctx.fillStyle = 'rgba(255,243,176,.25)'; ctx.beginPath(); ctx.moveTo(w * 0.48, -h * 0.6); ctx.lineTo(w * 1.4, -h * 1.1); ctx.lineTo(w * 1.4, 0); ctx.fill(); }
  ctx.fillStyle = c;
  if (type === 'bus') {
    rrect(ctx, -w / 2, -h * 1.4, w, h * 1.15, h * 0.2); ctx.fill();
    ctx.fillStyle = win; for (let i = 0; i < 4; i++) { rrect(ctx, -w * 0.45 + i * w * 0.21, -h * 1.25, w * 0.16, h * 0.4, h * 0.08); ctx.fill(); }
    wheel(-w * 0.3, wr); wheel(w * 0.3, wr); smiley(ctx, w * 0.36, -h * 0.55, h * 0.3);
  } else if (type === 'truck') {
    rrect(ctx, -w / 2, -h * 1.35, w * 0.62, h * 1.1, h * 0.1); ctx.fill();
    ctx.fillStyle = '#ff7a59'; rrect(ctx, w * 0.14, -h * 1.0, w * 0.36, h * 0.75, h * 0.15); ctx.fill();
    ctx.fillStyle = win; rrect(ctx, w * 0.28, -h * 0.92, w * 0.16, h * 0.28, h * 0.06); ctx.fill();
    wheel(-w * 0.32, wr); wheel(-w * 0.05, wr); wheel(w * 0.33, wr); smiley(ctx, w * 0.34, -h * 0.45, h * 0.26);
  } else if (type === 'tractor') {
    rrect(ctx, -w * 0.12, -h * 0.95, w * 0.6, h * 0.5, h * 0.1); ctx.fill();
    rrect(ctx, -w * 0.4, -h * 1.55, w * 0.36, h * 0.85, h * 0.1); ctx.fill();
    ctx.fillStyle = win; rrect(ctx, -w * 0.34, -h * 1.45, w * 0.24, h * 0.4, h * 0.06); ctx.fill();
    ctx.fillStyle = '#555'; ctx.fillRect(w * 0.3, -h * 1.35, w * 0.05, h * 0.42);
    wheel(-w * 0.25, h * 0.48); wheel(w * 0.33, h * 0.27); smiley(ctx, w * 0.3, -h * 0.68, h * 0.24);
  } else {
    rrect(ctx, -w / 2, -h * 0.88, w, h * 0.6, h * 0.2); ctx.fill();
    rrect(ctx, -w * 0.3, -h * 1.3, w * 0.52, h * 0.55, h * 0.18); ctx.fill();
    if (type === 'ambulance') { ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; rrect(ctx, -w / 2, -h * 0.88, w, h * 0.6, h * 0.2); ctx.stroke(); rrect(ctx, -w * 0.3, -h * 1.3, w * 0.52, h * 0.55, h * 0.18); ctx.stroke(); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(-w * 0.27, -h * 0.66, w * 0.16, h * 0.08); ctx.fillRect(-w * 0.23, -h * 0.78, w * 0.08, h * 0.32); }
    ctx.fillStyle = win; rrect(ctx, -w * 0.24, -h * 1.22, w * 0.4, h * 0.32, h * 0.08); ctx.fill();
    if (type === 'taxi') { ctx.fillStyle = '#333'; rrect(ctx, -w * 0.1, -h * 1.48, w * 0.2, h * 0.18, h * 0.05); ctx.fill(); for (let i = 0; i < 8; i++) ctx.fillRect(-w * 0.45 + i * w * 0.11, -h * 0.58, w * 0.055, h * 0.07); }
    if (type === 'fire') { ctx.strokeStyle = '#eeeeee'; ctx.lineWidth = h * 0.06; ctx.beginPath(); ctx.moveTo(-w * 0.5, -h * 1.0); ctx.lineTo(w * 0.15, -h * 1.45); ctx.moveTo(-w * 0.5, -h * 1.12); ctx.lineTo(w * 0.15, -h * 1.57); ctx.stroke(); }
    if (SIREN[type]) { const on = (t * 6 | 0) % 2; ctx.fillStyle = on ? '#ff3b3b' : '#3a86ff'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = h * 0.4; circle(ctx, -w * 0.04, -h * 1.38, h * 0.12); ctx.shadowBlur = 0; }
    if (type === 'icecream') { ctx.fillStyle = '#e0a060'; ctx.beginPath(); ctx.moveTo(-w * 0.1, -h * 1.3); ctx.lineTo(w * 0.1, -h * 1.3); ctx.lineTo(0, -h * 1.0); ctx.fill(); ctx.fillStyle = '#fff0f5'; circle(ctx, -w * 0.04, -h * 1.42, h * 0.16); ctx.fillStyle = '#ff5d73'; circle(ctx, w * 0.06, -h * 1.5, h * 0.14); }
    wheel(-w * 0.3, wr); wheel(w * 0.3, wr); smiley(ctx, w * 0.36, -h * 0.58, h * 0.26);
  }
  ctx.fillStyle = '#fff3b0'; circle(ctx, w * 0.48, -h * 0.55, h * 0.07);
}
function carScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, spawnT = 0;
  const cars = [], parts = makeParticles(), bag = makeBag(th.types);
  const laneY = (l) => H * (l ? 0.9 : 0.72), cw = () => Math.min(S * 0.32, W * 0.3);
  function spawn(lane) {
    const type = bag.next(), dir = lane ? -1 : 1, w = cw() * (type === 'bus' || type === 'truck' ? 1.2 : 1);
    cars.push({ type, lane, dir, x: dir > 0 ? -w : W + w, w, v: S * rnd(0.17, 0.25), honk: 0 });
    if (cars.length > 6) cars.shift();
  }
  function honk(c) {
    c.honk = 1; buzz(15);
    if (SIREN[c.type]) { audio.note(5); audio.note(2, 0.25); audio.note(5, 0.5); } else audio.toot();
    audio.say(VEH[c.type][0], 700); parts.burst(c.x, laneY(c.lane) - c.w * 0.5, 10, S * 0.012, COLORS, 220);
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { cars.length = 0; spawn(0); cars[0].x = W * 0.3; spawn(1); cars[1].x = W * 0.7; },
    tap(x, y) {
      const [c, d] = near(cars, x, y, (o) => o.x, (o) => laneY(o.lane) - o.w * 0.25);
      if (c && d < c.w * 0.6) { honk(c); return; }
      spawn(Math.abs(y - laneY(1)) < Math.abs(y - laneY(0)) ? 1 : 0); audio.pop(); parts.burst(x, y, 6, S * 0.01, ['#fff3b0', '#ffffff'], 120);
    },
    drag() {},
    update(dt) {
      t += dt; parts.update(dt, 300); spawnT += dt;
      for (let i = cars.length - 1; i >= 0; i--) { const c = cars[i]; c.honk = Math.max(0, c.honk - dt * 2); c.x += c.dir * c.v * dt * (c.honk ? 0.4 : 1); if (c.x < -c.w * 2 || c.x > W + c.w * 2) cars.splice(i, 1); }
      if (spawnT > 1.8 && cars.length < 3) { spawnT = 0; spawn(Math.random() < 0.5 ? 1 : 0); }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      if (th.night) { nightStars(ctx, W, H, t); ctx.fillStyle = '#fff3b0'; circle(ctx, W * 0.85, H * 0.15, S * 0.05); }
      else { ctx.fillStyle = '#ffd43b'; circle(ctx, W * 0.1, H * 0.13, S * 0.06); }
      ctx.fillStyle = th.ground; ctx.fillRect(0, H * 0.55, W, H * 0.45);
      for (let i = 0; i < 6; i++) { const x = W * (0.08 + i * 0.18); ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - S * 0.01, H * 0.48, S * 0.02, H * 0.08); ctx.fillStyle = th.night ? '#2f4a3a' : '#3fae5a'; circle(ctx, x, H * 0.47, S * 0.05); }
      ctx.fillStyle = th.road; ctx.fillRect(0, H * 0.6, W, H * 0.34);
      ctx.fillStyle = '#ffffff'; for (let x = 0; x < W; x += S * 0.14) ctx.fillRect(x, H * 0.765, S * 0.07, S * 0.012);
      for (const l of [0, 1]) for (const c of cars) if (c.lane === l) {
        ctx.save(); ctx.translate(c.x, laneY(l) - Math.sin(c.honk * Math.PI) * c.w * 0.12); ctx.scale(c.dir, 1); drawVehicle(ctx, c.type, c.w, t, th.night); ctx.restore();
      }
      parts.draw(ctx);
    },
  };
}

// 14) Dance party: tap the drums = drum beat and all animals jump; tap an animal = it spins and talks. Drag across drums = drum roll.
const DANCE = {
  stage: { bg: ['#3b2f6b', '#14193a'], floor: '#8b5a2b', group: 'all', lights: true },
  jungle: { bg: ['#bff0c0', '#e8fff0'], floor: '#7fd18a', group: 'wild' },
  farm: { bg: ['#ffe9b3', '#fff8e1'], floor: '#c9e27a', group: 'farm' },
  disco: { bg: ['#1a1030', '#2e1a4a'], floor: '#2a2238', group: 'small', lights: true, disco: true },
  snow: { bg: ['#cfe6ff', '#f5faff'], floor: '#ffffff', group: 'cold', snow: true },
};
function danceScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, hits = 0, lastPad = -1;
  const crew = [], pads = [], parts = makeParticles(), bag = bagFor(th.group);
  function layout() {
    pads.length = 0; crew.length = 0;
    const r = Math.min(W / 10, H * 0.08), s = Math.min(W * 0.09, H * 0.12);
    for (let i = 0; i < 4; i++) pads.push({ i, x: W * (i + 0.5) / 4, y: H * 0.87, r, hit: 0, c: COLORS[i * 2] });
    for (let i = 0; i < 3; i++) crew.push({ x: W * (i + 1) / 4, y: H * 0.42, s, kind: bag.next(), jump: 0, spin: 0, pop: 0 });
  }
  function hitPad(p) {
    p.hit = 1; audio.drum(p.i * 2); hits++; lastPad = p.i; buzz(10);
    for (const c of crew) c.jump = 1;
    parts.burst(p.x, p.y - p.r, 8, S * 0.012, COLORS, 200);
    if (hits % 6 === 0) { const c = pick(crew); c.kind = bag.next(); c.pop = 1; sayAnimal(audio, c.kind, 300); }
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { hits = 0; for (const c of crew) c.kind = bag.next(); },
    tap(x, y) {
      const [c, d] = near(crew, x, y); if (d < c.s * 1.4) { c.spin = 1; sayAnimal(audio, c.kind, 50); buzz(15); return; }
      hitPad(near(pads, x, y)[0]);
    },
    drag(x, y) { const [p, d] = near(pads, x, y); if (d < p.r * 1.5 && p.i !== lastPad) hitPad(p); },
    update(dt) {
      t += dt; parts.update(dt, 300);
      for (const p of pads) p.hit = Math.max(0, p.hit - dt * 4);
      for (const c of crew) { c.jump = Math.max(0, c.jump - dt * 2.5); c.spin = Math.max(0, c.spin - dt * 1.5); c.pop = Math.max(0, c.pop - dt * 2); }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      if (th.snow) snowfall(ctx, W, H, t, S);
      if (th.lights) for (let k = 0; k < 4; k++) {
        const x0 = W * (k + 0.5) / 4, x1 = W / 2 + Math.sin(t * 0.8 + k * 1.7) * W * 0.35;
        ctx.fillStyle = `hsla(${(k * 90 + t * 40) % 360},90%,70%,.16)`; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1 - S * 0.12, H * 0.66); ctx.lineTo(x1 + S * 0.12, H * 0.66); ctx.fill();
      }
      if (th.disco) {
        ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H * 0.06); ctx.stroke();
        ctx.fillStyle = '#d9d9e8'; circle(ctx, W / 2, H * 0.1, S * 0.05);
        for (let i = 0; i < 8; i++) { ctx.fillStyle = `hsl(${(i * 45 + t * 90) % 360},90%,75%)`; ctx.fillRect(W / 2 - S * 0.04 + (i % 4) * S * 0.02, H * 0.1 - S * 0.03 + (i / 4 | 0) * S * 0.03, S * 0.015, S * 0.015); }
      }
      ctx.fillStyle = th.floor; ctx.fillRect(0, H * 0.66, W, H * 0.34);
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(0, H * 0.66, W, S * 0.015);
      crew.forEach((c, k) => {
        const j = Math.sin(c.jump * Math.PI) * c.s * 0.8, sway = Math.sin(t * 4 + k) * c.s * 0.12, a = ANIMALS[c.kind];
        ctx.save(); ctx.translate(c.x + sway, c.y - j); const sc = 1 + Math.sin(c.pop * Math.PI) * 0.3; ctx.scale(sc, sc);
        ctx.fillStyle = a.c; ctx.strokeStyle = a.d; ctx.lineWidth = c.s * 0.06;
        ctx.beginPath(); ctx.ellipse(0, c.s * 1.45, c.s * 0.6, c.s * 0.7, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.lineCap = 'round'; ctx.lineWidth = c.s * 0.2; const up = c.jump > 0.1 ? -1 : 0.3;
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * c.s * 0.5, c.s * 1.2); ctx.lineTo(sx * c.s * 1.0, c.s * (1.2 + up * 0.6) + Math.sin(t * 8 + sx) * c.s * 0.1); ctx.stroke(); }
        ctx.fillStyle = a.d; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * c.s * 0.3, c.s * 2.1, c.s * 0.25, c.s * 0.13, 0, 0, TAU); ctx.fill(); }
        ctx.rotate(c.spin * TAU + Math.sin(t * 4 + k) * 0.12); drawAnimal(ctx, c.kind, 0, 0, c.s, t);
        ctx.restore();
      });
      for (const p of pads) {
        const r = p.r * (1 - p.hit * 0.08), top = p.y - r * 0.45;
        ctx.fillStyle = p.c; ctx.fillRect(p.x - r, top, r * 2, r * 1.1); ctx.beginPath(); ctx.ellipse(p.x, top + r * 1.1, r, r * 0.32, 0, 0, Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = r * 0.06; ctx.beginPath(); for (let k = 0; k <= 6; k++) ctx.lineTo(p.x - r + (k / 6) * r * 2, top + r * (k % 2 ? 0.95 : 0.35)); ctx.stroke();
        ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.ellipse(p.x, top, r, r * 0.32, 0, 0, TAU); ctx.fill();
        if (p.hit > 0.2) smiley(ctx, p.x, top, r * 0.5);
      }
      parts.draw(ctx);
    },
  };
}

// 15) Bath time: animals sit in a tub; tap = foam bubbles, drag = foam trail, tap an animal = splash + name, tap the duck = squeak.
const BATH = {
  tub: { bg: ['#d6f0ff', '#eef8ff'], tiles: '#bfe3f5', tub: '#ffffff', water: '#8fd8ff', foam: ['#ffffff', '#f0f8ff'], group: 'small' },
  pink: { bg: ['#ffe0ef', '#fff5fa'], tiles: '#ffc9df', tub: '#ffffff', water: '#ffb3d1', foam: ['#ffffff', '#ffe0f0'], group: 'farm' },
  rainbow: { bg: ['#fff6d6', '#f0e6ff'], tiles: '#ffe0a0', tub: '#b388ff', water: '#c9f0ff', foam: ['#ffd6e0', '#d6f0ff', '#fff3b0', '#d9ffd6', '#ead6ff'], group: 'all' },
  pool: { bg: ['#8fd0ff', '#e3f5ff'], tub: '#4cc9f0', water: '#4cb4e8', foam: ['#ffffff', '#e0f7ff'], group: 'water', grass: true },
  spring: { bg: ['#cfe0f0', '#f5faff'], tub: '#9f9a8a', water: '#a8e6e0', foam: ['#ffffff', '#f0fff8'], group: 'cold', snow: true },
};
function bathScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, lastF = { x: -1e9, y: 0 }, lastTw = 0;
  const foam = [], kids = [], parts = makeParticles(), bag = bagFor(th.group), duck = { x: 0, dir: 1, jump: 0 };
  let tx0 = 0, tx1 = 0, tb = 0, surf = 0;
  function layout() {
    tx0 = W * 0.08; tx1 = W * 0.92; tb = H * 0.9; surf = H * 0.58; kids.length = 0;
    const s = Math.min(W * 0.1, H * 0.13); for (const fx of [0.33, 0.67]) kids.push({ x: W * fx, y: surf, s, kind: bag.next(), bob: 0 });
  }
  function addFoam(x, y, n) {
    for (let i = 0; i < n; i++) foam.push({ x: x + rnd(-1, 1) * S * 0.05, y: y + rnd(-1, 1) * S * 0.04, r: S * rnd(0.025, 0.05), life: 0, max: rnd(4, 7), c: pick(th.foam) });
    if (foam.length > 140) foam.splice(0, foam.length - 140);
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { foam.length = 0; duck.x = W / 2; for (const k of kids) k.kind = bag.next(); },
    tap(x, y) {
      const [k, d] = near(kids, x, y, (o) => o.x, (o) => surf - o.s * 0.75);
      if (d < k.s * 1.2) { k.bob = 1; parts.burst(k.x, surf, 16, S * 0.012, [th.water, '#ffffff'], 300); sayAnimal(audio, k.kind, 50); buzz(15); return; }
      if (Math.hypot(x - duck.x, y - surf) < S * 0.08) { duck.jump = 1; audio.animal('squeak'); audio.say('Con vịt', 500); buzz(15); return; }
      addFoam(x, y, 7); audio.pop(); buzz(8);
    },
    drag(x, y) { if (Math.hypot(x - lastF.x, y - lastF.y) > S * 0.04) { addFoam(x, y, 2); lastF = { x, y }; if (t - lastTw > 0.2) { audio.twinkle(); lastTw = t; } } },
    update(dt) {
      t += dt; parts.update(dt, 500);
      for (let i = foam.length - 1; i >= 0; i--) { const f = foam[i]; f.life += dt; f.y -= dt * S * 0.01; if (f.life > f.max) { foam.splice(i, 1); parts.burst(f.x, f.y, 2, f.r * 0.3, ['#ffffff'], 60); } }
      duck.x += duck.dir * S * 0.07 * dt; if (duck.x > tx1 - S * 0.1) duck.dir = -1; if (duck.x < tx0 + S * 0.1) duck.dir = 1; duck.jump = Math.max(0, duck.jump - dt * 2);
      for (const k of kids) k.bob = Math.max(0, k.bob - dt * 2);
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      if (th.tiles) { ctx.strokeStyle = th.tiles; ctx.lineWidth = 2; const g = S * 0.09; for (let x = 0; x < W; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
      if (th.grass) { ctx.fillStyle = '#9be38a'; ctx.fillRect(0, H * 0.5, W, H * 0.5); ctx.fillStyle = '#ffd43b'; circle(ctx, W * 0.1, H * 0.12, S * 0.06); }
      if (th.snow) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, H * 0.5, W, H * 0.5); snowfall(ctx, W, H, t, S); }
      ctx.fillStyle = th.water; ctx.beginPath(); ctx.ellipse((tx0 + tx1) / 2, surf, (tx1 - tx0) / 2 - S * 0.02, S * 0.06, 0, 0, TAU); ctx.fill();
      for (const k of kids) drawAnimal(ctx, k.kind, k.x, surf - k.s * 0.75 - Math.sin(k.bob * Math.PI) * k.s * 0.5 + Math.sin(t * 2 + k.x) * 3, k.s, t);
      ctx.save(); ctx.translate(duck.x, surf - Math.sin(duck.jump * Math.PI) * S * 0.08 + Math.sin(t * 3) * 2); ctx.scale(duck.dir, 1);
      const ds = S * 0.045; ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.ellipse(0, -ds * 0.3, ds * 1.1, ds * 0.65, 0, 0, TAU); ctx.fill(); circle(ctx, ds * 0.6, -ds * 1.05, ds * 0.5);
      ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.ellipse(ds * 1.15, -ds * 0.95, ds * 0.3, ds * 0.14, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2b2020'; circle(ctx, ds * 0.75, -ds * 1.15, ds * 0.09);
      ctx.restore();
      ctx.fillStyle = th.tub; rrect(ctx, tx0, surf, tx1 - tx0, tb - surf, S * 0.08); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(tx0 + S * 0.04, surf, tx1 - tx0 - S * 0.08, S * 0.015);
      if (th.tub === '#9f9a8a') { ctx.fillStyle = '#8a8576'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(tx0 + (i + 0.5) * (tx1 - tx0) / 9, surf + S * 0.03, S * 0.06, S * 0.035, 0, 0, TAU); ctx.fill(); } }
      else { ctx.fillStyle = '#c9c9d6'; for (const fx of [0.12, 0.88]) { rrect(ctx, tx0 + (tx1 - tx0) * fx - S * 0.03, tb - S * 0.02, S * 0.06, S * 0.06, S * 0.02); ctx.fill(); } }
      for (const f of foam) { ctx.globalAlpha = Math.min(1, (f.max - f.life) * 1.5, f.life * 4); ctx.fillStyle = f.c; circle(ctx, f.x, f.y, f.r); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(ctx, f.x - f.r * 0.35, f.y - f.r * 0.35, f.r * 0.25); }
      ctx.globalAlpha = 1; parts.draw(ctx);
    },
  };
}

// 16) Sky divers: animals float down under parachutes/balloons/umbrellas; tap one = it bounces up and talks; tap the sky = a new one drops in.
const CHUTE = {
  chute: { kind: 'chute', bg: ['#8fd0ff', '#e3f5ff'], ground: '#9be38a', group: 'all' },
  balloons: { kind: 'balloons', bg: ['#ffe0b8', '#fff6e8'], ground: '#b8f0a0', group: 'small' },
  umbrella: { kind: 'umbrella', bg: ['#9fb4c8', '#dfe8f0'], ground: '#7fbf7a', group: 'farm', rain: true },
  leaf: { kind: 'leaf', bg: ['#ffd9a0', '#fff1d6'], ground: '#d9a05a', group: 'small' },
  snow: { kind: 'flake', bg: ['#cfe6ff', '#f5faff'], ground: '#ffffff', group: 'cold', snow: true },
};
function chuteScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, spawnT = 0;
  const divers = [], parts = makeParticles(), bag = bagFor(th.group);
  const gy = () => H * 0.88;
  function spawn(x, y) { divers.push({ kind: bag.next(), x: x ?? rnd(0.15, 0.85) * W, y: y ?? -S * 0.1, vy: S * 0.09, ph: rnd(0, TAU), c: pick(COLORS), c2: pick(COLORS), land: 0, jump: 0, s: S * 0.07 }); }
  function canopy(ctx, d) {
    const s = d.s, R = s * 1.8, cy = -s * 2.7, by = cy + R * 0.3;
    ctx.strokeStyle = 'rgba(80,60,40,.6)'; ctx.lineWidth = 1.5;
    if (th.kind === 'balloons') {
      const bs = [[-R * 0.5, cy, d.c], [R * 0.5, cy, d.c2], [0, cy - R * 0.45, COLORS[(COLORS.indexOf(d.c) + 3) % 8]]];
      for (const [x, y] of bs) { ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.lineTo(x, y + R * 0.4); ctx.stroke(); }
      for (const [x, y, c] of bs) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, R * 0.38, R * 0.45, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.4)'; circle(ctx, x - R * 0.12, y - R * 0.15, R * 0.09); }
      return;
    }
    if (th.kind === 'umbrella') {
      ctx.strokeStyle = '#6b4423'; ctx.lineWidth = s * 0.08; ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(0, -s * 0.7); ctx.arc(s * 0.15, -s * 0.7, s * 0.15, Math.PI, 0, true); ctx.stroke();
      ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(0, by, R, Math.PI, 0); for (let k = 0; k < 4; k++) ctx.arc(R * (0.75 - k * 0.5), by, R / 4, 0, Math.PI, true); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(0, by - R); ctx.quadraticCurveTo(-R * 0.3, by - R * 0.5, -R * 0.25, by); ctx.lineTo(R * 0.25, by); ctx.quadraticCurveTo(R * 0.3, by - R * 0.5, 0, by - R); ctx.fill();
      return;
    }
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * s * 0.6, -s * 0.4); ctx.lineTo(k * R * 0.95, by); ctx.stroke(); }
    if (th.kind === 'leaf') { ctx.fillStyle = d.c === '#4cc9f0' ? '#ff9f1c' : ['#ff9f1c', '#ff7a59', '#ffb627', '#e63946'][d.ph * 2 % 4 | 0]; drawLeaf(ctx, 0, by - R * 0.25, R * 1.05, Math.PI / 2); return; }
    if (th.kind === 'flake') { ctx.strokeStyle = '#ffffff'; ctx.shadowColor = '#7fb8e0'; ctx.shadowBlur = 6; drawFlake(ctx, 0, by - R * 0.4, R * 0.95, t * 0.4 + d.ph); ctx.shadowBlur = 0; return; }
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : d.c; ctx.beginPath(); ctx.moveTo(0, by); ctx.ellipse(0, by, R, R * 0.85, 0, Math.PI + k * Math.PI / 4, Math.PI + (k + 1) * Math.PI / 4); ctx.closePath(); ctx.fill(); }
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { divers.length = 0; spawn(W * 0.3, H * 0.3); spawn(W * 0.7, H * 0.5); spawnT = 0; },
    tap(x, y) {
      const [d, dist] = near(divers, x, y, (o) => o.x, (o) => o.y - o.s);
      if (d && dist < S * 0.2) { d.jump = 1; if (!d.land) d.vy = -S * 0.25; sayAnimal(audio, d.kind, 50); parts.burst(d.x, d.y - d.s * 2, 10, S * 0.012, COLORS, 200); buzz(15); return; }
      if (divers.length < 7) spawn(x, -S * 0.05); audio.whoosh(); parts.burst(x, y, 6, S * 0.01, ['#fff3b0', '#ffffff'], 120);
    },
    drag() {},
    update(dt) {
      t += dt; parts.update(dt, 300); spawnT += dt;
      if (spawnT > 3 && divers.filter((d) => !d.land).length < 3) { spawnT = 0; spawn(); }
      for (let i = divers.length - 1; i >= 0; i--) {
        const d = divers[i]; d.jump = Math.max(0, d.jump - dt * 2);
        if (!d.land) {
          d.vy += (S * 0.09 - d.vy) * dt * 1.5; d.y += d.vy * dt; d.x += Math.sin(t * 1.2 + d.ph) * S * 0.04 * dt;
          if (d.y >= gy() - d.s) { d.y = gy() - d.s; d.land = 0.001; audio.note(Math.random() * 8 | 0); parts.burst(d.x, gy(), 8, S * 0.01, [th.ground, '#ffffff'], 120); }
        } else { d.land += dt; if (d.land > 1.5) d.x += (d.x < W / 2 ? -1 : 1) * S * 0.25 * dt; if (d.x < -S * 0.3 || d.x > W + S * 0.3) divers.splice(i, 1); }
      }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 4; i++) { const x = ((i * 0.31 + t * 0.008) % 1.2 - 0.1) * W, y = H * (0.1 + (i % 2) * 0.12); for (const [dx, r] of [[-1, 0.035], [0, 0.05], [1, 0.035]]) circle(ctx, x + dx * S * 0.05, y, S * r); }
      if (th.snow) snowfall(ctx, W, H, t, S);
      if (th.rain) { ctx.strokeStyle = 'rgba(70,110,170,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 50; i++) { const x = (i * 97) % W, y = (i * 61 + t * H * 0.9) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + S * 0.03); ctx.stroke(); } }
      ctx.fillStyle = th.ground; ctx.beginPath(); ctx.ellipse(W * 0.5, H * 1.15, W * 0.9, H * 0.28, 0, 0, TAU); ctx.fill();
      for (const d of divers) {
        const j = Math.sin(d.jump * Math.PI) * d.s * 0.6;
        if (d.land < 0.6) { ctx.save(); ctx.globalAlpha = d.land ? 1 - d.land / 0.6 : 1; ctx.translate(d.x, d.y - j); ctx.rotate(Math.sin(t * 1.2 + d.ph) * 0.12); canopy(ctx, d); ctx.restore(); }
        drawAnimal(ctx, d.kind, d.x, d.y - j - (d.land > 1.5 ? Math.abs(Math.sin(t * 10)) * d.s * 0.3 : 0), d.s, t);
      }
      parts.draw(ctx);
    },
  };
}

// 17) Connect the dots: every tap draws the next line; the finished shape fills with color, smiles and says its name.
const DOT_SHAPES = {
  star: () => [...Array(10)].map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.42 : 1; return [Math.cos(a) * r, Math.sin(a) * r]; }),
  heart: () => [...Array(12)].map((_, i) => { const u = i / 12 * TAU; return [16 * Math.sin(u) ** 3 / 17, -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) / 17 - 0.1]; }),
  circle: () => [...Array(10)].map((_, i) => { const a = -Math.PI / 2 + i * TAU / 10; return [Math.cos(a) * 0.9, Math.sin(a) * 0.9]; }),
  tri: () => [[0, -0.95], [0.47, -0.1], [0.95, 0.75], [0, 0.75], [-0.95, 0.75], [-0.47, -0.1]],
  square: () => [[-0.8, -0.8], [0, -0.8], [0.8, -0.8], [0.8, 0], [0.8, 0.8], [0, 0.8], [-0.8, 0.8], [-0.8, 0]],
  fish: () => [[1, 0], [0.55, -0.5], [-0.2, -0.55], [-0.65, 0], [-1.05, -0.5], [-1.05, 0.5], [-0.65, 0], [-0.2, 0.55], [0.55, 0.5]],
  house: () => [[0, -1], [0.85, -0.2], [0.7, -0.2], [0.7, 0.85], [-0.7, 0.85], [-0.7, -0.2], [-0.85, -0.2]],
};
const DOT_NAMES = { star: 'Ngôi sao', heart: 'Trái tim', circle: 'Hình tròn', tri: 'Hình tam giác', square: 'Hình vuông', fish: 'Con cá', house: 'Ngôi nhà' };
const DOTS = {
  stars: { bg: ['#14193a', '#3b2f6b'], line: '#fff3b0', dot: '#ffffff', shapes: ['star'], fills: ['#ffd43b', '#ffb627'], night: true },
  love: { bg: ['#ffe0ef', '#fff5fa'], line: '#ff5d73', dot: '#ff8fab', shapes: ['heart'], fills: ['#ff5d73', '#ff8fab'] },
  sea: { bg: ['#7fd8f5', '#1f7fb8'], line: '#ffffff', dot: '#fff3b0', shapes: ['fish', 'circle'], fills: ['#ffb627', '#ff7a59', '#7bd389'] },
  home: { bg: ['#ffe9c2', '#fffaf0'], line: '#8b5a2b', dot: '#ff7a59', shapes: ['house', 'square', 'tri'], fills: ['#ff7a59', '#4cc9f0', '#7bd389'] },
  shapes: { bg: ['#fdf0ff', '#d9f2ff'], line: '#6b5bd6', dot: '#b388ff', shapes: ['circle', 'tri', 'square', 'star', 'heart'], fills: COLORS },
};
function dotScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, idx = 0, done = 0, kind = 'star', fill = '#fff', cx = 0, cy = 0, R = 1;
  let pts = []; const segs = [], parts = makeParticles(), bag = makeBag(th.shapes);
  function place() { R = Math.min(W, H) * 0.33; cx = W / 2; cy = H * 0.52; pts = DOT_SHAPES[kind]().map(([x, y]) => ({ x: cx + x * R, y: cy + y * R })); segs.length = 0; for (let i = 1; i < Math.min(idx, pts.length); i++) segs.push({ a: pts[i - 1], b: pts[i], g: 1 }); }
  function newShape() { kind = bag.next(); fill = pick(th.fills); idx = 0; done = 0; place(); }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); place(); },
    enter() { newShape(); },
    tap(x, y) {
      if (done > 0) { parts.burst(x, y, 14, S * 0.014, COLORS, 260); audio.chime(Math.random() * 8 | 0); buzz(10); return; }
      const p = pts[idx]; parts.burst(p.x, p.y, 10, S * 0.012, [th.dot, '#ffffff'], 180); audio.note(idx); buzz(10);
      if (idx > 0) segs.push({ a: pts[idx - 1], b: p, g: 0 });
      if (++idx >= pts.length) { segs.push({ a: p, b: pts[0], g: 0 }); done = 0.001; audio.chime(2); audio.say(DOT_NAMES[kind], 500); parts.burst(cx, cy, 40, S * 0.02, COLORS, S * 0.6); }
    },
    drag(x, y) { if (!done && pts[idx] && Math.hypot(x - pts[idx].x, y - pts[idx].y) < S * 0.06) this.tap(x, y); },
    update(dt) {
      t += dt; parts.update(dt, 300);
      for (const s of segs) s.g = Math.min(1, s.g + dt * 4);
      if (done > 0) { done += dt; if (done > 3.5) newShape(); }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg); if (th.night) nightStars(ctx, W, H, t);
      if (done > 0.25) {
        const g = Math.min(1, (done - 0.25) * 2);
        ctx.globalAlpha = g; ctx.fillStyle = fill; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1; smiley(ctx, cx, cy + R * 0.1, R * 0.45 * g);
      }
      ctx.strokeStyle = th.line; ctx.lineWidth = S * 0.018; ctx.lineCap = 'round';
      for (const s of segs) { ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.a.x + (s.b.x - s.a.x) * s.g, s.a.y + (s.b.y - s.a.y) * s.g); ctx.stroke(); }
      pts.forEach((p, i) => {
        if (i === idx && !done) { const r = S * (0.035 + 0.012 * Math.sin(t * 6)); ctx.fillStyle = th.dot; ctx.globalAlpha = 0.3; circle(ctx, p.x, p.y, r * 1.8); ctx.globalAlpha = 1; circle(ctx, p.x, p.y, r); }
        else { ctx.fillStyle = i < idx ? th.line : th.dot; circle(ctx, p.x, p.y, S * 0.02); }
      });
      parts.draw(ctx);
    },
  };
}

// 18) Weather: tap the sky = a cloud (or sun) there that rains/snows; whatever lands makes plants (flowers, snowmen...) grow.
const WEATHER = {
  rain: { bg: ['#a8c4dc', '#e6f0f8'], ground: '#8fd17f', drop: 'rain', grow: 'flower' },
  snow: { bg: ['#cfe0f0', '#f5faff'], ground: '#ffffff', drop: 'snow', grow: 'snowman' },
  sun: { bg: ['#8fd0ff', '#fff6d6'], ground: '#9be38a', drop: 'sun', grow: 'sunflower' },
  night: { bg: ['#14193a', '#3b2f6b'], ground: '#24304a', drop: 'star', grow: 'mushroom', night: true },
  wind: { bg: ['#ffd9a0', '#fff1d6'], ground: '#d9a05a', drop: 'leaf', grow: 'pumpkin' },
};
function weatherScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, allT = 0;
  const clouds = [], drops = [], plants = [], parts = makeParticles();
  const gy = () => H * 0.8;
  function layout() { const n = Math.max(3, Math.floor(W / (S * 0.17))); plants.length = 0; for (let i = 0; i < n; i++) plants.push({ x: (i + 0.5) * W / n, g: 0, c: COLORS[i % 8], done: false }); }
  function addCloud(x, y) { const c = { x, y: Math.max(H * 0.14, Math.min(y, H * 0.4)), rain: 0, s: S * 0.09, puff: 1 }; clouds.push(c); if (clouds.length > 4) clouds.shift(); return c; }
  function drawPlant(ctx, p) {
    const g = p.g; if (g <= 0.03) return; const x = p.x, y = gy(), k = S * g;
    if (th.grow === 'snowman') { const r = k * 0.05; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#c9dcef'; ctx.lineWidth = 2; for (const [dy, rr] of [[r, r], [r * 2.6, r * 0.7]]) { ctx.beginPath(); ctx.arc(x, y - dy, rr, 0, TAU); ctx.fill(); ctx.stroke(); } if (g > 0.6) { smiley(ctx, x, y - r * 2.6, r * 0.6); ctx.fillStyle = '#ff7a59'; ctx.beginPath(); ctx.moveTo(x, y - r * 2.55); ctx.lineTo(x + r * 0.5, y - r * 2.45); ctx.lineTo(x, y - r * 2.4); ctx.fill(); ctx.fillStyle = '#ff5d73'; ctx.fillRect(x - r * 0.7, y - r * 2.05, r * 1.4, r * 0.25); } return; }
    if (th.grow === 'pumpkin') { const r = k * 0.05; ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.ellipse(x, y - r * 0.8, r * 1.2, r * 0.85, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#d96a00'; ctx.lineWidth = 2; for (const f of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(x + f * r * 0.6, y - r * 0.8, r * 0.35, r * 0.82, 0, 0, TAU); ctx.stroke(); } ctx.fillStyle = '#3fae5a'; ctx.fillRect(x - r * 0.08, y - r * 1.85, r * 0.16, r * 0.3); if (g > 0.6) smiley(ctx, x, y - r * 0.8, r * 0.6); return; }
    if (th.grow === 'mushroom') { const r = k * 0.045; ctx.fillStyle = '#f4ead8'; ctx.fillRect(x - r * 0.3, y - r * 1.2, r * 0.6, r * 1.2); ctx.shadowColor = p.c; ctx.shadowBlur = r; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(x, y - r * 1.1, r, Math.PI, 0); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.8)'; for (const f of [-0.5, 0, 0.5]) circle(ctx, x + f * r, y - r * 1.5 + Math.abs(f) * r * 0.3, r * 0.14); if (g > 0.6) smiley(ctx, x, y - r * 0.55, r * 0.45); return; }
    const sun = th.grow === 'sunflower', h = k * (sun ? 0.2 : 0.15), r = k * 0.028, hx = x, hy = y - h;
    ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = Math.max(2, k * 0.01); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = '#58c26a'; ctx.beginPath(); ctx.ellipse(x + r, y - h * 0.4, r * 0.9, r * 0.4, -0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = sun ? '#ffd43b' : p.c; for (let i = 0; i < (sun ? 10 : 5); i++) { const a = i * TAU / (sun ? 10 : 5) + t * 0.3; circle(ctx, hx + Math.cos(a) * r, hy + Math.sin(a) * r, r * (sun ? 0.55 : 0.75)); }
    ctx.fillStyle = sun ? '#8b5a2b' : '#ffe14d'; circle(ctx, hx, hy, r * 0.8); if (g > 0.6) smiley(ctx, hx, hy, r * 0.7);
  }
  function drawDrop(ctx, d) {
    if (th.drop === 'rain') { ctx.strokeStyle = '#4c8fd6'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + S * 0.025); ctx.stroke(); }
    else if (th.drop === 'snow') { ctx.fillStyle = '#ffffff'; circle(ctx, d.x, d.y, S * 0.009); }
    else if (th.drop === 'leaf') { ctx.fillStyle = d.c; drawLeaf(ctx, d.x, d.y, S * 0.018, d.rot + t * 3); }
    else { ctx.fillStyle = th.drop === 'sun' ? '#ffd43b' : '#fff3b0'; drawStar(ctx, d.x, d.y, S * 0.013, t * 2 + d.rot); }
  }
  function drawCloud(ctx, c) {
    const s = c.s * (1 + c.puff * 0.15);
    if (th.drop === 'sun') {
      ctx.strokeStyle = '#ffb627'; ctx.lineWidth = s * 0.1; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + t * 0.5; ctx.beginPath(); ctx.moveTo(c.x + Math.cos(a) * s * 0.85, c.y + Math.sin(a) * s * 0.85); ctx.lineTo(c.x + Math.cos(a) * s * 1.2, c.y + Math.sin(a) * s * 1.2); ctx.stroke(); }
      ctx.fillStyle = '#ffd43b'; circle(ctx, c.x, c.y, s * 0.7); smiley(ctx, c.x, c.y, s * 0.5); return;
    }
    ctx.fillStyle = th.night ? '#5a5a8a' : c.rain > 0 && th.drop === 'rain' ? '#dfe6ee' : '#ffffff';
    for (const [dx, dy, r] of [[-0.6, 0.1, 0.5], [0, -0.15, 0.7], [0.6, 0.1, 0.5], [0, 0.2, 0.55]]) circle(ctx, c.x + dx * s, c.y + dy * s, r * s);
    smiley(ctx, c.x, c.y + s * 0.05, s * 0.45);
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); clouds.length = 0; addCloud(W / 2, H * 0.22); },
    enter() { for (const p of plants) { p.g = 0; p.done = false; } drops.length = 0; allT = 0; },
    tap(x, y) {
      let [c, d] = near(clouds, x, y); if (!c || d > S * 0.18) c = addCloud(x, y);
      c.rain = 2.2; c.puff = 1; buzz(10);
      if (th.drop === 'rain' || th.drop === 'leaf') audio.rustle(); else if (th.drop === 'sun') audio.chime(3); else audio.twinkle();
    },
    drag(x, y) { const [c, d] = near(clouds, x, y); if (c && d < S * 0.25) { c.x = x; c.y = Math.max(H * 0.14, Math.min(y, H * 0.4)); } },
    update(dt) {
      t += dt; parts.update(dt, 300);
      for (const c of clouds) {
        c.puff = Math.max(0, c.puff - dt * 3);
        if (c.rain > 0) { c.rain -= dt; for (let i = 0; i < 2; i++) if (Math.random() < dt * 14) drops.push({ x: c.x + rnd(-1, 1) * c.s, y: c.y + c.s * 0.4, vy: th.drop === 'rain' || th.drop === 'sun' ? S * 0.9 : S * 0.25, rot: rnd(0, TAU), ph: rnd(0, TAU), c: pick(['#ff9f1c', '#ff7a59', '#ffb627', '#e63946']) }); }
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]; d.y += d.vy * dt; if (th.drop === 'snow' || th.drop === 'leaf') d.x += Math.sin(t * 3 + d.ph) * S * 0.05 * dt;
        if (d.y >= gy()) {
          drops.splice(i, 1); const p = plants[Math.max(0, Math.min(plants.length - 1, Math.floor(d.x / W * plants.length)))];
          p.g = Math.min(1, p.g + 0.06);
          if (p.g >= 1 && !p.done) { p.done = true; parts.burst(p.x, gy() - S * 0.15, 16, S * 0.014, COLORS, 220); audio.note(Math.random() * 8 | 0); }
        }
      }
      if (plants.every((p) => p.done) && (allT += dt) > 4) { allT = 0; for (const p of plants) { p.g = 0; p.done = false; } }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg); if (th.night) nightStars(ctx, W, H, t);
      ctx.fillStyle = th.ground; ctx.fillRect(0, gy(), W, H - gy());
      for (const p of plants) drawPlant(ctx, p);
      for (const d of drops) drawDrop(ctx, d);
      for (const c of clouds) drawCloud(ctx, c);
      parts.draw(ctx);
    },
  };
}

// 19) Dress-up: one big animal; tap around = its hat/crown/bow/glasses/scarf changes color; tap the animal = it giggles and talks.
const DRESS = {
  hats: { acc: 'hat', bg: ['#fff0d6', '#ffe0e9'], group: 'all' },
  crowns: { acc: 'crown', bg: ['#efe0ff', '#fff5fa'], group: 'wild' },
  bows: { acc: 'bow', bg: ['#ffe0ef', '#fff5fa'], group: 'small' },
  glasses: { acc: 'glasses', bg: ['#d6f0ff', '#f0fbff'], group: 'farm' },
  scarves: { acc: 'scarf', bg: ['#cfe6ff', '#f5faff'], group: 'cold', snow: true },
};
function drawAcc(ctx, a, s, c) {
  ctx.fillStyle = c;
  if (a === 'hat') {
    ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.72); ctx.lineTo(s * 0.5, -s * 0.72); ctx.lineTo(s * 0.1, -s * 1.75); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = s * 0.08; for (const f of [0.3, 0.6]) { ctx.beginPath(); ctx.moveTo(-s * 0.5 * (1 - f) + s * 0.1 * f, -s * 0.72 - f * s * 1.03); ctx.lineTo(s * 0.5 * (1 - f) + s * 0.1 * f, -s * 0.72 - f * s * 1.03); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; circle(ctx, s * 0.1, -s * 1.75, s * 0.14);
  } else if (a === 'crown') {
    ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.72); ctx.lineTo(-s * 0.6, -s * 1.25); ctx.lineTo(-s * 0.3, -s * 0.95); ctx.lineTo(0, -s * 1.38); ctx.lineTo(s * 0.3, -s * 0.95); ctx.lineTo(s * 0.6, -s * 1.25); ctx.lineTo(s * 0.6, -s * 0.72); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; for (const [x, y] of [[-0.6, -1.25], [0, -1.38], [0.6, -1.25]]) circle(ctx, x * s, y * s, s * 0.08);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(ctx, 0, -s * 0.88, s * 0.09);
  } else if (a === 'bow') {
    const bx = s * 0.55, by = -s * 0.78;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + k * s * 0.4, by - s * 0.28); ctx.lineTo(bx + k * s * 0.4, by + s * 0.28); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.2)'; circle(ctx, bx, by, s * 0.12); ctx.fillStyle = c; circle(ctx, bx, by, s * 0.09);
  } else if (a === 'glasses') {
    ctx.strokeStyle = c; ctx.lineWidth = s * 0.09; ctx.fillStyle = 'rgba(255,255,255,.25)';
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(k * s * 0.36, -s * 0.05, s * 0.27, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, -s * 0.02, s * 0.1, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  } else {
    rrect(ctx, -s * 0.85, s * 0.72, s * 1.7, s * 0.32, s * 0.15); ctx.fill(); rrect(ctx, s * 0.2, s * 0.85, s * 0.3, s * 0.75, s * 0.1); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = s * 0.06; for (const f of [0.15, 0.35]) { ctx.beginPath(); ctx.moveTo(s * 0.2, s * (0.85 + f * 1.5)); ctx.lineTo(s * 0.5, s * (0.85 + f * 1.5)); ctx.stroke(); }
  }
}
function dressScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, ci = 0, changes = 0, kind = 'cat', wig = 0, pop = 0;
  const parts = makeParticles(), bag = bagFor(th.group);
  const cx = () => W / 2, cy = () => H * 0.5, sz = () => Math.min(W, H) * 0.2;
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { kind = bag.next(); ci = Math.random() * COLORS.length | 0; changes = 0; pop = 1; },
    tap(x, y) {
      const s = sz();
      if (Math.hypot(x - cx(), y - cy()) < s * 1.2) { wig = 1; sayAnimal(audio, kind, 50); buzz(15); return; }
      ci = (ci + 1) % COLORS.length; changes++; audio.note(ci); buzz(10);
      parts.burst(x, y, 12, S * 0.014, COLORS, 240); parts.burst(cx(), cy() - s, 10, S * 0.012, [COLORS[ci], '#ffffff'], 200);
      if (changes % 5 === 0) { kind = bag.next(); pop = 1; sayAnimal(audio, kind, 300); }
    },
    drag() {},
    update(dt) { t += dt; parts.update(dt, 300); wig = Math.max(0, wig - dt * 1.5); pop = Math.max(0, pop - dt * 2); },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg); if (th.snow) snowfall(ctx, W, H, t, S);
      const c = COLORS[ci], s = sz(), a = ANIMALS[kind];
      ctx.fillStyle = c; ctx.globalAlpha = 0.16; for (let y = S * 0.06; y < H; y += S * 0.14) for (let x = (y / (S * 0.14) % 2) * S * 0.07; x < W; x += S * 0.14) circle(ctx, x, y, S * 0.025); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.beginPath(); ctx.ellipse(cx(), cy() + s * 2.05, s * 1.3, s * 0.25, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(cx(), cy()); const k = 1 - Math.sin(pop * Math.PI) * 0.25; ctx.scale(k, k);
      ctx.fillStyle = a.c; ctx.strokeStyle = a.d; ctx.lineWidth = s * 0.06; ctx.beginPath(); ctx.ellipse(0, s * 1.35, s * 0.75, s * 0.7, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.rotate(Math.sin(t * 20) * wig * 0.15 + Math.sin(t * 1.5) * 0.05);
      drawAnimal(ctx, kind, 0, 0, s, t); drawAcc(ctx, th.acc, s, c);
      ctx.restore();
      parts.draw(ctx);
    },
  };
}

// 20) Jack-in-the-box: tap a box = the lid pops and an animal springs out on a spring and talks; it hides again after a while.
const JACK = {
  gifts: { box: 'gift', bg: ['#ffe0ef', '#fff5fa'], floor: '#ffc9df', group: 'all' },
  toys: { box: 'crank', bg: ['#d6f0ff', '#fff8e7'], floor: '#e8c99a', group: 'small' },
  cakes: { box: 'cake', bg: ['#fff0d6', '#fff8ec'], floor: '#f3dca2', group: 'farm' },
  barrels: { box: 'barrel', bg: ['#c9f0c0', '#f0fff0'], floor: '#9be38a', group: 'wild' },
  stars: { box: 'star', bg: ['#14193a', '#3b2f6b'], floor: '#24304a', group: 'sky', night: true },
};
function jackScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0;
  const boxes = [], parts = makeParticles(), bag = bagFor(th.group);
  function layout() {
    const n = W > H ? 4 : 3, w = Math.min(W / n * 0.6, H * 0.22); boxes.length = 0;
    for (let i = 0; i < n; i++) boxes.push({ x: W * (i + 0.5) / n, y: H * 0.86, w, open: 0, timer: 0, kind: null, jump: 0, c: COLORS[(i * 3 + 1) % 8] });
  }
  function body(ctx, b) {
    const w = b.w, x = b.x - w / 2, top = b.y - w, k = th.box;
    if (k === 'gift') { ctx.fillStyle = b.c; ctx.fillRect(x, top, w, w); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(b.x - w * 0.08, top, w * 0.16, w); }
    else if (k === 'crank') {
      ctx.fillStyle = b.c; ctx.fillRect(x, top, w, w); ctx.fillStyle = 'rgba(255,255,255,.5)'; drawStar(ctx, b.x, top + w * 0.5, w * 0.2, 0);
      const a = t * (b.timer > 0 ? 1 : 4); ctx.strokeStyle = '#888'; ctx.lineWidth = w * 0.05; ctx.beginPath(); ctx.moveTo(x + w, top + w * 0.5); ctx.lineTo(x + w * 1.12, top + w * 0.5); ctx.lineTo(x + w * 1.12 + Math.cos(a) * w * 0.15, top + w * 0.5 + Math.sin(a) * w * 0.15); ctx.stroke();
      ctx.fillStyle = '#ff5d73'; circle(ctx, x + w * 1.12 + Math.cos(a) * w * 0.15, top + w * 0.5 + Math.sin(a) * w * 0.15, w * 0.06);
    } else if (k === 'cake') {
      ctx.fillStyle = '#f7d6a8'; ctx.fillRect(x, top, w, w); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, top + w * 0.45, w, w * 0.12);
      ctx.fillStyle = b.c; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + w, top); for (let i = 0; i <= 5; i++) ctx.lineTo(x + w - i * w / 5, top + w * (i % 2 ? 0.3 : 0.18)); ctx.fill();
    } else if (k === 'barrel') {
      ctx.fillStyle = '#b07a45'; rrect(ctx, x - w * 0.05, top, w * 1.1, w, w * 0.2); ctx.fill(); ctx.fillStyle = '#6b4423'; for (const f of [0.22, 0.75]) ctx.fillRect(x - w * 0.05, top + w * f, w * 1.1, w * 0.07);
      ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 2; for (const f of [0.3, 0.5, 0.7]) { ctx.beginPath(); ctx.moveTo(x + w * f, top); ctx.lineTo(x + w * f, top + w); ctx.stroke(); }
    } else { ctx.shadowColor = '#b388ff'; ctx.shadowBlur = w * 0.2; ctx.fillStyle = '#2a2a6a'; ctx.fillRect(x, top, w, w); ctx.shadowBlur = 0; ctx.fillStyle = '#ffd43b'; for (const [fx, fy, r] of [[0.3, 0.35, 0.1], [0.7, 0.6, 0.12], [0.35, 0.78, 0.07]]) drawStar(ctx, x + w * fx, top + w * fy, w * r, t); }
    if (k !== 'barrel' && k !== 'cake') smiley(ctx, b.x, top + w * 0.72, w * 0.18);
  }
  function lid(ctx, b) {
    const w = b.w, k = th.box, lh = w * 0.18;
    ctx.save(); ctx.translate(b.x - w / 2 - w * 0.04, b.y - w); ctx.rotate(-b.open * 1.9);
    ctx.fillStyle = k === 'gift' ? b.c : k === 'crank' ? '#ffd43b' : k === 'cake' ? '#ffb3c8' : k === 'barrel' ? '#8b5a2b' : '#3a3a8a';
    rrect(ctx, 0, -lh, w * 1.08, lh, lh * 0.3); ctx.fill();
    if (k === 'gift') { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(w * 0.46, -lh, w * 0.16, lh); for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(w * 0.54 + s * w * 0.12, -lh - w * 0.07, w * 0.13, w * 0.07, s * 0.5, 0, TAU); ctx.fill(); } }
    if (k === 'cake') { ctx.fillStyle = '#4cc9f0'; ctx.fillRect(w * 0.5, -lh - w * 0.2, w * 0.06, w * 0.2); ctx.fillStyle = '#ffb627'; ctx.beginPath(); ctx.ellipse(w * 0.53, -lh - w * 0.25 + Math.sin(t * 12) * 1.5, w * 0.035, w * 0.06, 0, 0, TAU); ctx.fill(); }
    if (k === 'star') { ctx.fillStyle = '#ffd43b'; drawStar(ctx, w * 0.54, -lh / 2, lh * 0.4, 0); }
    ctx.restore();
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { for (const b of boxes) { b.open = 0; b.timer = 0; b.kind = null; } },
    tap(x, y) {
      const [b] = near(boxes, x, y, (o) => o.x, (o) => o.y - o.w * (o.open > 0.5 ? 1.4 : 0.5)); buzz(15);
      if (b.timer > 0) { b.jump = 1; b.timer = 3.5; sayAnimal(audio, b.kind, 50); return; }
      b.kind = bag.next(); b.timer = 3.5; audio.note(0); audio.note(2, 0.08); audio.note(4, 0.16); audio.pop(); sayAnimal(audio, b.kind, 400);
      parts.burst(b.x, b.y - b.w, 16, S * 0.014, COLORS, 260);
    },
    drag() {},
    update(dt) {
      t += dt; parts.update(dt, 300);
      for (const b of boxes) { b.timer -= dt; const tg = b.timer > 0 ? 1 : 0; b.open += (tg - b.open) * Math.min(1, dt * (tg ? 9 : 5)); b.jump = Math.max(0, b.jump - dt * 2); }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg); if (th.night) nightStars(ctx, W, H, t);
      ctx.fillStyle = th.floor; ctx.fillRect(0, H * 0.86, W, H * 0.14);
      for (const b of boxes) {
        const w = b.w, top = b.y - w;
        if (b.kind && b.open > 0.03) {
          const ext = b.open * w * 1.1 + Math.sin(b.jump * Math.PI) * w * 0.35, sw = Math.sin(t * 7) * w * 0.04 * b.open;
          ctx.strokeStyle = '#9a9aa8'; ctx.lineWidth = w * 0.05; ctx.beginPath(); ctx.moveTo(b.x, top);
          for (let i = 1; i <= 8; i++) ctx.lineTo(b.x + (i % 2 ? 1 : -1) * w * 0.14 + sw * i / 8, top - ext * i / 8); ctx.stroke();
          drawAnimal(ctx, b.kind, b.x + sw, top - ext - w * 0.25, w * 0.38, t);
        }
        body(ctx, b); lid(ctx, b);
      }
      parts.draw(ctx);
    },
  };
}

export function extraScenes(audio) {
  return [
    ...variants(audio, 'eggs', eggScene, EGGS), ...variants(audio, 'cars', carScene, ROADS), ...variants(audio, 'dance', danceScene, DANCE),
    ...variants(audio, 'bath', bathScene, BATH), ...variants(audio, 'chute', chuteScene, CHUTE), ...variants(audio, 'dots', dotScene, DOTS),
    ...variants(audio, 'weather', weatherScene, WEATHER), ...variants(audio, 'dress', dressScene, DRESS), ...variants(audio, 'jack', jackScene, JACK),
  ];
}
