// Shared helpers for all scenes: random, colors, particles, shuffle bags (no repeats), rounded rects.
import { drawStar, ANIMALS } from './art.js';

export const TAU = Math.PI * 2;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (a) => a[Math.random() * a.length | 0];
export const COLORS = ['#ff5d73', '#ffb627', '#4cc9f0', '#7bd389', '#b388ff', '#ff8fab', '#3a86ff', '#ff7a59'];
export const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch { /* ignore */ } };

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Shuffle bag: every item comes out once before any repeats, and never the same item twice in a row.
export function makeBag(items) {
  let deck = [], last = null;
  return {
    next() {
      if (!deck.length) {
        deck = shuffle([...items]);
        if (deck.length > 1 && deck[deck.length - 1] === last) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
      }
      return (last = deck.pop());
    },
  };
}

// ONE animal bag shared by every game: the child sees all animals before any comes back.
export const animalBag = makeBag(Object.keys(ANIMALS));

// Animal "talks": its sound, then its Vietnamese name.
export function sayAnimal(audio, kind, delay = 150) {
  setTimeout(() => audio.animal(kind), delay);
  audio.say(ANIMALS[kind].name, delay + 750);
}

export function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function makeParticles() {
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
      if (list.length > 500) list.splice(0, list.length - 500);
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
