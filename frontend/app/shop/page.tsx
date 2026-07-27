"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Header } from "../user/component/header";
import { Footer } from "../user/component/footer";
import ProductCard from "@/components/product/ProductCard";
import { SkeletonGrid } from "@/components/product/SkeletonCard";
import FilterPanel, {
  type ShopFilters,
} from "@/components/filters/FilterPanel";
import { listPublicProducts } from "@/lib/api/public/products";
import type { Product, ProductFacets, ListMeta } from "@/lib/types";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type SortOption = "latest" | "price_asc" | "price_desc";

function ShopContent() {
  const router = useRouter();
  const sp = useSearchParams();

  // URL values
  const filters: ShopFilters = useMemo(
    () => ({
      category: sp.get("category") ?? undefined,
      colors: sp.get("color")?.split(",").filter(Boolean) ?? [],
      materials: sp.get("material")?.split(",").filter(Boolean) ?? [],
      minPrice: sp.get("minPrice")
        ? Number(sp.get("minPrice"))
        : undefined,
      maxPrice: sp.get("maxPrice")
        ? Number(sp.get("maxPrice"))
        : undefined,
      sale: sp.get("sale") === "true",
    }),
    [sp],
  );

  const sort =
    (sp.get("sort") as SortOption | null) ?? "latest";

  const page = Math.max(1, Number(sp.get("page") ?? 1));

  const search = sp.get("search")?.trim() ?? "";

  // Search input is kept separately for smooth typing.
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Update shop URL while preserving filters, sorting and search.
  const setUrl = useCallback(
    (
      nextFilters: ShopFilters,
      nextSort: SortOption = sort,
      nextPage = 1,
      nextSearch: string = search,
    ) => {
      const qs = new URLSearchParams();
      const normalizedSearch = nextSearch.trim();

      if (normalizedSearch) {
        qs.set("search", normalizedSearch);
      }

      if (nextFilters.category) {
        qs.set("category", nextFilters.category);
      }

      if (nextFilters.colors.length) {
        qs.set("color", nextFilters.colors.join(","));
      }

      if (nextFilters.materials.length) {
        qs.set("material", nextFilters.materials.join(","));
      }

      if (nextFilters.minPrice != null) {
        qs.set("minPrice", String(nextFilters.minPrice));
      }

      if (nextFilters.maxPrice != null) {
        qs.set("maxPrice", String(nextFilters.maxPrice));
      }

      if (nextFilters.sale) {
        qs.set("sale", "true");
      }

      if (nextSort !== "latest") {
        qs.set("sort", nextSort);
      }

      if (nextPage > 1) {
        qs.set("page", String(nextPage));
      }

      router.replace(
        qs.toString() ? `/shop?${qs.toString()}` : "/shop",
        { scroll: false },
      );
    },
    [router, search, sort],
  );

  // Debounce the search so the API is not called on every keystroke.
  useEffect(() => {
    const normalizedInput = searchInput.trim();

    if (normalizedInput === search) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setUrl(filters, sort, 1, normalizedInput);
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput, search, filters, sort, setUrl]);

  // Product data
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
      search,
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
      .catch(() => {
        if (cancelled) return;

        setProducts([]);
        setMeta(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    page,
    sort,
    search,
    filters.category,
    filters.colors,
    filters.materials,
    filters.minPrice,
    filters.maxPrice,
    filters.sale,
  ]);

  // Active filter chips
  const chips: {
    label: string;
    onRemove: () => void;
  }[] = [];

  if (search) {
    chips.push({
      label: `Search: ${search}`,
      onRemove: () => {
        setSearchInput("");
        setUrl(filters, sort, 1, "");
      },
    });
  }

  if (filters.category) {
    chips.push({
      label: filters.category,
      onRemove: () =>
        setUrl({
          ...filters,
          category: undefined,
        }),
    });
  }

  filters.colors.forEach((color) => {
    chips.push({
      label: color,
      onRemove: () =>
        setUrl({
          ...filters,
          colors: filters.colors.filter(
            (item) => item !== color,
          ),
        }),
    });
  });

  filters.materials.forEach((material) => {
    chips.push({
      label: material,
      onRemove: () =>
        setUrl({
          ...filters,
          materials: filters.materials.filter(
            (item) => item !== material,
          ),
        }),
    });
  });

  if (
    filters.minPrice != null ||
    filters.maxPrice != null
  ) {
    chips.push({
      label: `Rs. ${filters.minPrice ?? 0} – ${
        filters.maxPrice ?? "∞"
      }`,
      onRemove: () =>
        setUrl({
          ...filters,
          minPrice: undefined,
          maxPrice: undefined,
        }),
    });
  }

  if (filters.sale) {
    chips.push({
      label: "Sale",
      onRemove: () =>
        setUrl({
          ...filters,
          sale: false,
        }),
    });
  }

  const clearEverything = () => {
    setSearchInput("");

    setUrl(
      {
        category: undefined,
        colors: [],
        materials: [],
        minPrice: undefined,
        maxPrice: undefined,
        sale: false,
      },
      "latest",
      1,
      "",
    );
  };

  const from =
    meta && meta.total > 0
      ? (meta.page - 1) * meta.limit + 1
      : 0;

  const to = meta
    ? Math.min(meta.page * meta.limit, meta.total)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop filters */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <FilterPanel
              facets={facets}
              filters={filters}
              onChange={(nextFilters) =>
                setUrl(nextFilters)
              }
            />
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1">
            {/* Top controls */}
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center">
              {/* Result count and mobile filters */}
              <div className="flex shrink-0 items-center gap-3">
                <Sheet>
                  <SheetTrigger className="flex items-center gap-2 border border-neutral-300 px-3 py-2.5 text-sm transition-colors hover:border-neutral-900 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </SheetTrigger>

                  <SheetContent
                    side="left"
                    className="w-[300px] overflow-y-auto"
                  >
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>

                    <div className="mt-4 px-1">
                      <FilterPanel
                        facets={facets}
                        filters={filters}
                        onChange={(nextFilters) =>
                          setUrl(nextFilters)
                        }
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <p className="whitespace-nowrap text-sm text-neutral-500">
                  {loading
                    ? "Loading products…"
                    : meta
                      ? `Showing ${from}–${to} of ${meta.total} results`
                      : "No results"}
                </p>
              </div>

              {/* Search bar */}
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  strokeWidth={1.8}
                />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="h-11 w-full border border-neutral-300 bg-white pl-10 pr-10 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900"
                />

                {searchInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setUrl(filters, sort, 1, "");
                    }}
                    aria-label="Clear product search"
                    className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sorting */}
              <select
                value={sort}
                onChange={(event) =>
                  setUrl(
                    filters,
                    event.target.value as SortOption,
                    1,
                  )
                }
                className="h-11 shrink-0 border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 xl:w-[180px]"
                aria-label="Sort products"
              >
                <option value="latest">
                  Sort by latest
                </option>

                <option value="price_asc">
                  Price: low to high
                </option>

                <option value="price_desc">
                  Price: high to low
                </option>
              </select>
            </div>

            {/* Active filter chips */}
            {chips.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {chips.map((chip, index) => (
                  <button
                    key={`${chip.label}-${index}`}
                    type="button"
                    onClick={chip.onRemove}
                    className="flex items-center gap-1.5 border border-neutral-300 px-2.5 py-1.5 text-xs capitalize text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
                  >
                    <span>{chip.label}</span>
                    <X className="h-3 w-3" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={clearEverything}
                  className="px-1 text-xs text-neutral-500 underline underline-offset-2 transition-colors hover:text-neutral-900"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Products */}
            {loading ? (
              <SkeletonGrid count={12} />
            ) : products.length === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center border border-dashed border-neutral-300 px-5 text-center">
                <Search
                  className="mb-4 h-8 w-8 text-neutral-300"
                  strokeWidth={1.5}
                />

                <h2 className="text-base font-semibold text-neutral-900">
                  No products found
                </h2>

                <p className="mt-1 max-w-sm text-sm text-neutral-500">
                  {search
                    ? `We could not find any products matching “${search}”.`
                    : "No products match the selected filters."}
                </p>

                <button
                  type="button"
                  onClick={clearEverything}
                  className="mt-4 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
                >
                  Clear search and filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={meta.page <= 1}
                  onClick={() =>
                    setUrl(
                      filters,
                      sort,
                      meta.page - 1,
                    )
                  }
                  className="h-9 border border-neutral-300 px-3 text-sm text-neutral-700 transition-colors hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from({
                  length: meta.totalPages,
                }).map((_, index) => {
                  const pageNumber = index + 1;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() =>
                        setUrl(
                          filters,
                          sort,
                          pageNumber,
                        )
                      }
                      aria-label={`Go to page ${pageNumber}`}
                      aria-current={
                        pageNumber === meta.page
                          ? "page"
                          : undefined
                      }
                      className={`h-9 w-9 text-sm transition-colors ${
                        pageNumber === meta.page
                          ? "bg-neutral-900 font-semibold text-white"
                          : "border border-neutral-300 text-neutral-700 hover:border-neutral-900"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={
                    meta.page >= meta.totalPages
                  }
                  onClick={() =>
                    setUrl(
                      filters,
                      sort,
                      meta.page + 1,
                    )
                  }
                  className="h-9 border border-neutral-300 px-3 text-sm text-neutral-700 transition-colors hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <Header />

          <div className="container mx-auto px-4 py-8">
            <SkeletonGrid count={12} />
          </div>

          <Footer />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}