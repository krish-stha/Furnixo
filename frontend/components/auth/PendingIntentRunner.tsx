"use client";
 
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { useCart } from "@/lib/contexts/cart-context";
import { useWishlist } from "@/lib/contexts/wishlist-context";
import { popPendingIntent } from "@/lib/pending-intent";
import { toggleWishlistApi } from "@/lib/api/public/wishlist";
import { useToast } from "@/hooks/use-toast";
 
export default function PendingIntentRunner() {
  const { user } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const { toast } = useToast();
  const router = useRouter();
  const ran = useRef(false);
 
  useEffect(() => {
    if (!user || ran.current) return;
 
    const intent = popPendingIntent();
    if (!intent) return;
    ran.current = true;
 
    (async () => {
      try {
        if (intent.type === "WISHLIST") {
          await toggleWishlistApi(intent.productId);
          await wishlist.refresh();
          toast({ title: "Added to wishlist ♡" });
        }
        if (intent.type === "ADD_TO_CART") {
          await cart.add(intent.productId, intent.qty);
          toast({ title: "Added to cart" });
        }
        if (intent.type === "BUY_NOW") {
          await cart.add(intent.productId, intent.qty);
          router.push("/user/dashboard/checkout");
        }
      } catch {
        toast({ title: "Couldn't complete your last action", variant: "destructive" });
      } finally {
        ran.current = false;
      }
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
 
  return null;
}
 