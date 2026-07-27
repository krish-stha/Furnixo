const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

export function productImageUrl(filename?: string | null) {
  if (!filename) return "/images/placeholder-product.png";
  if (filename.startsWith("http")) return filename;
  return `${BACKEND_URL}/public/product_images/${filename}`;
}