"use client";
 
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
 
function statusStyle(status: string) {
  switch (String(status).toLowerCase()) {
    case "pending":     return "bg-neutral-100 text-neutral-700";
    case "confirmed":   return "bg-blue-50 text-blue-700";
    case "shipped":     return "bg-amber-50 text-amber-700";
    case "delivered":   return "bg-neutral-900 text-white";
    case "cancelled":   return "bg-red-50 text-red-700";
    default:            return "bg-neutral-100 text-neutral-600";
  }
}
 
function payStyle(status: string) {
  return String(status).toLowerCase() === "paid"
    ? "bg-neutral-900 text-white"
    : "bg-neutral-100 text-neutral-500";
}
 
function initials(name?: string, email?: string) {
  const n = (name || email || "?").trim();
  return n[0].toUpperCase();
}
 
export function RecentOrders({ loading, rows }: { loading: boolean; rows: any[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-neutral-400" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-neutral-900">Recent Orders</span>
        </div>
        <Link
          href="/admin/orders"
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
                  <div className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-400">No orders yet</p>
        ) : (
          rows.map((o: any) => (
            <Link
              key={o._id}
              href={`/admin/orders/${o._id}`}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-neutral-50"
            >
              {/* avatar */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                {initials(o.user?.fullName, o.user?.email)}
              </span>
 
              {/* info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {o.user?.fullName || o.user?.email || "Guest"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle(o.status)}`}>
                    {o.status}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${payStyle(o.paymentStatus)}`}>
                    {o.paymentStatus}
                  </span>
                  <span className="text-[10px] text-neutral-400">{o.paymentMethod}</span>
                </div>
              </div>
 
              {/* amount */}
              <span className="shrink-0 text-sm font-bold text-neutral-900">
                Rs. {Number(o.total || 0).toLocaleString("en-IN")}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}