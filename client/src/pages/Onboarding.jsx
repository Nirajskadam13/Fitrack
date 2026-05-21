import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios.js";
import { useAuth } from "../hooks/useAuth.js";

const steps = [
  "Personal Info",
  "Fitness Goal",
  "Workout Location",
  "Equipment",
  "Activity Level",
  "Review"
];

const goalOptions = [
  { value: "Lose Body Fat", label: "Lose Body Fat" },
  { value: "Build Visible Muscle", label: "Build Visible Muscle" },
  { value: "Both", label: "Both" }
];

const locationOptions = [
  { value: "Home", label: "Home Workout" },
  { value: "Gym", label: "Gym" }
];

const equipmentOptions = [
  { value: "Dumbbell Rods (pair)", defaultChecked: true },
  { value: "Barbell Extender (1)", defaultChecked: true },
  { value: "Weight Plates 2.5kg x4", defaultChecked: true },
  { value: "Pull-up Bar" },
  { value: "Resistance Bands" },
  { value: "Bench" },
  { value: "Bodyweight Only" }
];

const activityOptions = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" }
];

const loadingMessages = [
  "Analyzing your profile...",
  "Generating your workout plan with AI... (1/2)",
  "Generating your nutrition plan with AI... (2/2)",
  "Saving everything..."
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const calcBMI = (weight, height) => {
  if (!weight || !height) return 0;
  const h = Number(height) / 100;
  return Number(weight) / (h * h);
};

const calcTDEE = (data) => {
  const weight = Number(data.weight_kg || 0);
  const height = Number(data.height_cm || 0);
  const age = Number(data.age || 0);
  const gender = String(data.gender || "").toLowerCase();

  const bmrBase = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === "male" ? bmrBase + 5 : bmrBase - 161;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  };

  const activityKey = String(data.activity_level || "sedentary").toLowerCase();
  return bmr * (multipliers[activityKey] || 1.2);
};

const calcCalorieTarget = (data, tdee) => {
  const goal = String(data.goal || "").toLowerCase();
  let target = tdee - 300;
  if (goal.includes("fat")) {
    target = tdee - 500;
  } else if (goal.includes("muscle")) {
    target = tdee + 200;
  }

  return Math.max(1400, Math.round(target));
};

export default function Onboarding() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loadingStage, setLoadingStage] = useState(null);

  const [formData, setFormData] = useState({
    name: auth.user?.name || "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    goal: goalOptions[2].value,
    target_date: "",
    workout_location: "",
    equipment: equipmentOptions
      .filter((opt) => opt.defaultChecked)
      .map((opt) => opt.value),
    activity_level: ""
  });

  const progress = useMemo(() => (step / steps.length) * 100, [step]);
  const bmi = useMemo(
    () => calcBMI(formData.weight_kg, formData.height_cm),
    [formData.weight_kg, formData.height_cm]
  );
  const tdee = useMemo(() => calcTDEE(formData), [formData]);
  const calorieTarget = useMemo(
    () => calcCalorieTarget(formData, tdee),
    [formData, tdee]
  );

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEquipment = (value) => {
    setFormData((prev) => {
      const exists = prev.equipment.includes(value);
      return {
        ...prev,
        equipment: exists
          ? prev.equipment.filter((item) => item !== value)
          : [...prev.equipment, value]
      };
    });
  };

  const isStepValid = () => {
    if (step === 1) {
      return (
        formData.name &&
        formData.age &&
        formData.gender &&
        formData.height_cm &&
        formData.weight_kg
      );
    }
    if (step === 2) {
      return formData.goal && formData.target_date;
    }
    if (step === 3) {
      return formData.workout_location;
    }
    if (step === 4) {
      return formData.equipment.length > 0;
    }
    if (step === 5) {
      return formData.activity_level;
    }
    return true;
  };

  const handleNext = () => {
    if (!isStepValid()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGenerate = async () => {
    setError("");
    setLoadingStage(0);
    try {
      await delay(500);
      setLoadingStage(1);
      await api.post("/fitness/generate", formData);
      setLoadingStage(2);
      await api.post("/diet/generate", formData);
      setLoadingStage(3);
      await delay(500);
      const response = await api.patch("/auth/profile", formData);
      auth.updateProfile(response.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.error || "Plan generation failed.");
      setLoadingStage(null);
    }
  };

  return (
    <div className="relative mx-auto max-w-3xl page-enter">
      {loadingStage !== null && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-black/40 backdrop-blur">
          <div className="card flex w-full max-w-sm flex-col items-center gap-3 p-6 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--accent)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              {loadingMessages[loadingStage]}
            </p>
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Step {step} of {steps.length}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              {steps[step - 1]}
            </h2>
          </div>
          <div className="h-2 w-28 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
            <div
              className="h-full bg-[var(--accent)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(event) => updateField("age", event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Gender
              </label>
              <div className="mt-2 flex gap-3">
                {["Male", "Female", "Other"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField("gender", option)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      formData.gender === option
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Height (cm)
              </label>
              <input
                type="number"
                value={formData.height_cm}
                onChange={(event) => updateField("height_cm", event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Weight (kg)
              </label>
              <input
                type="number"
                value={formData.weight_kg}
                onChange={(event) => updateField("weight_kg", event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Pick your main goal
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {goalOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("goal", option.value)}
                  className={`card p-4 text-left text-sm font-semibold ${
                    formData.goal === option.value
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                I want to reach my goal by:
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(event) => updateField("target_date", event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {locationOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField("workout_location", option.value)}
                className={`card p-4 text-left text-sm font-semibold ${
                  formData.workout_location === option.value
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Your current setup allows up to 10kg per dumbbell.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {equipmentOptions.map((option) => {
                const isSelected = formData.equipment.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleEquipment(option.value)}
                    className={`card flex items-center justify-between p-4 text-sm font-semibold ${
                      isSelected
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    <span>{option.value}</span>
                    <span>{isSelected ? "Selected" : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {activityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField("activity_level", option.value)}
                className={`card p-4 text-left text-sm font-semibold ${
                  formData.activity_level === option.value
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {step === 6 && (
          <div className="mt-6 space-y-4">
            <div className="card space-y-2 p-4 text-sm text-[var(--text-secondary)]">
              <p>
                <span className="font-semibold text-[var(--text-primary)]">Name:</span>{" "}
                {formData.name}
              </p>
              <p>
                <span className="font-semibold text-[var(--text-primary)]">Goal:</span>{" "}
                {formData.goal}
              </p>
              <p>
                <span className="font-semibold text-[var(--text-primary)]">Workout:</span>{" "}
                {formData.workout_location}
              </p>
              <p>
                <span className="font-semibold text-[var(--text-primary)]">Equipment:</span>{" "}
                {formData.equipment.join(", ")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="card p-4 text-center">
                <p className="text-xs text-[var(--text-secondary)]">BMI</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {bmi ? bmi.toFixed(1) : "-"}
                </p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-[var(--text-secondary)]">Est. Daily Calories</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {Math.round(tdee) || "-"}
                </p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-[var(--text-secondary)]">Calorie Target</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {calorieTarget}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              Generate My Plans
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] disabled:opacity-50"
          >
            Back
          </button>
          {step < steps.length && (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
