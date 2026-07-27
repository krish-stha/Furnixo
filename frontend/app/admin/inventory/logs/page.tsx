"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminInventoryLogs } from "@/lib/api/admin/inventory";
 
function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}
 
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
export default function InventoryLogsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
 
  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminInventoryLogs({ page, limit: 50 });
      setRows(res?.data?.data ?? res?.data ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load logs");
      setRows([]);
    } finally { setLoading(false); }
  };
 
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);
 
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/inventory" className={btnOutline}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inventory Logs</h1>
            <p className="mt-1 text-sm text-neutral-500">Stock in/out history</p>
          </div>
        </div>
      </div>
 
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
 
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-5 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100" /></td>)}</tr>)
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-neutral-400">No logs found</td></tr>
              ) : (
                rows.map((l: any, idx) => (
                  <tr key={l._id || idx} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 text-neutral-500">{fmtDate(l.createdAt)}</td>
                    <td className="px-5 py-3 font-medium text-neutral-900">{l.productName || l.productId || l.product || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${String(l.type || l.action || "").toUpperCase() === "IN" ? "bg-neutral-900 text-white" : "bg-red-50 text-red-700"}`}>
                        {l.type || l.action || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-neutral-900">{l.qty ?? l.delta ?? "—"}</td>
                    <td className="px-5 py-3 text-neutral-500">{l.reason || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className={btnOutline}><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-neutral-500">Page <span className="font-semibold text-neutral-900">{page}</span></span>
          <button onClick={() => setPage((p) => p + 1)} disabled={rows.length < 50} className={btnOutline}><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
 