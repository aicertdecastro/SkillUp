// PRESENTATION LAYER · top bar shared by the lesson and Sport Final pages:
// back arrow, wordmark, sport tabs, and one item on the right.
import { icons } from './icons.js';
import { esc } from './ui.js';

const NAMES = { basketball: 'Basketball', volleyball: 'Volleyball', soccer: 'Soccer' };

// sports: [{ id, current, href }]   right: HTML for the right-hand side
export function renderTopbar(bar, { sports, right = '' }) {
  bar.innerHTML = `
    <a class="back" href="dashboard.html" aria-label="Back to dashboard">${icons.left()}</a>
    <a class="wordmark" href="dashboard.html">SKILL<span>UP</span></a>
    <nav class="sport-tabs" aria-label="Sports">
      ${sports.map((s) => `
        <a href="${s.href}" class="sport-tab sport-tab--${s.id}"${s.current ? ' aria-current="page"' : ''}>${esc(NAMES[s.id])}</a>`).join('')}
    </nav>
    <div class="topbar-right">${right}</div>`;
}
