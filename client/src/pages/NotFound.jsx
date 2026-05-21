import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-semibold text-[var(--text-primary)]">404</h1>
      <p className="text-sm text-[var(--text-secondary)]">Page not found.</p>
      <Link
        to="/dashboard"
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
