"use client";
 
import { useState } from "react";
import { Download } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  AreaChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
 
type ChartKind = "line" | "bar" | "area";
 
// ─── CSV export (client-side only) ──────────────────────────────────────────
function exportCSV(rows: any[], from?: string, to?: string) {
  const header = "Period,Revenue,Orders\n";
  const body = rows
    .map((r: any) => `${r.label ?? ""},${r.revenue ?? 0},${r.orders ?? 0}`)
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const name = from && to ? `revenue_${from}_${to}.csv` : "revenue_export.csv";
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
 
// ─── Custom tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-neutral-300">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-white">
          {p.dataKey === "revenue" ? "Revenue" : "Orders"}:{" "}
          <span className="font-bold">
            {p.dataKey === "revenue" ? `Rs. ${Number(p.value).toLocaleString("en-IN")}` : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}
 
// ─── RevenueChart ─────────────────────────────────────────────────────────────
export function RevenueChart({
  loading,
  rows,
  from,
  to,
  chartType,
}: {
  loading: boolean;
  rows: any[];
  from?: string;
  to?: string;
  chartType?: "day" | "month";
}) {
  const [kind, setKind] = useState<ChartKind>("area");
  const title = chartType === "day" ? "Daily Revenue" : "Monthly Revenue";
  const hasData = rows.length > 0 && rows.some((r) => Number(r.revenue) > 0);
 
  const chartProps = {
    data: rows,
    margin: { top: 8, right: 16, left: 0, bottom: 0 },
  };
  const axisProps = {
    stroke: "#525252",
    tick: { fill: "#737373", fontSize: 11 },
  };
  const gridProps = { stroke: "#404040", strokeDasharray: "4 4" };
 
  const renderChart = () => {
    const shared = (
      <>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip content={<CustomTooltip />} />
      </>
    );
 
    if (kind === "bar") {
      return (
        <BarChart {...chartProps}>
          {shared}
          <Bar dataKey="revenue" fill="#e5e5e5" radius={[3, 3, 0, 0]} />
        </BarChart>
      );
    }
    if (kind === "area") {
      return (
        <AreaChart {...chartProps}>
          <defs>
            <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          {shared}
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#ffffff"
            strokeWidth={2}
            fill="url(#rev-grad)"
            dot={false}
          />
        </AreaChart>
      );
    }
    return (
      <LineChart {...chartProps}>
        {shared}
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#ffffff"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#ffffff" }}
        />
      </LineChart>
    );
  };
 
  return (
    <div className="overflow-hidden rounded-xl bg-neutral-950 p-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Revenue
          </p>
          <h3 className="mt-1 text-base font-bold text-white">{title}</h3>
          {from && to && (
            <p className="mt-0.5 text-xs text-neutral-500">
              {from} → {to} · paid orders only
            </p>
          )}
        </div>
 
        <div className="flex items-center gap-2">
          {/* chart type toggle */}
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {(["area", "line", "bar"] as ChartKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={[
                  "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                  kind === k
                    ? "bg-white text-neutral-900"
                    : "text-neutral-400 hover:text-white",
                ].join(" ")}
              >
                {k}
              </button>
            ))}
          </div>
 
          {/* CSV export */}
          <button
            onClick={() => exportCSV(rows, from, to)}
            disabled={rows.length === 0}
            title="Export CSV"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:border-white/30 hover:text-white disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>
 
      {/* chart */}
      <div className="mt-6 h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        ) : !hasData ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-sm text-neutral-600">No revenue data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}