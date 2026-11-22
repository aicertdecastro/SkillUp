// PRESENTATION LAYER · Sport Final quiz (one question at a time, checked by the server)
import * as auth from '../../business/authService.js';
import * as quiz from '../../business/quizService.js';
import { lessonHref, finalHref } from '../../business/lessonService.js';
import { sportIcon, uiIcons } from '../components/icons.js';
import { $, esc, toast, setBusy, practiceBanner } from '../components/ui.js';
import { requireLogin } from '../components/guard.js';
import { renderTopbar } from '../components/learnTopbar.js';
import { isSoundOn, setSoundOn, playCorrect, playWrong } from '../components/sound.js';

await requireLogin();

const content = $('#content');
const sportId = quiz.readSportParam(location.search);
if (!sportId) {
  location.replace('dashboard.html');
  await new Promise(() => {});   // stop here while the browser leaves
}

let Q;              // the quiz (see quizService.shapeQuiz)
let i = 0;          // question on screen
let busy = false;
let lastPoints = null;  // points from the answer just given (null after a refresh)

drawTopbar();

try {
  Q = await quiz.startQuiz(sportId);
  i = Q.current;
  document.title = `SkillUp · ${Q.title}`;
  render();
} catch (err) {
  renderLocked(auth.friendlyError(err));
}

function drawTopbar() {
  const on = isSoundOn();
  renderTopbar($('#topbar'), {
    sports: ['basketball', 'volleyball', 'soccer'].map((id) => ({ id, current: id === sportId, href: finalHref(id) })),
    right: `<button type="button" class="icon-btn" id="sound" aria-pressed="${on}" aria-label="Sound effects ${on ? 'on' : 'off'}">${uiIcons.sound(on)}</button>`,
  });
}

// ---------------------------------------------------------------- render

function segmentClass(q, j) {
  if (q.answer) return q.answer.correct ? 'right' : 'wrong';
  return j === i ? 'current' : '';
}

function answerClass(q, o) {
  if (!q.answer) return '';
  if (o.index === q.answer.correctIndex) return ' is-right';
  if (o.index === q.answer.chosen) return ' is-wrong';
  return ' is-dim';
}

function feedback(q) {
  if (!q.answer) return '';
  const last = i === Q.questions.length - 1;
  const right = q.options[q.answer.correctIndex];
  const msg = q.answer.correct
    ? `<p class="fb fb--right">${uiIcons.tick()} Nice one!${lastPoints ? ` +${lastPoints} pts` : ''}</p>`
    : `<p class="fb fb--wrong">Not quite. The right answer is <b>${right.letter}: ${esc(right.text)}</b>.
         <a href="${q.reviewHref}">${esc(q.reviewText)}</a></p>`;
  return `${msg}<button type="button" class="btn btn--blue" id="next">${last ? 'See my results' : 'Next question'}</button>`;
}

function render() {
  const q = Q.questions[i];
  content.innerHTML = `
    <div class="quiz-grid">
      <section class="quiz-main">
        <span class="tag tag--yellow">Sport final</span>
        <h1>${esc(Q.title)}</h1>
        <p class="goal">${esc(Q.sub)}</p>
        ${practiceBanner(Q.practiceNote)}

        <div class="q-progress"><b>${esc(quiz.progressText(i, Q.total))}</b><span>${esc(Q.pointsNote)}</span></div>
        <div class="segments" aria-hidden="true">
          ${Q.questions.map((x, j) => `<i class="${segmentClass(x, j)}"></i>`).join('')}
        </div>

        <article class="q-card">
          <div class="q-head">
            <div>
              <span class="tag tag--sky">${esc(q.from)}</span>
              <h2 id="q-prompt">${esc(q.prompt)}</h2>
            </div>
            <span class="q-art">${sportIcon(Q.sportId)}</span>
          </div>
          <div class="answers" role="group" aria-labelledby="q-prompt">
            ${q.options.map((o) => `
              <button type="button" class="answer${answerClass(q, o)}" data-answer="${o.index}"${q.answer ? ' disabled' : ''}>
                <span class="letter">${o.letter}</span><span class="answer-text">${esc(o.text)}</span>
              </button>`).join('')}
          </div>
          <div class="feedback" aria-live="polite">${feedback(q)}</div>
        </article>
      </section>

      <aside class="quiz-side">
        <h2>Badge goals</h2>
        <div class="so-far">Correct so far <b>${Q.correctSoFar}</b></div>
        ${Q.goals.map((g) => `<div class="goal-row goal-row--${g.id}${Q.correctSoFar >= g.min ? ' is-reached' : ''}">${esc(g.text)}</div>`).join('')}

        <h2>Lessons in this final</h2>
        <ol class="final-lessons">
          ${Q.lessons.map((l) => `
            <li class="${l.no === q.fromLessonNo ? 'is-current' : ''}">
              <span class="num">${l.no}</span><span class="t">${esc(l.title)}</span>
              <span class="dots">${Q.questions.filter((x) => x.fromLessonNo === l.no)
                .map((x) => `<i class="${segmentClass(x, Q.questions.indexOf(x))}"></i>`).join('')}</span>
            </li>`).join('')}
        </ol>
        <p class="side-note">A wrong answer shows you the right one and a link to review that lesson.</p>
      </aside>
    </div>`;
}

function renderLocked(message) {
  content.innerHTML = `
    <div class="locked">
      <span class="locked-icon">${uiIcons.lock()}</span>
      <h1>Sport final locked</h1>
      <p>${esc(message)}</p>
      <div class="row">
        <a class="btn" href="dashboard.html">Dashboard</a>
        <a class="btn btn--orange" href="${lessonHref(sportId)}">Go to lessons</a>
      </div>
    </div>`;
}

// ---------------------------------------------------------------- events

content.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-answer]');
  if (a) return choose(Number(a.dataset.answer));
  const next = e.target.closest('#next');
  if (next) return goNext(next);
});

$('#topbar').addEventListener('click', (e) => {
  if (!e.target.closest('#sound')) return;
  setSoundOn(!isSoundOn());
  drawTopbar();
});

async function choose(index) {
  const q = Q.questions[i];
  if (busy || q.answer) return;
  busy = true;
  content.querySelectorAll('[data-answer]').forEach((b) => { b.disabled = true; });
  try {
    const r = await quiz.answer(Q.attemptId, q.id, index);
    q.answer = { chosen: r.chosen, correctIndex: r.correctIndex, correct: r.correct };
    Q.correctSoFar = r.correctSoFar;
    lastPoints = r.pointsAwarded;
    (r.correct ? playCorrect : playWrong)();
    render();
    $('#next')?.focus();
  } catch (err) {
    toast(auth.friendlyError(err));
    // the server is the source of truth: reload the attempt (e.g. answered in another tab)
    Q = await quiz.startQuiz(sportId).catch(() => Q);
    render();
  } finally {
    busy = false;
  }
}

async function goNext(button) {
  if (i < Q.questions.length - 1) {
    i += 1;
    lastPoints = null;
    render();
    content.querySelector('[data-answer]')?.focus();
    return;
  }
  setBusy(button, true, 'Scoring…');
  try {
    location.href = await quiz.finish(Q.attemptId);
  } catch (err) {
    toast(auth.friendlyError(err));
    setBusy(button, false);
  }
}
