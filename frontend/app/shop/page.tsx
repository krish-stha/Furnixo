"use client";
 
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
 
import { Header } from "../user/component/header";
import { Footer } from "../user/component/footer";
import ProductCard from "@/components/product/ProductCard";
import { SkeletonGrid } from "@/components/product/SkeletonCard";
import FilterPanel, { type ShopFilters } from "@/components/filters/FilterPanel";
import { listPublicProducts } from "@/lib/api/public/products";
import type { Product, ProductFacets, ListMeta } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
 
function ShopContent() {
  const router = useRouter();
  const sp = useSearchParams();
 
  // ---- URL -> filters (single source of truth) ----
  const filters: ShopFilters = useMemo(
    () => ({
      category: sp.get("category") ?? undefined,
      colors: sp.get("color")?.split(",").filter(Boolean) ?? [],
      materials: sp.get("material")?.split(",").filter(Boolean) ?? [],
      minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
      maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
      sale: sp.get("sale") === "true",
    }),
    [sp]
  );
  const sort = (sp.get("sort") as "latest" | "price_asc" | "price_desc") ?? "latest";
  const page = Number(sp.get("page") ?? 1);
 
  const setUrl = useCallback(
    (next: ShopFilters, nextSort = sort, nextPage = 1) => {
      const qs = new URLSearchParams();
      if (next.category) qs.set("category", next.category);
      if (next.colors.length) qs.set("color", next.colors.join(","));
      if (next.materials.length) qs.set("material", next.materials.join(","));
      if (next.minPrice != null) qs.set("minPrice", String(next.minPrice));
      if (next.maxPrice != null) qs.set("maxPrice", String(next.maxPrice));
      if (next.sale) qs.set("sale", "true");
      if (nextSort !== "latest") qs.set("sort", nextSort);
      if (nextPage > 1) qs.set("page", String(nextPage));
      router.replace(qs.toString() ? `/shop?${qs}` : "/shop", { scroll: false });
    },
    [router, sort]
  );
 
  // ---- data ----
  const [products, setProducts] = useState<Product[]>([]);
  const [facets, setFacets] = useState<ProductFacets | null>(null);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listPublicProducts({
      page,
      limit: 12,
      sort,
      categorySlug: filters.category,
      color: filters.colors,
      material: filters.materials,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sale: filters.sale,
    })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data ?? []);
        setFacets(res.facets ?? null);
        setMeta(res.meta ?? null);
      })
      .catch(() => !cancelled && setProducts([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sp]); // eslint-disable-line react-hooks/exhaustive-deps
 
  // ---- active filter chips ----
  const chips: { label: string; onRemove: () => void }[] = [];
  if (filters.category)
    chips.push({
      label: filters.category,
      onRemove: () => setUrl({ ...filters, category: undefined }),
    });
  filters.colors.forEach((c) =>
    chips.push({
      label: c,
      onRemove: () => setUrl({ ...filters, colors: filters.colors.filter((x) => x !== c) }),
    })
  );
  filters.materials.forEach((m) =>
    chips.push({
      label: m,
      onRemove: () =>
        setUrl({ ...filters, materials: filters.materials.filter((x) => x !== m) }),
    })
  );
  if (filters.minPrice != null || filters.maxPrice != null)
    chips.push({
      label: `Rs. ${filters.minPrice ?? 0} – ${filters.maxPrice ?? "∞"}`,
      onRemove: () => setUrl({ ...filters, minPrice: undefined, maxPrice: undefined }),
    });
  if (filters.sale)
    chips.push({ label: "Sale", onRemove: () => setUrl({ ...filters, sale: false }) });
 
  const from = meta ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;
 
  return (
    <div className="min-h-screen bg-white">
      <Header />
 
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar — desktop */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <FilterPanel facets={facets} filters={filters} onChange={(f) => setUrl(f)} />
          </aside>
 
          {/* Main */}
          <main className="min-w-0 flex-1">
            {/* top bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* mobile filter sheet */}
                <Sheet>
                  <SheetTrigger className="flex items-center gap-2 border border-neutral-300 px-3 py-2 text-sm lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 px-1">
                      <FilterPanel
                        facets={facets}
                        filters={filters}
                        onChange={(f) => setUrl(f)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
 
                <p className="text-sm text-neutral-500">
                  {meta ? `Showing ${from}–${to} of ${meta.total} results` : "Loading…"}
                </p>
              </div>
 
              <select
                value={sort}
                onChange={(e) => setUrl(filters, e.target.value as typeof sort)}
                className="border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                aria-label="Sort products"
              >
                <option value="latest">Sort by latest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>
 
            {/* chips */}
            {chips.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {chips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={chip.onRemove}
                    className="flex items-center gap-1 border border-neutral-300 px-2 py-1 text-xs capitalize text-neutral-700 transition-colors hover:border-neutral-900"
                  >
                    {chip.label} <X className="h-3 w-3" />
                  </button>
                ))}
                <button
                  onClick={() =>
                    setUrl({ category: undefined, colors: [], materials: [], sale: false })
                  }
                  className="text-xs text-neutral-500 underline hover:text-neutral-900"
                >
                  Clear all
                </button>
              </div>
            )}
 
            {/* grid */}
            {loading ? (
              <SkeletonGrid count={12} />
            ) : products.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-sm text-neutral-500">No products match these filters.</p>
                <button
                  onClick={() =>
                    setUrl({ category: undefined, colors: [], materials: [], sale: false })
                  }
                  className="mt-3 text-sm font-semibold text-neutral-900 underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
 
            {/* pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {Array.from({ length: meta.totalPages }).map((_, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={n}
                      onClick={() => setUrl(filters, sort, n)}
                      className={`h-9 w-9 text-sm transition-colors ${
                        n === meta.page
                          ? "bg-neutral-900 font-semibold text-white"
                          : "border border-neutral-300 text-neutral-700 hover:border-neutral-900"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
 
      <Footer />
    </div>
  );
}
 
export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}