// Baby v2 device games (2026-11-18): mirror (front camera with random funny styles) and shout (microphone level).
// Camera/mic frames are only drawn/measured live: nothing is recorded, stored or sent. Streams stop when the game ends (leave()).
import { drawAnimal } from './art.js';
import { TAU, rnd, pick, COLORS, makeParticles, bagFor, sayAnimal } from './fx.js';
import { sky, circle, face, variants } from './games4.js';

let camDenied = false;
// 6) Mirror: the child sees their face; every tap switches to another random style (ears, crown, warp, kaleidoscope...).
const MIRROR = {
  hats: { styles: ['cat', 'bunny', 'bear', 'crown', 'glasses', 'flowers'] },
  funny: { styles: ['warp', 'big', 'tall', 'wide', 'spin'] },
  color: { styles: ['tint', 'mosaic', 'kaleido', 'quad', 'rainbow'] },
  frames: { styles: ['bubbles', 'stars', 'hearts', 'tv', 'flowers'] },
  mix: { styles: ['cat', 'bunny', 'bear', 'crown', 'glasses', 'warp', 'big', 'tall', 'wide', 'tint', 'mosaic', 'kaleido', 'quad', 'bubbles', 'stars', 'hearts', 'tv', 'rainbow', 'spin'] },
};
function mirrorScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, style = th.styles[0], styleT = 0, stream = null, video = null, flash = 0, tintC = COLORS[0], ready = false;
  const parts = makeParticles(), buf = document.createElement('canvas'), bx = buf.getContext('2d');
  const small = document.createElement('canvas'), sx = small.getContext('2d');
  const scene = {
    skip: false,
    resize(w, h) { W = w; H = h; S = Math.min(w, h); buf.width = Math.max(1, w | 0); buf.height = Math.max(1, h | 0); },
    async enter() {
      style = pick(th.styles); styleT = 0; ready = false;
      if (camDenied || !navigator.mediaDevices?.getUserMedia) { scene.skip = true; return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        video = document.createElement('video'); video.muted = true; video.playsInline = true; video.setAttribute('playsinline', ''); video.srcObject = stream;
        await video.play(); ready = true;
        audio.say('Ai đây nhỉ?', 300);
      } catch { camDenied = true; scene.skip = true; }
    },
    leave() { stream?.getTracks().forEach((k) => k.stop()); stream = null; video = null; ready = false; },
    tap(x, y) {
      let s; do s = pick(th.styles); while (s === style && th.styles.length > 1);
      style = s; styleT = 0; flash = 1; tintC = pick(COLORS);
      audio[pick(['boing', 'pop', 'giggle'])](); parts.burst(x, y, 16, S * 0.025, COLORS, S * 0.6);
    },
    drag() {},
    update(dt) {
      t += dt; styleT += dt; flash = Math.max(0, flash - dt * 3); parts.update(dt, 200);
      if (styleT > 7) { scene.tap(W / 2, H / 2); }
    },
    draw(ctx) {
      if (!ready) { sky(ctx, W, H, '#ffe5ec', '#fff8e7'); ctx.fillStyle = '#ffb3c6'; circle(ctx, W / 2, H / 2, S * (0.2 + 0.02 * Math.sin(t * 4))); face(ctx, W / 2, H / 2, S * 0.2); return; }
      // Mirrored "cover" draw of the camera into buf (W x H).
      const vw = video.videoWidth || 640, vh = video.videoHeight || 480, k = Math.max(W / vw, H / vh);
      bx.save(); bx.translate(W, 0); bx.scale(-1, 1); bx.drawImage(video, (W - vw * k) / 2, (H - vh * k) / 2, vw * k, vh * k); bx.restore();
      const cx = W / 2, cy = H * 0.45, F = S * 0.3;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      if (style === 'warp') { const n = 48, h = H / n; for (let i = 0; i < n; i++) ctx.drawImage(buf, 0, i * h, W, h + 1, Math.sin(t * 4 + i * 0.35) * S * 0.05, i * h, W, h + 1); }
      else if (style === 'big') { ctx.drawImage(buf, 0, 0); const r = F * 1.1; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip(); ctx.drawImage(buf, cx - r * 0.6, cy - r * 0.6, r * 1.2, r * 1.2, cx - r, cy - r, r * 2, r * 2); ctx.restore(); }
      else if (style === 'tall' || style === 'wide') { const a = 1 + 0.35 * Math.abs(Math.sin(t * 2)); ctx.save(); ctx.translate(cx, cy); ctx.scale(style === 'wide' ? a : 1 / a, style === 'tall' ? a : 1 / a); ctx.drawImage(buf, -cx, -cy); ctx.restore(); }
      else if (style === 'spin') { ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t * 1.5) * 0.4); ctx.scale(1.3, 1.3); ctx.drawImage(buf, -cx, -cy); ctx.restore(); }
      else if (style === 'kaleido' || style === 'quad') {
        const w2 = W / 2, h2 = H / 2;
        for (let i = 0; i < 4; i++) {
          ctx.save(); ctx.translate((i % 2) * w2, (i >> 1) * h2);
          if (style === 'kaleido') { ctx.translate(i % 2 ? w2 : 0, i >> 1 ? h2 : 0); ctx.scale(i % 2 ? -1 : 1, i >> 1 ? -1 : 1); }
          ctx.drawImage(buf, W * 0.2, H * 0.1, W * 0.6, H * 0.7, 0, 0, w2, h2);
          if (style === 'quad') { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = COLORS[(i * 2 + (t | 0)) % 8]; ctx.fillRect(0, 0, w2, h2); }
          ctx.restore();
        }
      } else if (style === 'mosaic') {
        const q = 18 + 10 * Math.sin(t * 2); small.width = Math.max(4, W / q | 0); small.height = Math.max(4, H / q | 0);
        sx.drawImage(buf, 0, 0, small.width, small.height); ctx.imageSmoothingEnabled = false; ctx.drawImage(small, 0, 0, W, H); ctx.imageSmoothingEnabled = true;
      } else ctx.drawImage(buf, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      if (style === 'tint') { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = tintC; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
      if (style === 'rainbow') { ctx.globalAlpha = 0.35; for (let i = 0; i < 6; i++) { ctx.fillStyle = COLORS[(i + (t * 2 | 0)) % 8]; ctx.fillRect(0, i * H / 6, W, H / 6 + 1); } ctx.globalAlpha = 1; }
      // Overlays around the (assumed centered) face.
      const ear = (ex, ey, rx, ry, c, ic, rot) => { ctx.save(); ctx.translate(ex, ey); ctx.rotate(rot); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill(); if (ic) { ctx.fillStyle = ic; ctx.beginPath(); ctx.ellipse(0, ry * 0.1, rx * 0.55, ry * 0.65, 0, 0, TAU); ctx.fill(); } ctx.restore(); };
      const nose = (c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, cy + F * 0.15, F * 0.12, F * 0.09, 0, 0, TAU); ctx.fill(); };
      const wig = Math.sin(t * 5) * 0.08;
      if (style === 'cat') {
        for (const s of [-1, 1]) { ctx.save(); ctx.translate(cx + s * F * 0.6, cy - F * 1.05); ctx.rotate(s * 0.3 + wig); ctx.fillStyle = '#ffa94d'; ctx.beginPath(); ctx.moveTo(-F * 0.25, F * 0.2); ctx.lineTo(0, -F * 0.35); ctx.lineTo(F * 0.25, F * 0.2); ctx.fill(); ctx.fillStyle = '#ffc2d1'; ctx.beginPath(); ctx.moveTo(-F * 0.12, F * 0.12); ctx.lineTo(0, -F * 0.18); ctx.lineTo(F * 0.12, F * 0.12); ctx.fill(); ctx.restore(); }
        nose('#ff8fab'); ctx.strokeStyle = '#333'; ctx.lineWidth = 3; for (const s of [-1, 1]) for (const d of [-0.08, 0.06]) { ctx.beginPath(); ctx.moveTo(cx + s * F * 0.2, cy + F * 0.2); ctx.lineTo(cx + s * F * 0.75, cy + F * (0.15 + d * 2)); ctx.stroke(); }
      } else if (style === 'bunny') { for (const s of [-1, 1]) ear(cx + s * F * 0.35, cy - F * 1.3, F * 0.17, F * 0.5, '#fff', '#ffc2d1', s * 0.15 + wig); nose('#ff8fab'); }
      else if (style === 'bear') { for (const s of [-1, 1]) ear(cx + s * F * 0.75, cy - F * 0.95, F * 0.25, F * 0.25, '#8d5524', '#c68642', 0); nose('#3b2a20'); }
      else if (style === 'crown') {
        const y = cy - F * 1.0 + Math.sin(t * 3) * 4; ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.moveTo(cx - F * 0.6, y + F * 0.25);
        for (let i = 0; i <= 4; i++) { ctx.lineTo(cx - F * 0.6 + i * F * 0.3, y - (i % 2 ? 0 : F * 0.35)); } ctx.lineTo(cx + F * 0.6, y + F * 0.25); ctx.fill();
        for (let i = 0; i < 3; i++) { ctx.fillStyle = COLORS[i * 2]; circle(ctx, cx - F * 0.3 + i * F * 0.3, y + F * 0.05, F * 0.06); }
      } else if (style === 'glasses') {
        ctx.fillStyle = 'rgba(20,20,40,.85)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * F * 0.32, cy - F * 0.15, F * 0.25, F * 0.18, 0, 0, TAU); ctx.fill(); }
        ctx.fillRect(cx - F * 0.1, cy - F * 0.2, F * 0.2, F * 0.05);
        ctx.fillStyle = '#5a3825'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * F * 0.17, cy + F * 0.32, F * 0.18, F * 0.07, s * 0.3, 0, TAU); ctx.fill(); }
      } else if (style === 'flowers') { for (let i = 0; i < 7; i++) { const a = Math.PI + i / 6 * Math.PI; ctx.fillStyle = COLORS[i % 8]; circle(ctx, cx + Math.cos(a) * F * 0.95, cy - F * 0.3 + Math.sin(a) * F * 0.95, F * 0.13); ctx.fillStyle = '#ffd60a'; circle(ctx, cx + Math.cos(a) * F * 0.95, cy - F * 0.3 + Math.sin(a) * F * 0.95, F * 0.05); } }
      else if (style === 'bubbles' || style === 'stars' || style === 'hearts') {
        for (let i = 0; i < 18; i++) {
          const a = i / 18 * TAU + t * 0.4, x = cx + Math.cos(a) * W * 0.45, y = H / 2 + Math.sin(a) * H * 0.45, r = S * (0.04 + 0.015 * Math.sin(t * 3 + i));
          ctx.fillStyle = style === 'bubbles' ? 'rgba(173,232,244,.7)' : COLORS[i % 8];
          if (style === 'stars') drawStarLocal(ctx, x, y, r, a); else if (style === 'hearts') heart(ctx, x, y, r); else circle(ctx, x, y, r);
        }
      } else if (style === 'tv') { ctx.strokeStyle = '#ff7a59'; ctx.lineWidth = S * 0.05; ctx.strokeRect(S * 0.04, S * 0.04, W - S * 0.08, H - S * 0.08); ctx.fillStyle = '#ffd60a'; for (let i = 0; i < 12; i++) circle(ctx, S * 0.04 + (i / 11) * (W - S * 0.08), S * 0.04, S * 0.015 * (1 + ((i + (t * 4 | 0)) % 2))); }
      parts.draw(ctx);
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.6})`; ctx.fillRect(0, 0, W, H); }
    },
  };
  return scene;
}
function drawStarLocal(ctx, x, y, r, rot) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5, k = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); } ctx.fill(); }
function heart(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y + r * 0.8); ctx.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.5, y - r * 1.1, x, y - r * 0.35); ctx.bezierCurveTo(x + r * 0.5, y - r * 1.1, x + r * 1.4, y - r * 0.2, x, y + r * 0.8); ctx.fill(); }

// 7) Shout: voice (or taps) fill a power meter: blow out candles, lift a balloon, scatter dandelion seeds, wake a sleepy animal, launch a rocket.
let micDenied = false;
const SHOUT = {
  candles: { bg: ['#ffe5ec', '#fff0f3'], obj: 'candles' },
  balloon: { bg: ['#90e0ef', '#e0fbfc'], obj: 'balloon', group: 'all' },
  dandelion: { bg: ['#d8f3dc', '#fefae0'], obj: 'dandelion' },
  sleepy: { bg: ['#1b263b', '#415a77'], obj: 'sleepy', group: 'all' },
  rocket: { bg: ['#03045e', '#5a189a'], obj: 'rocket' },
};
function shoutScene(audio, th) {
  let W = 1, H = 1, S = 1, t = 0, power = 0, level = 0, floor = 0.02, done = -1, stream = null, an = null, data = null, quietT = 0, kind = null, n = 0;
  const parts = makeParticles(), bag = th.group ? bagFor(th.group) : null, seeds = [];
  const reset = () => { power = 0; done = -1; n = 0; kind = bag?.next(); seeds.length = 0; };
  const sfx = (f) => { quietT = 0.6; f(); }; // our own sounds must not count as the child's voice
  function finish() {
    done = 0; parts.burst(W / 2, H * 0.4, 50, S * 0.03, COLORS, S * 1.2);
    if (th.obj === 'candles') sfx(() => { audio.chime(0); audio.chime(4); audio.say('Hoan hô!', 600); });
    else if (th.obj === 'sleepy') sfx(() => { audio.boing(); sayAnimal(audio, kind, 500); });
    else if (th.obj === 'rocket') sfx(() => audio.whoosh());
    else sfx(() => audio.chime(2));
  }
  return {
    resize(w, h) { W = w; H = h; S = Math.min(w, h); },
    async enter() {
      reset();
      if (micDenied || !navigator.mediaDevices?.getUserMedia) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false } });
        const ac = audio.ctx(); if (!ac) return;
        an = ac.createAnalyser(); an.fftSize = 512; data = new Float32Array(an.fftSize);
        ac.createMediaStreamSource(stream).connect(an);
      } catch { micDenied = true; }
    },
    leave() { stream?.getTracks().forEach((k) => k.stop()); stream = null; an = null; },
    tap() { if (done < 0) { power = Math.min(1, power + 0.14); sfx(() => audio.whoosh()); } },
    drag() {},
    update(dt) {
      t += dt; quietT -= dt; parts.update(dt, 250);
      if (an) {
        an.getFloatTimeDomainData(data); let s = 0; for (const v of data) s += v * v; level = Math.sqrt(s / data.length);
        if (level < floor * 2) floor += (level - floor) * dt * 0.5; // slow noise-floor tracking
        if (quietT <= 0 && done < 0 && level > Math.max(0.03, floor * 3)) power = Math.min(1, power + dt * (0.5 + level * 4));
      }
      if (done < 0) { power = Math.max(0, power - dt * 0.05); if (power >= 1) finish(); }
      else if ((done += dt) > 3.5) reset();
      if (th.obj === 'dandelion' && done < 0 && power > n * 0.1 + 0.1) { n++; for (let i = 0; i < 3; i++) seeds.push({ x: W / 2, y: H * 0.38, vx: rnd(60, 220) * (Math.random() < 0.2 ? -1 : 1), vy: rnd(-90, -20), t: 0 }); }
      for (const s of seeds) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt + Math.sin(s.t * 3) * 0.5; }
    },
    draw(ctx) {
      sky(ctx, W, H, ...th.bg);
      const cx = W / 2, p = done >= 0 ? 1 : power;
      if (th.obj === 'candles') {
        ctx.fillStyle = '#ffafcc'; ctx.fillRect(cx - S * 0.3, H * 0.55, S * 0.6, S * 0.22); ctx.fillStyle = '#fff'; ctx.fillRect(cx - S * 0.3, H * 0.55, S * 0.6, S * 0.05);
        for (let i = 0; i < 5; i++) {
          const x = cx - S * 0.22 + i * S * 0.11, out = p > (i + 1) / 5.5;
          ctx.fillStyle = COLORS[i]; ctx.fillRect(x - S * 0.015, H * 0.55 - S * 0.12, S * 0.03, S * 0.12);
          if (!out) { const fl = 1 + Math.sin(t * 20 + i) * 0.15 + p * Math.sin(t * 40) * 0.4; ctx.fillStyle = '#ffb703'; ctx.beginPath(); ctx.ellipse(x + p * S * 0.02, H * 0.55 - S * 0.15, S * 0.018, S * 0.035 * fl, p * 0.6, 0, TAU); ctx.fill(); }
          else { ctx.fillStyle = 'rgba(150,150,150,.5)'; circle(ctx, x + Math.sin(t * 2 + i) * 6, H * 0.55 - S * 0.2 - (t * 20 % 30), S * 0.015); }
        }
        face(ctx, cx, H * 0.67, S * 0.1);
      } else if (th.obj === 'balloon') {
        const y = H * 0.55 - p * H * 0.35 + Math.sin(t * 2) * 6;
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * S * 0.06, y + S * 0.18); ctx.lineTo(cx + s * S * 0.04, y + S * 0.3); ctx.stroke(); }
        ctx.fillStyle = '#ff5d73'; ctx.beginPath(); ctx.ellipse(cx, y, S * 0.15, S * 0.19, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffd166'; ctx.fillRect(cx - S * 0.025 * 2, y + S * 0.3, S * 0.1, S * 0.07);
        drawAnimal(ctx, kind, cx, y + S * 0.26, S * 0.05, t);
      } else if (th.obj === 'dandelion') {
        ctx.strokeStyle = '#40916c'; ctx.lineWidth = S * 0.012; ctx.beginPath(); ctx.moveTo(cx, H * 0.38); ctx.lineTo(cx, H); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; const m = Math.max(0, 30 - n * 3);
        for (let i = 0; i < m; i++) { const a = i / m * TAU; ctx.beginPath(); ctx.moveTo(cx, H * 0.38); ctx.lineTo(cx + Math.cos(a) * S * 0.12, H * 0.38 + Math.sin(a) * S * 0.12); ctx.stroke(); }
        ctx.fillStyle = '#fff'; for (const s of seeds) circle(ctx, s.x, s.y, 4);
        ctx.fillStyle = '#ffd60a'; circle(ctx, cx, H * 0.38, S * 0.03);
      } else if (th.obj === 'sleepy') {
        const awake = done >= 0, y = H * 0.6 - (awake ? Math.abs(Math.sin(done * 6)) * S * 0.1 : 0);
        drawAnimal(ctx, kind, cx, y, S * 0.2, awake ? t : 0.05);
        if (!awake) {
          ctx.fillStyle = 'rgba(30,30,50,.85)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * S * 0.066, y - S * 0.024, S * 0.04, S * 0.03, 0, 0, TAU); ctx.fill(); }
          ctx.fillStyle = '#fff'; ctx.font = `bold ${S * 0.06}px sans-serif`; for (let i = 0; i < 3; i++) { ctx.globalAlpha = (t * 0.7 + i / 3) % 1 < 0.9 ? 1 - ((t * 0.7 + i / 3) % 1) : 0; ctx.fillText('z', cx + S * 0.2 + i * S * 0.05, y - S * 0.2 - ((t * 0.7 + i / 3) % 1) * S * 0.15); }
          ctx.globalAlpha = 1;
          ctx.save(); ctx.translate(cx + rnd(-1, 1) * p * 6, 0); ctx.restore();
        }
        ctx.fillStyle = '#ffe066'; circle(ctx, W * 0.85, H * 0.15, S * 0.06);
      } else {
        const lift = done >= 0 ? done * done * H * 0.4 : 0, shake = p * Math.sin(t * 50) * S * 0.008, y = H * 0.55 - lift;
        ctx.fillStyle = '#fff'; for (let i = 0; i < 30; i++) ctx.fillRect((i * 137) % W, (i * 89 + lift * 0.3) % H, 2, 2);
        ctx.save(); ctx.translate(cx + shake, y);
        if (p > 0.2 || done >= 0) { ctx.fillStyle = pick(['#ffb703', '#fb8500', '#ffd60a']); ctx.beginPath(); ctx.moveTo(-S * 0.05, S * 0.15); ctx.lineTo(0, S * 0.15 + S * 0.15 * (0.4 + p) * rnd(0.8, 1.2)); ctx.lineTo(S * 0.05, S * 0.15); ctx.fill(); }
        ctx.fillStyle = '#e63946'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * S * 0.06, S * 0.05); ctx.lineTo(s * S * 0.12, S * 0.16); ctx.lineTo(s * S * 0.05, S * 0.15); ctx.fill(); }
        ctx.fillStyle = '#f1faee'; ctx.beginPath(); ctx.ellipse(0, 0, S * 0.07, S * 0.17, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(-S * 0.06, -S * 0.09); ctx.quadraticCurveTo(0, -S * 0.25, S * 0.06, -S * 0.09); ctx.fill();
        ctx.fillStyle = '#4cc9f0'; circle(ctx, 0, -S * 0.02, S * 0.035); ctx.restore();
      }
      // Power meter: a friendly row of dots at the bottom + a pulse when the voice is heard.
      for (let i = 0; i < 10; i++) { ctx.fillStyle = i < p * 10 ? COLORS[i % 8] : 'rgba(0,0,0,.15)'; circle(ctx, W / 2 + (i - 4.5) * S * 0.06, H * 0.93, S * 0.02); }
      if (an && level > floor * 3 && quietT <= 0) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W / 2, H * 0.93, S * (0.05 + level), 0, TAU); ctx.stroke(); }
      parts.draw(ctx);
    },
  };
}

export function deviceGames(audio) {
  return [...variants(audio, 'mirror', mirrorScene, MIRROR), ...variants(audio, 'shout', shoutScene, SHOUT)];
}
