// PRESENTATION LAYER · results + review screen.
// result.html?quiz=<attempt id> (Sport Final) or result.html?level=<attempt id> (challenge game).
import * as auth from '../../business/authService.js';
import * as quiz from '../../business/quizService.js';
import * as ch from '../../business/challengeService.js';
import { icons } from '../components/icons.js';
import { $, esc } from '../components/ui.js';
import { requireLogin } from '../components/guard.js';
import { isSoundOn, setSoundOn, playCelebrate } from '../components/sound.js';

await requireLogin();

const content = $('#content');
const challengeAttempt = ch.readResultParam(location.search);
const attemptId = quiz.readAttemptParam(location.search);
let R;

try {
  if (challengeAttempt) R = await ch.getChallengeResult(challengeAttempt);
  else if (attemptId) R = await quiz.getQuizResult(attemptId);
  else throw new Error('Quiz not found');
  document.title = `SkillUp · ${R.title}`;
  render();
  if (R.passed) playCelebrate();   // browsers may block sound until the first tap
} catch (err) {
  content.innerHTML = `
    <div class="result-card result-error">
      <p class="load-error">${esc(auth.friendlyError(err))}</p>
      <a class="btn btn--blue" href="dashboard.html">Dashboard</a>
    </div>`;
}

function soundToggle() {
  const on = isSoundOn();
  return `<button type="button" class="toggle${on ? ' is-on' : ''}" id="sound" role="switch" aria-checked="${on}" aria-label="Celebration sound">${on ? 'ON' : 'OFF'}</button>`;
}

function render() {
  content.innerHTML = `
    <h1 class="result-title${R.passed ? '' : ' result-title--retry'}">${esc(R.title)}</h1>
    <p class="result-chip">${esc(R.chip)}</p>

    <div class="result-grid">
      <section class="result-card badge-card">
        <small class="caps">${R.practice ? 'Practice score' : R.passed ? 'Badge earned' : 'Badge'}</small>
        <span class="badge-shield">${icons.shield(R.tier)}</span>
        <h2>${esc(R.badgeLabel)}</h2>
        <p class="badge-name">${esc(R.badgeName)}</p>
        <div class="tier-strip">
          ${R.tiers.map((t) => `
            <div class="tier tier--${t.id}${t.you ? ' is-you' : ''}"><b>${esc(t.label)}${t.you ? ' · YOU' : ''}</b><small>${esc(t.range)}</small></div>`).join('')}
        </div>
        <p class="hint">${esc(R.hint)}</p>
      </section>

      <section class="result-card score-card">
        <div class="stat-row">
          ${R.stats.map((s) => `<div class="stat-tile stat-tile--${s.tone}"><b>${esc(s.big)}</b><small>${esc(s.small)}</small></div>`).join('')}
        </div>
        <div class="msg${R.passed ? '' : ' msg--retry'}">${R.lines.map((l, i) => i ? `<p>${esc(l)}</p>` : `<p><b>${esc(l)}</b></p>`).join('')}</div>
        <div class="sound-row"><span>Celebration sound</span><span id="sound-slot">${soundToggle()}</span></div>
      </section>
    </div>

    ${R.review.length ? `
    <section class="result-card review-card">
      <h2>Review ${R.review.length === 1 ? 'this lesson' : 'these lessons'}</h2>
      <div class="review-list">
        ${R.review.map((r) => `<a class="review-item" href="${r.href}"><small>${esc(r.eyebrow)}</small><b>${esc(r.title)}</b></a>`).join('')}
      </div>
    </section>` : ''}

    <div class="result-actions">
      <a class="btn" href="${R.tryAgainHref}">Try again</a>
      <a class="btn btn--blue" href="dashboard.html">Dashboard</a>
      ${R.next ? `<a class="btn btn--yellow" href="${R.next.href}">${esc(R.next.label)}</a>` : ''}
    </div>`;
}

content.addEventListener('click', (e) => {
  if (!e.target.closest('#sound')) return;
  const on = !isSoundOn();
  setSoundOn(on);
  $('#sound-slot').innerHTML = soundToggle();
  $('#sound').focus();
  if (on) playCelebrate();
});
