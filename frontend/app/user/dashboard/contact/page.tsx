"use client";
 
import { useEffect, useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, Check, AlertCircle } from "lucide-react";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { getPublicSettings } from "@/lib/api/settings";
import { submitContactMessage } from "@/lib/api/contact";
 
// optional: auto-fill name & email if user is logged in
import { useAuth } from "@/lib/contexts/auth-contexts";
 
type PublicSettings = {
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
};
 
const cardCls   = "rounded-xl border border-neutral-200 bg-white";
const labelCls  = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500";
const inputCls  = "h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-50";
 
export default function ContactPage() {
  const { user } = useAuth();
 
  const [s, setS] = useState<PublicSettings>({});
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
 
  // load store settings
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getPublicSettings();
        const data = res?.data ?? res ?? {};
        if (!alive) return;
        setS({
          storePhone:   String(data?.storePhone || ""),
          storeEmail:   String(data?.storeEmail || ""),
          storeAddress: String(data?.storeAddress || ""),
        });
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, []);
 
  // auto-fill from logged-in user
  useEffect(() => {
    if (!user) return;
    setForm((p) => ({
      ...p,
      name:  p.name  || (user as any)?.fullName || (user as any)?.name || "",
      email: p.email || (user as any)?.email    || "",
    }));
  }, [user]);
 
  const phone   = s.storePhone?.trim()   || "9823867733";
  const email   = s.storeEmail?.trim()   || "support@furnixo.com";
  const address = s.storeAddress?.trim() || "Kathmandu, Nepal";
 
  // ── validation ─────────────────────────────────────────────────────────
  const errors = {
    name:    !form.name.trim()    ? "Required" : null,
    email:   !form.email.trim()
              ? "Required"
              : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                ? "Invalid email"
                : null,
    subject: !form.subject.trim() ? "Required" : null,
    message: !form.message.trim()
              ? "Required"
              : form.message.trim().length < 10
                ? "At least 10 characters"
                : null,
  };
 
  const isValid =
    !errors.name && !errors.email && !errors.subject && !errors.message;
 
  const onChange = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const onBlur   = (k: string) => setTouched((p) => ({ ...p, [k]: true }));
 
  const onSubmit = async () => {
    setTouched({ name: true, email: true, subject: true, message: true });
    if (!isValid) return;
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      await submitContactMessage(form);
      setSuccess(true);
      setForm({ name: form.name, email: form.email, subject: "", message: "" });
      setTouched({});
      // reset success state after 6s
      setTimeout(() => setSuccess(false), 6000);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Could not send. Please try again.");
    } finally { setLoading(false); }
  };
 
  // ── UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />
 
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 py-10">
 
          {/* head */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Contact Us</h1>
            <p className="mt-1 text-sm text-neutral-500">
              We&apos;d love to hear from you. Send a message and we&apos;ll reply within 1–2 business days.
            </p>
          </div>
 
          <div className="grid gap-6 md:grid-cols-[320px_1fr]">
 
            {/* ───── LEFT: contact info cards ───── */}
            <div className="space-y-3">
              {[
                { icon: Phone,  label: "Phone",    value: phone },
                { icon: Mail,   label: "Email",    value: email },
                { icon: MapPin, label: "Showroom", value: address },
                { icon: Clock,  label: "Hours",    value: "Sun–Fri · 10:00 – 18:00" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className={`${cardCls} flex items-center gap-4 p-4`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900">
                    <Icon className="h-4 w-4 text-white" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
                    <p className="truncate text-sm font-semibold text-neutral-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
 
            {/* ───── RIGHT: form ───── */}
            <div className={`${cardCls} p-6 md:p-7`}>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-neutral-900">Send a message</h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {user ? `Signed in as ${(user as any)?.email || "you"}` : "You can send as a guest — we'll reply to your email."}
                </p>
              </div>
 
              {/* success */}
              {success && (
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" strokeWidth={2.5} />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Message sent</p>
                    <p className="text-xs text-neutral-500">Thanks — we&apos;ll get back to you soon.</p>
                  </div>
                </div>
              )}
 
              {/* error */}
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
 
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Your name</label>
                  <input
                    className={`${inputCls} ${touched.name && errors.name ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    onBlur={() => onBlur("name")}
                    disabled={loading}
                  />
                  {touched.name && errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>
 
                <div>
                  <label className={labelCls}>Your email</label>
                  <input
                    type="email"
                    className={`${inputCls} ${touched.email && errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => onChange("email", e.target.value)}
                    onBlur={() => onBlur("email")}
                    disabled={loading}
                  />
                  {touched.email && errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
 
                <div className="sm:col-span-2">
                  <label className={labelCls}>Subject</label>
                  <input
                    className={`${inputCls} ${touched.subject && errors.subject ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                    placeholder="e.g. Question about the Papasan Chair"
                    value={form.subject}
                    onChange={(e) => onChange("subject", e.target.value)}
                    onBlur={() => onBlur("subject")}
                    disabled={loading}
                  />
                  {touched.subject && errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
                </div>
 
                <div className="sm:col-span-2">
                  <label className={labelCls}>Message</label>
                  <textarea
                    rows={5}
                    maxLength={5000} 
                    className={`${inputCls} h-auto resize-none py-2.5 ${touched.message && errors.message ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                    placeholder="How can we help?"
                    value={form.message}
                    onChange={(e) => onChange("message", e.target.value)}
                    onBlur={() => onBlur("message")}
                    disabled={loading}
                  />
                  <div className="mt-1 flex items-center justify-between text-xs">
                    {touched.message && errors.message ? (
                      <p className="text-red-600">{errors.message}</p>
                    ) : (
                      <p className="text-neutral-400">{form.message.length} / 5000</p>
                    )}
                  </div>
                </div>
              </div>
 
              <button
                onClick={onSubmit}
                disabled={loading || !isValid}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 bg-neutral-900 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
 
      <Footer />
    </div>
  );
}
 