"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { ChevronLeft, Save, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-contexts";
import {
  adminGetUserById, adminUpdateUser, adminSoftDeleteUser,
} from "@/lib/api/admin/user";
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
 
const COOKIE_KEY = "furnixo_user";  
const USER_UPDATED_EVENT = "furnixo_user_updated";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
 
function profileUrl(filename?: string | null) {
  if (!filename) return null;
  return `${BACKEND_URL}/public/profile_photo/${filename}`;
}
 
const inputCls = "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500";
const btnPrimary = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
export default function AdminUserEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
 
  const [form, setForm] = useState({
    fullName: "", email: "", countryCode: "", phone: "",
    address: "", password: "", role: "user",
  });
 
  const [file, setFile] = useState<File | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
 
  const onChange = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
 
  useEffect(() => {
    (async () => {
      try {
        const res = await adminGetUserById(id as string);
        const u = res.data;
        setForm({ fullName: u.fullName || "", email: u.email || "", countryCode: u.countryCode || "", phone: u.phone || "", address: u.address || "", password: "", role: u.role || "user" });
        setCurrentPhoto(profileUrl(u.profile_picture));
      } catch (e: any) {
        toast({ title: "Load failed", description: e?.response?.data?.message || e?.message, variant: "destructive", duration: 1800 });
      }
    })();
  }, [id]);
 
  const handleSave = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (file) fd.append("profilePicture", file);
 
      const res = await adminUpdateUser(id as string, fd);
      const updated = res?.data?.data ?? res?.data ?? {};
 
      toast({ title: "Saved", description: "User updated successfully.", duration: 1400 });
 
      // sync cookie if editing self
      if (authUser && (authUser as any).id === id) {
        const raw = Cookies.get(COOKIE_KEY);
        const current = raw ? JSON.parse(raw) : {};
        Cookies.set(COOKIE_KEY, JSON.stringify({
          ...current,
          name: updated?.fullName || form.fullName,
          fullName: updated?.fullName || form.fullName,
          email: updated?.email || form.email,
          profile_picture: updated?.profile_picture,
        }), { path: "/" });
        window.dispatchEvent(new Event(USER_UPDATED_EVENT));
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update user";
      toast({ title: "Save failed", description: msg, variant: "destructive", duration: 1800 });
    } finally { setLoading(false); }
  };
 
  const handleDelete = async () => {
    setLoading(true);
    try {
      await adminSoftDeleteUser(id as string);
      toast({ title: "User deleted", duration: 2000 });
      router.push("/admin/users");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to delete user";
      toast({ title: "Delete failed", description: msg, variant: "destructive", duration: 1800 });
    } finally { setLoading(false); }
  };
 
  const previewUrl = file ? URL.createObjectURL(file) : currentPhoto;
  const initial = ((form.fullName || form.email || "U")[0] || "U").toUpperCase();
 
  return (
    <div className="space-y-5">
      {/* Head */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/users/${id}`} className={btnOutline}><ChevronLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Edit User</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{form.email}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={loading} className={btnPrimary}>
          <Save className="h-4 w-4" /> {loading ? "Saving…" : "Save changes"}
        </button>
      </div>
 
      <div className="grid gap-5 md:grid-cols-3">
        {/* Form */}
        <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-neutral-900">Profile information</p>
 
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Full name</label>
              <input value={form.fullName} onChange={(e) => onChange("fullName", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Country code</label>
              <input value={form.countryCode} onChange={(e) => onChange("countryCode", e.target.value)} placeholder="+977" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="98XXXXXXXX" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Address</label>
              <input value={form.address} onChange={(e) => onChange("address", e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>New password (leave empty to keep current)</label>
              <input type="password" value={form.password} onChange={(e) => onChange("password", e.target.value)} placeholder="••••••••" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select value={form.role} onChange={(e) => onChange("role", e.target.value)} className={inputCls}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
        </div>
 
        {/* Side: photo + danger */}
        <div className="space-y-4">
          {/* Photo */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-neutral-900">Profile photo</p>
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-2xl font-bold text-neutral-900">
              {previewUrl ? <img src={previewUrl} alt="" className="h-full w-full object-cover" /> : initial}
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900 w-fit">
              <Upload className="h-4 w-4" /> Choose photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {file && <p className="mt-1.5 text-xs text-neutral-500">{file.name}</p>}
          </div>
 
          {/* Danger zone */}
          <div className="rounded-xl border border-red-200 bg-white p-5">
            <p className="text-sm font-semibold text-neutral-900">Danger zone</p>
            <p className="mt-1 text-xs text-neutral-500">Soft-delete this account permanently.</p>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-300 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Delete user
            </button>
          </div>
        </div>
      </div>
 
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this user?"
        description="This will soft-delete the user account. This action cannot be undone."
        cancelText="Cancel"
        confirmText={loading ? "Deleting…" : "Delete"}
        destructive
        loading={loading}
        onConfirm={async () => { await handleDelete(); setConfirmOpen(false); }}
      />
    </div>
  );
}
 