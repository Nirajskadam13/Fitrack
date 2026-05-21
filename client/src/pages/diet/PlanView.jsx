import { useContext, useEffect, useState } from "react";
import api from "../../lib/axios.js";
import MealCard from "../../components/MealCard.jsx";
import { ToastContext } from "../../context/ToastContext.jsx";

export default function DietPlanView() {
  const { showToast } = useContext(ToastContext);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(0);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get("/diet/plan");
        if (!isMounted) return;
        setPlan(response.data.plan);
        setPlanId(response.data.planId);
        setDailyCalorieTarget(response.data.dailyCalorieTarget || 0);
      } catch (error) {
        console.error("Diet plan load failed", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const weekPlan = plan?.weekPlan || [];
  const dayPlan = weekPlan[activeDay];
  const macroTargets = plan?.macroSplit?.protein_g
    ? plan.macroSplit
    : dailyCalorieTarget
    ? {
        protein_g: Math.round((dailyCalorieTarget * 0.3) / 4),
        carbs_g: Math.round((dailyCalorieTarget * 0.4) / 4),
        fat_g: Math.round((dailyCalorieTarget * 0.3) / 9)
      }
    : { protein_g: 0, carbs_g: 0, fat_g: 0 };

  const handleModified = (mealIndex, updatedMeal) => {
    setPlan((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.weekPlan[activeDay].meals[mealIndex] = updatedMeal;
      return next;
    });
    showToast("Meal updated", "success");
  };

  const logAllMeals = async () => {
    if (!dayPlan?.meals?.length) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      await Promise.all(
        dayPlan.meals.map((meal) =>
          api.post("/logs/meal", {
            date: today,
            mealType: meal.mealType,
            foodName: meal.name,
            quantityG: 100,
            calories: meal.calories,
            protein_g: meal.protein_g,
            carbs_g: meal.carbs_g,
            fat_g: meal.fat_g
          })
        )
      );
      showToast("Meals logged", "success");
    } catch (error) {
      console.error("Log all meals failed", error);
    }
  };

  if (loading) {
    return <div className="skeleton h-64 w-full" />;
  }

  if (!plan) {
    return (
      <div className="card p-6 text-sm text-[var(--text-secondary)]">
        No diet plan yet. Complete onboarding to generate one.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {weekPlan.map((day, index) => (
          <button
            key={day.day}
            type="button"
            onClick={() => setActiveDay(index)}
            className={`min-w-[90px] rounded-xl border px-3 py-2 text-xs font-semibold ${
              activeDay === index
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-secondary)]"
            }`}
          >
            <div>{day.day.slice(0, 3)}</div>
            <div className="mt-1 text-[10px]">{day.meals?.length || 0} meals</div>
          </button>
        ))}
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
        <div className="flex flex-wrap gap-4 text-[var(--text-secondary)]">
          <span>
            Target Calories: <strong className="text-[var(--text-primary)]">{dailyCalorieTarget}</strong>
          </span>
          <span>
            Protein: <strong className="text-[var(--text-primary)]">{macroTargets.protein_g}g</strong>
          </span>
          <span>
            Carbs: <strong className="text-[var(--text-primary)]">{macroTargets.carbs_g}g</strong>
          </span>
          <span>
            Fat: <strong className="text-[var(--text-primary)]">{macroTargets.fat_g}g</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={logAllMeals}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
        >
          Log All as Planned
        </button>
      </div>

      <div className="space-y-4">
        {dayPlan?.meals?.map((meal, index) => (
          <MealCard
            key={`${meal.name}-${index}`}
            meal={meal}
            dayIndex={activeDay}
            mealIndex={index}
            planId={planId}
            dailyCalorieTarget={dailyCalorieTarget}
            onModified={(updatedMeal) => handleModified(index, updatedMeal)}
          />
        ))}
      </div>
    </div>
  );
}
