"use client";
 
import { useEffect, useState } from "react";
import { Search, CreditCard, RotateCcw } from "lucide-react";
import {
  adminListPaymentLogs, adminListRefunds,
  adminApproveRefund, adminRejectRefund, adminMarkRefundProcessed,
} from "@/lib/api/admin/payment";
import { useToast } from "@/hooks/use-toast";
import { NoteDialog } from "@/app/auth/components/ui/alert-dialog";
 
function rsFromPaisa(paisa: any) {
  const v = Number(paisa ?? 0);
  return `Rs. ${Number.isFinite(v) ? Math.round(v / 100).toLocaleString("en-IN") : 0}`;
}
 
function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}
 
function refundStatusPill(status: string) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
  if (s === "requested") return `${base} bg-amber-50 text-amber-700`;
  if (s === "approved")  return `${base} bg-blue-50 text-blue-700`;
  if (s === "processed") return `${base} bg-neutral-900 text-white`;
  if (s === "rejected")  return `${base} bg-red-50 text-red-700`;
  return `${base} bg-neutral-100 text-neutral-600`;
}
 
function payStatusPill(status: string) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
  if (s === "success" || s === "completed") return `${base} bg-neutral-900 text-white`;
  if (s === "pending")   return `${base} bg-amber-50 text-amber-700`;
  if (s === "failed")    return `${base} bg-red-50 text-red-700`;
  return `${base} bg-neutral-100 text-neutral-600`;
}
 
const inputCls = "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const btnPrimary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<"logs" | "refunds">("logs");
  const { toast } = useToast();
 
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [logRows, setLogRows] = useState<any[]>([]);
  const [logTotal, setLogTotal] = useState(0);
 
  const [rfLoading, setRfLoading] = useState(false);
  const [rfError, setRfError] = useState("");
  const [rfStatus, setRfStatus] = useState("");
  const [rfPage, setRfPage] = useState(1);
  const [rfRows, setRfRows] = useState<any[]>([]);
  const [rfTotal, setRfTotal] = useState(0);
 
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteMode, setNoteMode] = useState<"approve" | "reject">("approve");
  const [targetRefund, setTargetRefund] = useState<any | null>(null);
 
  const limit = 20;
  const logPages = Math.max(1, Math.ceil(logTotal / limit));
  const rfPages = Math.max(1, Math.ceil(rfTotal / limit));
 
  const openApprove = (r: any) => { setTargetRefund(r); setNoteMode("approve"); setNoteOpen(true); };
  const openReject = (r: any) => { setTargetRefund(r); setNoteMode("reject"); setNoteOpen(true); };
 
  const loadLogs = async (p = logPage) => {
    setLogLoading(true); setLogError("");
    try {
      const res = await adminListPaymentLogs({ page: p, limit, search: logSearch.trim() || undefined });
      setLogRows(res.data?.data || []); setLogTotal(res.data?.meta?.total || 0);
    } catch (e: any) {
      setLogError(e?.response?.data?.message || e?.message || "Failed to load logs");
      setLogRows([]); setLogTotal(0);
    } finally { setLogLoading(false); }
  };
 
  const loadRefunds = async (p = rfPage) => {
    setRfLoading(true); setRfError("");
    try {
      const res = await adminListRefunds({ page: p, limit, status: rfStatus || undefined });
      setRfRows(res.data?.data || []); setRfTotal(res.data?.meta?.total || 0);
    } catch (e: any) {
      setRfError(e?.response?.data?.message || e?.message || "Failed to load refunds");
      setRfRows([]); setRfTotal(0);
    } finally { setRfLoading(false); }
  };
 
  useEffect(() => { loadLogs(1); loadRefunds(1); /* eslint-disable-next-line */ }, []);
 
  const onConfirmNote = async (note: string) => {
    if (!targetRefund) return;
    try {
      if (noteMode === "approve") { await adminApproveRefund(targetRefund._id, note); toast({ title: "Approved", description: "Refund approved." }); }
      else { await adminRejectRefund(targetRefund._id, note); toast({ title: "Rejected", description: "Refund rejected." }); }
      setNoteOpen(false); setTargetRefund(null);
      await loadRefunds(rfPage);
    } catch (e: any) {
      toast({ title: "Failed", description: e?.response?.data?.message || e?.message || "Action failed", variant: "destructive" });
    }
  };
 
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Payments</h1>
        <p className="mt-1 text-sm text-neutral-500">Payment logs, refunds, and audit trail</p>
      </div>
 
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1 w-fit">
        {([{ key: "logs", label: "Payment Logs", icon: CreditCard }, { key: "refunds", label: "Refund Requests", icon: RotateCcw }] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex h-8 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors ${tab === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} /> {label}
          </button>
        ))}
      </div>
 
      {tab === "logs" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={logSearch} onChange={(e) => setLogSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setLogPage(1); loadLogs(1); } }} placeholder="Search by order ID, pidx, transaction ID…" className={`${inputCls} pl-9 w-full`} />
            </div>
            <button onClick={() => { setLogPage(1); loadLogs(1); }} disabled={logLoading} className={btnPrimary}>Search</button>
            <span className="flex items-center text-sm text-neutral-500">{logTotal} total</span>
          </div>
 
          {logError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{logError}</div>}
 
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Gateway</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {logLoading ? (
                    [...Array(5)].map((_, i) => <tr key={i}>{[...Array(9)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100" /></td>)}</tr>)
                  ) : logRows.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-neutral-400">No logs</td></tr>
                  ) : (
                    logRows.map((r) => (
                      <tr key={r._id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 text-neutral-500">{fmtDate(r.createdAt)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-900">{String(r.order?._id || r.order || "—").slice(-10)}</td>
                        <td className="px-4 py-3 text-neutral-700">{r.user?.email || r.user?.fullName || "—"}</td>
                        <td className="px-4 py-3 text-neutral-700">{r.gateway}</td>
                        <td className="px-4 py-3 text-neutral-700">{r.action}</td>
                        <td className="px-4 py-3"><span className={payStatusPill(r.status)}>{r.status}</span></td>
                        <td className="px-4 py-3 font-semibold text-neutral-900">{rsFromPaisa(r.amountPaisa)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-500">{r.ref || "—"}</td>
                        <td className="px-4 py-3 text-neutral-500">{r.message || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
              <button onClick={() => { const p = Math.max(1, logPage - 1); setLogPage(p); loadLogs(p); }} disabled={logLoading || logPage <= 1} className={btnOutline}>Prev</button>
              <span className="text-sm text-neutral-500">Page <span className="font-semibold text-neutral-900">{logPage}</span> / {logPages}</span>
              <button onClick={() => { const p = Math.min(logPages, logPage + 1); setLogPage(p); loadLogs(p); }} disabled={logLoading || logPage >= logPages} className={btnOutline}>Next</button>
            </div>
          </div>
        </div>
      )}
 
      {tab === "refunds" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-white p-4">
            <select value={rfStatus} onChange={(e) => setRfStatus(e.target.value)} className={inputCls}>
              <option value="">All statuses</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processed">Processed</option>
            </select>
            <button onClick={() => { setRfPage(1); loadRefunds(1); }} disabled={rfLoading} className={btnPrimary}>Apply</button>
            <span className="flex items-center text-sm text-neutral-500">{rfTotal} total</span>
          </div>
 
          {rfError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{rfError}</div>}
 
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rfLoading ? (
                    [...Array(4)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100" /></td>)}</tr>)
                  ) : rfRows.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-neutral-400">No refunds</td></tr>
                  ) : (
                    rfRows.map((r) => (
                      <tr key={r._id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 text-neutral-500">{fmtDate(r.createdAt)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-900">{String(r.order?._id || r.order || "—").slice(-8).toUpperCase()}</td>
                        <td className="px-4 py-3 text-neutral-700">{r.user?.email || r.user?.fullName || "—"}</td>
                        <td className="px-4 py-3 font-semibold text-neutral-900">{rsFromPaisa(r.amountPaisa)}</td>
                        <td className="px-4 py-3"><span className={refundStatusPill(r.status)}>{r.status}</span></td>
                        <td className="px-4 py-3 text-neutral-500">{r.reason || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {r.status === "requested" && (
                              <>
                                <button onClick={() => openApprove(r)} className={btnPrimary + " h-8 px-3 text-xs"}>Approve</button>
                                <button onClick={() => openReject(r)} className="inline-flex h-8 items-center rounded-lg border border-red-300 px-3 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white">Reject</button>
                              </>
                            )}
                            {r.status === "approved" && (
                              <button onClick={async () => {
                                try { await adminMarkRefundProcessed(r._id); toast({ title: "Processed" }); loadRefunds(rfPage); }
                                catch (e: any) { toast({ title: "Failed", description: e?.response?.data?.message || e?.message, variant: "destructive" }); }
                              }} className={btnOutline + " h-8 px-3 text-xs"}>
                                Mark Processed
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
              <button onClick={() => { const p = Math.max(1, rfPage - 1); setRfPage(p); loadRefunds(p); }} disabled={rfLoading || rfPage <= 1} className={btnOutline}>Prev</button>
              <span className="text-sm text-neutral-500">Page <span className="font-semibold text-neutral-900">{rfPage}</span> / {rfPages}</span>
              <button onClick={() => { const p = Math.min(rfPages, rfPage + 1); setRfPage(p); loadRefunds(p); }} disabled={rfLoading || rfPage >= rfPages} className={btnOutline}>Next</button>
            </div>
          </div>
        </div>
      )}
 
      <NoteDialog
        open={noteOpen}
        onOpenChange={(v) => { setNoteOpen(v); if (!v) setTargetRefund(null); }}
        title={noteMode === "approve" ? "Approve refund?" : "Reject refund?"}
        description={targetRefund ? `Order: ${String(targetRefund.order?._id || "—").slice(-10)} · Amount: ${rsFromPaisa(targetRefund.amountPaisa)}` : ""}
        placeholder={noteMode === "approve" ? "Approval note (optional)…" : "Reason for rejection (optional)…"}
        confirmText={noteMode === "approve" ? "Approve" : "Reject"}
        destructive={noteMode === "reject"}
        onConfirm={onConfirmNote}
      />
    </div>
  );
}