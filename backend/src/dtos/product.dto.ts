import z from "zod";
import { PRODUCT_COLORS, PRODUCT_MATERIALS } from "../models/product.model";
 
const formBool = z.preprocess(
  (v) => v === true || v === "true" || v === "1",
  z.boolean()
);
 
// "" (empty select) -> undefined so optional enums pass
const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);
 
export const AdminCreateProductDTO = z.object({
  name: z.string().min(2),
  sku: z.string().min(3),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().min(1),
  color: z.preprocess(emptyToUndef, z.enum(PRODUCT_COLORS).optional().nullable()),
  material: z.preprocess(emptyToUndef, z.enum(PRODUCT_MATERIALS).optional().nullable()),
  isNewArrival: formBool.optional(),
  status: z.enum(["active", "draft"]).optional(),
});
 
export const AdminUpdateProductDTO = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().min(3).optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  color: z.preprocess(emptyToUndef, z.enum(PRODUCT_COLORS).optional().nullable()),
  material: z.preprocess(emptyToUndef, z.enum(PRODUCT_MATERIALS).optional().nullable()),
  isNewArrival: formBool.optional(),
  status: z.enum(["active", "draft"]).optional(),
});