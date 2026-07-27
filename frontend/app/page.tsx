"use client";
 
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, RotateCcw, Headphones, ArrowRight } from "lucide-react";
 
import { Header } from "./user/component/header";
import { Footer } from "./user/component/footer";
import ProductCard from "@/components/product/ProductCard";
import { SkeletonGrid } from "@/components/product/SkeletonCard";
import { listPublicProducts } from "@/lib/api/public/products";
import { listPublicCategories } from "@/lib/api/public/category";
import type { Product, Category } from "@/lib/types";
 
const HOME_TABS = ["All", "Chairs", "Tables", "Armchairs", "Sofas", "Decor"];
 
export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState("All");
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    listPublicCategories()
      .then((res) => setCategories(res?.data ?? []))
      .catch(() => {});
  }, []);
 
  useEffect(() => {
    setLoading(true);
    listPublicProducts({
      limit: 8,
      sort: "latest",
      categorySlug: tab === "All" ? undefined : tab.toLowerCase(),
    })
      .then((res) => setProducts(res?.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [tab]);
 
  return (
    <div className="min-h-screen bg-white">
      <Header />
 
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-neutral-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url(/images/hero-furniture.jpg)" }}
        />
        <div className="container relative mx-auto px-4 py-24 md:py-36">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
              Where Traditional
              <br />
              Meets Modern
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-300">
              Furniture crafted for contemporary living — timeless silhouettes,
              honest materials, built to last.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/shop"
                className="bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-200"
              >
                Shop now
              </Link>
              <Link
                href="/about"
                className="border border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-neutral-900"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>
 
      {/* ===== Shop by Categories (4 max) ===== */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Shop by Categories</h2>
          <Link
            href="/shop"
            className="border border-neutral-300 px-4 py-2 text-sm text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.slice(0, 4).map((c) => (
            <Link key={c._id} href={`/shop?category=${c.slug}`} className="group block">
              <div className="aspect-square overflow-hidden bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/categories/${c.slug}.jpg`}
                  alt={c.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              </div>
              <div className="mt-2 text-sm font-medium text-neutral-900">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>
 
      {/* ===== Products with tabs ===== */}
      <section className="bg-neutral-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-neutral-900">Products</h2>
 
          <div className="mt-6 flex flex-wrap justify-center gap-6">
            {HOME_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 pb-1 text-sm transition-colors ${
                  tab === t
                    ? "border-neutral-900 font-semibold text-neutral-900"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
 
          <div className="mt-10">
            {loading ? (
              <SkeletonGrid count={8} />
            ) : products.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-500">
                No products in this category yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </div>
 
          <div className="mt-10 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              View all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
 
      {/* ===== Trust strip ===== */}
      <section className="border-t border-neutral-200">
        <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-12 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Secure Payments", text: "Khalti, eSewa & cash on delivery." },
            { icon: RotateCcw, title: "Return Within 14 Days", text: "Changed your mind? No problem." },
            { icon: Headphones, title: "24/7 Support", text: "We're here whenever you need us." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4">
              <Icon className="h-8 w-8 shrink-0 text-neutral-900" strokeWidth={1.5} />
              <div>
                <div className="text-sm font-semibold text-neutral-900">{title}</div>
                <div className="mt-1 text-sm text-neutral-500">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
 
      <Footer />
    </div>
  );
}
 