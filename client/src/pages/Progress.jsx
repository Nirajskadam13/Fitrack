import { useEffect, useMemo, useState } from "react";
import api from "../lib/axios.js";
import { useAuth } from "../hooks/useAuth.js";
import ProgressChart from "../components/ProgressChart.jsx";

const tabs = [
  "Body Progress",
  "Workout Performance",
  "Personal Records",
  "Nutrition Compliance"
];

const formatDate = (date) => date.toISOString().split("T")[0];

const getStreaks = (sessions) => {
  const dates = new Set(sessions.map((session) => String(session.date).slice(0, 10)));
  let streak = 0;
  let longest = 0;

  let cursor = new Date();
  while (dates.has(formatDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sorted = Array.from(dates).sort();
  let current = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    if (i === 0) {
      current = 1;
      longest = Math.max(longest, current);
      continue;
    }
    const prev = new Date(sorted[i - 1]);
    const currentDate = new Date(sorted[i]);
    const diff = (currentDate - prev) / 86400000;
    if (diff === 1) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }

  return { streak, longest };
};

export default function Progress() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [calorieTarget, setCalorieTarget] = useState(0);
  const [isWeighInOpen, setIsWeighInOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [bodyFatInput, setBodyFatInput] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [progressRes, dietRes] = await Promise.all([
          api.get("/logs/progress"),
          api.get("/diet/plan")
        ]);
        if (!isMounted) return;
        setData(progressRes.data);
        setCalorieTarget(dietRes.data.dailyCalorieTarget || 0);
      } catch (error) {
        console.error("Progress load failed", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const weighIns = data?.weighIns || [];
  const weightSeries = weighIns.map((item) => ({
    date: String(item.date).slice(5, 10),
    weight: Number(item.weight_kg || 0)
  }));
  const fatSeries = weighIns.map((item) => ({
    date: String(item.date).slice(5, 10),
    fat: Number(item.body_fat_percent || 0)
  }));

  const sessionStats = useMemo(() => {
    const sessions = data?.allSessions || [];
    const { streak, longest } = getStreaks(sessions);
    return {
      streak,
      longest,
      total: sessions.length
    };
  }, [data]);

  const heatmapDays = useMemo(() => {
    return Array.from({ length: 28 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (27 - index));
      return formatDate(date);
    });
  }, []);

  const sessionDates = useMemo(() => {
    const sessions = data?.allSessions || [];
    return new Set(sessions.map((session) => String(session.date).slice(0, 10)));
  }, [data]);

  const daysToGoal = useMemo(() => {
    if (!user?.target_date) return "-";
    const diff = new Date(user.target_date) - new Date();
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [user]);

  const compliance = useMemo(() => {
    const logs = data?.thirtyDayCalories || [];
    if (!calorieTarget) return { compliant: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0 };
    let compliant = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    logs.forEach((entry) => {
      const within = entry.calories >= calorieTarget * 0.9 && entry.calories <= calorieTarget * 1.1;
      if (within) compliant += 1;
      protein += entry.protein || 0;
      carbs += entry.carbs || 0;
      fat += entry.fat || 0;
    });
    const days = logs.length || 1;
    return {
      compliant,
      avgProtein: Math.round(protein / days),
      avgCarbs: Math.round(carbs / days),
      avgFat: Math.round(fat / days)
    };
  }, [data, calorieTarget]);

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
      const refreshed = await api.get("/logs/progress");
      setData(refreshed.data);
    } catch (error) {
      console.error("Weigh-in failed", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(index)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${
              activeTab === index
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-secondary)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="space-y-4">
          <ProgressChart
            data={weightSeries}
            xKey="date"
            yKey="weight"
            label="Weight (kg)"
            color="var(--accent)"
            unit="kg"
          />
          <ProgressChart
            data={fatSeries}
            xKey="date"
            yKey="fat"
            label="Body Fat (%)"
            color="var(--danger)"
            unit="%"
          />
          <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:justify-between">
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Starting Weight</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {weighIns[0]?.weight_kg || "-"} kg
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Current Weight</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {weighIns[weighIns.length - 1]?.weight_kg || "-"} kg
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Days to Goal</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{daysToGoal}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsWeighInOpen(true)}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
          >
            Log Today&apos;s Weight
          </button>
        </div>
      )}

      {activeTab === 1 && (
        <div className="space-y-4">
          <ProgressChart
            data={data?.weeklyVolume || []}
            xKey="week"
            yKey="totalVolume"
            label="Weekly Volume (kg)"
            color="var(--success)"
            unit="kg"
            chartType="bar"
          />
          <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:justify-between">
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Current Streak</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {sessionStats.streak} days
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Longest Streak</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {sessionStats.longest} days
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Total Sessions</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {sessionStats.total}
              </p>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Last 28 days</p>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {heatmapDays.map((day) => (
                <div
                  key={day}
                  className={`h-5 w-5 rounded ${
                    sessionDates.has(day) ? "bg-emerald-500" : "bg-[var(--bg-secondary)]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Personal Records</h3>
          {data?.personalRecords?.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-[var(--text-secondary)]">
                  <tr>
                    <th className="pb-2">Exercise</th>
                    <th className="pb-2">Best Weight</th>
                    <th className="pb-2">Best Reps</th>
                    <th className="pb-2">Volume</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.personalRecords.map((record) => {
                    const isNew =
                      new Date(record.achieved_on) >=
                      new Date(Date.now() - 7 * 86400000);
                    return (
                      <tr key={record.id} className="border-t border-[var(--border)]">
                        <td className="py-2 font-semibold text-[var(--text-primary)]">
                          {record.exercise_name}
                        </td>
                        <td className="py-2 text-[var(--text-secondary)]">
                          {record.best_weight_kg}
                        </td>
                        <td className="py-2 text-[var(--text-secondary)]">
                          {record.best_reps}
                        </td>
                        <td className="py-2 text-[var(--text-secondary)]">
                          {record.total_volume_kg}
                        </td>
                        <td className="py-2 text-[var(--text-secondary)]">
                          {String(record.achieved_on).slice(0, 10)}
                          {isNew && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              New PB
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Complete your first workout session to set records.
            </p>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="space-y-4">
          <ProgressChart
            data={data?.thirtyDayCalories || []}
            xKey="date"
            yKey="calories"
            label="Daily Calories"
            color="var(--warning)"
            unit="kcal"
            referenceLineY={calorieTarget}
          />
          <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:justify-between">
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Compliance</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {compliance.compliant} / 30 days
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Avg Protein</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {compliance.avgProtein} g
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Avg Carbs</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {compliance.avgCarbs} g
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Avg Fat</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {compliance.avgFat} g
              </p>
            </div>
          </div>
        </div>
      )}

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
