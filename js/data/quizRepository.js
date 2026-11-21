// DATA LAYER · Sport Final quiz calls. The server checks every answer and
// never sends a correct answer until the question has been answered.
import { supabase } from './supabaseClient.js';

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

// Starts a new attempt, or resumes the unfinished one.
export const startQuiz = (sportId) => rpc('start_quiz', { p_sport: sportId });

// First answer is final. Returns { correct, correct_index, review_lesson_no, review_lesson_title, correct_so_far, ... }
export const answerQuestion = (attemptId, questionId, index) =>
  rpc('answer_quiz_question', { p_attempt: attemptId, p_question_id: questionId, p_index: index });

export const finishQuiz = (attemptId) => rpc('finish_quiz', { p_attempt: attemptId });

export const getQuizResult = (attemptId) => rpc('get_quiz_result', { p_attempt: attemptId });
