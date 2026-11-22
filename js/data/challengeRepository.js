// DATA LAYER · challenge calls (see supabase/007_basketball_challenges.sql).
// The server keeps the answers and checks every pick; nothing here knows what is right.
import { supabase } from './supabaseClient.js';

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

// Everything the challenge page shows. null type / level → the server picks.
export const getChallenge = (sportId, type, level) =>
  rpc('get_challenge', { p_sport: sportId ?? null, p_type: type ?? null, p_level: level ?? null });

// Opens a try (or carries on with the open one). restart = Reset / Try again.
export const startChallenge = (levelId, restart = false) =>
  rpc('start_challenge', { p_level_id: levelId, p_restart: restart });

// positions {token, spot} · rules {player} · play {choice} (null = time ran out)
export const move = (attemptId, pick) =>
  rpc('challenge_move', { p_attempt: attemptId, p_move: pick });

export const finishTiming = (attemptId, hits, tries) =>
  rpc('finish_timing', { p_attempt: attemptId, p_hits: hits, p_tries: tries });

export const getChallengeResult = (attemptId) =>
  rpc('get_challenge_result', { p_attempt: attemptId });
