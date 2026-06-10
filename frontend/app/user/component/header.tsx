"use client";
 
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, LogOut, Package, Heart } from "lucide-react";
import { Button } from "@/app/auth/components/ui/button";
import { useAuth } from "@/lib/contexts/auth-contexts";
import Cookies from "js-cookie";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/contexts/cart-context";
import { useWishlist } from "@/lib/contexts/wishlist-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import UserProfilePanel from "../profile/UserProfilePanel";
 
import { usePublicSettings } from "@/lib/api/hooks/usePublicSettings";
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";
 
type CookieUser = {
  name?: string;
  email?: string;
  profile_picture?: string;
  profilePicture?: string;
  profilePictureUrl?: string;
  avatar?: string;
  photo?: string;
  image?: string;
  profile_photo?: string;
};
 
const COOKIE_KEY = "furnixo_user";
export const USER_UPDATED_EVENT = "furnixo_user_updated";
const PROFILE_CLOSE_EVENT = "furnixo_profile_close";
 
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
 
// ---------------- helpers ----------------
function normalizePhotoUrl(photo: string | null): string | null {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  if (!photo.includes("/"))
    return `${BACKEND_URL}/public/profile_photo/${photo}`;
  if (photo.startsWith("public/")) return `${BACKEND_URL}/${photo}`;
  if (photo.startsWith("/public/")) return `${BACKEND_URL}${photo}`;
  if (photo.startsWith("profile_photo/"))
    return `${BACKEND_URL}/public/${photo}`;
  if (photo.startsWith("/profile_photo/"))
    return `${BACKEND_URL}/public${photo}`;
  if (!photo.startsWith("/")) return `${BACKEND_URL}/${photo}`;
  return `${BACKEND_URL}${photo}`;
}
 
function withCacheBust(url: string | null): string | null {
  if (!url) return null;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${Date.now()}`;
}
 
function getCookieUser(): CookieUser | null {
  const raw = Cookies.get(COOKIE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CookieUser;
  } catch {
    return null;
  }
}
 
function getProfilePhoto(u: CookieUser | null): string | null {
  if (!u) return null;
  const raw =
    u.profilePicture ||
    u.profile_picture ||
    u.profilePictureUrl ||
    u.avatar ||
    u.photo ||
    u.image ||
    u.profile_photo ||
    null;
  return normalizePhotoUrl(raw);
}
 
function initials(name?: string, email?: string) {
  const n = (name || "").trim();
  if (n) return n[0].toUpperCase();
  const e = (email || "").trim();
  if (e) return e[0].toUpperCase();
  return "U";
}
 
function isRemoteUrl(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}
 
function resolveStoreLogo(storeLogo?: string | null) {
  const v = String(storeLogo || "").trim();
  if (!v) return "/images/furnixo-logo.png";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return v;
  return `${BACKEND_URL}/public/store_logo/${v}`;
}
// -----------------------------------------
 
export function Header() {
  const { user, isLoading, logout } = useAuth();
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const router = useRouter();
 
  const [profileOpen, setProfileOpen] = useState(false);
 
  const [cookieName, setCookieName] = useState("");
  const [cookieEmail, setCookieEmail] = useState("");
  const [cookiePhoto, setCookiePhoto] = useState<string | null>(null);
 
  // login dialog — shared by cart AND wishlist
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginNext, setLoginNext] = useState("/user/dashboard/cart");
  const [loginReason, setLoginReason] = useState(
    "You need to sign in to view your cart."
  );
 
  const settings: any = usePublicSettings();
  const storeName =
    String(settings?.storeName || "Furnixo").trim() || "Furnixo";
  const storeLogo = resolveStoreLogo(settings?.storeLogo);
 
  const requireLogin = (e: React.MouseEvent, next: string, reason: string) => {
    if (user) return;
    e.preventDefault();
    setLoginNext(next);
    setLoginReason(reason);
    setLoginOpen(true);
  };
 
  const syncFromCookie = () => {
    const cu = getCookieUser();
    setCookieName(cu?.name || "");
    setCookieEmail(cu?.email || "");
    setCookiePhoto(withCacheBust(getProfilePhoto(cu)));
  };
 
  useEffect(() => {
    syncFromCookie();
    const handler = () => syncFromCookie();
    window.addEventListener(USER_UPDATED_EVENT, handler);
    return () => window.removeEventListener(USER_UPDATED_EVENT, handler);
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
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
      <ConfirmDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        title="Login required"
        description={loginReason}
        confirmText="Go to login"
        cancelText="Not now"
        onConfirm={() => {
          setLoginOpen(false);
          router.push(`/auth/login?next=${encodeURIComponent(loginNext)}`);
        }}
      />
 
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={storeLogo}
            alt={`${storeName} Logo`}
            width={40}
            height={40}
            className="object-contain"
            unoptimized={isRemoteUrl(storeLogo)}
          />
          <div className="text-xl font-bold tracking-tight text-neutral-900">
            {storeName}
          </div>
        </Link>
 
        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Home
          </Link>
          <Link
            href="/shop"
            className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Shop
          </Link>
          <Link
            href="/about"
            className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Contact Us
          </Link>
 
          {user && (
            <Link
              href="/user/dashboard/orders"
              className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
            >
              My Orders
            </Link>
          )}
 
          {user?.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className="rounded-md border border-neutral-900 px-3 py-1 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
            >
              Admin Panel
            </Link>
          )}
        </nav>
 
        {/* Icons + Profile */}
        <div className="flex items-center gap-2">
          {/* Wishlist ♡ */}
          <Link
            href="/wishlist"
            id="wishlist-icon"
            className="relative rounded-md p-2 transition-colors hover:bg-neutral-100"
            aria-label="Wishlist"
            onClick={(e) =>
              requireLogin(e, "/wishlist", "You need to sign in to view your wishlist.")
            }
          >
            <Heart className="h-6 w-6 text-neutral-700" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-[11px] font-semibold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
 
          {/* Cart */}
          <Link
            href="/user/dashboard/cart"
            className="relative rounded-md p-2 transition-colors hover:bg-neutral-100"
            id="cart-icon"
            aria-label="Cart"
            onClick={(e) =>
              requireLogin(
                e,
                "/user/dashboard/cart",
                "You need to sign in to view your cart."
              )
            }
          >
            <ShoppingCart className="h-6 w-6 text-neutral-700" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
 
          {!isLoading && user && (
            <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
              <SheetTrigger asChild>
                <Button
                  onClick={() => setProfileOpen(true)}
                  className="gap-2 bg-neutral-900 text-white hover:bg-neutral-700"
                >
                  <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/20 ring-1 ring-white/30">
                    {cookiePhoto ? (
                      <img
                        src={cookiePhoto}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px] font-semibold">
                        {avatarInitial}
                      </span>
                    )}
                  </span>
                  <span className="max-w-[220px] truncate">{user.email}</span>
                </Button>
              </SheetTrigger>
 
              <SheetContent
                side="right"
                className="flex w-[380px] flex-col gap-0 p-0 sm:w-[440px]"
              >
                {/* ===== Header zone ===== */}
                <SheetHeader className="border-b border-neutral-200 px-6 pb-4 pt-6">
                  <SheetTitle className="text-left text-lg font-semibold text-neutral-900">
                    My Account
                  </SheetTitle>
                </SheetHeader>
 
                {/* ===== Scrollable body ===== */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  {/* quick links — two tiles */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/user/dashboard/orders"
                      onClick={() => setProfileOpen(false)}
                      className="group rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-900"
                    >
                      <Package className="h-5 w-5 text-neutral-900" strokeWidth={1.5} />
                      <div className="mt-2 text-sm font-semibold text-neutral-900">
                        My Orders
                      </div>
                      <div className="text-xs text-neutral-500">Track &amp; history</div>
                    </Link>
 
                    <Link
                      href="/wishlist"
                      onClick={() => setProfileOpen(false)}
                      className="group rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-900"
                    >
                      <Heart className="h-5 w-5 text-neutral-900" strokeWidth={1.5} />
                      <div className="mt-2 text-sm font-semibold text-neutral-900">
                        My Wishlist
                      </div>
                      <div className="text-xs text-neutral-500">
                        {wishlistCount > 0 ? `${wishlistCount} saved` : "Nothing saved yet"}
                      </div>
                    </Link>
                  </div>
 
                  {/* profile form */}
                  <div className="mt-8">
                    <UserProfilePanel />
                  </div>
                </div>
 
                {/* ===== Pinned footer ===== */}
                <div className="border-t border-neutral-200 px-6 py-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
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
              <Button className="bg-neutral-900 text-white hover:bg-neutral-700">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}