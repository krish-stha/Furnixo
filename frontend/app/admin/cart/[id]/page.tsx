"use client";
 
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import {
  adminClearCart, adminDeleteCart, adminGetCartById,
  adminRemoveCartItem, adminSetCartItemQty,
} from "@/lib/api/admin/cart";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";
 
function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v.toLocaleString("en-IN") : 0}`;
}
 
function isValidObjectId(v: string) {
  return /^[a-fA-F0-9]{24}$/.test(v);
}
 
const inputCls = "h-9 w-24 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-center text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const btnPrimary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
export default function AdminCartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
 
  const id = useMemo(() => {
    const p: any = params || {};
    const firstKey = Object.keys(p)[0];
    const val = firstKey ? p[firstKey] : "";
    return Array.isArray(val) ? String(val[0] || "") : String(val || "");
  }, [params]);
 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<any>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeName, setRemoveName] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
 
  const fetchCart = async () => {
    if (!isValidObjectId(id)) { setError("Invalid cart id in URL"); setCart(null); return; }
    setLoading(true); setError("");
    try {
      const res = await adminGetCartById(id);
      setCart(res.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load cart");
      setCart(null);
    } finally { setLoading(false); }
  };
 
  useEffect(() => { if (id) fetchCart(); /* eslint-disable-next-line */ }, [id]);
 
  const subtotal = useMemo(() => {
    const items = cart?.items || [];
    return items.reduce((sum: number, it: any) => {
      const p = it.product || {};
      const snap = Number(it.priceSnapshot ?? 0);
      const price = snap > 0 ? snap : p.discountPrice !== null && p.discountPrice !== undefined ? Number(p.discountPrice) : Number(p.price || 0);
      return sum + price * Number(it.qty || 0);
    }, 0);
  }, [cart]);
 
  const userName = cart?.user?.fullName || (cart?.user?.email ? String(cart.user.email).split("@")[0] : "—");
  const userEmail = cart?.user?.email || "—";
 
  const onSetQty = async (productId: string, qty: number) => {
    const safeQty = Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1;
    setLoading(true); setError("");
    try {
      const res = await adminSetCartItemQty(id, productId, safeQty);
      setCart(res.data?.data || null);
      toast({ title: "Updated", description: `Quantity set to ${safeQty}` });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update qty";
      setError(msg); toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally { setLoading(false); }
  };
 
  const onRemove = async () => {
    if (!removeId) return;
    setLoading(true); setError("");
    try {
      const res = await adminRemoveCartItem(id, removeId);
      setCart(res.data?.data || null);
      toast({ title: "Removed", description: removeName ? `${removeName} removed` : "Item removed" });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to remove item";
      setError(msg); toast({ title: "Remove failed", description: msg, variant: "destructive" });
    } finally { setLoading(false); setRemoveId(null); setRemoveName(""); }
  };
 
  const onClear = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminClearCart(id);
      setCart(res.data?.data || null);
      toast({ title: "Cleared", description: "Cart cleared" });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to clear cart";
      setError(msg); toast({ title: "Clear failed", description: msg, variant: "destructive" });
    } finally { setLoading(false); setClearOpen(false); }
  };
 
  const onDeleteCart = async () => {
    setLoading(true); setError("");
    try {
      await adminDeleteCart(id);
      toast({ title: "Deleted", description: "Cart document deleted" });
      router.push("/admin/cart");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to delete cart";
      setError(msg); toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally { setLoading(false); setDeleteOpen(false); }
  };
 
  const items = cart?.items || [];
 
  return (
    <div className="space-y-5">
      {/* Head */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/cart")} className={btnOutline}><ChevronLeft className="h-4 w-4" /></button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Cart Detail</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{userName} · {userEmail}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setClearOpen(true)} disabled={loading || items.length === 0} className={btnOutline}>Clear Cart</button>
          <button onClick={() => setDeleteOpen(true)} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> Delete Cart
          </button>
        </div>
      </div>
 
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
 
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <p className="text-sm font-semibold text-neutral-900">{items.length} item{items.length !== 1 ? "s" : ""}</p>
            <p className="text-sm font-bold text-neutral-900">Subtotal: {money(subtotal)}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading && items.length === 0 ? (
                  [...Array(3)].map((_, i) => <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-5 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100" /></td>)}</tr>)
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral-400">Cart is empty</td></tr>
                ) : (
                  items.map((it: any) => {
                    const p = it.product || {};
                    const snap = Number(it.priceSnapshot ?? 0);
                    const price = snap > 0 ? snap : p.discountPrice != null ? Number(p.discountPrice) : Number(p.price || 0);
                    const qty = Number(it.qty || 0);
                    const lineTotal = price * qty;
                    return (
                      <tr key={String(p._id)} className="hover:bg-neutral-50">
                        <td className="px-5 py-3">
                          <div className="font-medium text-neutral-900">{p.name || "—"}</div>
                          <div className="font-mono text-[10px] text-neutral-400">{p.sku || "—"}</div>
                        </td>
                        <td className="px-5 py-3 text-neutral-700">{money(price)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={qty}
                              min={1}
                              className={inputCls}
                              onKeyDown={(e) => { if (e.key === "Enter") onSetQty(String(p._id), Number((e.target as HTMLInputElement).value)); }}
                            />
                            <button
                              onClick={(e) => {
                                const inp = (e.currentTarget.parentElement as HTMLElement)?.querySelector("input") as HTMLInputElement;
                                onSetQty(String(p._id), Number(inp?.value ?? qty));
                              }}
                              className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 hover:border-neutral-900"
                            >
                              Save
                            </button>
                          </div>
                          <p className="mt-1 text-[10px] text-neutral-400">Enter or Save</p>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-neutral-900">{money(lineTotal)}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => { setRemoveId(String(p._id)); setRemoveName(String(p.name || "")); }} disabled={loading} className="text-sm font-medium text-red-600 hover:text-red-700">Remove</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
 
        {/* Summary */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold text-neutral-900">Cart Summary</p>
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Items</span>
              <span className="text-neutral-900">{items.length}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2.5">
              <span className="font-semibold text-neutral-900">Subtotal</span>
              <span className="font-bold text-neutral-900">{money(subtotal)}</span>
            </div>
          </div>
 
          {cart?.user && (
            <div className="mt-5 border-t border-neutral-100 pt-4 space-y-1.5 text-xs text-neutral-500">
              <p className="font-semibold uppercase tracking-wide">User</p>
              <p className="text-neutral-900">{cart.user.fullName || "—"}</p>
              <p>{cart.user.email}</p>
            </div>
          )}
        </div>
      </div>
 
      <ConfirmDialog open={!!removeId} onOpenChange={(v) => { if (!v) { setRemoveId(null); setRemoveName(""); } }} title="Remove item?" description={removeName ? `Remove "${removeName}" from the cart?` : "Remove this item?"} confirmText={loading ? "Removing…" : "Remove"} cancelText="Cancel" destructive onConfirm={onRemove} loading={loading} />
      <ConfirmDialog open={clearOpen} onOpenChange={(v) => setClearOpen(v)} title="Clear this cart?" description="This will remove all items from the cart." confirmText={loading ? "Clearing…" : "Clear cart"} cancelText="Cancel" destructive onConfirm={onClear} loading={loading} />
      <ConfirmDialog open={deleteOpen} onOpenChange={(v) => setDeleteOpen(v)} title="Delete cart document?" description="This will permanently delete the cart document. Cannot be undone." confirmText={loading ? "Deleting…" : "Delete cart"} cancelText="Cancel" destructive onConfirm={onDeleteCart} loading={loading} />
    </div>
  );
}