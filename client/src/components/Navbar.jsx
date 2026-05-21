import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Dumbbell,
  LayoutDashboard,
  Menu,
  Salad,
  TrendingUp,
  LogOut,
  X
} from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import { useAuth } from "../hooks/useAuth.js";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Fitness Plan", to: "/fitness/plan", icon: Dumbbell },
  { label: "Diet Plan", to: "/diet/plan", icon: Salad },
  { label: "Progress", to: "/progress", icon: TrendingUp }
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = useMemo(() => {
    if (!user?.name) return "FT";
    const parts = user.name.trim().split(" ").filter(Boolean);
    return parts.map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  }, [user]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="text-lg font-semibold text-[var(--text-primary)]">
          FitTrack
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 text-sm font-medium transition ${
                  isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3" ref={menuRef}>
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)]">
              {initials}
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-primary)] md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>

          {open && (
            <div className="absolute right-4 top-16 w-56 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-lg md:hidden">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)]">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {user?.name || "Member"}
                  </span>
                </div>
                <ThemeToggle />
              </div>
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={logout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
