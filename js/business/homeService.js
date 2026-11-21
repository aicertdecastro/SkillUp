// BUSINESS LAYER · turns get_home() data into what the dashboard and profile show.
import * as homeRepo from '../data/homeRepository.js';
import { SPORT_INFO, LESSON_MINUTES } from '../data/sportInfo.js';
import { USERNAME_RE } from './authService.js';

const STEP_LABEL = { learn: 'Learn', try: 'Try it', check: 'Quick check', play: 'Play' };
const STATUS_LABEL = { complete: 'Complete', up_next: 'Up next', in_progress: 'In progress', not_started: 'Not started' };
const TIER_LABEL = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const fmt = (n) => Number(n).toLocaleString('en-US');          // 1240 → "1,240"
const plural = (n, word) => `${fmt(n)} ${word}${n === 1 ? '' : 's'}`;

export function initials(name) {
  // first letters of the first two words: "Jamie Dela Cruz" → "JD", "Kai" → "KA"
  const parts = name.trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return letters.toUpperCase();
}

function lessonHref(sportId, lessonNo) {
  return `lesson.html?sport=${sportId}&lesson=${lessonNo}`;
}

function shapeContinue(c) {
  if (!c) return null;  // every lesson finished
  return {
    sportId: c.sport_id,
    short: `${c.sport_name}, Lesson ${c.lesson_no}`,
    title: `${c.sport_name} · Lesson ${c.lesson_no}: ${c.title}`,
    nextStep: `Next step: ${STEP_LABEL[c.step] ?? 'Learn'} · about ${LESSON_MINUTES[c.lesson_no - 1] ?? 8} minutes`,
    href: lessonHref(c.sport_id, c.lesson_no),
  };
}

function shapeHeader(home) {
  const name = home.profile.display_name;
  return {
    name,
    firstName: name.split(/\s+/)[0],
    username: home.profile.username,
    initials: initials(name),
    points: fmt(home.points),
    streak: plural(home.streak, 'day'),
    badges: plural(home.badges_earned, 'badge'),
    continue: shapeContinue(home.continue),
  };
}

export async function getDashboard() {
  const home = await homeRepo.getHome();
  return {
    ...shapeHeader(home),
    sports: home.sports.map((s) => {
      const next = s.lessons.find((l) => l.status !== 'complete');
      return {
        id: s.id,
        name: s.name,
        accent: s.accent_color,
        progressText: `${s.lessons_done} / ${s.lessons_total} lessons`,
        percent: Math.round((100 * s.lessons_done) / s.lessons_total),
        // sticker on the card: the lesson you're on, NEW! if not started, DONE! if finished
        tag: s.lessons_done === 0 && next?.status !== 'in_progress' ? 'NEW!'
           : next ? `LVL ${next.lesson_no}` : 'DONE!',
        nextLessonNo: next?.lesson_no ?? null,
        playHref: next ? lessonHref(s.id, next.lesson_no) : null,
        info: SPORT_INFO[s.id],
      };
    }),
  };
}

// Title under the name, e.g. "Rookie all-rounder".
// Rank comes from lessons finished; "all-rounder" once lessons are done in 2+ sports.
export function playerTitle(home) {
  const done = home.lessons_done;
  const rank = done >= 15 ? 'Legend' : done >= 10 ? 'Pro' : done >= 5 ? 'Rising star' : 'Rookie';
  const played = home.sports.filter((s) => s.lessons_done > 0);
  if (played.length >= 2) return `${rank} all-rounder`;
  if (played.length === 1) return `${rank} ${played[0].name.toLowerCase()} player`;
  return `${rank} player`;
}

const SHELF_SIZE = 6;

export async function getProfile() {
  const home = await homeRepo.getHome();
  return {
    ...shapeHeader(home),
    userId: home.profile.id,
    pointsNumber: fmt(home.points),
    streakNumber: plural(home.streak, 'day'),
    lessonsDone: fmt(home.lessons_done),
    badgesEarned: fmt(home.badges_earned),
    week: home.week.map((d, i) => ({ letter: DAY_LETTERS[i], active: d.active, today: d.is_today })),
    title: playerTitle(home),
    // The shelf shows 6 tiles: every earned badge first, then the next locked ones.
    badges: home.badges
      .filter((b, i) => b.earned || i < SHELF_SIZE)
      .map((b) => ({
      name: b.name,
      tier: b.earned ? b.tier : 'locked',
      label: b.earned ? `${TIER_LABEL[b.tier]} · ${b.best_score}%` : 'Locked',
    })),
    tracker: home.sports.map((s) => ({
      id: s.id,
      tabLabel: `${s.name} · ${s.lessons_done}/${s.lessons_total}`,
      lessons: s.lessons.map((l) => ({
        label: `${l.lesson_no}. ${l.title}`,
        status: l.status,
        statusLabel: STATUS_LABEL[l.status],
      })),
    })),
  };
}

export function validateProfile({ displayName, username }) {
  const errors = {};
  if (!displayName.trim()) errors.displayName = 'Enter your name.';
  else if (displayName.trim().length > 40) errors.displayName = 'Keep your name under 40 characters.';
  if (!USERNAME_RE.test(username.trim().toLowerCase())) errors.username = '3–20 characters: small letters, numbers or _.';
  return errors;
}

export async function updateProfile(userId, { displayName, username }) {
  await homeRepo.updateProfile(userId, {
    displayName: displayName.trim(),
    username: username.trim().toLowerCase(),
  });
}
