// PRESENTATION LAYER · soccer drawings for the challenge games (inline SVG).
// Same shapes as courtArt.js / volleyArt.js: pictures in a 100 x 80 (pitch, goal at the top) or
// 100 x 60 box; players, spots and pieces are HTML buttons placed on top from the database.
const LINE = 'stroke="#fff" stroke-width="0.7" fill="none"';
const NAVY = '#1b2a4a';
const GRASS = ['#3fae5e', '#4bbb6a'];          // mowing stripes
const FONT = 'font-family="Nunito, sans-serif" font-weight="900"';

// A soccer ball: white with a black centre patch. r in SVG units.
function ballSvg(x, y, r) {
  const p = Array.from({ length: 5 }, (_, i) => {
    const a = (-90 + i * 72) * Math.PI / 180;
    return `${(x + Math.cos(a) * r * 0.42).toFixed(2)},${(y + Math.sin(a) * r * 0.42).toFixed(2)}`;
  }).join(' ');
  return `
    <g>
      <circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${NAVY}" stroke-width="${(r * 0.16).toFixed(2)}"/>
      <polygon points="${p}" fill="${NAVY}"/>
    </g>`;
}

// Pitch seen from above, their goal at the top, your goal at the bottom, 4 bands
// (Positions: find each player's area / line up 2-3-1). bands = labels from the top down.
const BANDS = [7, 25, 45, 63, 74];             // band edges (y)
export function bandsPitch(bands = ['Attack', 'Middle', 'Defense', 'Goal area']) {
  const stripes = Array.from({ length: 8 }, (_, i) =>
    `<rect x="0" y="${i * 10}" width="100" height="10" fill="${GRASS[i % 2]}"/>`).join('');
  const labels = bands.map((b, i) =>
    `<text x="4" y="${BANDS[i] + 4}" font-size="3" ${FONT} fill="#fff" opacity=".9" letter-spacing=".3">${b.replace(/[<&]/g, '')}</text>`).join('');
  const edges = BANDS.slice(1, -1).map((y) => `<path d="M2 ${y}h96" stroke="#fff" stroke-width="0.5" stroke-dasharray="2 1.5"/>`).join('');
  return `
    <svg class="court-svg" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true">
      ${stripes}
      <rect x="2" y="7" width="96" height="67" ${LINE}/>
      <rect x="30" y="63" width="40" height="11" ${LINE}/>
      ${edges}
      ${labels}
      <rect x="40" y="3.5" width="20" height="3.5" fill="#fff" opacity=".85"/>
      <text x="50" y="2.9" text-anchor="middle" font-size="2.6" ${FONT} fill="#fff" letter-spacing=".4">THEIR GOAL</text>
      <rect x="40" y="74" width="20" height="3.2" fill="#fff" opacity=".85"/>
      <text x="50" y="79.6" text-anchor="middle" font-size="2.6" ${FONT} fill="#fff" letter-spacing=".4">YOUR GOAL</text>
    </svg>`;
}

// Pitch seen from above, blue attacks the goal on the right (Rules and Choose play).
export function pitch() {
  const stripes = Array.from({ length: 10 }, (_, i) =>
    `<rect x="${i * 10}" y="0" width="10" height="60" fill="${GRASS[i % 2]}"/>`).join('');
  return `
    <svg class="court-svg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
      ${stripes}
      <rect x="3" y="3" width="94" height="54" ${LINE}/>
      <path d="M50 3v54" ${LINE}/>
      <circle cx="50" cy="30" r="7" ${LINE}/>
      <rect x="80" y="14" width="17" height="32" ${LINE}/>
      <rect x="91" y="22" width="6" height="16" ${LINE}/>
      <rect x="3" y="14" width="17" height="32" ${LINE}/>
      <rect x="3" y="22" width="6" height="16" ${LINE}/>
      <rect x="97" y="25" width="2.6" height="10" fill="#fff" stroke="${NAVY}" stroke-width=".3"/>
      <path d="M97 27.5h2.6M97 30h2.6M97 32.5h2.6" stroke="${NAVY}" stroke-width=".2"/>
    </svg>`;
}

// ---------------------------------------------------------------- Timing: shot on goal

// Kick scene geometry (SVG units, viewBox 0 0 100 70). The ball rolls in from the left and
// meets the foot when lift = 0.5 (the middle of the green zone).
export const KICK = { floorY: 58, ballR: 3.2, postX: 86, backX: 96, barY: 30 };
const GROUND = KICK.floorY - KICK.ballR;
const HIP = { x: 30, y: 40 };
const LEG = 17;
const CONTACT_X = 35.5;                         // ball centre when the foot meets it

// Where the rolling ball is at this point of the bar.
export function handPos(lift = 0) {
  return { x: CONTACT_X + (lift - 0.5) * 50, y: GROUND };
}

// Kicker with the goal on the right. lift 0..1 = how far the kicking leg has swung
// (back → through the ball → up). ball = {x, y} draws the ball in flight instead of rolling.
export function kicker(lift = 0, ball = null) {
  const th = ((-45 + lift * 110) * Math.PI) / 180;
  const fx = HIP.x + Math.sin(th) * LEG;
  const fy = HIP.y + Math.cos(th) * LEG;
  const b = ball ?? handPos(lift);
  const net = [34, 38, 42, 46, 50, 54].map((y) => `M${KICK.postX} ${y}H${KICK.backX}`).join('')
    + [89, 92, 95].map((x) => `M${x} ${KICK.barY}V${KICK.floorY}`).join('');
  return `
    <svg viewBox="0 0 100 70" aria-hidden="true">
      <rect x="0" y="${KICK.floorY}" width="100" height="12" fill="var(--court, #3fae5e)"/>
      ${ballSvg(b.x, b.y, KICK.ballR)}
      <path d="${net}" stroke="${NAVY}" stroke-width=".25" opacity=".55" fill="none"/>
      <path d="M${KICK.postX} ${KICK.floorY}V${KICK.barY}H${KICK.backX}V${KICK.floorY}" fill="none" stroke="#fff" stroke-width="1.4"/>
      <path d="M${KICK.postX} ${KICK.floorY}V${KICK.barY}H${KICK.backX}V${KICK.floorY}" fill="none" stroke="${NAVY}" stroke-width=".4"/>
      <circle cx="30" cy="18" r="5" fill="#fff" stroke="${NAVY}" stroke-width="1.4"/>
      <path d="M30 23v17M30 28l-7 8M30 28l7 6M30 40l-3 18" fill="none" stroke="${NAVY}" stroke-width="2" stroke-linecap="round"/>
      <path d="M${HIP.x} ${HIP.y}L${fx.toFixed(1)} ${fy.toFixed(1)}" stroke="${NAVY}" stroke-width="2" stroke-linecap="round"/>
      <path d="M${fx.toFixed(1)} ${fy.toFixed(1)}l2.6 0" stroke="${NAVY}" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`;
}

// Flight paths after a kick: legs of { to, peak (arc height), d (share of the flight) }.
const SHOTS = {
  hit: [                                                   // into the net under the crossbar
    { to: { x: 92, y: 44 }, peak: 10, d: 0.7 },
    { to: { x: 93, y: GROUND }, peak: 0, d: 0.3 },
  ],
  early: [                                                 // leaning back: over the bar
    { to: { x: 106, y: 20 }, peak: 16, d: 1 },
  ],
  late: [                                                  // no kick: the ball rolls past the foot
    { to: { x: 72, y: GROUND }, peak: 0, d: 0.7 },
    { to: { x: 78, y: GROUND }, peak: 0, d: 0.3 },
  ],
};

const arc = (a, b, peak, u) => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u - 4 * peak * u * (1 - u),
});

// Ball position at time t (0..1) of the flight for a graded kick ('hit' | 'early' | 'late').
export function ballAt(grade, from, t) {
  const legs = SHOTS[grade] ?? SHOTS.late;
  let start = from;
  let left = Math.min(Math.max(t, 0), 1);
  for (const leg of legs) {
    if (left <= leg.d) return arc(start, leg.to, leg.peak, left / leg.d);
    left -= leg.d;
    start = leg.to;
  }
  return { ...start };
}
