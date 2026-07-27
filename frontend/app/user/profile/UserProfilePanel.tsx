"use client";
 
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import { forgotPasswordApi } from "@/lib/api/auth";
import { Camera, Loader2, Trash2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
 
type CookieUser = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  profile_picture?: string;
  profilePicture?: string;
  profilePictureUrl?: string;
  avatar?: string;
  photo?: string;
  image?: string;
  profile_photo?: string;
  countryCode?: string;
  phone?: string;
  address?: string;
};
 
const COOKIE_KEY = "furnixo_user";
const USER_UPDATED_EVENT = "furnixo_user_updated";
const PROFILE_CLOSE_EVENT = "furnixo_profile_close";
 
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
 
function normalizePhotoUrl(photo: string | null): string | null {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  if (!photo.includes("/")) {
    return `${BACKEND_URL}/public/profile_photo/${photo}`;
  }
  if (photo.startsWith("./")) photo = photo.slice(2);
  if (photo.startsWith("public/")) return `${BACKEND_URL}/${photo}`;
  if (photo.startsWith("/public/")) return `${BACKEND_URL}${photo}`;
  if (photo.startsWith("profile_photo/")) return `${BACKEND_URL}/public/${photo}`;
  if (photo.startsWith("/profile_photo/")) return `${BACKEND_URL}/public${photo}`;
  if (!photo.startsWith("/")) return `${BACKEND_URL}/${photo}`;
  return `${BACKEND_URL}${photo}`;
}
 
function extractPhoto(obj: any): string | null {
  if (!obj) return null;
  return (
    obj.profile_picture ||
    obj.profilePicture ||
    obj.profilePictureUrl ||
    obj.avatar ||
    obj.photo ||
    obj.image ||
    obj.profile_photo ||
    obj?.data?.profile_picture ||
    obj?.data?.profilePicture ||
    null
  );
}
 
function initials(name?: string, email?: string) {
  const n = (name || "").trim();
  if (n) return n[0].toUpperCase();
  const e = (email || "").trim();
  if (e) return e[0].toUpperCase();
  return "U";
}
 
const inputCls =
  "h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-100";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500";
 
export default function UserProfilePanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
 
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "",
    phone: "",
    address: "",
  });
 
  const [file, setFile] = useState<File | null>(null);
  const [cookiePhoto, setCookiePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
 
  const fileRef = useRef<HTMLInputElement | null>(null);
 
  useEffect(() => {
    const raw = Cookies.get(COOKIE_KEY);
    if (!raw) return;
    try {
      const parsed: CookieUser = JSON.parse(raw);
      setForm((p) => ({
        ...p,
        fullName: (parsed as any)?.fullName || parsed?.name || "",
        email: parsed?.email || "",
        countryCode: (parsed as any)?.countryCode || "",
        phone: (parsed as any)?.phone || "",
        address: (parsed as any)?.address || "",
      }));
      setCookiePhoto(normalizePhotoUrl(extractPhoto(parsed)));
    } catch {
      // ignore
    }
  }, []);
 
  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);
 
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
 
  const avatarSrc = previewUrl || cookiePhoto;
  const initial = initials(form.fullName, form.email);
 
  const onChange = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
 
  const clearSelectedPhoto = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };
 
  const handleSubmit = async () => {
    const userId = (user as any)?.id || (user as any)?._id;
    if (!userId) {
      toast({
        title: "Session issue",
        description: "Please log out and log in again.",
        variant: "destructive",
      });
      return;
    }
 
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      if (file) fd.append("profilePicture", file);
 
      const res = await api.put(endpoints.auth.update(userId), fd);
 
      const updated = res?.data?.data ?? res?.data ?? {};
      const filename =
        (updated?.profile_picture as string | undefined) ||
        (updated?.profilePicture as string | undefined) ||
        undefined;
 
      const currentRaw = Cookies.get(COOKIE_KEY);
      const current: CookieUser = currentRaw ? JSON.parse(currentRaw) : {};
 
      const nextFilename = filename ?? current.profile_picture;
      const nextUrl = nextFilename
        ? `${BACKEND_URL}/public/profile_photo/${nextFilename}`
        : current.profilePicture || normalizePhotoUrl(extractPhoto(current));
 
      setCookiePhoto(nextUrl ? `${nextUrl}?t=${Date.now()}` : null);
 
      const nextCookie: CookieUser = {
        ...current,
        _id: updated?._id || current?._id,
        id: updated?.id || current?.id,
        role: updated?.role || current?.role,
        name: updated?.fullName || updated?.name || form.fullName || current?.name,
        fullName: updated?.fullName || form.fullName || current?.fullName,
        email: updated?.email || form.email || current?.email,
        countryCode: updated?.countryCode || form.countryCode || current?.countryCode,
        phone: updated?.phone || form.phone || current?.phone,
        address: updated?.address || form.address || current?.address,
        profile_picture: nextFilename,
        profilePicture: nextUrl ?? undefined,
      };
 
      Cookies.set(COOKIE_KEY, JSON.stringify(nextCookie), { path: "/" });
 
      window.dispatchEvent(new Event(USER_UPDATED_EVENT));
      window.dispatchEvent(new Event(PROFILE_CLOSE_EVENT));
 
      clearSelectedPhoto();
 
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
        duration: 1400,
      });
    } catch (e: any) {
      const m = e?.response?.data?.message || e?.message || "Update failed";
      toast({
        title: "Update failed",
        description: m,
        variant: "destructive",
        duration: 1800,
      });
    } finally {
      setLoading(false);
    }
  };
 
  // ✅ Verified password change: email a 6-digit code, then open the reset page
  const handleChangePassword = async () => {
    const email = form.email || (user as any)?.email;
    if (!email) {
      toast({ title: "No email on file", variant: "destructive" });
      return;
    }
    setSendingCode(true);
    try {
      await forgotPasswordApi(email);
      toast({
        title: "Verification code sent",
        description: `Check ${email} for a 6-digit code.`,
        duration: 2200,
      });
      window.dispatchEvent(new Event(PROFILE_CLOSE_EVENT));
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      toast({
        title: "Couldn't send code",
        description: e?.response?.data?.message || e?.message || "Try again later.",
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  };
 
  return (
    <div className="flex flex-col gap-6 pb-2">
      {/* ===== Identity header ===== */}
      <div className="flex items-center gap-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
 
        {/* avatar with hover camera overlay */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-100 ring-2 ring-neutral-200 transition-shadow hover:ring-neutral-900"
          aria-label="Change profile photo"
        >
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-700">
              {initial}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-neutral-900/0 opacity-0 transition-all group-hover:bg-neutral-900/50 group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" />
          </span>
        </button>
 
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-neutral-900">
            {form.fullName || "My Account"}
          </div>
          <div className="truncate text-sm text-neutral-500">
            {form.email || (user as any)?.email || "—"}
          </div>
          {file ? (
            <button
              type="button"
              onClick={clearSelectedPhoto}
              className="mt-1 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Remove selected photo
            </button>
          ) : (
            <p className="mt-1 text-xs text-neutral-400">Tap the photo to change it</p>
          )}
        </div>
      </div>
 
      {/* ===== Personal information ===== */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">Personal information</h3>
        <p className="mt-0.5 text-xs text-neutral-500">
          Used for delivery and order updates.
        </p>
 
        <div className="mt-4 grid gap-4">
          <div>
            <label className={labelCls}>Full name</label>
            <input
              className={inputCls}
              value={form.fullName}
              onChange={(e) => onChange("fullName", e.target.value)}
              placeholder="Your name"
            />
          </div>
 
          <div>
            <label className={labelCls}>Email</label>
            <input
              className={inputCls}
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
 
          <div className="grid grid-cols-[96px_1fr] gap-3">
            <div>
              <label className={labelCls}>Code</label>
              <input
                className={inputCls}
                value={form.countryCode}
                onChange={(e) => onChange("countryCode", e.target.value)}
                placeholder="+977"
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                className={inputCls}
                inputMode="tel"
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder="98XXXXXXXX"
              />
            </div>
          </div>
 
          <div>
            <label className={labelCls}>Address</label>
            <input
              className={inputCls}
              value={form.address}
              onChange={(e) => onChange("address", e.target.value)}
              placeholder="City, area"
            />
          </div>
        </div>
 
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 bg-neutral-900 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Saving…" : "Save changes"}
        </button>
      </div>
 
      {/* ===== Security ===== */}
      <div className="border-t border-neutral-200 pt-5">
        <h3 className="text-sm font-semibold text-neutral-900">Security</h3>
        <p className="mt-0.5 text-xs text-neutral-500">
          Password changes require email verification.
        </p>
 
        <button
          type="button"
          onClick={handleChangePassword}
          disabled={sendingCode}
          className="mt-3 flex w-full items-center gap-3 rounded-md border border-neutral-200 px-4 py-3 text-left transition-colors hover:border-neutral-900 disabled:opacity-60"
        >
          <ShieldCheck className="h-5 w-5 shrink-0 text-neutral-900" strokeWidth={1.5} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-neutral-900">
              {sendingCode ? "Sending code…" : "Change password"}
            </span>
            <span className="block text-xs text-neutral-500">
              We'll email you a 6-digit verification code
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}