// DATA LAYER · the single Supabase connection used by every repository.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const REMEMBER_KEY = 'skillup.remember';

// "Keep me logged in":
//   checked   → login is saved in localStorage (survives closing the browser)
//   unchecked → login is saved in sessionStorage (ends when the tab/browser closes)
const sessionStore = {
  getItem: (key) => localStorage.getItem(key) ?? sessionStorage.getItem(key),
  setItem: (key, value) => {
    const remember = localStorage.getItem(REMEMBER_KEY) === '1';
    (remember ? localStorage : sessionStorage).setItem(key, value);
    (remember ? sessionStorage : localStorage).removeItem(key);
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export function setRememberMe(remember) {
  if (remember) localStorage.setItem(REMEMBER_KEY, '1');
  else localStorage.removeItem(REMEMBER_KEY);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: sessionStore, persistSession: true, autoRefreshToken: true },
});
