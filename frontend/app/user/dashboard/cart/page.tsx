"use client";
 
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
 
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { useCart } from "@/lib/contexts/cart-context";
import { productImageUrl } from "@/lib/img";
 
function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${(Number.isFinite(v) ? v : 0).toLocaleString("en-IN")}`;
}
 
// supports both populated product and plain string id
function getPid(it: any) {
  return String(it?.product?._id || it?.product || "");
}
 
export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    count,
    loading,
    setQty,
    remove,
    clear,
    selectedIds,
    isSelected,
    toggleSelected,
    selectAll,
    clearSelection,
  } = useCart();
 
  const [busyId, setBusyId] = useState<string>("");
  const [error, setError] = useState<string>("");
 
  const items = cart?.items || [];
 
  const selectedItems = useMemo(() => {
    const set = new Set(selectedIds.map(String));
    return items.filter((it: any) => {
      const pid = getPid(it);
      return pid && set.has(pid);
    });
  }, [items, selectedIds]);
 
  const totals = useMemo(() => {
    const subtotal = selectedItems.reduce(
      (sum, it: any) => sum + Number(it.priceSnapshot || 0) * Number(it.qty || 0),
      0
    );
    return { subtotal };
  }, [selectedItems]);
 
  const hasOutOfStockSelected = useMemo(() => {
    return selectedItems.some((it: any) => Number(it?.product?.stock ?? 0) <= 0);
  }, [selectedItems]);
 
  const allSelected = items.length > 0 && selectedItems.length === items.length;
 
  const onCheckout = () => {
    setError("");
    if (items.length === 0) return setError("Your cart is empty.");
    if (selectedItems.length === 0) return setError("Tick at least 1 item to checkout.");
    if (hasOutOfStockSelected)
      return setError("Untick or remove out-of-stock selected items first.");
    router.push("/user/dashboard/checkout");
  };
 
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
 
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          {/* page head */}
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                Shopping Cart
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {count} {count === 1 ? "item" : "items"} in your cart
              </p>
            </div>
 
            {items.length > 0 && (
              <button
                onClick={() => clear()}
                disabled={loading}
                className="text-sm text-neutral-500 underline-offset-4 transition-colors hover:text-red-600 hover:underline disabled:opacity-50"
              >
                Clear cart
              </button>
            )}
          </div>
 
          {error && (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
 
          {/* loading skeleton */}
          {loading && (
            <div className="grid animate-pulse gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-32 rounded-lg bg-neutral-100" />
                ))}
              </div>
              <div className="h-72 rounded-lg bg-neutral-100" />
            </div>
          )}
 
          {/* empty state */}
          {!loading && items.length === 0 && (
            <div className="py-24 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-neutral-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-neutral-900">Your cart is empty</p>
              <p className="mt-1 text-sm text-neutral-500">
                Find something you love in the shop.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-block bg-neutral-900 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700"
              >
                Browse products
              </Link>
            </div>
          )}
 
          {!loading && items.length > 0 && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* ===== LEFT: items ===== */}
              <div className="lg:col-span-2">
                {/* selection toolbar */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-neutral-900"
                      checked={allSelected}
                      onChange={() => (allSelected ? clearSelection() : selectAll())}
                    />
                    Select all
                    <span className="text-neutral-400">
                      ({selectedItems.length}/{items.length} selected)
                    </span>
                  </label>
 
                  {selectedIds.length > 0 && (
                    <button
                      onClick={clearSelection}
                      className="text-xs text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
 
                {/* item rows */}
                <div className="divide-y divide-neutral-200">
                  {items.map((it: any, idx: number) => {
                    const p = it.product;
                    const id = getPid(it) || `row_${idx}`;
                    const firstImage = Array.isArray(p?.images) ? p.images[0] : null;
                    const maxStock = Number(p?.stock ?? 0);
                    const outOfStock = maxStock <= 0;
 
                    const qty = Number(it.qty || 1);
                    const price = Number(it.priceSnapshot || 0);
                    const lineTotal = price * qty;
 
                    const checked = id !== `row_${idx}` ? isSelected(id) : false;
                    const rowBusy = busyId === id;
 
                    return (
                      <div key={id} className="flex gap-4 py-5">
                        {/* checkbox */}
                        <div className="pt-8">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-neutral-900"
                            checked={checked}
                            onChange={() => {
                              if (id !== `row_${idx}`) toggleSelected(id);
                            }}
                            aria-label={`Select ${p?.name || "product"}`}
                          />
                        </div>
 
                        {/* image */}
                        <Link
                          href={p?.slug ? `/shop/${p.slug}` : "#"}
                          className="block h-24 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={productImageUrl(firstImage)}
                            alt={p?.name || "Product"}
                            className="h-full w-full object-cover"
                          />
                        </Link>
 
                        {/* details */}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <Link
                                href={p?.slug ? `/shop/${p.slug}` : "#"}
                                className="block truncate text-sm font-semibold text-neutral-900 hover:underline"
                              >
                                {p?.name}
                              </Link>
                              <div className="mt-0.5 text-xs text-neutral-500">
                                {p?.category?.name || "—"} · SKU {p?.sku || "—"}
                              </div>
                              <div className="mt-1.5 text-sm font-medium text-neutral-900">
                                {money(price)}
                              </div>
                              {outOfStock && (
                                <div className="mt-1 text-xs font-medium text-red-600">
                                  Out of stock — untick or remove this item
                                </div>
                              )}
                            </div>
 
                            <div className="text-right text-sm font-semibold text-neutral-900">
                              {money(lineTotal)}
                            </div>
                          </div>
 
                          {/* qty + remove */}
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-neutral-300">
                              <button
                                disabled={rowBusy || qty <= 1}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await setQty(id, qty - 1);
                                  } finally {
                                    setBusyId("");
                                  }
                                }}
                                className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-neutral-100 disabled:opacity-40"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-10 text-center text-sm font-semibold">
                                {qty}
                              </span>
                              <button
                                disabled={rowBusy || qty >= maxStock}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await setQty(id, qty + 1);
                                  } finally {
                                    setBusyId("");
                                  }
                                }}
                                className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-neutral-100 disabled:opacity-40"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
 
                            <button
                              disabled={rowBusy}
                              onClick={async () => {
                                setBusyId(id);
                                try {
                                  await remove(id);
                                } finally {
                                  setBusyId("");
                                }
                              }}
                              className="flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-red-600 disabled:opacity-50"
                              aria-label={`Remove ${p?.name || "product"}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
 
              {/* ===== RIGHT: summary ===== */}
              <div>
                <div className="sticky top-24 rounded-lg border border-neutral-200 p-6">
                  <h2 className="text-base font-semibold text-neutral-900">Order Summary</h2>
 
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">
                        Subtotal ({selectedItems.length}{" "}
                        {selectedItems.length === 1 ? "item" : "items"})
                      </span>
                      <span className="font-semibold text-neutral-900">
                        {money(totals.subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Shipping</span>
                      <span className="text-neutral-500">Calculated at checkout</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
                      <span className="font-semibold text-neutral-900">Total</span>
                      <span className="text-lg font-bold text-neutral-900">
                        {money(totals.subtotal)}
                      </span>
                    </div>
                  </div>
 
                  <button
                    onClick={onCheckout}
                    disabled={loading || items.length === 0}
                    className="mt-6 h-12 w-full bg-neutral-900 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    Proceed to Checkout
                  </button>
 
                  {hasOutOfStockSelected && (
                    <p className="mt-3 text-xs text-red-600">
                      Some selected items are out of stock. Untick or remove them.
                    </p>
                  )}
                  {selectedItems.length === 0 && (
                    <p className="mt-3 text-xs text-neutral-500">
                      Tick items to checkout — unticked items stay in your cart.
                    </p>
                  )}
 
                  <Link
                    href="/shop"
                    className="mt-4 block text-center text-xs text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
 
      <Footer />
    </div>
  );
}