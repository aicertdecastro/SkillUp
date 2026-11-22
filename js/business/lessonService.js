// BUSINESS LAYER · turns get_lesson() data into what the lesson page shows.
import * as repo from '../data/lessonRepository.js';
import { LESSON_MINUTES } from '../data/sportInfo.js';
import { SPORT_IDS, STEPS, WAYS_TO_EARN, ACTIVITY_LABEL, ACTIVITY_LABEL_BY_SPORT, COACH_TIPS } from '../data/lessonUi.js';
import { challengeHref, isChallengeReady } from './challengeService.js';

const STATUS_LABEL = { complete: 'Done', up_next: 'Up next', in_progress: 'In progress', not_started: 'Not started' };

// The one place lesson links are built (dashboard, profile, results all use it).
// No lesson number → the server opens the lesson to continue in that sport.
export function lessonHref(sportId, lessonNo) {
  if (!sportId) return 'lesson.html';
  return lessonNo ? `lesson.html?sport=${sportId}&lesson=${lessonNo}` : `lesson.html?sport=${sportId}`;
}

export const finalHref = (sportId) => `final.html?sport=${sportId}`;

// ?sport=basketball&lesson=4 → { sportId, lessonNo }. Anything unknown becomes null,
// and the server then picks the lesson to continue.
export function readLessonParams(search) {
  const p = new URLSearchParams(search);
  const sportId = SPORT_IDS.includes(p.get('sport')) ? p.get('sport') : null;
  const n = Number(p.get('lesson'));
  const lessonNo = sportId && Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
  return { sportId, lessonNo };
}

function videoLength(seconds) {
  if (!seconds) return 'add yours';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const pct = (part, whole) => (whole ? Math.round((100 * part) / whole) : 0);

function activity(l, sportId) {
  const type = l.challenge_type ?? 'none';
  return ACTIVITY_LABEL_BY_SPORT[sportId]?.[type] ?? ACTIVITY_LABEL[type] ?? l.challenge_title ?? '';
}

// The big footer button. A lesson with a challenge sends you to it;
// a lesson without one (Lesson 1) moves on to the next lesson, or the Sport Final after the last.
function footer(d) {
  const lesson = d.lesson;
  const me = d.lessons.find((l) => l.lesson_no === lesson.lesson_no);
  if (lesson.challenge_type) {
    const ready = isChallengeReady(d.sport.id);
    return {
      kind: 'challenge',
      label: `Play the challenge: ${activity(me, d.sport.id)}`,
      href: ready ? challengeHref(d.sport.id, lesson.challenge_type) : null,
    };
  }
  const next = d.lessons.find((l) => l.lesson_no === lesson.lesson_no + 1);
  return next
    ? { kind: 'next', label: `Next lesson: ${next.title}`, href: lessonHref(d.sport.id, next.lesson_no) }
    : { kind: 'next', label: `${d.sport.name} Sport Final`, href: finalHref(d.sport.id) };
}

function shape(d) {
  const sport = d.sport;
  const lesson = d.lesson;
  const done = d.progress.cards_done ?? [];
  const totalMinutes = LESSON_MINUTES.slice(0, d.lessons_total).reduce((a, b) => a + b, 0);

  return {
    sportId: sport.id,
    sportName: sport.name,
    lessonId: lesson.id,
    lessonNo: lesson.lesson_no,
    title: lesson.title,
    goal: lesson.goal,
    eyebrow: `${sport.name} · Lesson ${lesson.lesson_no} of ${d.lessons_total}`,
    href: lessonHref(sport.id, lesson.lesson_no),
    completed: d.progress.completed,
    back: lesson.lesson_no > 1 ? lessonHref(sport.id, lesson.lesson_no - 1) : 'dashboard.html',
    footer: footer(d),
    steps: STEPS.map((s, i) => ({ ...s, n: i + 1, current: s.id === 'learn' })),
    video: {
      url: lesson.video_url,
      captions: lesson.captions_url,
      badge: `Video lesson ${lesson.lesson_no}`,
      length: `Video length: ${videoLength(lesson.video_seconds)}`,
    },
    cards: d.cards.map((c) => ({
      no: c.card_no, label: c.label, heading: c.heading, body: c.body, icon: c.icon,
      done: done.includes(c.card_no),
    })),
    sidebar: {
      heading: `${sport.name} lessons`,
      sub: `${d.lessons_total} short lessons · about ${totalMinutes} minutes`,
      lessons: d.lessons.map((l) => ({
        no: l.lesson_no,
        title: l.title,
        status: l.status,
        current: l.lesson_no === lesson.lesson_no,
        sub: `${STATUS_LABEL[l.status]} · ${activity(l, sport.id)}`,
        href: lessonHref(sport.id, l.lesson_no),
      })),
      final: { label: `${sport.name} Sport Final`, unlocked: d.final_unlocked, href: finalHref(sport.id) },
      lessonsText: `${d.lessons_done} / ${d.lessons_total}`,
      lessonsPct: pct(d.lessons_done, d.lessons_total),
      levelsText: `${d.levels_passed} / ${d.levels_total}`,
      levelsPct: pct(d.levels_passed, d.levels_total),
      earn: WAYS_TO_EARN,
      coach: COACH_TIPS.learn,
    },
    pointsChip: `+${d.points_this_lesson} this lesson`,
    otherSports: SPORT_IDS.map((id) => ({ id, current: id === sport.id, href: lessonHref(id) })),
  };
}

export async function loadLesson({ sportId, lessonNo }) {
  return shape(await repo.getLesson(sportId, lessonNo));
}

export const cardsCounter = (cards) => `${cards.filter((c) => c.done).length} / ${cards.length}`;
export const allCardsDone = (cards) => cards.every((c) => c.done);

// Returns the ticked card numbers from the server (the source of truth).
export async function tickCard(lessonId, cardNo) {
  return repo.tickCard(lessonId, cardNo);
}

// Footer button: finish the lesson. The server refuses unless every card is ticked,
// and pays +10 only the first time.
export async function finishLesson(lessonId) {
  const r = await repo.completeLesson(lessonId);
  return { pointsAwarded: r.points_awarded };
}
