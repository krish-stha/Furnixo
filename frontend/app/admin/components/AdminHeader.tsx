"use client";
 
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, ChevronRight } from "lucide-react";
import Cookies from "js-cookie";
 
import { useAuth } from "@/lib/contexts/auth-contexts";
import { useSidebar } from "../contexts/SidebarContext";
import { adminDashboardSummary } from "@/lib/api/admin/dashboard";
import UserProfilePanel from "@/app/user/profile/UserProfilePanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/app/auth/components/ui/button";
 
// ─── cookie constants (keep in sync with your cookie rename) ────────────────
const COOKIE_KEY = "furnixo_user";
const USER_UPDATED_EVENT = "furnixo_user_updated";
const PROFILE_CLOSE_EVENT = "furnixo_profile_close";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
 
// ─── breadcrumb map ──────────────────────────────────────────────────────────
const CRUMB_LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  items: "Products",
  categories: "Categories",
  inventory: "Inventory",
  cart: "Cart",
  orders: "Orders",
  payments: "Payments",
  about: "About Page",
  users: "Users",
  settings: "Settings",
  logs: "Logs",
  "low-stock": "Low Stock",
  create: "Create",
  edit: "Edit",
};
 
function buildCrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let href = "";
  for (const part of parts) {
    href += `/${part}`;
    const label = CRUMB_LABELS[part] || (part.length === 24 ? `#${part.slice(-6).toUpperCase()}` : part);
    crumbs.push({ label, href });
  }
  return crumbs;
}
 
// ─── helpers ────────────────────────────────────────────────────────────────
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
 
function getCookieUser() {
  const raw = Cookies.get(COOKIE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as any; } catch { return null; }
}
 
function getProfilePhoto(u: any) {
  if (!u) return null;
  return normalizePhotoUrl(
    u.profilePicture || u.profile_picture || u.profilePictureUrl ||
    u.avatar || u.photo || u.image || u.profile_photo || null
  );
}
 
function initials(name?: string, email?: string) {
  return ((name || "").trim()[0] || (email || "").trim()[0] || "A").toUpperCase();
}
 
// ─── AdminHeader ─────────────────────────────────────────────────────────────
export function AdminHeader() {
  const { user, logout, isLoading } = useAuth();
  const { toggle } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
 
  const [profileOpen, setProfileOpen] = useState(false);
  const [cookieName, setCookieName] = useState("");
  const [cookieEmail, setCookieEmail] = useState("");
  const [cookiePhoto, setCookiePhoto] = useState<string | null>(null);
  const [pendingOrders, setPendingOrders] = useState(0);
 
  // breadcrumbs
  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);
 
  // live pending-orders count for notification bell
  useEffect(() => {
    adminDashboardSummary({})
      .then((res) => {
        const d = res?.data;
        const pending =
          Number(d?.pendingOrdersCount ?? d?.pendingOrders ?? 0);
        setPendingOrders(pending);
      })
      .catch(() => setPendingOrders(0));
  }, [pathname]); // refresh on navigation
 
  // cookie sync
  const syncFromCookie = () => {
    const cu = getCookieUser();
    setCookieName(cu?.name || cu?.fullName || "");
    setCookieEmail(cu?.email || "");
    setCookiePhoto(withCacheBust(getProfilePhoto(cu)));
  };
 
  useEffect(() => {
    syncFromCookie();
    window.addEventListener(USER_UPDATED_EVENT, syncFromCookie);
    return () => window.removeEventListener(USER_UPDATED_EVENT, syncFromCookie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);
 
  useEffect(() => {
    const close = () => setProfileOpen(false);
    window.addEventListener(PROFILE_CLOSE_EVENT, close);
    return () => window.removeEventListener(PROFILE_CLOSE_EVENT, close);
  }, []);
 
  const avatarInitial = useMemo(
    () => initials(cookieName, cookieEmail || user?.email),
    [cookieName, cookieEmail, user?.email]
  );
 
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-neutral-200 bg-white px-4 md:px-6">
      {/* mobile hamburger */}
      <button
        onClick={toggle}
        className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>
 
      {/* ── Breadcrumbs ── */}
      <nav className="flex flex-1 items-center gap-1 overflow-hidden text-sm">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" />}
            {i === crumbs.length - 1 ? (
              <span className="truncate font-semibold text-neutral-900">{c.label}</span>
            ) : (
              <Link
                href={c.href}
                className="truncate text-neutral-500 transition-colors hover:text-neutral-900"
              >
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
 
      {/* ── Right actions ── */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Notification bell — lit when pending orders > 0 */}
        <Link
          href="/admin/orders"
          aria-label="Pending orders"
          className="relative rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <Bell className="h-5 w-5" strokeWidth={1.8} />
          {pendingOrders > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-neutral-900">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-700 opacity-75" />
            </span>
          )}
        </Link>
 
        {/* Profile */}
        {!isLoading && user && (
          <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
            <SheetTrigger asChild>
              <button
                onClick={() => setProfileOpen(true)}
                className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-1.5 text-sm transition-colors hover:border-neutral-900"
              >
                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
                  {cookiePhoto ? (
                    <img src={cookiePhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    avatarInitial
                  )}
                </span>
                <span className="hidden max-w-[160px] truncate text-neutral-700 sm:block">
                  {cookieName || cookieEmail || user.email}
                </span>
              </button>
            </SheetTrigger>
 
            <SheetContent
              side="right"
              className="flex w-[380px] flex-col gap-0 p-0 sm:w-[440px]"
            >
              <SheetHeader className="border-b border-neutral-200 px-6 pb-4 pt-6">
                <SheetTitle className="text-left text-lg font-semibold text-neutral-900">
                  My Account
                </SheetTitle>
              </SheetHeader>
 
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <UserProfilePanel />
              </div>
 
              <div className="border-t border-neutral-200 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => { setProfileOpen(false); logout(); }}
                  className="w-full justify-center gap-2 border-neutral-300 text-neutral-700 hover:border-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}
 
        {!isLoading && !user && (
          <Link href="/auth/login">
            <Button className="h-9 bg-neutral-900 text-white hover:bg-neutral-700">
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}