// DATA LAYER · static content that is the same for every learner (no database needed).

// Rough reading + practice time for lessons 1–5 of every sport ("5 short lessons · about 40 minutes").
export const LESSON_MINUTES = [8, 8, 8, 6, 10];

export const SPORT_INFO = {
  basketball: {
    blurb: 'Two teams of five pass, dribble and shoot to score through a hoop 10 feet high. ' +
           'It’s fast, it’s fun, and you only need a ball and a hoop to start practising.',
    facts: [['5 v 5', 'Players'], ['10 ft', 'Hoop'], ['1891', 'Since']],
  },
  volleyball: {
    blurb: 'Two teams of six keep the ball off the floor on their side of the net. ' +
           'Bump, set and hit — you get up to 3 touches to send it back over.',
    facts: [['6 v 6', 'Players'], ['3', 'Touches'], ['1895', 'Since']],
  },
  soccer: {
    blurb: 'Two teams use their feet, body and head to get the ball into the other team’s goal. ' +
           'Only the goalkeeper can use their hands, and only in their own box.',
    facts: [['11 v 11', 'Players'], ['90 min', 'Game'], ['1863', 'Since']],
  },
};
