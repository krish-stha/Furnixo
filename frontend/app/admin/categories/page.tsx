"use client";
 
import { useEffect, useMemo, useState } from "react";
import { Plus, Tag } from "lucide-react";
import {
  adminCreateCategory, adminDeleteCategory,
  adminListCategories, adminUpdateCategory,
} from "@/lib/api/admin/category";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";
 
type Category = { _id: string; name: string; slug?: string; isActive?: boolean; };
 
function normalizeList(res: any): Category[] {
  const d = res?.data ?? res;
  return (d?.data ?? d) as Category[] || [];
}
 
const inputCls = "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const btnPrimary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
export default function AdminCategoriesPage() {
  const { toast } = useToast();
 
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
 
  const rows = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);
 
  const fetchAll = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminListCategories();
      setItems(normalizeList(res) || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load categories");
      setItems([]);
    } finally { setLoading(false); }
  };
 
  useEffect(() => { fetchAll(); }, []);
 
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };
 
  const createCategory = async () => {
    if (!newName.trim()) return;
    setLoading(true); setError("");
    try {
      await adminCreateCategory({ name: newName.trim() });
      setNewName("");
      await fetchAll();
      toast({ title: "Category created", duration: 2000 });
      showSuccess(`"${newName.trim()}" created`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to create category");
    } finally { setLoading(false); }
  };
 
  const startEdit = (c: Category) => { setEditingId(c._id); setEditName(c.name); setEditActive(c.isActive !== false); };
  const cancelEdit = () => { setEditingId(null); setEditName(""); };
 
  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setLoading(true); setError("");
    try {
      await adminUpdateCategory(editingId, { name: editName.trim(), isActive: editActive });
      await fetchAll();
      cancelEdit();
      toast({ title: "Category updated", duration: 2000 });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to update");
    } finally { setLoading(false); }
  };
 
  const openDelete = (c: Category) => { setDeleteId(c._id); setDeleteName(c.name); };
 
  const remove = async () => {
    if (!deleteId) return;
    setLoading(true); setError("");
    try {
      await adminDeleteCategory(deleteId);
      await fetchAll();
      toast({ title: "Category deleted", duration: 2000 });
      showSuccess(`"${deleteName}" deleted`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete");
    } finally { setLoading(false); setDeleteId(null); setDeleteName(""); }
  };
 
  return (
    <div className="space-y-5">
      {/* Head */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Categories</h1>
          <p className="mt-1 text-sm text-neutral-500">{items.length} categor{items.length === 1 ? "y" : "ies"}</p>
        </div>
      </div>
 
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {successMsg && <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">{successMsg}</div>}
 
      {/* Add new */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-neutral-900">Add new category</p>
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createCategory(); }}
            placeholder="Category name"
            disabled={loading}
            className={inputCls}
          />
          <button onClick={createCategory} disabled={loading || !newName.trim()} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
 
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
          <Tag className="h-4 w-4 text-neutral-400" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-neutral-900">All Categories</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && rows.length === 0 ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>{[...Array(4)].map((_, j) => <td key={j} className="px-5 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100" /></td>)}</tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-neutral-400">No categories yet</td></tr>
              ) : (
                rows.map((c) => {
                  const isEdit = editingId === c._id;
                  return (
                    <tr key={c._id} className="transition-colors hover:bg-neutral-50">
                      <td className="px-5 py-3">
                        {isEdit ? (
                          <input
                            className={inputCls}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                            disabled={loading}
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-neutral-900">{c.name}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-neutral-500">{c.slug || "—"}</td>
                      <td className="px-5 py-3">
                        {isEdit ? (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="accent-neutral-900" disabled={loading} />
                            <span className="text-neutral-700">{editActive ? "Active" : "Inactive"}</span>
                          </label>
                        ) : (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.isActive === false ? "bg-neutral-100 text-neutral-500" : "bg-neutral-900 text-white"}`}>
                            {c.isActive === false ? "Inactive" : "Active"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isEdit ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={saveEdit} disabled={loading} className={btnPrimary}>Save</button>
                            <button onClick={cancelEdit} disabled={loading} className={btnOutline}>Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3">
                            <button onClick={() => startEdit(c)} disabled={loading} className="text-sm font-medium text-neutral-700 underline-offset-4 hover:text-neutral-900 hover:underline">Edit</button>
                            <button onClick={() => openDelete(c)} disabled={loading} className="text-sm font-medium text-red-600 hover:text-red-700">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
 
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) { setDeleteId(null); setDeleteName(""); } }}
        title="Delete category?"
        description={`This will permanently delete "${deleteName || "this category"}".`}
        confirmText={loading ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        destructive
        onConfirm={remove}
        loading={loading}
      />
    </div>
  );
}