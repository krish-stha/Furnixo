"use client";
 
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, UserPlus, Upload } from "lucide-react";
import { adminCreateUser } from "@/lib/api/admin/user";
import { useToast } from "@/hooks/use-toast";
 
const inputCls =
  "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const labelCls =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500";
const btnPrimary =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50";
const btnOutline =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-50";
 
export default function AdminCreateUserPage() {
  const router = useRouter();
  const { toast } = useToast();
 
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "",
    phone: "",
    address: "",
    password: "",
    role: "user",
  });
 
  const onChange = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));
 
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("profilePicture", file);
 
      await adminCreateUser(fd);
 
      toast({ title: "User created", description: "Account created successfully.", duration: 1400 });
      router.push("/admin/users");
    } catch (e: any) {
      toast({
        title: "Create failed",
        description: e?.response?.data?.message || e?.message || "Create failed",
        variant: "destructive",
        duration: 1800,
      });
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="space-y-5">
      {/* Head */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/users" className={btnOutline}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Create User
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Enter account details and assign a role
            </p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={loading} className={btnPrimary}>
          <UserPlus className="h-4 w-4" />
          {loading ? "Creating…" : "Create user"}
        </button>
      </div>
 
      <div className="grid gap-5 md:grid-cols-3">
        {/* Form */}
        <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-neutral-900">
            Account details
          </p>
          <p className="mb-5 text-xs text-neutral-500">
            Make sure email and role are correct before saving.
          </p>
 
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Full name</label>
              <input
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) => onChange("fullName", e.target.value)}
                className={inputCls}
              />
            </div>
 
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                className={inputCls}
              />
            </div>
 
            <div>
              <label className={labelCls}>Country code</label>
              <input
                placeholder="+977"
                value={form.countryCode}
                onChange={(e) => onChange("countryCode", e.target.value)}
                className={inputCls}
              />
            </div>
 
            <div>
              <label className={labelCls}>Phone</label>
              <input
                inputMode="tel"
                placeholder="98XXXXXXXX"
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                className={inputCls}
              />
            </div>
 
            <div className="sm:col-span-2">
              <label className={labelCls}>Address</label>
              <input
                placeholder="City, area"
                value={form.address}
                onChange={(e) => onChange("address", e.target.value)}
                className={inputCls}
              />
            </div>
 
            <div className="sm:col-span-2">
              <label className={labelCls}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => onChange("password", e.target.value)}
                className={inputCls}
              />
            </div>
 
            <div>
              <label className={labelCls}>Role</label>
              <select
                value={form.role}
                onChange={(e) => onChange("role", e.target.value)}
                className={inputCls}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
 
          <div className="mt-5 flex gap-2 border-t border-neutral-100 pt-5">
            <button onClick={handleSubmit} disabled={loading} className={btnPrimary}>
              {loading ? "Creating…" : "Create user"}
            </button>
            <Link href="/admin/users" className={btnOutline}>
              Cancel
            </Link>
          </div>
        </div>
 
        {/* Photo */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-neutral-900">
            Profile photo
          </p>
          <p className="text-xs text-neutral-500">Optional — can be added later.</p>
 
          <div className="mt-4">
            {file ? (
              <div className="mb-3 flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-neutral-900">
                    {file.name}
                  </p>
                  <button
                    onClick={() => setFile(null)}
                    className="text-[10px] text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-2xl font-bold text-neutral-400">
                {form.fullName?.[0]?.toUpperCase() || "?"}
              </div>
            )}
 
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900 w-fit">
              <Upload className="h-4 w-4" /> Choose photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}