// PRESENTATION LAYER · picks the drawings for each sport's challenge games.
// Every sport gives the same four pieces, so the games stay sport-neutral:
//   positions(content) / rules(content) / play(content) -> SVG markup under the buttons
//   timing: { figure(lift, ball), handPos(lift), ballAt(grade, from, t) }
import * as bb from './courtArt.js';
import * as vb from './volleyArt.js';

const ART = {
  basketball: {
    positions: (c) => bb.halfCourt({ flipped: c.flipped }),
    rules(c) {
      const byNo = Object.fromEntries(c.players.map((p) => [p.no, p]));
      const toucher = c.players.find((p) => p.touch && byNo[p.touch]);
      return bb.sideCourt()
        + (c.footprints ? bb.footprints(c.footprints) : '')
        + (toucher ? bb.touchLine(toucher, byNo[toucher.touch]) : '');
    },
    play: () => bb.sideCourt(),
    timing: { figure: bb.shooter, handPos: bb.handPos, ballAt: bb.ballAt },
  },
  volleyball: {
    positions: () => vb.zonesCourt(),
    rules: (c) => (c.view === 'line' ? vb.lineView() : vb.netView(c.players)),
    play: () => vb.playCourt(),
    timing: { figure: vb.server, handPos: vb.handPos, ballAt: vb.ballAt },
  },
};

export const artFor = (sportId) => ART[sportId] ?? ART.basketball;
