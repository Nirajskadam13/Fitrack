import { useMemo, useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import api from "../lib/axios.js";
import AIModifyPanel from "./AIModifyPanel.jsx";

const badgeColor = {
  Breakfast: "bg-blue-100 text-blue-700",
  "Mid-morning Snack": "bg-amber-100 text-amber-700",
  Lunch: "bg-emerald-100 text-emerald-700",
  "Evening Snack": "bg-amber-100 text-amber-700",
  Dinner: "bg-indigo-100 text-indigo-700"
};

export default function MealCard({
  meal,
  dayIndex,
  mealIndex,
  planId,
  onModified,
  dailyCalorieTarget
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [portion, setPortion] = useState("full");
  const [customGrams, setCustomGrams] = useState("");
  const [logging, setLogging] = useState(false);

  const ratio = useMemo(() => {
    if (portion === "half") return 0.5;
    if (portion === "custom") {
      const grams = Number(customGrams || 0);
      return grams ? grams / 100 : 1;
    }
    return 1;
  }, [portion, customGrams]);

  const logMeal = async () => {
    setLogging(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await api.post("/logs/meal", {
        date: today,
        mealType: meal.mealType,
        foodName: meal.name,
        quantityG: Math.round(100 * ratio),
        calories: Math.round(meal.calories * ratio),
        protein_g: Math.round(meal.protein_g * ratio),
        carbs_g: Math.round(meal.carbs_g * ratio),
        fat_g: Math.round(meal.fat_g * ratio)
      });
    } catch (error) {
      console.error("Meal log failed", error);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="card p-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-start justify-between text-left"
      >
        <div>
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              badgeColor[meal.mealType] || "bg-gray-100 text-gray-600"
            }`}
          >
            {meal.mealType}
          </span>
          <h4 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
            {meal.name}
          </h4>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
            <span className="rounded-full border border-[var(--border)] px-2 py-1">
              {meal.prepTime} min
            </span>
            <span className="rounded-full border border-[var(--border)] px-2 py-1">
              {meal.calories} cal
            </span>
            <span className="rounded-full border border-[var(--border)] px-2 py-1">
              {meal.protein_g}g protein
            </span>
            <span className="rounded-full border border-[var(--border)] px-2 py-1">
              {meal.carbs_g}g carbs
            </span>
            <span className="rounded-full border border-[var(--border)] px-2 py-1">
              {meal.fat_g}g fat
            </span>
          </div>
        </div>
        <ChevronDown size={18} className={`${open ? "rotate-180" : ""} transition`} />
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
          {meal.ingredients?.length > 0 && (
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Ingredients</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {meal.ingredients.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {meal.instructions && (
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Instructions</p>
              <p className="mt-2 whitespace-pre-line">{meal.instructions}</p>
            </div>
          )}
          {meal.videoSearch && (
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                meal.videoSearch
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-[var(--accent)]"
            >
              Watch Demo
            </a>
          )}

          <div className="flex flex-wrap gap-2">
            {[
              { label: "Full", value: "full" },
              { label: "Half", value: "half" },
              { label: "Custom", value: "custom" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPortion(option.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  portion === option.value
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {option.label}
              </button>
            ))}
            {portion === "custom" && (
              <input
                type="number"
                value={customGrams}
                onChange={(event) => setCustomGrams(event.target.value)}
                placeholder="grams"
                className="w-24 rounded-full border border-[var(--border)] px-3 py-1 text-xs"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={logMeal}
              disabled={logging}
              className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {logging ? "Logging..." : "Log This Meal"}
            </button>
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
            >
              <Pencil size={14} />
              Edit with AI
            </button>
          </div>

          {editing && (
            <AIModifyPanel
              mode="diet"
              dayIndex={dayIndex}
              itemIndex={mealIndex}
              planId={planId}
              currentItem={meal}
              dailyCalorieTarget={dailyCalorieTarget}
              onModified={onModified}
              onClose={() => setEditing(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
