// BUSINESS LAYER · sign-up / login rules and friendly error messages.
import * as authRepo from '../data/authRepository.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const MIN_PASSWORD = 8;

// Turns Supabase / network errors into messages a learner understands.
export function friendlyError(err) {
  const msg = (err && err.message) || '';
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password. Try again!';
  if (/already registered|already been registered/i.test(msg)) return 'That email already has an account. Log in instead.';
  if (/rate limit/i.test(msg)) return 'Too many tries. Wait a minute and try again.';
  if (/failed to fetch|network/i.test(msg)) return 'Can’t reach SkillUp. Check your internet connection.';
  if (/duplicate key|23505|saving new user/i.test(msg) || err?.code === '23505') return 'That username is taken. Pick another one.';
  if (/not logged in|jwt/i.test(msg)) return 'Your login expired. Please log in again.';
  // lessons + sport final (messages raised in supabase/003_learn_quiz.sql)
  if (/finish all 5 lessons first/i.test(msg)) return 'Finish all 5 lessons to unlock the Sport Final.';
  if (/read every card first/i.test(msg)) return 'Tick every key point card first.';
  if (/already answered/i.test(msg)) return 'You already answered that one.';
  if (/answer every question first/i.test(msg)) return 'Answer every question first.';
  if (/no quiz for this sport/i.test(msg)) return 'This Sport Final isn’t ready yet. Check back soon!';
  if (/lesson not found|quiz not found|not finished yet/i.test(msg)) return 'We couldn’t find that. Head back to the dashboard.';
  return 'Something went wrong. Please try again.';
}

// Returns { field: message } for every problem, or {} when the form is fine.
export function validateLogin({ email, password }) {
  const errors = {};
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email, like you@example.com.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateSignUp({ displayName, username, email, password, confirm }) {
  const errors = {};
  if (!displayName.trim()) errors.displayName = 'Enter your name.';
  else if (displayName.trim().length > 40) errors.displayName = 'Keep your name under 40 characters.';
  if (!USERNAME_RE.test(username)) errors.username = '3–20 characters: small letters, numbers or _.';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email, like you@example.com.';
  if (password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  if (confirm !== password) errors.confirm = 'Passwords don’t match.';
  return errors;
}

export async function logIn({ email, password, remember }) {
  await authRepo.logIn({ email: email.trim().toLowerCase(), password, remember });
}

export async function signUp({ displayName, username, email, password }) {
  const cleanUsername = username.trim().toLowerCase();
  if (!(await authRepo.isUsernameAvailable(cleanUsername))) {
    const err = new Error('duplicate key'); err.field = 'username'; throw err;
  }
  const data = await authRepo.signUp({
    email: email.trim().toLowerCase(),
    password,
    username: cleanUsername,
    displayName: displayName.trim(),
  });
  // With email confirmation turned off, Supabase logs the new player in straight away.
  return { loggedIn: Boolean(data.session) };
}

export async function logOut() {
  await authRepo.logOut();
}

// Page guards
export async function isLoggedIn() {
  return Boolean(await authRepo.getSession());
}
