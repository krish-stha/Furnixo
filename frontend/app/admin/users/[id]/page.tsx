"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Shield, User as UserIcon, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { adminGetUserById } from "@/lib/api/admin/user";
import { useToast } from "@/hooks/use-toast";
 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
 
function profileUrl(filename?: string | null) {
  if (!filename) return null;
  return `${BACKEND_URL}/public/profile_photo/${filename}`;
}
 
function formatDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "2-digit" });
}
 
function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-neutral-50 p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" strokeWidth={1.8} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-neutral-900">{value || "—"}</p>
      </div>
    </div>
  );
}
 
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
const btnPrimary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700";
 
export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    (async () => {
      try {
        const res = await adminGetUserById(id as string);
        setUser(res.data);
      } catch (e: any) {
        toast({ title: "Failed to load user", description: e?.response?.data?.message || e?.message, variant: "destructive" });
      } finally { setLoading(false); }
    })();
  }, [id]);
 
  const isAdmin = user?.role === "admin";
  const photo = profileUrl(user?.profile_picture);
  const initial = ((user?.fullName || user?.email || "U")[0] || "U").toUpperCase();
 
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-48 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }
 
  if (!user) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-neutral-500">User not found</p>
        <button onClick={() => router.push("/admin/users")} className={`${btnOutline} mt-4`}>Back to users</button>
      </div>
    );
  }
 
  return (
    <div className="space-y-5">
      {/* Head */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/users")} className={btnOutline}><ChevronLeft className="h-4 w-4" /></button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">{user.fullName || "User"}</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{user.email}</p>
          </div>
        </div>
        <Link href={`/admin/users/${user._id}/edit`} className={btnPrimary}>Edit user</Link>
      </div>
 
      <div className="grid gap-5 md:grid-cols-3">
        {/* Profile card */}
        <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-6">
          {/* avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-xl font-bold text-neutral-900">
              {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initial}
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900">{user.fullName || "—"}</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isAdmin ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                {isAdmin ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                {user.role}
              </span>
            </div>
          </div>
 
          {/* fields grid */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field icon={Mail} label="Email" value={user.email} />
            <Field icon={Phone} label="Phone" value={user.countryCode ? `${user.countryCode} ${user.phone || "—"}` : user.phone || "—"} />
            <Field icon={MapPin} label="Address" value={user.address || "—"} />
            <Field icon={Calendar} label="Joined" value={formatDate(user.createdAt)} />
          </div>
 
          {/* ID */}
          <div className="mt-3 rounded-lg bg-neutral-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">User ID</p>
            <p className="mt-1 font-mono text-sm text-neutral-900">{user._id}</p>
          </div>
        </div>
 
        {/* Actions */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold text-neutral-900">Actions</p>
          <p className="mt-1 text-xs text-neutral-500">Manage this account from the edit page.</p>
          <div className="mt-4 space-y-2">
            <Link href={`/admin/users/${user._id}/edit`} className={`${btnPrimary} w-full`}>Edit user</Link>
            <button onClick={() => router.push("/admin/users")} className={`${btnOutline} w-full`}>Back to list</button>
          </div>
        </div>
      </div>
    </div>
  );
}
 