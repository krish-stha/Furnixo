"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { adminListCarts } from "@/lib/api/admin/cart";
 
function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v.toLocaleString("en-IN") : 0}`;
}
 
function isValidObjectId(v: string) {
  return /^[a-fA-F0-9]{24}$/.test(v);
}
 
function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}
 
const inputCls = "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const btnPrimary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
export default function AdminCartPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
 
  const fetchData = async (p = page) => {
    setLoading(true); setError("");
    try {
      const res = await adminListCarts({ page: p, limit, search: search.trim() || undefined });
      setRows(res.data?.data || []);
      setTotal(res.data?.meta?.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load carts");
      setRows([]); setTotal(0);
    } finally { setLoading(false); }
  };
 
  useEffect(() => { fetchData(1); /* eslint-disable-next-line */ }, []);
 
  const totalPages = Math.max(1, Math.ceil(total / limit));
 
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Carts</h1>
          <p className="mt-1 text-sm text-neutral-500">{total} active cart{total !== 1 ? "s" : ""}</p>
        </div>
      </div>
 
      {/* Search */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchData(1); } }}
            placeholder="Search by user email or name…"
            className={`${inputCls} pl-9 w-full`}
          />
        </div>
        <button onClick={() => { setPage(1); fetchData(1); }} disabled={loading} className={btnPrimary}>Search</button>
      </div>
 
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
 
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100" /></td>)}</tr>)
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-400">No carts found</td></tr>
              ) : (
                rows.map((c) => {
                  const cid = String(c?._id || "");
                  const ok = isValidObjectId(cid);
                  return (
                    <tr key={cid || Math.random()} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900">{c.userName || "—"}</td>
                      <td className="px-4 py-3 text-neutral-500">{c.userEmail || "—"}</td>
                      <td className="px-4 py-3 text-neutral-700">{c.itemsCount ?? 0}</td>
                      <td className="px-4 py-3 font-semibold text-neutral-900">{money(c.subtotal)}</td>
                      <td className="px-4 py-3 text-neutral-500">{fmtDate(c.updatedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {ok ? (
                          <Link href={`/admin/cart/${cid}`} className="font-medium text-neutral-900 underline-offset-4 hover:underline">View</Link>
                        ) : (
                          <span className="text-neutral-300">Invalid ID</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
          <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchData(p); }} disabled={loading || page <= 1} className={btnOutline}>Prev</button>
          <span className="text-sm text-neutral-500">Page <span className="font-semibold text-neutral-900">{page}</span> / {totalPages}</span>
          <button onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchData(p); }} disabled={loading || page >= totalPages} className={btnOutline}>Next</button>
        </div>
      </div>
    </div>
  );
}
 