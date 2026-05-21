export function buildFitnessPrompt(profile) {
  const equipment = Array.isArray(profile.equipment) ? profile.equipment : [];

  return `Create a complete 7-day workout plan for the following user:
Name: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}
Height: ${profile.height_cm}cm, Weight: ${profile.weight_kg}kg
Goal: ${profile.goal}, Target Date: ${profile.target_date}
Workout Location: ${profile.workout_location}
Available Equipment: ${equipment.join(", ")}
Activity Level: ${profile.activity_level}

EQUIPMENT RULES (strictly follow):
- User has dumbbell rods (pair), 1 barbell extender, 4x2.5kg plates
- Maximum dumbbell weight: ~10kg per side (2 plates per rod)
- NEVER combine barbell and dumbbell in the same exercise
- No bench available - use floor versions for all pressing movements
- All exercises must be completable with the listed equipment only

For each of the 7 days generate:
1. Warm-up (6 exercises): name, targetMuscles, execution, sets, reps, rest, videoSearch
2. Main Exercises (6-7): mark each important:true or important:false (skippable).
   Include: name, important, targetMuscles, equipment, weight, sets, reps, rest,
   execution, tips, form (posture/grip/rangeOfMotion/tempo), mistakes, breathing, videoSearch
3. Supersets (2 pairs): different exercises from Main. Each pair: exerciseA + exerciseB.
   Same detail level as main exercises.
4. Ab Supersets (2 pairs): target upper abs, lower abs, obliques.
   Same detail level.
5. Optional Exercises (1-2): same detail as main exercises.
6. Stretching (6): name, targetMuscles, execution, duration, breathing, tips

Additional rules:
- Total workout completable in 50 minutes
- Fat loss goal: higher reps (15-20), 45-60s rest, compound movements prioritised
- Muscle gain goal: lower reps (8-12), 60-90s rest
- Both goals: mix of 12-15 reps, 60s rest
- videoSearch: provide a YouTube search string like 'athleanx dumbbell row form' - do NOT write URLs
- Ensure progressive overload: note suggested starting weight for each exercise

Respond ONLY with valid JSON. No markdown, no explanation, no backticks.
JSON structure:
{
  weekPlan: [
    {
      day: 'Monday',
      muscleGroup: 'Chest & Triceps',
      restDay: false,
      warmup: [{ name, targetMuscles, execution, sets, reps, rest, videoSearch }],
      mainExercises: [{ name, important, targetMuscles, equipment, weight, sets, reps, rest, execution, tips, form, mistakes, breathing, videoSearch }],
      supersets: [{ exerciseA: {...}, exerciseB: {...} }],
      abSupersets: [{ exerciseA: {...}, exerciseB: {...} }],
      optional: [{ ...same as mainExercise... }],
      stretching: [{ name, targetMuscles, execution, duration, breathing, tips }]
    }
  ]
}`;
}
