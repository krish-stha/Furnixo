"use client";
 
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlusCircle, MinusCircle, CheckCircle2, AlertTriangle, ClipboardList } from "lucide-react";
import {
  adminLowStock, adminInventoryLogs, adminStockIn, adminStockOut,
} from "@/lib/api/admin/inventory";
import { adminGetSettings } from "@/lib/api/admin/settings";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";
 
type ProductLite = { _id: string; name: string; sku: string; stock: number; slug?: string; };
type ActionType = "IN" | "OUT";
 
function safeInt(v: any, fallback = 1) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return i < 1 ? fallback : i;
}
 
function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}
 
const inputCls = "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const btnPrimary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
 
export default function AdminInventoryPage() {
  const { toast } = useToast();
 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qtyText, setQtyText] = useState("1");
  const [reason, setReason] = useState("");
  const [threshold, setThreshold] = useState(5);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<ActionType>("IN");
  const [lastAction, setLastAction] = useState<{ type: ActionType; productName: string; sku: string; qty: number; reason?: string; at: number; } | null>(null);
 
  const selectedProduct = useMemo(() => products.find((p) => String(p._id) === String(selectedProductId)) || null, [products, selectedProductId]);
 
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
 
  async function loadAll(t = threshold) {
    setLoading(true); setError("");
    try {
      const prodRes = await api.get(endpoints.admin.products, { params: { page: 1, limit: 200 } });
      const prodRows = prodRes?.data?.data?.rows || prodRes?.data?.data || prodRes?.data?.rows || prodRes?.data || [];
      const normalized: ProductLite[] = (Array.isArray(prodRows) ? prodRows : []).map((p: any) => ({
        _id: String(p._id), name: String(p.name || ""), sku: String(p.sku || ""),
        stock: Number(p.stock ?? 0), slug: p.slug ? String(p.slug) : undefined,
      }));
      setProducts(normalized);
      if (!selectedProductId && normalized.length > 0) setSelectedProductId(normalized[0]._id);
      const [lsRes, logRes] = await Promise.all([adminLowStock(t), adminInventoryLogs({ page: 1, limit: 20 })]);
      setLowStock(lsRes?.data?.data ?? lsRes?.data ?? []);
      setLogs(logRes?.data?.data ?? logRes?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load inventory");
    } finally { setLoading(false); }
  }
 
  useEffect(() => { loadAll(threshold); /* eslint-disable-next-line */ }, [threshold]);
 
  const qty = useMemo(() => { if (qtyText === "") return 0; return safeInt(qtyText, 0); }, [qtyText]);
 
  const openConfirm = (type: ActionType) => {
    setError("");
    if (!selectedProductId) { setError("Select a product first"); toast({ title: "Select a product", variant: "destructive" }); return; }
    if (!qty || qty < 1) { setError("Qty must be at least 1"); toast({ title: "Invalid qty", variant: "destructive" }); return; }
    setConfirmType(type); setConfirmOpen(true);
  };
 
  const doAction = async () => {
    setError("");
    try {
      if (!selectedProductId) throw new Error("Select a product");
      const q = safeInt(qtyText, 1);
      const r = reason.trim() || undefined;
      setLoading(true);
      if (confirmType === "IN") await adminStockIn({ productId: selectedProductId, qty: q, reason: r });
      else await adminStockOut({ productId: selectedProductId, qty: q, reason: r });
      const pname = selectedProduct?.name || "Product";
      const psku = selectedProduct?.sku || "-";
      toast({ title: confirmType === "IN" ? "Stock added" : "Stock deducted", description: `${pname} • Qty ${q}${r ? ` • ${r}` : ""}` });
      setLastAction({ type: confirmType, productName: pname, sku: psku, qty: q, reason: r, at: Date.now() });
      setReason(""); setQtyText("1"); setConfirmOpen(false);
      await loadAll(threshold);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Action failed";
      setError(msg); toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally { setLoading(false); }
  };
 
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inventory</h1>
          <p className="mt-1 text-sm text-neutral-500">Stock in/out and low-stock monitoring</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory/logs" className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900">
            <ClipboardList className="h-4 w-4" /> Full Logs
          </Link>
        </div>
      </div>
 
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
 
      {lastAction && (
        <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-neutral-900" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-900">
              {lastAction.type === "IN" ? "Stock In" : "Stock Out"} — {lastAction.productName} ({lastAction.sku})
            </p>
            <p className="text-xs text-neutral-500">Qty {lastAction.qty}{lastAction.reason ? ` · ${lastAction.reason}` : ""}</p>
          </div>
          <button onClick={() => setLastAction(null)} className="text-xs text-neutral-500 hover:text-neutral-900">Dismiss</button>
        </div>
      )}
 
      <div className="grid gap-4 md:grid-cols-3">
        {/* Low stock card */}
        <Link href="/admin/inventory/low-stock" className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Low Stock (≤ {threshold})</p>
            <AlertTriangle className={`h-5 w-5 ${lowStock.length > 0 ? "text-amber-500" : "text-neutral-300"}`} strokeWidth={1.8} />
          </div>
          <p className={`mt-2 text-3xl font-bold ${lowStock.length > 0 ? "text-amber-600" : "text-neutral-900"}`}>
            {loading ? "…" : lowStock.length}
          </p>
          <p className="mt-2 text-xs text-neutral-400 group-hover:text-neutral-700">Click to view list →</p>
        </Link>
 
        {/* Quick update */}
        <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-neutral-900">Quick Stock Update</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} disabled={loading} className={`${inputCls} md:col-span-2`}>
              {products.length === 0 ? <option value="">No products</option> : products.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku}) — Stock: {p.stock}</option>
              ))}
            </select>
            <input type="text" inputMode="numeric" value={qtyText} onChange={(e) => { const v = e.target.value; if (v === "" || /^[0-9]+$/.test(v)) setQtyText(v); }} placeholder="Qty" className={inputCls} disabled={loading} />
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className={inputCls} disabled={loading} />
          </div>
 
          {selectedProduct && (
            <p className="mt-2 text-xs text-neutral-500">
              Selected: <span className="font-semibold text-neutral-900">{selectedProduct.name}</span> · SKU {selectedProduct.sku} · Stock: <span className="font-semibold">{selectedProduct.stock}</span>
            </p>
          )}
 
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => openConfirm("IN")} disabled={loading || !selectedProductId} className={`${btnPrimary} gap-2`}>
              <PlusCircle className="h-4 w-4" /> Stock In
            </button>
            <button onClick={() => openConfirm("OUT")} disabled={loading || !selectedProductId} className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50">
              <MinusCircle className="h-4 w-4" /> Stock Out
            </button>
          </div>
        </div>
      </div>
 
      {/* Recent logs */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <p className="text-sm font-semibold text-neutral-900">Recent Logs</p>
          <Link href="/admin/inventory/logs" className="text-xs font-medium text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
                [...Array(3)].map((_, i) => <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-5 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100" /></td>)}</tr>)
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-400">No logs yet</td></tr>
              ) : (
                logs.map((l: any, idx) => (
                  <tr key={l._id || idx} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 text-neutral-500">{fmtDate(l.createdAt)}</td>
                    <td className="px-5 py-3 font-medium text-neutral-900">{l.productName || l.product?.name || l.productId || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${String(l.type || l.action || "").toUpperCase() === "IN" ? "bg-neutral-900 text-white" : "bg-red-50 text-red-700"}`}>
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
      </div>
 
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(v) => setConfirmOpen(v)}
        title={confirmType === "IN" ? "Confirm Stock In" : "Confirm Stock Out"}
        description={selectedProduct ? `${confirmType === "IN" ? "Add" : "Deduct"} ${safeInt(qtyText, 1)} units for "${selectedProduct.name}" (SKU: ${selectedProduct.sku}).` : "Confirm this stock update."}
        confirmText={loading ? "Processing…" : confirmType === "IN" ? "Stock In" : "Stock Out"}
        cancelText="Cancel"
        destructive={confirmType === "OUT"}
        onConfirm={doAction}
        loading={loading}
      />
    </div>
  );
}