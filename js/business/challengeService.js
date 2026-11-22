// BUSINESS LAYER · challenge games (Positions, Rules, Timing, Choose play) and their results.
// The server decides right/wrong, points and badges; this file only shapes words and links.
import * as repo from '../data/challengeRepository.js';
import { SPORT_IDS, TIERS, PRACTICE_TEXT, PRACTICE_RESULT, PRACTICE_BADGE } from '../data/lessonUi.js';
import { CHALLENGES_READY, GAME_ORDER, GAME_NAME, LEVEL_NAME, HOW_TO_PLAY, RULE_REMINDERS, RESULT_STAT } from '../data/challengeUi.js';
import { lessonHref, finalHref } from './lessonService.js';
import { nextTierHint } from './quizService.js';

export const isChallengeReady = (sportId) => CHALLENGES_READY.includes(sportId);

// The one place challenge links are built (lesson footer, dashboard, results).
// No type / level → the server opens the next challenge to play.
export function challengeHref(sportId, type, level) {
  const p = new URLSearchParams({ sport: sportId });
  if (type) p.set('game', type);
  if (type && level) p.set('level', level);
  return `challenge.html?${p}`;
}

export const resultHref = (attemptId) => `result.html?level=${attemptId}`;

// ?sport=basketball&game=timing&level=2 → { sportId, type, level }; unknown values become null.
export function readChallengeParams(search) {
  const p = new URLSearchParams(search);
  const sportId = SPORT_IDS.includes(p.get('sport')) ? p.get('sport') : 'basketball';
  const type = GAME_ORDER.includes(p.get('game')) ? p.get('game') : null;
  const n = Number(p.get('level'));
  return { sportId, type, level: type && (n === 1 || n === 2) ? n : null };
}

export function readResultParam(search) {
  const id = Number(new URLSearchParams(search).get('level'));
  return Number.isInteger(id) && id > 0 ? id : null;
}

const fill = (text, s) => text.replace(/\{(\w+)\}/g, (_, k) => ({ tries: s.tries, need: s.hits_to_pass, seconds: s.seconds, button: s.button })[k] ?? '');

// "Finish Lesson 2 first" → friendlier text for the locked screen / toast.
function lockText(lock, lessonNo, lessonTitle) {
  if (!lock) return null;
  if (/^finish lesson/i.test(lock)) return `Finish Lesson ${lessonNo}: ${lessonTitle} to unlock this challenge.`;
  if (/level 1/i.test(lock)) return 'Pass Level 1 first to unlock Level 2.';
  return 'This challenge is coming soon!';
}

function levelLabel(type, level, settings) {
  const base = `Level ${level} · ${LEVEL_NAME[level]}`;
  return type === 'play' && settings?.seconds ? `${base} · ${settings.seconds} s` : base;
}

function shape(d) {
  const sport = d.sport;
  const c = d.current;
  const game = d.games.find((g) => g.type === c.type);
  const s = c.settings ?? {};

  return {
    sportId: sport.id,
    sportName: sport.name,
    ready: isChallengeReady(sport.id),
    pointsChip: `${d.points.toLocaleString('en-US')} pts`,
    href: challengeHref(sport.id, c.type, c.level),
    sports: SPORT_IDS.map((id) => ({ id, current: id === sport.id, href: challengeHref(id) })),
    games: d.games.map((g) => ({
      type: g.type,
      name: GAME_NAME[g.type],
      current: g.type === c.type,
      href: challengeHref(sport.id, g.type),
      locked: !!g.levels[0].lock,
      lockText: lockText(g.levels[0].lock, g.lesson_no, g.lesson_title),
      passed: g.levels.filter((l) => l.passed).length,
    })),
    levels: game.levels.map((l) => ({
      level: l.level,
      label: levelLabel(c.type, l.level, l.settings),
      current: l.level === c.level,
      href: challengeHref(sport.id, c.type, l.level),
      locked: !!l.lock,
      lockText: lockText(l.lock, game.lesson_no, game.lesson_title),
      passed: l.passed,
    })),
    level: {
      id: c.id,
      type: c.type,
      no: c.level,
      title: c.title,
      heading: c.content.heading ?? c.title,
      sub: c.content.sub ?? '',
      settings: s,
      content: c.content,
      points: c.points,
      passed: c.passed,
      practiceNote: c.passed ? PRACTICE_TEXT : null,               // level already passed: replay pays nothing
      locked: !!c.lock,
      lockText: lockText(c.lock, c.lesson_no, c.lesson_title),
      lessonHref: lessonHref(sport.id, c.lesson_no),
      lessonLabel: `Lesson ${c.lesson_no}: ${c.lesson_title}`,
      attempt: c.attempt ? { id: c.attempt.id, state: c.attempt.state ?? {} } : null,
    },
    howTo: (HOW_TO_PLAY[c.type] ?? []).map((t) => fill(t, { ...s, button: c.content.button ?? 'SHOOT!' })),
    reminders: RULE_REMINDERS[sport.id] ?? [],
    timingFacts: c.type === 'timing' ? [
      ['Marker speed', `${Number(s.sweep_s).toFixed(1)} s`],
      ['Green zone', `${s.zone_pct}% of the bar`],
      ['Hits to pass', `${s.hits_to_pass} of ${s.tries}`],
    ] : [],
    final: { unlocked: d.final_unlocked, href: finalHref(sport.id), label: `${sport.name} Sport Final` },
  };
}

export async function loadChallenge({ sportId, type, level }) {
  return shape(await repo.getChallenge(sportId, type, level));
}

// ---------------------------------------------------------------- playing

export const startTry = (levelId, restart = false) => repo.startChallenge(levelId, restart);

// "Level 1 passed! +20 pts" (or without points on a replay)
export function passText(levelNo, pointsAwarded) {
  return pointsAwarded > 0 ? `Level ${levelNo} passed! +${pointsAwarded} pts` : `Level ${levelNo} passed!`;
}

// One pick. Returns the server's answer plus the words to show.
export async function pick(attemptId, choice) {
  const r = await repo.move(attemptId, choice);
  return { ...r, resultHref: r.finished ? resultHref(r.attempt_id) : null };
}

export async function finishTiming(attemptId, hits, tries) {
  const r = await repo.finishTiming(attemptId, hits, tries);
  return { ...r, resultHref: resultHref(r.attempt_id) };
}

// Timing bar: the green zone sits in the middle of the bar.
export function timingZone(settings) {
  const half = Number(settings.zone_pct) / 200;
  return { start: 0.5 - half, end: 0.5 + half };
}

// Where the marker was (0..1) when SHOOT! was pressed. null = never pressed (too late).
export function gradeShot(pos, zone) {
  if (pos == null || pos > zone.end) return 'late';
  if (pos < zone.start) return 'early';
  return 'hit';
}

// ---------------------------------------------------------------- results

const TIER_LABEL = Object.fromEntries(TIERS.map((t) => [t.id, t.label]));
const tierRank = (id) => TIERS.findIndex((t) => t.id === id);

function thirdStat(r) {
  const x = r.result ?? {};
  const big = {
    positions: String(x.misses ?? 0),
    rules: String(x.tries ?? 1),
    timing: `${x.hits ?? 0}/${x.tries ?? r.settings.tries}`,
    play: x.late ? 'Late' : `${x.seconds ?? 0} s`,
  }[r.type];
  return { big, small: RESULT_STAT[r.type], tone: 'hits' };
}

function failLine(r) {
  const x = r.result ?? {};
  if (r.type === 'timing') return `You need ${r.settings.hits_to_pass} hits to pass. Try again!`;
  if (r.type === 'play') return x.late ? 'Time ran out. Pick your play a little faster!' : 'That wasn’t the best play. Read the situation and try again!';
  return 'Keep trying, you can do it!';
}

function nextStep(r) {
  const sport = r.sport.id;
  if (!r.passed) return null;
  if (r.level === 1) return { label: 'Next: Level 2', href: challengeHref(sport, r.type, 2) };
  const next = GAME_ORDER[GAME_ORDER.indexOf(r.type) + 1];
  if (next) return { label: `Next: ${GAME_NAME[next]}`, href: challengeHref(sport, next) };
  return r.final_unlocked ? { label: `${r.sport.name} Sport Final`, href: finalHref(sport) } : null;
}

export async function getChallengeResult(attemptId) {
  const r = await repo.getChallengeResult(attemptId);
  const sport = r.sport;
  const pts = r.points_awarded;
  const tierLabel = r.tier ? TIER_LABEL[r.tier] : null;

  const lines = [];
  if (r.practice) {
    lines.push(r.passed ? PRACTICE_RESULT : failLine(r));
    if (r.passed) lines.push(PRACTICE_BADGE);
  } else if (!r.passed) lines.push(failLine(r));
  else if (pts > 0) lines.push(`+${pts} pts for passing this level!`);
  else lines.push('No new points this time. You already earned them on an earlier try.');
  if (!r.practice && r.passed && r.tier) lines.push(`You earned the ${r.badge_name} badge.`);
  if (!r.practice && r.passed && !r.tier) lines.push(`Score ${TIERS[0].min}% or more to earn the ${r.badge_name} badge.`);
  if (!r.practice && r.best_tier && tierRank(r.best_tier) > tierRank(r.tier)) lines.push(`You still keep your ${TIER_LABEL[r.best_tier]} badge.`);

  return {
    title: r.passed ? `Level ${r.level} passed!` : 'Almost there!',
    passed: r.passed,
    practice: !!r.practice,
    chip: `${sport.name} · ${GAME_NAME[r.type]} · Level ${r.level}`,
    tier: r.tier ?? 'locked',
    badgeLabel: tierLabel ? (r.practice ? `Practice score · ${tierLabel}` : `${tierLabel} badge`) : 'No badge yet',
    badgeName: r.badge_name,
    tiers: TIERS.map((t) => ({ ...t, you: t.id === r.tier })),
    hint: nextTierHint(r.tier),
    stats: [
      { big: `+${pts}`, small: 'Points', tone: 'points' },
      { big: `${r.score_pct}%`, small: 'Score', tone: 'score' },
      thirdStat(r),
    ],
    lines,
    review: !r.passed || r.score_pct < 100 ? [{
      eyebrow: `${sport.name} · Lesson ${r.lesson.lesson_no}`,
      title: r.lesson.title,
      href: lessonHref(sport.id, r.lesson.lesson_no),
    }] : [],
    tryAgainHref: challengeHref(sport.id, r.type, r.level),
    next: nextStep(r),
  };
}
