import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Droplet,
  Dumbbell,
  Flame,
  Salad,
  Scale,
  Target,
  TrendingUp
} from "lucide-react";
import api from "../lib/axios.js";
import { useAuth } from "../hooks/useAuth.js";
import StatsCard from "../components/StatsCard.jsx";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const formatDate = (date) => date.toISOString().split("T")[0];

const getBmiCategory = (bmi) => {
  if (!bmi) return "-";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

const getBodyFatCategory = (value) => {
  if (!value) return "-";
  if (value < 14) return "Athlete";
  if (value < 21) return "Fit";
  if (value < 25) return "Average";
  return "High";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);
  const [fitnessPlan, setFitnessPlan] = useState(null);
  const [isWeighInOpen, setIsWeighInOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [bodyFatInput, setBodyFatInput] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [dashRes, dietRes, fitnessRes] = await Promise.all([
          api.get("/logs/dashboard"),
          api.get("/diet/plan"),
          api.get("/fitness/plan")
        ]);
        if (!isMounted) return;
        setData(dashRes.data);
        setDietPlan(dietRes.data);
        setFitnessPlan(fitnessRes.data);
      } catch (error) {
        console.error("Dashboard load failed", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const todayName = dayNames[new Date().getDay()];

  const dayIndex = useMemo(() => {
    const plan = fitnessPlan?.plan?.weekPlan || [];
    const index = plan.findIndex((day) => day.day === todayName);
    return index >= 0 ? index : 0;
  }, [fitnessPlan, todayName]);

  const todayPlan = useMemo(() => {
    const plan = fitnessPlan?.plan?.weekPlan || [];
    return plan[dayIndex];
  }, [fitnessPlan, dayIndex]);

  const calorieTarget = dietPlan?.dailyCalorieTarget || 0;
  const totals = data?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
  const bmi = useMemo(() => {
    if (!user?.weight_kg || !user?.height_cm) return 0;
    const h = Number(user.height_cm) / 100;
    return Number(user.weight_kg) / (h * h);
  }, [user]);

  const bodyFat = useMemo(() => {
    if (!bmi || !user?.age) return 0;
    const gender = String(user.gender || "");
    return 1.2 * bmi + 0.23 * Number(user.age) - (gender === "Male" ? 16.2 : 5.4);
  }, [bmi, user]);

  const macroTargets = useMemo(() => {
    const split = dietPlan?.plan?.macroSplit;
    if (split?.protein_g) return split;
    if (!calorieTarget) return { protein_g: 0, carbs_g: 0, fat_g: 0 };
    return {
      protein_g: Math.round((calorieTarget * 0.3) / 4),
      carbs_g: Math.round((calorieTarget * 0.4) / 4),
      fat_g: Math.round((calorieTarget * 0.3) / 9)
    };
  }, [dietPlan, calorieTarget]);

  const calorieBalance = calorieTarget - totals.calories;
  const calorieBalanceLabel = calorieBalance >= 0
    ? `${Math.round(calorieBalance)} remaining`
    : `${Math.abs(Math.round(calorieBalance))} over`;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const sessionDates = useMemo(() => {
    const list = data?.workoutSessions || [];
    return new Set(list.map((item) => String(item.date).slice(0, 10)));
  }, [data]);

  const calendarDays = useMemo(() => {
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - index));
      return formatDate(date);
    });
  }, []);

  const handleWaterClick = async (count) => {
    const today = formatDate(new Date());
    setData((prev) => ({
      ...prev,
      totals: { ...prev.totals, water: count }
    }));
    try {
      await api.post("/logs/water", { date: today, glasses: count });
    } catch (error) {
      console.error("Water log failed", error);
    }
  };

  const handleWeighIn = async () => {
    const today = formatDate(new Date());
    try {
      await api.post("/logs/weigh-in", {
        date: today,
        weight_kg: weightInput,
        body_fat_percent: bodyFatInput || null
      });
      setIsWeighInOpen(false);
      setWeightInput("");
      setBodyFatInput("");
      const refreshed = await api.get("/logs/dashboard");
      setData(refreshed.data);
    } catch (error) {
      console.error("Weigh-in failed", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
        </div>
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {greeting}, {user?.name || "Athlete"}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {data?.streak || 0} day streak - Goal: {user?.goal || "-"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/progress")}
          className="flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
        >
          <TrendingUp size={16} />
          View Progress
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<Scale size={18} />}
          label="BMI"
          value={bmi ? bmi.toFixed(1) : "-"}
          unit=""
          color="indigo"
          subtitle={getBmiCategory(bmi)}
        />
        <StatsCard
          icon={<Flame size={18} />}
          label="Body Fat %"
          value={bodyFat ? bodyFat.toFixed(1) : "-"}
          unit="%"
          color="amber"
          subtitle={getBodyFatCategory(bodyFat)}
        />
        <StatsCard
          icon={<Target size={18} />}
          label="Calorie Target"
          value={calorieTarget || "-"}
          unit="kcal"
          color="green"
          subtitle="Daily target"
        />
        <StatsCard
          icon={<Calendar size={18} />}
          label="Calorie Balance"
          value={Math.round(calorieBalance)}
          unit="kcal"
          color={calorieBalance >= 0 ? "green" : "red"}
          subtitle={calorieBalanceLabel}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Today&apos;s Workout
            </h3>
            <Dumbbell size={18} className="text-[var(--accent)]" />
          </div>
          {todayPlan?.restDay ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Rest day. Focus on recovery, mobility and hydration.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">
                {todayPlan?.muscleGroup || "Workout"} - {todayPlan?.mainExercises?.length || 0} main exercises
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/fitness/plan")}
                  className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)]"
                >
                  View Plan
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/fitness/session?day=${dayIndex}`)}
                  className="rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                >
                  Start Session
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Today&apos;s Nutrition
            </h3>
            <Salad size={18} className="text-[var(--accent)]" />
          </div>
          <div className="space-y-2">
            {[
              { label: "Protein", value: totals.protein, target: macroTargets.protein_g, color: "bg-emerald-500" },
              { label: "Carbs", value: totals.carbs, target: macroTargets.carbs_g, color: "bg-amber-500" },
              { label: "Fat", value: totals.fat, target: macroTargets.fat_g, color: "bg-rose-500" }
            ].map((macro) => (
              <div key={macro.label}>
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>{macro.label}</span>
                  <span>
                    {Math.round(macro.value)} / {Math.round(macro.target || 0)}g
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-[var(--bg-secondary)]">
                  <div
                    className={`h-full rounded-full ${macro.color}`}
                    style={{
                      width: `${macro.target ? Math.min(100, (macro.value / macro.target) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/diet/plan")}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)]"
            >
              View Diet
            </button>
            <button
              type="button"
              onClick={() => navigate("/diet/log")}
              className="rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
            >
              Log Meal
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex items-center justify-center gap-6 p-5">
          {[
            { label: "Workout", value: data?.todaySession ? 100 : 0 },
            { label: "Calories", value: calorieTarget ? Math.min(100, (totals.calories / calorieTarget) * 100) : 0 }
          ].map((ring) => (
            <div key={ring.label} className="text-center">
              <svg width="100" height="100" viewBox="0 0 100 100" className="mx-auto">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="8"
                  strokeDasharray={`${(ring.value / 100) * 251} 251`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{ring.label}</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {Math.round(ring.value)}%
              </p>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">30-Day Streak</h3>
          <div className="mt-4 grid grid-cols-6 gap-2">
            {calendarDays.map((day) => (
              <div
                key={day}
                className={`h-4 w-4 rounded ${
                  sessionDates.has(day) ? "bg-emerald-500" : "bg-[var(--bg-secondary)]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Water Tracker</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 8 }, (_, index) => {
              const filled = index < totals.water;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleWaterClick(index + 1)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                    filled
                      ? "border-blue-400 bg-blue-100 text-blue-600"
                      : "border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  <Droplet size={16} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/fitness/session?day=${dayIndex}`)}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
          >
            Start Workout
          </button>
          <button
            type="button"
            onClick={() => navigate("/diet/log")}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
          >
            Log Meal
          </button>
          <button
            type="button"
            onClick={() => setIsWeighInOpen(true)}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
          >
            Weigh In
          </button>
          <button
            type="button"
            onClick={() => navigate("/progress")}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
          >
            Progress
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Calories logged today: {Math.round(totals.calories)}
        </p>
      </div>

      {isWeighInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Weigh In</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightInput}
                  onChange={(event) => setWeightInput(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Body Fat % (optional)
                </label>
                <input
                  type="number"
                  value={bodyFatInput}
                  onChange={(event) => setBodyFatInput(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWeighInOpen(false)}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWeighIn}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
