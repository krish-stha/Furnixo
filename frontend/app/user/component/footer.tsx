"use client";

import { useEffect, useState } from "react";
import { getPublicSettings } from "@/lib/api/settings";
import Link from "next/link";

export function Footer() {
  const [storeName, setStoreName] = useState("Furnixo");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await getPublicSettings(); // { success, data }
        const data = res?.data ?? res ?? {};
        const name = String(data?.storeName || "").trim();
        if (!alive) return;
        if (name) setStoreName(name);
      } catch {
        // keep default
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <footer className="border-t bg-white mt-20">
      

      <div className="container mx-auto px-6 py-8">
        {/* Top Navigation Links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500 mb-6">
          <Link href="/privacy" className="hover:text-neutral-900 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-neutral-900 transition-colors">
            Terms of Service
          </Link>
          <Link href="/user/dashboard/contact" className="hover:text-neutral-900 transition-colors">
            Contact
          </Link>
        </div>

        {/* Bottom Row: Logo and Copyright */}
        <div className="flex items-center justify-between pt-4">
          {/* Circular Logo Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2a2a2a] text-white font-semibold text-lg shadow-sm">
            F
          </div>

          {/* Copyright Text */}
          <p className="text-sm text-neutral-600">
            © 2026 {storeName}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}