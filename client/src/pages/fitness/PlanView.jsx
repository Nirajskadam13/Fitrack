import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Sparkles, Star, Zap } from "lucide-react";
import api from "../../lib/axios.js";
import ExerciseCard from "../../components/ExerciseCard.jsx";
import { ToastContext } from "../../context/ToastContext.jsx";

const sectionConfig = [
  { key: "warmup", label: "Warm-up", icon: Flame },
  { key: "mainExercises", label: "Main Exercises", icon: Zap },
  { key: "supersets", label: "Supersets", icon: Sparkles },
  { key: "abSupersets", label: "Ab Supersets", icon: Sparkles },
  { key: "optional", label: "Optional", icon: Star },
  { key: "stretching", label: "Stretching", icon: Flame }
];

export default function FitnessPlanView() {
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [openSections, setOpenSections] = useState({ warmup: true });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get("/fitness/plan");
        if (!isMounted) return;
        setPlan(response.data.plan);
        setPlanId(response.data.planId);
      } catch (error) {
        console.error("Fitness plan load failed", error);
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
  const dayData = weekPlan[activeDay];

  const handleModified = (section, itemIndex, updatedItem, pairKey) => {
    setPlan((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (pairKey) {
        next.weekPlan[activeDay][section][itemIndex][pairKey] = updatedItem;
      } else {
        next.weekPlan[activeDay][section][itemIndex] = updatedItem;
      }
      return next;
    });
    showToast("Exercise updated", "success");
  };

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return <div className="skeleton h-64 w-full" />;
  }

  if (!plan) {
    return (
      <div className="card p-6 text-sm text-[var(--text-secondary)]">
        No fitness plan yet. Complete onboarding to generate one.
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
            <div className="mt-1 text-[10px]">
              {day.restDay ? "Rest" : day.muscleGroup?.split(" ")[0]}
            </div>
          </button>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {dayData?.day} - {dayData?.muscleGroup}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              50 min - {dayData?.mainExercises?.length || 0} main exercises
            </p>
          </div>
          {!dayData?.restDay && (
            <button
              type="button"
              onClick={() => navigate(`/fitness/session?day=${activeDay}`)}
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Start Session
            </button>
          )}
        </div>
      </div>

      {dayData?.restDay ? (
        <div className="card p-6 text-sm text-[var(--text-secondary)]">
          Rest day. Focus on recovery, hydration and light mobility.
        </div>
      ) : (
        <div className="space-y-4">
          {sectionConfig.map((section) => {
            const items = dayData?.[section.key] || [];
            const Icon = section.icon;
            return (
              <div key={section.key} className="card p-4">
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    <Icon size={16} />
                    {section.label} ({items.length})
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {openSections[section.key] ? "Hide" : "Show"}
                  </span>
                </button>

                {openSections[section.key] && (
                  <div className="mt-4 space-y-3">
                    {section.key === "supersets" || section.key === "abSupersets" ? (
                      items.map((pair, index) => (
                        <div key={index} className="grid gap-3 md:grid-cols-2">
                          <ExerciseCard
                            exercise={pair.exerciseA}
                            dayIndex={activeDay}
                            section={section.key}
                            itemIndex={index}
                            pairKey="exerciseA"
                            planId={planId}
                            onModified={(updated) =>
                              handleModified(section.key, index, updated, "exerciseA")
                            }
                          />
                          <ExerciseCard
                            exercise={pair.exerciseB}
                            dayIndex={activeDay}
                            section={section.key}
                            itemIndex={index}
                            pairKey="exerciseB"
                            planId={planId}
                            onModified={(updated) =>
                              handleModified(section.key, index, updated, "exerciseB")
                            }
                          />
                        </div>
                      ))
                    ) : (
                      items.map((exercise, index) => (
                        <ExerciseCard
                          key={`${section.key}-${index}`}
                          exercise={exercise}
                          dayIndex={activeDay}
                          section={section.key}
                          itemIndex={index}
                          planId={planId}
                          onModified={(updated) =>
                            handleModified(section.key, index, updated)
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
