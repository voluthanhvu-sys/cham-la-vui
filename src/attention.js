// Attention helpers shared by every game (drawn on top of the current scene):
// - tapFx: every tap, anywhere, gets a big colorful ring + burst (the child never "misses").
// - idle call-back: no tap for CALL_SEC -> an animal pops up from the bottom, bounces and talks;
//   still no tap after SWITCH_SEC -> the caller switches to another game.
// - keepGoing: a game the child is actively tapping may run longer than the normal scene time.
import { TAU, COLORS, pick, rnd, makeParticles, bagFor } from './fx.js';
import { drawAnimal } from './art.js';

export const CALL_SEC = 7, SWITCH_SEC = 16, ACTIVE_SEC = 4;

export function createAttention(audio) {
  const rings = [], parts = makeParticles();
  let W = 1, H = 1, S = 1, idle = 0, called = false, pop = null, t = 0;
  return {
    get idle() { return idle; },
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    // A new game starts: the child gets a fresh grace period.
    reset() { idle = 0; called = false; pop = null; },
    tap(x, y) {
      idle = 0; called = false;
      if (pop) pop.leave = true;
      rings.push({ x, y, t: 0, c: pick(COLORS) });
      parts.burst(x, y, 10, S * 0.025, COLORS, S * 0.7);
    },
    // Returns true when the game should be switched because nobody is tapping.
    update(dt) {
      t += dt; idle += dt; parts.update(dt, 200);
      for (let i = rings.length - 1; i >= 0; i--) if ((rings[i].t += dt) > 0.6) rings.splice(i, 1);
      if (!called && idle >= CALL_SEC) {
        called = true;
        const kind = bagFor('all').next();
        pop = { kind, x: rnd(0.3, 0.7) * W, t: 0, leave: false, out: 0 };
        audio.animal(kind);
        if (!audio.clip('call', 500)) audio.say('Tô ơi Tô, lại chơi nè Tô ơi!', 500);
        setTimeout(() => { if (called) audio.song(4); }, 5600); // then sing a bit of the song (parent's file or built-in tune)
      }
      if (pop) {
        pop.t += dt;
        if (pop.leave || pop.t > 8.5) pop.out += dt * 2.5;
        if (pop.out >= 1) pop = null;
      }
      if (idle >= SWITCH_SEC) { idle = 0; called = false; return true; }
      return false;
    },
    draw(ctx) {
      for (const r of rings) {
        const k = r.t / 0.6;
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.c; ctx.lineWidth = S * 0.03 * (1 - k) + 2;
        ctx.beginPath(); ctx.arc(r.x, r.y, S * (0.05 + 0.22 * Math.sqrt(k)), 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      parts.draw(ctx);
      if (pop) {
        const s = S * 0.17, inK = Math.min(1, pop.t / 0.5);
        const rise = (1 - (1 - inK) ** 3) * (1 - Math.min(1, pop.out)); // ease out, then slide back down
        const bob = Math.abs(Math.sin(pop.t * 4)) * s * 0.25 * rise;
        const y = H + s * 1.2 - rise * s * 2.6 - bob;
        const tilt = Math.sin(pop.t * 3) * 0.15;
        ctx.save(); ctx.translate(pop.x, y); ctx.rotate(tilt);
        drawAnimal(ctx, pop.kind, 0, 0, s, t);
        ctx.restore();
      }
    },
  };
}
