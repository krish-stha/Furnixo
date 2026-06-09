"use client";
 
import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Heart, Minus, Plus, ShoppingCart, Truck, RotateCcw } from "lucide-react";
 
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { formatPrice } from "@/components/product/ProductCard";
import { getPublicProductBySlug } from "@/lib/api/public/products";
import { productImageUrl } from "@/lib/img";
import { COLOR_HEX, type Product } from "@/lib/types";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { useCart } from "@/lib/contexts/cart-context";
import { useWishlist } from "@/lib/contexts/wishlist-context";
import { setPendingIntent } from "@/lib/pending-intent";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
 
export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const cart = useCart();
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
 
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
 
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getPublicProductBySlug(String(slug))
      .then((res) => setProduct(res?.data ?? null))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);
 
  const onSale = product?.discountPrice != null && product.discountPrice < product.price;
  const displayPrice = product ? (onSale ? product.discountPrice! : product.price) : 0;
  const inWishlist = product ? has(product._id) : false;
 
  const goLogin = () => router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
 
  const onAddToCart = async () => {
    if (!product) return;
    if (!user) {
      setPendingIntent({ type: "ADD_TO_CART", productId: product._id, qty });
      goLogin();
      return;
    }
    setAdding(true);
    try {
      await cart.add(product._id, qty);
      toast({ title: "Added to cart", description: `${product.name} × ${qty}` });
    } catch {
      toast({ title: "Couldn't add to cart", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };
 
  const onBuyNow = async () => {
    if (!product) return;
    if (!user) {
      setPendingIntent({ type: "BUY_NOW", productId: product._id, qty });
      goLogin();
      return;
    }
    setBuying(true);
    try {
      await cart.add(product._id, qty);
      router.push("/user/dashboard/checkout");
      // stays "Redirecting…" on purpose — we're leaving the page
    } catch {
      toast({ title: "Couldn't start checkout", variant: "destructive" });
      setBuying(false);
    }
  };
 
  const onWishlist = async () => {
    if (!product) return;
    const result = await toggle(product._id);
    if (result === "auth-required") {
      setPendingIntent({ type: "WISHLIST", productId: product._id });
      goLogin();
    }
  };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto grid animate-pulse gap-10 px-4 py-10 md:grid-cols-2">
          <div className="aspect-square bg-neutral-200" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-neutral-200" />
            <div className="h-6 w-1/4 bg-neutral-200" />
            <div className="h-24 w-full bg-neutral-200" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }
 
  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-32 text-center">
          <p className="text-neutral-500">Product not found.</p>
        </div>
        <Footer />
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-white">
      <Header />
 
      <div className="container mx-auto grid gap-10 px-4 py-10 md:grid-cols-2">
        {/* gallery */}
        <div>
          <div className="aspect-square overflow-hidden bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImageUrl(product.images?.[imgIdx])}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "h-16 w-16 overflow-hidden border",
                    i === imgIdx ? "border-neutral-900" : "border-neutral-200"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productImageUrl(img)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
 
        {/* info */}
        <div>
          {onSale && (
            <span className="bg-red-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
              Sale
            </span>
          )}
          {!onSale && product.isNewArrival && (
            <span className="bg-neutral-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
              New
            </span>
          )}
 
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">{product.name}</h1>
 
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-semibold text-neutral-900">
              {formatPrice(displayPrice)}
            </span>
            {onSale && (
              <span className="text-base text-neutral-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
 
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">
            {product.description}
          </p>
 
          {/* specs */}
          <dl className="mt-6 space-y-2 border-t border-neutral-200 pt-4 text-sm">
            {product.color && (
              <div className="flex items-center gap-2">
                <dt className="w-24 text-neutral-500">Color</dt>
                <dd className="flex items-center gap-2 capitalize text-neutral-900">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border border-neutral-300"
                    style={{ backgroundColor: COLOR_HEX[product.color] }}
                  />
                  {product.color}
                </dd>
              </div>
            )}
            {product.material && (
              <div className="flex gap-2">
                <dt className="w-24 text-neutral-500">Material</dt>
                <dd className="capitalize text-neutral-900">{product.material}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="w-24 text-neutral-500">SKU</dt>
              <dd className="text-neutral-900">{product.sku}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 text-neutral-500">Availability</dt>
              <dd className={product.stock > 0 ? "text-neutral-900" : "text-red-600"}>
                {product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}
              </dd>
            </div>
          </dl>
 
          {/* qty + actions */}
          <div className="mt-8 max-w-md space-y-3">
            {/* Row 1 — quantity + primary action */}
            <div className="flex items-stretch gap-3">
              <div className="flex shrink-0 items-center border border-neutral-300">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-12 w-11 items-center justify-center hover:bg-neutral-100"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  className="flex h-12 w-11 items-center justify-center hover:bg-neutral-100"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
 
              <button
                onClick={onAddToCart}
                disabled={adding || product.stock <= 0}
                className="flex h-12 flex-1 items-center justify-center gap-2 bg-neutral-900 px-6 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                <ShoppingCart className="h-4 w-4" />
                {adding ? "Adding…" : "Add to Cart"}
              </button>
            </div>
 
            {/* Row 2 — secondary purchase path */}
            <button
              onClick={onBuyNow}
              disabled={buying || product.stock <= 0}
              className="flex h-12 w-full items-center justify-center border border-neutral-900 text-sm font-semibold uppercase tracking-wide text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-300"
            >
              {buying ? "Redirecting…" : "Buy Now"}
            </button>
 
            {/* Row 3 — quiet tertiary action */}
            <button
              onClick={onWishlist}
              aria-pressed={inWishlist}
              className="group flex items-center gap-2 pt-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  inWishlist
                    ? "fill-neutral-900 text-neutral-900"
                    : "text-neutral-400 group-hover:text-neutral-900"
                )}
              />
              {inWishlist ? "Saved to Wishlist" : "Add to Wishlist"}
            </button>
 
            {/* Trust microcopy */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-neutral-200 pt-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Free delivery in Kathmandu
              </span>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> 14-day returns
              </span>
            </div>
          </div>
        </div>
      </div>
 
      <Footer />
    </div>
  );
}