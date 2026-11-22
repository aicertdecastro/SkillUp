// PRESENTATION LAYER · volleyball drawings for the challenge games (inline SVG).
// Same shapes as courtArt.js (basketball): pictures in a 100 x 80 (court from above) or
// 100 x 60 box; players, spots and pieces are HTML buttons placed on top from the database.
const LINE = 'stroke="#fff" stroke-width="0.8" fill="none"';
const NAVY = '#1b2a4a';
const OUTSIDE = '#5b8fe0';            // free zone around the court
const PANEL = '#1f64d6';               // blue panels on the ball

// A volleyball: white with curved blue panels. r in SVG units.
function ballSvg(x, y, r) {
  return `
    <g>
      <circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${NAVY}" stroke-width="${(r * 0.16).toFixed(2)}"/>
      <path d="M${x - r * 0.95} ${y - r * 0.2}Q${x} ${y - r * 0.15} ${x + r * 0.35} ${y - r * 0.93}" fill="none" stroke="${PANEL}" stroke-width="${(r * 0.18).toFixed(2)}"/>
      <path d="M${x + r * 0.2} ${y + r * 0.97}Q${x + r * 0.1} ${y} ${x + r * 0.95} ${y - r * 0.3}" fill="none" stroke="${PANEL}" stroke-width="${(r * 0.18).toFixed(2)}"/>
      <path d="M${x - r * 0.7} ${y + r * 0.7}Q${x - r * 0.2} ${y + r * 0.1} ${x - r * 0.95} ${y - r * 0.2}" fill="none" stroke="${NAVY}" stroke-width="${(r * 0.1).toFixed(2)}"/>
    </g>`;
}

// Court from above, net at the top, 3 x 2 zones (Positions: number the zones / place the players).
export function zonesCourt() {
  return `
    <svg class="court-svg" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="0" width="100" height="80" fill="var(--court, #f2a93b)"/>
      <rect x="3" y="11" width="94" height="67" ${LINE}/>
      <path d="M3 45h94" ${LINE}/>
      <path d="M34.3 11v67M65.7 11v67" stroke="#fff" stroke-width="0.5" stroke-dasharray="2 2" fill="none"/>
      <rect x="0" y="0" width="100" height="10" fill="${NAVY}"/>
      <path d="M0 3.3h100M0 6.6h100" stroke="#fff" stroke-width="0.25" opacity=".5"/>
      <text x="50" y="7" text-anchor="middle" font-size="5.5" font-weight="900" fill="#fff" font-family="Nunito, sans-serif" letter-spacing="1">NET</text>
    </svg>`;
}

// Close-up of the side line: court on the left, outside on the right, the ball touching the line (Rules: in or out?).
export function lineView() {
  return `
    <svg class="court-svg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="0" width="50" height="60" fill="var(--court, #f2a93b)"/>
      <rect x="50" y="0" width="50" height="60" fill="${OUTSIDE}"/>
      <rect x="47.5" y="0" width="4.5" height="60" fill="#fff"/>
      <text x="24" y="10" text-anchor="middle" font-size="3.3" font-weight="900" fill="${NAVY}" font-family="Nunito, sans-serif" letter-spacing=".3">INSIDE THE COURT</text>
      <text x="76" y="10" text-anchor="middle" font-size="3.3" font-weight="900" fill="#fff" font-family="Nunito, sans-serif" letter-spacing=".3">OUTSIDE</text>
      <ellipse cx="54" cy="46" rx="7.5" ry="1.8" fill="${NAVY}" opacity=".25"/>
      ${ballSvg(54, 38, 7.5)}
    </svg>`;
}

// Court from above with the net across the middle (Rules: which player made a fault?).
// A player with touch: "net" gets a red flash where they touch the net.
export function netView(players = []) {
  const toucher = players.find((p) => p.touch === 'net');
  const flash = toucher ? `
      <g stroke="#d93b3b" stroke-width="0.9" stroke-linecap="round">
        ${[[-5, -3], [5, -3], [-6, 1], [6, 1], [0, -5]].map(([dx, dy]) => `<path d="M${toucher.x + dx * 0.4} ${30 + dy * 0.4}l${dx * 0.6} ${dy * 0.6}"/>`).join('')}
      </g>
      <path d="M${toucher.x} ${toucher.y * 0.6}L${toucher.x} 31.5" stroke="${NAVY}" stroke-width="1" stroke-linecap="round"/>` : '';
  return `
    <svg class="court-svg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="0" width="100" height="60" fill="${OUTSIDE}"/>
      <rect x="5" y="3" width="90" height="54" fill="var(--court, #f2a93b)" ${LINE}/>
      <path d="M5 21h90M5 39h90" stroke="#fff" stroke-width="0.5" stroke-dasharray="2 2" fill="none"/>
      <rect x="0" y="28.6" width="100" height="2.8" fill="${NAVY}"/>
      <path d="M0 30h100" stroke="#fff" stroke-width="0.25" opacity=".6"/>
      <text x="3" y="27.4" font-size="3.2" font-weight="900" fill="${NAVY}" font-family="Nunito, sans-serif">NET</text>
      ${flash}
    </svg>`;
}

// Court from above, net down the middle; your team on the right (Choose play).
export function playCourt() {
  return `
    <svg class="court-svg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="0" width="100" height="60" fill="${OUTSIDE}"/>
      <rect x="8" y="5" width="84" height="50" fill="var(--court, #f2a93b)" ${LINE}/>
      <path d="M36 5v50M64 5v50" stroke="#fff" stroke-width="0.5" stroke-dasharray="2 2" fill="none"/>
      <rect x="49" y="1" width="2" height="58" fill="${NAVY}"/>
    </svg>`;
}

// ---------------------------------------------------------------- Timing: underhand serve

// Serve scene geometry (SVG units, viewBox 0 0 100 70). The ball waits on the holding hand.
export const SERVE = { netX: 62, netTop: 24, floorY: 58, endLineX: 94, ballR: 3.2 };
const BALL = { x: 28.5, y: 36.5 };
const SHOULDER = { x: 18, y: 28 };

// Where the ball starts (it is held still; the other arm swings to it).
export function handPos() {
  return { ...BALL };
}

// Underhand server. lift 0..1 = how far the hitting arm has swung (back → forward → up).
// At 0.5 the fist meets the ball. ball = {x, y} draws the ball in flight instead of on the hand.
export function server(lift = 0, ball = null) {
  const rad = ((200 + lift * 224) * Math.PI) / 180;
  const fx = SHOULDER.x + Math.cos(rad) * 13;
  const fy = SHOULDER.y - Math.sin(rad) * 13;
  const b = ball ?? BALL;
  return `
    <svg viewBox="0 0 100 70" aria-hidden="true">
      <rect x="0" y="${SERVE.floorY}" width="100" height="12" fill="var(--court, #f2a93b)"/>
      <path d="M${SERVE.endLineX} ${SERVE.floorY}v2.5" stroke="#fff" stroke-width="1.2"/>
      <path d="M${SERVE.netX} ${SERVE.floorY}V${SERVE.netTop}" stroke="${NAVY}" stroke-width="1"/>
      <rect x="${SERVE.netX - 1.2}" y="${SERVE.netTop}" width="2.4" height="13" fill="#fff" stroke="${NAVY}" stroke-width=".5"/>
      <path d="M${SERVE.netX - 1.2} ${SERVE.netTop + 4.3}h2.4M${SERVE.netX - 1.2} ${SERVE.netTop + 8.6}h2.4" stroke="${NAVY}" stroke-width=".3"/>
      <rect x="${SERVE.netX - 1.6}" y="${SERVE.netTop - 0.6}" width="3.2" height="1.4" fill="#fff" stroke="${NAVY}" stroke-width=".4"/>
      <circle cx="18" cy="18" r="5" fill="#fff" stroke="${NAVY}" stroke-width="1.4"/>
      <path d="M18 23v18M18 41l-5 17M18 41l6 17" fill="none" stroke="${NAVY}" stroke-width="2" stroke-linecap="round"/>
      <path d="M18 28L25.5 38.5" stroke="${NAVY}" stroke-width="2" stroke-linecap="round"/>
      ${ballSvg(b.x, b.y, SERVE.ballR)}
      <path d="M${SHOULDER.x} ${SHOULDER.y}L${fx.toFixed(1)} ${fy.toFixed(1)}" stroke="${NAVY}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="1.6" fill="${NAVY}"/>
    </svg>`;
}

// Flight paths after a serve: legs of { to, peak (arc height), d (share of the flight) }.
const FLOOR = SERVE.floorY - SERVE.ballR;
const SHOTS = {
  hit: [                                                   // over the net, lands in the far court
    { to: { x: 84, y: FLOOR }, peak: 34, d: 0.75 },
    { to: { x: 91, y: FLOOR }, peak: 4, d: 0.25 },
  ],
  early: [                                                 // too low: into the net, drops
    { to: { x: SERVE.netX - 1.2 - SERVE.ballR, y: 30 }, peak: 5, d: 0.45 },
    { to: { x: 55, y: FLOOR }, peak: 0, d: 0.3 },
    { to: { x: 51, y: FLOOR }, peak: 2.5, d: 0.25 },
  ],
  late: [                                                  // too high and long: lands past the end line (out)
    { to: { x: 97, y: FLOOR }, peak: 40, d: 0.8 },
    { to: { x: 104, y: FLOOR }, peak: 4, d: 0.2 },
  ],
};

const arc = (a, b, peak, u) => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u - 4 * peak * u * (1 - u),
});

// Ball position at time t (0..1) of the flight for a graded serve ('hit' | 'early' | 'late').
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
