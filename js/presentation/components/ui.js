// PRESENTATION LAYER · small helpers shared by the pages.
export const $ = (sel, root = document) => root.querySelector(sel);

// escape text before putting it in innerHTML (names come from users)
export function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Escaped text where **like this** becomes bold. Escaping happens first, so content
// from the database can never add its own HTML.
export function richText(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

export function toast(message) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

// Show { field: message } errors under each input
export function showFieldErrors(form, errors) {
  form.querySelectorAll('.field').forEach((field) => {
    const input = field.querySelector('input');
    const out = field.querySelector('.error');
    const msg = input && errors[input.name];
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (out) out.textContent = msg || '';
  });
  const first = form.querySelector('[aria-invalid="true"]');
  if (first) first.focus();
}

export function showFormAlert(form, message) {
  const box = form.querySelector('.form-alert');
  box.textContent = message || '';
  box.hidden = !message;
}

export function setBusy(button, busy, busyText) {
  if (busy) { button.dataset.label = button.textContent; button.textContent = busyText; }
  else if (button.dataset.label) button.textContent = button.dataset.label;
  button.disabled = busy;
}

// Links to pages that aren't built yet show a friendly message instead of a 404.
// Remove the "soon" class from a link once its page exists.
export function wireComingSoon(root = document) {
  root.addEventListener('click', (e) => {
    const link = e.target.closest('.soon');
    if (!link) return;
    e.preventDefault();
    toast('Coming soon! This part is still being built.');
  });
}

// Floating sport balls around the login and sign-up cards
export function decorateAuthPage() {
  for (const name of ['basketball', 'trophy', 'soccer', 'volleyball']) {
    const img = document.createElement('img');
    img.className = `deco deco--${name}`;
    img.src = `assets/img/deco-${name}.png`;
    img.alt = '';
    document.querySelector('.auth').append(img);
  }
}
