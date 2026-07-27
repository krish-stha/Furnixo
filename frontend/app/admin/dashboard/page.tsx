"use client";
 
import { useEffect, useRef, useState } from "react";
import {
  Banknote,
  ShoppingBag,
  CheckCircle2,
  Users,
  Package,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
 
import { adminDashboardSummary } from "@/lib/api/admin/dashboard";
import { StatCard } from "../components/StatCard";
import { RevenueChart } from "../components/RevenueChart";
import { RecentUsers } from "../components/RecentUsers";
import { RecentOrders } from "../components/RecentOrders";
 
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
 
type GroupBy = "day" | "month";
 
const inputCls =
  "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
 
export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
 
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
 
  const load = async (params?: {
    months?: number;
    from?: string;
    to?: string;
    groupBy?: GroupBy;
  }) => {
    try {
      setLoading(true);
      const res = await adminDashboardSummary(params);
      setData(res?.data);
      setErr(null);
      setLastRefresh(new Date());
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  };
 
  // default: last 30 days
  useEffect(() => {
    const now = new Date();
    const d = new Date();
    d.setDate(now.getDate() - 29);
    const f = ymd(d);
    const t = ymd(now);
    setFrom(f);
    setTo(t);
    load({ months: 6, from: f, to: t, groupBy: "day" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  // ── Auto-refresh every 5 minutes ──────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      load({ months: 6, from: from || undefined, to: to || undefined, groupBy: from && to ? "day" : "month" });
    }, 5 * 60 * 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);
 
  const apply = () => {
    if (from && to && from > to) return setErr("'From' date cannot be after 'To' date");
    setErr(null);
    load({ months: 6, from: from || undefined, to: to || undefined, groupBy: from && to ? "day" : "month" });
  };
 
  const clear = () => {
    setFrom(""); setTo(""); setErr(null);
    load({ months: 6, groupBy: "month" });
  };
 
  const setQuick = (days: number) => {
    const now = new Date();
    const d = new Date();
    if (days === 0) { const t = ymd(now); setFrom(t); setTo(t); setErr(null); load({ months: 6, from: t, to: t, groupBy: "day" }); return; }
    d.setDate(now.getDate() - (days - 1));
    const f = ymd(d); const t = ymd(now);
    setFrom(f); setTo(t); setErr(null);
    load({ months: 6, from: f, to: t, groupBy: "day" });
  };
 
  const totals = data?.totals ?? {};
 
  return (
    <div className="space-y-6">
      {/* ── Page head ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Store overview · live data
            {lastRefresh && (
              <span className="ml-2 text-neutral-400">
                · last updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
 
        {/* ── Filter bar ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* quick pills */}
          {[
            { label: "Today", days: 0 },
            { label: "7D", days: 7 },
            { label: "30D", days: 30 },
          ].map(({ label, days }) => (
            <button
              key={label}
              onClick={() => setQuick(days)}
              disabled={loading}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white disabled:opacity-50"
            >
              {label}
            </button>
          ))}
 
          <div className="h-5 w-px bg-neutral-200" />
 
          {/* date inputs */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-400">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-400">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </div>
 
          <button
            onClick={apply}
            disabled={loading}
            className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
          >
            Apply
          </button>
          <button
            onClick={clear}
            disabled={loading}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-400 disabled:opacity-50"
          >
            Clear
          </button>
 
          {/* manual refresh */}
          <button
            onClick={() => load({ months: 6, from: from || undefined, to: to || undefined, groupBy: from && to ? "day" : "month" })}
            disabled={loading}
            title="Refresh now"
            className="rounded-lg border border-neutral-200 p-1.5 text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.8} />
          </button>
        </div>
      </div>
 
      {/* ── Error ── */}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}
 
      {/* ── KPI Row 1: Revenue + Orders (4 cards) ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={loading ? "…" : `Rs. ${Number(totals.revenue ?? 0).toLocaleString("en-IN")}`}
          icon={Banknote}
          href="/admin/orders"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={loading ? "…" : totals.orders ?? 0}
          icon={ShoppingBag}
          href="/admin/orders"
          loading={loading}
        />
        <StatCard
          title="Paid Orders"
          value={loading ? "…" : totals.paidOrders ?? 0}
          icon={CheckCircle2}
          href="/admin/payments"
          loading={loading}
        />
        <StatCard
          title="Total Users"
          value={loading ? "…" : totals.users ?? 0}
          icon={Users}
          href="/admin/users"
          loading={loading}
        />
      </div>
 
      {/* ── KPI Row 2: Store health (3 cards) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Products"
          value={loading ? "…" : totals.products ?? 0}
          icon={Package}
          href="/admin/items"
          loading={loading}
        />
        <StatCard
          title="Low Stock"
          value={loading ? "…" : data?.lowStockCount ?? 0}
          icon={AlertTriangle}
          href="/admin/inventory/low-stock"
          loading={loading}
          accent={Number(data?.lowStockCount) > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Pending Refunds"
          value={loading ? "…" : data?.pendingRefunds ?? 0}
          icon={RotateCcw}
          href="/admin/payments"
          loading={loading}
          accent={Number(data?.pendingRefunds) > 0 ? "danger" : "default"}
        />
      </div>
 
      {/* ── Dark revenue chart ── */}
      <RevenueChart
        loading={loading}
        rows={data?.revenueTrend ?? []}
        from={from}
        to={to}
        chartType={data?.filters?.chartType ?? (from && to ? "day" : "month")}
      />
 
      {/* ── Recent tables ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentOrders loading={loading} rows={data?.recentOrders ?? []} />
        <RecentUsers loading={loading} rows={data?.recentUsers ?? []} />
      </div>
    </div>
  );
}