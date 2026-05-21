const colorMap = {
  indigo: "bg-indigo-100 text-indigo-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700"
};

export default function StatsCard({ icon, label, value, unit, color, subtitle }) {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          {label}
        </span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            colorMap[color] || colorMap.indigo
          }`}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-[var(--text-primary)]">
          {value}
        </span>
        {unit && <span className="text-xs text-[var(--text-secondary)]">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>}
    </div>
  );
}
