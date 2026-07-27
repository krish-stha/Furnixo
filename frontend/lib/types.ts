export type ProductColor = "white" | "black" | "grey" | "brown" | "blue" | "green";
export type ProductMaterial = "wood" | "metal" | "marble" | "leather" | "leatherette" | "fabric";

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  images: string[];
  category: Category | string;
  color?: ProductColor | null;
  material?: ProductMaterial | null;
  isNewArrival?: boolean;
  status: "active" | "draft";
}

export interface ListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FacetCount {
  value: string;
  count: number;
}
export interface CategoryFacet {
  name: string;
  slug: string;
  count: number;
}
export interface ProductFacets {
  colors: FacetCount[];
  materials: FacetCount[];
  categories: CategoryFacet[];
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  meta: ListMeta;
  facets: ProductFacets;
}

/** Hex swatches for the 6 product colors (filter dots + card dots) */
export const COLOR_HEX: Record<ProductColor, string> = {
  white: "#FFFFFF",
  black: "#111111",
  grey: "#9CA3AF",
  brown: "#8B5E3C",
  blue: "#3B82F6",
  green: "#22C55E",
};