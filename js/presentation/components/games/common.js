// PRESENTATION LAYER · pieces shared by the four challenge games.
import { esc } from '../ui.js';

export function howToBox(steps) {
  if (!steps.length) return '';
  return `
    <section class="ch-box">
      <h2>How to play</h2>
      <ol class="how-to">${steps.map((s, i) => `<li><span class="num">${i + 1}</span><span>${esc(s)}</span></li>`).join('')}</ol>
    </section>`;
}

// Bottom message bar. tone: 'info' | 'miss' | 'pass' | 'fail'
export function statusBar(id = 'status') {
  return `<div class="ch-status" id="${id}" role="status" aria-live="polite" hidden></div>`;
}

export function showStatus(el, { tone = 'info', title = '', text = '', resultHref = null, retry = false }) {
  el.hidden = false;
  el.className = `ch-status ch-status--${tone}`;
  el.innerHTML = `
    <p>${title ? `<b>${esc(title)}</b> ` : ''}${esc(text)}</p>
    <span class="ch-status-actions">
      ${retry ? '<button type="button" class="btn" data-retry>Try again</button>' : ''}
      ${resultHref ? `<a class="btn btn--yellow" href="${resultHref}">See results</a>` : ''}
    </span>`;
}

export function hideStatus(el) {
  el.hidden = true;
  el.innerHTML = '';
}

// Colour key under a picture: [['you', 'You (with the ball)'], ...]
export function keyBox(items) {
  return `
    <div class="ch-key"><b>Key</b>
      ${items.map(([kind, label]) => `<span><i class="dot dot--${kind}"></i>${esc(label)}</span>`).join('')}
    </div>`;
}

export const pos = (x, y) => `left:${Number(x)}%;top:${Number(y)}%`;
