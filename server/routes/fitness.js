import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { callGemini, parseGeminiJson } from "../ai/gemini.js";
import { buildFitnessPrompt } from "../ai/fitnessPrompt.js";
import {
  findUserById,
  upsertFitnessPlan,
  getActiveFitnessPlan,
  updateFitnessPlanJson
} from "../db/index.js";

const router = Router();

router.post("/generate", verifyToken, async (req, res) => {
  try {
    const userProfile = req.body || {};
    const dbProfile = await findUserById(req.userId);
    const profile = { ...dbProfile, ...userProfile };

    const prompt = buildFitnessPrompt(profile);
    const raw = await callGemini(
      prompt,
      "You are a professional certified fitness trainer. Respond only in valid JSON."
    );

    if (!raw) {
      return res.status(500).json({ error: "AI generation failed. Please retry." });
    }

    const plan = parseGeminiJson(raw);
    if (!plan) {
      console.error("Fitness JSON parse failed", raw.slice(0, 200));
      return res.status(500).json({ error: "Failed to parse AI response." });
    }

    await upsertFitnessPlan(req.userId, plan, 1);
    return res.json({ success: true, plan });
  } catch (error) {
    console.error("Fitness generation failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/plan", verifyToken, async (req, res) => {
  try {
    const row = await getActiveFitnessPlan(req.userId);
    if (!row) {
      return res.json({ plan: null, planId: null });
    }
    return res.json({ plan: row.plan_json, planId: row.id });
  } catch (error) {
    console.error("Fetch fitness plan failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/modify-section", verifyToken, async (req, res) => {
  try {
    const {
      planId,
      dayIndex,
      section,
      itemIndex,
      userInstruction,
      currentItem,
      pairKey
    } = req.body;

    const profile = await findUserById(req.userId);
    const equipment = Array.isArray(profile?.equipment) ? profile.equipment : [];

    const prompt = `Modify this exercise: ${JSON.stringify(currentItem)}\n` +
      `User instruction: '${userInstruction}'\n` +
      `Equipment available: ${equipment.join(", ")}\n` +
      `Location: ${profile?.workout_location} - floor versions only if home.\n` +
      "Keep the same JSON field structure as the input. Respond ONLY with the modified exercise JSON. No explanation.";

    const raw = await callGemini(
      prompt,
      "You are a certified fitness trainer. Respond only with valid JSON."
    );

    if (!raw) {
      return res.status(500).json({ error: "AI modification failed." });
    }

    const updatedItem = parseGeminiJson(raw);
    if (!updatedItem) {
      console.error("Fitness item JSON parse failed", raw.slice(0, 200));
      return res.status(500).json({ error: "Failed to parse AI response." });
    }

    const row = await getActiveFitnessPlan(req.userId);
    if (!row) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const updatedPlan = JSON.parse(JSON.stringify(row.plan_json));

    if (pairKey) {
      updatedPlan.weekPlan[dayIndex][section][itemIndex][pairKey] = updatedItem;
    } else {
      updatedPlan.weekPlan[dayIndex][section][itemIndex] = updatedItem;
    }

    await updateFitnessPlanJson(planId, updatedPlan);
    return res.json({ success: true, updatedItem });
  } catch (error) {
    console.error("Modify fitness section failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
