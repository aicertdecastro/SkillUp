// PRESENTATION LAYER · Choose your play: press START, then pick the best play before time runs out.
// The server starts its clock on START and checks both the answer and the time.
import * as ch from '../../../business/challengeService.js';
import * as auth from '../../../business/authService.js';
import { sideCourt } from '../courtArt.js';
import { esc, toast } from '../ui.js';
import { howToBox, statusBar, showStatus, hideStatus, keyBox, pos } from './common.js';
import { playCorrect, playWrong, playCelebrate } from '../sound.js';

export function mount(root, C) {
  const L = C.level;
  const c = L.content;
  const seconds = Number(L.settings.seconds);

  let attemptId = null;
  let left = seconds;
  let timer = 0;
  let state = 'idle';                     // idle → running → done
  let busy = false;

  root.innerHTML = `
    <div class="ch-grid">
      <section class="ch-main">
        <div class="play-head">
          <h1>${esc(L.heading)}</h1>
          <span class="clock" id="clock" aria-live="off">${seconds} s</span>
        </div>
        <p class="ch-sub">${esc(c.scenario)}</p>
        <div class="court court--side">
          ${sideCourt()}
          <div>${c.pieces.map((p) => `
            <span class="piece piece--${esc(p.kind)}" style="${pos(p.x, p.y)}">${esc(p.label)}${p.kind === 'you' ? '<i class="ball" aria-hidden="true"></i>' : ''}
              ${p.open ? '<em class="open-tag">OPEN</em>' : ''}</span>`).join('')}
          </div>
        </div>
        <div class="options" id="options">
          ${c.options.map((o, i) => `<button type="button" class="option" data-choice="${i}" disabled>${esc(o)}</button>`).join('')}
        </div>
        ${statusBar()}
      </section>
      <aside class="ch-side">
        ${howToBox(C.howTo)}
        <button type="button" class="start-btn" id="start">START!</button>
        <section class="ch-box">
          <h2>Smart play tips</h2>
          <ul class="reminders">${(c.tips ?? []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </section>
        ${keyBox([['you', 'You (with the ball)'], ['mate', 'Teammate'], ['opp', 'Opponent']])}
      </aside>
    </div>`;

  const $ = (q) => root.querySelector(q);
  const status = $('#status');
  const options = () => root.querySelectorAll('[data-choice]');

  function setOptions(on) { options().forEach((b) => { b.disabled = !on; }); }
  function showClock() { $('#clock').textContent = `${Math.max(left, 0)} s`; $('#clock').classList.toggle('is-low', left <= 2); }

  async function start() {
    if (busy || state === 'running') return;
    busy = true;
    try {
      attemptId = (await ch.startTry(L.id, true)).attempt_id;   // the server's clock starts now
      state = 'running';
      left = seconds;
      hideStatus(status);
      options().forEach((b) => b.classList.remove('is-right', 'is-wrong'));
      setOptions(true);
      $('#start').disabled = true;
      showClock();
      timer = setInterval(() => {
        left -= 1;
        showClock();
        if (left <= 0) choose(null);
      }, 1000);
    } catch (err) {
      toast(auth.friendlyError(err));
    } finally {
      busy = false;
    }
  }

  async function choose(choice) {
    if (state !== 'running' || busy) return;
    busy = true;
    clearInterval(timer);
    setOptions(false);
    try {
      const r = await ch.pick(attemptId, { choice });
      state = 'done';
      const btn = choice == null ? null : root.querySelector(`[data-choice="${choice}"]`);
      btn?.classList.add(r.correct ? 'is-right' : 'is-wrong');
      if (r.correct) {
        playCorrect(); playCelebrate();
        showStatus(status, { tone: 'pass', title: `Great choice!${r.points_awarded ? ` +${r.points_awarded} pts` : ''}`, text: r.why ?? '', resultHref: r.resultHref, retry: true });
      } else if (r.late) {
        playWrong();
        showStatus(status, { tone: 'fail', title: 'Time’s up!', text: 'Read the play and pick faster next time.', resultHref: r.resultHref, retry: true });
      } else {
        playWrong();
        showStatus(status, { tone: 'fail', title: 'Not the best play.', text: r.why ?? '', resultHref: r.resultHref, retry: true });
      }
    } catch (err) {
      toast(auth.friendlyError(err));
      state = 'done';
    } finally {
      $('#start').disabled = false;
      busy = false;
    }
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('#start, [data-retry]')) return start();
    const o = e.target.closest('[data-choice]');
    if (o) choose(Number(o.dataset.choice));
  });

  return { destroy() { clearInterval(timer); } };
}
