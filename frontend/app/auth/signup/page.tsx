"use client";
 
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
 
import AuthLayout, { authInput, authInputError, FieldError } from "../components/AuthLayout";
import { validationRules } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
 
export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
 
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    countryCode: "+977",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
 
  const [errors, setErrors] = useState<Record<string, string>>({});
 
  const validateField = (field: string, value: string) => {
    let error = "";
    if (field === "fullName") error = validationRules.fullName.validate(value);
    else if (field === "email") error = validationRules.email.validate(value);
    else if (field === "phone") error = validationRules.phone.validate(value);
    else if (field === "address") error = validationRules.address.validate(value);
    else if (field === "password") error = validationRules.password.validate(value);
    else if (field === "confirmPassword")
      error = validationRules.passwordMatch.validate(formData.password, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };
 
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };
 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
 
    const newErrors: Record<string, string> = {
      fullName: validationRules.fullName.validate(formData.fullName),
      email: validationRules.email.validate(formData.email),
      phone: validationRules.phone.validate(formData.phone),
      address: validationRules.address.validate(formData.address),
      password: validationRules.password.validate(formData.password),
      confirmPassword: validationRules.passwordMatch.validate(
        formData.password,
        formData.confirmPassword
      ),
    };
    const filteredErrors = Object.fromEntries(Object.entries(newErrors).filter(([, v]) => v));
    if (Object.keys(filteredErrors).length > 0) {
      setErrors(filteredErrors);
      return;
    }
 
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          countryCode: formData.countryCode,
          phone: formData.phone,
          address: formData.address,
          password: formData.password,
        }),
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        toast({
          title: "Registration failed",
          description: data.message || "Something went wrong.",
          variant: "destructive",
        });
        return;
      }
 
      toast({
        title: "Account created",
        description: "Redirecting you to sign in…",
      });
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch {
      toast({
        title: "Network error",
        description: "Unable to reach the server. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
 
  const label = "mb-1.5 block text-sm font-medium text-neutral-700";
 
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Furnixo — wishlist, faster checkout, order tracking"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-neutral-900 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className={label}>Full name</label>
          <input
            name="fullName"
            placeholder="Your name"
            className={cn(authInput, errors.fullName && authInputError)}
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />
          <FieldError message={errors.fullName} />
        </div>
 
        <div>
          <label className={label}>Email</label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            className={cn(authInput, errors.email && authInputError)}
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <FieldError message={errors.email} />
        </div>
 
        <div className="grid grid-cols-[96px_1fr] gap-3">
          <div>
            <label className={label}>Code</label>
            <input
              name="countryCode"
              placeholder="+977"
              className={authInput}
              value={formData.countryCode}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className={label}>Phone</label>
            <input
              name="phone"
              inputMode="tel"
              placeholder="98XXXXXXXX"
              className={cn(authInput, errors.phone && authInputError)}
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            <FieldError message={errors.phone} />
          </div>
        </div>
 
        <div>
          <label className={label}>Address</label>
          <input
            name="address"
            placeholder="City, area"
            className={cn(authInput, errors.address && authInputError)}
            value={formData.address}
            onChange={handleInputChange}
            required
          />
          <FieldError message={errors.address} />
        </div>
 
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className={cn(authInput, "pr-11", errors.password && authInputError)}
                value={formData.password}
                onChange={handleInputChange}
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
 
          <div>
            <label className={label}>Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                className={cn(authInput, "pr-11", errors.confirmPassword && authInputError)}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-900"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <FieldError message={errors.confirmPassword} />
          </div>
        </div>
 
        <button
          type="submit"
          disabled={isLoading}
          className="!mt-6 h-12 w-full bg-neutral-900 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isLoading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}