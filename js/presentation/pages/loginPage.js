// PRESENTATION LAYER · login page
import * as auth from '../../business/authService.js';
import { $, showFieldErrors, showFormAlert, setBusy, decorateAuthPage } from '../components/ui.js';

decorateAuthPage();

// Already logged in? Skip straight to the dashboard.
if (await auth.isLoggedIn()) location.replace('dashboard.html');

const form = $('#login-form');
const button = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const values = {
    email: form.email.value,
    password: form.password.value,
    remember: form.remember.checked,
  };

  showFormAlert(form, '');
  const errors = auth.validateLogin(values);
  showFieldErrors(form, errors);
  if (Object.keys(errors).length) return;

  setBusy(button, true, 'LOGGING IN…');
  try {
    await auth.logIn(values);
    location.replace('dashboard.html');
  } catch (err) {
    showFormAlert(form, auth.friendlyError(err));
    setBusy(button, false);
  }
});
