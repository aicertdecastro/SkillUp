// PRESENTATION LAYER · short sound effects made with Web Audio (no audio files).
// The ON/OFF choice is a per-device comfort setting, so it lives in localStorage.
const KEY = 'skillup.sound';
let ctx;

export function isSoundOn() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setSoundOn(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode: just don't remember */ }
}

function play(notes) {
  if (!isSoundOn()) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    let t = ctx.currentTime;
    for (const [freq, len] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + len);
      t += len * 0.8;
    }
  } catch { /* no audio support: stay silent */ }
}

export const playCorrect = () => play([[660, 0.12], [880, 0.2]]);
export const playWrong = () => play([[300, 0.18], [220, 0.25]]);
export const playCelebrate = () => play([[523, 0.14], [659, 0.14], [784, 0.14], [1047, 0.4]]);
