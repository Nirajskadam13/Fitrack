import { useEffect, useMemo, useState } from "react";

const parseNumber = (value) => {
  const match = String(value || "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : "";
};

const parseRestSeconds = (rest) => {
  if (!rest) return 60;
  const text = String(rest).toLowerCase();
  if (text.includes("min")) {
    const num = parseNumber(text);
    return num ? num * 60 : 60;
  }
  const num = parseNumber(text);
  return num || 60;
};

const beep = () => {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 660;
    gain.gain.value = 0.1;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      ctx.close();
    }, 120);
  } catch (error) {
    return;
  }
};

export default function SetLogger({ exercise, onAllSetsDone }) {
  const baseSets = Number(exercise.sets || 3) || 3;
  const baseWeight = parseNumber(exercise.weight);
  const baseReps = parseNumber(exercise.reps);
  const restSeconds = useMemo(() => parseRestSeconds(exercise.rest), [exercise.rest]);

  const [sets, setSets] = useState(
    Array.from({ length: baseSets }, () => ({
      weight: baseWeight,
      reps: baseReps,
      done: false
    }))
  );
  const [restRemaining, setRestRemaining] = useState(0);

  useEffect(() => {
    if (restRemaining <= 0) return;
    const interval = setInterval(() => {
      setRestRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [restRemaining]);

  useEffect(() => {
    if (restRemaining === 0 && sets.some((set) => set.done)) {
      beep();
    }
  }, [restRemaining, sets]);

  const logSet = (index) => {
    setSets((prev) =>
      prev.map((set, i) => (i === index ? { ...set, done: true } : set))
    );
    setRestRemaining(restSeconds);
  };

  useEffect(() => {
    if (sets.every((set) => set.done)) {
      const setsLogged = sets.map((set) => ({
        weight: Number(set.weight || 0),
        reps: Number(set.reps || 0)
      }));
      const maxWeightUsed = Math.max(...setsLogged.map((set) => set.weight || 0));
      const maxReps = Math.max(...setsLogged.map((set) => set.reps || 0));
      const totalVolume = setsLogged.reduce(
        (sum, set) => sum + set.weight * set.reps,
        0
      );
      onAllSetsDone({
        name: exercise.name,
        setsLogged,
        maxWeightUsed,
        totalVolume,
        maxReps
      });
    }
  }, [sets, exercise.name, onAllSetsDone]);

  return (
    <div className="space-y-3">
      {sets.map((set, index) => (
        <div
          key={index}
          className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 ${
            set.done ? "border-emerald-300 bg-emerald-50" : "border-[var(--border)]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              Set {index + 1}
            </span>
            <input
              type="number"
              value={set.weight}
              onChange={(event) =>
                setSets((prev) =>
                  prev.map((item, i) =>
                    i === index ? { ...item, weight: event.target.value } : item
                  )
                )
              }
              className="h-10 w-20 rounded-md border border-[var(--border)] px-2 text-sm"
              placeholder="kg"
            />
            <input
              type="number"
              value={set.reps}
              onChange={(event) =>
                setSets((prev) =>
                  prev.map((item, i) =>
                    i === index ? { ...item, reps: event.target.value } : item
                  )
                )
              }
              className="h-10 w-20 rounded-md border border-[var(--border)] px-2 text-sm"
              placeholder="reps"
            />
          </div>
          <button
            type="button"
            onClick={() => logSet(index)}
            disabled={set.done}
            className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
          >
            Log Set
          </button>
        </div>
      ))}

      {restRemaining > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-[var(--border)] px-3 py-2">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="6"
              strokeDasharray={`${(restRemaining / restSeconds) * 150} 150`}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
            />
          </svg>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Rest</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {restRemaining}s
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRestRemaining(0)}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]"
          >
            Skip Rest
          </button>
        </div>
      )}
    </div>
  );
}
