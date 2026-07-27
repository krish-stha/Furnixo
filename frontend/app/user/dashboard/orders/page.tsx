"use client";
 
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag, ChevronRight, Package, ChevronLeft } from "lucide-react";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { getMyOrders } from "@/lib/api/order";
 
function statusPill(status: string) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize";
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
  return s === "paid"
    ? `${base} bg-neutral-900 text-white`
    : `${base} bg-neutral-100 text-neutral-500`;
}
 
function fmtDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return "—"; }
}
 
function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v.toLocaleString("en-IN") : 0}`;
}
 
function OrderSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-28 rounded bg-neutral-100" />
          <div className="h-3 w-20 rounded bg-neutral-100" />
          <div className="h-3 w-40 rounded bg-neutral-100" />
        </div>
        <div className="h-8 w-20 rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}
 
export default function MyOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);
 
  const fetchData = async (p = page) => {
    setLoading(true); setError("");
    try {
      const res = await getMyOrders(p, limit);
      setRows(res?.data || []);
      setTotal(res?.meta?.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load orders");
      setRows([]); setTotal(0);
    } finally { setLoading(false); }
  };
 
  useEffect(() => { fetchData(1); /* eslint-disable-next-line */ }, []);
 
  const totalPages = Math.max(1, Math.ceil(total / limit));
 
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />
 
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
 
          {/* ── Page head ── */}
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                My Orders
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {total > 0 ? `${total} order${total !== 1 ? "s" : ""} placed` : "Track and manage your orders"}
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900"
            >
              <ShoppingBag className="h-4 w-4" /> Continue shopping
            </Link>
          </div>
 
          {/* ── Error ── */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
 
          {/* ── Orders ── */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <OrderSkeleton key={i} />)}
            </div>
          ) : rows.length === 0 ? (
            /* empty state */
            <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-20 text-center">
              <Package className="h-10 w-10 text-neutral-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-neutral-900">No orders yet</p>
              <p className="mt-1 text-sm text-neutral-500">
                Your future orders will appear here.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex h-10 items-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
              >
                Shop now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((o) => {
                const shortId = `#${String(o._id).slice(-6).toUpperCase()}`;
                const itemCount = (o.items || []).length;
                const itemNames = (o.items || [])
                  .slice(0, 2)
                  .map((it: any) => it?.name || it?.product?.name || "")
                  .filter(Boolean);
                const moreCount = itemCount - 2;
 
                return (
                  <Link
                    key={o._id}
                    href={`/user/dashboard/orders/${o._id}`}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-neutral-900 hover:shadow-md"
                  >
                    {/* left: id + date + items */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-neutral-900">
                          {shortId}
                        </span>
                        <span className={statusPill(o.status)}>{o.status}</span>
                        <span className={payPill(o.paymentStatus)}>{o.paymentStatus || "unpaid"}</span>
                      </div>
 
                      <p className="text-xs text-neutral-500">
                        {fmtDate(o.createdAt)} · {itemCount} item{itemCount !== 1 ? "s" : ""}
                        {o.paymentMethod && ` · ${o.paymentMethod}`}
                      </p>
 
                      {itemNames.length > 0 && (
                        <p className="truncate text-xs text-neutral-400">
                          {itemNames.join(", ")}
                          {moreCount > 0 && ` +${moreCount} more`}
                        </p>
                      )}
                    </div>
 
                    {/* right: total + arrow */}
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-base font-bold text-neutral-900">
                        {money(o.total)}
                      </span>
                      <ChevronRight className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-neutral-900" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
 
          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                disabled={loading || page <= 1}
                onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchData(p); }}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
 
              <span className="text-sm text-neutral-500">
                Page <span className="font-semibold text-neutral-900">{page}</span> / {totalPages}
              </span>
 
              <button
                disabled={loading || page >= totalPages}
                onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchData(p); }}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>
 
      <Footer />
    </div>
  );
}