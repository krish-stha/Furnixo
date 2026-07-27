"use client";
 
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
 
export const authInput =
  "h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-100";
 
export const authInputError = "border-red-400 focus:border-red-500 focus:ring-red-50";
 
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-600">{message}</p>;
}
 
export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* ===== Brand panel ===== */}
      <div className="relative hidden overflow-hidden bg-neutral-900 md:block">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url(/images/hero-furniture.jpg)" }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex w-fit items-center gap-3">
            <Image
              src="/images/furnixo-logo.png"
              alt="Furnixo"
              width={44}
              height={44}
              className="rounded-lg"
            />
            <span className="text-xl font-bold tracking-tight text-white">Furnixo</span>
          </Link>
 
          <div>
            <h2 className="max-w-md text-4xl font-bold leading-tight text-white">
              Where Traditional
              <br />
              Meets Modern
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
              Furniture crafted for contemporary living, timeless silhouettes,
              honest materials, built to last.
            </p>
          </div>
 
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Furnixo · Kathmandu, Nepal
          </p>
        </div>
      </div>
 
      {/* ===== Form panel ===== */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to store
          </Link>
 
          {/* mobile-only brand mark */}
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <Image
              src="/images/furnixo-logo.png"
              alt="Furnixo"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-lg font-bold tracking-tight text-neutral-900">Furnixo</span>
          </div>
 
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>}
 
          <div className="mt-8">{children}</div>
 
          {footer && <div className="mt-8 text-center text-sm text-neutral-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}