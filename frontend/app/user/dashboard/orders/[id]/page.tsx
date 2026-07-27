  "use client";
 
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft, Download, Wallet, CreditCard,
  MapPin, RotateCcw, Check, RefreshCw, AlertCircle, Clock,
} from "lucide-react";
 
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { cancelMyOrder, getMyOrderById } from "@/lib/api/order";
import { initiateKhaltiPayment } from "@/lib/api/payment";
import { endpoints } from "@/lib/api/endpoints";
import { getToken } from "@/lib/cookie";
import { getPublicSettings } from "@/lib/api/settings";
import { requestRefund, getMyRefunds } from "@/lib/api/refund";
import { cn } from "@/lib/utils";
import { RefundRequestDialog } from "../RefundRequestDialog";
import { CancelOrderDialog } from "../CancelOrderDialog";
 
type PaymentMethod = "COD" | "KHALTI" | "ESEWA";
const RETURN_WINDOW_DAYS = 14;
 
function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v.toLocaleString("en-IN") : 0}`;
}
 
function isValidObjectId(v: string) {
  return /^[a-fA-F0-9]{24}$/.test(v);
}
 
function fmtDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
}
 
function refundStatusConfig(status: string) {
  const s = String(status || "").toLowerCase();
  const map: Record<string, { pill: string; label: string; note: string }> = {
    requested: {
      pill: "bg-amber-50 text-amber-700",
      label: "Under review",
      note: "Your request has been submitted and is awaiting review.",
    },
    approved: {
      pill: "bg-blue-50 text-blue-700",
      label: "Approved",
      note: "Refund approved. Processing to your original payment method within 5–7 business days.",
    },
    processed: {
      pill: "bg-neutral-900 text-white",
      label: "Processed",
      note: "Refund has been sent to your original payment method.",
    },
    rejected: {
      pill: "bg-red-50 text-red-700",
      label: "Not approved",
      note: "This request was not approved. Contact support if you need help.",
    },
  };
  return map[s] ?? { pill: "bg-neutral-100 text-neutral-600", label: s, note: "" };
}
 
// ─── Step tracker ──────────────────────────────────────────────────────────
const STEPS = [
  { key: "pending",   label: "Pending",   num: 1 },
  { key: "confirmed", label: "Confirmed", num: 2 },
  { key: "shipped",   label: "Shipped",   num: 3 },
  { key: "delivered", label: "Delivered", num: 4 },
] as const;
 
function Tracker({ status }: { status: string }) {
  const st = status.toLowerCase();
  const activeIdx = Math.max(0, STEPS.findIndex((s) => s.key === st));
 
  return (
    <div className="flex items-start px-2">
      {STEPS.map((step, i) => {
        // ✅ FIX: "delivered" is the last step — when active, treat as done (filled ✓)
        const done    = i < activeIdx || (i === activeIdx && st === "delivered");
        const current = i === activeIdx && st !== "delivered";
 
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* left connector */}
              <div className={cn(
                "h-px flex-1",
                i === 0 ? "bg-transparent" : done || current ? "bg-neutral-900" : "bg-neutral-200"
              )} />
              {/* circle */}
              <div className={cn(
                "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                done    ? "border-neutral-900 bg-neutral-900 text-white shadow-sm" :
                current ? "border-neutral-900 bg-white text-neutral-900" :
                          "border-neutral-200 bg-white text-neutral-300"
              )}>
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : step.num}
                {current && (
                  <span className="absolute -inset-1.5 animate-ping rounded-full border border-neutral-400 opacity-30" />
                )}
              </div>
              {/* right connector */}
              <div className={cn(
                "h-px flex-1",
                i === STEPS.length - 1 ? "bg-transparent" : done ? "bg-neutral-900" : "bg-neutral-200"
              )} />
            </div>
            <span className={cn(
              "mt-2 text-[11px] font-semibold tracking-wide",
              done    ? "text-neutral-700" :
              current ? "text-neutral-900" :
                        "text-neutral-300"
            )}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
 
// ─── Inner page ────────────────────────────────────────────────────────────
function TrackOrderInner() {
  const params = useParams();
  const router = useRouter();
  const sp     = useSearchParams();
 
  const id = useMemo(() => {
    const p: any = params || {};
    const key = Object.keys(p)[0];
    const val = key ? p[key] : "";
    return Array.isArray(val) ? String(val[0] || "") : String(val || "");
  }, [params]);
 
  const [loading,       setLoading]       = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [order,         setOrder]         = useState<any>(null);
  const [refunds,       setRefunds]       = useState<any[]>([]);
  const [payments,      setPayments]      = useState({ COD: true, KHALTI: true, ESEWA: true });
  const [paymentChoice, setPaymentChoice] = useState<PaymentMethod>("KHALTI");
  const [cancelOpen,    setCancelOpen]    = useState(false);
  const [refundOpen,    setRefundOpen]    = useState(false);
 
  const fetchSettings = async () => {
    try {
      const res = await getPublicSettings();
      const p = res?.data?.payments || {};
      const n = { COD: !!p.COD, KHALTI: !!p.KHALTI, ESEWA: !!p.ESEWA };
      setPayments(n);
      if (n.KHALTI) setPaymentChoice("KHALTI");
      else if (n.ESEWA) setPaymentChoice("ESEWA");
    } catch { /* keep defaults */ }
  };
 
  const fetchOrder = async () => {
    if (!isValidObjectId(id)) { setError("Invalid order ID"); return; }
    setLoading(true); setError("");
    try {
      const res = await getMyOrderById(id);
      setOrder(res?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load order");
    } finally { setLoading(false); }
  };
 
  const fetchRefunds = async () => {
    try {
      const res = await getMyRefunds();
      const all: any[] = res?.data || [];
      setRefunds(all.filter((r) => {
        const oid = typeof r.order === "object" ? r.order?._id : r.order;
        return String(oid) === String(id);
      }));
    } catch { setRefunds([]); }
  };
 
  useEffect(() => {
    if (id) { fetchOrder(); fetchRefunds(); fetchSettings(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
 
  useEffect(() => {
    if (sp.get("paid") === "0")
      setError("Payment could not be verified. Please try again or contact support.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  // ── derived values ────────────────────────────────────────────────────────
  const subtotal    = Number(order?.subtotal   || 0);
  const shipping    = Number(order?.shippingFee || 0);
  const total       = Number(order?.total || subtotal + shipping);
  const status      = String(order?.status        || "").toLowerCase();
  const payStatus   = String(order?.paymentStatus || "unpaid").toLowerCase();
  const gateway     = String(order?.paymentGateway || order?.paymentMethod || "COD").toUpperCase();
  const isPaid      = payStatus === "paid";
  const isCancelled = status === "cancelled";
  const canCancel   = status === "pending" && !isPaid;
  const canPay      = ["pending", "confirmed", "shipped"].includes(status) && !isPaid;
 
  // ── 14-day return window ────────────────────────────────────────────────
  // For delivered orders, use deliveredAt if available, otherwise fall back to updatedAt
  const deliveryTimestamp  = order?.deliveredAt || (status === "delivered" ? order?.updatedAt : null);
  const daysIntoWindow     = deliveryTimestamp
    ? (Date.now() - new Date(deliveryTimestamp).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const daysRemaining      = Math.max(0, Math.ceil(RETURN_WINDOW_DAYS - daysIntoWindow));
  const withinReturnWindow = status === "delivered" && isPaid && daysIntoWindow <= RETURN_WINDOW_DAYS;
 
  const canRefund = isPaid && (
    ["pending", "confirmed"].includes(status) ||
    withinReturnWindow
  );
 
  // label changes based on context
  const refundLabel    = status === "delivered" ? "Request a return" : "Request a refund";
  const isReturnMode   = status === "delivered";
 
  const alreadyRequestedRs = useMemo(() =>
    refunds
      .filter((r) => ["requested", "approved", "processed"].includes(String(r.status)))
      .reduce((sum, r) => sum + Math.round(Number(r.amountPaisa || 0)) / 100, 0),
    [refunds]
  );
 
  const onlinePayOptions = [
    { key: "KHALTI" as PaymentMethod, label: "Khalti", desc: "Pay online via Khalti", icon: Wallet,     enabled: payments.KHALTI },
    { key: "ESEWA"  as PaymentMethod, label: "eSewa",  desc: "Pay online via eSewa",  icon: CreditCard, enabled: payments.ESEWA  },
  ].filter((o) => o.enabled);
 
  // ── actions ───────────────────────────────────────────────────────────────
  const doCancel = async (reason: string) => {
    setLoading(true); setError("");
    try {
      const res = await cancelMyOrder(id, reason.trim());
      setOrder(res?.data || null);
      setCancelOpen(false);
      setTimeout(() => router.push("/user/dashboard/orders"), 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to cancel order");
    } finally { setLoading(false); }
  };
 
  const doRefund = async (amount: number, reason: string) => {
    setRefundLoading(true); setError("");
    try {
      const res = await requestRefund({ orderId: id, amount, reason: reason || undefined });
      const created = res?.data || res;
      if (created) setRefunds((prev) => [created, ...prev]);
      setRefundOpen(false);
      await fetchRefunds();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Refund request failed");
    } finally { setRefundLoading(false); }
  };
 
  const onPay = async () => {
    setError("");
    if (paymentChoice === "KHALTI") {
      setLoading(true);
      try {
        const res = await initiateKhaltiPayment(id);
        const url = res?.data?.payment_url;
        if (!url) throw new Error("No payment URL returned");
        window.location.assign(url);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to initiate payment");
      } finally { setLoading(false); }
      return;
    }
    if (paymentChoice === "ESEWA") router.push(`/payments/esewa/redirect?orderId=${id}`);
  };
 
  const onDownloadInvoice = async () => {
    try {
      const token = getToken();
      if (!token) { setError("Login required to download invoice"); return; }
      const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoints.orders.invoice(id)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Invoice download failed");
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (e: any) { setError(e?.message || "Invoice download failed"); }
  };
 
  const shortId = `#${String(order?._id || id).slice(-6).toUpperCase()}`;
 
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />
 
      <CancelOrderDialog open={cancelOpen} onOpenChange={setCancelOpen} loading={loading} onConfirm={doCancel} />
      <RefundRequestDialog
        open={refundOpen} onOpenChange={setRefundOpen}
        orderTotal={total} alreadyRequestedRs={alreadyRequestedRs}
        loading={refundLoading} onSubmit={doRefund}
        isReturnMode={isReturnMode}
        daysRemaining={isReturnMode ? daysRemaining : undefined}
      />
 
      <main className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-10">
 
          <Link href="/user/dashboard/orders" className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900">
            <ChevronLeft className="h-4 w-4" /> Back to orders
          </Link>
 
          {/* Head */}
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Order {shortId}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                <span>Placed {fmtDate(order?.createdAt)}</span>
                <span className="text-neutral-300">·</span>
                <span>{gateway}</span>
                <span className="text-neutral-300">·</span>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    <Check className="h-3 w-3" strokeWidth={2.5} /> Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-500">Unpaid</span>
                )}
              </div>
            </div>
 
            <div className="flex flex-wrap gap-2">
              {isPaid && (
                <button onClick={onDownloadInvoice} className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900">
                  <Download className="h-4 w-4" /> Invoice
                </button>
              )}
              <button onClick={fetchOrder} disabled={loading} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              {canCancel && (
                <button onClick={() => setCancelOpen(true)} className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-700">
                  Cancel order
                </button>
              )}
            </div>
          </div>
 
          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
 
          {/* 14-day return window banner — shown when delivered and window is open */}
          {withinReturnWindow && refunds.length === 0 && (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-semibold text-neutral-900">14-day free returns</p>
                  <p className="text-xs text-neutral-500">
                    Not satisfied? You have{" "}
                    <span className="font-semibold text-neutral-900">{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</span>{" "}
                    left to request a return.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRefundOpen(true)}
                className="shrink-0 inline-flex h-9 items-center rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
              >
                Request return
              </button>
            </div>
          )}
 
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
 
            {/* LEFT */}
            <div className="space-y-5 lg:col-span-2">
 
              {/* Tracker / Cancelled */}
              {isCancelled ? (
                <div className="rounded-xl border border-neutral-200 bg-white px-5 py-6">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-sm font-bold text-neutral-400">✕</span>
                    <div>
                      <p className="font-semibold text-neutral-900">Order cancelled</p>
                      <p className="mt-0.5 text-sm text-neutral-500">{order?.cancel_reason || "No reason provided"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-200 bg-white px-6 py-6">
                  <Tracker status={status} />
                </div>
              )}
 
              {/* Items */}
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <div className="border-b border-neutral-100 px-5 py-4">
                  <p className="text-sm font-semibold text-neutral-900">
                    Items ordered
                    {(order?.items || []).length > 0 && (
                      <span className="ml-2 font-normal text-neutral-400">({(order.items || []).length})</span>
                    )}
                  </p>
                </div>
                {loading ? (
                  <div className="divide-y divide-neutral-100">
                    {[0, 1].map((i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-4">
                        <div className="space-y-2">
                          <div className="h-4 w-36 animate-pulse rounded bg-neutral-100" />
                          <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
                        </div>
                        <div className="h-4 w-16 animate-pulse rounded bg-neutral-100" />
                      </div>
                    ))}
                  </div>
                ) : (order?.items || []).length === 0 ? (
                  <p className="px-5 py-8 text-sm text-neutral-400">No items in this order</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {(order.items || []).map((it: any, idx: number) => {
                      const price = Number(it.priceSnapshot ?? 0);
                      const qty   = Number(it.qty ?? 0);
                      return (
                        <div key={`${it?.sku || idx}`} className="flex items-center justify-between gap-4 px-5 py-4">
                          <div className="min-w-0 flex-1">
                            {it?.slug ? (
                              <Link href={`/shop/${it.slug}`} className="block text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline">
                                {it?.name || "—"}
                              </Link>
                            ) : (
                              <p className="text-sm font-semibold text-neutral-900">{it?.name || "—"}</p>
                            )}
                            <p className="mt-0.5 text-xs text-neutral-500">
                              SKU {it?.sku || "—"} · {money(price)} × {qty}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-neutral-900">{money(price * qty)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
 
              {/* Refund history */}
              {refunds.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  <div className="border-b border-neutral-100 px-5 py-4">
                    <p className="text-sm font-semibold text-neutral-900">
                      {isReturnMode ? "Return requests" : "Refund requests"}
                    </p>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {refunds.map((r: any, i: number) => {
                      const cfg   = refundStatusConfig(r?.status);
                      const amtRs = Math.round(Number(r?.amountPaisa || 0)) / 100;
                      return (
                        <div key={r?._id || i} className="px-5 py-4 space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm">
                              <span className="font-semibold text-neutral-900">Rs. {amtRs.toLocaleString("en-IN")}</span>
                              {r?.reason && <span className="ml-2 text-neutral-500">· {r.reason}</span>}
                            </div>
                            <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cfg.pill)}>
                              {cfg.label}
                            </span>
                          </div>
                          {cfg.note && <p className="text-xs text-neutral-400">{cfg.note}</p>}
                          {r?.adminNote && (
                            <p className="text-xs text-neutral-600">
                              <span className="font-semibold">Admin note:</span> {r.adminNote}
                            </p>
                          )}
                          <p className="text-xs text-neutral-400">Requested {fmtDate(r?.createdAt)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
 
            {/* RIGHT */}
            <div className="space-y-4">
 
              {/* Summary */}
              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <p className="mb-4 text-sm font-semibold text-neutral-900">Summary</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Subtotal</span>
                    <span className="text-neutral-900">{money(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Shipping</span>
                    <span className="text-neutral-900">{shipping === 0 ? "Free" : money(shipping)}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-2.5">
                    <span className="font-semibold text-neutral-900">Total</span>
                    <span className="text-base font-bold text-neutral-900">{money(total)}</span>
                  </div>
                </div>
              </div>
 
              {/* Delivery */}
              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  <MapPin className="h-3.5 w-3.5" /> Delivery address
                </div>
                <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">{order?.address || "—"}</p>
              </div>
 
              {/* Payment */}
              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <p className="mb-3 text-sm font-semibold text-neutral-900">Payment</p>
 
                {isPaid ? (
                  <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Payment received</p>
                      <p className="text-xs text-neutral-500">via {gateway}</p>
                    </div>
                  </div>
                ) : canPay ? (
                  <>
                    <p className="mb-3 text-xs text-neutral-500">Complete your payment to confirm this order.</p>
                    <div className="space-y-2">
                      {onlinePayOptions.map(({ key, label, desc, icon: Icon }) => (
                        <button key={key} type="button" onClick={() => setPaymentChoice(key)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-colors",
                            paymentChoice === key
                              ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                              : "border-neutral-200 bg-white hover:border-neutral-400"
                          )}>
                          <Icon className="h-5 w-5 shrink-0 text-neutral-700" strokeWidth={1.5} />
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">{label}</p>
                            <p className="text-xs text-neutral-400">{desc}</p>
                          </div>
                          {paymentChoice === key && (
                            <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-900">
                              <Check className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    {onlinePayOptions.length > 0 && (
                      <button onClick={onPay} disabled={loading}
                        className="mt-3 flex h-11 w-full items-center justify-center bg-neutral-900 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-neutral-700 disabled:opacity-50">
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                            Redirecting…
                          </span>
                        ) : "Pay Now"}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-neutral-400">
                    {isCancelled ? "No payment required — order was cancelled." : `${gateway} · Unpaid`}
                  </p>
                )}
 
                {/* Refund / Return button (sidebar version — smaller, secondary) */}
                {canRefund && !withinReturnWindow && (
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <button onClick={() => setRefundOpen(true)} disabled={refundLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50">
                      <RotateCcw className="h-4 w-4" /> {refundLabel}
                    </button>
                  </div>
                )}
              </div>
 
            </div>
          </div>
        </div>
      </main>
 
      <Footer />
    </div>
  );
}
 
export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-sm text-neutral-400">Loading order…</div>
      </div>
    }>
      <TrackOrderInner />
    </Suspense>
  );
}