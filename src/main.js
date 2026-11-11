// Chạm Là Vui: tap game for ~1-year-olds. Scenes rotate automatically; session ends with a sleep screen.
// URL params: ?min=10 (session minutes), ?scene=60 (seconds per game), ?game=fish (start with that game),
//   ?dev (fps readout; key "u" toggles a fake 5-finger hold for headless tests)
import { createAudio } from './audio.js';
import { createLock } from './lock.js';
import { makeScenes } from './scenes.js';
import { shuffle } from './fx.js';

const q = new URLSearchParams(location.search);
const SESSION_SEC = (+q.get('min') || 10) * 60, SCENE_SEC = +q.get('scene') || 60, DEV = q.has('dev');
const REVEAL_SEC = 10; // padlock stays visible this long after the parent gesture
const $ = (id) => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
const audio = createAudio();
const scenes = makeScenes(audio);
// Games come in a shuffled order; every game is played once before any repeats (10 min = 10 games of 60 s).
let order = shuffle([...scenes.play]);
if (q.get('game')) { const g = order.find((s) => s.name === q.get('game')); if (g) order = [g, ...order.filter((s) => s !== g)]; }
let W = 1, H = 1, cur = order[0], idx = 0, sceneT = 0, sessionT = 0, fade = 0;
let mode = 'open'; // open (padlock shown, unlocked) | locked (padlock hidden) | reveal (locked, padlock shown) | lost (fullscreen dropped)
let revealT = 0, devHeld = false, pinCheck = 0;

const show = (id, on) => $(id).classList.toggle('show', on);
const lock = createLock({ dev: DEV, onLost() { if (lock.locked) { mode = 'lost'; show('resume', true); } } });
if (!lock.native && !lock.canFullscreen) $('warn').textContent = 'Máy này không hỗ trợ toàn màn hình. Trên iPhone hãy bật thêm "Truy cập được hướng dẫn" (Guided Access).';

function setMode(m) {
  mode = m;
  const btn = $('lockBtn');
  btn.classList.toggle('hidden', m === 'locked' || m === 'lost');
  btn.classList.toggle('open', m === 'open');
  btn.classList.toggle('reveal', m === 'reveal');
  $('lockTip').textContent = m === 'reveal' ? 'Chạm để mở khóa' : 'Chạm để khóa';
  if (m === 'reveal') revealT = REVEAL_SEC;
}
setMode('open');
if (lock.native) $('pwa').style.display = 'none';

// 'click', not 'pointerdown': a touch pointerdown is not a user activation, so requestFullscreen would be refused.
$('lockBtn').addEventListener('click', async (e) => {
  e.stopPropagation(); e.preventDefault();
  audio.init();
  if (mode === 'open') { await lock.lock(); setMode('locked'); audio.note(0); audio.note(4, 0.12); }
  else if (mode === 'reveal') { lock.unlock(); setMode('open'); audio.note(4); audio.note(0, 0.12); }
});
$('resume').addEventListener('click', async () => { await lock.relock(); show('resume', false); if (mode === 'lost') setMode('locked'); });
$('ok').addEventListener('click', () => { audio.init(); show('help', false); try { localStorage.setItem('baby.help', '1'); } catch { /* private mode */ } });
try { if (localStorage.getItem('baby.help')) show('help', false); } catch { /* keep help */ }
if (DEV) addEventListener('keydown', (e) => { if (e.key === 'u') devHeld = !devHeld; });

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const s of [...scenes.play, scenes.sleep]) s.resize(W, H);
}
addEventListener('resize', resize); resize();

function setScene(s) { cur = s; cur.enter(); sceneT = 0; fade = 1; audio.whoosh(); }
setScene(order[0]);
function nextGame() {
  if (++idx >= order.length) { const prev = cur; order = shuffle([...scenes.play]); if (order[0] === prev) order.push(order.shift()); idx = 0; }
  setScene(order[idx]);
}

const playing = () => mode !== 'lost';
const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!playing()) return; audio.init(); cur.tap(...pos(e)); });
// iOS counts touchend/click as a user gesture for audio, not pointerdown -> also unlock audio there.
for (const ev of ['touchend', 'click']) addEventListener(ev, () => audio.init(), { capture: true, passive: true });
cv.addEventListener('pointermove', (e) => { if (playing() && e.buttons) cur.drag(...pos(e)); });

const ARC = 276.5;
let last = performance.now(), fpsAcc = 0, fpsN = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (playing()) {
    sessionT += dt; sceneT += dt;
    if (cur !== scenes.sleep) {
      if (sessionT >= SESSION_SEC) setScene(scenes.sleep);
      else if (sceneT >= SCENE_SEC) nextGame();
    }
  }
  // Parent gesture: 5 fingers held for 5 s -> padlock reappears.
  if (mode === 'locked' && lock.holdStep(dt, devHeld)) { devHeld = false; setMode('reveal'); audio.note(2); }
  const p = mode === 'locked' ? lock.holdProgress : 0;
  show('ring', p > 0.1);
  if (p > 0.1) $('ringArc').setAttribute('stroke-dashoffset', String(ARC * (1 - p)));
  if (mode === 'reveal' && (revealT -= dt) <= 0) setMode('locked');
  // Android shell: pinning refused or ended by the system unpin gesture -> back to the open padlock.
  if (lock.native && lock.locked && (pinCheck += dt) > 2) { pinCheck = 1; if (!lock.pinned() && !lock.guarded()) { lock.unlock(); setMode('open'); } }
  if (!lock.locked) pinCheck = 0;

  cur.update(dt);
  cur.draw(ctx);
  if (fade > 0) { ctx.fillStyle = `rgba(255,255,255,${fade})`; ctx.fillRect(0, 0, W, H); fade = Math.max(0, fade - dt * 2); }
  if (DEV) { fpsAcc += dt; fpsN++; if (fpsAcc > 1) { $('fps').textContent = `${fpsN} fps · ${cur.name} · ${mode} · ${Math.round(sessionT)}s`; fpsAcc = 0; fpsN = 0; } }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
