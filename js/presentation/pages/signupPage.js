// PRESENTATION LAYER · sign-up page
import * as auth from '../../business/authService.js';
import { $, showFieldErrors, showFormAlert, setBusy, decorateAuthPage } from '../components/ui.js';

decorateAuthPage();

if (await auth.isLoggedIn()) location.replace('dashboard.html');

const form = $('#signup-form');
const button = form.querySelector('button[type="submit"]');

// usernames are always lowercase
form.username.addEventListener('input', () => {
  form.username.value = form.username.value.toLowerCase().replace(/\s/g, '');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const values = {
    displayName: form.displayName.value,
    username: form.username.value,
    email: form.email.value,
    password: form.password.value,
    confirm: form.confirm.value,
  };

  showFormAlert(form, '');
  const errors = auth.validateSignUp(values);
  showFieldErrors(form, errors);
  if (Object.keys(errors).length) return;

  setBusy(button, true, 'CREATING YOUR PLAYER…');
  try {
    const { loggedIn } = await auth.signUp(values);
    location.replace(loggedIn ? 'dashboard.html' : 'index.html');
  } catch (err) {
    const message = auth.friendlyError(err);
    if (err.field === 'username') showFieldErrors(form, { username: message });
    else showFormAlert(form, message);
    setBusy(button, false);
  }
});
