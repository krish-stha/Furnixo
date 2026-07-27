import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { Product } from "@/lib/types";

export interface WishlistResponse {
  success: boolean;
  data: { user: string; items: { product: Product; addedAt: string }[] };
}

export async function getMyWishlistApi(): Promise<WishlistResponse> {
  const res = await api.get(endpoints.wishlist.base);
  return res.data;
}

export async function getWishlistIdsApi(): Promise<string[]> {
  const res = await api.get(endpoints.wishlist.ids);
  return res.data?.data ?? [];
}

export async function toggleWishlistApi(productId: string): Promise<{ inWishlist: boolean; count: number }> {
  const res = await api.post(endpoints.wishlist.toggle, { productId });
  return res.data?.data;
}

export async function removeWishlistItemApi(productId: string) {
  const res = await api.delete(endpoints.wishlist.removeItem(productId));
  return res.data;
}

export async function clearWishlistApi() {
  const res = await api.delete(endpoints.wishlist.clear);
  return res.data;
}