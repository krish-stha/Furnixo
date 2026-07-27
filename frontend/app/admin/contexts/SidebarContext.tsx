"use client";
 
import { createContext, useContext, useEffect, useState } from "react";
 
type SidebarCtx = {
  collapsed: boolean;
  toggle: () => void;
};
 
const SidebarContext = createContext<SidebarCtx>({
  collapsed: false,
  toggle: () => {},
});
 
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
 
  // hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("furnixo_admin_sidebar");
    if (saved === "collapsed") setCollapsed(true);
  }, []);
 
  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("furnixo_admin_sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  };
 
  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}
 
export const useSidebar = () => useContext(SidebarContext);