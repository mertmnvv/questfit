export const ALL_QUEST_IDS = [
  'water_1_5l',
  'water_2l',
  'water_2_5l',
  'water_3l',
  'protein_80g',
  'protein_100g',
  'protein_120g',
  'protein_150g',
  'protein_target',
  'cals_under_target',
  'cals_burn_200',
  'cals_burn_400',
  'cals_burn_600',
  'carbs_target',
  'fat_target',
  'workout_1',
  'workout_2',
  'workout_ai',
  'steps_3k',
  'steps_5k',
  'steps_8k',
  'steps_10k',
  'steps_12k',
  'steps_15k',
  'log_breakfast',
  'log_lunch',
  'log_dinner',
  'log_snack',
  'fast_start',
  'streak_3'
];

/**
 * Returns an array of `count` unique random quest IDs from ALL_QUEST_IDS.
 */
export const getRandomQuests = (count = 4) => {
  const shuffled = [...ALL_QUEST_IDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
