// DATA LAYER · fixed wording for the lesson, quiz and results screens (same for every learner).

export const SPORT_IDS = ['basketball', 'volleyball', 'soccer'];

export const STEPS = [
  { id: 'learn', label: 'Learn' },
  { id: 'try',   label: 'Try it' },
  { id: 'check', label: 'Quick check' },
  { id: 'play',  label: 'Play' },
];

// Must match the amounts in supabase/schema.sql (_award calls).
export const WAYS_TO_EARN = [
  ['Finish a lesson', '+10'],
  ['Correct quiz answer', '+5'],
  ['Pass a challenge level', '+20'],
];

// What the sidebar says each lesson's activity is (lesson 1 has no challenge).
export const ACTIVITY_LABEL = {
  none: 'Quiz + drill',
  positions: 'Drag-and-drop court positions',
  rules: 'Clickable rule scenarios',
  timing: null,            // uses the level title, e.g. "Timing bar: free throw"
  play: 'Choose your play cards',
};

// Sports that word an activity differently (checked before ACTIVITY_LABEL).
export const ACTIVITY_LABEL_BY_SPORT = {
  volleyball: { positions: 'Drag-and-drop court zones' },
  soccer: { positions: 'Drag-and-drop field positions' },
};

export const COACH_TIPS = {
  learn: 'Tap every card to tick it off as you read.',
  try: 'Give it a go. You can try as many times as you like!',
  check: 'Pick the best answer. Wrong ones show you why.',
  play: 'Put it all together and play!',
};

export const QUIZ_PASS_PCT = 70;

// Badge tiers (same cut-offs as tier_for() in supabase/schema.sql).
export const TIERS = [
  { id: 'bronze', label: 'Bronze', min: 70, range: '70–84%' },
  { id: 'silver', label: 'Silver', min: 85, range: '85–99%' },
  { id: 'gold',   label: 'Gold',   min: 100, range: '100%' },
];
