import { useMemo, useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import AIModifyPanel from "./AIModifyPanel.jsx";

const parseList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(/\.|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function ExerciseCard({
  exercise,
  dayIndex,
  section,
  itemIndex,
  planId,
  onModified,
  pairKey
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const executionSteps = useMemo(() => parseList(exercise.execution), [exercise.execution]);
  const mistakes = useMemo(() => parseList(exercise.mistakes), [exercise.mistakes]);
  const formNotes = useMemo(() => {
    if (!exercise.form) return [];
    if (typeof exercise.form === "string") return [exercise.form];
    return Object.entries(exercise.form).map(([key, value]) => `${key}: ${value}`);
  }, [exercise.form]);

  return (
    <div className="card p-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {exercise.name}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
            {exercise.equipment && (
              <span className="rounded-full border border-[var(--border)] px-2 py-1">
                {exercise.equipment}
              </span>
            )}
            {exercise.sets && exercise.reps && (
              <span className="rounded-full border border-[var(--border)] px-2 py-1">
                {exercise.sets} sets x {exercise.reps}
              </span>
            )}
            {exercise.rest && (
              <span className="rounded-full border border-[var(--border)] px-2 py-1">
                Rest {exercise.rest}
              </span>
            )}
            {typeof exercise.important === "boolean" && (
              <span
                className={`rounded-full px-2 py-1 ${
                  exercise.important
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {exercise.important ? "Important" : "Can Skip"}
              </span>
            )}
          </div>
        </div>
        <ChevronDown size={18} className={`${open ? "rotate-180" : ""} transition`} />
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
          {exercise.targetMuscles && (
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Targets:</span>{" "}
              {exercise.targetMuscles}
            </p>
          )}
          {executionSteps.length > 0 && (
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Execution</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {executionSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          {formNotes.length > 0 && (
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Form</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {formNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}
          {mistakes.length > 0 && (
            <div>
              <p className="font-semibold text-[var(--danger)]">Common Mistakes</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {mistakes.map((mistake, index) => (
                  <li key={index}>{mistake}</li>
                ))}
              </ul>
            </div>
          )}
          {exercise.breathing && (
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Breathing:</span>{" "}
              {exercise.breathing}
            </p>
          )}
          {exercise.tips && (
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Tips:</span>{" "}
              {exercise.tips}
            </p>
          )}
          {exercise.videoSearch && (
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                exercise.videoSearch
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-[var(--accent)]"
            >
              Watch Demo
            </a>
          )}

          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
          >
            <Pencil size={14} />
            Edit with AI
          </button>

          {editing && (
            <AIModifyPanel
              mode="fitness"
              dayIndex={dayIndex}
              section={section}
              itemIndex={itemIndex}
              planId={planId}
              currentItem={exercise}
              pairKey={pairKey}
              onModified={onModified}
              onClose={() => setEditing(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
