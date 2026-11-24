// Chạm Là Vui: tap game for ~1-year-olds. Scenes rotate automatically; session ends with a sleep screen.
// URL params: ?min=10 (session minutes), ?scene=60 (seconds per game), ?game=fish (start with that game),
//   ?dev (fps readout; key "u" toggles a fake 5-finger hold for headless tests)
import { createAudio } from './audio.js';
import { createLock } from './lock.js';
import { makeScenes } from './scenes.js';
import { createAttention, ACTIVE_SEC } from './attention.js';

const q = new URLSearchParams(location.search);
const SESSION_SEC = (+q.get('min') || 10) * 60, SCENE_SEC = +q.get('scene') || 60, DEV = q.has('dev');
const REVEAL_SEC = 10; // padlock stays visible this long after the parent gesture
const $ = (id) => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
const audio = createAudio();
const scenes = makeScenes(audio);
const att = createAttention(audio);
// Game rotation is remembered ACROSS visits (localStorage): a game comes back only after every game has been played once.
const SEEN_KEY = 'baby.seen';
let seen = new Set(); try { seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { /* private mode */ }
// scenes.play = [{name, make}] (100 entries); a scene object is built the first time it is played.
const NAMES = new Set(scenes.play.map((e) => e.name));
seen = new Set([...seen].filter((n) => NAMES.has(n))); // drop names of games that no longer exist
const built = new Map();
function build(e) { let s = built.get(e.name); if (!s) { s = e.make(); s.name = e.name; built.set(e.name, s); } return s; }
function markSeen(s) {
  if (!NAMES.has(s.name)) return;
  seen.add(s.name); if (seen.size >= NAMES.size) seen = new Set([s.name]); // full round done -> all eligible again (except this one)
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch { /* */ }
}
function pickNext(prev) {
  let pool = scenes.play.filter((e) => !seen.has(e.name) && e.name !== prev?.name);
  if (!pool.length) pool = scenes.play.filter((e) => e.name !== prev?.name);
  return build(pool[Math.random() * pool.length | 0]);
}
const want = q.get('game'), wantE = want && (scenes.play.find((e) => e.name === want) || scenes.play.find((e) => e.name.startsWith(want + '.')));
const first = wantE ? build(wantE) : pickNext(null);
let W = 1, H = 1, cur = first, sceneT = 0, sessionT = 0, fade = 0;
// iPhone keeps the status bar strip outside the page and paints it with theme-color: match it to the top of the current game.
// Once per game and iPhone only (repeated getImageData can push Chrome canvases off the GPU).
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let tintDue = false;
function tintStatusBar() {
  const [r, g, b] = ctx.getImageData(Math.round(cv.width / 2), 0, 1, 1).data, c = `rgb(${r},${g},${b})`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c);
  document.documentElement.style.background = document.body.style.background = c;
}
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
  $('songBtn').classList.toggle('hidden', m !== 'open');
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
// Parent's own song for the coconut games + call-back: picked from this phone, kept in IndexedDB on this phone only.
function songDb(fn) {
  try {
    const rq = indexedDB.open('baby', 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
    rq.onsuccess = () => { try { fn(rq.result.transaction('kv', 'readwrite').objectStore('kv')); } catch { /* */ } };
  } catch { /* private mode */ }
}
songDb((st) => { const g = st.get('song'); g.onsuccess = () => { if (g.result) { audio.songLoad(g.result); $('songTip').textContent = 'Đã có bài hát'; } }; });
$('songBtn').addEventListener('click', (e) => { e.stopPropagation(); audio.init(); $('songFile').click(); });
$('songFile').addEventListener('change', async () => {
  const f = $('songFile').files?.[0]; if (!f) return;
  const bytes = await f.arrayBuffer();
  audio.songLoad(bytes.slice(0)); songDb((st) => st.put(bytes, 'song'));
  $('songTip').textContent = 'Đã có bài hát'; audio.song(3);
});
if (DEV) addEventListener('keydown', (e) => { if (e.key === 'u') devHeld = !devHeld; });

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight; // not innerHeight: on the iPhone home-screen app the canvas starts below the status bar
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  att.resize(W, H); cur.resize(W, H); if (cur !== scenes.sleep) scenes.sleep.resize(W, H);
}
addEventListener('resize', resize); resize();

function setScene(s) { if (cur !== s) cur.leave?.(); markSeen(s); cur = s; cur.resize(W, H); cur.enter(); att.reset(); sceneT = 0; fade = 1; tintDue = IOS; audio.whoosh(); }
setScene(first);
function nextGame() { setScene(pickNext(cur)); }

const playing = () => mode !== 'lost';
const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
// Tap guard (user bug 2026-11-24: the baby slaps/swipes with the whole hand). A second finger while one is down, or a
// tap within TAP_GAP_MS of the last one, only gets the colored ring: the game itself reacts to one clean tap at a time.
const TAP_GAP_MS = 180, down = new Set();
let lastTap = 0;
cv.addEventListener('pointerdown', (e) => {
  e.preventDefault(); if (!playing()) return; audio.init();
  const clean = down.size === 0 && e.timeStamp - lastTap >= TAP_GAP_MS;
  down.add(e.pointerId); lastTap = e.timeStamp;
  if (clean) cur.tap(...pos(e));
  if (cur !== scenes.sleep) att.tap(...pos(e));
});
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) cv.addEventListener(ev, (e) => down.delete(e.pointerId));
// iOS counts touchend/click as a user gesture for audio, not pointerdown -> also unlock audio there.
for (const ev of ['touchend', 'click']) addEventListener(ev, () => { audio.init(); audio.unlockSpeech(); }, { capture: true, passive: true });
cv.addEventListener('pointermove', (e) => { if (playing() && e.buttons && down.size <= 1) cur.drag(...pos(e)); });

const ARC = 276.5;
let last = performance.now(), fpsAcc = 0, fpsN = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (playing()) {
    sessionT += dt; sceneT += dt;
    if (cur !== scenes.sleep) {
      if (sessionT >= SESSION_SEC) setScene(scenes.sleep);
      // Normal game time is SCENE_SEC, but a game the child is busy tapping may run up to twice as long.
      else if (att.update(dt)) nextGame(); // nobody tapped after the call-back animal -> try another game
      else if (sceneT >= SCENE_SEC && (att.idle >= ACTIVE_SEC || sceneT >= SCENE_SEC * 2)) nextGame();
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

  if (cur.skip) { cur.skip = false; cur.leave?.(); nextGame(); } // e.g. camera refused -> another game
  // One bad frame in a game must never freeze the whole app (an uncaught throw here stopped requestAnimationFrame).
  try { cur.update(dt); cur.draw(ctx); } catch (err) { if (DEV) console.error(err); ctx.setTransform(Math.min(2, devicePixelRatio || 1), 0, 0, Math.min(2, devicePixelRatio || 1), 0, 0); }
  if (cur !== scenes.sleep) att.draw(ctx);
  if (fade > 0) { ctx.fillStyle = `rgba(255,255,255,${fade})`; ctx.fillRect(0, 0, W, H); fade = Math.max(0, fade - dt * 2); }
  if (DEV) { fpsAcc += dt; fpsN++; if (fpsAcc > 1) { $('fps').textContent = `${fpsN} fps · ${cur.name} · ${mode} · ${Math.round(sessionT)}s`; fpsAcc = 0; fpsN = 0; } }
  if (tintDue && sceneT > 1.5) { tintDue = false; tintStatusBar(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
