import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { callGemini, parseGeminiJson } from "../ai/gemini.js";
import { buildDietPrompt } from "../ai/dietPrompt.js";
import {
  findUserById,
  upsertDietPlan,
  getActiveDietPlan,
  updateDietPlanJson
} from "../db/index.js";

const router = Router();

function calculateCalorieTarget(profile) {
  const weight = Number(profile.weight_kg || 0);
  const height = Number(profile.height_cm || 0);
  const age = Number(profile.age || 0);
  const gender = String(profile.gender || "").toLowerCase();

  const bmrBase = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === "male" ? bmrBase + 5 : bmrBase - 161;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  };

  const activityKey = String(profile.activity_level || "sedentary").toLowerCase();
  const tdee = bmr * (multipliers[activityKey] || 1.2);

  const goal = String(profile.goal || "").toLowerCase();
  let target = tdee - 300;
  if (goal.includes("fat")) {
    target = tdee - 500;
  } else if (goal.includes("muscle")) {
    target = tdee + 200;
  }

  return Math.max(1400, Math.round(target));
}

router.post("/generate", verifyToken, async (req, res) => {
  try {
    const userProfile = req.body || {};
    const dbProfile = await findUserById(req.userId);
    const profile = { ...dbProfile, ...userProfile };

    const calorieTarget = calculateCalorieTarget(profile);
    const prompt = buildDietPrompt(profile, calorieTarget);
    const raw = await callGemini(
      prompt,
      "You are a professional nutrition coach. Respond only in valid JSON."
    );

    if (!raw) {
      return res.status(500).json({ error: "AI generation failed. Please retry." });
    }

    const plan = parseGeminiJson(raw);
    if (!plan) {
      console.error("Diet JSON parse failed", raw.slice(0, 200));
      return res.status(500).json({ error: "Failed to parse AI response." });
    }

    await upsertDietPlan(req.userId, plan, calorieTarget, 1);
    return res.json({ success: true, plan, calorieTarget });
  } catch (error) {
    console.error("Diet generation failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/plan", verifyToken, async (req, res) => {
  try {
    const row = await getActiveDietPlan(req.userId);
    if (!row) {
      return res.json({ plan: null, planId: null, dailyCalorieTarget: null });
    }
    return res.json({
      plan: row.plan_json,
      planId: row.id,
      dailyCalorieTarget: row.daily_calorie_target
    });
  } catch (error) {
    console.error("Fetch diet plan failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/modify-meal", verifyToken, async (req, res) => {
  try {
    const {
      planId,
      dayIndex,
      mealIndex,
      userInstruction,
      currentMeal,
      dailyCalorieTarget
    } = req.body;

    const prompt = `Modify this meal: ${JSON.stringify(currentMeal)}\n` +
      `User instruction: '${userInstruction}'\n` +
      `Keep calories close to: ${currentMeal.calories} kcal.\n` +
      `Daily calorie target: ${dailyCalorieTarget} kcal.\n` +
      "Respond ONLY with the modified meal JSON. Same field structure. No explanation.";

    const raw = await callGemini(
      prompt,
      "You are a professional nutrition coach. Respond only with valid JSON."
    );

    if (!raw) {
      return res.status(500).json({ error: "AI modification failed." });
    }

    const updatedMeal = parseGeminiJson(raw);
    if (!updatedMeal) {
      console.error("Meal JSON parse failed", raw.slice(0, 200));
      return res.status(500).json({ error: "Failed to parse AI response." });
    }

    const row = await getActiveDietPlan(req.userId);
    if (!row) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const updatedPlan = JSON.parse(JSON.stringify(row.plan_json));
    updatedPlan.weekPlan[dayIndex].meals[mealIndex] = updatedMeal;

    await updateDietPlanJson(planId, updatedPlan);
    return res.json({ success: true, updatedMeal });
  } catch (error) {
    console.error("Modify meal failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
