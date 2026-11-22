// PRESENTATION LAYER · challenge page: game tabs, Level 1 / Level 2 tabs, and the game itself.
import * as auth from '../../business/authService.js';
import * as ch from '../../business/challengeService.js';
import { uiIcons } from '../components/icons.js';
import { $, esc, toast } from '../components/ui.js';
import { requireLogin } from '../components/guard.js';
import { renderTopbar } from '../components/learnTopbar.js';
import * as positions from '../components/games/positionsGame.js';
import * as rules from '../components/games/rulesGame.js';
import * as timing from '../components/games/timingGame.js';
import * as play from '../components/games/playGame.js';

const GAMES = { positions, rules, timing, play };

await requireLogin();

const content = $('#content');
let C;

try {
  C = await ch.loadChallenge(ch.readChallengeParams(location.search));
  history.replaceState(null, '', C.href);
  document.title = `SkillUp · ${C.level.heading}`;
  renderTopbar($('#topbar'), {
    sports: C.sports,
    nav: C.ready ? gameTabs() : '',
    right: `<span class="chip chip--points"><img src="assets/img/icon-coin.png" alt="">${esc(C.pointsChip)}</span>`,
  });
  if (!C.ready) renderSoon();
  else if (C.level.locked) renderLocked();
  else render();
} catch (err) {
  content.innerHTML = `<p class="load-error">${esc(auth.friendlyError(err))}</p>`;
}

// ---------------------------------------------------------------- render

function gameTabs() {
  return `
    <nav class="game-tabs" aria-label="Challenges">
      ${C.games.map((g) => g.locked
        ? `<button type="button" class="game-tab is-locked" data-locked="${esc(g.lockText)}">${uiIcons.lock()}${esc(g.name)}</button>`
        : `<a class="game-tab${g.passed === 2 ? ' is-passed' : ''}" href="${g.href}"${g.current ? ' aria-current="page"' : ''}>${esc(g.name)}</a>`).join('')}
    </nav>`;
}

function levelTabs() {
  return `
    <div class="level-tabs" role="tablist" aria-label="Levels">
      ${C.levels.map((l) => l.locked
        ? `<button type="button" class="level-tab is-locked" data-locked="${esc(l.lockText)}">${uiIcons.lock()}${esc(l.label)}</button>`
        : `<a class="level-tab${l.current ? ' is-current' : ''}${l.passed ? ' is-passed' : ''}" role="tab" aria-selected="${l.current}" href="${l.href}">${esc(l.label)}${l.passed ? ` ${uiIcons.tick()}` : ''}</a>`).join('')}
    </div>`;
}

function render() {
  content.innerHTML = `
    <div class="challenge sport--${C.sportId}">
      ${levelTabs()}
      <div id="game"></div>
    </div>`;
  GAMES[C.level.type].mount($('#game'), C);
}

function renderLocked() {
  const toLesson = !/level 1/i.test(C.level.lockText);
  content.innerHTML = `
    <div class="challenge sport--${C.sportId}">
      ${levelTabs()}
      <div class="locked">
        <span class="locked-icon">${uiIcons.lock()}</span>
        <h1>${esc(C.level.heading)}</h1>
        <p>${esc(C.level.lockText)}</p>
        <div class="row">
          ${toLesson
            ? `<a class="btn btn--blue" href="${C.level.lessonHref}">Go to ${esc(C.level.lessonLabel)}</a>`
            : `<a class="btn btn--blue" href="${C.levels[0].href}">Play Level 1</a>`}
          <a class="btn" href="dashboard.html">Dashboard</a>
        </div>
      </div>
    </div>`;
}

function renderSoon() {
  content.innerHTML = `
    <div class="locked">
      <h1>${esc(C.sportName)} challenges</h1>
      <p>Coming soon! Try the ${esc(C.sportName)} lessons while the games are being built.</p>
      <div class="row">
        <a class="btn btn--blue" href="${ch.challengeHref('basketball')}">Basketball challenges</a>
        <a class="btn" href="dashboard.html">Dashboard</a>
      </div>
    </div>`;
}

// Locked tabs explain why instead of opening.
document.addEventListener('click', (e) => {
  const locked = e.target.closest('[data-locked]');
  if (locked) toast(locked.dataset.locked);
});
