// BUSINESS LAYER · Sport Final quiz and its results screen.
import * as repo from '../data/quizRepository.js';
import { SPORT_IDS, TIERS, QUIZ_PASS_PCT } from '../data/lessonUi.js';
import { lessonHref, finalHref } from './lessonService.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function readSportParam(search) {
  const id = new URLSearchParams(search).get('sport');
  return SPORT_IDS.includes(id) ? id : null;
}

export function readAttemptParam(search) {
  const id = Number(new URLSearchParams(search).get('quiz'));
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Same rounding and cut-offs as tier_for() on the server.
function tierFor(correct, total) {
  const score = Math.round((100 * correct) / total);
  return [...TIERS].reverse().find((t) => score >= t.min)?.id ?? null;
}

// "Bronze · 7–8 right (70–84%)", "Silver · 9 right (85–99%)", "Gold · all 10 right (100%)"
export function badgeGoals(total) {
  return TIERS.map((t) => {
    const ks = [];
    for (let k = 0; k <= total; k++) if (tierFor(k, total) === t.id) ks.push(k);
    let right;
    if (!ks.length) right = '';
    else if (ks.length === 1) right = ks[0] === total ? `all ${total} right` : `${ks[0]} right`;
    else right = `${ks[0]}–${ks[ks.length - 1]} right`;
    return { id: t.id, label: t.label, min: ks[0] ?? total + 1, text: `${t.label} · ${right} (${t.range})` };
  });
}

function shapeAnswer(a) {
  return {
    chosen: a.chosen,
    correctIndex: a.correct_index,
    correct: a.chosen === a.correct_index,
  };
}

function shapeQuiz(q) {
  const sport = q.sport;
  const questions = q.questions.map((x) => ({
    id: x.question_id,
    no: x.question_no,
    prompt: x.prompt,
    fromLessonNo: x.from_lesson_no,
    from: `From lesson ${x.from_lesson_no} · ${x.lesson_title}`,
    reviewText: `Review Lesson ${x.from_lesson_no}: ${x.lesson_title}`,
    reviewHref: lessonHref(sport.id, x.from_lesson_no),
    options: x.options.map((text, i) => ({ index: i, letter: LETTERS[i], text })),
    answer: x.answer ? shapeAnswer(x.answer) : null,
  }));
  const firstOpen = questions.findIndex((x) => !x.answer);
  return {
    attemptId: q.attempt_id,
    sportId: sport.id,
    sportName: sport.name,
    title: `${sport.name} final quiz`,
    sub: `${q.total} questions from all ${q.lessons.length} lessons · ${QUIZ_PASS_PCT}% to pass`,
    total: q.total,
    correctSoFar: q.correct_so_far,
    goals: badgeGoals(q.total),
    lessons: q.lessons.map((l) => ({ no: l.lesson_no, title: l.title })),
    questions,
    // where to pick up after a refresh (all answered → last question, ready to finish)
    current: firstOpen === -1 ? questions.length - 1 : firstOpen,
  };
}

export async function startQuiz(sportId) {
  return shapeQuiz(await repo.startQuiz(sportId));
}

export async function answer(attemptId, questionId, index) {
  const r = await repo.answerQuestion(attemptId, questionId, index);
  return {
    chosen: index,
    correctIndex: r.correct_index,
    correct: r.correct,
    correctSoFar: r.correct_so_far,
    pointsAwarded: r.points_awarded,
  };
}

// Returns the link to the results screen.
export async function finish(attemptId) {
  const r = await repo.finishQuiz(attemptId);
  return `result.html?quiz=${r.attempt_id}`;
}

export const progressText = (i, total) => `Question ${i + 1} of ${total}`;

// ---------------------------------------------------------------- results

const TIER_LABEL = Object.fromEntries(TIERS.map((t) => [t.id, t.label]));
const tierRank = (id) => TIERS.findIndex((t) => t.id === id);

function nextTierHint(tier) {
  if (tier === 'gold') return 'Perfect score. Gold is the top badge!';
  const next = TIERS[tierRank(tier) + 1];
  return next.id === 'gold' ? 'Score 100% to earn gold.' : `Score ${next.min}% or more to earn ${next.label.toLowerCase()}.`;
}

export async function getQuizResult(attemptId) {
  const r = await repo.getQuizResult(attemptId);
  const sport = r.sport;
  const tierLabel = r.tier ? TIER_LABEL[r.tier] : null;
  const pts = r.points_awarded;

  const lines = [];
  if (pts > 0) lines.push(`+${pts} pts for your correct answers!`);
  else lines.push('No new points this time. You already earned them on an earlier try.');
  if (r.passed) {
    lines.push(`You earned the ${r.badge_name} badge.`);
    if (r.best_tier && tierRank(r.best_tier) > tierRank(r.tier)) lines.push(`You still keep your ${TIER_LABEL[r.best_tier]} badge.`);
  } else {
    lines.push(`You need ${QUIZ_PASS_PCT}% to pass. Review the lessons below and try again.`);
  }

  return {
    title: r.passed ? 'Sport final passed!' : 'Almost there!',
    passed: r.passed,
    chip: `${sport.name} · Sport final`,
    tier: r.tier ?? 'locked',
    badgeLabel: tierLabel ? `${tierLabel} badge` : 'No badge yet',
    badgeName: r.badge_name,
    tiers: TIERS.map((t) => ({ ...t, you: t.id === r.tier })),
    hint: nextTierHint(r.tier),
    stats: [
      { big: `+${pts}`, small: 'Points', tone: 'points' },
      { big: `${r.score_pct}%`, small: 'Score', tone: 'score' },
      { big: `${r.correct}/${r.total}`, small: 'Correct', tone: 'hits' },
    ],
    lines,
    review: r.review.map((l) => ({
      eyebrow: `${sport.name} · Lesson ${l.lesson_no}`,
      title: l.title,
      href: lessonHref(sport.id, l.lesson_no),
    })),
    tryAgainHref: finalHref(sport.id),
    next: r.passed && r.next_sport.id !== sport.id
      ? { label: `Next: ${r.next_sport.name}`, href: lessonHref(r.next_sport.id) }
      : null,
  };
}
