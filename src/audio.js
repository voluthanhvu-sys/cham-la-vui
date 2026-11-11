// All sounds are synthesized with WebAudio (no asset files). Names are spoken with speechSynthesis (vi-VN) if available.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5]; // C major pentatonic, 2 octaves

export function createAudio() {
  let ac = null, master = null, noiseBuf = null, viVoice = null;

  function init() {
    if (ac) { ac.resume(); return; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.6; master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    pickVoice();
    window.speechSynthesis?.addEventListener?.('voiceschanged', pickVoice);
  }
  function pickVoice() {
    const vs = window.speechSynthesis?.getVoices?.() || [];
    viVoice = vs.find((v) => v.lang?.toLowerCase().startsWith('vi')) || null;
  }

  function out(node, lp) {
    if (!lp) { node.connect(master); return; }
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
    node.connect(f); f.connect(master);
  }
  function tone(freq, dur, { type = 'sine', vol = 0.35, slide = 0, curve = null, at = 0, attack = 0.008, lp = 0 } = {}) {
    if (!ac) return;
    const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    if (curve) o.frequency.setValueCurveAtTime(new Float32Array(curve), t, dur);
    else {
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); out(g, lp);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, { vol = 0.2, at = 0, freq = 1000, q = 1 } = {}) {
    if (!ac) return;
    const t = ac.currentTime + at, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.05);
  }

  const ANIMAL = {
    cat() { tone(0, 0.55, { type: 'triangle', curve: [520, 760, 820, 600, 430], vol: 0.3 }); tone(0, 0.55, { type: 'sine', curve: [1040, 1520, 1640, 1200, 860], vol: 0.08 }); },
    dog() { for (const at of [0, 0.22]) { tone(420, 0.13, { type: 'square', slide: 0.55, vol: 0.18, at, lp: 1800 }); noise(0.08, { vol: 0.15, at, freq: 900 }); } },
    cow() { tone(0, 1.2, { type: 'sawtooth', curve: [105, 135, 140, 130, 95], vol: 0.3, attack: 0.15, lp: 700 }); },
    duck() { for (const at of [0, 0.2, 0.4]) tone(560, 0.13, { type: 'sawtooth', slide: 0.7, vol: 0.18, at, lp: 1600 }); },
    pig() { for (const at of [0, 0.25]) { tone(190, 0.18, { type: 'square', slide: 0.7, vol: 0.15, at, lp: 900 }); noise(0.18, { vol: 0.2, at, freq: 450, q: 3 }); } },
  };

  return {
    init,
    note(i, at = 0) { const f = SCALE[((i % SCALE.length) + SCALE.length) % SCALE.length]; tone(f, 0.7, { type: 'triangle', vol: 0.3, at }); tone(f * 2, 0.35, { vol: 0.06, at }); },
    pop() { tone(320 + Math.random() * 260, 0.14, { slide: 3, vol: 0.4 }); noise(0.05, { vol: 0.12, freq: 3200 }); },
    twinkle() { tone(SCALE[4 + (Math.random() * 4 | 0)] * 2, 0.25, { vol: 0.07 }); },
    rustle() { noise(0.35, { vol: 0.12, freq: 2500, q: 0.7 }); },
    whoosh() { noise(0.4, { vol: 0.1, freq: 600, q: 0.5 }); },
    animal(kind) { ANIMAL[kind]?.(); },
    lullaby() { // "Twinkle twinkle" opening (public domain), slow and soft
      const m = [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0];
      const f = [261.63, 293.66, 329.63, 349.23, 392, 440];
      m.forEach((n, i) => { if (n >= 0) tone(f[n], 0.9, { type: 'sine', vol: 0.18, at: 0.3 + i * 0.55, attack: 0.05 }); });
    },
    say(text, delay = 0) {
      const nat = window.BabyNative;
      if (nat?.say) { setTimeout(() => nat.say(text), delay); return; } // Android shell: native TTS
      const ss = window.speechSynthesis;
      if (!ss || !viVoice) return;
      setTimeout(() => {
        ss.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.voice = viVoice; u.lang = viVoice.lang; u.rate = 0.85; u.pitch = 1.3;
        ss.speak(u);
      }, delay);
    },
  };
}
