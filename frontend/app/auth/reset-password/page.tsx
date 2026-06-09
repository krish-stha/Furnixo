"use client";
 
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
 
import AuthLayout, { authInput, authInputError, FieldError } from "../components/AuthLayout";
import { validationRules } from "@/lib/validation";
import { resetPasswordApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
 
function ResetPasswordForm() {
  const sp = useSearchParams();
 
  const [email, setEmail] = useState(sp.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
 
    const emailError = validationRules.email.validate(email);
    if (emailError) return setError(emailError);
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your email.");
    const passwordError = validationRules.password.validate(password);
    if (passwordError) return setError(passwordError);
 
    setLoading(true);
    try {
      await resetPasswordApi(email, code, password);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
 
  const label = "mb-1.5 block text-sm font-medium text-neutral-700";
 
  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Enter the 6-digit code we emailed you, then choose a new password"
      footer={
        !done && (
          <>
            Didn&apos;t get a code?{" "}
            <Link
              href="/auth/forgot-password"
              className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
            >
              Send again
            </Link>
          </>
        )
      }
    >
      {done ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-5 py-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-neutral-900" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-neutral-900">Password updated</p>
          <p className="mt-1 text-sm text-neutral-500">
            You can now sign in with your new password.
          </p>
          <Link
            href="/auth/login"
            className="mt-5 inline-block bg-neutral-900 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className={label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className={authInput}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              required
            />
          </div>
 
          <div>
            <label className={label}>Reset code</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="······"
              className={cn(
                authInput,
                "text-center text-xl font-semibold tracking-[0.6em]",
                error && authInputError
              )}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              required
            />
          </div>
 
          <div>
            <label className={label}>New password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                placeholder="••••••••"
                className={cn(authInput, "pr-11", error && authInputError)}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-900"
              >
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <FieldError message={error ?? undefined} />
          </div>
 
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full bg-neutral-900 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
 
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}