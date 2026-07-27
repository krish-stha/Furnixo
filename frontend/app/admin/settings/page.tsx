"use client";
 
import { useEffect, useMemo, useState } from "react";
import { Store, Truck, ShieldCheck, Package2, Eye, Upload } from "lucide-react";
import {
  adminGetSettings,
  adminUpdateSettings,
  adminUploadLogo,
} from "@/lib/api/admin/settings";
import { useToast } from "@/hooks/use-toast";
 
function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
 
const inputCls = "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500";
const sectionCls = "rounded-xl border border-neutral-200 bg-white p-5";
 
function SectionHead({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 border-b border-neutral-100 pb-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
        <Icon className="h-4 w-4 text-neutral-900" strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>}
      </div>
    </div>
  );
}
 
function Toggle({ checked, onChange, label, sublabel }: { checked: boolean; onChange: (v: boolean) => void; label: string; sublabel?: string }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${checked ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
    >
      <div>
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        {sublabel && <p className="text-xs text-neutral-500">{sublabel}</p>}
      </div>
      <div className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-neutral-900" : "bg-neutral-200"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}
 
export default function AdminSettingsPage() {
  const { toast } = useToast();
 
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [logoBust, setLogoBust] = useState(Date.now());
 
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
 
  const [form, setForm] = useState<any>({
    storeName: "", storeAddress: "", storeEmail: "", storePhone: "",
    storeLogo: "", shippingFeeDefault: 0, freeShippingThreshold: null,
    lowStockThreshold: 5, payments: { COD: true, KHALTI: true, ESEWA: true },
  });
 
  const logoUrl = useMemo(() => {
    if (!form.storeLogo) return "";
    return `${BACKEND}/public/store_logo/${form.storeLogo}?t=${logoBust}`;
  }, [BACKEND, form.storeLogo, logoBust]);
 
  const set = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));
  const setPayment = (key: string, val: boolean) => setForm((p: any) => ({ ...p, payments: { ...p.payments, [key]: val } }));
 
  const fetchSettings = async () => {
    setLoading(true); setErr(""); setMsg("");
    try {
      const res = await adminGetSettings();
      const data = res.data?.data || form;
      setForm({ ...data, storePhone: data?.storePhone ?? "", storeLogo: data?.storeLogo ?? "" });
      setLogoBust(Date.now());
      toast({ title: "Refreshed", duration: 1200 });
    } catch (e: any) {
      const m = e?.response?.data?.message || e?.message || "Failed to load settings";
      setErr(m);
      toast({ title: "Load failed", description: m, variant: "destructive", duration: 1800 });
    } finally { setLoading(false); }
  };
 
  useEffect(() => { fetchSettings(); /* eslint-disable-next-line */ }, []);
 
  const save = async () => {
    setLoading(true); setErr(""); setMsg("");
    try {
      const payload = {
        storeName: String(form.storeName || ""),
        storeAddress: String(form.storeAddress || ""),
        storeEmail: String(form.storeEmail || ""),
        storePhone: String(form.storePhone || ""),
        shippingFeeDefault: num(form.shippingFeeDefault, 0),
        freeShippingThreshold: form.freeShippingThreshold === "" || form.freeShippingThreshold === null ? null : num(form.freeShippingThreshold, 0),
        lowStockThreshold: Math.max(1, num(form.lowStockThreshold, 5)),
        payments: { COD: Boolean(form.payments?.COD), KHALTI: Boolean(form.payments?.KHALTI), ESEWA: Boolean(form.payments?.ESEWA) },
      };
      const enabledCount = Number(payload.payments.COD) + Number(payload.payments.KHALTI) + Number(payload.payments.ESEWA);
      if (enabledCount === 0) {
        setErr("At least one payment method must be enabled.");
        toast({ title: "Validation error", description: "At least one payment method must be enabled.", variant: "destructive", duration: 1800 });
        setLoading(false); return;
      }
      const res = await adminUpdateSettings(payload);
      const updated = res.data?.data || payload;
      setForm((p: any) => ({ ...p, ...updated, storePhone: updated?.storePhone ?? p.storePhone, storeLogo: updated?.storeLogo ?? p.storeLogo }));
      setMsg("Settings saved successfully");
      toast({ title: "Saved", description: "Settings saved successfully", duration: 1400 });
    } catch (e: any) {
      const m = e?.response?.data?.message || e?.message || "Failed to save settings";
      setErr(m);
      toast({ title: "Save failed", description: m, variant: "destructive", duration: 1800 });
    } finally { setLoading(false); }
  };
 
  const enabledPayments = [form.payments?.COD && "COD", form.payments?.KHALTI && "KHALTI", form.payments?.ESEWA && "eSewa"].filter(Boolean);
 
  return (
    <div className="space-y-5">
      {/* Head */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Settings</h1>
          <p className="mt-1 text-sm text-neutral-500">Store profile, shipping, inventory, payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSettings} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50">
            Refresh
          </button>
          <button onClick={save} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50">
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
 
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      {msg && <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700">{msg}</div>}
 
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: Store + Shipping + Inventory */}
        <div className="space-y-5 lg:col-span-2">
          {/* Store profile */}
          <div className={sectionCls}>
            <SectionHead icon={Store} title="Store Profile" subtitle="Displayed across the storefront and emails" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Store Name</label>
                <input value={form.storeName || ""} onChange={(e) => set("storeName", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Store Email</label>
                <input type="email" value={form.storeEmail || ""} onChange={(e) => set("storeEmail", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Store Phone</label>
                <input value={form.storePhone || ""} onChange={(e) => set("storePhone", e.target.value)} placeholder="+977 98XXXXXXXX" className={inputCls} />
              </div>
 
              {/* Logo */}
              <div className="sm:col-span-2">
                <label className={labelCls}>Store Logo</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                    {form.storeLogo ? <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" /> : <Store className="h-6 w-6 text-neutral-300" />}
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900">
                    <Upload className="h-4 w-4" /> Upload new logo
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      setLoading(true); setErr(""); setMsg("");
                      try {
                        const res = await adminUploadLogo(f);
                        const updated = res.data?.data;
                        setForm((p: any) => ({ ...p, storeLogo: updated?.storeLogo || p.storeLogo }));
                        setLogoBust(Date.now());
                        setMsg("Logo uploaded");
                        toast({ title: "Uploaded", duration: 1400 });
                      } catch (ex: any) {
                        const m = ex?.response?.data?.message || ex?.message || "Upload failed";
                        setErr(m); toast({ title: "Upload failed", description: m, variant: "destructive", duration: 1800 });
                      } finally { setLoading(false); e.target.value = ""; }
                    }} />
                  </label>
                  <p className="text-xs text-neutral-400">PNG/WebP, square, max 2MB</p>
                </div>
              </div>
 
              <div className="sm:col-span-2">
                <label className={labelCls}>Store Address (invoice footer)</label>
                <textarea value={form.storeAddress || ""} onChange={(e) => set("storeAddress", e.target.value)} rows={3} className={`${inputCls} h-auto py-2`} />
              </div>
            </div>
          </div>
 
          {/* Shipping */}
          <div className={sectionCls}>
            <SectionHead icon={Truck} title="Shipping" subtitle="Fees applied at checkout" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Default Shipping Fee (Rs)</label>
                <input type="number" min={0} value={form.shippingFeeDefault ?? 0} onChange={(e) => set("shippingFeeDefault", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Free Shipping Threshold (Rs)</label>
                <input type="number" placeholder="Leave empty to disable" value={form.freeShippingThreshold ?? ""} onChange={(e) => set("freeShippingThreshold", e.target.value)} className={inputCls} />
                <p className="mt-1 text-xs text-neutral-400">Orders above this amount get free shipping</p>
              </div>
            </div>
          </div>
 
          {/* Inventory */}
          <div className={sectionCls}>
            <SectionHead icon={Package2} title="Inventory" subtitle="Low stock alert threshold" />
            <div className="max-w-xs">
              <label className={labelCls}>Low Stock Threshold</label>
              <input type="number" min={1} value={form.lowStockThreshold ?? 5} onChange={(e) => set("lowStockThreshold", e.target.value)} className={inputCls} />
              <p className="mt-1 text-xs text-neutral-400">Products with stock ≤ this appear in Low Stock alerts</p>
            </div>
          </div>
 
          {/* Payments */}
          <div className={sectionCls}>
            <SectionHead icon={ShieldCheck} title="Payment Methods" subtitle="Enable or disable checkout options" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Toggle checked={!!form.payments?.COD} onChange={(v) => setPayment("COD", v)} label="Cash on Delivery" sublabel="Pay on arrival" />
              <Toggle checked={!!form.payments?.KHALTI} onChange={(v) => setPayment("KHALTI", v)} label="Khalti" sublabel="Online payment" />
              <Toggle checked={!!form.payments?.ESEWA} onChange={(v) => setPayment("ESEWA", v)} label="eSewa" sublabel="Online payment" />
            </div>
            {enabledPayments.length === 0 && <p className="mt-3 text-xs font-semibold text-red-600">At least one method must be enabled</p>}
          </div>
        </div>
 
        {/* Right: Live preview */}
        <div>
          <div className="sticky top-20 rounded-xl border border-neutral-200 bg-white p-5">
            <SectionHead icon={Eye} title="Preview" subtitle="How these settings appear in the store" />
            <div className="space-y-3 text-sm">
              {[
                { label: "Shipping", val: `Rs. ${num(form.shippingFeeDefault, 0)}` },
                { label: "Free shipping over", val: form.freeShippingThreshold === null || form.freeShippingThreshold === "" ? "Disabled" : `Rs. ${num(form.freeShippingThreshold, 0)}` },
                { label: "Low stock at", val: `≤ ${Math.max(1, num(form.lowStockThreshold, 5))} units` },
                { label: "Phone", val: String(form.storePhone || "—") },
                { label: "Email", val: String(form.storeEmail || "—") },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-neutral-500">{label}</span>
                  <span className="text-right font-semibold text-neutral-900">{val}</span>
                </div>
              ))}
 
              <div className="border-t border-neutral-100 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Payments enabled</p>
                <div className="flex flex-wrap gap-1.5">
                  {enabledPayments.length === 0 ? (
                    <span className="text-xs font-semibold text-red-600">None (invalid)</span>
                  ) : (
                    enabledPayments.map((p) => (
                      <span key={p as string} className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">{p}</span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Sticky save bar (mobile) */}
      <div className="sticky bottom-0 -mx-5 border-t border-neutral-200 bg-white px-5 py-3 md:hidden">
        <button onClick={save} disabled={loading} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}