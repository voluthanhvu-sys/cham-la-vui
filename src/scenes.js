// Scenes: each has resize(W,H), enter(), tap(x,y), drag(x,y), update(dt), draw(ctx).
// Rule for every scene: a tap ANYWHERE does something (no misses, no fail state).
// Each mechanic takes a theme -> 5 variants per mechanic (names "mech.theme"), see makeScenes.
import { TAU, rnd, makeParticles } from './fx.js';
import { tapGames } from './games4.js';
import { deviceGames } from './games5.js';
import { surpriseGames } from './surprise.js';

export const grad = (ctx, W, H, a, b) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
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
  // Baby v3 (2026-11-24): generative surprise rounds (surprise: true) are the main play; the 7 v2 mechanics are short events.
  const play = [...surpriseGames(audio), ...tapGames(audio), ...deviceGames(audio)];
  return { play, sleep: sleepScene(audio) };
}
