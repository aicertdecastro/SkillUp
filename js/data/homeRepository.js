// DATA LAYER · dashboard + profile data, and profile edits.
import { supabase } from './supabaseClient.js';

// One call returns everything the dashboard and profile show (see supabase/002_home.sql).
export async function getHome() {
  const { data, error } = await supabase.rpc('get_home');
  if (error) throw error;
  return data;
}

// Row Level Security only lets a learner update their own name and username.
export async function updateProfile(userId, { displayName, username }) {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, username })
    .eq('id', userId);
  if (error) throw error;
}
