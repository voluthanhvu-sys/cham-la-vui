// Story game (user 2026-11-24: "touch -> a cute animated story, a different one each time; dragging the hero changes the story").
// The hero (Tô, with ba, mẹ and the plush toys) runs after the finger through 36 places (storyPlaces.js), each with its own way to play.
// A shuffled queue in localStorage shows every place once before any comes back. A vehicle (or 14 points) leads to the next place.
// Nobody touching = call-back ladder: 4 s knock, 8 s trouble (any touch rescues), 15 s surprise, 25 s ride to another place, 45 s sleep.
import { TAU, COLORS, rnd, pick, makeBag, shuffle, makeParticles } from './fx.js';
import { drawProp, drawScene, drawNight, ell } from './storyArt.js';
import { drawChar } from './storyCast.js';
import { drawHeart } from './art.js';
import { LINES } from './storyLines.js';
import { PLACES, PLACE_IDS, sprite } from './storyPlaces.js';

const FRIENDS = ['shark', 'capy', 'tart', 'bamboo', 'mosquito', 'panda', 'puppy', 'dino'], PARENTS = ['mom', 'dad', 'gma', 'gpa'], FIRST = ['market', 'zoo', 'noi'], GOAL = 14;
const FRIEND_SOUND = { shark: 'splashy', capy: 'squeak', tart: 'boing', bamboo: 'rustle', mosquito: 'buzz', panda: 'boing', puppy: 'dog', dino: 'roar' };
const MEM = 'baby.story';
// seconds each act keeps the hero busy
const DUR = { friend: 2, mom: 2.4, dad: 2.8, gma: 2.4, gpa: 2.8, ride: 3, saved: 1.6, trick: 2.2 };

export function storyGame(audio) {
  let W = 1, H = 1, S = 1, U = 1, gy = 1, worldW = 1, t = 0, cam = 0, idle = 0, rung = 0, place = 'zoo', def = PLACES.zoo, inst = {}, things = [], timers = [], score = 0, lastSay = -9, partyT = 0, honk = 0;
  let props = [], friends = [], bits = [], wipe = 0, nightTo = 0, night = 0, rain = 0, pend = null, beat = 0, trailT = 0; const finger = { x: 0, y: 0 };
  let trouble = null, asleep = false, act = null, used = 0, gone = 0;
  const parts = makeParticles(), bags = {}, troubleBag = makeBag(['stuck', 'float', 'box']), trickBag = makeBag(['jump', 'spin', 'dance', 'sneeze', 'hide']);
  const hero = { x: 0, y: 0, tx: 0, ty: 0, dir: 1, walk: 0, mud: 0, belly: 0, look: 0 };
  let mem = { visits: 0, friends: [], queue: [...FIRST, ...shuffle(PLACE_IDS.filter((p) => !FIRST.includes(p)))], last: '' };
  try { mem = { ...mem, ...JSON.parse(localStorage.getItem(MEM) || '{}') }; } catch { /* private mode */ }
  const save = () => { try { localStorage.setItem(MEM, JSON.stringify({ visits: mem.visits, friends: friends.map((f) => f.kind), last: place, queue: mem.queue })); } catch { /* */ } };

  // One voice: a line wanted while another plays waits (newest wins, dropped after 3 s).
  function say(key, i) {
    const list = LINES[key]; if (!list) return;
    const text = i === undefined ? list[(bags[key] ||= makeBag(list.map((_, n) => n))).next()] : list[Math.min(i, list.length - 1)];
    pend = { text, until: t + 3 };
  }
  const burst = (x, y, n = 18, colors = COLORS) => parts.burst(x - cam, y, n, S * 0.02, colors, S * 0.6);
  const spawn = (kind, x, y, n) => { for (let i = 0; i < n; i++) bits.push({ kind, x: x + rnd(-1, 1) * U * 2, y, vx: rnd(-1, 1) * U * 3, vy: kind === 'ball' ? -rnd(8, 16) * U : -rnd(1.5, 4) * U, c: pick(COLORS), r: rnd(0.3, 0.7) * U, t: 0, max: rnd(2.5, 5) }); if (bits.length > 80) bits.splice(0, bits.length - 80); };

  const Y = (fy) => (def.swim ? H * (0.3 + fy * 0.62) : gy + (H - gy) * (0.12 + fy * 0.8));
  const span = () => (def.swim ? H * 0.62 : (H - gy) * 0.8);
  function layout() { gy = H * 0.5; U = S * 0.064; worldW = Math.max(W * 1.3, U * 36); }
  function nextPlace() { // every place once, then reshuffle
    mem.queue = (mem.queue || []).filter((p) => PLACES[p] && p !== place);
    if (!mem.queue.length) mem.queue = shuffle(PLACE_IDS.filter((p) => p !== place));
    return mem.queue[0];
  }
  function build(p) {
    place = p; def = PLACES[p]; mem.queue = (mem.queue || []).filter((q) => q !== p); nightTo = 0; rain = def.rain ? 1e9 : 0; act = null; trouble = null; things = []; timers = []; score = 0; partyT = 0; honk = 0; gone = 0; layout();
    const kinds = shuffle(FRIENDS.filter((k) => !friends.some((f) => f.kind === k))).slice(0, 1), list = kinds.map(() => ['friend', rnd(0.45, 0.6), 0.97]);
    if (def.grand) list.push(['gpa', 0.05, 0.1], ['gma', 0.9, 0.2]); else if (p !== 'home' && Math.random() < 0.45) list.push([pick(['mom', 'dad']), 0.9, 0.12]);
    list.push(['ride', 0.97, 0.6]);
    props = list.map(([type, fx, fy]) => ({ type, kind: type === 'friend' ? kinds.pop() : null, x: fx * worldW, fy, w: 0, cool: 1, n: 0, ox: 0, oy: 0 }));
    hero.x = hero.tx = U * 4; hero.fy = hero.tfy = 0.5; cam = 0; finger.x = U * 9; finger.y = Y(0.5); friends.forEach((f, i) => { f.x = hero.x - U * 3 * (i + 1); f.fy = 0.5; });
    inst = def.play(kit) || {}; wipe = 1; save();
  }
  // ---- kit given to the places
  const kit = {
    get U() { return U; }, get W() { return W; }, get H() { return H; }, get gy() { return gy; }, get worldW() { return worldW; }, hero, finger, a: audio, hp: { x: 0, y: 0 },
    X: (fx) => fx * worldW, Y, t: () => t, cam: () => cam, fx0: () => finger.x, things: () => things, all: (e) => things.filter((q) => q.e === e), count: (e) => things.filter((q) => q.e === e).length,
    T(e, fx, y, size, o = {}) { const th = { e, x: fx * worldW, y, s: size * U, oy: 0, vx: 0, vy: 0, g: 0, rot: 0, fl: 1, sq: 0, shake: 0, spin: 0, cd: 0, hc: 0, sink: 0, born: t, ...o }; things.push(th); return th; },
    kill(th) { const i = things.indexOf(th); if (i >= 0) things.splice(i, 1); },
    fly(th, x, y, dur, arc = 0, then) { th.vx = th.vy = th.g = 0; th.floor = undefined; th.tw = { x0: th.x, y0: th.y, x, y, t: 0, dur, arc: arc * U, then }; },
    jump(th, v) { if (th.tw || th.vy) return; th.floor = th.y; th.vy = -v * U; th.g = U * 55; },
    wait(s, fn) { timers.push({ at: t + s, fn }); },
    act(name, dur) { if (!trouble && !asleep && act?.name !== 'ride') act = { name, p: null, t: 0, dur }; },
    fx: (kind, x, y, n) => spawn(kind, x, y, n), boom: (x, y, n, colors) => burst(x, y, n, colors),
    say(i = 0) { const l = LINES['d-' + place]; if (!l || t - lastSay < 4 || pend) return; lastSay = t; say('d-' + place, i); },
    score(n = 1) { const was = score; score += n; if (was < GOAL && score >= GOAL) timers.push({ at: t + 2.2, fn: ready }); },
    party() { partyT = 0.6; }, char: (c, kind, x, y, s, p) => drawChar(c, kind, x, y, s, p),
  };
  function ready() { // enough fun here: the vehicle comes to fetch the hero
    const r = props.find((p) => p.type === 'ride'); if (!r || act?.name === 'ride') return;
    r.come = Math.max(U * 5, Math.min(worldW - U * 4, hero.x + (hero.x > worldW * 0.6 ? -1 : 1) * U * 8)); r.cool = 2.5; honk = 6; partyT = 2.5; audio.toot(); burst(hero.x, Y(hero.fy) - U * 4, 40); say('next');
  }
  function hit(th, byHero) { if (!th.hit || th.hide || th.cd > 0) return false; th.cd = 0.4; th.hc = 2.5; used++; th.hit(th); if (byHero) finger.x = th.x; return true; }

  function wake() { if (!asleep) return; asleep = false; nightTo = 0; say('wake'); audio.giggle(); }
  function startAct(name, p, extra) { act = { name, p, t: 0, dur: DUR[name] || DUR.ride, ...extra }; if (p) { p.n++; p.w = 1; p.cool = 2.5; } used++; }
  function moveOn() { const ride = props.find((q) => q.type === 'ride'); startAct('ride', ride, { next: nextPlace() }); say('go'); (def.up ? audio.whoosh : audio.toot)(); }
  function interact(p) {
    const n = p.n, dirty = hero.mud > 0.4, hx = p.x, hy = Y(p.fy);
    switch (p.type) {
      case 'friend': startAct('friend', p); if (friends.length >= 5) friends.shift(); friends.push({ kind: p.kind, x: p.x, fy: p.fy, mud: 0, dir: 1, walk: 0 }); props.splice(props.indexOf(p), 1); spawn('heart', hx, hy - U * 4, 8); friendSound(p.kind); say(dirty ? 'muddyFriend' : p.kind); if (dirty) hero.mud = 0.1; save(); break;
      case 'mom': case 'gma': startAct(p.type, p); spawn('heart', hx, hy - U * 5, 12); audio.giggle(); if (dirty && p.type === 'mom') { say('momClean'); spawn('bubble', hx, hy - U * 2, 8); } else say(p.type); if (dirty) hero.mud = 0; break;
      case 'dad': startAct('dad', p, { v: n % 2 }); (n % 2 ? audio.boing : audio.whoosh)(); audio.giggle(); say('dad', n % 2 === 0 ? pick([0, 2]) : 1); break;
      case 'gpa': startAct('gpa', p, { v: n % 2 }); audio.boing(); audio.giggle(); say('gpa'); break;
      default: moveOn();
    }
  }
  function friendSound(k) { const f = FRIEND_SOUND[k]; if (f === 'splashy') { audio.pop(); audio.whoosh(); } else if (f === 'boing') audio.boing(); else if (f === 'rustle') audio.rustle(); else if (f === 'dog') audio.animal('dog'); else if (f === 'roar') audio.giggle(); else if (f === 'buzz') audio.buzz(); else audio.animal(f === 'squeak' ? 'mouse' : 'chick'); }
  function rescue() { // any touch at all frees the hero
    trouble = null; startAct('saved', null); spawn('heart', hero.x, Y(hero.fy) - U * 4, 10); burst(hero.x, Y(hero.fy) - U * 3, 24); audio.giggle(); say('saved');
  }
  function trick() { const v = trickBag.next(); startAct('trick', null, { v }); ({ jump: audio.boing, spin: audio.whoosh, dance: () => audio.song(3), sneeze: audio.pop, hide: audio.rustle })[v](); say('surprise'); }
  function ladder() {
    const at = [4, 8, 15, 25, 45];
    if (rung >= at.length || idle < at[rung] || (act && rung < 4)) return;
    switch (rung++) {
      case 0: for (let i = 0; i < 3; i++) setTimeout(() => audio.drum(5), i * 230); hero.knock = 1.2; break;
      case 1: trouble = troubleBag.next(); hero.tx = hero.x; hero.tfy = hero.fy; say(trouble, trouble === 'box' ? 0 : undefined); (trouble === 'float' ? audio.inflate : audio.boing)(3); break;
      case 2: if (trouble) { trouble = null; } trick(); break;
      case 3: moveOn(); break;
      case 4: asleep = true; act = null; trouble = null; nightTo = 1; say('sleepy'); break;
    }
  }
  function aim(x, y) { finger.x = x + cam; finger.y = y; hero.tx = Math.max(U * 2, Math.min(worldW - U * 2, finger.x)); hero.tfy = Math.max(0, Math.min(1, (y - Y(0)) / Math.max(1, span()))); }
  function touched() { idle = 0; rung = 0; if (asleep) wake(); if (trouble) rescue(); }

  return {
    selfPaced: true, ownIdle: true,
    resize(w, h) { const ch = Math.abs(w - W) > 2 || Math.abs(h - H) > 2; W = w; H = h; S = Math.min(w, h); layout(); if (ch && props.length) build(place); },
    enter() {
      t = 0; idle = 0; rung = 0; asleep = false; nightTo = night = 0; bits = []; pend = null; used = 0;
      hero.mud = 0; hero.belly = 0;
      friends = (mem.friends || []).filter((k) => FRIENDS.includes(k)).slice(0, 1).map((kind) => ({ kind, x: 0, fy: 0.5, mud: 0, dir: 1, walk: 0 })); // yesterday's friend came back
      const back = mem.visits > 0; mem.visits++;
      const want = new URLSearchParams(location.search).get('place'); build(PLACES[want] ? want : nextPlace()); // ?place=<id> = preview one place
      say(back && Math.random() < 0.5 ? 'again' : 'hello');
    },
    leave() { save(); },
    tap(x, y) {
      touched(); aim(x, y);
      const wx = x + cam; let best = null, bd = 1e9;
      for (const th of things) if (th.hit && !th.hide) { const d = Math.hypot(wx - th.x, y - (th.y + th.oy - th.s / 2)); if (d < Math.max(th.s * 0.62, U * 1.9) && d < bd) { bd = d; best = th; } }
      for (const p of props) { const d = Math.hypot(wx - p.x, (y - (Y(p.fy) - U * 2)) * 0.8); if (d < U * 3 && d < bd) { bd = d; best = p; } }
      let did = false;
      if (best?.hit) { if (best.tw || best.cd > 0) { best.sq = 1; audio.pop(); did = true; } else did = hit(best); }
      else if (best) { best.w = 1; hero.tx = best.x; hero.tfy = best.fy; audio.note(props.indexOf(best) + 1); did = true; }
      inst.touch?.(wx, y, false, did); if (did) return;
      if (Math.hypot(wx - hero.x, y - (Y(hero.fy) - U * 2)) < U * 3) { audio.giggle(); hero.hop = 0.5; spawn('heart', hero.x, Y(hero.fy) - U * 4, 2); }
      else { audio.pop(); spawn(pick(['bubble', 'star', 'note']), wx, y, 3); }
    },
    drag(x, y) {
      touched(); aim(x, y); let did = false; const wx = x + cam;
      for (const th of [...things]) if (th.hit && !th.hide && !th.tw && th.hc < 1.7 && Math.hypot(wx - th.x, y - (th.y + th.oy - th.s / 2)) < Math.max(th.s * 0.45, U * 1.4)) { did = hit(th) || did; }
      inst.touch?.(wx, y, true, did);
      if (t - trailT > 0.07) { trailT = t; parts.burst(x, y, 2, S * 0.01, COLORS, S * 0.12); audio.twinkle(); }
    },
    update(dt) {
      t += dt; idle += dt; parts.update(dt, 200); ladder();
      if (pend) { if (t > pend.until) pend = null; else if (!audio.voiceBusy) { audio.say(pend.text); pend = null; } }
      if (wipe > 0) wipe = Math.max(0, wipe - dt * 1.4);
      for (const q of [...timers]) if (t >= q.at) { const i = timers.indexOf(q); if (i < 0) continue; timers.splice(i, 1); q.fn(); }
      if (partyT > 0) partyT -= dt; if (honk > 0) { const was = Math.ceil(honk / 2); honk -= dt; if (Math.ceil(honk / 2) !== was) audio.toot(); }
      night += (nightTo - night) * Math.min(1, dt * 2); 
      if (rain > 0 && hero.mud > 0) hero.mud = Math.max(0, hero.mud - dt * 0.03); // rain washes a little
      hero.hop = Math.max(0, (hero.hop || 0) - dt); hero.knock = Math.max(0, (hero.knock || 0) - dt);
      // soft background music, different scale steps per place; quiet while somebody speaks
      beat -= dt; if (beat <= 0 && !asleep) { beat = 0.4 + (PLACE_IDS.indexOf(place) % 5) * 0.08; if (def.notes.length && !audio.voiceBusy && Math.random() < 0.8) audio.soft(pick(def.notes)); }
      // hero walks to the finger
      hero.walk = 0;
      if (!act && !trouble && !asleep) {
        const dx = hero.tx - hero.x, dy = (hero.tfy - hero.fy) * span(), d = Math.hypot(dx, dy), v = U * 17 * (hero.belly > 0.6 ? 0.75 : 1);
        if (d > U * 0.4) { const m = Math.min(1, v * dt / d); hero.x += dx * m; hero.fy += (hero.tfy - hero.fy) * m; hero.walk = 1; if (Math.abs(dx) > 2) hero.dir = dx > 0 ? 1 : -1; }
        if (idle < 12 && used + t > 0) {
          for (const p of props) if (p.cool <= 0 && Math.hypot(hero.x - p.x, (hero.fy - p.fy) * span()) < U * 2.6) { interact(p); break; }
          if (hero.walk) for (const th of [...things]) if (th.hit && !th.pass && !th.tw && th.hc <= 0 && Math.hypot(hero.x - th.x, Y(hero.fy) - th.y + (def.swim ? th.s * 0.3 : 0)) < U * 2) { hit(th, true); break; }
        }
      }
      for (const p of props) { if (p.w > 0) p.w = Math.max(0, p.w - dt); if (p.cool > 0 && (!act || act.p !== p)) p.cool -= dt; if (p.come !== undefined) p.x += (p.come - p.x) * Math.min(1, dt * 2); }
      for (const th of [...things]) {
        if (th.cd > 0) th.cd -= dt; if (th.hc > 0) th.hc -= dt; th.sq = Math.max(0, th.sq - dt * 1.6); th.shake = Math.max(0, th.shake - dt); th.spin = Math.max(0, th.spin - dt * 1.3); if (th.pin) th.x = th.pin();
        if (th.tw) { const w = th.tw; w.t += dt; const u = Math.min(1, w.t / w.dur); th.x = w.x0 + (w.x - w.x0) * u; th.y = w.y0 + (w.y - w.y0) * u - Math.sin(u * Math.PI) * w.arc; if (u >= 1) { th.tw = null; w.then?.(th); } }
        else if (th.g) { th.vy += th.g * dt; th.y += th.vy * dt; th.x += th.vx * dt; if (th.floor !== undefined && th.y >= th.floor && th.vy > 0) { th.y = th.floor; if (th.vy > U * 7) { th.vy *= -0.45; th.vx *= 0.6; } else { th.vy = th.vx = th.g = 0; } } }
      }
      inst.step?.(dt);
      friends.forEach((f, i) => { const tx = hero.x - hero.dir * U * (1 + 2.2 * (i + 1)), dx = tx - f.x; f.walk = Math.abs(dx) > U * 0.6 ? 1 : 0; if (f.walk) { f.x += dx * Math.min(1, dt * 3); f.dir = dx > 0 ? 1 : -1; } else f.dir = hero.dir; f.fy += (hero.fy + 0.06 * (i + 1) - f.fy) * Math.min(1, dt * 3); });
      for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.kind === 'ball') { b.vy += U * 40 * dt; if (b.y > H * 0.95) { b.y = H * 0.95; b.vy *= -0.7; } } if (b.t > b.max) bits.splice(i, 1); }
      if (act) {
        const a = act; a.t += dt;
        if (a.t >= a.dur) { act = null; if (a.p) { hero.tx = hero.x; hero.tfy = hero.fy; } if (a.name === 'ride') build2(a.next); }
      }
      const want = Math.max(0, Math.min(worldW - W, hero.x - W * 0.45)); cam += (want - cam) * Math.min(1, dt * 3);
    },
    draw(ctx) {
      drawScene(ctx, def, W, H, S, gy, cam, t, rain, worldW, sprite);
      ctx.save(); ctx.translate(-cam, 0); inst.back?.(ctx);
      const items = [...things.map((th) => ({ y: th.y, f: () => drawThing(ctx, th) })), ...props.map((p) => ({ y: Y(p.fy), f: () => (act?.name === 'ride' && act.p === p ? 0 : drawOne(ctx, p)) })), ...friends.map((f) => ({ y: Y(f.fy), f: () => drawFriend(ctx, f) })), { y: Y(hero.fy) + 1, f: () => drawHero(ctx) }];
      items.sort((a, b) => a.y - b.y); for (const i of items) i.f();
      inst.front?.(ctx);
      for (const b of bits) drawBit(ctx, b);
      ctx.restore();
      drawNight(ctx, W, H, S, gy, t, night);
      parts.draw(ctx);
      if (wipe > 0) { ctx.fillStyle = `rgba(255,255,255,${wipe})`; ctx.fillRect(0, 0, W, H); }
    },
  };

  function build2(p) { build(p); say('p-' + p); }
  function drawThing(ctx, th) {
    if (!th.e || th.hide || th.x < cam - th.s * 2 || th.x > cam + W + th.s * 2) return;
    const grow = Math.min(1, (t - th.born) * 4), w = th.sq * 0.25 * Math.sin(th.sq * 14), hop = th.sway ? Math.sin(t * 2 + th.x) * U * 0.25 : 0;
    const o = { rot: th.spin * TAU + (th.shake ? Math.sin(t * 40) * 0.12 * Math.min(1, th.shake * 3) : 0), fl: th.fl, sx: grow * (1 + w) * (th.flap ? 0.65 + 0.35 * Math.sin(t * 16 + (th.ph || 0)) : 1), sy: grow * (1 - w) };
    if (th.off) o.alpha = 0.05;
    if (!th.sway && !th.bub && !th.flap && !th.up && !def.swim && th.y > gy && !th.g && !th.tw && !th.fly) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ell(ctx, th.x, th.y, th.s * 0.42, th.s * 0.09); }
    if (th.sink > 0) { ctx.save(); ctx.beginPath(); ctx.rect(th.x - th.s, th.y - th.s * 2, th.s * 2, th.s * 2); ctx.clip(); }
    sprite(ctx, th.e, th.x, th.y + th.oy + hop - th.s / 2 + th.sink * th.s, th.s, o);
    if (th.sink > 0) ctx.restore();
  }
  function drawOne(ctx, p) {
    const x = p.x + p.ox, y = Y(p.fy) + p.oy;
    if (p.type === 'friend') { drawChar(ctx, p.kind, x, y, U * 1.25, { t: t + p.x, dir: hero.x > x ? 1 : -1, arms: 0.5 + 0.5 * Math.sin(t * 3), happy: p.w > 0 }); return; }
    if (PARENTS.includes(p.type)) { const mine = act?.p === p, u = mine ? act.t / act.dur : 0, run = mine && (p.type === 'dad' || p.type === 'gpa') && act.v === 1 ? Math.sin(u * TAU) * U * 6 : 0; if (asleep && p.type === 'mom') p.w = 0; drawChar(ctx, p.type, x + run, y, U * 1.3, { t: t + p.x, dir: hero.x >= x ? 1 : -1, walk: run ? 1 : 0, arms: mine || Math.abs(hero.x - x) < U * 9 ? 1 : 0.35 + 0.35 * Math.sin(t * 2), happy: mine || p.w > 0 }); return; }
    const call = honk > 0 ? Math.sin(t * 14) * 0.1 : 0; sprite(ctx, def.ride, x, y - U * 2.4 + Math.sin(t * 3) * U * 0.1, U * 5.2 * (1 + (honk > 0 ? 0.08 * Math.sin(t * 8) : 0)), { fl: def.up ? 1 : -1, rot: call });
    if (honk > 0) sprite(ctx, '👇', x, y - U * 6.5 + Math.sin(t * 7) * U * 0.6, U * 1.8);
  }
  function drawFriend(ctx, f) {
    const party = partyT > 0 || (act && ['dance', 'trick', 'saved'].includes(act.name));
    drawChar(ctx, f.kind, f.x, Y(f.fy) - (party ? Math.abs(Math.sin(t * 7 + f.x)) * U : 0), U * 1.25, { t: t + 1.7, dir: f.dir, walk: f.walk, mud: f.mud, arms: party ? 1 : 0, happy: !!party, sleep: asleep });
  }
  function drawHero(ctx) {
    let x = hero.x, y = Y(hero.fy); const s = U * 1.5, p = { t, dir: hero.dir, walk: hero.walk, mud: hero.mud, belly: hero.belly, sleep: asleep };
    const jump = (n, h) => { y -= Math.abs(Math.sin(act.t / act.dur * Math.PI * n)) * U * h; p.arms = 1; };
    if (hero.hop > 0) y -= Math.sin(hero.hop / 0.5 * Math.PI) * U * 2;
    if (hero.knock > 0) { p.look = Math.sin(t * 10) * 0.5; p.arms = 1; p.sx = p.sy = 1.12; }
    if (act) {
      const a = act, u = a.t / a.dur, v = a.v;
      switch (a.name) {
        case 'jump': jump(3, 3.5); p.happy = true; break;
        case 'roll': p.rot = u * TAU * 2; p.happy = true; break;
        case 'eat': p.mouth = 0.5 + 0.5 * Math.sin(a.t * 18); p.look = 0.4; p.arms = 0.6; break;
        case 'cheer': jump(2, 1.4); p.happy = true; break;
        case 'dance': jump(Math.max(2, Math.round(a.dur * 2.5)), 1.1); p.happy = true; p.rot = Math.sin(a.t * 9) * 0.25; break;
        case 'ride2': { const o = { x, y, p }; inst.hero?.(o); x = o.x; y = o.y; break; }
        case 'friend': p.arms = 1; p.happy = true; p.rot = Math.sin(a.t * 8) * 0.15; break;
        case 'mom': case 'gma': x = a.p.x + U * 1.5; y = Y(a.p.fy) + 1; p.dir = -1; p.happy = true; p.arms = 1; p.rot = Math.sin(a.t * 5) * 0.1; break;
        case 'dad': case 'gpa': p.happy = true; p.arms = 1; if (v === 1) { x = a.p.x + Math.sin(u * TAU) * U * 6; y = Y(a.p.fy) - U * 3.6 - Math.abs(Math.sin(a.t * 10)) * U * 0.5; } else { x = a.p.x; y = Y(a.p.fy) - U * 3.5 - Math.abs(Math.sin(u * Math.PI * 3)) * U * 4; } break;
        case 'saved': jump(3, 2.5); p.happy = true; break;
        case 'ride': { // leave the place together with the vehicle
          const pr = a.p; if (pr) { const go = Math.max(0, u - 0.25) / 0.75, up = def.up; const vx = up ? 0 : go * go * W * 1.2, vy = up ? -go * go * H * 1.2 : Math.sin(a.t * 12) * U * 0.12; x = pr.x + vx; y = Y(pr.fy) + vy - U * 2.6; p.dir = 1; p.arms = 1; p.happy = true; if (Math.random() < 0.4) parts.burst(x - cam - U * 2, y + U, 2, S * 0.015, ['#ffffff', '#dddddd'], S * 0.2); drawChar(ctx, 'to', x, y, s, p); sprite(ctx, def.ride, pr.x + vx, Y(pr.fy) + vy - U * 2.4, U * 6, { fl: up ? 1 : -1 }); return; }
          break; }
        case 'trick':
          if (v === 'jump') jump(5, 4); else if (v === 'spin') p.rot = u * TAU * 3; else if (v === 'dance') { p.rot = Math.sin(a.t * 9) * 0.35; p.arms = 1; p.happy = true; }
          else if (v === 'sneeze') { const q = u > 0.45 && u < 0.7; p.sx = q ? 1.35 : 0.9; p.sy = q ? 0.7 : 1.1; p.mouth = q ? 1 : 0; } else { const q = Math.abs(u - 0.5) * 2; p.sy = Math.max(0.05, q * q); if (u > 0.6) p.arms = 1; }
          break;
      }
    }
    if (trouble === 'float') { y -= U * 5 + Math.sin(t * 2) * U; p.arms = 1; p.mouth = 1; drawProp(ctx, 'balloon', x + U * 0.9, y - U * 2.2, U * 1.4, t, { w: 0, c: '#ff5d73' }); }
    if (trouble === 'box') { p.box = true; p.rot = Math.sin(t * 6) * 0.12; }
    if (trouble === 'stuck') { p.arms = 1; p.mouth = 1; p.rot = Math.sin(t * 9) * 0.15; }
    kit.hp.x = x; kit.hp.y = y;
    drawChar(ctx, 'to', x, y, s, p);
    if (trouble === 'stuck') { ctx.fillStyle = '#7a4d2b'; ell(ctx, x, y - U * 0.3, U * 2.6, U * 1); }
    if (asleep) { ctx.fillStyle = '#ffffff'; ctx.font = `bold ${Math.round(U * 1.5)}px system-ui`; for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.fillText('z', x + U * (1 + k * 2), y - U * (3 + k * 4)); } ctx.globalAlpha = 1; }
  }
  function drawBit(ctx, b) {
    ctx.globalAlpha = Math.min(1, (b.max - b.t) * 2); ctx.fillStyle = b.c;
    if (b.kind === 'heart') { ctx.fillStyle = '#ff5d8f'; drawHeart(ctx, b.x, b.y, b.r); } else if (b.kind === 'bubble') { ctx.fillStyle = 'rgba(200,240,255,.5)'; ell(ctx, b.x, b.y, b.r, b.r); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
    else if (b.kind === 'note') { ell(ctx, b.x, b.y, b.r * 0.7, b.r * 0.5, -0.4); ctx.fillRect(b.x + b.r * 0.5, b.y - b.r * 2, b.r * 0.2, b.r * 2); }
    else if (b.kind === 'star') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.t * 3); ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? b.r * 0.45 : b.r, a = i / 10 * TAU; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.restore(); } else ell(ctx, b.x, b.y, b.r, b.r);
    ctx.globalAlpha = 1;
  }
}
