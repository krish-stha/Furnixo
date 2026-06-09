import mongoose, { Schema, Document } from "mongoose";

export const PRODUCT_COLORS = ["white", "black", "grey", "brown", "blue", "green"] as const;
export const PRODUCT_MATERIALS = ["wood", "metal", "marble", "leather", "leatherette", "fabric"] as const;

export type ProductColor = (typeof PRODUCT_COLORS)[number];
export type ProductMaterial = (typeof PRODUCT_MATERIALS)[number];

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  images: string[];
  category: mongoose.Types.ObjectId;
  color?: ProductColor | null;       // NEW (furniture)
  material?: ProductMaterial | null; // NEW (furniture)
  isNewArrival?: boolean;                   // NEW badge on card
  status: "active" | "draft";
  deleted_at?: Date | null;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },

    sku: { type: String, required: true, unique: true, index: true, trim: true },

    description: { type: String, default: "" },

    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },

    stock: { type: Number, required: true, min: 0, default: 0 },

    images: { type: [String], default: [] },

    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },

    // ---- Furniture attributes (optional => old documents stay valid) ----
    color: { type: String, enum: PRODUCT_COLORS, default: null, index: true },
    material: { type: String, enum: PRODUCT_MATERIALS, default: null, index: true },
    isNewArrival: { type: Boolean, default: false },

    status: { type: String, enum: ["active", "draft"], default: "active" },

    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true, // "isNew" is a mongoose reserved word; this silences the warning
  }
);

// Compound index for the faceted shop listing
ProductSchema.index({ status: 1, deleted_at: 1, category: 1, color: 1, material: 1, price: 1 });

export const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);