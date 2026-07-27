"use client";
 
import type { ReactNode } from "react";
import { AdminHeader } from "./components/AdminHeader";
import { AdminSidebar } from "./components/AdminSidebar";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
 
function AdminShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
 
  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* ===== Dark sidebar ===== */}
      <aside
        className={[
          "hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40 bg-neutral-950 transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[240px]",
        ].join(" ")}
      >
        <AdminSidebar />
      </aside>
 
      {/* ===== Main area ===== */}
      <div
        className={[
          "flex flex-col flex-1 min-w-0 transition-all duration-300",
          collapsed ? "lg:ml-[68px]" : "lg:ml-[240px]",
        ].join(" ")}
      >
        <AdminHeader />
 
        <main className="flex-1 px-5 py-6 md:px-8">
          {children}
        </main>
 
        <footer className="px-8 py-4 text-xs text-neutral-400 border-t border-neutral-200">
          © {new Date().getFullYear()} Furnixo Admin
        </footer>
      </div>
    </div>
  );
}
 
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AdminShell>{children}</AdminShell>
    </SidebarProvider>
  );
}