// The 36 places of the story game. Each place has its OWN way to play (user 2026-11-24: no repeated gift/ball props).
// PLACES[id] = { sky, ground, deco (horizon row), ride, up?, indoor?, dark?, notes, play(k) }. play() adds things and may return
// { touch(x, y, drag, hit), step(dt), back(ctx), front(ctx), hero(pose) }. k = kit from story.js:
//   T(emoji, fx, y, size, opts) add a thing (fx 0..1 of the world, y px of its foot, size in U) · Y(fy) ground y · say() a line of the place
//   fly(th, x, y, sec, arc, then) · wait(sec, fn) · act(name, sec) hero animation · fx(kind, x, y, n) · boom(x, y, n, colors) · score() · kill(th) · a = audio
import { TAU, COLORS, rnd, pick, shuffle } from './fx.js';

const cache = new Map();
// Emoji are drawn once into a bitmap: fillText every frame is slow on phones.
export function sprite(c, e, x, y, s, { rot = 0, fl = 1, sx = 1, sy = 1, alpha = 1 } = {}) { // (x, y) = centre
  let cv = cache.get(e);
  if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 160; const g = cv.getContext('2d'); g.font = '116px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#333'; g.fillText(e, 80, 88); cache.set(e, cv); }
  c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(fl * sx, sy); c.globalAlpha *= alpha; const k = s * 1.3; c.drawImage(cv, -k / 2, -k / 2, k, k); c.restore();
}
const row = (n, f) => Array.from({ length: n }, (_, i) => f(i, n > 1 ? i / (n - 1) : 0.5));
const at = (u, a = 0.1, b = 0.84) => a + (b - a) * u;
const SND = { '🐱': 'cat', '🐶': 'dog', '🐮': 'cow', '🐄': 'cow', '🦆': 'duck', '🐷': 'pig', '🐭': 'squeak', '🦁': 'roar', '🐯': 'roar', '🐘': 'trumpet', '🐵': 'monkey', '🐒': 'monkey', '🦓': 'neigh', '🐴': 'neigh', '🐸': 'frog', '🐥': 'chick', '🐤': 'chick', '🐔': 'chick', '🐑': 'baa', '🦉': 'hoot', '🐻': 'grunt', '🦒': 'boop', '🐊': 'roar', '🐰': 'squeak', '🦊': 'dog', '🐼': 'grunt' };
const cry = (k, e) => k.a.animal(SND[e] || 'boop');
const PASTEL = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#f783ac'];

export const PLACES = {
  // 1. shelf food flies into the cart that the hero pushes; a full cart is paid: beep beep
  market: { sky: ['#ffe3e3', '#fff5f5'], ground: '#e9ecef', deco: ['🏪', '🥫', '🧃', '🥫'], ride: '🚕', indoor: '#ffc9c9', sign: 'SIÊU THỊ GO', notes: [0, 2, 4, 7], play(k) {
    const cart = k.T('🛒', 0.2, k.Y(0.55), 4.2, { fl: -1, pass: true }), inCart = []; const FOOD = shuffle(['🍎', '🍌', '🥛', '🍞', '🧀', '🥕', '🍇', '🍉', '🥚', '🍪', '🐟', '🍓']);
    const buy = (th) => { if (th.busy) return; th.busy = 1; k.a.note(inCart.length); k.fly(th, cart.x, cart.y - k.U * 2, 0.6, 5, () => { inCart.push(th); k.a.pop(); k.score(); if (inCart.length >= 6) pay(); }); if (Math.random() < 0.4) k.say(); };
    const pay = () => { k.say(1); inCart.splice(0).forEach((th, i) => k.wait(i * 0.3, () => { k.a.toot(); k.fx('star', th.x, th.y, 3); k.fly(th, th.hx, th.hy, 0.8, 7, () => { th.busy = 0; }); })); k.act('dance', 2); };
    row(12, (i) => { const th = k.T(FOOD[i], at((i % 6) / 5, 0.12, 0.86), k.H * (i < 6 ? 0.28 : 0.45), 2.6, { hit: buy }); th.hx = th.x; th.hy = th.y; });
    return { step() { cart.x += (k.hero.x + k.hero.dir * k.U * 3.2 - cart.x) * 0.15; cart.y = k.Y(k.hero.fy) + 2; inCart.forEach((th, i) => { th.x = cart.x + ((i % 3) - 1) * k.U; th.y = cart.y - k.U * (1.6 + Math.floor(i / 3)); }); },
      back(c) { c.fillStyle = '#b08968'; for (const y of [0.28, 0.45]) c.fillRect(k.X(0.07), k.H * y, k.X(0.84), k.U * 0.4); } };
  } },
  // 2. throw food: the animal eats, cries out and grows
  zoo: { sky: ['#8fdcff', '#eafff0'], ground: '#9bd77f', deco: ['🌳', '🌴', '🌿', '🌳'], ride: '🚌', sign: 'SỞ THÚ', notes: [0, 2, 5, 7], play(k) {
    const A = shuffle([['🦁', '🍖'], ['🐘', '🍉'], ['🦒', '🌿'], ['🐵', '🍌'], ['🦓', '🌾'], ['🐼', '🎋'], ['🐊', '🐟'], ['🐻', '🍯']]).slice(0, 6);
    A.forEach(([e, f], i) => k.T(e, at(i / 5), k.Y(i % 2 ? 0.8 : 0.1), 4.4, { sway: 1, hit(th) { const food = k.T(f, 0, k.Y(k.hero.fy) - k.U * 2, 1.8, { pass: true }); food.x = k.hero.x; k.a.whoosh(); k.say();
      k.fly(food, th.x, th.y - k.U * 2, 0.5, 4, () => { k.kill(food); k.a.chomp(); k.wait(0.35, () => cry(k, e)); th.s = Math.min(k.U * 7.5, th.s * 1.15); th.sq = 1; k.fx('heart', th.x, th.y - th.s, 4); k.score(); }); } }));
  } },
  // 3. hens run away from the finger, lay eggs; eggs hatch
  noi: { sky: ['#bde8ff', '#fff7dd'], ground: '#c9b06b', deco: ['🏡', '🌳', '🌾', '🌴'], ride: '🛵', sign: 'NHÀ ÔNG BÀ NỘI', grand: true, notes: [0, 4, 5, 7], play(k) {
    const hen = (i) => k.T('🐔', at(i / 4), k.Y(0.2 + 0.6 * Math.random()), 2.8, { hit(th) { k.a.animal('chick'); th.run = 1.4; th.vx2 = (th.x > k.fx0() ? 1 : -1) * k.U * 14; th.fl = th.vx2 > 0 ? -1 : 1; k.boom(th.x, th.y - k.U, 8, ['#fff', '#f4d9b0']); k.say(); if (k.count('🥚') < 6) k.T('🥚', th.x / k.worldW, th.y, 1.6, { hit: hatch }); k.score(); } });
    const hatch = (th) => { if (th.e !== '🥚') { k.a.animal('chick'); k.jump(th, 9); return; } k.kill(th); k.a.pop(); k.T('🐥', th.x / k.worldW, th.y, 1.8, { hit: (q) => hatch(q), follow: true }); k.say(1); };
    const hens = row(5, hen);
    return { step(dt) { for (const h of hens) if (h.run > 0) { h.run -= dt; h.x = Math.max(k.U * 2, Math.min(k.worldW - k.U * 2, h.x + h.vx2 * dt)); h.sq = 0.4; } const c = k.all('🐥'); c.forEach((q, i) => { q.x += (k.hero.x - k.hero.dir * k.U * (2 + i * 1.4) - q.x) * dt * 2; if (!q.vy) q.y += (k.Y(Math.min(1, k.hero.fy + 0.15)) - q.y) * dt * 2; }); } };
  } },
  // 4. shake the trees, fruit rains and rolls to the basket
  ngoai: { sky: ['#c9f0ff', '#f5ffe3'], ground: '#8ccf6d', deco: ['🏠', '🌴', '🎋', '🌴'], ride: '🚲', sign: 'NHÀ ÔNG BÀ NGOẠI', grand: true, notes: [0, 2, 4, 9], play(k) {
    const bask = k.T('🧺', 0.5, k.Y(0.95), 4, { pass: true });
    ['🥭', '🍊', '🍑', '🍎'].forEach((f, i) => k.T('🌳', at(i / 3, 0.12, 0.82), k.Y(0.1), 8, { hit(th) { th.shake = 0.8; k.a.rustle(); k.say(); row(3, (j) => k.wait(j * 0.15, () => { const q = k.T(f, th.x / k.worldW + rnd(-0.04, 0.04), th.y - k.U * rnd(3, 6), 1.8, { hit(z) { k.fly(z, bask.x, bask.y - k.U, 0.6, 4, () => { k.kill(z); bask.sq = 1; k.a.pop(); k.score(); }); } }); q.g = k.U * 40; q.vy = 0; q.vx = rnd(-3, 3) * k.U; q.floor = k.Y(rnd(0.4, 0.75)); if (k.count(f) > 8) k.kill(k.all(f)[0]); })); } }));
  } },
  // 5. stack a sandcastle; when it is tall a wave washes it away
  beach: { sky: ['#6fcfff', '#fff3cf'], ground: '#f5dc9a', deco: ['🏝️', '⛵', '🌴', '⛱️'], ride: '⛵', sea: true, notes: [0, 3, 5, 7], play(k) {
    let n = 0, wave = -1; const TOP = ['🏰', '🚩', '⭐']; let st = [];
    const add = (x) => { if (wave >= 0) return; n++; k.a.drum(n); st.push({ x, h: 0 }); k.boom(x, k.Y(0.7), 10, ['#e8c36a', '#f5dc9a']); k.say(); k.score(); if (st.length >= 9) { k.say(1); k.wait(1.2, () => { wave = 0; k.a.whoosh(); }); } };
    row(4, (i) => k.T(['🐚', '🦀', '⭐', '🐢'][i], at(i / 3), k.Y(0.95), 2, { hit(th) { k.jump(th, 10); k.a.animal('boop'); } }));
    return { touch(x, y, drag, hit) { if (!drag && !hit && y > k.gy) add(x); }, step(dt) { for (const b of st) b.h = Math.min(1, b.h + dt * 5); if (wave >= 0) { wave += dt * 0.7; if (wave > 0.5 && st.length) { st = []; k.a.splash?.(); k.a.boom(); k.act('jump', 1.2); } if (wave > 1) wave = -1; } },
      back(c) { st.forEach((b, i) => { const w = k.U * 2.4, h = k.U * 2.6 * b.h, y = k.Y(0.45 + (i % 3) * 0.15); c.fillStyle = '#d9ac55'; c.fillRect(b.x - w / 2, y - h, w, h); for (let j = 0; j < 3; j++) c.fillRect(b.x - w / 2 + j * w * 0.38, y - h - w * 0.2, w * 0.24, w * 0.22); c.fillStyle = '#a97a30'; c.beginPath(); c.arc(b.x, y, w * 0.17, Math.PI, TAU); c.fill(); if (i % 3 === 2) sprite(c, TOP[(i / 3 | 0) % 3], b.x, y - h - k.U, k.U * 1.6); }); },
      front(c) { if (wave >= 0) { const q = Math.sin(wave * Math.PI); c.fillStyle = 'rgba(60,175,235,.75)'; c.beginPath(); c.moveTo(k.cam() - 9, k.gy - k.U * 3); for (let i = 0; i <= 20; i++) c.lineTo(k.cam() + k.W * i / 20, k.gy + (k.H - k.gy) * q + Math.sin(i + wave * 20) * k.U * 0.5); c.lineTo(k.cam() + k.W + 9, k.gy - k.U * 3); c.fill(); } } };
  } },
  // 6. under water: everybody swims, a fish school follows the finger
  sea: { sky: ['#1b9ad1', '#0f6fa8'], ground: '#e0c48a', deco: ['🪸', '🌿', '🪸', '🪨'], ride: '🚤', swim: true, notes: [0, 5, 7, 9], play(k) {
    const F = row(12, (i) => k.T(['🐟', '🐠', '🐡'][i % 3], Math.random(), k.H * rnd(0.2, 0.8), 1.8, { pass: true, ph: i }));
    ['🐙', '🦑', '🐬', '🐳', '🦀'].forEach((e, i) => k.T(e, at(i / 4), k.H * (0.25 + (i * 0.37 % 0.6)), 4, { sway: 1, hit(th) { k.a.pop(); k.fx('bubble', th.x, th.y - th.s, 8); th.spin = 1; k.say(); k.score(); if (e === '🐳') k.a.trumpet?.(); } }));
    return { step(dt) { F.forEach((f, i) => { const a = k.t() * 0.8 + i * 0.52, r = k.U * (3 + (i % 4)), tx = k.finger.x + Math.cos(a) * r, ty = k.finger.y + Math.sin(a) * r * 0.6; f.fl = tx > f.x ? -1 : 1; f.x += (tx - f.x) * dt * (1.2 + (i % 3) * 0.4); f.y += (ty - f.y) * dt * (1.2 + (i % 3) * 0.4); }); if (Math.random() < dt * 2) k.fx('bubble', k.cam() + Math.random() * k.W, k.H * 0.95, 1); } };
  } },
  // 7. pull vegetables out of the soil: three tugs, then pop
  farm: { sky: ['#aee6ff', '#fff9d8'], ground: '#8a5a35', deco: ['🌾', '🏚️', '🌾', '🌻'], ride: '🚜', notes: [0, 2, 4, 5], play(k) {
    row(8, (i) => { const f = ['🥕', '🥔', '🧅', '🌽', '🍠', '🥕', '🍆', '🥦'][i]; k.T(f, at((i % 4) / 3, 0.12, 0.82), k.Y(i < 4 ? 0.15 : 0.75), 3, { n: 0, sink: 0.75, hit(th) { if (th.vy) return; th.n++; k.a.boing(); th.shake = 0.4; th.sink = 0.75 - th.n * 0.2; k.boom(th.x, th.y, 8, ['#6b4226', '#8a5a35']); if (th.n >= 3) { th.sink = 0; k.jump(th, 20); th.spin = 1; k.a.pop(); k.act('jump', 1); k.say(1); k.score(2); k.wait(1.6, () => { th.n = 0; th.sink = 0.75; }); } else k.say(0); } }); });
    k.T('🐮', 0.9, k.Y(0.4), 4, { hit(th) { cry(k, '🐮'); th.sq = 1; } });
  } },
  // 8. playground: swing, slide, seesaw move harder with every touch; the hero rides them
  park: { sky: ['#9be0ff', '#f1fbff'], ground: '#8fd16f', deco: ['🌳', '🎡', '🌳', '🌲'], ride: '🚂', notes: [0, 2, 4, 7], play(k) {
    let sw = 0.15, ph = 0, see = 0, sl = -1; const sx = k.X(0.2), lx = k.X(0.52), ex = k.X(0.8), by = k.Y(0.45); let on = '';
    const zone = (fx, name, fn) => k.T('', fx, k.Y(0.6), 8, { near: name, hit: fn });
    zone(0.2, 'swing', () => { on = 'swing'; sw = Math.min(1.1, sw + 0.35); k.a.whoosh(); k.act('ride2', 2.4); k.say(0); k.score(); }); zone(0.52, 'slide', () => { if (sl < 0) { sl = 0; on = 'slide'; k.a.inflate(4); k.act('ride2', 2); k.say(1); k.score(); } }); zone(0.8, 'see', () => { see = see > 0 ? -1 : 1; on = 'see'; k.a.boing(); k.act('ride2', 2); k.score(); });
    let tilt = 0;
    return { step(dt) { ph += dt * 3; sw = Math.max(0.12, sw - dt * 0.1); tilt += ((see || 0.6) * 0.3 - tilt) * dt * 6; if (sl >= 0) { sl += dt * 0.55; if (sl > 1) sl = -1; } },
      back(c) { const u = k.U; c.lineCap = 'round'; c.strokeStyle = '#e8590c'; c.lineWidth = u * 0.5; const L = (a, b, d, e) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); };
        L(sx - u * 5, by, sx - u * 3, by - u * 9); L(sx + u * 5, by, sx + u * 3, by - u * 9); L(sx - u * 3, by - u * 9, sx + u * 3, by - u * 9); const a = Math.sin(ph) * sw, px = sx + Math.sin(a) * u * 6.5, py = by - u * 9 + Math.cos(a) * u * 6.5; c.strokeStyle = '#868e96'; c.lineWidth = u * 0.15; L(sx - u, by - u * 9, px - u, py); L(sx + u, by - u * 9, px + u, py); c.fillStyle = '#4dabf7'; c.fillRect(px - u * 1.3, py, u * 2.6, u * 0.5);
        c.strokeStyle = '#7048e8'; c.lineWidth = u * 0.4; L(lx - u * 4, by, lx - u * 4, by - u * 7); L(lx - u * 2.4, by, lx - u * 2.4, by - u * 7); for (let i = 1; i < 6; i++) L(lx - u * 4, by - u * i * 1.2, lx - u * 2.4, by - u * i * 1.2); c.strokeStyle = '#ffd43b'; c.lineWidth = u * 1.3; c.beginPath(); c.moveTo(lx - u * 2.6, by - u * 7); c.quadraticCurveTo(lx, by - u, lx + u * 5, by - u * 0.4); c.stroke();
        c.fillStyle = '#495057'; c.beginPath(); c.moveTo(ex, by - u * 1.6); c.lineTo(ex - u, by); c.lineTo(ex + u, by); c.fill(); c.save(); c.translate(ex, by - u * 1.6); c.rotate(tilt); c.fillStyle = '#f03e3e'; c.fillRect(-u * 6, -u * 0.3, u * 12, u * 0.6); sprite(c, '🐻', u * 5, -u * 1.6, u * 2.6); c.restore(); },
      hero(o) { const u = k.U; if (on === 'swing') { const a = Math.sin(ph) * sw; o.x = sx + Math.sin(a) * u * 6.5; o.y = by - u * 9 + Math.cos(a) * u * 6.5; o.p.rot = -a; } else if (on === 'slide') { const q = Math.max(0, sl), s = q < 0.3 ? 0 : (q - 0.3) / 0.7; o.x = q < 0.3 ? lx - u * 3.2 : lx - u * 2.6 + s * u * 7.6; o.y = q < 0.3 ? by - u * 7 * q / 0.3 : by - u * 7 * (1 - s) * (1 - s * 0.6) - u * 0.4; if (sl < 0) { o.x = lx + u * 5; o.y = by; } } else { o.x = ex - Math.cos(tilt) * u * 5; o.y = by - u * 2 - Math.sin(tilt) * u * 5; } o.p.arms = 1; o.p.happy = true; } };
  } },
  // 9. rainy lane: puddles splash mud, frogs leap between them
  rain: { sky: ['#8fa9bf', '#c9dbe6'], ground: '#79a860', deco: ['🏘️', '🌳', '☔', '🌳'], ride: '🚙', rain: true, notes: [0, 3, 5, 8], play(k) {
    const P = row(6, (i, u) => k.T('', at(u), k.Y(i % 2 ? 0.8 : 0.3), 4, { near: 'puddle', pud: 1, hit(th) { th.sq = 1; k.hero.mud = Math.min(1, k.hero.mud + 0.3); k.boom(th.x, th.y, 30, ['#7a4d2b', '#95683f', '#b98a5a']); k.a.boom(); k.act(pick(['jump', 'roll']), 1.3); k.say(); k.score(); } }));
    row(3, (i) => k.T('🐸', 0.2 + i * 0.28, P[i * 2 % 6].y, 2.4, { hit(th) { k.a.animal('frog'); const q = pick(P); th.fl = q.x > th.x ? -1 : 1; k.fly(th, q.x, q.y, 0.7, 7, () => { k.boom(q.x, q.y, 10, ['#95683f']); k.a.pop(); }); k.score(); } }));
    return { back(c) { c.fillStyle = '#7a4d2b'; for (const p of P) { c.beginPath(); c.ellipse(p.x, p.y, k.U * (2.6 + p.sq * 0.5), k.U * (0.9 + p.sq * 0.2), 0, 0, TAU); c.fill(); } } };
  } },
  // 10. birthday: light the candles, blow them out (touch the cake), confetti
  party: { sky: ['#ffd6ec', '#fff0f8'], ground: '#e5b8f4', deco: ['🎈', '🎀', '🎈', '🎊'], ride: '🎈', up: true, indoor: '#faa2c1', notes: [0, 4, 7, 9], play(k) {
    const cx = k.X(0.5), cy = k.Y(0.45), lit = row(5, () => 0); let blow = 0;
    row(5, (i) => k.T('', 0.5, 0, 2.4, { near: 'c', hit(th) { if (blow > 0) return; lit[i] = 1; k.a.note(i * 2); k.fx('star', th.x, th.y - k.U * 2, 3); k.say(0); k.score(); if (lit.every(Boolean)) { k.wait(0.8, () => { k.say(1); k.a.song?.(5); }); } } })).forEach((th, i) => { th.x = cx + (i - 2) * k.U * 2; th.y = cy - k.U * 4.8; });
    k.T('', 0.5, cy, 6, { near: 'cake', hit() { if (!lit.some(Boolean)) { k.a.chomp(); k.hero.belly = Math.min(1, k.hero.belly + 0.2); k.act('eat', 1.4); return; } blow = 1; k.a.whoosh(); lit.fill(0); k.boom(cx, cy - k.U * 6, 60); k.act('cheer', 1.6); k.say(2); k.score(2); } });
    ['🎁', '🥤', '🍕', '🍭'].forEach((e, i) => k.T(e, [0.1, 0.25, 0.75, 0.88][i], k.Y(0.8), 2.8, { hit(th) { k.a.chomp(); th.sq = 1; k.act('eat', 1); k.score(); } }));
    return { step(dt) { blow = Math.max(0, blow - dt); }, back(c) { const u = k.U; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(cx, cy, u * 7, u * 1.1, 0, 0, TAU); c.fill(); c.fillStyle = '#f783ac'; c.fillRect(cx - u * 5.5, cy - u * 2.6, u * 11, u * 2.6); c.fillStyle = '#ffdeeb'; c.fillRect(cx - u * 5, cy - u * 4.6, u * 10, u * 2); c.fillStyle = '#fff'; for (let i = 0; i < 11; i++) { c.beginPath(); c.arc(cx - u * 5 + i * u, cy - u * 2.6, u * 0.5, 0, Math.PI); c.fill(); }
      for (let i = 0; i < 5; i++) { const x = cx + (i - 2) * u * 2; c.fillStyle = PASTEL[i]; c.fillRect(x - u * 0.2, cy - u * 6.4, u * 0.4, u * 1.8); if (lit[i]) sprite(c, '🔥', x, cy - u * 7 + Math.sin(k.t() * 9 + i) * 2, u * 1.4); } } };
  } },
  // 11. kitchen: throw any three ingredients in the pot -> a surprise dish jumps out
  kitchen: { sky: ['#fff3bf', '#fff9db'], ground: '#d9a66f', deco: ['🍳', '🫖', '🍽️', '🧂'], ride: '🛺', indoor: '#ffe066', notes: [0, 2, 4, 5], play(k) {
    const pot = k.T('🍲', 0.5, k.Y(0.6), 7, { hit(th) { th.shake = 0.6; k.a.drum(3); } }); let n = 0; const DISH = shuffle(['🍜', '🍕', '🍰', '🍔', '🍦', '🥞', '🍩', '🦄', '🎈', '🍣']);
    shuffle(['🥕', '🥚', '🍅', '🧀', '🍄', '🥩', '🌽', '🦐', '🍋', '🧦']).slice(0, 8).forEach((e, i) => { const th = k.T(e, [0.06, 0.16, 0.27, 0.36, 0.64, 0.73, 0.83, 0.92][i], k.Y(i % 2 ? 0.95 : 0.25), 2.6, { hit(q) { if (q.busy) return; q.busy = 1; k.say(0); k.a.whoosh(); k.fly(q, pot.x, pot.y - k.U * 4, 0.6, 6, () => { k.a.pop(); pot.sq = 1; k.boom(pot.x, pot.y - k.U * 5, 10); q.hide = 1; k.wait(2.5, () => { q.hide = 0; q.busy = 0; q.x = q.hx; q.y = q.hy; }); n++; k.score(); if (n % 3 === 0) { pot.shake = 1; k.a.drum(1); k.wait(0.9, () => { k.a.boom(); k.say(1); const d = k.T(DISH[(n / 3) % DISH.length], 0.5, pot.y - k.U * 5, 4, { pass: true }); k.boom(pot.x, pot.y - k.U * 6, 30); k.fly(d, k.hero.x, k.Y(k.hero.fy) - k.U * 2, 1.2, 8, () => { k.kill(d); k.a.chomp(); k.act('eat', 1.4); }); }); } }); } }); th.hx = th.x; th.hy = th.y; });
  } },
  // 12. train: passengers hop on, every passenger adds a car; the locomotive drives a lap
  train: { sky: ['#d0ebff', '#fff'], ground: '#b7c58b', deco: ['⛰️', '🌲', '🏔️', '🌲'], ride: '🚄', notes: [0, 2, 4, 7], play(k) {
    const loco = { x: k.X(0.5), v: 0 }, cars = []; const y = k.Y(0.55);
    k.T('', 0.5, y, 5, { near: 'loco', pin: () => loco.x, hit() { loco.v = k.U * 18; k.a.toot(); k.say(1); k.act('ride2', 2.5); k.score(); } });
    ['🐶', '🐱', '🐰', '🐻', '🐷', '🐵', '🦊'].forEach((e, i) => k.T(e, at(i / 6), k.Y(i % 2 ? 0.98 : 0.05), 2.4, { hit(th) { if (th.on) { k.jump(th, 8); cry(k, e); return; } th.on = 1; cry(k, e); k.say(0); k.score(); cars.push(th); k.fly(th, loco.x - k.U * (4 + cars.length * 3.6), y, 0.6, 5); } }));
    const cx = (i) => loco.x - k.U * (3.8 + (i + 1) * 3.6 - 3.6);
    return { step(dt) { loco.v = Math.max(0, loco.v - dt * k.U * 5); loco.x += loco.v * dt; const len = k.U * (6 + cars.length * 3.6); if (loco.x - len > k.worldW) loco.x = -k.U * 3; if (loco.v > 0 && Math.random() < dt * 8) k.boom(loco.x + k.U, y - k.U * 4, 3, ['#fff', '#dee2e6']); cars.forEach((c, i) => { if (!c.tw) { c.x = cx(i); c.y = y - k.U * 1.2; } }); },
      back(c) { const u = k.U; c.fillStyle = '#8d6e4a'; for (let x = 0; x < k.worldW; x += u * 1.6) c.fillRect(x, y, u * 0.6, u * 0.7); c.fillStyle = '#868e96'; c.fillRect(0, y - 2, k.worldW, u * 0.2); },
      front(c) { const u = k.U; const wheel = (x) => { c.fillStyle = '#343a40'; c.beginPath(); c.arc(x, y - u * 0.4, u * 0.6, 0, TAU); c.fill(); }; cars.forEach((_, i) => { const x = cx(i); c.fillStyle = PASTEL[i % 7]; c.fillRect(x - u * 1.5, y - u * 1.9, u * 3, u * 1.3); wheel(x - u); wheel(x + u); }); c.fillStyle = '#e03131'; c.fillRect(loco.x - u * 2, y - u * 2.2, u * 4.2, u * 1.7); c.fillRect(loco.x - u * 2, y - u * 4, u * 1.8, u * 2); c.fillStyle = '#343a40'; c.fillRect(loco.x + u, y - u * 3.4, u * 0.8, u * 1.3); c.fillStyle = '#a5d8ff'; c.fillRect(loco.x - u * 1.7, y - u * 3.6, u * 1.2, u); [-1.2, 0.3, 1.6].forEach((d) => wheel(loco.x + d * u)); },
      hero(o) { o.x = loco.x - k.U * 1.1; o.y = y - k.U * 3.2; o.p.arms = 1; o.p.happy = true; } };
  } },
  // 13. space: no gravity, the hero floats; planets ring like bells, aliens peek out
  space: { sky: ['#14143c', '#3b2a78'], ground: '#4b4b87', deco: ['🪐', '⭐', '🌟', '☄️'], ride: '🚀', up: true, swim: true, dark: true, notes: [0, 4, 7, 11], play(k) {
    ['🌍', '🪐', '🌕', '🔴', '☀️', '🌑', '🟣'].forEach((e, i) => k.T(e, at(i / 6), k.H * (0.3 + (i * 0.41 % 0.6)), 3.6, { sway: 1, hit(th) { k.a.chime(i); th.spin = 1; k.fx('star', th.x, th.y - th.s / 2, 5); k.say(0); k.score(); if (Math.random() < 0.5) { const q = k.T('👽', th.x / k.worldW, th.y - k.U * 2, 2.4, { hit(z) { k.a.squeak?.(); k.a.giggle(); z.spin = 1; } }); k.a.boing(); k.say(1); k.fly(q, q.x + rnd(-6, 6) * k.U, q.y - k.U * 4, 1, 3); k.wait(5, () => k.kill(q)); } } }));
    k.T('🛸', 0.5, k.H * 0.2, 4, { hit(th) { k.a.whoosh(); k.fly(th, Math.random() * k.worldW, k.H * rnd(0.2, 0.6), 1, 2); k.score(); } });
  } },
  // 14. snow: a ball rolls with the finger and grows; three balls = a snowman
  snow: { sky: ['#cfe8ff', '#f8fbff'], ground: '#f3f8ff', deco: ['🌲', '🏔️', '🌲', '🎄'], ride: '🛷', snowing: true, notes: [0, 4, 7, 9], play(k) {
    let b = { x: k.X(0.3), r: 1, a: 0 }, stack = [], man = 0, lx = b.x; const y = () => k.Y(0.6), mx = k.X(0.62);
    row(3, (i) => k.T(['🐧', '🐻‍❄️', '🦊'][i], [0.1, 0.45, 0.85][i], k.Y(0.05), 2.8, { hit(th) { k.jump(th, 12); k.a.animal('honk'); k.boom(th.x, th.y, 10, ['#fff', '#dbeafe']); k.score(); } }));
    return { touch(x) { lx = x; if (Math.random() < 0.2) k.a.rustle(); k.say(0); }, step(dt) { const d = lx - b.x, v = Math.max(-k.U * 14, Math.min(k.U * 14, d * 3)); if (Math.abs(d) > 2 && man <= 0) { b.x += v * dt; b.a += v * dt / (b.r * k.U); b.r += Math.abs(v) * dt / k.U * 0.035; if (b.r > 2.6 - stack.length * 0.45) { stack.push(b.r); b = { x: k.X(0.3), r: 0.8, a: 0 }; lx = b.x; k.a.boing(); k.boom(mx, y() - k.U * 3, 20, ['#fff', '#dbeafe']); k.score(3); if (stack.length === 3) { man = 6; k.say(1); k.act('dance', 2.4); k.a.giggle(); } } } if (man > 0) { man -= dt; if (man <= 0) { stack = []; k.a.boom(); k.boom(mx, y() - k.U * 4, 50, ['#fff', '#dbeafe']); } } },
      front(c) { const u = k.U; let h = 0; const jig = man > 0 ? Math.sin(k.t() * 8) * u * 0.4 : 0; const ball = (x, yy, r, a) => { c.fillStyle = '#fff'; c.strokeStyle = '#b6cfe8'; c.lineWidth = 3; c.beginPath(); c.arc(x, yy, r, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(x, yy, r * 0.6, a, a + 1.4); c.stroke(); };
        stack.forEach((r, i) => { const R = r * u; ball(mx + jig * i, y() - h - R, R, 0); if (i === 2) { const yy = y() - h - R; c.fillStyle = '#222'; for (const d of [-0.35, 0.35]) { c.beginPath(); c.arc(mx + jig * i + d * R, yy - R * 0.2, R * 0.12, 0, TAU); c.fill(); } sprite(c, '🥕', mx + jig * i, yy + R * 0.25, R * 0.7, { rot: 0.8 }); sprite(c, '🎩', mx + jig * i, yy - R * 1.3, R * 1.6); } h += R * 1.6; }); if (man <= 0) ball(b.x, y() + u - b.r * u, b.r * u, b.a); } };
  } },
  // 15. night forest: only eyes; touch = the animal lights up
  forest: { sky: ['#0f2027', '#1f4037'], ground: '#173a2a', deco: ['🌲', '🌳', '🌲', '🌲'], ride: '🚙', dark: true, notes: [0, 3, 7, 10], play(k) {
    const L = []; ['🦉', '🦊', '🐻', '🐺', '🐿️', '🦔', '🐰', '🦌'].forEach((e, i) => { const th = k.T(e, at(i / 7, 0.06, 0.9), i % 3 === 0 ? k.H * 0.3 : k.Y((i * 0.37) % 1), 3.4, { off: 1, hit(q) { q.off = 0; q.sq = 1; k.a.twinkle(); cry(k, e); k.say(0); k.fx('star', q.x, q.y - q.s, 4); k.score(); clearTimeout(0); q.lit = 4; if (L.every((z) => !z.off)) { k.say(1); L.forEach((z) => k.jump(z, 12)); k.act('dance', 2); k.a.song?.(4); } } }); L.push(th); });
    const fl = row(14, () => ({ x: Math.random(), y: rnd(0.15, 0.9), p: Math.random() * 9 }));
    return { step(dt) { for (const q of L) if (!q.off && (q.lit -= dt) <= 0) q.off = 1; }, front(c) { for (const q of L) if (q.off) { c.fillStyle = '#fff9c4'; const b = Math.sin(k.t() * 2 + q.x) > 0.95 ? 0.1 : 1; for (const d of [-0.5, 0.5]) { c.beginPath(); c.ellipse(q.x + d * k.U, q.y - q.s * 0.6, k.U * 0.35, k.U * 0.42 * b, 0, 0, TAU); c.fill(); } } for (const f of fl) { c.fillStyle = `rgba(255,240,130,${0.4 + 0.4 * Math.sin(k.t() * 2 + f.p)})`; c.beginPath(); c.arc(f.x * k.worldW + Math.sin(k.t() + f.p) * k.U * 2, f.y * k.H, k.U * 0.22, 0, TAU); c.fill(); } } };
  } },
  // 16. circus: climb into the cannon, boom, the hero flies over the tent
  circus: { sky: ['#ffc9c9', '#fff3bf'], ground: '#f4c27a', deco: ['🎪', '🎠', '🎪', '🎟️'], ride: '🚐', notes: [0, 2, 4, 7], play(k) {
    let fly = -1, sx = 0; const cx = k.X(0.22), cy = k.Y(0.6);
    k.T('', 0.22, cy, 6, { near: 'cannon', hit() { if (fly >= 0) return; k.a.inflate(4); k.say(0); sx = 0.6; k.act('ride2', 3.4); k.wait(0.9, () => { fly = 0; k.a.boom(); k.boom(cx + k.U * 3, cy - k.U * 4, 40); k.score(3); }); } });
    ['🐘', '🦁', '🐒', '🤡'].forEach((e, i) => k.T(e, 0.4 + i * 0.15, k.Y(i % 2 ? 0.95 : 0.15), 4, { hit(th) { const ball = k.T('🔴', th.x / k.worldW, th.y - th.s, 1.6, { pass: true }); cry(k, e); k.a.boing(); th.sq = 1; ball.g = k.U * 30; ball.vy = -k.U * 22; ball.floor = th.y - th.s * 0.9; k.wait(3, () => k.kill(ball)); k.score(); k.say(1); } }));
    return { step(dt) { if (fly >= 0) { fly += dt * 0.5; if (fly > 1) { fly = -1; k.hero.x = k.hero.tx = k.X(0.7); k.hero.fy = k.hero.tfy = 0.6; k.a.boing(); } } }, front(c) { const u = k.U; c.save(); c.translate(cx, cy - u * 1.4); c.rotate(-0.7); c.fillStyle = '#364fc7'; c.fillRect(-u * 1.5, -u * 1.4, u * 5.5, u * 2.8); c.fillStyle = '#ffd43b'; c.fillRect(u * 3.4, -u * 1.6, u * 0.8, u * 3.2); c.restore(); c.fillStyle = '#862e2e'; c.beginPath(); c.arc(cx, cy - u * 0.6, u * 1.3, 0, TAU); c.fill(); },
      hero(o) { if (fly < 0) { o.x = cx + k.U * 2; o.y = cy - k.U * 2.4; } else { o.x = cx + k.U * 3 + (k.X(0.7) - cx - k.U * 3) * fly; o.y = cy - k.U * 3 - Math.sin(fly * Math.PI) * k.H * 0.42 + fly * k.U * 3; o.p.rot = fly * TAU * 3; } o.p.arms = 1; o.p.happy = true; } };
  } },
  // 17. band: each instrument switches its own loop on and off, together they make a song
  band: { sky: ['#3b1d60', '#7048e8'], ground: '#5f3dc4', deco: ['🎵', '🎶', '💡', '🎵'], ride: '🚌', dark: true, indoor: '#7950f2', notes: [], play(k) {
    const I = ['🥁', '🎹', '🎸', '🎺', '🎻', '🔔'].map((e, i) => k.T(e, at(i / 5, 0.1, 0.84), k.Y(i % 2 ? 0.85 : 0.25), 4, { on: 0, hit(th) { th.on = th.on ? 0 : 1; th.sq = 1; k.say(th.on ? 0 : 1); k.score(); play1(i, 0); } })); let b = 0, bt = 0;
    const PAT = ['x...x...x...x.x.', 'x..x..x.x..x..x.', '..x...x...x...x.', '........x.x.xx..', 'x.......x.......', '....x.......x..x']; const MEL = [[0], [0, 4, 7, 4, 5, 9], [2, 4, 2, 7], [7, 9, 11, 7], [0, 5], [12, 14]]; const pos = [0, 0, 0, 0, 0, 0];
    const play1 = (i) => { const n = MEL[i][pos[i]++ % MEL[i].length]; if (i === 0) k.a.drum(pos[0] % 2 ? 0 : 3); else if (i === 5) k.a.chime(n); else k.a.note(n); I[i].sq = 0.7; if (Math.random() < 0.4) k.fx('note', I[i].x, I[i].y - I[i].s, 1); };
    return { step(dt) { b -= dt; if (b <= 0) { b += 0.17; bt = (bt + 1) % 16; I.forEach((th, i) => { if (th.on && PAT[i][bt] === 'x') play1(i); }); if (I.filter((q) => q.on).length >= 2) k.party(); } }, back(c) { I.forEach((th, i) => { if (th.on) { c.fillStyle = `rgba(255,255,255,${0.15 + 0.1 * Math.sin(k.t() * 8 + i)})`; c.beginPath(); c.moveTo(th.x, 0); c.lineTo(th.x - k.U * 3, th.y); c.lineTo(th.x + k.U * 3, th.y); c.fill(); } }); } };
  } },
  // 18. football: the ball flies to the goal, the goalkeeper dives
  football: { sky: ['#9be0ff', '#e6fbff'], ground: '#51b749', deco: ['👏', '🙌', '🎉', '👏'], ride: '🚌', notes: [0, 2, 4, 7], play(k) {
    const gx = k.X(0.82), gyy = k.Y(0.5), keep = k.T('🐻', 0.82, gyy + 2, 4, { hit(th) { k.jump(th, 10); cry(k, '🐻'); } }); let goals = 0;
    const ball = k.T('⚽', 0.5, k.Y(0.6), 2.2, { hit(th) { if (th.tw) return; k.a.boing(); k.act('cheer', 0.8); const save = Math.random() < 0.3, ty = gyy - rnd(0.5, 4) * k.U, tx = gx + rnd(-3, 3) * k.U; k.fly(keep, save ? tx : gx - (tx - gx), gyy + 2, 0.5, 2); th.spin = 1; k.score(); k.fly(th, tx, ty, 0.6, 5, () => { if (save) { k.a.boop?.(); k.say(1); k.a.giggle(); } else { goals++; k.say(0); k.a.song?.(3); k.boom(gx, gyy - k.U * 4, 40); k.act('dance', 1.8); k.party(); } k.wait(0.9, () => k.fly(th, k.X(rnd(0.25, 0.6)), k.Y(rnd(0.3, 0.9)), 0.7, 3)); }); } });
    return { back(c) { const u = k.U; c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(gx + i * u, gyy - u * 6); c.lineTo(gx + i * u, gyy); c.stroke(); } for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(gx - u * 6, gyy - u * i); c.lineTo(gx + u * 6, gyy - u * i); c.stroke(); } c.lineWidth = u * 0.5; c.strokeStyle = '#fff'; c.strokeRect(gx - u * 6, gyy - u * 6, u * 12, u * 6); for (let i = 0; i < goals % 8; i++) sprite(c, '⚽', gx - u * 5 + i * u * 1.4, gyy - u * 7.2, u * 1.2); } };
  } },
  // 19. water park: ducks and floats bob, every touch makes a fountain that throws them up
  pool: { sky: ['#8be0ff', '#e3fbff'], ground: '#33bdea', deco: ['⛱️', '🌴', '🏖️', '🌴'], ride: '🚤', notes: [0, 2, 5, 7], play(k) {
    const F = []; let things = row(7, (i, u) => { const e = ['🦆', '🛟', '🐢', '🦆', '🏐', '🦩', '🐳'][i], y = k.Y(i % 2 ? 0.8 : 0.2); return k.T(e, at(u), y, 3, { sway: 1, hit(th) { if (!th.vy) { k.jump(th, 18); th.spin = Math.random() < 0.4 ? 1 : 0; } cry(k, e); k.say(0); k.score(); } }); });
    return { touch(x, y, drag) { if (y < k.gy || (drag && Math.random() > 0.15)) return; F.push({ x, y, t: 0 }); k.a.whoosh(); if (!drag) { k.a.pop(); k.say(1); } for (const th of things) if (Math.abs(th.x - x) < k.U * 3 && Math.abs(th.y - y) < k.U * 5 && !th.vy) k.jump(th, 18); if (F.length > 8) F.shift(); }, step(dt) { for (const f of F) f.t += dt; while (F[0]?.t > 1.4) F.shift(); },
      front(c) { for (const f of F) { c.fillStyle = `rgba(235,250,255,${1 - f.t / 1.4})`; for (let i = 0; i < 12; i++) { const a = (i - 5.5) * 0.12, q = (f.t * 1.6 + i * 0.03) % 1; c.beginPath(); c.arc(f.x + Math.sin(a) * q * k.U * 7, f.y - Math.sin(q * Math.PI) * k.U * 7, k.U * 0.3, 0, TAU); c.fill(); } } c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; for (let r = 0; r < 3; r++) { c.beginPath(); for (let i = 0; i <= 24; i++) c.lineTo(k.cam() + k.W * i / 24, k.gy + (k.H - k.gy) * (0.25 + r * 0.27) + Math.sin(i + k.t() * 2 + r) * 4); c.stroke(); } } };
  } },
  // 20. fire station: the hose follows the finger and puts out the flames
  fire: { sky: ['#ffd8a8', '#fff4e6'], ground: '#adb5bd', deco: ['🏢', '🏠', '🏬', '🏠'], ride: '🚒', notes: [0, 3, 5, 7], play(k) {
    const drops = []; let spray = 0; const big = ['🏠', '🏢', '🏫'].map((e, i) => k.T(e, 0.2 + i * 0.28, k.Y(0.15), 8, { pass: true })), fires = [];
    big.forEach((b) => row(3, (i) => { const f = k.T('🔥', 0, b.y - k.U * (1 + i * 2), 2.6, { hp: 1, home: 1, hit: (q) => wet(q, 0.5) }); f.x = b.x + (i - 1) * k.U * 2; fires.push(f); }));
    const wet = (f, d) => { if (f.hide) return; f.hp -= d; f.s = k.U * 2.6 * Math.max(0.3, f.hp); if (f.hp <= 0) { f.hide = 1; k.a.whoosh(); k.boom(f.x, f.y - k.U, 14, ['#fff', '#dee2e6']); k.say(1); k.score(); k.wait(6, () => { f.hide = 0; f.hp = 1; f.s = k.U * 2.6; }); if (fires.every((q) => q.hide)) { k.act('dance', 2); k.party(); k.a.song?.(3); } } };
    return { touch(x, y) { spray = 0.4; k.say(0); if (Math.random() < 0.3) k.a.whoosh(); for (const f of fires) if (Math.hypot(f.x - x, f.y - k.U - y) < k.U * 2.6) wet(f, 0.3); }, step(dt) { spray = Math.max(0, spray - dt); for (const f of fires) f.shake = 0.2; if (spray > 0) for (let i = 0; i < 3; i++) drops.push({ t: rnd(0, 0.1), x: k.finger.x + rnd(-1, 1) * k.U, y: k.finger.y + rnd(-1, 1) * k.U }); for (const d of drops) d.t += dt * 2.4; while (drops.length > 90 || drops[0]?.t > 1) drops.shift(); },
      front(c) { const hx = k.hero.x + k.hero.dir * k.U * 1.4, hy = k.Y(k.hero.fy) - k.U * 2; c.fillStyle = 'rgba(70,170,255,.8)'; for (const d of drops) { c.beginPath(); c.arc(hx + (d.x - hx) * d.t, hy + (d.y - hy) * d.t - Math.sin(d.t * Math.PI) * k.U * 3, k.U * 0.32, 0, TAU); c.fill(); } } };
  } },
  // 21. clinic: sore toys get a plaster and a kiss, then they dance
  clinic: { sky: ['#d3f9ff', '#f8fdff'], ground: '#c5f0e3', deco: ['💊', '🩺', '❤️', '🧸'], ride: '🚑', indoor: '#99e9f2', notes: [0, 4, 5, 9], play(k) {
    ['🧸', '🐰', '🐶', '🐱', '🐼', '🦁'].forEach((e, i) => k.T(e, at(i / 5), k.Y(i % 2 ? 0.85 : 0.2), 4, { sick: 1, hit(th) { if (th.sick) { th.sick = 0; k.a.chime(i); k.fx('heart', th.x, th.y - th.s, 6); k.say(0); k.score(2); k.wait(0.5, () => { k.jump(th, 14); cry(k, e); }); k.wait(9, () => { th.sick = 1; }); } else { k.jump(th, 10); cry(k, e); k.say(1); } } }));
    return { front(c) { for (const th of k.things()) if ('sick' in th) { if (th.sick) { sprite(c, '🤒', th.x + th.s * 0.4, th.y - th.s + Math.sin(k.t() * 3) * 3, k.U * 1.6); sprite(c, '💧', th.x - th.s * 0.4, th.y - th.s * 0.6 + (k.t() * 30 % 20), k.U * 0.8); } else sprite(c, '🩹', th.x + th.s * 0.2, th.y - th.s * 0.75 + th.oy, k.U * 1.1, { rot: 0.5 }); } } };
  } },
  // 22. building site: the crane stacks blocks to a tower, the wrecking ball knocks it down
  build: { sky: ['#ffe8cc', '#fff9f0'], ground: '#c9a66b', deco: ['🏗️', '🏢', '🚧', '🏗️'], ride: '🚚', notes: [0, 2, 5, 7], play(k) {
    const B = []; let fall = 0, ba = 0, sw = 0; const tx = k.X(0.5), by = k.Y(0.5), bh = () => k.U * 1.5;
    row(5, (i) => k.T(['🧱', '🪵', '📦', '🟦', '🟨'][i], [0.08, 0.2, 0.3, 0.7, 0.82][i], k.Y(0.85), 2.8, { hit(th) { if (fall > 0) return; k.a.drum(B.length); const q = k.T(th.e, th.x / k.worldW, th.y, 2, { pass: true }); B.push(q); const n = B.length; k.say(0); k.score(); k.fly(q, tx + rnd(-0.4, 0.4) * k.U, by - (n - 1) * bh(), 0.6, 6, () => { k.a.boop?.(); k.a.pop(); }); if (n >= 8) k.say(1); } }));
    k.T('⚫', 0.66, k.Y(0.1), 3, { hit() { sw = 1; k.a.whoosh(); k.wait(0.5, () => { if (!B.length) return; k.a.boom(); k.boom(tx, by - k.U * 3, 40, ['#b08968', '#dee2e6']); k.say(2); k.act('cheer', 1.5); B.splice(0).forEach((q) => { q.g = k.U * 40; q.vy = -k.U * rnd(4, 18); q.vx = -k.U * rnd(2, 14); q.floor = k.Y(rnd(0.4, 1)); q.spin = 1; k.wait(2.2, () => k.kill(q)); }); k.score(3); }); } });
    return { step(dt) { sw = Math.max(0, sw - dt); const th = k.all('⚫')[0]; if (th) th.x = k.X(0.66) - Math.sin(Math.min(1, (1 - sw) * 1) * Math.PI * (sw > 0 ? 1 : 0)) * (k.X(0.66) - tx); }, back(c) { const th = k.all('⚫')[0]; c.strokeStyle = '#495057'; c.lineWidth = 4; c.beginPath(); c.moveTo(k.X(0.6), 0); if (th) c.lineTo(th.x, th.y - th.s); c.stroke(); } };
  } },
  // 23. airport: planes take off from the touch, loop and leave a coloured trail
  airport: { sky: ['#74c0fc', '#e7f5ff'], ground: '#868e96', deco: ['🗼', '🏢', '🌳', '🏢'], ride: '✈️', up: true, notes: [0, 2, 4, 9], play(k) {
    const fl = []; ['✈️', '🚁', '🛩️', '🎈', '🪂', '🚀'].forEach((e, i) => k.T(e, at(i / 5), k.Y(i % 2 ? 0.85 : 0.3), 3.4, { fl: e === '✈️' || e === '🚀' ? 1 : -1, hit(th) { if (th.fly) { th.spin = 1; k.a.giggle(); return; } th.fly = 0.001; th.x0 = th.x; th.y0 = th.y; th.c = PASTEL[i]; th.tr = []; fl.push(th); k.a.inflate(4); k.a.whoosh(); k.say(0); k.score(); k.act('cheer', 1); } }));
    return { step(dt) { for (const th of [...fl]) { th.fly += dt * 0.28; const u = th.fly; th.x = th.x0 + Math.sin(u * TAU * 2) * k.U * 7; th.y = th.y0 - Math.sin(u * Math.PI) * (th.y0 - k.H * 0.2) + Math.sin(u * TAU * 2) * k.U; th.tr.push([th.x, th.y - th.s / 2]); if (th.tr.length > 70) th.tr.shift(); if (u >= 1) { th.fly = 0; th.x = th.x0; th.y = th.y0; th.tr = []; fl.splice(fl.indexOf(th), 1); k.a.boing(); k.say(1); } } },
      back(c) { c.lineCap = 'round'; for (const th of fl) { c.strokeStyle = th.c; c.globalAlpha = 0.6; c.lineWidth = k.U * 0.7; c.beginPath(); for (const [x, y] of th.tr) c.lineTo(x, y); c.stroke(); c.globalAlpha = 1; } c.fillStyle = '#fff'; for (let x = 0; x < k.worldW; x += k.U * 4) c.fillRect(x, k.Y(0.58), k.U * 2, k.U * 0.25); } };
  } },
  // 24. paint room: every swipe leaves colour on the wall, touches stamp pictures
  paint: { sky: ['#fffdf7', '#fffdf7'], ground: '#e9d8a6', deco: [], ride: '🛴', indoor: '#f1f3f5', notes: [0, 4, 7, 9], play(k) {
    const dots = []; let hue = 0, last = null; const ST = ['🌈', '🌸', '🦋', '🌟', '🐠', '🍀', '🚗', '🐞']; let n = 0;
    ['🔴', '🟡', '🟢', '🔵', '🟣'].forEach((e, i) => k.T(e, at(i / 4, 0.15, 0.8), k.Y(0.97), 2.6, { hit(th) { hue = i * 72; th.sq = 1; k.a.note(i * 2); k.boom(th.x, th.y - k.U * 2, 20, [`hsl(${hue},85%,60%)`]); k.score(); } }));
    return { touch(x, y, drag, hit) { if (hit) return; if (drag) { hue = (hue + 2) % 360; dots.push({ x, y, l: last, c: `hsl(${hue},85%,60%)` }); last = [x, y]; k.say(0); } else { last = [x, y]; dots.push({ x, y, e: ST[n++ % ST.length], r: rnd(2.5, 4) }); k.a.pop(); k.a.chime(n); k.say(1); k.score(); } if (dots.length > 350) dots.splice(0, 50); }, back(c) { c.lineCap = 'round'; c.lineWidth = k.U * 1.3; for (const d of dots) if (d.e) sprite(c, d.e, d.x, d.y, d.r * k.U); else if (d.l && Math.hypot(d.x - d.l[0], d.y - d.l[1]) < k.U * 8) { c.strokeStyle = d.c; c.beginPath(); c.moveTo(...d.l); c.lineTo(d.x, d.y); c.stroke(); } else { c.fillStyle = d.c; c.beginPath(); c.arc(d.x, d.y, k.U * 0.65, 0, TAU); c.fill(); } } };
  } },
  // 25. disco floor: tiles light and ring under fingers and feet
  disco: { sky: ['#2b1055', '#7597de'], ground: '#1b1035', deco: ['🪩', '✨', '🪩', '✨'], ride: '🏎️', dark: true, notes: [], play(k) {
    const C = 10, R = 4, lit = Array(C * R).fill(0); let prev = -1; const cell = (x, y) => { const i = Math.floor(x / k.worldW * C), j = Math.floor((y - k.gy) / (k.H - k.gy) * R); return i < 0 || j < 0 || i >= C || j >= R ? -1 : j * C + i; };
    const on = (q) => { if (q < 0) return; lit[q] = 1; if (q !== prev) { prev = q; k.a.note((q % C) + (R - 1 - Math.floor(q / C)) * 2); k.score(0.4); } };
    k.T('🪩', 0.5, k.H * 0.3, 5, { hit(th) { th.spin = 1; lit.fill(1); k.a.song?.(5); k.party(); k.act('dance', 3); k.say(1); } });
    return { touch(x, y) { const q = cell(x, y); on(q); if (q >= 0) { k.say(0); } }, step(dt) { for (let i = 0; i < lit.length; i++) lit[i] = Math.max(0, lit[i] - dt * 0.5); if (k.hero.walk) on(cell(k.hero.x, k.Y(k.hero.fy))); }, back(c) { const w = k.worldW / C, h = (k.H - k.gy) / R; for (let i = 0; i < lit.length; i++) { const x = (i % C) * w, y = k.gy + Math.floor(i / C) * h; c.fillStyle = PASTEL[(i + Math.floor(i / C) * 2) % 7]; c.globalAlpha = 0.18 + 0.8 * lit[i]; c.fillRect(x + 2, y + 2, w - 4, h - 4); } c.globalAlpha = 0.12; for (let i = 0; i < 6; i++) { c.fillStyle = PASTEL[i]; c.beginPath(); const a = k.t() * 0.6 + i; c.moveTo(k.X(0.5), k.H * 0.2); c.lineTo(k.X(0.5) + Math.sin(a) * k.worldW, k.H); c.lineTo(k.X(0.5) + Math.sin(a + 0.15) * k.worldW, k.H); c.fill(); } c.globalAlpha = 1; } };
  } },
  // 26. fishing: touch the pond, something unexpected comes up on the line
  fishing: { sky: ['#b5e8ff', '#f4fff0'], ground: '#5fb3d4', deco: ['🌾', '🌳', '🌾', '🛖'], ride: '🛶', notes: [0, 2, 7, 9], play(k) {
    const BAG = shuffle(['🐟', '👢', '👑', '🐠', '🦀', '🧦', '🐙', '💎', '🐢', '⌚', '🦆', '🧸']); let n = 0, line = null;
    row(5, (i, u) => k.T('🌊', at(u), k.Y(i % 2 ? 0.9 : 0.4), 2.4, { sway: 1, hit: (th) => cast(th.x, th.y) }));
    const cast = (x, y) => { if (line) return; line = { x, y, t: 0 }; k.a.pop(); k.say(0); k.wait(1, () => { const e = BAG[n++ % BAG.length], q = k.T(e, x / k.worldW, y, 3.4, { hit(z) { k.jump(z, 12); cry(k, z.e); } }); k.a.splash?.(); k.a.boing(); k.boom(x, y, 26, ['#a5e3ff', '#fff']); k.say(1 + (n % 2)); k.act('cheer', 1.4); k.score(2); q.spin = 1; k.fly(q, k.hero.x + k.hero.dir * k.U * 4, k.Y(k.hero.fy), 0.9, 9, () => k.wait(4, () => { k.fly(q, x, y, 0.7, 6, () => { k.kill(q); k.a.pop(); }); })); line = null; }); };
    return { touch(x, y, drag, hit) { if (!drag && !hit && y > k.gy) cast(x, y); }, front(c) { const hx = k.hero.x + k.hero.dir * k.U * 1.2, hy = k.Y(k.hero.fy) - k.U * 2; c.strokeStyle = '#8a5a35'; c.lineWidth = k.U * 0.25; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + k.hero.dir * k.U * 3, hy - k.U * 3); c.stroke(); if (line) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx + k.hero.dir * k.U * 3, hy - k.U * 3); c.lineTo(line.x, line.y + Math.sin(k.t() * 18) * 5); c.stroke(); sprite(c, '🔴', line.x, line.y + Math.sin(k.t() * 18) * 5, k.U); } } };
  } },
  // 27. butterfly garden: flowers bloom, butterflies come and settle on the hero
  garden: { sky: ['#8fdcff', '#e6fbff'], ground: '#74c25a', deco: ['🌳', '🌸', '🌳', '🌷'], ride: '🚗', notes: [0, 2, 4, 7], play(k) {
    const bf = []; row(8, (i, u) => k.T('🌱', at(u, 0.06, 0.88), k.Y((i * 0.39) % 1), 2, { hit(th) { const F = ['🌷', '🌻', '🌹', '🌼', '🌸', '🪻', '🌺', '💐']; if (th.e === '🌱') { th.e = F[i]; th.s = k.U * 3; k.a.chime(i); k.say(0); } else { k.say(1); k.a.twinkle(); } th.sq = 1; k.boom(th.x, th.y - k.U * 2, 12, PASTEL); k.score(); if (bf.length < 9) bf.push(Object.assign(k.T('🦋', th.x / k.worldW, th.y - k.U * 3, 1.6, { pass: true }), { ph: Math.random() * 9 })); } }));
    return { step(dt) { bf.forEach((b, i) => { const rest = !k.hero.walk, a = k.t() * 1.5 + b.ph, r = rest ? k.U * 1.2 : k.U * 4; const tx = k.hero.x + Math.cos(a + i) * r, ty = k.Y(k.hero.fy) - k.U * (rest ? 3 : 5) + Math.sin(a * 1.7 + i) * r * 0.5; b.x += (tx - b.x) * dt * 2; b.y += (ty - b.y) * dt * 2; b.flap = 1; }); } };
  } },
  // 28. lantern night: touched lanterns glow and float up into the sky
  lantern: { sky: ['#0b1445', '#37306b'], ground: '#2b2a55', deco: ['🏮', '🎋', '🏮', '🌕'], ride: '🎈', up: true, dark: true, notes: [0, 2, 7, 9], play(k) {
    const up = []; const mk = (i) => k.T('🏮', at(i / 7, 0.06, 0.88), k.Y((i * 0.43) % 1), 2.6, { hit(th) { if (th.up) { th.spin = 1; k.a.chime(i); return; } th.up = 1; up.push(th); k.a.chime(i); k.a.inflate(3); k.say(0); k.score(); k.wait(1, () => mk(i)); if (up.length === 8) { k.say(1); k.act('cheer', 2); } if (up.length > 16) k.kill(up.shift()); } }); row(8, mk);
    k.T('🐰', 0.3, k.Y(0.95), 2.6, { hit(th) { k.jump(th, 14); k.a.squeak?.(); k.a.giggle(); } });
    return { step(dt) { up.forEach((th, i) => { th.y += (k.H * (0.12 + (i % 4) * 0.1) + th.s - th.y) * dt * 0.6; th.x += Math.sin(k.t() + i) * dt * k.U; }); }, back(c) { for (const th of up) { c.fillStyle = 'rgba(255,200,90,.22)'; c.beginPath(); c.arc(th.x, th.y - th.s / 2, k.U * 2.6, 0, TAU); c.fill(); } } };
  } },
  // 29. Tết: the lion chases the finger, red envelopes burst, firecrackers chain
  tet: { sky: ['#ffd8a8', '#fff3bf'], ground: '#e8a27c', deco: ['🌸', '🏮', '🎋', '🧨'], ride: '🛺', sign: 'CHÚC MỪNG NĂM MỚI', notes: [0, 2, 4, 7], play(k) {
    const lion = k.T('🐲', 0.4, k.Y(0.4), 4.4, { pass: true }), seg = row(5, () => ({ x: lion.x, y: lion.y })); let dr = 0;
    row(5, (i, u) => k.T('🧧', at(u), k.Y(i % 2 ? 0.95 : 0.1), 2.6, { hit(th) { if (th.hide) return; th.hide = 1; k.a.rustle(); k.fx('star', th.x, th.y - k.U, 8); k.a.chime(i * 2); k.say(1); k.score(); k.wait(4, () => { th.hide = 0; th.sq = 1; }); } }));
    row(2, (i) => k.T('🧨', 0.3 + i * 0.4, k.H * 0.4, 3, { hit(th) { if (th.busy) return; th.busy = 1; k.say(2); row(7, (j) => k.wait(j * 0.16, () => { k.a.pop(); k.a.drum(j); k.boom(th.x + rnd(-2, 2) * k.U, th.y + j * k.U * 0.4, 12, ['#ff6b6b', '#ffd43b']); })); k.wait(1.5, () => { th.busy = 0; }); k.act('jump', 1.4); k.score(); } }));
    return { touch(x, y) { k.say(0); }, step(dt) { const dx = k.finger.x - lion.x, dy = Math.max(k.gy + k.U, k.finger.y) - lion.y, m = Math.hypot(dx, dy); if (m > k.U * 2) { lion.x += dx * dt * 2.2; lion.y += dy * dt * 2.2; lion.fl = dx > 0 ? -1 : 1; dr -= dt; if (dr <= 0) { dr = 0.28; k.a.drum(Math.random() < 0.5 ? 1 : 4); } } let px = lion.x, py = lion.y; for (const s of seg) { const d = Math.hypot(px - s.x, py - s.y), w = k.U * 1.5; if (d > w) { s.x += (px - s.x) * (d - w) / d; s.y += (py - s.y) * (d - w) / d; } px = s.x; py = s.y; } },
      back(c) { seg.forEach((s, i) => { c.fillStyle = i % 2 ? '#ffd43b' : '#f03e3e'; c.beginPath(); c.arc(s.x, s.y - k.U * 1.6 + Math.sin(k.t() * 10 + i) * k.U * 0.3, k.U * (1.5 - i * 0.14), 0, TAU); c.fill(); }); } };
  } },
  // 30. dinosaur valley: big eggs crack in three taps, babies march behind the hero
  dinoland: { sky: ['#ffc078', '#fff3bf'], ground: '#a3b86c', deco: ['🌋', '🌴', '🌿', '🌴'], ride: '🚙', notes: [0, 3, 5, 10], play(k) {
    const kids = []; row(6, (i, u) => k.T('🥚', at(u), k.Y(i % 2 ? 0.9 : 0.15), 4, { n: 0, hit(th) { if (th.hide) return; th.n++; th.shake = 0.6; k.a.drum(th.n); k.say(0); if (th.n >= 3) { th.hide = 1; k.a.pop(); k.a.roar?.(); k.a.animal('roar'); k.boom(th.x, th.y - k.U * 2, 30, ['#fff', '#ffe8cc']); const q = k.T(i % 2 ? '🦕' : '🦖', th.x / k.worldW, th.y, 3, { hit(z) { k.jump(z, 10); k.a.animal('roar'); } }); kids.push(q); k.say(1); k.score(3); k.wait(12, () => { th.hide = 0; th.n = 0; th.sq = 1; }); if (kids.length > 6) k.kill(kids.shift()); } } }));
    k.T('🌋', 0.5, k.Y(0.02), 7, { hit(th) { th.shake = 1; k.a.boom(); row(5, (j) => k.wait(j * 0.15, () => k.boom(th.x, th.y - th.s, 14, ['#ff6b6b', '#ffa94d', '#ffd43b']))); k.act('jump', 1); } });
    return { step(dt) { kids.forEach((q, i) => { const tx = k.hero.x - k.hero.dir * k.U * (4 + i * 2.6), d = tx - q.x; q.x += d * dt * 1.6; if (Math.abs(d) > 6) q.fl = d > 0 ? -1 : 1; if (!q.vy) q.y += (k.Y(0.75) - q.y) * dt; }); } };
  } },
  // 31. car wash: rub the mud off; a clean car shines and honks
  carwash: { sky: ['#c5f6fa', '#f1fcff'], ground: '#ced4da', deco: ['🚿', '🧼', '🫧', '🧽'], ride: '🏎️', indoor: '#99e9f2', notes: [0, 2, 4, 5], play(k) {
    const cars = ['🚗', '🚌', '🚚'].map((e, i) => k.T(e, 0.2 + i * 0.28, k.Y(i % 2 ? 0.8 : 0.4), 7, { big: 1, hit(th) { if (th.clean) { k.a.toot(); k.jump(th, 9); } } })); const soil = (th) => { th.clean = 0; th.mud = row(9, () => ({ x: rnd(-0.38, 0.38), y: rnd(-0.65, -0.2), r: rnd(0.5, 1.1), hp: 1 })); }; cars.forEach(soil);
    return { touch(x, y, drag) { k.say(0); if (Math.random() < 0.3) { k.a.pop(); k.fx('bubble', x, y, 2); } for (const th of cars) if (!th.clean) { for (const m of th.mud) if (Math.hypot(th.x + m.x * th.s - x, th.y + m.y * th.s - y) < k.U * 2.2) { m.hp -= drag ? 0.25 : 0.6; if (m.hp <= 0 && !m.gone) { m.gone = 1; k.a.squeak?.(); k.a.chime(3); k.score(0.5); } } if (th.mud.every((m) => m.hp <= 0)) { th.clean = 1; k.a.toot(); k.fx('star', th.x, th.y - th.s, 14); k.say(1); k.act('dance', 1.8); k.jump(th, 10); k.wait(10, () => { if (th.clean) soil(th); }); } } },
      front(c) { c.fillStyle = '#7a4d2b'; for (const th of cars) for (const m of th.mud) if (m.hp > 0) { c.globalAlpha = Math.max(0.15, m.hp); c.beginPath(); c.ellipse(th.x + m.x * th.s, th.y + m.y * th.s + th.oy, m.r * k.U, m.r * k.U * 0.75, 0, 0, TAU); c.fill(); } c.globalAlpha = 1; } };
  } },
  // 32. candy land: jelly trampolines throw the hero high, candies rain
  candy: { sky: ['#ffd6ff', '#e7f5ff'], ground: '#ffb3d9', deco: ['🍭', '🧁', '🍬', '🍩'], ride: '🎠', notes: [0, 4, 7, 11], play(k) {
    let jump = 0, jx = 0, jy = 0; const J = row(5, (i, u) => k.T('🍮', at(u), k.Y(i % 2 ? 0.85 : 0.3), 4, { hit(th) { th.sq = 1.6; k.a.boing(); jump = 0.001; jx = th.x; jy = th.y; k.act('ride2', 1.6); k.say(0); k.score(); row(4, (j) => k.wait(j * 0.2, () => { const q = k.T(pick(['🍬', '🍭', '🍫', '🧁']), th.x / k.worldW + rnd(-0.08, 0.08), -10, 1.7, { hit(z) { k.kill(z); k.a.chomp(); k.hero.belly = Math.min(0.9, k.hero.belly + 0.1); k.say(1); } }); q.g = k.U * 25; q.floor = k.Y(Math.random()); if (k.things().length > 26) k.kill(k.things().find((z) => '🍬🍭🍫🧁'.includes(z.e))); })); } }));
    return { step(dt) { if (jump > 0) { jump += dt / 1.6; if (jump > 1) jump = 0; } }, hero(o) { o.x = jx; o.y = jy - k.U * 2 - Math.sin(Math.min(1, jump || 1) * Math.PI) * (jy - k.U * 8); o.p.rot = jump * TAU; o.p.arms = 1; o.p.happy = true; } };
  } },
  // 33. bubble bath: bubbles rise with a toy inside, pop them and it falls in the tub
  bath: { sky: ['#d0f4ff', '#f3fdff'], ground: '#a5d8e8', deco: ['🛁', '🧴', '🪥', '🚿'], ride: '🛵', indoor: '#a5d8ff', notes: [0, 2, 4, 9], play(k) {
    const B = []; let n = 0, w = 0; const TOY = ['🦆', '🐢', '⭐', '🐳', '🚢', '🐙', '🌸', '🐸'], tub = { x: k.X(0.5), y: k.Y(0.55) };
    const mk = () => { const th = k.T(TOY[n++ % 8], Math.random() * 0.9 + 0.05, k.H + k.U * 3, 2, { bub: 1, hit(q) { if (!q.bub) { k.jump(q, 8); cry(k, q.e); return; } q.bub = 0; B.splice(B.indexOf(q), 1); k.a.pop(); k.fx('bubble', q.x, q.y - k.U, 5); k.say(0); k.score(); k.hero.mud = 0; k.fly(q, tub.x + rnd(-4, 4) * k.U, tub.y - k.U * 2, 0.8, 3, () => { k.a.pop(); k.wait(7, () => k.kill(q)); }); } }); th.sp = rnd(2, 4.5); B.push(th); };
    k.T('', 0.5, tub.y, 6, { near: 'tub', hit() { k.act('ride2', 2.2); k.a.song?.(3); k.say(1); k.fx('bubble', tub.x, tub.y - k.U * 2, 10); } });
    return { step(dt) { w -= dt; if (w <= 0 && B.length < 10) { w = 0.5; mk(); } for (const b of [...B]) { b.y -= b.sp * k.U * dt; b.x += Math.sin(k.t() * 1.5 + b.sp * 9) * dt * k.U; if (b.y < -k.U) { B.splice(B.indexOf(b), 1); k.kill(b); } } }, back(c) { const u = k.U; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(tub.x, tub.y - u * 2, u * 6, u * 1.3, 0, 0, TAU); c.fill(); }, front(c) { const u = k.U; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(tub.x, tub.y - u * 2, u * 6, u * 2.6, 0, 0, Math.PI); c.fill(); c.strokeStyle = '#74c0fc'; c.lineWidth = u * 0.2; c.stroke(); for (const b of B) { c.fillStyle = 'rgba(200,240,255,.35)'; c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 3; c.beginPath(); c.arc(b.x, b.y - b.s / 2, u * 1.9, 0, TAU); c.fill(); c.stroke(); } }, hero(o) { o.x = tub.x; o.y = tub.y - k.U * 1.2; o.p.arms = 1; o.p.happy = true; o.p.rot = Math.sin(k.t() * 8) * 0.1; } };
  } },
  // 34. our home: hide and seek, mum/dad/toys hide behind furniture
  home: { sky: ['#ffd9b8', '#fff1e0'], ground: '#d9a66f', deco: ['🖼️', '🪟', '🕰️', '🪟'], ride: '🚗', indoor: '#ffc9a3', notes: [0, 4, 5, 9], play(k) {
    const who = shuffle(['mom', 'dad', 'shark', 'capy', 'tart', 'bamboo', 'puppy', 'panda']); const H = ['🛋️', '🚪', '🛏️', '🪴', '📦', '📺'].map((e, i) => k.T(e, at(i / 5), k.Y(i % 2 ? 0.75 : 0.2), 5.4, { who: who[i], up: 0, hit(th) { th.up = 2.4; th.shake = 0.3; k.a.boing(); k.wait(0.25, () => { k.a.giggle(); k.say(th.who === 'mom' ? 0 : th.who === 'dad' ? 1 : 2); k.fx('heart', th.x, th.y - th.s, 5); }); k.score(); k.wait(3, () => { th.who = pick(who); }); } }));
    return { step(dt) { for (const h of H) h.up = Math.max(0, h.up - dt); }, back(c) { for (const h of H) { const q = Math.min(1, h.up * 3, (2.4 - h.up) * 6); k.char(c, h.who, h.x + Math.sin(k.t() + h.x) * 3, h.y - k.U * (0.5 + q * 3.4), k.U * 1.15, { t: k.t(), dir: 1, arms: q, happy: q > 0.5 }); } } };
  } },
  // 35. magic school: one tap turns anything into something else
  magic: { sky: ['#5f3dc4', '#d0bfff'], ground: '#9775fa', deco: ['🏰', '🔮', '🌟', '📚'], ride: '🧹', up: true, dark: true, notes: [0, 3, 7, 11], play(k) {
    const SETS = [['🐸', '🤴', '🦄', '🐉'], ['🎃', '🚗', '🚀', '🎠'], ['🥚', '🐣', '🦚', '🦋'], ['🪨', '💎', '👑', '🌈'], ['🐭', '🐘', '🐰', '🦁'], ['🌱', '🌳', '🍎', '🥧'], ['👟', '🛼', '🚲', '✈️']];
    SETS.forEach((l, i) => k.T(l[0], at(i / 6), k.Y((i * 0.43) % 1), 3.4, { n: 0, hit(th) { th.n = (th.n + 1) % l.length; k.a.twinkle(); k.boom(th.x, th.y - k.U * 2, 24, ['#fff', '#ffd43b', '#f783ac']); th.e = l[th.n]; th.sq = 1.4; th.spin = 1; k.wait(0.25, () => { k.a.chime(i + th.n); cry(k, th.e); }); k.say(th.n % 2); k.score(); } }));
    return { front(c) { const s = k.hero; sprite(c, '🪄', s.x + s.dir * k.U * 1.8, k.Y(s.fy) - k.U * 3, k.U * 1.8, { fl: -s.dir, rot: Math.sin(k.t() * 5) * 0.3 }); } };
  } },
  // 36. dress-up shop: hats and glasses jump on the hero's head, friends clap
  dress: { sky: ['#ffe3f1', '#fff8fb'], ground: '#e7c6ff', deco: ['👗', '🧥', '👚', '👖'], ride: '🚕', indoor: '#fcc2d7', notes: [0, 2, 4, 9], play(k) {
    let cur = null; const HAT = ['👒', '🎩', '🧢', '🪖', '👑', '🎓', '⛑️', '🕶️']; HAT.map((e, i) => k.T(e, at(i / 7, 0.06, 0.9), i % 2 ? k.H * 0.42 : k.Y(0.8), 2.8, { hit(th) { if (th.busy) return; if (cur && cur !== th) { const o = cur; k.fly(o, o.hx, o.hy, 0.5, 3, () => { o.busy = 0; }); } cur = th; th.busy = 1; k.a.whoosh(); k.say(i === 7 ? 1 : 0); k.score(); th.spin = 1; k.fly(th, k.hero.x, k.Y(k.hero.fy) - k.U * 4.2, 0.5, 4, () => { k.a.chime(i); k.act('cheer', 1.3); k.boom(th.x, th.y, 14); th.worn = 1; }); } })).forEach((th) => { th.hx = th.x; th.hy = th.y; });
    k.T('🪞', 0.5, k.Y(0.05), 6, { hit(th) { th.sq = 1; k.a.giggle(); k.act('dance', 1.6); k.fx('star', th.x, th.y - th.s / 2, 6); } });
    return { front() { if (cur && !cur.tw && cur.worn) { cur.x = k.hp.x; cur.y = k.hp.y - k.U * (cur.e === '🕶️' ? 2.4 : 4); } } };
  } },
};
export const PLACE_IDS = Object.keys(PLACES);
