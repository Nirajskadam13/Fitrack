import { useState } from "react";
import api from "../lib/axios.js";

const suggestionMap = {
  fitness: [
    "Replace with floor version",
    "Give a lighter weight alternative",
    "Swap to bodyweight",
    "Make it easier"
  ],
  diet: [
    "Give a vegetarian alternative",
    "Use simpler ingredients",
    "Lower calorie version",
    "Higher protein option"
  ]
};

export default function AIModifyPanel({
  dayIndex,
  section,
  itemIndex,
  planId,
  currentItem,
  onModified,
  onClose,
  mode,
  dailyCalorieTarget,
  pairKey
}) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestions = suggestionMap[mode] || [];

  const handleSubmit = async () => {
    if (!instruction.trim()) {
      setError("Please describe your change.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (mode === "fitness") {
        const response = await api.post("/fitness/modify-section", {
          planId,
          dayIndex,
          section,
          itemIndex,
          userInstruction: instruction,
          currentItem,
          pairKey
        });
        onModified(response.data.updatedItem);
      } else {
        const response = await api.post("/diet/modify-meal", {
          planId,
          dayIndex,
          mealIndex: itemIndex,
          userInstruction: instruction,
          currentMeal: currentItem,
          dailyCalorieTarget
        });
        onModified(response.data.updatedMeal);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "AI update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <textarea
        rows={3}
        placeholder="Describe the change you want..."
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setInstruction(suggestion)}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]"
          >
            {suggestion}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Asking AI..." : "Ask AI"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
