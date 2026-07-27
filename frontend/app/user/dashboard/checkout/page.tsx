"use client";
 
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  MapPin,
  Phone,
  Pencil,
  Check,
  Banknote,
  Wallet,
  CreditCard,
  ChevronLeft,
} from "lucide-react";
 
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { useCart } from "@/lib/contexts/cart-context";
import { createOrder } from "@/lib/api/order";
import { getPublicSettings } from "@/lib/api/settings";
import { initiateKhaltiPayment } from "@/lib/api/payment";
import { productImageUrl } from "@/lib/img";
import { cn } from "@/lib/utils";
import { endpoints } from "@/lib/api/endpoints";
import { api } from "@/lib/api/axios";
 
type PaymentMethod = "COD" | "KHALTI" | "ESEWA";
 
const COOKIE_KEY = "furnixo_user";
 
function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${(Number.isFinite(v) ? v : 0).toLocaleString("en-IN")}`;
}
 
function getPid(it: any) {
  return String(it?.product?._id || it?.product || "");
}
 
const inputCls =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-100";
 
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading, refresh, selectedIds, isSelected, toggleSelected, selectAll } =
    useCart();
 
  const items = cart?.items || [];
 
  // ---- delivery details (autofilled from profile cookie) ----
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState(false);
 
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
 
  const [settings, setSettings] = useState<any>(null);
  const [pay, setPay] = useState<PaymentMethod>("COD");
 
  // autofill from the live profile (API), falling back to the auth cookie
  useEffect(() => {
    (async () => {
      let u: any = null;
      try {
        const res = await api.get(endpoints.auth.me);
        u = res?.data?.data || null;
      } catch {
        // fall back to cookie below
      }
      if (!u) {
        try {
          const raw = Cookies.get(COOKIE_KEY);
          u = raw ? JSON.parse(raw) : null;
        } catch {
          u = null;
        }
      }
      setFullName(u?.fullName || u?.name || "");
      setAddress(u?.address || "");
      setCountryCode(u?.countryCode || "");
      setPhone(u?.phone || "");
      if (!u?.address) setEditing(true);
    })();
  }, []);
 
  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicSettings();
        const s = res?.data || null;
        setSettings(s);
        const p = s?.payments || {};
        const firstEnabled: PaymentMethod | null = p.COD
          ? "COD"
          : p.KHALTI
          ? "KHALTI"
          : p.ESEWA
          ? "ESEWA"
          : null;
        if (firstEnabled) setPay(firstEnabled);
      } catch {
        setSettings({
          shippingFeeDefault: 0,
          freeShippingThreshold: null,
          payments: { COD: true, KHALTI: true, ESEWA: true },
        });
      }
    })();
  }, []);
 
  const selectedItems = useMemo(() => {
    const set = new Set(selectedIds.map(String));
    return items.filter((it: any) => {
      const pid = getPid(it);
      return pid && set.has(pid);
    });
  }, [items, selectedIds]);
 
  const selectedProductIds = useMemo(
    () => selectedItems.map((it: any) => getPid(it)).filter(Boolean),
    [selectedItems]
  );
 
  const subtotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum: number, it: any) =>
          sum + Number(it.priceSnapshot || 0) * Number(it.qty || 0),
        0
      ),
    [selectedItems]
  );
 
  const hasOutOfStock = useMemo(
    () => selectedItems.some((it: any) => Number(it?.product?.stock ?? 0) <= 0),
    [selectedItems]
  );
 
  const shippingFee = useMemo(() => {
    const def = Number(settings?.shippingFeeDefault ?? 0);
    const thrRaw = settings?.freeShippingThreshold;
    const thr = thrRaw === null || thrRaw === undefined ? null : Number(thrRaw);
    let fee = Math.max(0, def);
    if (thr !== null && Number.isFinite(thr) && subtotal >= thr) fee = 0;
    return fee;
  }, [settings, subtotal]);
 
  const total = subtotal + shippingFee;
  const payments = settings?.payments || { COD: true, KHALTI: true, ESEWA: true };
 
  const phoneDisplay = [countryCode, phone].filter(Boolean).join(" ");
 
  const placeOrder = async () => {
    setError("");
 
    if (!address.trim()) {
      setEditing(true);
      return setError("Delivery address is required.");
    }
    if (!phone.trim()) {
      setEditing(true);
      return setError("Phone number is required for delivery.");
    }
    if (items.length === 0) return setError("Cart is empty.");
    if (selectedItems.length === 0) return setError("Select at least 1 item to checkout.");
    if (hasOutOfStock)
      return setError("Remove out-of-stock selected items to continue.");
    if (
      (pay === "COD" && !payments.COD) ||
      (pay === "KHALTI" && !payments.KHALTI) ||
      (pay === "ESEWA" && !payments.ESEWA)
    ) {
      return setError("Selected payment method is disabled.");
    }
 
    setBusy(true);
    try {
      // backend expects a single address string — fold the phone in
      const fullAddress = `${address.trim()} | Phone: ${phoneDisplay}`;
 
      const res = await createOrder({
        address: fullAddress,
        paymentMethod: pay,
        selectedProductIds,
      });
 
      const order = res?.data ?? res;
      const orderId = order?._id || order?.id;
 
      await refresh();
 
      if (!orderId) {
        router.push("/user/dashboard/orders");
        return;
      }
 
      if (pay === "KHALTI") {
        const p = await initiateKhaltiPayment(orderId);
        const paymentUrl = p?.data?.payment_url;
        if (!paymentUrl) throw new Error("No payment_url received");
        window.location.href = paymentUrl;
        return;
      }
 
      if (pay === "ESEWA") {
        router.push(`/payments/esewa/redirect?orderId=${orderId}`);
        return;
      }
 
      router.push(`/user/dashboard/orders/${orderId}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to place order");
    } finally {
      setBusy(false);
    }
  };
 
  const payOptions: { key: PaymentMethod; label: string; sub: string; icon: any }[] = [
    { key: "COD", label: "Cash on Delivery", sub: "Pay when it arrives", icon: Banknote },
    { key: "KHALTI", label: "Khalti", sub: "Pay online via Khalti", icon: Wallet },
    { key: "ESEWA", label: "eSewa", sub: "Pay online via eSewa", icon: CreditCard },
  ];
  const enabledPayOptions = payOptions.filter((o) => payments[o.key]);
 
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
 
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          {/* page head */}
          <div className="mb-8">
            <Link
              href="/user/dashboard/cart"
              className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <ChevronLeft className="h-4 w-4" /> Back to cart
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
              Checkout
            </h1>
          </div>
 
          {error && (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
 
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* ===== LEFT ===== */}
            <div className="space-y-8 lg:col-span-2">
              {/* 1 — Items */}
              <section>
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
                    1 · Review items
                  </h2>
                  <button
                    onClick={selectAll}
                    disabled={items.length === 0}
                    className="text-xs text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline disabled:opacity-50"
                  >
                    Select all
                  </button>
                </div>
 
                <div className="divide-y divide-neutral-100">
                  {items.length === 0 ? (
                    <p className="py-6 text-sm text-neutral-500">Cart is empty.</p>
                  ) : (
                    items.map((it: any, idx: number) => {
                      const pid = getPid(it) || `row_${idx}`;
                      const p = it?.product;
                      const stock = Number(p?.stock ?? 0);
                      const checked = pid !== `row_${idx}` ? isSelected(pid) : false;
                      const firstImage = Array.isArray(p?.images) ? p.images[0] : null;
 
                      return (
                        <label
                          key={pid}
                          className={cn(
                            "flex cursor-pointer items-center gap-4 py-3 transition-opacity",
                            !checked && "opacity-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0 accent-neutral-900"
                            checked={checked}
                            onChange={() => {
                              if (pid !== `row_${idx}`) toggleSelected(pid);
                            }}
                          />
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={productImageUrl(firstImage)}
                              alt={p?.name || "Product"}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-neutral-900">
                              {p?.name || "Product"}
                            </div>
                            <div className="text-xs text-neutral-500">
                              Qty {Number(it?.qty ?? 0)} · {money(it?.priceSnapshot)}
                              {stock <= 0 && (
                                <span className="ml-2 font-medium text-red-600">
                                  Out of stock
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-neutral-900">
                            {money(Number(it?.priceSnapshot || 0) * Number(it?.qty || 0))}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </section>
 
              {/* 2 — Delivery details (autofilled, editable) */}
              <section>
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
                    2 · Delivery details
                  </h2>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-xs text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>
 
                {!editing ? (
                  /* summary card — prefilled from your profile */
                  <div className="mt-4 rounded-lg border border-neutral-200 p-4">
                    {fullName && (
                      <div className="text-sm font-semibold text-neutral-900">{fullName}</div>
                    )}
                    <div className="mt-2 flex items-start gap-2 text-sm text-neutral-700">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                      <span>{address || <span className="text-neutral-400">No address on file</span>}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-sm text-neutral-700">
                      <Phone className="h-4 w-4 shrink-0 text-neutral-400" />
                      <span>
                        {phoneDisplay || <span className="text-neutral-400">No phone on file</span>}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-neutral-400">
                      Autofilled from your profile.
                    </p>
                  </div>
                ) : (
                  /* edit form */
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Delivery address
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        className={inputCls}
                        placeholder="e.g. Jhapa, Birtamode-05, near the main chowk"
                      />
                    </div>
 
                    <div className="grid grid-cols-[96px_1fr] gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Code
                        </label>
                        <input
                          className={inputCls}
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          placeholder="+977"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Phone
                        </label>
                        <input
                          className={inputCls}
                          inputMode="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="98XXXXXXXX"
                        />
                      </div>
                    </div>
 
                    <button
                      onClick={() => setEditing(false)}
                      disabled={!address.trim() || !phone.trim()}
                      className="flex items-center gap-1.5 border border-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-300"
                    >
                      <Check className="h-3.5 w-3.5" /> Use this address
                    </button>
                    <p className="text-xs text-neutral-400">
                      Applies to this order only — update your profile to change the default.
                    </p>
                  </div>
                )}
              </section>
 
              {/* 3 — Payment */}
              <section>
                <div className="border-b border-neutral-200 pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
                    3 · Payment method
                  </h2>
                </div>
 
                {enabledPayOptions.length === 0 ? (
                  <p className="mt-4 text-sm text-red-600">
                    No payment methods are enabled. Please contact support.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {enabledPayOptions.map(({ key, label, sub, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPay(key)}
                        aria-pressed={pay === key}
                        className={cn(
                          "rounded-lg border p-4 text-left transition-colors",
                          pay === key
                            ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                            : "border-neutral-200 hover:border-neutral-400"
                        )}
                      >
                        <Icon className="h-5 w-5 text-neutral-900" strokeWidth={1.5} />
                        <div className="mt-2 text-sm font-semibold text-neutral-900">
                          {label}
                        </div>
                        <div className="text-xs text-neutral-500">{sub}</div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
 
            {/* ===== RIGHT: summary ===== */}
            <div>
              <div className="sticky top-24 rounded-lg border border-neutral-200 p-6">
                <h2 className="text-base font-semibold text-neutral-900">Order Summary</h2>
 
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">
                      Items ({selectedItems.length})
                    </span>
                    <span className="font-semibold text-neutral-900">{money(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Shipping</span>
                    <span className="font-semibold text-neutral-900">
                      {shippingFee === 0 ? "Free" : money(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-3">
                    <span className="font-semibold text-neutral-900">Total</span>
                    <span className="text-lg font-bold text-neutral-900">{money(total)}</span>
                  </div>
                </div>
 
                {settings?.freeShippingThreshold !== null &&
                  settings?.freeShippingThreshold !== undefined &&
                  shippingFee > 0 && (
                    <p className="mt-3 text-xs text-neutral-500">
                      Free shipping on orders over Rs.{" "}
                      {Number(settings.freeShippingThreshold).toLocaleString("en-IN")}
                    </p>
                  )}
 
                <button
                  onClick={placeOrder}
                  disabled={
                    busy ||
                    loading ||
                    selectedItems.length === 0 ||
                    enabledPayOptions.length === 0
                  }
                  className="mt-6 h-12 w-full bg-neutral-900 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {busy ? "Placing order…" : "Place Order"}
                </button>
 
                {hasOutOfStock && (
                  <p className="mt-3 text-xs text-red-600">
                    Selected items contain out-of-stock products. Untick them or remove
                    from cart.
                  </p>
                )}
 
                <p className="mt-4 text-center text-xs text-neutral-400">
                  Secure payments · 14-day returns
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
 
      <Footer />
    </div>
  );
}