// PRESENTATION LAYER · inline SVG icons (navy outlines, like the Figma screens).
const S = 'stroke="#1b2a4a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';

export const icons = {
  basketball: (fill = 'none') => `
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="${fill}" ${S}/>
      <path d="M50 6v88M6 50h88M20 18c14 12 14 52 0 64M80 18c-14 12-14 52 0 64" fill="none" ${S}/></svg>`,
  volleyball: (fill = '#fff') => `
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="${fill}" ${S}/>
      <path d="M50 50c4-18 18-32 36-34" fill="#2f6fe0" stroke="none"/>
      <path d="M50 50c-2-20 6-36 20-42M50 50c18 2 32 14 38 30M50 50C38 64 22 70 8 66" fill="none" ${S}/></svg>`,
  soccer: (fill = '#fff') => `
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="${fill}" ${S}/>
      <path d="M50 36l13 10-5 16H42l-5-16z" fill="#1b2a4a" ${S}/>
      <path d="M50 36V14M63 46l20-8M58 62l12 18M42 62L30 80M37 46l-20-8" fill="none" ${S}/></svg>`,
  trophy: () => `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M30 12h40v26c0 14-9 24-20 24S30 52 30 38z" fill="#ffc93c" ${S}/>
      <path d="M30 20H14c0 16 8 22 18 22M70 20h16c0 16-8 22-18 22M50 62v14M34 88h32l-4-12H38z" fill="none" ${S}/></svg>`,
  coin: () => `
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="#ffc93c" ${S}/>
      <path d="M50 30l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#fff0c2" stroke="#d49b00" stroke-width="4" stroke-linejoin="round"/></svg>`,
  flame: (on = true) => on ? `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 8c4 18 24 26 24 50a24 24 0 0 1-48 0c0-12 6-20 12-26 0 10 4 14 8 16C44 34 42 20 50 8z" fill="#ff7a1a" ${S}/>
      <path d="M50 60c6 6 10 10 10 18a10 10 0 0 1-20 0c0-8 4-12 10-18z" fill="#ffc93c" stroke="none"/></svg>` : `
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="56" r="30" fill="none" stroke="#9aa1b0" stroke-width="5" stroke-dasharray="7 9"/></svg>`,
  shield: (tier = 'locked') => {
    const fills = { bronze: '#e08a4a', silver: '#c9d2e3', gold: '#ffc93c', locked: '#e9ebf0' };
    return `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 8l34 12v26c0 22-14 38-34 46C30 84 16 68 16 46V20z" fill="${fills[tier]}" ${S}/>
      <path d="M50 30l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#fff" ${S} stroke-width="4"/></svg>`;
  },
  check: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="#34c46a" ${S}/><path d="M32 52l12 12 24-26" fill="none" ${S}/></svg>`,
  play: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="#ffc93c" ${S}/><path d="M42 34l22 16-22 16z" fill="#1b2a4a" ${S} stroke-width="3"/></svg>`,
  empty: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="#fff" ${S}/></svg>`,
  left: () => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  right: () => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  triangle: () => `<svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14"><path d="M6 4l14 8-14 8z" fill="#1b2a4a"/></svg>`,
};

export const sportIcon = (id, fill) => icons[id] ? icons[id](fill) : '';

// Pictures on the lesson key-point cards (lesson_cards.icon in the database).
const O = '#ff7a1a', B = '#2f6fe0', Y = '#ffc93c', G = '#36c26b';
const cardArt = {
  ball: () => `<circle cx="50" cy="50" r="30" fill="${O}" ${S}/><path d="M50 20v60M20 50h60" fill="none" ${S}/>`,
  hand: () => `<circle cx="50" cy="68" r="18" fill="${O}" ${S}/><path d="M30 40V20M40 36V12M50 36V14M60 40V20M28 44c0-6 44-6 44 0" fill="none" ${S}/>`,
  pass: () => `<circle cx="26" cy="30" r="9" fill="${B}" ${S}/><circle cx="74" cy="30" r="9" fill="${B}" ${S}/>
    <path d="M14 56c0-10 24-10 24 0M62 56c0-10 24-10 24 0" fill="none" ${S}/><circle cx="30" cy="76" r="8" fill="${O}" ${S}/><path d="M40 76h36m-8-8 8 8-8 8" fill="none" ${S}/>`,
  target: () => `<circle cx="50" cy="50" r="36" fill="${O}" ${S}/><circle cx="50" cy="50" r="23" fill="#fff" ${S}/><circle cx="50" cy="50" r="10" fill="${O}" ${S}/>`,
  team: () => `<circle cx="32" cy="36" r="11" fill="${B}" ${S}/><circle cx="68" cy="36" r="11" fill="${O}" ${S}/>
    <path d="M14 76c0-16 36-16 36 0M50 76c0-16 36-16 36 0" fill="none" ${S}/>`,
  hoop: () => `<path d="M24 14h52v30H24z" fill="#fff" ${S}/><path d="M38 34h24v10H38z" fill="none" ${S}/><path d="M32 50h36l-6 30H38z" fill="${O}" ${S}/><path d="M42 50l4 30M58 50l-4 30" fill="none" ${S}/>`,
  court: () => `<rect x="12" y="22" width="76" height="56" rx="6" fill="${G}" ${S}/><path d="M50 22v56" fill="none" ${S}/><circle cx="50" cy="50" r="11" fill="none" ${S}/>`,
  timer: () => `<circle cx="50" cy="56" r="32" fill="${Y}" ${S}/><path d="M50 56V38M50 56l12 8M42 14h16M50 14v10" fill="none" ${S}/>`,
  whistle: () => `<path d="M18 46h44a18 18 0 1 1-18 18H18z" fill="${Y}" ${S}/><circle cx="62" cy="64" r="6" fill="#fff" ${S}/><path d="M26 46V34h18v12M70 30l10-8M76 42l10-2" fill="none" ${S}/>`,
  brain: () => `<path d="M50 18c-18 0-30 12-30 28 0 10 6 16 10 20v14h40V66c4-4 10-10 10-20 0-16-12-28-30-28z" fill="${Y}" ${S}/><path d="M42 80h16M44 48l6 6 10-12" fill="none" ${S}/>`,
  star: () => `<path d="M50 12l11 23 25 3-18 17 5 25-23-12-23 12 5-25-18-17 25-3z" fill="${Y}" ${S}/>`,
  goal: () => `<path d="M14 80V26h72v54" fill="#fff" ${S}/><path d="M14 40h72M14 54h72M14 68h72M32 26v54M50 26v54M68 26v54" fill="none" stroke="#1b2a4a" stroke-width="2"/><circle cx="50" cy="74" r="9" fill="${O}" ${S}/>`,
  // Basketball lessons 1-5 (Figma)
  players: () => `<circle cx="28" cy="34" r="10" fill="${B}" ${S}/><circle cx="72" cy="34" r="10" fill="${O}" ${S}/>
    <path d="M12 70c0-14 32-14 32 0M56 70c0-14 32-14 32 0" fill="none" ${S}/>
    <rect x="34" y="76" width="32" height="16" rx="4" fill="#fff" ${S} stroke-width="3"/>
    <text x="50" y="88" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="11" fill="#1b2a4a">5 v 5</text>`,
  score: () => `<rect x="10" y="26" width="80" height="48" rx="10" fill="${Y}" ${S}/>
    <text x="50" y="60" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="22" fill="#1b2a4a">1·2·3</text>`,
  gear: () => `<circle cx="34" cy="38" r="20" fill="${O}" ${S}/><path d="M14 38h40M34 18v40" fill="none" ${S} stroke-width="3"/>
    <path d="M48 70c10 0 14-8 22-8h10c4 0 8 4 8 10v8H48z" fill="${B}" ${S}/>`,
  steps: () => `<path d="M16 80l14-12M38 62l14-12M60 44l14-12" fill="none" ${S}/>
    <circle cx="22" cy="74" r="6" fill="${O}" ${S} stroke-width="3"/><circle cx="44" cy="56" r="6" fill="${O}" ${S} stroke-width="3"/>
    <circle cx="66" cy="38" r="6" fill="${O}" ${S} stroke-width="3"/><circle cx="84" cy="22" r="7" fill="${O}" ${S} stroke-width="3"/>`,
  dribble2: () => `<circle cx="50" cy="66" r="16" fill="${O}" ${S}/><path d="M18 40V24M26 38V18M34 40V24M66 40V24M74 38V18M82 40V24" fill="none" ${S}/>
    <path d="M42 18l16 16M58 18L42 34" fill="none" stroke="#d93b3b" stroke-width="6" stroke-linecap="round"/>`,
  foul: () => `<path d="M30 86V48M30 48V22M42 48V14M54 48V18M66 50V28M30 86h36l8-26c2-8-6-12-10-6l-6 12" fill="${Y}" ${S}/>`,
  out: () => `<rect x="12" y="20" width="44" height="60" fill="${G}" ${S}/><path d="M56 12v76" fill="none" stroke="#fff" stroke-width="6"/>
    <path d="M56 12v76" fill="none" ${S} stroke-dasharray="2 10"/><circle cx="74" cy="50" r="12" fill="${O}" ${S}/>`,
  open: () => `<circle cx="50" cy="30" r="12" fill="${B}" ${S}/><path d="M28 80c0-24 44-24 44 0" fill="${B}" ${S}/>
    <path d="M14 20l10 10M86 20L76 30" fill="none" stroke="${G}" stroke-width="6" stroke-linecap="round"/>`,
  run: () => `<circle cx="58" cy="20" r="10" fill="${O}" ${S}/><path d="M54 32L44 56l16 10-6 22M44 56l-16 8M50 40l18 8M14 40h14M10 54h12" fill="none" ${S}/>`,
  shoot: () => `<path d="M58 16h30v20H58z" fill="#fff" ${S}/><path d="M64 36h18l-4 16H68z" fill="none" ${S}/>
    <circle cx="26" cy="72" r="14" fill="${O}" ${S}/><path d="M38 60c8-14 16-20 24-22" fill="none" ${S} stroke-dasharray="4 8"/>`,
  shield: () => `<path d="M50 10l34 12v26c0 20-14 34-34 42C30 82 16 68 16 48V22z" fill="${B}" ${S}/><path d="M34 50l12 12 22-24" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
};

// "badge:PG" → letters in a blue circle; "badge:PF|C" → two circles (blue, then orange).
function letterBadges(text) {
  const parts = text.split('|');
  const r = parts.length > 1 ? 24 : 34;
  const xs = parts.length > 1 ? [28, 72] : [50];
  return parts.map((t, i) => `
    <circle cx="${xs[i]}" cy="50" r="${r}" fill="${i ? O : B}" ${S}/>
    <text x="${xs[i]}" y="${50 + r * 0.32}" text-anchor="middle" font-family="Arial Black, sans-serif"
          font-size="${r * 0.85}" fill="#fff" stroke="#1b2a4a" stroke-width="1.5">${t.replace(/[<>&"]/g, '')}</text>`).join('');
}

export function cardIcon(key = '') {
  const art = key.startsWith('badge:') ? letterBadges(key.slice(6)) : (cardArt[key] ?? cardArt.ball)();
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${art}</svg>`;
}

export const uiIcons = {
  lock: () => `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="#fff" stroke="#1b2a4a" stroke-width="2.4"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#1b2a4a" stroke-width="2.4"/></svg>`,
  sound: (on = true) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#1b2a4a"/>${on
    ? '<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="#1b2a4a" stroke-width="2.2" stroke-linecap="round"/>'
    : '<path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="#1b2a4a" stroke-width="2.2" stroke-linecap="round"/>'}</svg>`,
  tick: () => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  smile: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="${G}" ${S}/><path d="M24 34c8-12 44-12 52 0" fill="#1b2a4a" ${S}/><circle cx="38" cy="50" r="4" fill="#1b2a4a"/><circle cx="62" cy="50" r="4" fill="#1b2a4a"/><path d="M36 64c8 8 20 8 28 0" fill="none" ${S}/></svg>`,
};
