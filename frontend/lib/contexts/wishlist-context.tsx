"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { getWishlistIdsApi, toggleWishlistApi } from "@/lib/api/public/wishlist";
import { useToast } from "@/hooks/use-toast";

interface WishlistContextType {
  /** product ids currently in the wishlist */
  ids: Set<string>;
  count: number;
  loading: boolean;
  has: (productId: string) => boolean;
  /** returns "auth-required" if the user is not logged in (caller handles redirect/modal) */
  toggle: (productId: string) => Promise<"ok" | "auth-required">;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const list = await getWishlistIdsApi();
      setIds(new Set(list));
    } catch {
      // silent — hearts just render empty
    } finally {
      setLoading(false);
    }
  }, [user]);

  // hydrate hearts when auth state changes (login/logout)
  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId: string): Promise<"ok" | "auth-required"> => {
      if (!user) return "auth-required";

      // 1) optimistic flip — instant UI
      const wasIn = ids.has(productId);
      setIds((prev) => {
        const next = new Set(prev);
        wasIn ? next.delete(productId) : next.add(productId);
        return next;
      });

      // 2) sync with backend; revert on failure
      try {
        const result = await toggleWishlistApi(productId);
        // reconcile with server truth
        setIds((prev) => {
          const next = new Set(prev);
          result.inWishlist ? next.add(productId) : next.delete(productId);
          return next;
        });
      } catch {
        setIds((prev) => {
          const next = new Set(prev);
          wasIn ? next.add(productId) : next.delete(productId);
          return next;
        });
        toast({ title: "Couldn't update wishlist", variant: "destructive" });
      }
      return "ok";
    },
    [user, ids, toast]
  );

  const value = useMemo(
    () => ({ ids, count: ids.size, loading, has: (id: string) => ids.has(id), toggle, refresh }),
    [ids, loading, toggle, refresh]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}