// PRESENTATION LAYER · dashboard ("Pick your sport!")
import * as auth from '../../business/authService.js';
import * as home from '../../business/homeService.js';
import { icons } from '../components/icons.js';
import { $, esc, wireComingSoon } from '../components/ui.js';
import { requireLogin } from '../components/guard.js';

await requireLogin();
wireComingSoon();

// Carousel order: the chosen sport sits in the middle with its neighbours on each side
// (basketball → volleyball on the left, soccer on the right, as in the Figma screen).
const CYCLE = ['basketball', 'soccer', 'volleyball'];

const content = $('#content');
let data;
let current = 0;               // index in CYCLE of the sport in the middle

try {
  data = await home.getDashboard();
  const start = CYCLE.indexOf(data.continue?.sportId);
  current = start >= 0 ? start : 0;
  renderStats();
  render();
} catch (err) {
  content.innerHTML = `<p class="load-error">${esc(auth.friendlyError(err))}</p>`;
}

function sportById(id) {
  return data.sports.find((s) => s.id === id);
}

function renderStats() {
  $('#stats').innerHTML = `
    <span class="chip" title="Points"><img src="assets/img/icon-coin.png" alt="">${esc(data.points)}</span>
    <span class="chip" title="Day streak"><img src="assets/img/icon-flame.png" alt="">${esc(data.streak)}</span>
    <a class="chip" href="profile.html" title="Badges"><img src="assets/img/icon-trophy.png" alt="">${esc(data.badges)}</a>
    ${data.continue ? `<a class="chip chip--continue" href="${data.continue.href}">${icons.triangle()}<span>Continue: ${esc(data.continue.short)}</span></a>` : ''}
    <a class="avatar" href="profile.html" title="My profile">${esc(data.initials)}</a>`;
}

function card(sport, selected) {
  return `
    <button type="button" class="sport-card${selected ? ' is-selected' : ''}" data-sport="${sport.id}"
            style="--accent: var(--${sport.id}); --accent-shadow: var(--${sport.id}-shadow)"
            aria-pressed="${selected}" aria-label="${esc(sport.name)}, ${esc(sport.progressText)}">
      <div class="art">
        <span class="tag">${esc(sport.tag)}</span>
        <img src="assets/img/sport-${sport.id}-${selected ? 'on' : 'off'}.png" alt="">
      </div>
      <div class="meta"><h2>${esc(sport.name)}</h2><small>${esc(sport.progressText)}</small></div>
      <div class="bar"><i style="width:${Math.max(sport.percent, 5)}%"></i></div>
    </button>`;
}

function render() {
  const n = CYCLE.length;
  const left = sportById(CYCLE[(current - 1 + n) % n]);
  const mid = sportById(CYCLE[current]);
  const right = sportById(CYCLE[(current + 1) % n]);

  content.innerHTML = `
    <section class="pick">
      <div class="pick-head">
        <div>
          <p class="greet">Hey ${esc(data.firstName)}, ready to play?</p>
          <h1>Pick your sport!</h1>
        </div>
        <div class="pager">
          <button type="button" data-step="-1" aria-label="Previous sport">${icons.left()}</button>
          <span aria-live="polite">${current + 1} / ${n}</span>
          <button type="button" data-step="1" aria-label="Next sport">${icons.right()}</button>
        </div>
      </div>
      <div class="sport-cards">${card(left, false)}${card(mid, true)}${card(right, false)}</div>
      <div class="dots" aria-hidden="true"><i></i><i class="on"></i><i></i></div>
    </section>

    <section class="about">
      <article class="about-card" style="--accent: var(--${mid.id}); --accent-shadow: var(--${mid.id}-shadow)">
        <div>
          <span class="label">ABOUT THIS SPORT</span>
          <h2>${esc(mid.name)}</h2>
          <p>${esc(mid.info.blurb)}</p>
        </div>
        <div class="about-side">
          <div class="facts">
            ${mid.info.facts.map(([big, small]) => `<div class="fact"><b>${esc(big)}</b><small>${esc(small)}</small></div>`).join('')}
          </div>
          <div class="about-actions">
            ${mid.playHref
              ? `<a class="btn btn--orange" href="${mid.playHref}">PLAY LESSON ${mid.nextLessonNo}</a>`
              : `<a class="btn btn--green" href="${mid.reviewHref}">REVIEW LESSONS</a>`}
            <a class="btn btn--blue${mid.challengesReady ? '' : ' soon'}" href="${mid.challengesHref}">Challenges</a>
          </div>
        </div>
      </article>
    </section>`;
}

content.addEventListener('click', (e) => {
  const step = e.target.closest('[data-step]');
  const picked = e.target.closest('.sport-card');
  if (step) current = (current + Number(step.dataset.step) + CYCLE.length) % CYCLE.length;
  else if (picked) current = CYCLE.indexOf(picked.dataset.sport);
  else return;
  render();
});
