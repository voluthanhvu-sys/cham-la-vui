// Scenes: each has resize(W,H), enter(), tap(x,y), drag(x,y), update(dt), draw(ctx).
// Rule for every scene: a tap ANYWHERE does something (no misses, no fail state).
import { drawAnimal, drawStar, drawBush, ANIMALS } from './art.js';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.random() * a.length | 0];
export const COLORS = ['#ff5d73', '#ffb627', '#4cc9f0', '#7bd389', '#b388ff', '#ff8fab', '#3a86ff', '#ff7a59'];
const KINDS = Object.keys(ANIMALS);
const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch { /* ignore */ } };

// Shared particle burst
function makeParticles() {
  const list = [];
  return {
    burst(x, y, n, size, colors = COLORS, speed = 260) {
      for (let i = 0; i < n; i++) {
        const a = rnd(0, TAU), v = rnd(0.4, 1) * speed;
        list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: size * rnd(0.5, 1), c: pick(colors), life: 0, max: rnd(0.7, 1.2), star: Math.random() < 0.4, rot: rnd(0, TAU) });
      }
    },
    update(dt, g = 300) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i]; p.life += dt;
        if (p.life >= p.max) { list.splice(i, 1); continue; }
        p.vx *= 0.97; p.vy = p.vy * 0.97 + g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 3;
      }
      if (list.length > 400) list.splice(0, list.length - 400);
    },
    draw(ctx) {
      for (const p of list) {
        ctx.globalAlpha = 1 - p.life / p.max; ctx.fillStyle = p.c;
        if (p.star) drawStar(ctx, p.x, p.y, p.r, p.rot);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    },
  };
}

// 1) Tap -> a flower blooms + confetti; drag -> sparkle trail.
function bloomScene(audio) {
  let W = 1, H = 1, S = 1, t = 0, lastDrag = null, lastTw = 0;
  const flowers = [], parts = makeParticles();
  return {
    name: 'bloom',
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { flowers.length = 0; },
    tap(x, y) {
      const c = pick(COLORS);
      flowers.push({ x, y, c, c2: pick(COLORS), age: 0, petals: pick([5, 6, 8]), r: S * rnd(0.09, 0.13), rot: rnd(0, TAU) });
      if (flowers.length > 12) flowers.shift();
      parts.burst(x, y, 16, S * 0.018);
      audio.note(Math.floor((x / W) * 8)); buzz(15);
      lastDrag = { x, y };
    },
    drag(x, y) {
      if (lastDrag && Math.hypot(x - lastDrag.x, y - lastDrag.y) < S * 0.03) return;
      lastDrag = { x, y };
      parts.burst(x, y, 3, S * 0.014, COLORS, 60);
      if (t - lastTw > 0.12) { audio.twinkle(); lastTw = t; }
    },
    update(dt) {
      t += dt; parts.update(dt, 120);
      for (let i = flowers.length - 1; i >= 0; i--) if ((flowers[i].age += dt) > 6) flowers.splice(i, 1);
    },
    draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      const h = (t * 6) % 360;
      g.addColorStop(0, `hsl(${h},85%,88%)`); g.addColorStop(1, `hsl(${(h + 60) % 360},85%,82%)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const f of flowers) {
        const grow = Math.min(1, f.age / 0.35), k = grow * (2 - grow), fade = f.age > 5 ? 6 - f.age : 1;
        const r = f.r * k * (1 + 0.05 * Math.sin(f.age * 4));
        ctx.globalAlpha = fade;
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot + f.age * 0.3);
        ctx.fillStyle = f.c;
        for (let i = 0; i < f.petals; i++) {
          const a = (i / f.petals) * TAU;
          ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.6, r * 0.38, a, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = f.c2; ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, TAU); ctx.fill();
        // smiley center
        ctx.fillStyle = '#3b2f2f';
        ctx.beginPath(); ctx.arc(-r * 0.12, -r * 0.06, r * 0.05, 0, TAU); ctx.arc(r * 0.12, -r * 0.06, r * 0.05, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#3b2f2f'; ctx.lineWidth = r * 0.04; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, r * 0.04, r * 0.13, 0.2, Math.PI - 0.2); ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      parts.draw(ctx);
    },
  };
}

// 2) Peekaboo: 3 bushes; tap anywhere -> the nearest bush shows an animal that "talks".
function peekScene(audio) {
  let W = 1, H = 1, t = 0, idle = 0, lastKind = '';
  const holes = [0, 1, 2].map(() => ({ x: 0, y: 0, s: 1, kind: null, phase: 0, timer: 0, wig: 0, bounce: 0 }));
  const parts = makeParticles();
  const POP = 0.35, HOLD = 2.8;
  function layout() {
    const land = W > H;
    holes.forEach((h, i) => {
      if (land) { h.x = W * (0.2 + 0.3 * i); h.y = H * 0.7; h.s = Math.min(W * 0.12, H * 0.22); }
      else { h.x = W * (i === 1 ? 0.68 : 0.32); h.y = H * (0.3 + 0.25 * i); h.s = Math.min(W * 0.2, H * 0.1); }
    });
  }
  function show(h) {
    if (h.kind && h.phase > 0) { h.bounce = 1; h.timer = 0; } // already out: bounce + talk again
    else {
      let k; do k = pick(KINDS); while (k === lastKind && KINDS.length > 1);
      h.kind = k; lastKind = k; h.timer = 0; h.phase = 0.001;
      audio.rustle();
    }
    const a = ANIMALS[h.kind];
    setTimeout(() => audio.animal(h.kind), 150);
    audio.say(a.name, 900);
    parts.burst(h.x, h.y - h.s * 1.2, 10, h.s * 0.08, ['#7bd389', '#a7e8a0', '#ffd43b'], 200);
    buzz(20);
  }
  return {
    name: 'peek',
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
      if (idle > 6) { idle = 3; const h = pick(holes.filter((q) => !q.kind) || holes); if (h) { h.wig = 0.8; audio.rustle(); } }
    },
    draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#8fd3ff'); g.addColorStop(1, '#d6f1ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // sun + clouds
      ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(W * 0.85, H * 0.1, Math.min(W, H) * 0.08, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 3; i++) {
        const cx = ((t * 12 + i * W * 0.4) % (W + 200)) - 100, cy = H * (0.07 + i * 0.05), r = Math.min(W, H) * 0.04;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.arc(cx + r, cy - r * 0.4, r * 1.2, 0, TAU); ctx.arc(cx + r * 2.1, cy, r, 0, TAU); ctx.fill();
      }
      // grass
      ctx.fillStyle = '#9be38a'; ctx.beginPath(); ctx.moveTo(0, H * 0.2);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.2 + Math.sin(x * 0.02) * 10);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      for (const h of holes) {
        const wig = Math.sin(t * 30) * h.wig * h.s * 0.06;
        if (h.kind) {
          const e = h.phase * (2 - h.phase), b = Math.sin(h.bounce * Math.PI) * h.s * 0.25;
          ctx.save(); ctx.beginPath(); ctx.rect(h.x - h.s * 3, h.y - h.s * 4, h.s * 6, h.s * 4.2); ctx.clip();
          drawAnimal(ctx, h.kind, h.x, h.y + h.s * 0.5 - e * h.s * 2.1 - b, h.s * 0.8, t);
          ctx.restore();
        }
        drawBush(ctx, h.x + wig, h.y, h.s);
      }
      parts.draw(ctx);
    },
  };
}

// 3) Bubbles float up; tap pops the nearest one (or makes a mini burst). Some carry an animal.
function bubbleScene(audio) {
  let W = 1, H = 1, S = 1, t = 0, spawn = 0;
  const bubbles = [], faces = [], parts = makeParticles();
  function add(y) {
    const r = S * rnd(0.09, 0.14);
    bubbles.push({ x: rnd(r, W - r), y: y ?? H + r, r, vy: rnd(45, 75) * (S / 600), ph: rnd(0, TAU), c: pick(COLORS), kind: Math.random() < 0.35 ? pick(KINDS) : null });
  }
  return {
    name: 'bubbles',
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    enter() { bubbles.length = 0; faces.length = 0; for (let i = 0; i < 4; i++) add(rnd(H * 0.3, H)); },
    tap(x, y) {
      let best = -1, bd = Infinity;
      bubbles.forEach((b, i) => { const d = Math.hypot(x - b.x, y - b.y) / b.r; if (d < bd) { bd = d; best = i; } });
      if (best >= 0 && bd < 2.2) {
        const b = bubbles.splice(best, 1)[0];
        parts.burst(b.x, b.y, 18, b.r * 0.12, [b.c, '#ffffff', '#bde0fe'], 300);
        audio.pop(); buzz(20);
        if (b.kind) { faces.push({ x: b.x, y: b.y, kind: b.kind, age: 0, s: b.r * 0.8 }); setTimeout(() => audio.animal(b.kind), 120); audio.say(ANIMALS[b.kind].name, 800); }
      } else {
        parts.burst(x, y, 8, S * 0.015, ['#ffffff', '#bde0fe'], 150); audio.twinkle();
      }
    },
    drag() {},
    update(dt) {
      t += dt; parts.update(dt, 250);
      spawn -= dt;
      if (spawn <= 0 && bubbles.length < 7) { add(); spawn = rnd(0.7, 1.3); }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i]; b.y -= b.vy * dt; b.ph += dt * 1.5;
        if (b.y < -b.r * 1.2) bubbles.splice(i, 1);
      }
      for (let i = faces.length - 1; i >= 0; i--) { const f = faces[i]; f.age += dt; f.y -= dt * 20; if (f.age > 2.5) faces.splice(i, 1); }
    },
    draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#a0e7e5'); g.addColorStop(1, '#3fa7d6');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const b of bubbles) {
        const x = b.x + Math.sin(b.ph) * b.r * 0.25;
        if (b.kind) drawAnimal(ctx, b.kind, x, b.y + b.r * 0.08, b.r * 0.55, t);
        const rg = ctx.createRadialGradient(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, x, b.y, b.r);
        rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(0.6, b.c + '22'); rg.addColorStop(1, b.c + 'aa');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = Math.max(2, b.r * 0.05); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(x - b.r * 0.4, b.y - b.r * 0.45, b.r * 0.16, b.r * 0.09, -0.7, 0, TAU); ctx.fill();
      }
      for (const f of faces) {
        const k = Math.min(1, f.age / 0.3), fade = f.age > 2 ? (2.5 - f.age) * 2 : 1;
        ctx.globalAlpha = Math.max(0, fade);
        drawAnimal(ctx, f.kind, f.x, f.y, f.s * (0.7 + 0.5 * k), t);
        ctx.globalAlpha = 1;
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
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1b2a4a'); g.addColorStop(1, '#3a3f78');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
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

export function makeScenes(audio) {
  return { play: [bloomScene(audio), peekScene(audio), bubbleScene(audio)], sleep: sleepScene(audio) };
}
