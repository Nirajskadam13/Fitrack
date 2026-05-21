import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../lib/axios.js";
import SetLogger from "../../components/SetLogger.jsx";

const parseNumber = (value) => {
  const match = String(value || "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const flattenExercises = (dayPlan) => {
  if (!dayPlan) return [];
  const list = [];
  const pushAll = (items, section) => {
    items.forEach((exercise) => list.push({ ...exercise, section }));
  };
  pushAll(dayPlan.warmup || [], "Warm-up");
  pushAll(dayPlan.mainExercises || [], "Main Exercises");
  (dayPlan.supersets || []).forEach((pair) => {
    list.push({ ...pair.exerciseA, section: "Supersets" });
    list.push({ ...pair.exerciseB, section: "Supersets" });
  });
  (dayPlan.abSupersets || []).forEach((pair) => {
    list.push({ ...pair.exerciseA, section: "Ab Supersets" });
    list.push({ ...pair.exerciseB, section: "Ab Supersets" });
  });
  pushAll(dayPlan.optional || [], "Optional");
  pushAll(dayPlan.stretching || [], "Stretching");
  return list;
};

export default function SessionLog() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loggedExercises, setLoggedExercises] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [transition, setTransition] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const prevSection = useRef(null);
  const sessionStart = useRef(Date.now());

  const dayIndex = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Number(params.get("day") || 0);
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await api.get("/fitness/plan");
        if (!isMounted) return;
        setPlan(response.data.plan);
      } catch (error) {
        console.error("Session plan load failed", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dayPlan = plan?.weekPlan?.[dayIndex];
  const exercises = useMemo(() => flattenExercises(dayPlan), [dayPlan]);
  const currentExercise = exercises[currentIndex];

  useEffect(() => {
    if (!currentExercise) return;
    if (prevSection.current && prevSection.current !== currentExercise.section) {
      setTransition(`Moving to ${currentExercise.section}`);
      setTimeout(() => setTransition(null), 1000);
    }
    prevSection.current = currentExercise.section;
  }, [currentExercise]);

  useEffect(() => {
    if (currentIndex >= exercises.length && exercises.length) {
      setIsComplete(true);
    }
  }, [currentIndex, exercises.length]);

  useEffect(() => {
    if (!isComplete || !dayPlan) return;
    const totalVolume = loggedExercises.reduce(
      (sum, ex) => sum + Number(ex.totalVolume || 0),
      0
    );
    const durationMins = Math.ceil(elapsed / 60);
    api.post("/logs/workout-session", {
      date: new Date().toISOString().split("T")[0],
      dayName: dayPlan.day,
      muscleGroup: dayPlan.muscleGroup,
      exercisesLogged: loggedExercises,
      durationMins,
      totalVolumeKg: totalVolume
    });
  }, [isComplete, dayPlan, elapsed, loggedExercises]);

  const handleSetComplete = (summary) => {
    setLoggedExercises((prev) => [...prev, summary]);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleEndEarly = async () => {
    const confirmEnd = window.confirm("End this session early?");
    if (!confirmEnd) return;
    setIsComplete(true);
  };

  if (loading) {
    return <div className="skeleton h-64 w-full" />;
  }

  if (!dayPlan) {
    return (
      <div className="card p-6 text-sm text-[var(--text-secondary)]">
        No plan found. Go back to your fitness plan.
      </div>
    );
  }

  if (isComplete) {
    const totalVolume = loggedExercises.reduce(
      (sum, ex) => sum + Number(ex.totalVolume || 0),
      0
    );
    const suggestions = (dayPlan.mainExercises || [])
      .map((exercise) => {
        const logged = loggedExercises.find((item) => item.name === exercise.name);
        if (!logged) return null;
        const targetWeight = parseNumber(exercise.weight);
        if (logged.maxWeightUsed >= targetWeight && targetWeight > 0) {
          return `You hit your targets. Consider +2.5kg on ${exercise.name} next session.`;
        }
        return null;
      })
      .filter(Boolean);

    return (
      <div className="card space-y-4 p-6 text-center">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Session Complete</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Duration: {Math.ceil(elapsed / 60)} mins - Total Volume: {Math.round(totalVolume)} kg
        </p>
        {suggestions.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-left text-xs text-[var(--text-secondary)]">
            {suggestions.map((item, index) => (
              <p key={index}>{item}</p>
            ))}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/fitness/plan")}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
          >
            Back to Plan
          </button>
          <button
            type="button"
            onClick={() => navigate("/progress")}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
          >
            View Progress
          </button>
        </div>
      </div>
    );
  }

  const progress = exercises.length ? ((currentIndex + 1) / exercises.length) * 100 : 0;
  const elapsedMinutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const elapsedSeconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>
            Exercise {currentIndex + 1} of {exercises.length}
          </span>
          <span>
            {dayPlan.day} - {dayPlan.muscleGroup}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--bg-secondary)]">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>Elapsed: {elapsedMinutes}:{elapsedSeconds}</span>
          <button
            type="button"
            onClick={handleEndEarly}
            className="rounded-full border border-[var(--border)] px-3 py-1"
          >
            End Early
          </button>
        </div>
      </div>

      {transition && (
        <div className="card p-4 text-center text-sm text-[var(--text-secondary)]">
          {transition}
        </div>
      )}

      {currentExercise && (
        <div className="card space-y-3 p-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {currentExercise.name}
          </h3>
          {currentExercise.targetMuscles && (
            <p className="text-sm text-[var(--text-secondary)]">
              Targets: {currentExercise.targetMuscles}
            </p>
          )}
          {currentExercise.videoSearch && (
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                currentExercise.videoSearch
              )}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-[var(--accent)]"
            >
              Watch Demo
            </a>
          )}
          <SetLogger exercise={currentExercise} onAllSetsDone={handleSetComplete} />
        </div>
      )}

      <div className="card p-4">
        <p className="text-xs font-semibold text-[var(--text-secondary)]">Exercise Queue</p>
        <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-2">
          {exercises.map((exercise, index) => (
            <button
              key={`${exercise.name}-${index}`}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs ${
                index === currentIndex
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : index < currentIndex
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              <span>{exercise.name}</span>
              <span>{exercise.section}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
