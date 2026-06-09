"use client";
 
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
 
import AuthLayout, { authInput, authInputError, FieldError } from "../components/AuthLayout";
import { validationRules } from "@/lib/validation";
import { forgotPasswordApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
 
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
 
    const emailError = validationRules.email.validate(email);
    if (emailError) {
      setError(emailError);
      return;
    }
 
    setLoading(true);
    try {
      await forgotPasswordApi(email);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a 6-digit reset code"
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {done ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-5 py-6 text-center">
          <MailCheck className="mx-auto h-8 w-8 text-neutral-900" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-neutral-900">Check your inbox</p>
          <p className="mt-1 text-sm text-neutral-500">
            If an account exists for{" "}
            <span className="font-medium text-neutral-700">{email}</span>, a 6-digit code
            is on its way.
          </p>
          <Link
            href={`/auth/reset-password?email=${encodeURIComponent(email)}`}
            className="mt-5 inline-block bg-neutral-900 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700"
          >
            Enter code
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className={cn(authInput, error && authInputError)}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              required
            />
            <FieldError message={error ?? undefined} />
          </div>
 
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full bg-neutral-900 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {loading ? "Sending…" : "Send reset code"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}