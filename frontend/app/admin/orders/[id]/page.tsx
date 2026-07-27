"use client";
 
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw, MapPin, CreditCard } from "lucide-react";
import { adminGetOrderById, adminUpdateOrderStatus } from "@/lib/api/admin/order";
 
const inputCls = "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const btnPrimary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v.toLocaleString("en-IN") : 0}`;
}
 
function statusPill(status?: string) {
  const s = String(status || "pending").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  if (s === "pending")   return { cls: `${base} bg-amber-50 text-amber-700`, label: s };
  if (s === "confirmed") return { cls: `${base} bg-blue-50 text-blue-700`, label: s };
  if (s === "shipped")   return { cls: `${base} bg-violet-50 text-violet-700`, label: s };
  if (s === "delivered") return { cls: `${base} bg-neutral-900 text-white`, label: s };
  if (s === "cancelled") return { cls: `${base} bg-red-50 text-red-700`, label: s };
  return { cls: `${base} bg-neutral-100 text-neutral-600`, label: s };
}
 
function paymentPill(status?: string) {
  const s = String(status || "unpaid").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  if (s === "paid")      return `${base} bg-neutral-900 text-white`;
  if (s === "initiated") return `${base} bg-blue-50 text-blue-700`;
  if (s === "failed")    return `${base} bg-red-50 text-red-700`;
  return `${base} bg-neutral-100 text-neutral-500`;
}
 
function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}
 
const STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
 
export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [nextStatus, setNextStatus] = useState("pending");
 
  const fetchOrder = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminGetOrderById(id);
      const data = res.data?.data || null;
      setOrder(data);
      setNextStatus(String(data?.status || "pending"));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load order");
      setOrder(null);
    } finally { setLoading(false); }
  };
 
  useEffect(() => { if (id) fetchOrder(); /* eslint-disable-next-line */ }, [id]);
 
  const onSaveStatus = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminUpdateOrderStatus(id, nextStatus);
      setOrder(res.data?.data || order);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to update status");
    } finally { setLoading(false); }
  };
 
  const items = order?.items || [];
  const itemsCount = useMemo(() => items.reduce((s: number, it: any) => s + Number(it.qty || 0), 0), [items]);
  const pill = statusPill(order?.status);
  const payGateway = String(order?.paymentGateway || order?.paymentMethod || "COD").toUpperCase();
  const payStatus = String(order?.paymentStatus || "unpaid").toLowerCase();
  const address = order?.address || order?.user?.address || "—";
  const userName = order?.user?.fullName || (order?.user?.email ? String(order.user.email).split("@")[0] : "—");
  const shortId = `#${String(order?._id || id).slice(-6).toUpperCase()}`;
 
  return (
    <div className="space-y-5">
      {/* Head */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/orders")} className={btnOutline}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900">Order {shortId}</h1>
              <span className={pill.cls}>{pill.label}</span>
            </div>
            <p className="mt-0.5 text-sm text-neutral-500">
              {userName} · {order?.user?.email || "—"} · {fmtDate(order?.createdAt)}
            </p>
          </div>
        </div>
        <button onClick={fetchOrder} disabled={loading} className={btnOutline}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
 
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
 
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Items table */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Items</p>
                <p className="text-xs text-neutral-500">{itemsCount} item{itemsCount !== 1 ? "s" : ""}</p>
              </div>
              <span className="text-sm font-bold text-neutral-900">{money(order?.total)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[560px] w-full text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr><td colSpan={5} className="px-5 py-6 text-neutral-400">Loading…</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-6 text-neutral-400">No items in this order</td></tr>
                  ) : (
                    items.map((it: any, idx: number) => {
                      const qty = Number(it.qty || 0);
                      const price = Number(it.priceSnapshot || 0);
                      return (
                        <tr key={`${String(it.product)}-${idx}`} className="hover:bg-neutral-50">
                          <td className="px-5 py-3">
                            <div className="font-medium text-neutral-900">{it.name || "—"}</div>
                            {it.slug && <div className="text-xs text-neutral-400">{it.slug}</div>}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-neutral-600">{it.sku || "—"}</td>
                          <td className="px-5 py-3 text-neutral-700">{money(price)}</td>
                          <td className="px-5 py-3 text-neutral-700">{qty}</td>
                          <td className="px-5 py-3 text-right font-semibold text-neutral-900">{money(qty * price)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
 
        {/* Right column */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-semibold text-neutral-900">Summary</p>
            <div className="mt-4 space-y-2.5 text-sm">
              {[
                { label: "Subtotal", val: money(order?.subtotal) },
                { label: "Shipping", val: money(order?.shippingFee) },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-neutral-500">{label}</span>
                  <span className="text-neutral-900">{val}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-neutral-200 pt-2.5">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="font-bold text-neutral-900">{money(order?.total)}</span>
              </div>
            </div>
          </div>
 
          {/* Payment + Address */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <CreditCard className="h-3.5 w-3.5" /> Payment
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-900">{payGateway}</span>
                <span className={paymentPill(payStatus)}>{payStatus}</span>
              </div>
              {order?.paidAt && <p className="mt-1 text-xs text-neutral-400">Paid {fmtDate(order.paidAt)}</p>}
            </div>
 
            <div className="border-t border-neutral-100 pt-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <MapPin className="h-3.5 w-3.5" /> Delivery
              </div>
              <p className="mt-2 text-sm text-neutral-700 whitespace-pre-wrap">{address}</p>
            </div>
          </div>
 
          {/* Status update */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-semibold text-neutral-900">Update Status</p>
            <div className="mt-3 space-y-3">
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className={inputCls}
              >
                {STATUS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <button onClick={onSaveStatus} disabled={loading} className={`${btnPrimary} w-full h-10`}>
                {loading ? "Saving…" : "Save Status"}
              </button>
              <p className="text-xs text-neutral-400">
                Current: <span className="font-semibold text-neutral-700">{order?.status || "—"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}