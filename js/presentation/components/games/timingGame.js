// PRESENTATION LAYER · Timing bar: press SHOOT! (or Space) while the marker is in the green zone.
// The browser times the presses; the server checks the totals (5 tries, hits 0-5) and pays.
import * as ch from '../../../business/challengeService.js';
import * as auth from '../../../business/authService.js';
import { shooter, handPos, ballAt } from '../courtArt.js';
import { esc, toast } from '../ui.js';
import { howToBox, statusBar, showStatus, hideStatus } from './common.js';
import { playCorrect, playWrong, playCelebrate } from '../sound.js';

const PAUSE_MS = 1400;                    // between tries: ball flight + time to read the tip
const FLIGHT_MS = 950;                    // ball flight after each shot
const FOLLOW = 0.15;                      // share of the flight the arm keeps rising (follow-through)

export function mount(root, C) {
  const L = C.level;
  const c = L.content;
  const s = L.settings;
  const zone = ch.timingZone(s);
  const sweepMs = Number(s.sweep_s) * 1000;
  const tips = c.tips ?? {};

  let attemptId = L.attempt?.id ?? null;
  let tries = 0;
  let hits = 0;
  let marks = [];                          // 'hit' | 'early' | 'late' per try
  let running = false;
  let startedAt = 0;
  let frame = 0;
  let pauseTimer = 0;
  let finished = false;
  let busy = false;

  root.innerHTML = `
    <div class="ch-grid">
      <section class="ch-main">
        <h1>${esc(L.heading)}</h1>
        <p class="ch-sub">${esc(L.sub)}</p>
        <div class="timing-stage">
          <div class="shooter" id="shooter">${shooter(0)}</div>
          <span class="hit-flash" id="flash" hidden>HIT!</span>
        </div>
        <div class="tbar" aria-hidden="true">
          <i class="tbar-zone" style="left:${zone.start * 100}%;width:${(zone.end - zone.start) * 100}%"></i>
          <i class="tbar-marker" id="marker"></i>
        </div>
        <div class="timing-controls">
          <button type="button" class="btn btn--orange shoot" id="shoot">START</button>
          <span class="ch-pill">Hits <b id="hits">0/${esc(s.hits_to_pass)}</b></span>
          <span class="tries" id="marks" aria-label="Tries"></span>
          <button type="button" class="btn" id="again" hidden>Try again</button>
        </div>
        <p class="tip" id="tip" aria-live="polite"></p>
        ${statusBar()}
      </section>
      <aside class="ch-side">
        ${howToBox(C.howTo)}
        <section class="ch-box">
          <h2>This level</h2>
          ${C.timingFacts.map(([k, v]) => `<div class="row"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}
        </section>
        <section class="ch-box">
          <h2>Coach’s tips</h2>
          <ul class="reminders">${['early', 'late', 'hit'].filter((k) => tips[k]).map((k) => `<li>${esc(tips[k])}</li>`).join('')}</ul>
        </section>
      </aside>
    </div>`;

  const $ = (q) => root.querySelector(q);
  const status = $('#status');
  const shootBtn = $('#shoot');

  function drawMarks() {
    $('#hits').textContent = `${hits}/${s.hits_to_pass}`;
    $('#marks').innerHTML = Array.from({ length: s.tries }, (_, i) =>
      `<i class="${marks[i] ?? ''}" title="${marks[i] ?? 'not played'}"></i>`).join('');
  }

  function place(p) {
    $('#marker').style.left = `${Math.min(p, 1) * 100}%`;
    $('#shooter').innerHTML = shooter(Math.min(p, 1));
  }

  // Ball leaves the hand at the release lift and flies the path for this grade.
  function playShot(grade, p) {
    const r = Math.min(p ?? 1, 1);
    const from = handPos(r);
    const draw = (t) => {
      const arm = r + (1 - r) * Math.min(t / FOLLOW, 1);
      $('#shooter').innerHTML = shooter(arm, ballAt(grade, from, t));
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return draw(1);
    const t0 = performance.now();
    const step = () => {
      const t = Math.min((performance.now() - t0) / FLIGHT_MS, 1);
      draw(t);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }

  function tick() {
    if (!running) return;
    const p = (performance.now() - startedAt) / sweepMs;
    place(p);
    if (p >= 1) return endTry(null);              // never pressed: too late
    frame = requestAnimationFrame(tick);
  }

  async function ensureAttempt() {
    if (!attemptId) attemptId = (await ch.startTry(L.id)).attempt_id;
  }

  async function startTry() {
    if (running || finished || busy) return;
    try { await ensureAttempt(); } catch (err) { toast(auth.friendlyError(err)); return; }
    cancelAnimationFrame(frame);
    $('#tip').textContent = '';
    $('#flash').hidden = true;
    place(0);
    running = true;
    startedAt = performance.now();
    shootBtn.textContent = c.button ?? 'SHOOT!';
    frame = requestAnimationFrame(tick);
  }

  function endTry(p) {
    running = false;
    cancelAnimationFrame(frame);
    const grade = ch.gradeShot(p, zone);
    tries += 1;
    marks.push(grade);
    if (grade === 'hit') { hits += 1; playCorrect(); $('#flash').hidden = false; } else playWrong();
    $('#tip').textContent = tips[grade] ?? '';
    $('#tip').className = `tip tip--${grade}`;
    drawMarks();
    playShot(grade, p);
    if (tries >= s.tries) return finish();
    shootBtn.disabled = true;
    pauseTimer = setTimeout(() => { shootBtn.disabled = false; startTry(); }, PAUSE_MS);
  }

  function shoot() {
    if (finished || busy) return;
    if (!running) return startTry();
    endTry((performance.now() - startedAt) / sweepMs);
  }

  async function finish() {
    finished = true;
    busy = true;
    shootBtn.disabled = true;
    try {
      const r = await ch.finishTiming(attemptId, hits, tries);
      if (r.passed) {
        playCelebrate();
        showStatus(status, { tone: 'pass', title: ch.passText(L.no, r.points_awarded), text: tips.hit ?? '', resultHref: r.resultHref });
      } else {
        showStatus(status, { tone: 'fail', title: `${hits} of ${tries} hits.`, text: `You need ${s.hits_to_pass} to pass.`, resultHref: r.resultHref, retry: true });
      }
      $('#again').hidden = false;
    } catch (err) {
      toast(auth.friendlyError(err));
    } finally {
      busy = false;
    }
  }

  async function again() {
    if (busy) return;
    busy = true;
    try {
      attemptId = (await ch.startTry(L.id, true)).attempt_id;
      cancelAnimationFrame(frame);
      tries = 0; hits = 0; marks = []; finished = false;
      hideStatus(status);
      $('#again').hidden = true;
      $('#tip').textContent = '';
      $('#flash').hidden = true;
      shootBtn.disabled = false;
      shootBtn.textContent = 'START';
      place(0);
      drawMarks();
    } catch (err) {
      toast(auth.friendlyError(err));
    } finally {
      busy = false;
    }
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('#shoot')) return shoot();
    if (e.target.closest('#again, [data-retry]')) return again();
  });
  const onKey = (e) => {
    if (e.code !== 'Space' || e.target.closest?.('input, textarea')) return;
    e.preventDefault();
    if (!shootBtn.disabled) shoot();
  };
  document.addEventListener('keydown', onKey);

  drawMarks();
  place(0);
  return {
    destroy() {
      running = false;
      cancelAnimationFrame(frame);
      clearTimeout(pauseTimer);
      document.removeEventListener('keydown', onKey);
    },
  };
}
