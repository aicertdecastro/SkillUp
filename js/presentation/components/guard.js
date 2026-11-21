// PRESENTATION LAYER · page guard for pages that need a logged-in learner.
import { isLoggedIn } from '../../business/authService.js';

export async function requireLogin() {
  if (await isLoggedIn()) return;
  location.replace('index.html');
  await new Promise(() => {}); // stop the page script while the browser leaves
}
