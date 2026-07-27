"use client";
 
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Boxes,
  ShoppingCart,
  PackageSearch,
  CreditCard,
  Info,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Mail,
  ScrollText,
} from "lucide-react";
 
import { useSidebar } from "../contexts/SidebarContext";
import { usePublicSettings } from "@/lib/api/hooks/usePublicSettings";
import { adminContactUnreadCount } from "@/lib/api/contact";
 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
 
function resolveStoreLogo(storeLogo?: string | null) {
  const v = String(storeLogo || "").trim();
  if (!v) return "/images/furnixo-logo.png";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return v;
  return `${BACKEND_URL}/public/store_logo/${v}`;
}
 
// ─── NavItem ────────────────────────────────────────────────────────────────
function NavItem({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  icon: any;
  badge?: number;
}) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const active = pathname === href || pathname.startsWith(href + "/");
 
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={[
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "",
        active
          ? "bg-white/10 text-white"
          : "text-neutral-300 hover:bg-white/8 hover:text-white",
      ].join(" ")}
    >
      {/* left accent bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-white" />
      )}
 
      <div className="relative">
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
        {/* badge on collapsed icon */}
        {collapsed && badge !== undefined && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
 
      {!collapsed && <span className="flex-1">{label}</span>}
 
      {/* badge expanded */}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
 
// ─── Section label ───────────────────────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  const { collapsed } = useSidebar();
  if (collapsed) return <div className="my-2 border-t border-white/10" />;
  return (
    <p className="mt-5 mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-200">
      {title}
    </p>
  );
}
 
// ─── AdminSidebar ─────────────────────────────────────────────────────────────
export function AdminSidebar() {
  const { collapsed, toggle } = useSidebar();
  const settings: any = usePublicSettings();
  const storeName = String(settings?.storeName || "Furnixo").trim() || "Furnixo";
  const storeLogo = resolveStoreLogo(settings?.storeLogo);
 
  // ✅ unread message count — polls every 60s
  const [msgCount, setMsgCount] = useState(0);
 
  useEffect(() => {
    let alive = true;
    const fetchCount = async () => {
      try {
        const res = await adminContactUnreadCount();
        if (alive) setMsgCount(Number(res?.data?.count || 0));
      } catch {
        /* ignore */
      }
    };
    fetchCount();
    const t = setInterval(fetchCount, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
 
  return (
    <div className="flex h-full flex-col">
      {/* ── Logo ── */}
      <div
        className={[
          "flex h-16 shrink-0 items-center border-b border-white/10 px-4",
          collapsed ? "justify-center px-0" : "gap-3",
        ].join(" ")}
      >
        <Image
          src={storeLogo}
          alt={storeName}
          width={32}
          height={32}
          className="shrink-0 rounded-md object-contain"
          unoptimized
        />
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight text-white">
            {storeName}
          </span>
        )}
      </div>
 
      {/* ── Nav ── */}
      <nav
  className={[
    "flex-1 overflow-y-auto py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
    collapsed ? "px-2" : "px-3",
  ].join(" ")}
>
        <SectionLabel title="Overview" />
        <NavItem href="/admin/dashboard" label="Dashboard" icon={LayoutDashboard} />
 
        <SectionLabel title="Store" />
        <NavItem href="/admin/items"      label="Products"   icon={ShoppingBag} />
        <NavItem href="/admin/categories" label="Categories" icon={Tag} />
        <NavItem href="/admin/inventory"  label="Inventory"  icon={Boxes} />
        <NavItem href="/admin/cart"       label="Cart"       icon={ShoppingCart} />
        <NavItem href="/admin/orders"     label="Orders"     icon={PackageSearch} />
        <NavItem href="/admin/payments"   label="Payments"   icon={CreditCard} />
 
        <SectionLabel title="Content" />
        <NavItem href="/admin/about" label="About Page" icon={Info} />
        <NavItem href="/admin/legal" label="Legal"      icon={ScrollText} />
 
        <SectionLabel title="Customers" />
        <NavItem href="/admin/users" label="Users" icon={Users} />
        <NavItem
          href="/admin/messages"
          label="Messages"
          icon={Mail}
          badge={msgCount > 0 ? msgCount : undefined}
        />
 
        <SectionLabel title="System" />
        <NavItem href="/admin/settings" label="Settings" icon={Settings} />
      </nav>
 
      {/* ── Footer: view store + collapse toggle ── */}
      <div
        className={[
          "shrink-0 border-t border-white/10 py-3",
          collapsed ? "px-2" : "px-3",
        ].join(" ")}
      >
        <Link
          href="/"
          title={collapsed ? "View store" : undefined}
          className={[
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-100 transition-colors hover:bg-white/5 hover:text-neutral-200",
            collapsed ? "justify-center px-0" : "",
          ].join(" ")}
        >
          <Store className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>View store</span>}
        </Link>
 
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-white/5 hover:text-white",
            collapsed ? "justify-center px-0" : "",
          ].join(" ")}
        >
          {collapsed ? (
            <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.8} />
          ) : (
            <>
              <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}