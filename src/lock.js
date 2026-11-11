// Child lock. Tap the padlock -> locked (fullscreen, back trap, wake lock) and the padlock hides.
// Parent unlock: hold 5 fingers on the screen for 5 s -> the padlock reappears -> tap it to unlock.
// Browser limits (docs/ai/GOTCHAS.md): a page cannot block Home/app switch. The optional Android wrapper
// (window.BabyNative.lock/unlock) pins the screen for a real lock.
export const HOLD_FINGERS = 5, HOLD_SEC = 5;

export function createLock({ onLost, dev = false }) {
  const native = window.BabyNative || null;
  const touches = new Set();
  const canFs = !!document.documentElement.requestFullscreen;
  let locked = false, wake = null, hold = 0;

  addEventListener('pointerdown', (e) => touches.add(e.pointerId), true);
  for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, (e) => touches.delete(e.pointerId), true);
  addEventListener('blur', () => touches.clear());
  addEventListener('keydown', (e) => { if (locked) e.preventDefault(); });
  addEventListener('contextmenu', (e) => e.preventDefault());
  // Back trap. On touch devices it is ALWAYS on: iPhone users lock with Guided Access (no padlock), and Safari's
  // left-edge swipe = browser back, which Guided Access allows. Browsers skip entries pushed without a gesture -> push on touch.
  const trapAlways = matchMedia('(pointer: coarse)').matches;
  // Safari shows a SNAPSHOT of the previous entry during the swipe (user saw the old help screen for 1-3 s).
  // So while playing, push a fresh entry every few seconds: the previous entry then looks like the game itself.
  let lastPush = 0;
  const trap = (fresh) => {
    const now = Date.now();
    if (!history.state?.baby || (fresh && now - lastPush > 3000)) { history.pushState({ baby: now }, ''); lastPush = now; }
  };
  addEventListener('popstate', () => { if (locked || trapAlways) trap(false); }); // back button / edge swipe stays here
  if (trapAlways) addEventListener('touchend', () => trap(true), { capture: true, passive: true });
  addEventListener('beforeunload', (e) => { if (locked && !native) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('gesturestart', (e) => e.preventDefault()); // iOS pinch zoom
  document.addEventListener('fullscreenchange', () => { if (locked && !native && !document.fullscreenElement) onLost(); });
  document.addEventListener('visibilitychange', () => {
    if (!locked || document.visibilityState !== 'visible') return;
    touches.clear(); grabWake();
    if (!native && canFs && !document.fullscreenElement) onLost();
  });

  async function grabWake() { try { wake = await navigator.wakeLock?.request('screen'); } catch { /* not allowed */ } }
  async function enterFullscreen() {
    if (native || document.fullscreenElement) return;
    try { await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }); } catch { /* iOS Safari */ }
  }

  return {
    native: !!native,
    canFullscreen: canFs,
    get locked() { return locked; },
    // Native shell only: is the screen still pinned? (a parent can unpin with the system gesture)
    pinned() { return native?.isPinned ? native.isPinned() : true; },
    // Native shell guard: while locked it brings itself back after an unpin, so an unpin does NOT mean "parent unlocked".
    guarded() { return native?.isGuarded ? native.isGuarded() : false; },
    // Progress 0..1 of the parent gesture; returns true once when it completes. ?dev: Shift key counts as 5 fingers.
    holdStep(dt, devHeld = false) {
      const n = touches.size;
      if (locked && (n >= HOLD_FINGERS || (dev && devHeld))) hold += dt; else hold = 0;
      if (hold >= HOLD_SEC) { hold = 0; touches.clear(); return true; }
      return false;
    },
    get holdProgress() { return hold / HOLD_SEC; },
    async lock() { // call from a user gesture
      locked = true;
      native?.lock?.();
      await enterFullscreen();
      history.pushState({ baby: 1 }, '');
      grabWake();
    },
    relock: enterFullscreen, // call from a user gesture
    unlock() {
      locked = false; hold = 0;
      native?.unlock?.();
      try { wake?.release(); } catch { /* ignore */ }
      wake = null;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    },
  };
}
