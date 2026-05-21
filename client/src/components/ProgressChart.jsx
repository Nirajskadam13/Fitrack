import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export default function ProgressChart({
  data,
  xKey,
  yKey,
  label,
  color,
  unit,
  referenceLineY,
  chartType = "line"
}) {
  const chartColor = color || "var(--accent)";

  const Chart = chartType === "bar" ? BarChart : LineChart;
  const Series = chartType === "bar" ? Bar : Line;
  const seriesProps =
    chartType === "bar"
      ? { dataKey: yKey, fill: chartColor }
      : { dataKey: yKey, stroke: chartColor, strokeWidth: 2, dot: true };

  return (
    <div className="card p-4">
      <div className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{label}</div>
      <ResponsiveContainer width="100%" height={220}>
        <Chart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            tickFormatter={(value) => `${value}${unit || ""}`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8
            }}
            labelStyle={{ color: "var(--text-secondary)" }}
          />
          {referenceLineY !== undefined && (
            <ReferenceLine
              y={referenceLineY}
              stroke="var(--warning)"
              strokeDasharray="4 4"
            />
          )}
          <Series {...seriesProps} />
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
