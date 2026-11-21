// DATA LAYER · lesson page calls (see supabase/003_learn_quiz.sql).
import { supabase } from './supabaseClient.js';

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

// Everything the lesson page shows. null sport / lesson → the server picks the "continue" lesson.
export const getLesson = (sportId, lessonNo) =>
  rpc('get_lesson', { p_sport: sportId ?? null, p_lesson_no: lessonNo ?? null });

// Returns the ticked card numbers, e.g. [1, 3]
export const tickCard = (lessonId, cardNo) =>
  rpc('tick_lesson_card', { p_lesson_id: lessonId, p_card_no: cardNo });

export const saveStep = (lessonId, step) =>
  rpc('save_lesson_step', { p_lesson_id: lessonId, p_step: step });

export const completeLesson = (lessonId) =>
  rpc('complete_lesson', { p_lesson_id: lessonId });
