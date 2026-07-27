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

function exportCSV(rows: any[], from?: string, to?: string) {
  const header = "Period,Revenue,Orders\n";

  const body = rows
    .map(
      (row: any) =>
        `${row.label ?? ""},${row.revenue ?? 0},${row.orders ?? 0}`,
    )
    .join("\n");

  const blob = new Blob([header + body], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download =
    from && to ? `revenue_${from}_${to}.csv` : "revenue_export.csv";

  anchor.click();
  URL.revokeObjectURL(url);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[150px] rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-neutral-500">{label}</p>

      {payload.map((item: any) => (
        <div
          key={item.dataKey}
          className="flex items-center justify-between gap-4 text-xs"
        >
          <span className="capitalize text-neutral-500">
            {item.dataKey === "revenue" ? "Revenue" : "Orders"}
          </span>

          <span className="font-semibold text-neutral-950">
            {item.dataKey === "revenue"
              ? `Rs. ${Number(item.value).toLocaleString("en-IN")}`
              : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

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

  const hasData =
    rows.length > 0 &&
    rows.some(
      (row) => Number(row.revenue) > 0 || Number(row.orders) > 0,
    );

  const chartProps = {
    data: rows,
    margin: {
      top: 12,
      right: 18,
      left: 4,
      bottom: 0,
    },
  };

  const axisProps = {
    axisLine: false,
    tickLine: false,
    tick: {
      fill: "#737373",
      fontSize: 11,
    },
  };

  const sharedElements = (
    <>
      <CartesianGrid
        vertical={false}
        stroke="#e5e5e5"
        strokeDasharray="4 4"
      />

      <XAxis
        dataKey="label"
        {...axisProps}
        minTickGap={20}
        tickMargin={10}
      />

      <YAxis
        {...axisProps}
        width={52}
        tickMargin={8}
        tickFormatter={(value) =>
          Number(value) >= 1000
            ? `${(Number(value) / 1000).toFixed(
                Number(value) % 1000 === 0 ? 0 : 1,
              )}k`
            : String(value)
        }
      />

      <Tooltip
        content={<CustomTooltip />}
        cursor={{
          stroke: "#a3a3a3",
          strokeWidth: 1,
          strokeDasharray: "4 4",
        }}
      />
    </>
  );

  const renderChart = () => {
    if (kind === "bar") {
      return (
        <BarChart {...chartProps}>
          {sharedElements}

          <Bar
            dataKey="revenue"
            fill="#171717"
            radius={[5, 5, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      );
    }

    if (kind === "line") {
      return (
        <LineChart {...chartProps}>
          {sharedElements}

          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#171717"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 5,
              fill: "#171717",
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      );
    }

    return (
      <AreaChart {...chartProps}>
        <defs>
          <linearGradient
            id="revenue-area-gradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#171717" stopOpacity={0.18} />
            <stop offset="90%" stopColor="#171717" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        {sharedElements}

        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#171717"
          strokeWidth={2.5}
          fill="url(#revenue-area-gradient)"
          dot={false}
          activeDot={{
            r: 5,
            fill: "#171717",
            stroke: "#ffffff",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    );
  };

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 px-5 py-5 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Revenue
          </p>

          <h3 className="mt-1 text-base font-bold text-neutral-950">
            {title}
          </h3>

          {from && to && (
            <p className="mt-1 text-xs text-neutral-500">
              {from} → {to} · Paid orders only
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
            {(["area", "line", "bar"] as ChartKind[]).map((chartKind) => (
              <button
                key={chartKind}
                type="button"
                onClick={() => setKind(chartKind)}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all",
                  kind === chartKind
                    ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200"
                    : "text-neutral-500 hover:text-neutral-950",
                ].join(" ")}
              >
                {chartKind}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => exportCSV(rows, from, to)}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="h-[320px] min-w-0 px-2 pb-4 pt-5 sm:px-5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />
          </div>
        ) : !hasData ? (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
            <p className="text-sm font-medium text-neutral-700">
              No revenue data
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              There are no paid orders for this period.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}