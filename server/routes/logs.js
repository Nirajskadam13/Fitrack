import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getWorkoutSessions,
  getMealLogsByDate,
  getMealLogsByRange,
  getWeighIns,
  getTodaySession,
  insertWeighIn,
  insertWorkoutSession,
  upsertPersonalRecord,
  insertMealLog,
  deleteMealLog,
  updateWaterGlasses,
  getPersonalRecords
} from "../db/index.js";

const router = Router();

const formatDate = (date) => date.toISOString().split("T")[0];
const toDateKey = (value) => String(value).slice(0, 10);

const getISOWeekKey = (value) => {
  const date = new Date(value);
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

router.use(verifyToken);

router.get("/dashboard", async (req, res) => {
  try {
    const today = formatDate(new Date());
    const thirtyDaysAgoDate = new Date();
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const thirtyDaysAgo = formatDate(thirtyDaysAgoDate);

    const [workoutSessions, todayMeals, weighIns, todaySession] = await Promise.all([
      getWorkoutSessions(req.userId, thirtyDaysAgo),
      getMealLogsByDate(req.userId, today),
      getWeighIns(req.userId),
      getTodaySession(req.userId, today)
    ]);

    const totals = todayMeals.reduce(
      (acc, log) => {
        acc.calories += Number(log.calories || 0);
        acc.protein += Number(log.protein_g || 0);
        acc.carbs += Number(log.carbs_g || 0);
        acc.fat += Number(log.fat_g || 0);
        acc.water += Number(log.water_glasses || 0);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
    );

    const sessionDates = new Set(workoutSessions.map((s) => toDateKey(s.date)));
    let streak = 0;
    const streakDate = new Date();
    while (true) {
      const key = formatDate(streakDate);
      if (sessionDates.has(key)) {
        streak += 1;
        streakDate.setDate(streakDate.getDate() - 1);
      } else {
        break;
      }
    }

    const latestWeighIn = weighIns.length ? weighIns[weighIns.length - 1] : null;

    return res.json({
      workoutSessions,
      todayMeals,
      todaySession,
      latestWeighIn,
      totals,
      streak
    });
  } catch (error) {
    console.error("Dashboard logs failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/weigh-in", async (req, res) => {
  try {
    const { date, weight_kg, body_fat_percent, notes } = req.body;
    await insertWeighIn(req.userId, date, weight_kg, body_fat_percent, notes || null);
    return res.json({ success: true });
  } catch (error) {
    console.error("Weigh-in failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/workout-session", async (req, res) => {
  try {
    const {
      date,
      dayName,
      muscleGroup,
      exercisesLogged,
      durationMins,
      totalVolumeKg
    } = req.body;

    const exercises = Array.isArray(exercisesLogged) ? exercisesLogged : [];
    const totalVolume = Number(totalVolumeKg || 0) ||
      exercises.reduce((sum, ex) => sum + Number(ex.totalVolume || 0), 0);

    await insertWorkoutSession(
      req.userId,
      date,
      dayName,
      muscleGroup,
      exercises,
      durationMins,
      totalVolume
    );

    for (const exercise of exercises) {
      const weight = Number(exercise.maxWeightUsed || 0);
      const reps = Number(exercise.maxReps || 0);
      const sets = Array.isArray(exercise.setsLogged) ? exercise.setsLogged.length : 1;
      const volume = Number(exercise.totalVolume || 0) || weight * reps * sets;

      await upsertPersonalRecord(
        req.userId,
        exercise.name,
        weight,
        reps,
        volume,
        date
      );
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Workout session failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/last-session", async (req, res) => {
  try {
    const sessions = await getWorkoutSessions(req.userId, "2000-01-01");
    const latest = sessions.slice(-5).reverse();
    return res.json({ sessions: latest });
  } catch (error) {
    console.error("Last session lookup failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/today", async (req, res) => {
  try {
    const today = formatDate(new Date());
    const logs = await getMealLogsByDate(req.userId, today);

    const totals = logs.reduce(
      (acc, log) => {
        acc.calories += Number(log.calories || 0);
        acc.protein += Number(log.protein_g || 0);
        acc.carbs += Number(log.carbs_g || 0);
        acc.fat += Number(log.fat_g || 0);
        acc.water += Number(log.water_glasses || 0);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
    );

    return res.json({ logs, totals });
  } catch (error) {
    console.error("Today logs failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/meal", async (req, res) => {
  try {
    const {
      date,
      mealType,
      foodName,
      quantityG,
      calories,
      protein_g,
      carbs_g,
      fat_g
    } = req.body;

    const log = await insertMealLog(
      req.userId,
      date,
      mealType,
      foodName,
      quantityG,
      calories,
      protein_g,
      carbs_g,
      fat_g
    );

    return res.json({ success: true, log });
  } catch (error) {
    console.error("Meal log failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/meal/:id", async (req, res) => {
  try {
    await deleteMealLog(req.params.id, req.userId);
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete meal failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/water", async (req, res) => {
  try {
    const { date, glasses } = req.body;
    await updateWaterGlasses(req.userId, date, glasses);
    return res.json({ success: true });
  } catch (error) {
    console.error("Water log failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/progress", async (req, res) => {
  try {
    const weighIns = await getWeighIns(req.userId);
    const allSessions = await getWorkoutSessions(req.userId, "2000-01-01");
    const personalRecords = await getPersonalRecords(req.userId);

    const volumeByWeek = new Map();
    const sessionsByWeek = new Map();

    for (const session of allSessions) {
      const weekKey = getISOWeekKey(session.date);
      const volume = Number(session.total_volume_kg || 0);
      volumeByWeek.set(weekKey, (volumeByWeek.get(weekKey) || 0) + volume);
      sessionsByWeek.set(weekKey, (sessionsByWeek.get(weekKey) || 0) + 1);
    }

    const weeklyVolume = Array.from(volumeByWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, totalVolume]) => ({ week, totalVolume }));

    const weeklySessions = Array.from(sessionsByWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, sessions]) => ({ week, sessions }));

    const toDate = formatDate(new Date());
    const fromDateObj = new Date();
    fromDateObj.setDate(fromDateObj.getDate() - 30);
    const fromDate = formatDate(fromDateObj);

    const mealLogs = await getMealLogsByRange(req.userId, fromDate, toDate);
    const dailyMap = new Map();

    for (const log of mealLogs) {
      const key = toDateKey(log.date);
      const entry = dailyMap.get(key) || {
        date: key,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
      entry.calories += Number(log.calories || 0);
      entry.protein += Number(log.protein_g || 0);
      entry.carbs += Number(log.carbs_g || 0);
      entry.fat += Number(log.fat_g || 0);
      dailyMap.set(key, entry);
    }

    const thirtyDayCalories = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return res.json({
      weighIns,
      personalRecords,
      weeklyVolume,
      weeklySessions,
      thirtyDayCalories,
      allSessions
    });
  } catch (error) {
    console.error("Progress logs failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
