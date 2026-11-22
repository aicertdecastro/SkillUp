// PRESENTATION LAYER · Positions game: place every token on the right spot.
// Drag a token onto a spot, or tap a token and then tap a spot. The server checks each drop.
import * as ch from '../../../business/challengeService.js';
import * as auth from '../../../business/authService.js';
import { artFor } from '../sportArt.js';
import { esc, toast } from '../ui.js';
import { statusBar, showStatus, hideStatus, pos } from './common.js';
import { playCorrect, playWrong, playCelebrate } from '../sound.js';

export function mount(root, C) {
  const L = C.level;
  const c = L.content;
  let attemptId = L.attempt?.id ?? null;
  let placed = { ...(L.attempt?.state.placed ?? {}) };   // spot id → token id
  let misses = L.attempt?.state.misses ?? 0;
  let selected = null;
  let done = null;                                       // finished result
  let busy = false;

  root.innerHTML = `
    <div class="ch-grid ch-grid--left">
      <aside class="ch-side">
        <h1>${esc(L.heading)}</h1>
        <p class="ch-sub">${esc(L.sub)}</p>
        <ul class="tokens" id="tokens"></ul>
        <div class="ch-counts">
          <div><small>Placed</small><b id="placed"></b></div>
          <div><small>Misses</small><b id="misses"></b></div>
        </div>
        <div class="ch-actions">
          <button type="button" class="btn" id="reset">Reset</button>
          <a class="btn btn--yellow" id="results" aria-disabled="true" href="#">See results</a>
        </div>
      </aside>
      <section class="ch-main">
        <div class="court court--half${c.flipped ? ' is-flipped' : ''}">
          ${artFor(C.sportId).positions(c)}
          <div id="spots"></div>
        </div>
        ${statusBar()}
      </section>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const status = $('#status');
  const tokenName = Object.fromEntries(c.tokens.map((t) => [t.id, t.name]));
  const tokenLabel = Object.fromEntries(c.tokens.map((t) => [t.id, t.label ?? t.id]));   // DF1 / DF2 both show "DF"

  function draw() {
    const used = new Set(Object.values(placed));
    $('#tokens').innerHTML = c.tokens.map((t) => `
      <li><button type="button" class="token${selected === t.id ? ' is-selected' : ''}${used.has(t.id) ? ' is-used' : ''}"
            data-token="${esc(t.id)}" draggable="${!used.has(t.id) && !done}" aria-pressed="${selected === t.id}"
            ${used.has(t.id) || done ? 'disabled' : ''}>
        <span class="chip-token">${esc(tokenLabel[t.id])}</span>${esc(t.name)}</button></li>`).join('');
    $('#spots').innerHTML = c.spots.map((s) => {
      const tok = placed[s.id];
      return `
        <button type="button" class="spot${tok ? ' is-filled' : ''}" data-spot="${esc(s.id)}" style="${pos(s.x, s.y)}"
                aria-label="${esc(tok ? `${tokenName[tok]} placed` : s.label ?? 'Empty spot')}" ${tok || done ? 'disabled' : ''}>
          <span class="spot-ring">${tok ? esc(tokenLabel[tok]) : s.label ? '' : '?'}</span>
          ${s.label ? `<span class="spot-label">${esc(s.label)}</span>` : ''}
        </button>`;
    }).join('');
    $('#placed').textContent = `${Object.keys(placed).length}/${c.tokens.length}`;
    $('#misses').textContent = misses;
    const res = $('#results');
    res.setAttribute('aria-disabled', !done);
    res.setAttribute('href', done ? done.resultHref : '#');
  }

  async function ensureAttempt() {
    if (attemptId) return;
    const r = await ch.startTry(L.id);
    attemptId = r.attempt_id;
  }

  async function drop(token, spot) {
    if (busy || done || !token || !spot || placed[spot]) return;
    busy = true;
    try {
      await ensureAttempt();
      const r = await ch.pick(attemptId, { token, spot });
      placed = { ...r.placed };
      misses = r.misses;
      selected = null;
      if (r.finished) {
        done = r;
        playCelebrate();
        showStatus(status, { tone: 'pass', title: ch.passText(L.no, r.points_awarded), text: c.done ?? 'Every player is in the right place.', resultHref: r.resultHref });
      } else if (r.correct) {
        playCorrect();
        hideStatus(status);
      } else {
        playWrong();
        showStatus(status, { tone: 'miss', title: `Misses ${misses}`, text: c.miss });
      }
      draw();
    } catch (err) {
      toast(auth.friendlyError(err));
    } finally {
      busy = false;
    }
  }

  async function reset() {
    if (busy) return;
    busy = true;
    try {
      const r = await ch.startTry(L.id, true);
      attemptId = r.attempt_id;
      placed = {}; misses = 0; selected = null; done = null;
      hideStatus(status);
      draw();
    } catch (err) {
      toast(auth.friendlyError(err));
    } finally {
      busy = false;
    }
  }

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-token]');
    if (t) { selected = selected === t.dataset.token ? null : t.dataset.token; draw(); return; }
    const s = e.target.closest('[data-spot]');
    if (s) {
      if (!selected) { toast('Tap a token first.'); return; }
      drop(selected, s.dataset.spot);
      return;
    }
    if (e.target.closest('#reset')) return reset();
    const res = e.target.closest('#results');
    if (res && !done) { e.preventDefault(); toast(`Place all ${c.tokens.length} tokens first.`); }
  });

  // drag and drop (mouse); tap-tap works everywhere, including phones
  root.addEventListener('dragstart', (e) => {
    const t = e.target.closest('[data-token]');
    if (t) e.dataTransfer.setData('text/plain', t.dataset.token);
  });
  root.addEventListener('dragover', (e) => { if (e.target.closest('[data-spot]')) e.preventDefault(); });
  root.addEventListener('drop', (e) => {
    const s = e.target.closest('[data-spot]');
    if (!s) return;
    e.preventDefault();
    drop(e.dataTransfer.getData('text/plain'), s.dataset.spot);
  });

  draw();
  if (misses) showStatus(status, { tone: 'miss', title: `Misses ${misses}`, text: c.miss });
  return { destroy() {} };
}
