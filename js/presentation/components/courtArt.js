// PRESENTATION LAYER · basketball court drawings for the challenge games (inline SVG).
// Pictures are drawn in a 100 x 60 (side view) or 100 x 80 (half court) box; players and
// spots are HTML buttons placed on top with left/top percentages from the database.
const LINE = 'stroke="#fff" stroke-width="0.8" fill="none"';
const NAVY = '#1b2a4a';

// Half court, hoop at the top. flipped = hoop at the bottom (Positions Level 2).
export function halfCourt({ flipped = false } = {}) {
  return `
    <svg class="court-svg" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="0" width="100" height="80" rx="2" fill="var(--court, #f59a4a)"/>
      <g ${flipped ? 'transform="rotate(180 50 40)"' : ''}>
        <rect x="38" y="0" width="24" height="26" fill="rgba(255,255,255,.18)" ${LINE}/>
        <circle cx="50" cy="26" r="8" ${LINE}/>
        <path d="M6 0V16A45 45 0 0 0 94 16V0" ${LINE}/>
        <path d="M0 80h100" ${LINE}/>
        <path d="M40 80a10 10 0 0 1 20 0" ${LINE}/>
        <path d="M43 3h14" stroke="${NAVY}" stroke-width="1.2"/>
        <circle cx="50" cy="6" r="2.4" fill="none" stroke="${NAVY}" stroke-width="0.9"/>
      </g>
    </svg>`;
}

// Side-on view with the hoop on the right (Rules and Choose play pictures).
export function sideCourt() {
  return `
    <svg class="court-svg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="0" width="100" height="60" rx="2" fill="var(--court, #f59a4a)"/>
      <rect x="78" y="20" width="22" height="20" fill="rgba(255,255,255,.18)" ${LINE}/>
      <circle cx="78" cy="30" r="6" ${LINE}/>
      <path d="M100 4H90A26 26 0 0 0 90 56H100" ${LINE}/>
      <path d="M0 0v60" ${LINE}/>
      <path d="M97 24v12" stroke="${NAVY}" stroke-width="1.2"/>
      <circle cx="94" cy="30" r="2" fill="none" stroke="${NAVY}" stroke-width="0.8"/>
    </svg>`;
}

// Footprints trail (Rules: traveling). Points are [x, y] in percent of the picture.
export function footprints(points = []) {
  return `
    <svg class="court-svg court-svg--over" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
      ${points.map(([x, y], i) => `<ellipse cx="${x}" cy="${y * 0.6}" rx="1.1" ry="0.8" fill="${NAVY}" opacity=".75"
          transform="rotate(${i % 2 ? 12 : -12} ${x} ${y * 0.6})"/>`).join('')}
    </svg>`;
}

// A short arm line from one player to another (Rules: foul).
export function touchLine(from, to) {
  return `
    <svg class="court-svg court-svg--over" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
      <path d="M${from.x} ${from.y * 0.6}L${(from.x + to.x) / 2 + 1} ${((from.y + to.y) / 2) * 0.6}" stroke="${NAVY}" stroke-width="1" stroke-linecap="round"/>
    </svg>`;
}

// Free-throw scene geometry (SVG units, viewBox 0 0 100 70).
export const COURT = { rim: { x: 85, y: 24 }, boardX: 84, floorY: 58, ballR: 3.2 };

// Centre of the ball while it is held. lift 0..1 = how far the arm has risen.
export function handPos(lift = 0) {
  const rad = ((-50 + lift * 175) * Math.PI) / 180;   // arm swings from down/forward to straight up
  return { x: 30 + Math.cos(rad) * 12, y: 28 - Math.sin(rad) * 12 - COURT.ballR };  // shoulder at (30, 28)
}

const ballSvg = (b) =>
  `<circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="${COURT.ballR}" fill="#ff7a1a" stroke="${NAVY}" stroke-width="1"/>`;

// Free-throw shooter for the Timing bar. ball = {x, y} draws the ball in flight
// (behind the rim and net, so it passes through the ring); null = ball in hand.
export function shooter(lift = 0, ball = null) {
  const h = handPos(lift);
  const hy = h.y + COURT.ballR;
  return `
    <svg viewBox="0 0 100 70" aria-hidden="true">
      <rect x="0" y="58" width="100" height="12" fill="var(--court, #f59a4a)"/>
      <path d="M84 10h12v14H84z" fill="#fff" stroke="${NAVY}" stroke-width="1.2"/>
      ${ball ? ballSvg(ball) : ''}
      <path d="M80 24h10" stroke="#ff7a1a" stroke-width="1.6"/>
      <path d="M81 24l2 7h4l2-7" fill="none" stroke="${NAVY}" stroke-width=".7"/>
      <circle cx="30" cy="18" r="5" fill="#fff" stroke="${NAVY}" stroke-width="1.4"/>
      <path d="M30 23v18M30 41l-6 17M30 41l6 17" fill="none" stroke="${NAVY}" stroke-width="2" stroke-linecap="round"/>
      <path d="M30 28L${h.x.toFixed(1)} ${hy.toFixed(1)}" stroke="${NAVY}" stroke-width="2" stroke-linecap="round"/>
      ${ball ? '' : ballSvg(h)}
    </svg>`;
}

// Flight paths after a shot: legs of { to, peak (arc height), d (share of the flight) }.
const FLOOR = COURT.floorY - COURT.ballR;
const SHOTS = {
  hit: [                                                   // swish through the ring, drop, small bounce
    { to: { x: COURT.rim.x, y: 20 }, peak: 14, d: 0.5 },
    { to: { x: COURT.rim.x, y: 36 }, peak: 0, d: 0.13 },
    { to: { x: COURT.rim.x, y: FLOOR }, peak: 0, d: 0.15 },
    { to: { x: 78, y: FLOOR }, peak: 5, d: 0.22 },
  ],
  early: [                                                 // falls short, bounces on the floor
    { to: { x: 62, y: FLOOR }, peak: 20, d: 0.6 },
    { to: { x: 70, y: FLOOR }, peak: 7, d: 0.25 },
    { to: { x: 74, y: FLOOR }, peak: 2.5, d: 0.15 },
  ],
  late: [                                                  // too long: off the backboard and down
    { to: { x: COURT.boardX - COURT.ballR, y: 12 }, peak: 10, d: 0.45 },
    { to: { x: 66, y: FLOOR }, peak: 4, d: 0.35 },
    { to: { x: 60, y: FLOOR }, peak: 4, d: 0.2 },
  ],
};

// Straight line from a to b, lifted by a parabola of height `peak`; u 0..1.
const arc = (a, b, peak, u) => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u - 4 * peak * u * (1 - u),
});

// Ball position at time t (0..1) of the flight for a graded shot ('hit' | 'early' | 'late').
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
