export function buildDietPrompt(profile, calorieTarget) {
  const proteinTarget = profile.goal?.toLowerCase().includes("muscle")
    ? "high protein - 1.8-2.2g per kg bodyweight"
    : "1.4-1.6g per kg bodyweight";

  return `Create a 7-day nutrition plan for:
Goal: ${profile.goal}, Daily Calorie Target: ${calorieTarget} kcal
Age: ${profile.age}, Gender: ${profile.gender}, Weight: ${profile.weight_kg}kg

Rules:
- 5 meals per day: Breakfast, Mid-morning Snack, Lunch, Evening Snack, Dinner
- Beginner-friendly recipes using common home ingredients
- Each recipe max 20 minutes prep time
- Emphasise protein (${proteinTarget})
- Keep daily total close to ${calorieTarget} kcal +/- 50 kcal

For each meal include: mealType, name, ingredients (array of strings with quantities),
prepTime, calories, protein_g, carbs_g, fat_g, instructions (step-by-step string),
videoSearch (YouTube search string for recipe demo)

Respond ONLY with valid JSON. No markdown, no explanation, no backticks.
{
  dailyCalorieTarget: ${calorieTarget},
  macroSplit: { protein_g: 0, carbs_g: 0, fat_g: 0 },
  weekPlan: [
    {
      day: 'Monday',
      totalCalories: 0,
      meals: [{ mealType, name, ingredients, prepTime, calories, protein_g, carbs_g, fat_g, instructions, videoSearch }]
    }
  ]
}`;
}
