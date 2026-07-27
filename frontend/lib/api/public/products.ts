import { api } from "../axios";
import { endpoints } from "../endpoints";
import type { ProductListResponse, Product } from "@/lib/types";

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  color?: string[];     // ["black","brown"]
  material?: string[];  // ["wood"]
  minPrice?: number;
  maxPrice?: number;
  sale?: boolean;
  sort?: "latest" | "newest" | "price_asc" | "price_desc";
}

export async function listPublicProducts(params?: ProductListParams): Promise<ProductListResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.search) qs.set("search", params.search);
  if (params?.categorySlug) qs.set("categorySlug", params.categorySlug);
  if (params?.color?.length) qs.set("color", params.color.join(","));
  if (params?.material?.length) qs.set("material", params.material.join(","));
  if (params?.minPrice != null) qs.set("minPrice", String(params.minPrice));
  if (params?.maxPrice != null) qs.set("maxPrice", String(params.maxPrice));
  if (params?.sale) qs.set("sale", "true");
  if (params?.sort) qs.set("sort", params.sort);

  const url = qs.toString()
    ? `${endpoints.public.products}?${qs.toString()}`
    : endpoints.public.products;
  const res = await api.get<ProductListResponse>(url);
  return res.data;
}

export async function getPublicProductBySlug(slug: string): Promise<{ success: boolean; data: Product }> {
  const res = await api.get(endpoints.public.productBySlug(slug));
  return res.data;
}