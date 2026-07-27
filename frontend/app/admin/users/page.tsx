"use client";
 
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users, Plus, Shield, User as UserIcon, Search,
  ChevronLeft, ChevronRight, ArrowUpDown, Download, Trash2,
} from "lucide-react";
 
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { adminListUsers, adminSoftDeleteUser } from "@/lib/api/admin/user";
 
type RoleFilter = "all" | "admin" | "user";
type SortKey = "created_desc" | "created_asc" | "name_asc" | "name_desc" | "email_asc" | "email_desc";
 
type Meta = { total: number; page: number; limit: number; totalPages: number; hasNextPage?: boolean; hasPrevPage?: boolean; };
 
const inputCls = "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const btnPrimary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
 
function normalizePhotoUrl(photo: string | null): string | null {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  if (!photo.includes("/")) return `${BACKEND_URL}/public/profile_photo/${photo}`;
  if (photo.startsWith("public/")) return `${BACKEND_URL}/${photo}`;
  if (photo.startsWith("/public/")) return `${BACKEND_URL}${photo}`;
  if (photo.startsWith("profile_photo/")) return `${BACKEND_URL}/public/${photo}`;
  if (photo.startsWith("/profile_photo/")) return `${BACKEND_URL}/public${photo}`;
  if (!photo.startsWith("/")) return `${BACKEND_URL}/${photo}`;
  return `${BACKEND_URL}${photo}`;
}
 
function withCacheBust(url: string | null) {
  if (!url) return null;
  return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
}
 
function formatDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
 
const getCreatedValue = (u: any) => u.createdAt || u.created_at;
const asTime = (v?: string) => { if (!v) return 0; const t = new Date(v).getTime(); return Number.isFinite(t) ? t : 0; };
const csvEscape = (v: any) => { const s = String(v ?? ""); if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`; return s; };
 
export default function AdminUsersPage() {
  const { toast } = useToast();
 
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const [q, setQ] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [sort, setSort] = useState<SortKey>("created_desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
 
  const fetchUsers = async (p = page, l = pageSize) => {
    setLoading(true); setError(null);
    try {
      const res = await adminListUsers({ page: p, limit: l });
      const list = Array.isArray(res.data) ? res.data : [];
      const m = res.meta ?? null;
      setUsers(list);
      if (m) setMeta({ total: m.total ?? 0, page: m.page ?? p, limit: m.limit ?? l, totalPages: m.totalPages ?? 1, hasNextPage: m.hasNextPage, hasPrevPage: m.hasPrevPage });
      else setMeta({ total: list.length, page: p, limit: l, totalPages: Math.max(1, Math.ceil(list.length / l)) });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Unable to load users");
    } finally { setLoading(false); }
  };
 
  useEffect(() => { let m = true; (async () => { if (m) await fetchUsers(page, pageSize); })(); return () => { m = false; }; /* eslint-disable-next-line */ }, [page, pageSize]);
  useEffect(() => { setPage(1); }, [q, role, sort, pageSize]);
 
  const stats = useMemo(() => ({ total: meta.total, adminsOnPage: users.filter((u) => u.role === "admin").length, usersOnPage: users.filter((u) => u.role !== "admin").length }), [users, meta.total]);
 
  const filteredAndSorted = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = users.filter((u) => {
      const roleOk = role === "all" ? true : role === "admin" ? u.role === "admin" : u.role !== "admin";
      if (!roleOk) return false;
      if (!query) return true;
      return [u.fullName, u.email, u._id].filter(Boolean).join(" ").toLowerCase().includes(query);
    });
    return [...filtered].sort((a, b) => {
      const aName = String(a.fullName || "").toLowerCase(); const bName = String(b.fullName || "").toLowerCase();
      const aEmail = String(a.email || "").toLowerCase();   const bEmail = String(b.email || "").toLowerCase();
      const aC = asTime(getCreatedValue(a)); const bC = asTime(getCreatedValue(b));
      switch (sort) {
        case "created_desc": return bC - aC; case "created_asc": return aC - bC;
        case "name_asc": return aName.localeCompare(bName); case "name_desc": return bName.localeCompare(aName);
        case "email_asc": return aEmail.localeCompare(bEmail); case "email_desc": return bEmail.localeCompare(aEmail);
        default: return 0;
      }
    });
  }, [users, q, role, sort]);
 
  const totalPages = Math.max(1, meta.totalPages || 1);
  const safePage = Math.min(page, totalPages);
 
  const range = useMemo(() => {
    const t = meta.total ?? 0;
    if (!t) return { from: 0, to: 0 };
    return { from: (safePage - 1) * pageSize + 1, to: Math.min(safePage * pageSize, t) };
  }, [meta.total, safePage, pageSize]);
 
  const exportCSV = () => {
    const headers = ["ID", "Name", "Email", "Role", "Created"];
    const rows = filteredAndSorted.map((u) => [
      csvEscape(u._id), csvEscape(u.fullName), csvEscape(u.email),
      csvEscape(u.role), csvEscape(formatDate(getCreatedValue(u))),
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
 
  const handleDeleteFromList = async (id: string) => {
    setDeleteLoading(true);
    try {
      await adminSoftDeleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast({ title: "User deleted", duration: 2000 });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.response?.data?.message || e?.message, variant: "destructive" });
    } finally { setDeleteLoading(false); }
  };
 
  const sortBtn = (key: SortKey, label: string) => (
    <button onClick={() => setSort(key)} className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${sort === key ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-700"}`}>
      {label} <ArrowUpDown className="h-3 w-3" />
    </button>
  );
 
  return (
    <div className="space-y-5">
      {/* Head */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Users</h1>
          <p className="mt-1 text-sm text-neutral-500">{stats.total} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className={btnOutline}><Download className="h-4 w-4" /> Export CSV</button>
          <Link href="/admin/users/create" className={btnPrimary}><Plus className="h-4 w-4" /> New User</Link>
        </div>
      </div>
 
      {/* Stats pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "All", value: stats.total, key: "all", icon: Users },
          { label: "Admins (page)", value: stats.adminsOnPage, key: "admin", icon: Shield },
          { label: "Users (page)", value: stats.usersOnPage, key: "user", icon: UserIcon },
        ].map(({ label, value, key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setRole(key as RoleFilter)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${role === key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}: <span className="font-semibold">{value}</span>
          </button>
        ))}
      </div>
 
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
 
      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, ID…" className={`${inputCls} pl-9 w-full`} />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={inputCls}>
          <option value="created_desc">Newest first</option>
          <option value="created_asc">Oldest first</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="email_asc">Email A–Z</option>
          <option value="email_desc">Email Z–A</option>
        </select>
        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className={inputCls}>
          {[10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
 
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr className="text-left">
                <th className="px-4 py-3">{sortBtn("name_asc", "User")}</th>
                <th className="px-4 py-3">{sortBtn("email_asc", "Email")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Role</th>
                <th className="px-4 py-3 hidden sm:table-cell">{sortBtn("created_desc", "Joined")}</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100" /></td>)}</tr>
                ))
              ) : filteredAndSorted.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-400">No users match your filters</td></tr>
              ) : (
                filteredAndSorted.map((u) => {
                  const initial = (u.fullName?.trim()?.[0] || u.email?.[0] || "U").toUpperCase();
                  const isAdmin = u.role === "admin";
                  const photoUrl = withCacheBust(normalizePhotoUrl(u.profile_picture || null));
                  return (
                    <tr key={u._id} className="transition-colors hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 font-semibold text-neutral-700">
                            {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = ""; }} /> : initial}
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">{u.fullName || "—"}</div>
                            <div className="font-mono text-[10px] text-neutral-400">{String(u._id).slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${isAdmin ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                          {isAdmin ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-neutral-500 sm:table-cell">{formatDate(getCreatedValue(u))}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/users/${u._id}`} className="text-sm font-medium text-neutral-700 underline-offset-4 hover:text-neutral-900 hover:underline">View</Link>
                          <Link href={`/admin/users/${u._id}/edit`} className="text-sm font-medium text-neutral-700 underline-offset-4 hover:text-neutral-900 hover:underline">Edit</Link>
                          <button onClick={() => setDeleteId(u._id)} disabled={deleteLoading} className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
 
        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3">
          <span className="text-sm text-neutral-500">
            {range.from}–{range.to} of {meta.total} users
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className={btnOutline}><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm text-neutral-700">{safePage} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className={btnOutline}><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
 
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Delete this user?"
        description="This will soft-delete the user account."
        cancelText="Cancel"
        confirmText={deleteLoading ? "Deleting…" : "Delete"}
        destructive
        loading={deleteLoading}
        onConfirm={async () => { if (!deleteId) return; await handleDeleteFromList(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}