// Story game (user 2026-11-24: "touch -> a cute animated story, a different one each time; dragging the hero changes the story").
// One hero (duckling Bông) runs after the finger. Every prop knows its own reaction, and state carries over
// (mud, full belly, friends following, night), so the ORDER the child plays in makes the story. 3 places linked by vehicles.
// Nobody touching = call-back ladder: 4 s knock, 8 s trouble ("giúp Bông"), 15 s surprise, 25 s ride to another place, 45 s sleep.
import { TAU, COLORS, rnd, pick, makeBag, shuffle, makeParticles } from './fx.js';
import { drawChar, drawProp, drawWorld, drawNight, ell } from './storyArt.js';
import { drawHeart } from './art.js';
import { LINES } from './storyLines.js';

const PLACES = {
  garden: { props: ['puddle', 'flower', 'flower', 'cake', 'ball', 'gift', 'balloon', 'drum'], ride: 'car' },
  beach: { props: ['tub', 'ball', 'drum', 'cake', 'balloon', 'gift', 'puddle'], ride: 'boat' },
  home: { props: ['bed', 'tub', 'lamp', 'drum', 'cake', 'gift', 'ball'], ride: 'rocket' },
};
const FRIENDS = ['bunny', 'turtle', 'bear'];
const MEM = 'baby.story';
// seconds each act keeps the hero busy
const DUR = { puddle: 2, cake: 1.8, tub: 2.8, bed: 4, ball: 1.6, drum: 2.2, flower: 1.6, gift: 2.6, balloon: 3.2, lamp: 1.4, friend: 2, ride: 3, saved: 1.6, trick: 2.2 };

export function storyGame(audio) {
  let W = 1, H = 1, S = 1, U = 1, gy = 1, worldW = 1, t = 0, cam = 0, idle = 0, rung = 0, place = 'garden';
  let props = [], friends = [], bits = [], wipe = 0, nightTo = 0, night = 0, rain = 0, pend = null, beat = 0, trailT = 0, finger = null;
  let trouble = null, asleep = false, act = null, used = 0;
  const parts = makeParticles(), bags = {}, troubleBag = makeBag(['stuck', 'float', 'box']), trickBag = makeBag(['jump', 'spin', 'dance', 'sneeze', 'hide']);
  const giftBag = makeBag(['stars', 'bubbles', 'hearts', 'balls', 'friend']);
  const hero = { x: 0, y: 0, tx: 0, ty: 0, dir: 1, walk: 0, mud: 0, belly: 0, look: 0 };
  let mem = { visits: 0, friends: [], last: '' };
  try { mem = { ...mem, ...JSON.parse(localStorage.getItem(MEM) || '{}') }; } catch { /* private mode */ }
  const save = () => { try { localStorage.setItem(MEM, JSON.stringify({ visits: mem.visits, friends: friends.map((f) => f.kind), last: place })); } catch { /* */ } };

  // One voice: a line wanted while another plays waits (newest wins, dropped after 3 s).
  function say(key, i) {
    const list = LINES[key]; if (!list) return;
    const text = i === undefined ? list[(bags[key] ||= makeBag(list.map((_, n) => n))).next()] : list[Math.min(i, list.length - 1)];
    pend = { text, until: t + 3 };
  }
  const burst = (x, y, n = 18, colors = COLORS) => parts.burst(x - cam, y, n, S * 0.02, colors, S * 0.6);
  const spawn = (kind, x, y, n) => { for (let i = 0; i < n; i++) bits.push({ kind, x: x + rnd(-1, 1) * U * 2, y, vx: rnd(-1, 1) * U * 3, vy: kind === 'ball' ? -rnd(8, 16) * U : -rnd(1.5, 4) * U, c: pick(COLORS), r: rnd(0.3, 0.7) * U, t: 0, max: rnd(2.5, 5) }); if (bits.length > 80) bits.splice(0, bits.length - 80); };

  function build(p) {
    place = p; nightTo = 0; rain = p === 'garden' && Math.random() < 0.5 ? 8 : 0; act = null; trouble = null; finger = null;
    worldW = Math.max(W * 1.7, U * 46);
    const free = FRIENDS.filter((k) => !friends.some((f) => f.kind === k));
    const list = shuffle([...PLACES[p].props]).slice(0, 5); // 5 of the place's props + maybe a friend + the ride, shuffled along the world
    if (free.length) list.splice(1, 0, 'friend');
    shuffle(list); list.push(PLACES[p].ride);
    const step = worldW / (list.length + 1);
    props = list.map((type, i) => ({ type, kind: type === 'friend' ? pick(free) : null, x: step * (i + 1) + rnd(-0.12, 0.12) * step, fy: i % 2 ? rnd(0.62, 0.85) : rnd(0.12, 0.35), w: 0, on: 0, c: pick(COLORS), cool: 0, n: 0, dirty: false, ox: 0, oy: 0, vy: 0 }));
    hero.x = hero.tx = U * 5; hero.fy = hero.tfy = 0.5; cam = 0; friends.forEach((f, i) => { f.x = hero.x - U * 3 * (i + 1); f.fy = 0.5; });
    wipe = 1; save();
  }
  const Y = (fy) => gy + (H - gy) * (0.12 + fy * 0.8);
  function layout() { gy = H * 0.5; U = S * 0.064; }

  function wake() { if (!asleep) return; asleep = false; nightTo = 0; say('wake'); audio.animal('duck'); }
  function startAct(name, p, extra) { act = { name, p, t: 0, dur: DUR[name] || DUR.ride, ...extra }; if (p) { p.n++; p.w = 1; p.cool = 2.5; } used++; }
  function moveOn() { const others = Object.keys(PLACES).filter((k) => k !== place); const ride = props.find((q) => q.type === PLACES[place].ride); startAct('ride', ride, { next: pick(others) }); say(PLACES[place].ride); (place === 'garden' ? audio.toot : audio.whoosh)(); }

  function interact(p) {
    const n = p.n, dirty = hero.mud > 0.4, hx = p.x, hy = Y(p.fy);
    switch (p.type) {
      case 'puddle': startAct('puddle', p, { v: n % 3 }); hero.mud = Math.min(1, hero.mud + 0.5); friends.forEach((f) => { f.mud = Math.min(1, (f.mud || 0) + 0.3); }); burst(hx, hy, 34, ['#7a4d2b', '#95683f', '#b98a5a']); audio.boom(); say('puddle', n % 3); break;
      case 'cake': startAct('cake', p); hero.belly = Math.min(1, hero.belly + 0.35); audio.chomp(); if (dirty && !n) say('muddyCake'); else { say('cake', hero.belly > 0.9 ? 2 : n % 2); if (hero.belly > 0.9) { setTimeout(() => audio.burp(), 900); hero.belly = 0.5; } } break;
      case 'tub': startAct('tub', p); spawn('bubble', hx, hy - U * 2, 16); audio.pop(); setTimeout(() => audio.pop(), 250); say(dirty ? 'clean' : 'tub'); break;
      case 'bed': startAct('bed', p); p.dirty = dirty || p.dirty; nightTo = 1; if (dirty) say('muddyBed'); else say('bed'); audio.lullaby(); break;
      case 'ball': startAct('ball', p, { v: n % 3 }); p.vy = -U * 26; p.vx = hero.dir * U * 9; audio.boing(); say('ball', n % 3); break;
      case 'drum': startAct('drum', p); for (let i = 0; i < 6; i++) setTimeout(() => audio.drum(i), i * 180); if (friends.length || n % 2) audio.song(4); say('drum', friends.length ? 1 : undefined); break;
      case 'flower': { const sneeze = n % 2 === 0; startAct('flower', p, { v: sneeze ? 1 : 0 }); p.on = Math.min(1, p.on + 0.6); burst(hx, hy - U * 3, 20, [p.c, '#ffd23f']); audio.chime(n * 2); say('flower', sneeze ? 0 : 1 + n % 2); if (sneeze) setTimeout(() => { audio.whoosh(); audio.pop(); }, 900); break; }
      case 'gift': startAct('gift', p, { v: giftBag.next(), open: false }); p.on = 0; say('gift'); audio.rustle(); break;
      case 'balloon': startAct('balloon', p); audio.inflate(3); say('balloon'); break;
      case 'lamp': startAct('lamp', p); nightTo = nightTo > 0.5 ? 0 : 1; p.on = nightTo; audio.note(4); say('lamp', nightTo ? 0 : pick([1, 2])); break;
      case 'friend': startAct('friend', p); friends.push({ kind: p.kind, x: p.x, fy: p.fy, mud: 0, dir: 1, walk: 0 }); props.splice(props.indexOf(p), 1); spawn('heart', hx, hy - U * 4, 8); audio.giggle(); say(dirty ? 'muddyFriend' : 'friend'); if (dirty) hero.mud = 0.1; save(); break;
      default: { // vehicle
        if (dirty) { p.dirty = true; say('muddyRide'); p.cool = 2; }
        moveOn();
      }
    }
  }
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
  function aim(x, y) { finger = { x: x + cam, fy: Math.max(0, Math.min(1, ((y - gy) / Math.max(1, H - gy) - 0.12) / 0.8)) }; hero.tx = Math.max(U * 2, Math.min(worldW - U * 2, finger.x)); hero.tfy = finger.fy; }
  function touched() { idle = 0; rung = 0; if (asleep) wake(); if (trouble) rescue(); }

  return {
    selfPaced: true, ownIdle: true,
    resize(w, h) { const old = worldW; W = w; H = h; S = Math.min(w, h); layout(); worldW = Math.max(W * 1.7, U * 46); const k = worldW / (old || 1); if (props.length) { for (const p of props) p.x *= k; hero.x *= k; hero.tx *= k; for (const f of friends) f.x *= k; } },
    enter() {
      t = 0; idle = 0; rung = 0; asleep = false; nightTo = night = 0; bits = []; pend = null; used = 0;
      hero.mud = 0; hero.belly = 0;
      friends = (mem.friends || []).slice(0, 1).map((kind) => ({ kind, x: 0, fy: 0.5, mud: 0, dir: 1, walk: 0 })); // yesterday's friend came back
      const back = mem.visits > 0; mem.visits++;
      build(pick(Object.keys(PLACES).filter((k) => k !== mem.last)));
      say(back && Math.random() < 0.5 ? 'again' : 'hello');
    },
    leave() { save(); },
    tap(x, y) {
      touched(); aim(x, y);
      const wx = x + cam; let hit = null, bd = 1e9;
      for (const p of props) { const d = Math.hypot(wx - p.x - p.ox, (y - (Y(p.fy) - U * 1.4)) * 0.8); if (d < U * 3.2 && d < bd) { bd = d; hit = p; } }
      if (hit) { hit.w = 1; hero.tx = hit.x; hero.tfy = hit.fy; audio.note(props.indexOf(hit) + 1); }
      else if (Math.hypot(wx - hero.x, y - (Y(hero.fy) - U * 2)) < U * 3) { audio.animal('duck'); hero.hop = 0.5; spawn('heart', hero.x, Y(hero.fy) - U * 4, 2); }
      else { audio.pop(); spawn(pick(['bubble', 'star', 'note']), wx, y, 3); }
    },
    drag(x, y) {
      touched(); aim(x, y);
      if (t - trailT > 0.07) { trailT = t; parts.burst(x, y, 2, S * 0.01, COLORS, S * 0.12); audio.twinkle(); for (const p of props) if (Math.hypot(x + cam - p.x, y - Y(p.fy) + U) < U * 2 && p.w < 0.3) { p.w = 1; audio.note(props.indexOf(p) + 1); } }
    },
    update(dt) {
      t += dt; idle += dt; parts.update(dt, 200); ladder();
      if (pend) { if (t > pend.until) pend = null; else if (!audio.voiceBusy) { audio.say(pend.text); pend = null; } }
      if (wipe > 0) wipe = Math.max(0, wipe - dt * 1.4);
      night += (nightTo - night) * Math.min(1, dt * 2); if (rain > 0) rain -= dt;
      if (rain > 0 && hero.mud > 0) hero.mud = Math.max(0, hero.mud - dt * 0.03); // rain washes a little
      hero.hop = Math.max(0, (hero.hop || 0) - dt); hero.knock = Math.max(0, (hero.knock || 0) - dt);
      // soft background music, different scale steps per place; quiet while somebody speaks
      beat -= dt; if (beat <= 0 && !asleep) { beat = place === 'home' ? 0.75 : place === 'beach' ? 0.6 : 0.45; if (!audio.voiceBusy && Math.random() < 0.8) audio.soft(pick({ garden: [0, 2, 4, 7], beach: [0, 3, 5, 7], home: [0, 4, 5, 9] }[place])); }
      // hero walks to the finger
      hero.walk = 0;
      if (!act && !trouble && !asleep) {
        const dx = hero.tx - hero.x, dy = (hero.tfy - hero.fy) * (H - gy) * 0.8, d = Math.hypot(dx, dy), v = U * 17 * (hero.belly > 0.6 ? 0.75 : 1);
        if (d > U * 0.4) { const m = Math.min(1, v * dt / d); hero.x += dx * m; hero.fy += (hero.tfy - hero.fy) * m; hero.walk = 1; if (Math.abs(dx) > 2) hero.dir = dx > 0 ? 1 : -1; }
        if (idle < 12 && used + t > 0) for (const p of props) if (p.cool <= 0 && Math.hypot(hero.x - p.x - p.ox, (hero.fy - p.fy) * (H - gy) * 0.8) < U * 2.6) { interact(p); break; }
      }
      for (const p of props) {
        if (p.w > 0) p.w = Math.max(0, p.w - dt); if (p.cool > 0 && (!act || act.p !== p)) p.cool -= dt;
        if (p.vy || p.oy < 0) { p.vy += U * 60 * dt; p.oy += p.vy * dt; p.ox += (p.vx || 0) * dt; if (p.oy >= 0) { p.oy = 0; p.vy = p.vy > U * 6 ? -p.vy * 0.6 : 0; if (p.vy) audio.boing(); else { p.x = Math.max(U * 3, Math.min(worldW - U * 3, p.x + p.ox)); p.ox = 0; } } }
      }
      friends.forEach((f, i) => { const tx = hero.x - hero.dir * U * 2.8 * (i + 1), dx = tx - f.x; f.walk = Math.abs(dx) > U * 0.6 ? 1 : 0; if (f.walk) { f.x += dx * Math.min(1, dt * 3); f.dir = dx > 0 ? 1 : -1; } else f.dir = hero.dir; f.fy += (hero.fy + 0.06 * (i + 1) - f.fy) * Math.min(1, dt * 3); });
      for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.kind === 'ball') { b.vy += U * 40 * dt; if (b.y > H * 0.95) { b.y = H * 0.95; b.vy *= -0.7; } } if (b.t > b.max) bits.splice(i, 1); }
      if (act) {
        const a = act; a.t += dt;
        if (a.name === 'gift' && !a.open && a.t > 1.1) { a.open = true; a.p.on = 1; giftOut(a); }
        if (a.name === 'tub' && a.t > 1.2) { hero.mud = Math.max(0, hero.mud - dt); friends.forEach((f) => { f.mud = Math.max(0, f.mud - dt); }); }
        if (a.t >= a.dur) {
          act = null; if (a.p) { hero.tx = hero.x; hero.tfy = hero.fy; }
          if (a.name === 'ride') build2(a.next);
          if (a.name === 'bed') { nightTo = 0; say('wake'); audio.animal('duck'); }
          if (a.name === 'drum' && friends.length) say('together');
          if (a.name === 'gift') a.p.on = 0;
        }
      }
      const want = Math.max(0, Math.min(worldW - W, hero.x - W * 0.45)); cam += (want - cam) * Math.min(1, dt * 3);
    },
    draw(ctx) {
      drawWorld(ctx, place, W, H, S, gy, cam, t, night, rain);
      ctx.save(); ctx.translate(-cam, 0);
      const items = [...props.map((p) => ({ y: Y(p.fy) - (p.type === 'puddle' ? 1e4 : 0), f: () => (act?.name === 'ride' && act.p === p ? 0 : drawOne(ctx, p)) })), ...friends.map((f) => ({ y: Y(f.fy), f: () => drawFriend(ctx, f) })), { y: Y(hero.fy) + 1, f: () => drawHero(ctx) }];
      items.sort((a, b) => a.y - b.y); for (const i of items) i.f();
      for (const b of bits) drawBit(ctx, b);
      ctx.restore();
      drawNight(ctx, W, H, S, gy, t, night);
      parts.draw(ctx);
      if (wipe > 0) { ctx.fillStyle = `rgba(255,255,255,${wipe})`; ctx.fillRect(0, 0, W, H); }
    },
  };

  function build2(p) { build(p); say(p); }
  function giftOut(a) {
    const x = a.p.x, y = Y(a.p.fy) - U * 2; audio.boing(); say('giftOpen');
    if (a.v === 'stars') { spawn('star', x, y, 16); audio.chime(4); } else if (a.v === 'bubbles') { spawn('bubble', x, y, 16); audio.pop(); }
    else if (a.v === 'hearts') { spawn('heart', x, y, 14); audio.giggle(); } else if (a.v === 'balls') spawn('ball', x, y, 9);
    else { const k = FRIENDS.find((q) => !friends.some((f) => f.kind === q)); if (k) { friends.push({ kind: k, x, fy: a.p.fy, mud: 0, dir: 1, walk: 0 }); props = props.filter((q) => q.kind !== k); audio.giggle(); save(); } else spawn('note', x, y, 12); }
    burst(x, y, 26);
  }
  function drawOne(ctx, p) {
    const x = p.x + p.ox, y = Y(p.fy) + p.oy;
    if (p.type === 'friend') { drawChar(ctx, p.kind, x, y, U * 1.25, { t: t + p.x, dir: hero.x > x ? 1 : -1, arms: 0.5 + 0.5 * Math.sin(t * 3), happy: p.w > 0 }); return; }
    if (p.type === 'balloon' && act?.p === p) return; // the hero holds it
    drawProp(ctx, p.type, x, y, U * 1.35, t, p);
  }
  function drawFriend(ctx, f) {
    const party = act && ['drum', 'trick', 'saved'].includes(act.name);
    drawChar(ctx, f.kind, f.x, Y(f.fy) - (party ? Math.abs(Math.sin(t * 7 + f.x)) * U : 0), U * 1.25, { t: t + 1.7, dir: f.dir, walk: f.walk, mud: f.mud, arms: party ? 1 : 0, happy: !!party, sleep: asleep || act?.name === 'bed' });
  }
  function drawHero(ctx) {
    let x = hero.x, y = Y(hero.fy); const s = U * 1.5, p = { t, dir: hero.dir, walk: hero.walk, mud: hero.mud, belly: hero.belly, sleep: asleep };
    const jump = (n, h) => { y -= Math.abs(Math.sin(act.t / act.dur * Math.PI * n)) * U * h; p.arms = 1; };
    if (hero.hop > 0) y -= Math.sin(hero.hop / 0.5 * Math.PI) * U * 2;
    if (hero.knock > 0) { p.look = Math.sin(t * 10) * 0.5; p.arms = 1; p.sx = p.sy = 1.12; }
    if (act) {
      const a = act, u = a.t / a.dur, v = a.v;
      switch (a.name) {
        case 'puddle': if (v === 2) { p.rot = u * TAU * 2; } else jump(3, 3.5); p.happy = true; break;
        case 'cake': p.mouth = 0.5 + 0.5 * Math.sin(a.t * 18); p.look = 0.4; p.arms = 0.6; break;
        case 'tub': x = a.p.x; y = Y(a.p.fy) - U * 0.9; p.arms = 1; p.happy = true; p.rot = Math.sin(a.t * 10) * 0.12; break;
        case 'bed': x = a.p.x - U * 0.6; y = Y(a.p.fy) - U * 1.1; p.dir = 1; p.sleep = true; break;
        case 'ball': if (v === 1) jump(4, 1.6); else { p.rot = Math.sin(u * Math.PI) * -0.3; p.arms = 1; } break;
        case 'drum': jump(6, 1.1); p.happy = true; p.rot = Math.sin(a.t * 9) * 0.18; break;
        case 'flower': if (v === 1 && u > 0.5) { p.sx = 1.15; p.sy = 0.85; p.mouth = 1; x -= hero.dir * Math.sin((u - 0.5) * TAU) * U; } else { p.look = 0.6; p.happy = true; } break;
        case 'gift': p.arms = 1; p.mouth = a.open ? 1 : 0.2; p.sy = 1 + (a.open ? 0 : 0.05 * Math.sin(a.t * 20)); if (a.open) jump(4, 1.5); break;
        case 'balloon': y -= Math.sin(u * Math.PI) * Math.min(U * 9, y * 0.5); p.arms = 1; p.happy = true; drawProp(ctx, 'balloon', x + U * 0.9, y - U * 2.2, U * 1.4, t, a.p); break;
        case 'friend': p.arms = 1; p.happy = true; p.rot = Math.sin(a.t * 8) * 0.15; break;
        case 'lamp': jump(1, 2); break;
        case 'saved': jump(3, 2.5); p.happy = true; break;
        case 'ride': { // leave the place together with the vehicle
          const pr = a.p; if (pr) { const go = Math.max(0, u - 0.25) / 0.75, up = pr.type === 'rocket'; const vx = up ? 0 : go * go * W * 1.2, vy = up ? -go * go * H * 1.2 : Math.sin(a.t * 12) * U * 0.12; x = pr.x + vx; y = Y(pr.fy) + vy - U * (pr.type === 'car' ? 2.4 : 1); p.dir = 1; p.arms = 1; p.happy = true; if (Math.random() < 0.4) parts.burst(x - cam - U * 2, y + U, 2, S * 0.015, ['#ffffff', '#dddddd'], S * 0.2); drawChar(ctx, 'duck', x, y, s, p); drawProp(ctx, pr.type, pr.x + vx, Y(pr.fy) + vy, U * 1.6, t, { ...pr, w: up ? 0.3 : 0 }); return; }
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
    drawChar(ctx, 'duck', x, y, s, p);
    if (trouble === 'stuck') { ctx.fillStyle = '#7a4d2b'; ell(ctx, x, y - U * 0.3, U * 2.6, U * 1); }
    if (asleep || act?.name === 'bed') { ctx.fillStyle = '#ffffff'; ctx.font = `bold ${Math.round(U * 1.5)}px system-ui`; for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.fillText('z', x + U * (1 + k * 2), y - U * (3 + k * 4)); } ctx.globalAlpha = 1; }
  }
  function drawBit(ctx, b) {
    ctx.globalAlpha = Math.min(1, (b.max - b.t) * 2); ctx.fillStyle = b.c;
    if (b.kind === 'heart') { ctx.fillStyle = '#ff5d8f'; drawHeart(ctx, b.x, b.y, b.r); } else if (b.kind === 'bubble') { ctx.fillStyle = 'rgba(200,240,255,.5)'; ell(ctx, b.x, b.y, b.r, b.r); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
    else if (b.kind === 'note') { ell(ctx, b.x, b.y, b.r * 0.7, b.r * 0.5, -0.4); ctx.fillRect(b.x + b.r * 0.5, b.y - b.r * 2, b.r * 0.2, b.r * 2); }
    else if (b.kind === 'star') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.t * 3); ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? b.r * 0.45 : b.r, a = i / 10 * TAU; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.restore(); } else ell(ctx, b.x, b.y, b.r, b.r);
    ctx.globalAlpha = 1;
  }
}
