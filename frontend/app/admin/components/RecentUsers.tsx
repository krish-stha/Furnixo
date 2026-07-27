"use client";
 
import Link from "next/link";
import { Users } from "lucide-react";
 
function roleBadge(role: string) {
  return String(role).toLowerCase() === "admin"
    ? "bg-neutral-900 text-white"
    : "bg-neutral-100 text-neutral-600";
}
 
function initials(name?: string, email?: string) {
  const n = (name || email || "?").trim();
  return n[0].toUpperCase();
}
 
function formatDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return ""; }
}
 
export function RecentUsers({ loading, rows }: { loading: boolean; rows: any[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-neutral-400" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-neutral-900">Recent Users</span>
        </div>
        <Link
          href="/admin/users"
          className="text-xs font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-neutral-900 hover:underline"
        >
          View all
        </Link>
      </div>
 
      <div className="divide-y divide-neutral-100">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-40 animate-pulse rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-400">No users yet</p>
        ) : (
          rows.map((u: any) => (
            <Link
              key={u._id}
              href={`/admin/users/${u._id}`}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-neutral-50"
            >
              {/* avatar */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-900">
                {initials(u.fullName, u.email)}
              </span>
 
              {/* info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {u.fullName || "—"}
                </p>
                <p className="mt-0.5 truncate text-xs text-neutral-500">{u.email || "—"}</p>
              </div>
 
              {/* role + date */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadge(u.role)}`}>
                  {u.role || "user"}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {formatDate(u.createdAt)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
 