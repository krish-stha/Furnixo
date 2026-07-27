"use client";
 
import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Mail, User as UserIcon, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  adminListContactMessages,
  adminUpdateContactStatus,
  adminDeleteContactMessage,
  type ContactMessage,
} from "@/lib/api/contact";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";
import { NoteDialog } from "@/app/auth/components/ui/alert-dialog";
 
const inputCls    = "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const btnPrimary  = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline  = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
function statusPill(status: string) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize";
  if (s === "new")      return `${base} bg-amber-50 text-amber-700`;
  if (s === "read")     return `${base} bg-blue-50 text-blue-700`;
  if (s === "replied")  return `${base} bg-neutral-900 text-white`;
  if (s === "archived") return `${base} bg-neutral-100 text-neutral-500`;
  return `${base} bg-neutral-100 text-neutral-500`;
}
 
function fmtDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}
 
export default function AdminMessagesPage() {
  const { toast } = useToast();
 
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [rows,      setRows]      = useState<ContactMessage[]>([]);
  const [meta,      setMeta]      = useState({ total: 0, unreadCount: 0 });
  const [search,    setSearch]    = useState("");
  const [statusFil, setStatusFil] = useState("");
  const [page,      setPage]      = useState(1);
  const limit = 20;
 
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
 
  const fetchData = async (p = page) => {
    setLoading(true); setError("");
    try {
      const res = await adminListContactMessages({
        page: p, limit,
        search: search.trim() || undefined,
        status: statusFil || undefined,
      });
      setRows(res?.data || []);
      setMeta({ total: res?.meta?.total || 0, unreadCount: res?.meta?.unreadCount || 0 });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load messages");
      setRows([]); setMeta({ total: 0, unreadCount: 0 });
    } finally { setLoading(false); }
  };
 
  useEffect(() => { fetchData(1); /* eslint-disable-next-line */ }, [statusFil]);
 
  const totalPages = Math.max(1, Math.ceil(meta.total / limit));
 
  // mark as read when opened
  const openMessage = async (m: ContactMessage) => {
    setSelected(m);
    if (m.status === "new") {
      try {
        await adminUpdateContactStatus(m._id, "read");
        setRows((p) => p.map((r) => r._id === m._id ? { ...r, status: "read", readAt: new Date().toISOString() } : r));
        setMeta((p) => ({ ...p, unreadCount: Math.max(0, p.unreadCount - 1) }));
      } catch { /* ignore */ }
    }
  };
 
  const markReplied = async (adminNote: string) => {
    if (!selected) return;
    setLoading(true);
    try {
      await adminUpdateContactStatus(selected._id, "replied", adminNote);
      setRows((p) => p.map((r) => r._id === selected._id ? { ...r, status: "replied", adminNote, repliedAt: new Date().toISOString() } : r));
      setSelected((s) => s ? { ...s, status: "replied", adminNote, repliedAt: new Date().toISOString() } : s);
      setReplyOpen(false);
      toast({ title: "Marked as replied" });
    } catch (e: any) {
      toast({ title: "Failed", description: e?.response?.data?.message || e?.message, variant: "destructive" });
    } finally { setLoading(false); }
  };
 
  const archive = async (m: ContactMessage) => {
    setLoading(true);
    try {
      await adminUpdateContactStatus(m._id, "archived");
      setRows((p) => p.map((r) => r._id === m._id ? { ...r, status: "archived" } : r));
      setSelected((s) => s?._id === m._id ? { ...s, status: "archived" } : s);
      toast({ title: "Archived" });
    } catch (e: any) {
      toast({ title: "Failed", description: e?.response?.data?.message || e?.message, variant: "destructive" });
    } finally { setLoading(false); }
  };
 
  const remove = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await adminDeleteContactMessage(deleteId);
      setRows((p) => p.filter((r) => r._id !== deleteId));
      if (selected?._id === deleteId) setSelected(null);
      toast({ title: "Deleted" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.response?.data?.message || e?.message, variant: "destructive" });
    } finally { setLoading(false); setDeleteId(null); }
  };
 
  return (
    <div className="space-y-5">
      {/* head */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Messages</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {meta.total} message{meta.total !== 1 ? "s" : ""}
            {meta.unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                {meta.unreadCount} unread
              </span>
            )}
          </p>
        </div>
      </div>
 
      {/* filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchData(1); } }}
            placeholder="Search by name, email, subject…"
            className={`${inputCls} pl-9 w-full`}
          />
        </div>
        <select value={statusFil} onChange={(e) => setStatusFil(e.target.value)} className={inputCls}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={() => { setPage(1); fetchData(1); }} disabled={loading} className={btnPrimary}>Search</button>
        <button onClick={() => fetchData(page)} disabled={loading} className={btnOutline}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
 
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
 
      {/* split view: list + detail */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] min-w-0">
        {/* ── list ── */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="max-h-[640px] overflow-y-auto divide-y divide-neutral-100">
            {loading && rows.length === 0 ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2 px-5 py-4">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
                </div>
              ))
            ) : rows.length === 0 ? (
              <div className="px-5 py-16 text-center text-sm text-neutral-400">
                <Mail className="mx-auto mb-3 h-8 w-8 text-neutral-300" strokeWidth={1.4} />
                No messages
              </div>
            ) : (
              rows.map((m) => {
                const isSelected = selected?._id === m._id;
                const isUnread = m.status === "new";
                return (
                  <button
                    key={m._id}
                    onClick={() => openMessage(m)}
                    className={`flex w-full flex-col gap-1.5 px-5 py-3.5 text-left transition-colors hover:bg-neutral-50 ${isSelected ? "bg-neutral-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${isUnread ? "font-bold text-neutral-900" : "font-semibold text-neutral-700"}`}>
                        {m.name}
                        {m.user && <span className="ml-1.5 text-[10px] font-normal text-neutral-400">·user</span>}
                        {!m.user && <span className="ml-1.5 text-[10px] font-normal text-neutral-400">·guest</span>}
                      </p>
                      <span className={statusPill(m.status)}>{m.status}</span>
                    </div>
                    <p className="truncate text-xs text-neutral-500">{m.subject}</p>
                    <p className="truncate text-[11px] text-neutral-400">
                      {m.email} · {fmtDate(m.createdAt)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
 
          {/* pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
              <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchData(p); }} disabled={loading || page <= 1} className={btnOutline}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-neutral-500">
                Page <span className="font-semibold text-neutral-900">{page}</span> / {totalPages}
              </span>
              <button onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchData(p); }} disabled={loading || page >= totalPages} className={btnOutline}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
 
        {/* ── detail panel ── */}
        <div className="rounded-xl border border-neutral-200 bg-white min-w-0 overflow-hidden">
          {!selected ? (
            <div className="flex h-[640px] flex-col items-center justify-center px-6 text-center text-neutral-400">
              <Mail className="mb-3 h-10 w-10 text-neutral-300" strokeWidth={1.4} />
              <p className="text-sm">Select a message to view details</p>
            </div>
          ) : (
            <div className="flex h-full max-h-[640px] flex-col">
              {/* head */}
              <div className="border-b border-neutral-100 px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-neutral-900">{selected.subject}</h2>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-500">
                      <UserIcon className="h-3.5 w-3.5" /> {selected.name}
                      <span className="text-neutral-300">·</span>
                      <a href={`mailto:${selected.email}`} className="hover:underline">{selected.email}</a>
                      <span className="text-neutral-300">·</span>
                      <span>{fmtDate(selected.createdAt)}</span>
                    </div>
                  </div>
                  <span className={statusPill(selected.status)}>{selected.status}</span>
                </div>
              </div>
 
              {/* body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="rounded-lg bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap break-all">
  {selected.message}
</div>
 
                {selected.adminNote && (
                  <div className="mt-4 rounded-lg border border-neutral-200 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Internal note</p>
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selected.adminNote}</p>
                  </div>
                )}
 
                {selected.user && (
                  <div className="mt-4 rounded-lg border border-neutral-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Linked user account</p>
                    <p className="mt-1 text-sm text-neutral-700">{selected.user.fullName || "—"} · {selected.user.email}</p>
                  </div>
                )}
              </div>
 
              {/* actions */}
              <div className="flex flex-wrap gap-2 border-t border-neutral-100 px-6 py-4">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className={btnPrimary}
                >
                  <Mail className="h-4 w-4" /> Reply via email
                </a>
                <button onClick={() => setReplyOpen(true)} className={btnOutline}>
                  Mark as replied
                </button>
                {selected.status !== "archived" && (
                  <button onClick={() => archive(selected)} disabled={loading} className={btnOutline}>
                    Archive
                  </button>
                )}
                <button
                  onClick={() => setDeleteId(selected._id)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* dialogs */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Delete this message?"
        description="This action cannot be undone."
        confirmText={loading ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        destructive
        loading={loading}
        onConfirm={remove}
      />
 
      <NoteDialog
        open={replyOpen}
        onOpenChange={setReplyOpen}
        title="Mark as replied"
        description="Optionally add an internal note about how this was handled."
        placeholder="e.g. Replied via email with shipping info"
        confirmText="Save"
        label="Internal note (optional)"
        loading={loading}
        onConfirm={markReplied}
      />
    </div>
  );
}