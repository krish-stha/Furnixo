"use client";
 
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
 
interface StatCardProps {
  title: string;
  value: any;
  icon?: React.ElementType;
  href?: string;
  loading?: boolean;
  accent?: "default" | "warning" | "danger";
}
 
export function StatCard({
  title,
  value,
  icon: Icon,
  href,
  loading = false,
  accent = "default",
}: StatCardProps) {
  const inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200",
        href && "cursor-pointer hover:-translate-y-0.5 hover:border-neutral-900 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            {title}
          </p>
          {loading ? (
            <div className="mt-3 h-8 w-24 animate-pulse rounded-md bg-neutral-100" />
          ) : (
            <p
              className={cn(
                "mt-2 text-3xl font-bold tracking-tight",
                accent === "warning" ? "text-amber-600" : "text-neutral-900",
                accent === "danger" ? "text-red-600" : ""
              )}
            >
              {value}
            </p>
          )}
        </div>
 
        <div className="flex flex-col items-end gap-3">
          {Icon && (
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                accent === "warning"
                  ? "bg-amber-50 text-amber-600"
                  : accent === "danger"
                  ? "bg-red-50 text-red-600"
                  : "bg-neutral-100 text-neutral-900"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
          )}
          {href && (
            <ArrowUpRight className="h-4 w-4 text-neutral-300 transition-colors group-hover:text-neutral-900" />
          )}
        </div>
      </div>
    </div>
  );
 
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}