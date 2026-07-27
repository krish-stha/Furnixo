"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { adminLowStock } from "@/lib/api/admin/inventory";
import { adminGetSettings } from "@/lib/api/admin/settings";
 
const inputCls = "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
 
export default function LowStockPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [error, setError] = useState("");
 
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await adminGetSettings();
        const s = res?.data?.data ?? res?.data ?? {};
        const t = Number(s?.lowStockThreshold ?? 5);
        if (!alive) return;
        setThreshold(Number.isFinite(t) ? Math.max(1, t) : 5);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);
 
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await adminLowStock(threshold);
        const data = res?.data?.data ?? res?.data ?? [];
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load low stock");
        setRows([]);
      } finally { if (!alive) return; setLoading(false); }
    })();
    return () => { alive = false; };
  }, [threshold]);
 
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/inventory" className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Low Stock</h1>
            <p className="mt-1 text-sm text-neutral-500">Products with stock ≤ {threshold}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Threshold</span>
          <input type="number" value={threshold} onChange={(e) => setThreshold(Math.max(1, Number(e.target.value || 1)))} className={`${inputCls} w-24`} />
        </div>
      </div>
 
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
 
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
          <AlertTriangle className={`h-4 w-4 ${rows.length > 0 ? "text-amber-500" : "text-neutral-300"}`} strokeWidth={1.8} />
          <span className="text-sm font-semibold text-neutral-900">{rows.length} product{rows.length !== 1 ? "s" : ""} at or below threshold</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[400px] w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                [...Array(3)].map((_, i) => <tr key={i}>{[...Array(3)].map((_, j) => <td key={j} className="px-5 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100" /></td>)}</tr>)
              ) : rows.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-neutral-400">No low-stock items — all good!</td></tr>
              ) : (
                rows.map((p: any) => (
                  <tr key={p._id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-900">{p.name || "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-500">{p.sku || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-amber-600">{Number(p.stock ?? 0)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
 