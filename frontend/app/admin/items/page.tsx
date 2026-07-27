"use client";
 
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/auth/components/ui/button";
import { Card, CardContent } from "@/app/auth/components/ui/card";
 
import {
  adminCreateProduct,
  adminListProducts,
  adminUpdateProduct,
  adminSoftDeleteProduct,
} from "@/lib/api/admin/product";
 
import { adminListCategories } from "@/lib/api/admin/category";
 
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";
import { COLOR_HEX, type ProductColor, type ProductMaterial } from "@/lib/types";
 
const COLORS: ProductColor[] = ["white", "black", "grey", "brown", "blue", "green"];
const MATERIALS: ProductMaterial[] = ["wood", "metal", "marble", "leather", "leatherette", "fabric"];
 
type Category = { _id: string; name: string; slug?: string };
 
type Product = {
  _id: string;
  name: string;
  sku: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  status: "active" | "draft";
  description?: string;
  images?: string[];
  category?: Category | string;
  color?: ProductColor | null;
  material?: ProductMaterial | null;
  isNewArrival?: boolean;
};
 
type PageMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};
 
function catIdOf(p: Product) {
  if (!p.category) return "";
  if (typeof p.category === "string") return p.category;
  return p.category._id;
}
 
function catNameOf(p: Product) {
  if (!p.category) return "-";
  if (typeof p.category === "string") return "-";
  return p.category.name || "-";
}
 
function normalizeSku(s: string) {
  return s.trim().toUpperCase();
}
 
export default function AdminItemsPage() {
  const { toast } = useToast();
 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PageMeta>({
    total: 0, page: 1, limit: 10, totalPages: 1,
    hasNextPage: false, hasPrevPage: false,
  });
 
  const [categories, setCategories] = useState<Category[]>([]);
 
  // list controls
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
 
  // create form
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [discountStr, setDiscountStr] = useState("");
  const [stockStr, setStockStr] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [categoryId, setCategoryId] = useState("");
  const [color, setColor] = useState<string>("");
  const [material, setMaterial] = useState<string>("");
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
 
  // ✅ live preview URL from selected file
  const previewUrl = useMemo(() => {
    if (!files?.length) return null;
    return URL.createObjectURL(files[0]);
  }, [files]);
 
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);
 
  // edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eSku, setESku] = useState("");
  const [ePriceStr, setEPriceStr] = useState("");
  const [eDiscountStr, setEDiscountStr] = useState("");
  const [eStockStr, setEStockStr] = useState("");
  const [eStatus, setEStatus] = useState<"active" | "draft">("active");
  const [eCategoryId, setECategoryId] = useState("");
  const [eColor, setEColor] = useState<string>("");
  const [eMaterial, setEMaterial] = useState<string>("");
  const [eIsNewArrival, setEIsNewArrival] = useState(false);
  const [eDescription, setEDescription] = useState("");
  const [eFiles, setEFiles] = useState<FileList | null>(null);
 
  const [deleteId, setDeleteId] = useState<string | null>(null);
 
  const fetchAll = async (p = page, l = limit, s = search) => {
    setLoading(true); setError("");
    try {
      const [pRes, cRes] = await Promise.all([
        adminListProducts({ page: p, limit: l, search: s.trim() || undefined }),
        adminListCategories(),
      ]);
      const data = pRes?.data ?? [];
      const m = pRes?.meta;
      setProducts(Array.isArray(data) ? data : []);
      setMeta(m ?? { total: Array.isArray(data) ? data.length : 0, page: p, limit: l, totalPages: 1, hasNextPage: false, hasPrevPage: p > 1 });
      setCategories(cRes?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Network Error");
    } finally { setLoading(false); }
  };
 
  useEffect(() => { fetchAll(page, limit, search); /* eslint-disable-next-line */ }, [page, limit]);
 
  const onSearch = async () => { setPage(1); await fetchAll(1, limit, search); };
 
  const parsePrices = (priceS: string, discountS: string) => {
    const price = priceS.trim() === "" ? 0 : Number(priceS);
    const discount = discountS.trim() === "" ? 0 : Number(discountS);
    if (!Number.isFinite(price) || price < 0) return { err: "Price must be 0 or more" };
    if (!Number.isFinite(discount) || discount < 0) return { err: "Discount price must be 0 or more" };
    if (discount > 0 && discount >= price) return { err: "Discount price must be lower than the regular price" };
    return { price, discount };
  };
 
  const appendCommon = (fd: FormData, v: { price: number; discount: number; stock: number; status: string; categoryId: string; color: string; material: string; isNewArrival: boolean; description: string; }) => {
    fd.append("price", String(v.price));
    fd.append("discountPrice", String(v.discount));
    fd.append("stock", String(v.stock));
    fd.append("status", v.status);
    fd.append("categoryId", v.categoryId);
    fd.append("color", v.color);
    fd.append("material", v.material);
    fd.append("isNewArrival", v.isNewArrival ? "true" : "false");
    fd.append("description", v.description || "");
  };
 
  const create = async () => {
    const n = name.trim(); const s = normalizeSku(sku);
    if (!n) return setError("Product name is required");
    if (!s) return setError("SKU is required");
    if (!categoryId) return setError("Category is required");
    const pr = parsePrices(priceStr, discountStr);
    if ("err" in pr) return setError(pr.err!);
    const stock = stockStr.trim() === "" ? 0 : Number(stockStr);
    if (!Number.isFinite(stock) || stock < 0) return setError("Stock must be 0 or more");
    const fd = new FormData();
    fd.append("name", n); fd.append("sku", s);
    appendCommon(fd, { price: pr.price!, discount: pr.discount!, stock, status, categoryId, color, material, isNewArrival, description });
    if (files) Array.from(files).forEach((f) => fd.append("images", f));
    setLoading(true); setError("");
    try {
      await adminCreateProduct(fd);
      toast({ title: "Created", description: "Product created successfully", duration: 1200 });
      setName(""); setSku(""); setPriceStr(""); setDiscountStr(""); setStockStr("");
      setStatus("active"); setCategoryId(""); setColor(""); setMaterial("");
      setIsNewArrival(false); setDescription(""); setFiles(null);
      await fetchAll(page, limit, search);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Create failed";
      setError(msg); toast({ title: "Create failed", description: msg, variant: "destructive", duration: 1600 });
    } finally { setLoading(false); }
  };
 
  const startEdit = (p: Product) => {
    setEditingId(p._id); setEName(p.name || ""); setESku(p.sku || "");
    setEPriceStr(String(p.price ?? "")); setEDiscountStr(p.discountPrice ? String(p.discountPrice) : "");
    setEStockStr(String(p.stock ?? "")); setEStatus(p.status || "active");
    setECategoryId(catIdOf(p)); setEColor(p.color || ""); setEMaterial(p.material || "");
    setEIsNewArrival(Boolean(p.isNewArrival)); setEDescription(p.description || ""); setEFiles(null);
  };
 
  const cancelEdit = () => {
    setEditingId(null); setEName(""); setESku(""); setEPriceStr(""); setEDiscountStr("");
    setEStockStr(""); setEStatus("active"); setECategoryId(""); setEColor(""); setEMaterial("");
    setEIsNewArrival(false); setEDescription(""); setEFiles(null);
  };
 
  const saveEdit = async () => {
    if (!editingId) return;
    const n = eName.trim(); const s = normalizeSku(eSku);
    if (!n) return setError("Product name is required");
    if (!s) return setError("SKU is required");
    if (!eCategoryId) return setError("Category is required");
    const pr = parsePrices(ePriceStr, eDiscountStr);
    if ("err" in pr) return setError(pr.err!);
    const stock = eStockStr.trim() === "" ? 0 : Number(eStockStr);
    if (!Number.isFinite(stock) || stock < 0) return setError("Stock must be 0 or more");
    const fd = new FormData();
    fd.append("name", n); fd.append("sku", s);
    appendCommon(fd, { price: pr.price!, discount: pr.discount!, stock, status: eStatus, categoryId: eCategoryId, color: eColor, material: eMaterial, isNewArrival: eIsNewArrival, description: eDescription });
    if (eFiles) Array.from(eFiles).forEach((f) => fd.append("images", f));
    setLoading(true); setError("");
    try {
      await adminUpdateProduct(editingId, fd);
      cancelEdit();
      toast({ title: "Saved", description: "Product updated successfully", duration: 1200 });
      await fetchAll(page, limit, search);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Update failed";
      setError(msg); toast({ title: "Update failed", description: msg, variant: "destructive", duration: 1600 });
    } finally { setLoading(false); }
  };
 
  const remove = async (id: string) => {
    setLoading(true); setError("");
    try {
      await adminSoftDeleteProduct(id);
      toast({ title: "Deleted", description: "Product deleted successfully", duration: 1200 });
      await fetchAll(page, limit, search);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Delete failed";
      setError(msg); toast({ title: "Delete failed", description: msg, variant: "destructive", duration: 1600 });
    } finally { setLoading(false); }
  };
 
  const rows = useMemo(() => products || [], [products]);
 
  // live preview values
  const previewPrice = Number(priceStr || 0);
  const previewDiscount = Number(discountStr || 0);
  const previewOnSale = previewDiscount > 0 && previewDiscount < previewPrice;
 
  const inputCls = "mt-1 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";
  const selectCls = inputCls;
 
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Products</h1>
        <p className="mt-1 text-sm text-neutral-500">Create, edit, and manage items in your store.</p>
      </div>
 
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
 
      {/* ===== CREATE + LIVE PREVIEW ===== */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <p className="text-sm font-semibold text-neutral-900">Add new product</p>
        </div>
 
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_260px]">
          {/* form */}
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Product name</label>
                <input className={inputCls} placeholder="e.g. Papasan Chair" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">SKU</label>
                <input className={inputCls} placeholder="e.g. FRX-0013" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
            </div>
 
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Price (Rs.)</label>
                <input className={inputCls} placeholder="e.g. 1200" inputMode="numeric" value={priceStr} onChange={(e) => setPriceStr(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Discount price (Rs.)</label>
                <input className={inputCls} placeholder="optional — shows SALE" inputMode="numeric" value={discountStr} onChange={(e) => setDiscountStr(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Initial stock</label>
                <input className={inputCls} placeholder="e.g. 50" inputMode="numeric" value={stockStr} onChange={(e) => setStockStr(e.target.value)} />
              </div>
            </div>
 
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Color</label>
                <select className={selectCls} value={color} onChange={(e) => setColor(e.target.value)}>
                  <option value="">No color</option>
                  {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Material</label>
                <select className={selectCls} value={material} onChange={(e) => setMaterial(e.target.value)}>
                  <option value="">No material</option>
                  {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Status</label>
                <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
 
            <div className="grid items-end gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Category</label>
                <select className={selectCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
 
              <div className="flex items-center gap-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Images</label>
                  <input
                    className="mt-1 block text-sm text-neutral-700"
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                  />
                  {files?.length ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      {files.length} image{files.length > 1 ? "s" : ""} selected · preview →
                    </p>
                  ) : null}
                </div>
 
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="h-4 w-4 accent-neutral-900"
                  />
                  Mark as NEW
                </label>
              </div>
            </div>
 
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Description</label>
              <textarea
                className={inputCls}
                placeholder="Short description shown on product page"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
 
            <button
              className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 md:w-44"
              onClick={create}
              disabled={loading}
            >
              {loading ? "Creating…" : "Create Product"}
            </button>
          </div>
 
          {/* ===== LIVE CARD PREVIEW ===== */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Card preview
            </p>
            <div className="rounded-lg border border-neutral-200 bg-white">
              {/* image area — renders actual selected image */}
              <div className="relative aspect-square overflow-hidden rounded-t-lg bg-neutral-100">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                    {files?.length ? `${files.length} file${files.length > 1 ? "s" : ""} — first shown` : "No image selected"}
                  </div>
                )}
 
                {/* badge */}
                {previewOnSale ? (
                  <span className="absolute left-2 top-2 bg-red-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                    Sale
                  </span>
                ) : isNewArrival ? (
                  <span className="absolute left-2 top-2 bg-neutral-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                    New
                  </span>
                ) : null}
              </div>
 
              {/* info */}
              <div className="space-y-1 p-3">
                <div className="truncate text-sm font-medium text-neutral-900">
                  {name || <span className="text-neutral-400">Product name</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">
                    Rs.{" "}
                    {(previewOnSale ? previewDiscount : previewPrice).toLocaleString("en-IN") || "0"}
                  </span>
                  {previewOnSale && (
                    <span className="text-xs text-neutral-400 line-through">
                      Rs. {previewPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {color && (
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-neutral-300"
                    style={{ backgroundColor: COLOR_HEX[color as ProductColor] }}
                    title={color}
                  />
                )}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">
              Updates live as you fill the form
            </p>
          </div>
        </div>
      </div>
 
      {/* ===== LIST CONTROLS ===== */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:flex-row md:items-center">
        <div className="flex w-full items-center gap-2 md:w-auto">
          <input
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none md:w-72"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
          />
          <button onClick={onSearch} disabled={loading} className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-700 hover:border-neutral-900 disabled:opacity-50">
            Search
          </button>
        </div>
 
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          Rows:
          <select
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
            value={limit}
            onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
          >
            {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {meta.total ? <span className="ml-1 text-neutral-400">· {meta.total} total</span> : null}
        </div>
      </div>
 
      {/* ===== LIST + INLINE EDIT ===== */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Color / Material</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
 
            <tbody className="divide-y divide-neutral-100">
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-neutral-400" colSpan={8}>
                    {loading ? "Loading…" : "No products found."}
                  </td>
                </tr>
              )}
 
              {rows.map((p) => {
                const isEdit = editingId === p._id;
                const editInput = "w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none";
 
                return (
                  <tr key={p._id} className="align-top transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <input className={editInput} value={eName} onChange={(e) => setEName(e.target.value)} />
                      ) : (
                        <span className="font-medium text-neutral-900">
                          {p.name}
                          {p.isNewArrival && (
                            <span className="ml-2 bg-neutral-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                              New
                            </span>
                          )}
                        </span>
                      )}
                    </td>
 
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <input className={editInput} value={eSku} onChange={(e) => setESku(e.target.value)} />
                      ) : (
                        <span className="font-mono text-xs text-neutral-600">{p.sku}</span>
                      )}
                    </td>
 
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <select className={editInput} value={eCategoryId} onChange={(e) => setECategoryId(e.target.value)}>
                          <option value="">Select category</option>
                          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-neutral-600">{catNameOf(p)}</span>
                      )}
                    </td>
 
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <div className="space-y-2">
                          <select className={editInput} value={eColor} onChange={(e) => setEColor(e.target.value)}>
                            <option value="">No color</option>
                            {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select className={editInput} value={eMaterial} onChange={(e) => setEMaterial(e.target.value)}>
                            <option value="">No material</option>
                            {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
                            <input type="checkbox" checked={eIsNewArrival} onChange={(e) => setEIsNewArrival(e.target.checked)} className="h-3.5 w-3.5 accent-neutral-900" />
                            NEW badge
                          </label>
                        </div>
                      ) : (
                        <span className="flex items-center gap-2 capitalize text-neutral-600">
                          {p.color ? (
                            <span title={p.color} className="inline-block h-3 w-3 rounded-full border border-neutral-300" style={{ backgroundColor: COLOR_HEX[p.color] }} />
                          ) : null}
                          {p.color ?? "—"} / {p.material ?? "—"}
                        </span>
                      )}
                    </td>
 
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <div className="space-y-2">
                          <input className={editInput} inputMode="numeric" placeholder="Price" value={ePriceStr} onChange={(e) => setEPriceStr(e.target.value)} />
                          <input className={editInput} inputMode="numeric" placeholder="Discount (optional)" value={eDiscountStr} onChange={(e) => setEDiscountStr(e.target.value)} />
                        </div>
                      ) : (
                        <span>
                          {p.discountPrice ? (
                            <>
                              <span className="font-semibold text-neutral-900">Rs. {Number(p.discountPrice)}</span>{" "}
                              <span className="text-xs text-neutral-400 line-through">Rs. {Number(p.price || 0)}</span>
                            </>
                          ) : (
                            <span className="text-neutral-900">Rs. {Number(p.price || 0)}</span>
                          )}
                        </span>
                      )}
                    </td>
 
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <input className={editInput} inputMode="numeric" value={eStockStr} onChange={(e) => setEStockStr(e.target.value)} />
                      ) : (
                        <span className={p.stock <= 5 ? "font-semibold text-red-600" : "text-neutral-900"}>
                          {Number(p.stock || 0)}
                        </span>
                      )}
                    </td>
 
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <select className={editInput} value={eStatus} onChange={(e) => setEStatus(e.target.value as any)}>
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                        </select>
                      ) : (
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${p.status === "active" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"}`}>
                          {p.status}
                        </span>
                      )}
                    </td>
 
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isEdit ? (
                          <>
                            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-900">
                              Add images
                              <input type="file" multiple className="hidden" onChange={(e) => setEFiles(e.target.files)} />
                            </label>
                            <button className="inline-flex h-9 items-center rounded-lg bg-neutral-900 px-4 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50" onClick={saveEdit} disabled={loading}>Save</button>
                            <button className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-4 text-xs font-semibold text-neutral-700 hover:border-neutral-900 disabled:opacity-50" onClick={cancelEdit} disabled={loading}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-4 text-xs font-semibold text-neutral-700 hover:border-neutral-900 disabled:opacity-50" onClick={() => startEdit(p)} disabled={loading}>Edit</button>
                            <button className="inline-flex h-9 items-center rounded-lg border border-red-300 px-4 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50" onClick={() => setDeleteId(p._id)} disabled={loading}>Delete</button>
                          </>
                        )}
                      </div>
 
                      {isEdit && (
                        <div className="mt-2">
                          <textarea
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                            placeholder="Description"
                            rows={2}
                            value={eDescription}
                            onChange={(e) => setEDescription(e.target.value)}
                          />
                          {eFiles?.length ? (
                            <p className="mt-1 text-xs text-neutral-500">{eFiles.length} image(s) selected</p>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
 
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
          <span className="text-sm text-neutral-500">
            Page <span className="font-semibold text-neutral-900">{meta.page}</span> / {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-700 hover:border-neutral-900 disabled:opacity-50" disabled={loading || !meta.hasPrevPage} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <button className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-700 hover:border-neutral-900 disabled:opacity-50" disabled={loading || !meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </div>
 
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Delete this product?"
        description="This action cannot be undone."
        confirmText={loading ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        destructive
        loading={loading}
        onConfirm={async () => {
          if (!deleteId) return;
          await remove(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
 