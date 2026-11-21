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
