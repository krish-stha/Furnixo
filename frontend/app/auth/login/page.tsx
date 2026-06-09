"use client";
 
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
 
import AuthLayout, { authInput, authInputError, FieldError } from "../components/AuthLayout";
import { validationRules } from "@/lib/validation";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { cn } from "@/lib/utils";
 
function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
 
  const validateField = (field: string, value: string) => {
    let error = "";
    if (field === "email") error = validationRules.email.validate(value);
    if (field === "password") error = validationRules.password.validate(value);
    setErrors((prev) => ({ ...prev, [field]: error, general: "" }));
  };
 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
 
    const emailError = validationRules.email.validate(email);
    const passwordError = validationRules.password.validate(password);
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }
 
    setIsLoading(true);
    try {
      await login(email, password);
      const next = searchParams.get("next");
      router.replace(next || "/");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 401
          ? "Email or password is incorrect."
          : err?.response?.data?.message || err?.message || "Login failed. Please try again.";
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue shopping"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-neutral-900 underline-offset-4 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      {errors.general && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}
 
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className={cn(authInput, errors.email && authInputError)}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateField("email", e.target.value);
            }}
            required
          />
          <FieldError message={errors.email} />
        </div>
 
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-neutral-700">Password</label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-neutral-500 transition-colors hover:text-neutral-900"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={cn(authInput, "pr-11", errors.password && authInputError)}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validateField("password", e.target.value);
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-900"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <FieldError message={errors.password} />
        </div>
 
        <button
          type="submit"
          disabled={isLoading || !!errors.email || !!errors.password}
          className="h-12 w-full bg-neutral-900 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
 
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}