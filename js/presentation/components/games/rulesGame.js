// PRESENTATION LAYER · Rules game: click the player who broke the rule in a paused picture.
import * as ch from '../../../business/challengeService.js';
import * as auth from '../../../business/authService.js';
import { artFor } from '../sportArt.js';
import { esc, toast } from '../ui.js';
import { howToBox, statusBar, showStatus, keyBox, pos } from './common.js';
import { playWrong, playCelebrate } from '../sound.js';

export function mount(root, C) {
  const L = C.level;
  const c = L.content;
  let attemptId = L.attempt?.id ?? null;
  let tries = L.attempt?.state.tries ?? 0;
  let wrong = L.attempt?.state.wrong ?? [];
  let done = null;
  let busy = false;

  const picks = c.view === 'line';                // IN / OUT buttons under the picture instead of players on it
  const teams = c.players.some((p) => p.team);

  root.innerHTML = `
    <div class="ch-grid">
      <section class="ch-main">
        <h1>${esc(L.heading)}</h1>
        <p class="ch-sub">${esc(L.sub)}</p>
        <div class="court court--side">
          ${artFor(C.sportId).rules(c)}
          ${picks ? '' : '<div id="players"></div>'}
        </div>
        ${picks ? '<div class="pick-row" id="players"></div>' : ''}
        ${teams ? keyBox([['blue', 'Blue team'], ['white', 'White team'], ...(c.footprints ? [['foot', 'Footprints']] : [])]) : ''}
        ${statusBar()}
      </section>
      <aside class="ch-side">
        ${howToBox(C.howTo)}
        <section class="ch-box">
          <h2>Remember the rules</h2>
          <ul class="reminders">${C.reminders.map(([b, t]) => `<li><b>${esc(b)}</b> ${esc(t)}</li>`).join('')}</ul>
        </section>
        <div class="ch-counts"><div><small>Tries so far</small><b id="tries"></b></div></div>
      </aside>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const status = $('#status');

  function draw() {
    const state = (p) => `${wrong.includes(p.no) ? ' is-wrong' : ''}${done && done.pick === p.no ? ' is-right' : ''}`;
    const off = (p) => (done || wrong.includes(p.no) ? 'disabled' : '');
    $('#players').innerHTML = c.players.map((p) => (picks ? `
      <button type="button" class="pick${state(p)}" data-player="${esc(p.no)}" ${off(p)}>${esc(p.label ?? p.no)}</button>` : `
      <button type="button" class="player player--${p.team === 'blue' ? 'blue' : 'white'}${state(p)}"
              data-player="${esc(p.no)}" style="${pos(p.x, p.y)}" aria-label="${esc(`${p.team} number ${p.no}`)}"
              ${off(p)}>
        ${esc(p.no)}${p.ball ? '<i class="ball" aria-hidden="true"></i>' : ''}
      </button>`)).join('');
    $('#tries').textContent = tries;
  }

  async function choose(no) {
    if (busy || done) return;
    busy = true;
    try {
      if (!attemptId) attemptId = (await ch.startTry(L.id)).attempt_id;
      const r = await ch.pick(attemptId, { player: no });
      tries = r.tries;
      wrong = r.wrong ?? wrong;
      if (r.correct) {
        done = { ...r, pick: no };
        playCelebrate();
        showStatus(status, { tone: 'pass', title: `${c.success_title} ${r.points_awarded ? `+${r.points_awarded} pts` : ''}`.trim(), text: c.success, resultHref: r.resultHref });
      } else {
        playWrong();
        showStatus(status, { tone: 'miss', title: 'Hint:', text: c.hint });
      }
      draw();
    } catch (err) {
      toast(auth.friendlyError(err));
    } finally {
      busy = false;
    }
  }

  root.addEventListener('click', (e) => {
    const p = e.target.closest('[data-player]');
    if (p) choose(p.dataset.player);
  });

  draw();
  if (tries) showStatus(status, { tone: 'miss', title: 'Hint:', text: c.hint });
  return { destroy() {} };
}
