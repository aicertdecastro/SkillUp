// DATA LAYER · fixed wording for the challenge screens (same for every learner).
// Sport-specific text (spots, players, scenarios, tips) lives in challenge_levels.content.

// Sports whose challenges are built. The others show "Coming soon".
export const CHALLENGES_READY = ['basketball', 'volleyball', 'soccer'];

export const GAME_ORDER = ['positions', 'rules', 'timing', 'play'];

export const GAME_NAME = {
  positions: 'Positions',
  rules: 'Rules',
  timing: 'Timing',
  play: 'Choose play',
};

export const LEVEL_NAME = { 1: 'Easy', 2: 'Normal' };

// "How to play" boxes. {tries} {need} {seconds} come from the level settings, {button} from its content.
export const HOW_TO_PLAY = {
  rules: [
    'Look at the paused picture.',
    'Click the player or spot that answers the question.',
    'A wrong pick shows a hint. Keep trying!',
  ],
  timing: [
    'Watch the marker slide across the bar.',
    'Press {button} (or Space) when it is in the green zone.',
    'You get {tries} tries. Hit {need} to pass.',
  ],
  play: [
    'Press START and read the situation.',
    'Pick the best play before time runs out ({seconds} s).',
    'See why your choice worked, or try again.',
  ],
};

// "Remember the rules" box on the Rules game (from Lesson 3).
export const RULE_REMINDERS = {
  basketball: [
    ['Traveling:', 'more than 2 steps without dribbling.'],
    ['Double dribble:', 'dribbling again after you stop.'],
    ['Personal foul:', 'pushing, holding or hitting.'],
    ['Out of bounds:', 'the ball or player touches the line or outside it.'],
  ],
  volleyball: [
    ['Net touch:', 'touching the net while playing the ball.'],
    ['Foot fault:', 'stepping on the end line when serving.'],
    ['Double contact:', 'one player touches the ball twice in a row.'],
    ['Line ball:', 'a ball on the line is in.'],
  ],
  soccer: [
    ['Handball:', 'touching the ball on purpose with a hand or arm.'],
    ['Foul:', 'tripping, pushing or kicking a player.'],
    ['Ball out:', 'throw in, corner kick or goal kick.'],
    ['Offside:', 'you need 2 opponents level with you or closer to their goal.'],
  ],
};

// Third tile on the results screen.
export const RESULT_STAT = {
  positions: 'Misses',
  rules: 'Tries',
  timing: 'Hits',
  play: 'Time',
};
