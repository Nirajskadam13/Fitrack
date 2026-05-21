import { useEffect, useState } from "react";
import { Droplet } from "lucide-react";
import api from "../../lib/axios.js";

const formatDate = (date) => date.toISOString().split("T")[0];

export default function MealLog() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 });
  const [dietPlan, setDietPlan] = useState(null);
  const [showPlan, setShowPlan] = useState(false);

  const [form, setForm] = useState({
    foodName: "",
    quantityG: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: ""
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [todayRes, planRes] = await Promise.all([
          api.get("/logs/today"),
          api.get("/diet/plan")
        ]);
        if (!isMounted) return;
        setLogs(todayRes.data.logs);
        setTotals(todayRes.data.totals);
        setDietPlan(planRes.data.plan);
      } catch (error) {
        console.error("Meal log load failed", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async () => {
    try {
      const today = formatDate(new Date());
      const response = await api.post("/logs/meal", {
        date: today,
        mealType: "Quick Add",
        foodName: form.foodName,
        quantityG: form.quantityG,
        calories: form.calories,
        protein_g: form.protein_g,
        carbs_g: form.carbs_g,
        fat_g: form.fat_g
      });
      setLogs((prev) => [...prev, response.data.log]);
      setTotals((prev) => ({
        calories: prev.calories + Number(form.calories || 0),
        protein: prev.protein + Number(form.protein_g || 0),
        carbs: prev.carbs + Number(form.carbs_g || 0),
        fat: prev.fat + Number(form.fat_g || 0),
        water: prev.water
      }));
      setForm({ foodName: "", quantityG: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });
    } catch (error) {
      console.error("Quick add failed", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const logToRemove = logs.find((log) => log.id === id);
      await api.delete(`/logs/meal/${id}`);
      setLogs((prev) => prev.filter((log) => log.id !== id));
      if (logToRemove) {
        setTotals((prev) => ({
          calories: prev.calories - Number(logToRemove.calories || 0),
          protein: prev.protein - Number(logToRemove.protein_g || 0),
          carbs: prev.carbs - Number(logToRemove.carbs_g || 0),
          fat: prev.fat - Number(logToRemove.fat_g || 0),
          water: prev.water
        }));
      }
    } catch (error) {
      console.error("Delete meal failed", error);
    }
  };

  const handleWater = async (count) => {
    const today = formatDate(new Date());
    setTotals((prev) => ({ ...prev, water: count }));
    try {
      await api.post("/logs/water", { date: today, glasses: count });
    } catch (error) {
      console.error("Water log failed", error);
    }
  };

  if (loading) {
    return <div className="skeleton h-64 w-full" />;
  }

  const todayPlan = dietPlan?.weekPlan?.find(
    (day) => day.day === ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]
  );

  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Today</p>
            <p className="text-xl font-semibold text-[var(--text-primary)]">
              {Math.round(totals.calories)} kcal
            </p>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 8 }, (_, index) => {
              const filled = index < totals.water;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleWater(index + 1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    filled
                      ? "border-blue-400 bg-blue-100 text-blue-600"
                      : "border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  <Droplet size={14} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Protein</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {Math.round(totals.protein)} g
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Carbs</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {Math.round(totals.carbs)} g
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Fat</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {Math.round(totals.fat)} g
            </p>
          </div>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quick Add</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Food name"
            value={form.foodName}
            onChange={(event) => setForm((prev) => ({ ...prev, foodName: event.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Quantity (g)"
            value={form.quantityG}
            onChange={(event) => setForm((prev) => ({ ...prev, quantityG: event.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Calories"
            value={form.calories}
            onChange={(event) => setForm((prev) => ({ ...prev, calories: event.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Protein"
            value={form.protein_g}
            onChange={(event) => setForm((prev) => ({ ...prev, protein_g: event.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Carbs"
            value={form.carbs_g}
            onChange={(event) => setForm((prev) => ({ ...prev, carbs_g: event.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Fat"
            value={form.fat_g}
            onChange={(event) => setForm((prev) => ({ ...prev, fat_g: event.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
        >
          Add
        </button>
      </div>

      <div className="card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Today&apos;s Log</h3>
        {logs.length ? (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-[var(--text-primary)]">{log.food_name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{log.calories} kcal</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(log.id)}
                  className="text-xs font-semibold text-[var(--danger)]"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">No meals logged yet.</p>
        )}
      </div>

      <div className="card space-y-3 p-5">
        <button
          type="button"
          onClick={() => setShowPlan((prev) => !prev)}
          className="text-left text-sm font-semibold text-[var(--text-primary)]"
        >
          Log from Plan
        </button>
        {showPlan && (
          <div className="space-y-2">
            {todayPlan?.meals?.map((meal, index) => (
              <div
                key={`${meal.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-[var(--text-primary)]">{meal.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{meal.calories} kcal</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const response = await api.post("/logs/meal", {
                      date: formatDate(new Date()),
                      mealType: meal.mealType,
                      foodName: meal.name,
                      quantityG: 100,
                      calories: meal.calories,
                      protein_g: meal.protein_g,
                      carbs_g: meal.carbs_g,
                      fat_g: meal.fat_g
                    });
                    setLogs((prev) => [...prev, response.data.log]);
                    setTotals((prev) => ({
                      calories: prev.calories + Number(meal.calories || 0),
                      protein: prev.protein + Number(meal.protein_g || 0),
                      carbs: prev.carbs + Number(meal.carbs_g || 0),
                      fat: prev.fat + Number(meal.fat_g || 0),
                      water: prev.water
                    }));
                  }}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]"
                >
                  Log Full
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
