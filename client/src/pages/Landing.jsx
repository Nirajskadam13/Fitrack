import { Link } from "react-router-dom";
import { ChevronRight, Dumbbell, Salad, TrendingUp } from "lucide-react";

const features = [
  {
    title: "AI Workout Plans",
    description:
      "Personalized daily workout plans based on your equipment, goals and fitness level. Updates as you progress.",
    icon: Dumbbell
  },
  {
    title: "Smart Nutrition",
    description:
      "Day-by-day meal plans with beginner-friendly recipes using home ingredients.",
    icon: Salad
  },
  {
    title: "Full Tracking",
    description:
      "Log every session and meal. Watch your weight, strength and consistency improve week by week.",
    icon: TrendingUp
  }
];

const steps = [
  {
    title: "Fill Your Profile",
    description: "Height, weight, goal, equipment and preferences."
  },
  {
    title: "AI Builds Your Plans",
    description: "Workout and diet plans generated in seconds."
  },
  {
    title: "Log and Improve",
    description: "Track sessions, meals and progress daily."
  }
];

export default function Landing() {
  return (
    <div className="page-enter">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 shadow-lg">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.18),transparent_55%)]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
            FitTrack
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-5xl">
            Track Your Fitness. Transform Your Body.
          </h1>
          <p className="mt-4 text-base text-[var(--text-secondary)] sm:text-lg">
            AI-powered workout and nutrition plans built around your goals, equipment and lifestyle.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              Get Started Free
              <ChevronRight size={16} />
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--accent)]">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {feature.description}
              </p>
            </div>
          );
        })}
      </section>

      <section id="how-it-works" className="mt-16">
        <div className="flex flex-col gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
            How It Works
          </p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            Three simple steps to a smarter routine
          </h2>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="card p-6">
              <div className="text-xs font-semibold text-[var(--accent)]">
                Step {index + 1}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="card flex flex-col items-center justify-between gap-4 px-6 py-8 text-center md:flex-row md:text-left">
          <div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              Ready to transform?
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Build your plans in minutes and start tracking today.
            </p>
          </div>
          <Link
            to="/auth"
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
