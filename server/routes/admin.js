import { Router } from "express";
import dotenv from "dotenv";
import { verifyToken } from "../middleware/auth.js";
import { callGemini } from "../ai/gemini.js";
import { buildFitnessPrompt } from "../ai/fitnessPrompt.js";
import { buildDietPrompt } from "../ai/dietPrompt.js";
import {
  sql,
  getAllUsers,
  findUserById,
  getActiveFitnessPlan,
  getActiveDietPlan,
  getPersonalRecords,
  updateFitnessPlanJson,
  updateDietPlanJson,
  upsertFitnessPlan,
  upsertDietPlan
} from "../db/index.js";

dotenv.config();

const router = Router();

const requireAdmin = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
};

const calculateCalorieTarget = (profile) => {
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
};

router.use(verifyToken);
router.use(requireAdmin);

router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.json({ users });
  } catch (error) {
    console.error("Admin users failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/user/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const [user, fitnessPlan, dietPlan, personalRecords] = await Promise.all([
      findUserById(userId),
      getActiveFitnessPlan(userId),
      getActiveDietPlan(userId),
      getPersonalRecords(userId)
    ]);

    return res.json({
      user,
      fitnessPlan,
      dietPlan,
      personalRecords
    });
  } catch (error) {
    console.error("Admin user detail failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/plan", async (req, res) => {
  try {
    const { userId, planType, planJson } = req.body;

    let parsed;
    try {
      parsed = JSON.parse(planJson);
    } catch (error) {
      return res.status(400).json({ error: "Invalid JSON" });
    }

    if (planType === "fitness") {
      const plan = await getActiveFitnessPlan(userId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      await updateFitnessPlanJson(plan.id, parsed);
    } else if (planType === "diet") {
      const plan = await getActiveDietPlan(userId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      await updateDietPlanJson(plan.id, parsed);
    } else {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Admin plan update failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/regenerate", async (req, res) => {
  try {
    const { userId, planType } = req.body;
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (planType === "fitness") {
      const prompt = buildFitnessPrompt(user);
      const raw = await callGemini(
        prompt,
        "You are a professional certified fitness trainer. Respond only in valid JSON."
      );
      if (!raw) {
        return res.status(500).json({ error: "AI generation failed." });
      }
      const plan = JSON.parse(raw);
      await upsertFitnessPlan(userId, plan, 1);
      return res.json({ success: true });
    }

    if (planType === "diet") {
      const calorieTarget = calculateCalorieTarget(user);
      const prompt = buildDietPrompt(user, calorieTarget);
      const raw = await callGemini(
        prompt,
        "You are a professional nutrition coach. Respond only in valid JSON."
      );
      if (!raw) {
        return res.status(500).json({ error: "AI generation failed." });
      }
      const plan = JSON.parse(raw);
      await upsertDietPlan(userId, plan, calorieTarget, 1);
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Invalid plan type" });
  } catch (error) {
    console.error("Admin regenerate failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const [usersRow] = await sql`SELECT COUNT(*)::int AS count FROM users`;
    const [onboardedRow] = await sql`
      SELECT COUNT(*)::int AS count FROM users WHERE onboarding_done = true
    `;
    const [sessionsRow] = await sql`SELECT COUNT(*)::int AS count FROM workout_sessions`;
    const [mealsRow] = await sql`SELECT COUNT(*)::int AS count FROM meal_logs`;

    return res.json({
      totalUsers: Number(usersRow.count || 0),
      onboardedUsers: Number(onboardedRow.count || 0),
      totalSessions: Number(sessionsRow.count || 0),
      totalMealLogs: Number(mealsRow.count || 0)
    });
  } catch (error) {
    console.error("Admin stats failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
