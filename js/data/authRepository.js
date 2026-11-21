// DATA LAYER · login, sign-up and session calls to Supabase Auth.
import { supabase, setRememberMe } from './supabaseClient.js';

export async function signUp({ email, password, username, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // read by the handle_new_user() trigger to create the profile row
    options: { data: { username, display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

export async function logIn({ email, password, remember }) {
  setRememberMe(remember);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logOut() {
  const { error } = await supabase.auth.signOut();
  setRememberMe(false);
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function isUsernameAvailable(username) {
  const { data, error } = await supabase.rpc('username_available', { p_username: username });
  if (error) throw error;
  return data;
}
