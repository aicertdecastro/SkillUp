// PRESENTATION LAYER · lesson page, "Learn" step (video + key-point cards)
import * as auth from '../../business/authService.js';
import * as lessons from '../../business/lessonService.js';
import { icons, cardIcon, uiIcons } from '../components/icons.js';
import { $, esc, richText, toast, setBusy } from '../components/ui.js';
import { requireLogin } from '../components/guard.js';
import { renderTopbar } from '../components/learnTopbar.js';

await requireLogin();

const content = $('#content');
let L;

try {
  await load(lessons.readLessonParams(location.search));
} catch (err) {
  content.innerHTML = `<p class="load-error">${esc(auth.friendlyError(err))}</p>`;
}

// Also used after finishing a lesson, so the sidebar, progress, points chip and
// Sport Final button update without a page refresh.
async function load(params) {
  L = await lessons.loadLesson(params);
  history.replaceState(null, '', L.href);          // so refresh / share stays on this lesson
  document.title = `SkillUp · ${L.title}`;
  renderTopbar($('#topbar'), {
    sports: L.otherSports,
    right: `<span class="chip chip--points"><img src="assets/img/icon-coin.png" alt="">${esc(L.pointsChip)}</span>`,
  });
  render();
}

// ---------------------------------------------------------------- render

function sidebar() {
  const s = L.sidebar;
  return `
    <aside class="side">
      <section class="side-card">
        <h2>${esc(s.heading)}</h2>
        <p class="side-sub">${esc(s.sub)}</p>
        <ol class="lesson-list">
          ${s.lessons.map((l) => `
            <li>
              <a href="${l.href}" class="lesson-item lesson-item--${l.status}${l.current ? ' is-current' : ''}"${l.current ? ' aria-current="page"' : ''}>
                <span class="num">${l.no}</span>
                <span><b>${esc(l.title)}</b><small>${esc(l.sub)}</small></span>
              </a>
            </li>`).join('')}
        </ol>
        ${s.final.unlocked
          ? `<a class="btn btn--yellow final-btn" href="${s.final.href}">${esc(s.final.label)}</a>`
          : `<button type="button" class="btn btn--yellow final-btn is-locked" id="final-locked">${uiIcons.lock()}${esc(s.final.label)}</button>`}

        <div class="side-box">
          <div class="row"><b>Your progress</b><b>${esc(s.lessonsText)}</b></div>
          <div class="meter"><i style="width:${s.lessonsPct}%"></i></div>
          <div class="row"><small>Challenge levels passed</small><small><b>${esc(s.levelsText)}</b></small></div>
        </div>

        <div class="side-box">
          <b>Ways to earn points</b>
          ${s.earn.map(([what, pts]) => `<div class="row"><small>${esc(what)}</small><b>${esc(pts)}</b></div>`).join('')}
        </div>

        <div class="coach">
          <span class="coach-face">${uiIcons.smile()}</span>
          <p><b>Coach says</b>${esc(s.coach)}</p>
        </div>
      </section>
    </aside>`;
}

function video() {
  const v = L.video;
  if (v.url) {
    return `
      <div class="video">
        <video controls preload="metadata" src="${esc(v.url)}">
          ${v.captions ? `<track kind="captions" srclang="en" label="English" src="${esc(v.captions)}" default>` : ''}
        </video>
      </div>`;
  }
  return `
    <div class="video">
      <div class="video-stage">
        <span class="video-badge">${esc(v.badge)}</span>
        <span class="video-slot">Video goes here · 16:9</span>
        <button type="button" class="video-play" data-video-soon aria-label="Play video">${icons.play()}</button>
        <h3>${esc(L.title)}</h3>
        <p>Coach demonstration for this lesson</p>
      </div>
      <div class="video-bar">
        <button type="button" class="video-mini" data-video-soon aria-label="Play">${icons.triangle()}</button>
        <i class="video-track"></i>
        <span>${esc(v.length)}</span>
        <button type="button" class="cc" disabled aria-label="Captions">CC</button>
      </div>
    </div>`;
}

function card(c) {
  return `
    <li>
      <button type="button" class="kp${c.done ? ' is-done' : ''}" data-card="${c.no}" aria-pressed="${c.done}">
        <span class="kp-art">${cardIcon(c.icon)}<span class="kp-label">${esc(c.label)}</span></span>
        <span class="kp-text"><small>Key point ${c.no}</small><span>${c.heading ? `<b>${esc(c.heading)}</b> ` : ''}${richText(c.body)}</span></span>
        <span class="kp-check">${uiIcons.tick()}</span>
      </button>
    </li>`;
}

function render() {
  const allDone = lessons.allCardsDone(L.cards);
  content.innerHTML = `
    <div class="lesson-grid sport--${L.sportId}">
      ${sidebar()}
      <section class="lesson-main">
        <p class="eyebrow">${esc(L.eyebrow)}</p>
        <h1>${esc(L.title)}</h1>
        <p class="goal">Goal: ${esc(L.goal)}</p>

        <div class="steps" role="tablist" aria-label="Lesson steps">
          ${L.steps.map((s) => `
            <button type="button" role="tab" class="step${s.current ? ' is-current' : ''}" data-step="${s.id}" aria-selected="${s.current}">
              <span class="step-n">${s.n}</span>${esc(s.label)}
            </button>`).join('')}
        </div>

        <div class="learn-box">
          ${video()}
          <div class="kp-head">
            <h2>Key points</h2>
            <span>Tap each card when you’ve read it <b class="counter" id="counter">${lessons.cardsCounter(L.cards)}</b></span>
          </div>
          <ul class="kp-list" id="cards">${L.cards.map(card).join('')}</ul>
          <p class="kp-hint">Scroll inside the box to see all ${L.cards.length} key points.</p>
          <div class="lesson-foot">
            <a class="btn" href="${L.back}">Back</a>
            <button type="button" class="btn btn--blue" id="next" aria-disabled="${!allDone}">${esc(L.footer.label)}</button>
          </div>
        </div>
      </section>
    </div>`;
}

// Update one card, the counter and the Next button without redrawing (keeps the scroll position).
function syncCards(doneNos) {
  for (const c of L.cards) {
    c.done = doneNos.includes(c.no);
    const btn = content.querySelector(`[data-card="${c.no}"]`);
    btn.classList.toggle('is-done', c.done);
    btn.setAttribute('aria-pressed', c.done);
  }
  $('#counter').textContent = lessons.cardsCounter(L.cards);
  $('#next').setAttribute('aria-disabled', !lessons.allCardsDone(L.cards));
}

// ---------------------------------------------------------------- events

content.addEventListener('click', async (e) => {
  const cardBtn = e.target.closest('[data-card]');
  if (cardBtn) return tick(Number(cardBtn.dataset.card));

  if (e.target.closest('#final-locked')) return toast('Finish all 5 lessons to unlock the Sport Final.');
  if (e.target.closest('[data-video-soon]')) return toast('The coach video is coming soon!');

  const step = e.target.closest('[data-step]');
  if (step && step.dataset.step !== 'learn') return toast('Coming soon! This part is still being built.');

  const next = e.target.closest('#next');
  if (next) return finish(next);
});

async function tick(no) {
  const before = L.cards.filter((c) => c.done).map((c) => c.no);
  if (before.includes(no)) return;                  // ticks stay ticked
  syncCards([...before, no]);                        // show it right away
  try {
    syncCards(await lessons.tickCard(L.lessonId, no));
  } catch (err) {
    syncCards(before);
    toast(auth.friendlyError(err));
  }
}

// Footer button: finish the lesson (+10 the first time), then go on.
async function finish(button) {
  if (!lessons.allCardsDone(L.cards)) return toast('Tick every key point card first.');
  setBusy(button, true, 'Saving…');
  try {
    const { pointsAwarded } = await lessons.finishLesson(L.lessonId);
    const done = pointsAwarded ? `+${pointsAwarded} pts! Lesson finished.` : 'Lesson finished.';
    if (L.footer.href) {                 // next lesson, Sport Final, or a built challenge
      toast(done);
      setTimeout(() => { location.href = L.footer.href; }, 900);   // let the toast be seen
      return;
    }
    toast(`${done} The challenge is coming soon!`);
    await load({ sportId: L.sportId, lessonNo: L.lessonNo });
  } catch (err) {
    toast(auth.friendlyError(err));
    setBusy(button, false);
  }
}
