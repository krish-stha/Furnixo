"use client";
 
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { useCart } from "@/lib/contexts/cart-context";
import { useWishlist } from "@/lib/contexts/wishlist-context";
import { productImageUrl } from "@/lib/img";
import { COLOR_HEX, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { setPendingIntent } from "@/lib/pending-intent";
import { useToast } from "@/hooks/use-toast";
 
export function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}
 
export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const cart = useCart();
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
 
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
 
  const inWishlist = has(product._id);
  const onSale = product.discountPrice != null && product.discountPrice < product.price;
  const displayPrice = onSale ? product.discountPrice! : product.price;
  const inStock = product.stock > 0;
 
  const goLogin = () => router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
 
  const onHeart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await toggle(product._id);
    if (result === "auth-required") {
      setPendingIntent({ type: "WISHLIST", productId: product._id });
      goLogin();
    }
  };
 
  const onQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || added) return;
 
    if (!user) {
      setPendingIntent({ type: "ADD_TO_CART", productId: product._id, qty: 1 });
      goLogin();
      return;
    }
 
    setAdding(true);
    try {
      await cart.add(product._id, 1);
      setAdded(true);
      toast({ title: "Added to cart", description: product.name, duration: 1500 });
      setTimeout(() => setAdded(false), 1600); // brief ✓ confirmation, then reset
    } catch {
      toast({ title: "Couldn't add to cart", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };
 
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block rounded-lg border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* image area */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-neutral-100">
        <Image
          src={productImageUrl(product.images?.[0])}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
 
        {/* badge top-left */}
        {onSale ? (
          <span className="absolute left-2 top-2 rounded-sm bg-red-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            Sale
          </span>
        ) : product.isNewArrival ? (
          <span className="absolute left-2 top-2 rounded-sm bg-neutral-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            New
          </span>
        ) : null}
 
        {/* heart top-right — always visible */}
        <button
          type="button"
          onClick={onHeart}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={inWishlist}
          className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              inWishlist ? "fill-neutral-900 text-neutral-900" : "text-neutral-500"
            )}
          />
        </button>
 
        {/* quick Add to Cart — slides up on hover (desktop), always visible on touch */}
        {inStock && (
          <div
            className={cn(
              "absolute inset-x-3 bottom-3 transition-all duration-300 ease-out",
              // touch / small screens: always visible
              "translate-y-0 opacity-100",
              // desktop: hidden until card hover
              "lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
            )}
          >
            <button
              type="button"
              onClick={onQuickAdd}
              disabled={adding}
              aria-label={`Add ${product.name} to cart`}
              className={cn(
                "flex h-10 w-full items-center justify-center gap-2 rounded-md text-xs font-semibold uppercase tracking-wide shadow-md transition-colors duration-200",
                added
                  ? "bg-white text-neutral-900 ring-1 ring-neutral-900"
                  : "bg-neutral-900/95 text-white backdrop-blur-sm hover:bg-neutral-900"
              )}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  {adding ? "Adding…" : "Add to Cart"}
                </>
              )}
            </button>
          </div>
        )}
 
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="border border-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-900">
              Out of stock
            </span>
          </div>
        )}
      </div>
 
      {/* info */}
      <div className="space-y-1 p-3">
        <h3 className="truncate text-sm font-medium text-neutral-900">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900">{formatPrice(displayPrice)}</span>
          {onSale && (
            <span className="text-xs text-neutral-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        {product.color && (
          <span
            title={product.color}
            className="inline-block h-3 w-3 rounded-full border border-neutral-300"
            style={{ backgroundColor: COLOR_HEX[product.color] }}
          />
        )}
      </div>
    </Link>
  );
}