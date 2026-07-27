"use client";
 
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, RefreshCw, SlidersHorizontal } from "lucide-react";
import { adminListOrders } from "@/lib/api/admin/order";
 
const inputCls = "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline = "inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v.toLocaleString("en-IN") : 0}`;
}
 
function statusPill(status: string) {
  const s = String(status || "pending").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
  if (s === "pending")   return `${base} bg-amber-50 text-amber-700`;
  if (s === "confirmed") return `${base} bg-blue-50 text-blue-700`;
  if (s === "shipped")   return `${base} bg-violet-50 text-violet-700`;
  if (s === "delivered") return `${base} bg-neutral-900 text-white`;
  if (s === "cancelled") return `${base} bg-red-50 text-red-700`;
  return `${base} bg-neutral-100 text-neutral-600`;
}
 
function payPill(status: string) {
  const s = String(status || "unpaid").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
  if (s === "paid") return `${base} bg-neutral-900 text-white`;
  return `${base} bg-neutral-100 text-neutral-500`;
}
 
function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}
 
const STATUS_OPTIONS = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
 
export default function AdminOrdersPage() {
  const router = useRouter();
  const sp = useSearchParams();
 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(sp.get("from") || "");
  const [to, setTo] = useState(sp.get("to") || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const limit = 20;
 
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
 
  const qs = useMemo(() => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const s = q.toString();
    return s ? `?${s}` : "";
  }, [from, to]);
 
  function parseResponse(res: any) {
    if (Array.isArray(res?.data) && res?.meta) return { rows: res.data, total: Number(res.meta?.total || 0) };
    if (Array.isArray(res?.data?.data) && res?.data?.meta) return { rows: res.data.data, total: Number(res.data.meta?.total || 0) };
    if (Array.isArray(res?.data)) return { rows: res.data, total: res.data.length };
    return { rows: [], total: 0 };
  }
 
  const fetchData = async (p: number, f: string, t: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListOrders({ page: p, limit, search: search.trim() || undefined, ...(f ? { from: f } : {}), ...(t ? { to: t } : {}) });
      const parsed = parseResponse(res);
      setRows(parsed.rows);
      setTotal(parsed.total);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load orders");
      setRows([]); setTotal(0);
    } finally { setLoading(false); }
  };
 
  useEffect(() => {
    const nf = sp.get("from") || ""; const nt = sp.get("to") || "";
    setFrom(nf); setTo(nt); setPage(1); fetchData(1, nf, nt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);
 
  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((o) => String(o.status || "").toLowerCase() === statusFilter);
  }, [rows, statusFilter]);
 
  const totalPages = Math.max(1, Math.ceil(total / limit));
 
  return (
    <div className="space-y-5">
      {/* Page head */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Orders</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {total} total order{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
 
      {/* Filters */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap gap-3">
          {/* search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchData(1, from, to); } }}
              placeholder="Search by ID, name, email…"
              className={`${inputCls} pl-9 w-full`}
            />
          </div>
 
          {/* status filter */}
          <div className="relative flex items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputCls}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
 
          <div className="h-9 w-px bg-neutral-200" />
 
          {/* date range */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
            <span className="text-xs text-neutral-400">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </div>
 
          <button onClick={() => { const q = new URLSearchParams(); if (from) q.set("from", from); if (to) q.set("to", to); router.replace(`/admin/orders${q.toString() ? `?${q.toString()}` : ""}`); }} disabled={loading} className={btnPrimary}>Apply</button>
          <button onClick={() => { setFrom(""); setTo(""); router.replace("/admin/orders"); }} disabled={loading} className={btnOutline}>Clear</button>
          <button onClick={() => fetchData(page, from, to)} disabled={loading} className={btnOutline} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
 
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
 
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-neutral-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-400">No orders found</td></tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o._id} className="transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-neutral-900">#{String(o._id).slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{o.userName || "—"}</div>
                      <div className="text-xs text-neutral-500">{o.userEmail || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{o.itemsCount ?? 0}</td>
                    <td className="px-4 py-3 font-semibold text-neutral-900">{money(o.total)}</td>
                    <td className="px-4 py-3"><span className={statusPill(o.status)}>{o.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={payPill(o.paymentStatus)}>{o.paymentStatus}</span>
                        <span className="text-[10px] text-neutral-400">{o.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{fmtDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${o._id}${qs}`} className="font-medium text-neutral-900 underline-offset-4 hover:underline">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
 
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
          <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchData(p, from, to); }} disabled={loading || page <= 1} className={btnOutline}>Prev</button>
          <span className="text-sm text-neutral-500">Page <span className="font-semibold text-neutral-900">{page}</span> / {totalPages}</span>
          <button onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchData(p, from, to); }} disabled={loading || page >= totalPages} className={btnOutline}>Next</button>
        </div>
      </div>
    </div>
  );
}