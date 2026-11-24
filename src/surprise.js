// Baby v3 "Thế giới bất ngờ" (user 2026-11-24: "every play must be new, not one pattern over and over").
// A round = one biome (10 kinds) with 3-4 random hiding spots. Each spot has a random cover and needs 1-3 taps
// (wiggle -> peek -> "Ú òa" reveal). Contents: 70% animal (tap it = next action from its own bag),
// 25% thing (bubbles, fireworks, rainbow...), 5% rare parade + song. Tapping empty space gives a biome reaction.
// Everything comes from shuffle bags, so the same combination practically never comes back.
// The round ends itself (skip = true) a few seconds after the last reveal; main.js mixes in v2 games as short events.
import { TAU, rnd, pick, COLORS, makeBag, bagFor, GROUPS, sayAnimal, makeParticles, shuffle } from './fx.js';
import { drawAnimal, drawStar, drawCover, drawHeart, drawLeaf, drawFlake } from './art.js';
import { sky, circle } from './games4.js';

const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); ctx.fill(); };
const easeBack = (k) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2;

// New covers (footprint like drawCover: about x +-1.3s, y-1.05s .. y+0.9s). Others go to drawCover.
function cover(ctx, type, x, y, s, c) {
  if (type === 'rock') {
    ctx.fillStyle = '#8d96a3'; ell(ctx, x, y + s * 0.2, s * 1.25, s * 0.75); ell(ctx, x - s * 0.35, y - s * 0.3, s * 0.7, s * 0.6);
    ctx.fillStyle = '#a9b2bf'; ell(ctx, x + s * 0.35, y - s * 0.25, s * 0.6, s * 0.55);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(ctx, x - s * 0.45, y - s * 0.55, s * 0.22, s * 0.12, -0.4); return;
  }
  if (type === 'hay') {
    ctx.fillStyle = '#e8b84a'; ell(ctx, x, y + s * 0.15, s * 1.3, s * 0.85); ell(ctx, x, y - s * 0.4, s * 0.85, s * 0.6);
    ctx.strokeStyle = '#c99528'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * s * 0.3, y + s * 0.8); ctx.lineTo(x + i * s * 0.22, y - s * 0.35); ctx.stroke(); }
    return;
  }
  if (type === 'cake') {
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - s * 1.05, y - s * 0.1); ctx.lineTo(x + s * 1.05, y - s * 0.1);
    ctx.lineTo(x + s * 0.8, y + s * 0.9); ctx.lineTo(x - s * 0.8, y + s * 0.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff6fb'; for (const k of [-0.7, 0, 0.7]) circle(ctx, x + k * s, y - s * 0.25, s * 0.45); circle(ctx, x, y - s * 0.65, s * 0.4);
    ctx.fillStyle = '#e63950'; circle(ctx, x, y - s * 1.05, s * 0.16);
    ctx.fillStyle = COLORS[2]; for (let i = 0; i < 6; i++) ctx.fillRect(x + (i - 2.5) * s * 0.3, y - s * (0.3 + (i % 3) * 0.15), s * 0.12, s * 0.05);
    return;
  }
  if (type === 'shell') {
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - s * 1.25, y + s * 0.85); ctx.arc(x, y + s * 0.85, s * 1.25, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = s * 0.07;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.85); ctx.lineTo(x + i * s * 0.5, y - s * 0.3 + Math.abs(i) * s * 0.25); ctx.stroke(); }
    return;
  }
  drawCover(ctx, type, x, y, s, c);
}

// ---------------- biomes ----------------
// bg: [top, bottom], ground color (null = no ground), group = animal group, covers, tap = empty-space reaction.
const BIOMES = {
  garden: { bg: ['#bfe9ff', '#eafaff'], ground: '#8fd16a', group: 'farm', covers: ['bush', 'pot', 'box'], tap: 'flower', deco: 'sun' },
  beach: { bg: ['#8fd8ff', '#fff1c9'], ground: '#f6dc9b', group: 'water', covers: ['shell', 'rock', 'pot'], tap: 'splash', deco: 'sea' },
  snow: { bg: ['#cfe6ff', '#ffffff'], ground: '#f4f9ff', group: 'cold', covers: ['snow', 'rock', 'box'], tap: 'snow', deco: 'flakes' },
  night: { bg: ['#1b2a4a', '#3d4a8a'], ground: '#2f5d4a', group: 'small', covers: ['bush', 'rock', 'box'], tap: 'twinkle', deco: 'moon' },
  farm: { bg: ['#ffe0a8', '#fff8e6'], ground: '#9ccc65', group: 'farm', covers: ['hay', 'box', 'bush'], tap: 'flower', deco: 'barn' },
  jungle: { bg: ['#a8e6a0', '#e8ffd8'], ground: '#4f9a3a', group: 'wild', covers: ['bush', 'rock', 'hay'], tap: 'leaf', deco: 'leaves' },
  sky: { bg: ['#7ec8ff', '#d6f0ff'], ground: null, group: 'sky', covers: ['cloud'], tap: 'puff', deco: 'rainbow' },
  toyroom: { bg: ['#ffe1ec', '#fff4f8'], ground: '#e8b98a', group: 'all', covers: ['box', 'pot', 'cake'], tap: 'ball', deco: 'window' },
  pond: { bg: ['#c8f0ff', '#eafff4'], ground: '#7cc96a', group: 'water', covers: ['bush', 'rock', 'shell'], tap: 'splash', deco: 'pond' },
  candy: { bg: ['#ffd1ec', '#fff0fa'], ground: '#ffb3d9', group: 'small', covers: ['cake', 'cloud', 'box'], tap: 'candy', deco: 'lolly' },
};

const ACTIONS = ['dance', 'jump', 'spin', 'sneeze', 'giggle', 'balloon', 'wave'];
const ACT_SEC = { dance: 1.6, jump: 1.2, spin: 1.0, sneeze: 1.2, giggle: 1.4, balloon: 2.6, wave: 1.4 };
const THINGS = ['bubbles', 'fireworks', 'rainbow', 'balloons', 'stars', 'ball', 'notes'];
const thingBag = makeBag(THINGS);
const praise = makeBag(['Tìm thấy rồi!', 'Bé giỏi quá!', 'Hoan hô!']);

function surpriseRound(audio, key) {
  const B = BIOMES[key];
  const coverBag = makeBag(B.covers), animals = bagFor(B.group);
  let W = 1, H = 1, S = 1, t = 0, gy = 1, idle = 0, hintT = 0, lastReveal = 0, endT = -1, praised = false, trailT = 0;
  let spots = [], bits = [], floaters = [], parade = null, deco = [];
  const parts = makeParticles();

  function layout() {
    const n = spots.length, land = W >= H;
    gy = H * (land ? 0.58 : 0.5);
    const cols = land ? n : 2, rows = Math.ceil(n / cols);
    const s = Math.min((W / cols) * 0.27, (land ? H * 0.16 : H * 0.11));
    spots.forEach((p, i) => {
      const r = Math.floor(i / cols), inRow = Math.min(cols, n - r * cols), c = i % cols;
      p.s = s;
      p.x = (c + 0.5) * (W / inRow) + p.jx * (W / inRow) * 0.12;
      p.y = land ? H * 0.74 + p.jy * H * 0.05 : H * (0.6 + r * 0.24) + p.jy * H * 0.03;
    });
  }

  function newRound() {
    t = 0; idle = 0; hintT = 0; endT = -1; praised = false; lastReveal = 0; bits = []; floaters = []; parade = null;
    const n = Math.random() < 0.5 ? 3 : 4;
    let rareUsed = false;
    spots = [];
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      let kind = 'animal';
      if (r < 0.05 && !rareUsed) { kind = 'parade'; rareUsed = true; } else if (r < 0.3) kind = 'thing';
      spots.push({
        kind, animal: animals.next(), thing: thingBag.next(), acts: makeBag(ACTIONS),
        cover: coverBag.next(), color: pick(COLORS), need: pick([1, 1, 2, 2, 3]), hits: 0,
        wig: 0, peek: 0, open: false, openT: 0, act: null, actT: 0, ph: rnd(0, TAU), dir: Math.random() < 0.5 ? -1 : 1,
        jx: rnd(-1, 1), jy: rnd(-1, 1), x: 0, y: 0, s: 1, fx: 0,
      });
    }
    if (!spots.some((p) => p.kind === 'animal')) spots[0].kind = 'animal';
    shuffle(spots);
    deco = []; for (let i = 0; i < 14; i++) deco.push({ x: Math.random(), y: Math.random(), r: rnd(0.6, 1.4), ph: rnd(0, TAU) });
    layout();
    audio.say('Ai trốn ở đây ta?', 700);
  }

  // ---------- effects ----------
  function float(kind, x, y, n, spread = 1) {
    for (let i = 0; i < n; i++) {
      floaters.push({ kind, x: x + rnd(-1, 1) * S * 0.08 * spread, y, vx: rnd(-40, 40), vy: kind === 'star' ? rnd(80, 200) : -rnd(60, 140),
        r: S * (kind === 'balloon' ? rnd(0.045, 0.06) : rnd(0.02, 0.04)), c: pick(COLORS), life: 0, max: rnd(3, 5), ph: rnd(0, TAU) });
    }
    if (floaters.length > 120) floaters.splice(0, floaters.length - 120);
  }
  function fireThing(p) {
    const { x, s } = p, y = p.y - s * 0.3;
    p.fx = 1;
    switch (p.thing) {
      case 'bubbles': float('bubble', x, y, 8, 2); audio.pop(); setTimeout(() => audio.pop(), 150); break;
      case 'fireworks': for (let i = 0; i < 3; i++) setTimeout(() => { parts.burst(x + rnd(-1, 1) * S * 0.2, H * rnd(0.12, 0.35), 26, S * 0.02, COLORS, S * 0.6); audio.pop(); audio.chime(i * 2); }, i * 220); break;
      case 'rainbow': for (let i = 0; i < 5; i++) setTimeout(() => audio.chime(i), i * 110); break;
      case 'balloons': float('balloon', x, y, 4, 3); audio.inflate(2); break;
      case 'stars': for (let i = 0; i < 12; i++) floaters.push({ kind: 'star', x: rnd(0.05, 0.95) * W, y: -rnd(0, H * 0.3), vx: 0, vy: rnd(120, 220), r: S * rnd(0.02, 0.035), c: '#ffd23f', life: 0, max: 5, ph: rnd(0, TAU) }); audio.twinkle(); audio.chime(4); break;
      case 'ball': p.ballV = -S * 2.2; audio.boing(); break;
      case 'notes': float('note', x, y, 5, 2); for (let i = 0; i < 4; i++) audio.note(pick([0, 2, 4, 5, 7]), i * 0.18); break;
    }
  }
  function startParade() {
    const list = (GROUPS[B.group] || GROUPS.all).slice(0, 7);
    parade = { t: 0, list: shuffle([...list]) };
    audio.song(7);
  }
  function emptyTap(x, y) {
    const c = pick(COLORS);
    switch (B.tap) {
      case 'flower': bits.push({ type: 'flower', x, y: Math.max(y, gy + S * 0.03), t: 0, c }); audio.note(pick([0, 2, 4, 7, 9])); break;
      case 'splash': bits.push({ type: 'ring', x, y, t: 0, c: '#ffffff' }); parts.burst(x, y, 12, S * 0.012, ['#4cc9f0', '#bdeeff', '#ffffff'], S * 0.5); audio.pop(); break;
      case 'snow': for (let i = 0; i < 4; i++) bits.push({ type: 'flake', x: x + rnd(-1, 1) * S * 0.06, y, t: 0, c: '#ffffff', vy: rnd(30, 70), rot: rnd(0, TAU) }); audio.chime(pick([2, 4, 6])); break;
      case 'twinkle': bits.push({ type: 'star', x, y, t: 0, c: '#fff3b0' }); audio.chime(pick([0, 3, 5, 7])); break;
      case 'leaf': for (let i = 0; i < 3; i++) bits.push({ type: 'leaf', x: x + rnd(-1, 1) * S * 0.05, y, t: 0, c: pick(['#6cc24a', '#3f9e4d', '#a3d977']), vy: rnd(40, 80), rot: rnd(0, TAU) }); audio.rustle(); break;
      case 'puff': bits.push({ type: 'puff', x, y, t: 0, c: '#ffffff' }); audio.whoosh(); audio.twinkle(); break;
      case 'ball': bits.push({ type: 'ball', x, y, t: 0, c, vx: rnd(-1, 1) * S * 0.6, vy: -S * 1.2 }); audio.boing(); break;
      case 'candy': parts.burst(x, y, 16, S * 0.014, COLORS, S * 0.55); bits.push({ type: 'star', x, y, t: 0, c }); audio.note(pick([4, 5, 7, 9])); break;
    }
    if (bits.length > 30) bits.splice(0, bits.length - 30);
  }

  function reveal(p) {
    p.open = true; p.openT = 0; lastReveal = t;
    parts.burst(p.x, p.y - p.s * 0.3, 22, S * 0.02, COLORS, S * 0.6);
    audio.boing();
    if (p.kind === 'animal') { audio.say('Ú òa!'); sayAnimal(audio, p.animal, 1100); p.act = 'jump'; p.actT = 0; }
    else if (p.kind === 'thing') { audio.say('Oa, đẹp quá!', 300); fireThing(p); }
    else { audio.say('Hoan hô!'); startParade(); }
  }

  function hitSpot(x, y) {
    let best = null, bd = 1e9;
    for (const p of spots) { const d = Math.hypot(x - p.x, y - (p.y - p.s * 0.2)); if (d < p.s * 1.35 && d < bd) { bd = d; best = p; } }
    return best;
  }

  return {
    selfPaced: true,
    resize(w, h) { W = w; H = h; S = Math.min(w, h); layout(); },
    enter() { newRound(); },
    leave() { parade = null; },
    tap(x, y) {
      idle = 0;
      const p = hitSpot(x, y);
      if (!p) { emptyTap(x, y); return; }
      if (!p.open) {
        p.hits++; p.wig = 0.6;
        audio.rustle(); audio.note(p.hits * 2);
        parts.burst(x, y, 6, S * 0.012, ['#ffffff', p.color], S * 0.3);
        if (p.hits >= p.need) reveal(p); else p.peek = 0.01;
        return;
      }
      if (p.kind === 'animal') {
        p.act = p.acts.next(); p.actT = 0;
        if (p.act === 'giggle') audio.giggle();
        else if (p.act === 'sneeze') { audio.whoosh(); setTimeout(() => audio.pop(), 350); }
        else if (p.act === 'balloon') audio.inflate(3);
        else if (p.act === 'spin') audio.boing();
        else audio.animal(p.animal);
        if (p.act === 'wave') for (let i = 0; i < 3; i++) bits.push({ type: 'heart', x: p.x + rnd(-1, 1) * p.s * 0.5, y: p.y - p.s, t: 0, c: '#ff5d8f' });
        if (p.act === 'dance') float('note', p.x, p.y - p.s, 3);
      } else if (p.kind === 'thing') fireThing(p);
      else { parts.burst(x, y, 20, S * 0.02, COLORS, S * 0.6); audio.animal(pick(parade?.list || ['cat'])); }
    },
    drag(x, y) {
      idle = 0;
      if (t - trailT < 0.08) return;
      trailT = t; parts.burst(x, y, 3, S * 0.01, COLORS, S * 0.15);
      if (Math.random() < 0.35) audio.twinkle();
    },
    update(dt) {
      t += dt; idle += dt;
      parts.update(dt, 160);
      for (const p of spots) {
        if (p.wig > 0) p.wig = Math.max(0, p.wig - dt);
        if (p.peek > 0) { p.peek += dt / 0.9; if (p.peek >= 1) p.peek = 0; }
        if (p.open) p.openT += dt;
        if (p.act) { p.actT += dt; if (p.actT >= ACT_SEC[p.act]) p.act = null; }
        if (p.act === 'sneeze' && p.actT > 0.35 && !p.sneezed) { p.sneezed = true; parts.burst(p.x + p.s * 0.2, p.y - p.s * 0.1, 10, S * 0.012, ['#ffffff', '#cfefff'], S * 0.35); }
        if (p.act !== 'sneeze') p.sneezed = false;
        if (p.fx > 0) p.fx = Math.max(0, p.fx - dt / 2.5);
        if (p.ballV !== undefined) { p.ballY = (p.ballY || 0) + p.ballV * dt; p.ballV += S * 5 * dt; if (p.ballY > 0) { p.ballY = 0; p.ballV = p.ballV > S * 0.4 ? -p.ballV * 0.5 : 0; } }
      }
      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i]; f.life += dt; f.x += (f.vx + Math.sin(t * 2 + f.ph) * 20) * dt; f.y += f.vy * dt;
        if (f.life > f.max || f.y < -S * 0.2 || f.y > H + S * 0.1) floaters.splice(i, 1);
      }
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i]; b.t += dt;
        if (b.vy && b.type !== 'ball') { b.y += b.vy * dt; b.x += Math.sin(b.t * 3 + (b.rot || 0)) * 20 * dt; b.rot = (b.rot || 0) + dt; }
        if (b.type === 'ball') { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += S * 3 * dt; const fl = H * 0.97; if (b.y > fl) { b.y = fl; b.vy = -Math.abs(b.vy) * 0.6; } if (b.x < 0 || b.x > W) b.vx = -b.vx; }
        if (b.t > (b.type === 'flower' ? 7 : b.type === 'ball' ? 5 : 2.2)) bits.splice(i, 1);
      }
      if (parade) { parade.t += dt; if (parade.t > 9) parade = null; }

      // Idle hint: a hidden spot wiggles and calls the baby.
      const hidden = spots.filter((p) => !p.open);
      if (hidden.length && idle > 5 && t - hintT > 12) { hintT = t; const p = pick(hidden); p.wig = 1.2; p.peek = 0.01; audio.rustle(); audio.say('Chạm vào đây nè!'); }
      if (hidden.length && idle > 5) for (const p of hidden) if (p.wig <= 0 && Math.random() < dt * 0.3) p.wig = 0.5;

      // Round end: all found -> praise -> "Đi tiếp nào!" -> next round (main.js reads skip).
      if (!hidden.length) {
        const since = t - lastReveal;
        if (!praised && since > 3) { praised = true; audio.say(praise.next()); for (let i = 0; i < 3; i++) setTimeout(() => parts.burst(rnd(0.2, 0.8) * W, H * rnd(0.15, 0.4), 24, S * 0.02, COLORS, S * 0.6), i * 250); }
        if (endT < 0 && since > 9 && (idle > 3 || since > 20)) { endT = 0; audio.say('Đi tiếp nào!'); }
      }
      if (endT >= 0 && (endT += dt) > 1.8) { endT = -1; this.skip = true; }
    },
    draw(ctx) {
      sky(ctx, W, H, B.bg[0], B.bg[1]);
      drawDeco(ctx);
      if (B.ground) {
        ctx.fillStyle = B.ground; ctx.beginPath(); ctx.moveTo(0, gy);
        for (let i = 0; i <= 8; i++) ctx.quadraticCurveTo((i - 0.5) * W / 8, gy - S * 0.03 * Math.sin(i * 1.7), i * W / 8, gy);
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        if (key === 'toyroom') { ctx.strokeStyle = 'rgba(120,70,30,.18)'; ctx.lineWidth = 2; for (let y = gy + S * 0.06; y < H; y += S * 0.08) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
      }
      for (const b of bits) drawBit(ctx, b);
      for (const p of spots) drawSpot(ctx, p);
      for (const f of floaters) drawFloater(ctx, f);
      if (parade) drawParade(ctx);
      parts.draw(ctx);
      if (endT >= 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, endT / 1.8)})`; ctx.fillRect(0, 0, W, H); }
    },
  };

  // ---------- drawing ----------
  function drawDeco(ctx) {
    switch (B.deco) {
      case 'sun': ctx.fillStyle = '#ffd23f'; circle(ctx, W * 0.85, H * 0.13, S * 0.08); ctx.fillStyle = '#ffffff'; for (const d of deco.slice(0, 3)) { const x = ((d.x * W + t * 12) % (W + 200)) - 100; ell(ctx, x, H * 0.08 + d.y * H * 0.2, S * 0.09 * d.r, S * 0.035 * d.r); } break;
      case 'sea': ctx.fillStyle = '#4cb8e8'; ctx.fillRect(0, gy - S * 0.13, W, S * 0.14); ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let x = 0; x < W; x += S * 0.08) ell(ctx, x + (t * 20) % (S * 0.08), gy - S * 0.13, S * 0.03, S * 0.012); ctx.fillStyle = '#ffd23f'; circle(ctx, W * 0.15, H * 0.12, S * 0.07); break;
      case 'flakes': ctx.strokeStyle = '#a8c8ec'; for (const d of deco) { const y = ((d.y * H + t * 30 * d.r) % H); drawFlake(ctx, d.x * W + Math.sin(t + d.ph) * 10, y, S * 0.012 * d.r, t * 0.5); } break;
      case 'moon': ctx.fillStyle = '#fff3b0'; circle(ctx, W * 0.82, H * 0.13, S * 0.07); ctx.fillStyle = B.bg[0]; circle(ctx, W * 0.82 + S * 0.03, H * 0.12, S * 0.06);
        for (const d of deco) { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + d.ph)); ctx.fillStyle = '#ffffff'; drawStar(ctx, d.x * W, d.y * gy * 0.85, S * 0.01 * d.r, 0); } ctx.globalAlpha = 1; break;
      case 'barn': { const bx = W * 0.8, by = gy, bw = S * 0.22; ctx.fillStyle = '#d94b3b'; ctx.fillRect(bx - bw / 2, by - bw * 0.7, bw, bw * 0.7); ctx.fillStyle = '#a8322a'; ctx.beginPath(); ctx.moveTo(bx - bw * 0.6, by - bw * 0.7); ctx.lineTo(bx, by - bw * 1.1); ctx.lineTo(bx + bw * 0.6, by - bw * 0.7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(bx - bw * 0.15, by - bw * 0.4, bw * 0.3, bw * 0.4);
        ctx.fillStyle = '#c99a5b'; for (let x = 0; x < W * 0.6; x += S * 0.06) ctx.fillRect(x, gy - S * 0.07, S * 0.015, S * 0.07); ctx.fillRect(0, gy - S * 0.055, W * 0.6, S * 0.012); break; }
      case 'leaves': for (const d of deco.slice(0, 8)) { ctx.fillStyle = d.r > 1 ? '#3f9e4d' : '#6cc24a'; drawLeaf(ctx, d.x * W, d.y * gy * 0.6, S * 0.07 * d.r, d.ph + Math.sin(t + d.ph) * 0.1); } break;
      case 'rainbow': { const cx = W * 0.5, cy = H * 0.75, R = Math.max(W, H) * 0.5; ctx.globalAlpha = 0.35; ctx.lineWidth = S * 0.025; ['#ff5d73', '#ffb627', '#ffe14d', '#7bd389', '#4cc9f0', '#b388ff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(cx, cy, R - i * S * 0.025, Math.PI, 0); ctx.stroke(); }); ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,.8)'; for (const d of deco.slice(0, 5)) { const x = ((d.x * W + t * 15 * d.r) % (W + 200)) - 100; ell(ctx, x, d.y * H * 0.4, S * 0.1 * d.r, S * 0.04 * d.r); } break; }
      case 'window': { const wx = W * 0.75, wy = gy * 0.35, ww = S * 0.16; ctx.fillStyle = '#ffffff'; ctx.fillRect(wx - ww - 6, wy - ww - 6, ww * 2 + 12, ww * 2 + 12); ctx.fillStyle = '#9fdcff'; ctx.fillRect(wx - ww, wy - ww, ww * 2, ww * 2); ctx.fillStyle = '#ffd23f'; circle(ctx, wx + ww * 0.4, wy - ww * 0.4, ww * 0.25); ctx.fillStyle = '#ffffff'; ctx.fillRect(wx - 3, wy - ww, 6, ww * 2); ctx.fillRect(wx - ww, wy - 3, ww * 2, 6);
        ctx.strokeStyle = '#ff8fab'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, gy * 0.12); for (let x = 0; x <= W * 0.5; x += 20) ctx.lineTo(x, gy * 0.12 + Math.sin(x / 40) * 10 + 10); ctx.stroke(); for (let x = 20; x < W * 0.5; x += 60) { ctx.fillStyle = COLORS[(x / 60 | 0) % COLORS.length]; ctx.beginPath(); ctx.moveTo(x - 10, gy * 0.12 + 12); ctx.lineTo(x + 10, gy * 0.12 + 12); ctx.lineTo(x, gy * 0.12 + 34); ctx.fill(); } break; }
      case 'pond': ctx.fillStyle = '#5cc0e8'; ell(ctx, W * 0.5, gy + (H - gy) * 0.35, W * 0.42, (H - gy) * 0.25); ctx.fillStyle = '#3f9e4d'; for (const d of deco.slice(0, 4)) ell(ctx, W * (0.2 + d.x * 0.6), gy + (H - gy) * (0.25 + d.y * 0.2), S * 0.045, S * 0.018); ctx.strokeStyle = '#3f9e4d'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(W * 0.04 + i * 8, gy + 4); ctx.lineTo(W * 0.04 + i * 8 + Math.sin(t + i) * 4, gy - S * 0.12); ctx.stroke(); } break;
      case 'lolly': for (const d of deco.slice(0, 4)) { const x = W * (0.1 + d.x * 0.8), h = S * 0.18 * d.r; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, gy - h, 4, h); ctx.fillStyle = COLORS[(d.ph * 3 | 0) % COLORS.length]; circle(ctx, x, gy - h, S * 0.04 * d.r); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, gy - h, S * 0.022 * d.r, t, t + 4); ctx.stroke(); } break;
    }
  }

  function drawSpot(ctx, p) {
    const { x, y, s } = p;
    if (p.open) drawContent(ctx, p);
    else if (p.peek > 0) {
      const k = Math.sin(p.peek * Math.PI);
      if (p.kind === 'animal') drawAnimal(ctx, p.animal, x, y - s * 0.4 - k * s * 0.5, s * 0.7, t + p.ph);
      else { ctx.globalAlpha = k; ctx.fillStyle = '#ffd23f'; drawStar(ctx, x, y - s * 0.9 - k * s * 0.5, s * 0.35, t * 3); ctx.globalAlpha = 1; }
    }
    if (p.open && p.openT > 0.6) return;
    const fly = p.open ? p.openT / 0.6 : 0;
    const wig = p.wig > 0 ? Math.sin(p.wig * 32) * 0.13 * Math.min(1, p.wig * 3) : Math.sin(t * 1.5 + p.ph) * 0.015;
    ctx.save(); ctx.globalAlpha = 1 - fly;
    ctx.translate(x + fly * s * 2.5 * p.dir, y + s * 0.9 - fly * s * 1.6 + (key === 'sky' ? Math.sin(t + p.ph) * s * 0.08 : 0));
    ctx.rotate(wig + fly * 1.5 * p.dir);
    cover(ctx, p.cover, 0, -s * 0.9, s, p.color);
    ctx.restore();
    // Tap-progress dots: how many taps are still needed (big, simple).
    if (!p.open && p.need > 1) for (let i = 0; i < p.need; i++) { ctx.fillStyle = i < p.hits ? '#ffd23f' : 'rgba(255,255,255,.7)'; circle(ctx, x + (i - (p.need - 1) / 2) * s * 0.35, y + s * 1.12, s * 0.1); }
  }

  function drawContent(ctx, p) {
    const { x, y, s } = p, k = easeBack(Math.min(1, p.openT * 2.5));
    if (p.kind === 'thing') { drawThing(ctx, p, x, y - s * 0.2 + (1 - k) * s, s * k); return; }
    if (p.kind === 'parade') { ctx.fillStyle = '#ffd23f'; drawStar(ctx, x, y - s * 0.3 + (1 - k) * s, s * 0.8 * k * (1 + 0.08 * Math.sin(t * 5)), t); return; }
    let dx = 0, dy = 0, rot = 0, sx = 1, sy = 1;
    const a = p.act, u = a ? p.actT / ACT_SEC[a] : 0, bump = Math.sin(u * Math.PI);
    if (a === 'dance') { rot = Math.sin(p.actT * 11) * 0.3; dx = Math.sin(p.actT * 5.5) * s * 0.25; }
    else if (a === 'jump') { dy = -Math.abs(Math.sin(u * Math.PI * 2)) * s * 1.1; sy = 1 + 0.1 * Math.sin(u * Math.PI * 4); }
    else if (a === 'spin') rot = u * TAU;
    else if (a === 'sneeze') { const q = u < 0.3 ? u / 0.3 : Math.max(0, 1 - (u - 0.3) * 3); sy = 1 + 0.15 * q; sx = 1 - 0.08 * q; if (u > 0.3 && u < 0.45) dx = s * 0.15; }
    else if (a === 'giggle') { dx = Math.sin(p.actT * 45) * s * 0.06; rot = Math.sin(p.actT * 20) * 0.08; }
    else if (a === 'balloon') dy = -bump * Math.min(s * 3, y * 0.6);
    else if (a === 'wave') { sx = sy = 1 + 0.15 * bump; }
    const ay = y - s * 0.15 + (1 - k) * s + dy + Math.sin(t * 2 + p.ph) * s * 0.03;
    if (a === 'balloon') { const bx = x + dx, by = ay - s * 1.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, ay - s * 0.7); ctx.lineTo(bx, by + s * 0.45); ctx.stroke(); ctx.fillStyle = p.color; ell(ctx, bx, by, s * 0.4, s * 0.48); ctx.fillStyle = 'rgba(255,255,255,.45)'; ell(ctx, bx - s * 0.13, by - s * 0.15, s * 0.08, s * 0.13); }
    ctx.save(); ctx.translate(x + dx, ay); ctx.rotate(rot); ctx.scale(sx * k, sy * k);
    drawAnimal(ctx, p.animal, 0, 0, s * 0.85, t + p.ph);
    ctx.restore();
  }

  function drawThing(ctx, p, x, y, s) {
    const glow = 1 + 0.1 * Math.sin(t * 4 + p.ph) + p.fx * 0.25;
    ctx.save(); ctx.translate(x, y); ctx.scale(glow, glow);
    switch (p.thing) {
      case 'bubbles': ctx.strokeStyle = '#4cc9f0'; ctx.lineWidth = s * 0.08; ctx.fillStyle = 'rgba(200,240,255,.45)'; ctx.beginPath(); ctx.arc(0, 0, s * 0.7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ell(ctx, -s * 0.25, -s * 0.25, s * 0.14, s * 0.09, -0.6); break;
      case 'fireworks': ctx.fillStyle = '#ff5d73'; ctx.fillRect(-s * 0.18, -s * 0.5, s * 0.36, s * 0.9); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(-s * 0.25, -s * 0.5); ctx.lineTo(0, -s * 0.85); ctx.lineTo(s * 0.25, -s * 0.5); ctx.fill(); drawStar(ctx, 0, s * 0.55, s * 0.2, t * 6); break;
      case 'rainbow': ctx.lineWidth = s * 0.14; ['#ff5d73', '#ffb627', '#ffe14d', '#7bd389', '#4cc9f0', '#b388ff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(0, s * 0.4, s * (0.95 - i * 0.14), Math.PI, Math.PI + Math.PI * Math.min(1, 0.4 + p.openT + (1 - p.fx))); ctx.stroke(); }); break;
      case 'balloons': [[-0.35, '#ff5d73'], [0.35, '#4cc9f0'], [0, '#ffd23f']].forEach(([o, c], i) => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, s * 0.8); ctx.lineTo(o * s, -s * 0.1 - i * s * 0.1); ctx.stroke(); ctx.fillStyle = c; ell(ctx, o * s, -s * 0.45 - i * s * 0.1, s * 0.3, s * 0.37); }); break;
      case 'stars': ctx.fillStyle = '#ffd23f'; drawStar(ctx, 0, 0, s * 0.75, Math.sin(t) * 0.2); ctx.fillStyle = '#5a4a1a'; circle(ctx, -s * 0.18, -s * 0.05, s * 0.07); circle(ctx, s * 0.18, -s * 0.05, s * 0.07); break;
      case 'ball': { const by = (p.ballY || 0); ctx.fillStyle = '#ff5d73'; circle(ctx, 0, by, s * 0.6); ctx.fillStyle = '#ffffff'; ctx.fillRect(-s * 0.6, by - s * 0.1, s * 1.2, s * 0.2); ctx.fillStyle = '#4cc9f0'; circle(ctx, 0, by, s * 0.18); break; }
      case 'notes': ctx.fillStyle = '#b388ff'; ell(ctx, -s * 0.2, s * 0.4, s * 0.25, s * 0.19, -0.4); ctx.fillRect(s * 0.02, -s * 0.6, s * 0.1, s * 1.0); ctx.fillRect(s * 0.02, -s * 0.6, s * 0.45, s * 0.14); break;
    }
    ctx.restore();
  }

  function drawFloater(ctx, f) {
    ctx.globalAlpha = Math.min(1, (f.max - f.life) * 2);
    if (f.kind === 'bubble') { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(180,230,255,.35)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); ctx.stroke(); }
    else if (f.kind === 'balloon') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(f.x, f.y + f.r); ctx.lineTo(f.x + Math.sin(t * 3 + f.ph) * 5, f.y + f.r * 3); ctx.stroke(); ctx.fillStyle = f.c; ell(ctx, f.x, f.y, f.r * 0.85, f.r); }
    else if (f.kind === 'note') { ctx.fillStyle = f.c; ell(ctx, f.x, f.y, f.r * 0.6, f.r * 0.45, -0.4); ctx.fillRect(f.x + f.r * 0.45, f.y - f.r * 1.6, f.r * 0.18, f.r * 1.6); }
    else { ctx.fillStyle = f.c; drawStar(ctx, f.x, f.y, f.r, t + f.ph); }
    ctx.globalAlpha = 1;
  }

  function drawBit(ctx, b) {
    const k = Math.min(1, b.t * 3);
    switch (b.type) {
      case 'flower': { const h = S * 0.08 * k, fade = b.t > 6 ? 7 - b.t : 1; ctx.globalAlpha = Math.max(0, fade); ctx.strokeStyle = '#3f9e4d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x, b.y - h); ctx.stroke(); ctx.fillStyle = b.c; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + b.t; circle(ctx, b.x + Math.cos(a) * S * 0.02 * k, b.y - h + Math.sin(a) * S * 0.02 * k, S * 0.016 * k); } ctx.fillStyle = '#ffd23f'; circle(ctx, b.x, b.y - h, S * 0.012 * k); break; }
      case 'ring': ctx.globalAlpha = Math.max(0, 1 - b.t / 1.2); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; for (const o of [0, 0.25]) { ctx.beginPath(); ctx.ellipse(b.x, b.y, S * 0.02 + (b.t + o) * S * 0.12, S * 0.008 + (b.t + o) * S * 0.04, 0, 0, TAU); ctx.stroke(); } break;
      case 'flake': ctx.globalAlpha = Math.max(0, 1 - b.t / 2.2); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff'; drawFlake(ctx, b.x, b.y, S * 0.022, b.rot); break;
      case 'leaf': ctx.globalAlpha = Math.max(0, 1 - b.t / 2.2); ctx.fillStyle = b.c; drawLeaf(ctx, b.x, b.y, S * 0.03, b.rot); break;
      case 'star': ctx.globalAlpha = Math.max(0, 1 - b.t / 2.2); ctx.fillStyle = b.c; drawStar(ctx, b.x, b.y - b.t * S * 0.03, S * 0.035 * k * (1 + 0.2 * Math.sin(b.t * 10)), b.t * 2); break;
      case 'puff': ctx.globalAlpha = Math.max(0, 1 - b.t / 2.2); ctx.fillStyle = b.c; for (const [ox, oy, r] of [[0, 0, 1], [-0.9, 0.3, 0.7], [0.9, 0.3, 0.7]]) circle(ctx, b.x + ox * S * 0.04 * k, b.y + oy * S * 0.04 * k, r * S * 0.045 * k); break;
      case 'ball': ctx.globalAlpha = Math.max(0, Math.min(1, 5 - b.t)); ctx.fillStyle = b.c; circle(ctx, b.x, b.y, S * 0.035); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(ctx, b.x - S * 0.01, b.y - S * 0.01, S * 0.01); break;
      case 'heart': ctx.globalAlpha = Math.max(0, 1 - b.t / 2.2); ctx.fillStyle = b.c; drawHeart(ctx, b.x + Math.sin(b.t * 4) * 8, b.y - b.t * S * 0.12, S * 0.03); break;
    }
    ctx.globalAlpha = 1;
  }

  function drawParade(ctx) {
    const n = parade.list.length, s = S * 0.07, span = W + n * s * 3;
    parade.list.forEach((kind, i) => {
      const x = -s * 2 + ((parade.t / 9) * span) - i * s * 2.8, y = (B.ground ? gy : H * 0.6) - s * 0.2 - Math.abs(Math.sin(parade.t * 6 + i)) * s * 0.5;
      if (x > -s * 2 && x < W + s * 2) drawAnimal(ctx, kind, x, y, s, t + i);
    });
  }
}

// One entry per biome: {name: 'surprise.<biome>', make}. Marked surprise -> main.js uses them as the main rounds.
export function surpriseGames(audio) {
  return Object.keys(BIOMES).map((k) => ({ name: `surprise.${k}`, surprise: true, make: () => surpriseRound(audio, k) }));
}
