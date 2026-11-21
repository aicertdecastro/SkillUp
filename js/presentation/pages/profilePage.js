// PRESENTATION LAYER · learner profile
import * as auth from '../../business/authService.js';
import * as home from '../../business/homeService.js';
import { icons } from '../components/icons.js';
import { $, esc, toast, showFieldErrors, showFormAlert, setBusy, wireComingSoon } from '../components/ui.js';
import { requireLogin } from '../components/guard.js';

await requireLogin();
wireComingSoon();
$('#back').innerHTML = icons.left();

const content = $('#content');
let data;
let tab = 0;

const STATUS_IMG = { complete: 'status-complete', up_next: 'status-next', in_progress: 'status-next', not_started: 'status-empty' };
const resumeIcon = (id) => id === 'basketball' ? 'assets/img/icon-basketball-orange.png' : `assets/img/sport-${id}-on.png`;

async function load() {
  try {
    data = await home.getProfile();
    const continueTab = data.tracker.findIndex((s) => s.id === data.continue?.sportId);
    tab = continueTab >= 0 ? continueTab : 0;
    render();
  } catch (err) {
    content.innerHTML = `<p class="load-error">${esc(auth.friendlyError(err))}</p>`;
  }
}

function render() {
  const c = data.continue;
  content.innerHTML = `
    <div class="profile-grid">
      <div class="col-left">
        <section class="me">
          <div class="avatar">${esc(data.initials)}</div>
          <h1>${esc(data.name)}</h1>
          <p class="handle">@${esc(data.username)} · ${esc(data.title)}</p>
          <div class="stat-grid">
            <div class="stat stat--points"><b>${esc(data.pointsNumber)}</b><small>Points</small></div>
            <div class="stat stat--streak"><b>${esc(data.streakNumber)}</b><small>Streak</small></div>
            <div class="stat stat--lessons"><b>${esc(data.lessonsDone)}</b><small>Lessons done</small></div>
            <div class="stat stat--badges"><b>${esc(data.badgesEarned)}</b><small>Badges</small></div>
          </div>
        </section>

        <section class="week-card">
          <h2>This week’s streak</h2>
          <div class="week">
            ${data.week.map((d) => `
              <div class="${d.today ? 'today' : ''}">
                <img src="assets/img/flame-${d.active ? 'on' : 'off'}.png" alt="${d.active ? 'Played' : 'Not played'}">
                <span>${d.letter}</span>
              </div>`).join('')}
          </div>
        </section>
      </div>

      <div class="col-right">
        ${c ? `
        <section class="resume">
          <img src="${resumeIcon(c.sportId)}" alt="">
          <div>
            <p class="eyebrow">CONTINUE WHERE YOU LEFT OFF</p>
            <h2>${esc(c.title)}</h2>
            <p class="next">${esc(c.nextStep)}</p>
          </div>
          <a class="btn btn--yellow" href="${c.href}">RESUME</a>
        </section>` : `
        <section class="resume"><div><h2>Every lesson done. Amazing!</h2><p class="next">Replay challenges to upgrade your badges.</p></div></section>`}

        <section class="shelf">
          <div class="shelf-head">
            <h2>Trophy shelf</h2>
            <small>Bronze 70–84% · Silver 85–99% · Gold 100%</small>
          </div>
          <div class="badges">
            ${data.badges.map((b) => `
              <div class="badge badge--${b.tier}">
                <img src="assets/img/shield-${b.tier}.png" alt=""><b>${esc(b.name)}</b><small>${esc(b.label)}</small>
              </div>`).join('')}
          </div>
        </section>

        <section class="earn-card">
          <h2>How to earn points</h2>
          <div class="earn">
            <div><b>+10</b>Finish a lesson</div>
            <div><b>+5</b>Each correct quiz answer</div>
            <div><b>+20</b>Pass a challenge level</div>
          </div>
        </section>

        <section class="tracker">
          <h2>Progress tracker</h2>
          <div class="tabs" role="tablist">
            ${data.tracker.map((s, i) => `
              <button type="button" role="tab" data-tab="${i}" aria-selected="${i === tab}">${esc(s.tabLabel)}</button>`).join('')}
          </div>
          <ol class="lessons" role="tabpanel">
            ${data.tracker[tab].lessons.map((l) => `
              <li class="${l.status}"><img src="assets/img/${STATUS_IMG[l.status]}.png" alt=""><a class="lesson-link" href="${l.href}">${esc(l.label)}</a><small>${esc(l.statusLabel)}</small></li>`).join('')}
          </ol>
        </section>
      </div>
    </div>`;
}

content.addEventListener('click', (e) => {
  const t = e.target.closest('[data-tab]');
  if (!t) return;
  tab = Number(t.dataset.tab);
  render();
});

// ---- log out ----
$('#logout-btn').addEventListener('click', async (e) => {
  setBusy(e.currentTarget, true, 'Logging out…');
  try { await auth.logOut(); } finally { location.replace('index.html'); }
});

// ---- edit profile ----
const dialog = $('#edit-dialog');
const form = $('#edit-form');

$('#edit-btn').addEventListener('click', () => {
  if (!data) return;
  form.displayName.value = data.name;
  form.username.value = data.username;
  showFieldErrors(form, {});
  showFormAlert(form, '');
  dialog.showModal();
});
$('#cancel-btn').addEventListener('click', () => dialog.close());
form.username.addEventListener('input', () => {
  form.username.value = form.username.value.toLowerCase().replace(/\s/g, '');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const values = { displayName: form.displayName.value, username: form.username.value };
  const errors = home.validateProfile(values);
  showFieldErrors(form, errors);
  if (Object.keys(errors).length) return;

  const button = form.querySelector('[type="submit"]');
  setBusy(button, true, 'Saving…');
  try {
    await home.updateProfile(data.userId, values);
    dialog.close();
    toast('Profile saved!');
    await load();
  } catch (err) {
    const message = auth.friendlyError(err);
    if (/username/.test(message)) showFieldErrors(form, { username: message });
    else showFormAlert(form, message);
  } finally {
    setBusy(button, false);
  }
});

load();
