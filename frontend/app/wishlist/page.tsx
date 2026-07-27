"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
 
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { formatPrice } from "@/components/product/ProductCard";
import { SkeletonGrid } from "@/components/product/SkeletonCard";
import { getMyWishlistApi, removeWishlistItemApi } from "@/lib/api/public/wishlist";
import { productImageUrl } from "@/lib/img";
import type { Product } from "@/lib/types";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { useCart } from "@/lib/contexts/cart-context";
import { useWishlist } from "@/lib/contexts/wishlist-context";
import { useToast } from "@/hooks/use-toast";
 
export default function WishlistPage() {
  const { user, isLoading } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const { toast } = useToast();
 
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
 
  const load = () => {
    setLoading(true);
    getMyWishlistApi()
      .then((res) => {
        const products = (res?.data?.items ?? [])
          .map((i) => i.product)
          .filter(Boolean) as Product[];
        setItems(products);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
 
  useEffect(() => {
    if (!isLoading && user) load();
    if (!isLoading && !user) setLoading(false);
  }, [user, isLoading]);
 
  const onRemove = async (p: Product) => {
    setItems((prev) => prev.filter((x) => x._id !== p._id)); // optimistic
    try {
      await removeWishlistItemApi(p._id);
      await wishlist.refresh();
      toast({ title: "Removed from wishlist", description: p.name });
    } catch {
      load(); // revert by reloading
      toast({ title: "Couldn't remove item", variant: "destructive" });
    }
  };
 
  const onMoveToCart = async (p: Product) => {
    try {
      await cart.add(p._id, 1);
      await removeWishlistItemApi(p._id);
      await wishlist.refresh();
      setItems((prev) => prev.filter((x) => x._id !== p._id));
      toast({ title: "Moved to cart", description: p.name });
    } catch {
      toast({ title: "Couldn't move to cart", variant: "destructive" });
    }
  };
 
  return (
    <div className="min-h-screen bg-white">
      <Header />
 
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-neutral-900">My Wishlist</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {items.length} {items.length === 1 ? "item" : "items"} saved
        </p>
 
        <div className="mt-8">
          {loading ? (
            <SkeletonGrid count={4} />
          ) : !user ? (
            <div className="py-24 text-center">
              <Heart className="mx-auto h-10 w-10 text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">Sign in to see your wishlist.</p>
              <Link
                href={`/auth/login?next=${encodeURIComponent("/wishlist")}`}
                className="mt-4 inline-block bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
              >
                Sign in
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="py-24 text-center">
              <Heart className="mx-auto h-10 w-10 text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">
                Your wishlist is empty. Tap the ♡ on any product to save it here.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-block bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => {
                const onSale = p.discountPrice != null && p.discountPrice < p.price;
                return (
                  <div
                    key={p._id}
                    className="group rounded-md border border-neutral-200 bg-white"
                  >
                    <Link href={`/shop/${p.slug}`} className="block">
                      <div className="aspect-square overflow-hidden rounded-t-md bg-neutral-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={productImageUrl(p.images?.[0])}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </Link>
                    <div className="space-y-2 p-3">
                      <h3 className="truncate text-sm font-medium text-neutral-900">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900">
                          {formatPrice(onSale ? p.discountPrice! : p.price)}
                        </span>
                        {onSale && (
                          <span className="text-xs text-neutral-400 line-through">
                            {formatPrice(p.price)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => onMoveToCart(p)}
                          disabled={p.stock <= 0}
                          className="flex h-9 flex-1 items-center justify-center gap-1.5 bg-neutral-900 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-300"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {p.stock > 0 ? "Move to cart" : "Out of stock"}
                        </button>
                        <button
                          onClick={() => onRemove(p)}
                          aria-label={`Remove ${p.name} from wishlist`}
                          className="flex h-9 w-9 items-center justify-center border border-neutral-300 text-neutral-600 transition-colors hover:border-red-600 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
 
      <Footer />
    </div>
  );
}
 