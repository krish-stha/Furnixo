import { HttpError } from "../errors/http-error";
import { ProductRepository } from "../repositories/product.repository";
import { CategoryModel } from "../models/category.model";
import { ProductModel } from "../models/product.model";
import { toSlug } from "../utils/slug";
import type { SortOrder } from "mongoose";
import mongoose from "mongoose";
import { InventoryService } from "../services/inventory.service"; // adjust path if different

const repo = new ProductRepository();
const inventory = new InventoryService();


function normalizeSku(sku: string) {
  return sku.trim().toUpperCase();
}

export class ProductService {
 async create(payload: any, imageFiles: Express.Multer.File[]) {
    const sku = normalizeSku(payload.sku);

    const skuExists = await repo.findBySku(sku);
    if (skuExists) throw new HttpError(409, "SKU already exists");

    const cat = await CategoryModel.findOne({
      _id: payload.categoryId,
      deleted_at: null,
    });
    if (!cat) throw new HttpError(400, "Invalid category");

    const slugBase = toSlug(payload.name);
    let slug = slugBase;
    let i = 1;
    while (await ProductModel.findOne({ slug })) {
      slug = `${slugBase}-${i++}`;
    }

    const images = (imageFiles || []).map((f) => f.filename);

    const initialStock = Math.max(0, Number(payload.stock ?? 0));

    // ✅ Create product with stock 0
    const created = await repo.create({
      name: payload.name,
      slug,
      sku,
      description: payload.description ?? "",
      price: payload.price,
      discountPrice: payload.discountPrice ? payload.discountPrice : null,
      stock: 0,
      images,
      category: payload.categoryId,
      color: payload.color ?? null,        // NEW
      material: payload.material ?? null,  // NEW
      isNewArrival: payload.isNewArrival ?? false,       // NEW
      status: payload.status ?? "active",
      deleted_at: null,
    });

    // ✅ If initial stock > 0 => do STOCK_IN (this also updates Product.stock)
    if (initialStock > 0) {
      await inventory.stockIn({
        productId: String(created._id),
        qty: initialStock,
        actorId: null, // or pass admin id later
        reason: "Initial stock on product creation",
      });
    }

    // ✅ Return fresh product (with updated stock)
    return ProductModel.findById(created._id).lean();
  }

 listAdmin(q?: { page?: number; limit?: number; search?: string }) {
  const page = Math.max(1, Number(q?.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(q?.limit ?? 10)));
  const skip = (page - 1) * limit;

  const search = String(q?.search ?? "").trim();
  const re = search ? new RegExp(search, "i") : null;

  const filter: any = { deleted_at: null };
  if (re) filter.$or = [{ name: re }, { sku: re }];

  const sortObj: Record<string, SortOrder> = { createdAt: -1 };

  return Promise.all([
    ProductModel.countDocuments(filter),
    ProductModel.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .lean(),
  ]).then(([total, data]) => {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  });
}

  getById(id: string) {
    return repo.findById(id);
  }

  async update(id: string, payload: any, imageFiles: Express.Multer.File[]) {
    const existing = await ProductModel.findOne({ _id: id, deleted_at: null });
    if (!existing) throw new HttpError(404, "Product not found");

    const data: any = { ...payload };
    if (data.discountPrice !== undefined && !data.discountPrice) data.discountPrice = null;
    if (data.color === "") data.color = null;
    if (data.material === "") data.material = null;

    if (payload.sku) {
      const sku = normalizeSku(payload.sku);
      const skuExists = await ProductModel.findOne({
        sku,
        _id: { $ne: id },
        deleted_at: null,
      });
      if (skuExists) throw new HttpError(409, "SKU already exists");
      data.sku = sku;
    }

    if (payload.name) {
      const slugBase = toSlug(payload.name);
      let slug = slugBase;
      let i = 1;
      while (true) {
        const found = await ProductModel.findOne({ slug });
        if (!found || String(found._id) === String(id)) break;
        slug = `${slugBase}-${i++}`;
      }
      data.slug = slug;
    }

    if (payload.categoryId) {
      const cat = await CategoryModel.findOne({
        _id: payload.categoryId,
        deleted_at: null,
      });
      if (!cat) throw new HttpError(400, "Invalid category");
      data.category = payload.categoryId;
      delete data.categoryId;
    }

    // Images: if new images uploaded, APPEND (gallery behavior)
    if (imageFiles && imageFiles.length > 0) {
      const newOnes = imageFiles.map((f) => f.filename);
      data.images = [...((existing as any).images || []), ...newOnes];
    }

    // stock cannot be negative
    if (data.stock !== undefined && Number(data.stock) < 0) {
      throw new HttpError(400, "Stock cannot be negative");
    }

    const updated = await repo.updateById(id, data);
    return updated;
  }

  async softDelete(id: string) {
    const updated = await repo.softDeleteById(id);
    if (!updated) throw new HttpError(404, "Product not found");
    return updated;
  }

  async hardDelete(id: string) {
    const deleted = await repo.hardDeleteById(id);
    if (!deleted) throw new HttpError(404, "Product not found");
    return deleted;
  }

  // PUBLIC
 async listPublic(q: any) {
    const page = Math.max(1, Number(q.page || 1));
    const limit = Math.min(48, Math.max(1, Number(q.limit || 12)));
    const skip = (page - 1) * limit;

    // ---- base filter ----
    const filter: any = { deleted_at: null, status: "active" };

    if (q.categorySlug) {
      const cat = await CategoryModel.findOne({
        slug: String(q.categorySlug),
        deleted_at: null,
      }).lean();
      if (!cat) {
        return {
          data: [],
          meta: { total: 0, page: 1, limit, totalPages: 1, hasNextPage: false, hasPrevPage: false },
          facets: { colors: [], materials: [], categories: [] },
        };
      }
      filter.category = cat._id;
    }

    if (q.search) {
      const re = new RegExp(String(q.search), "i");
      filter.$or = [{ name: re }, { sku: re }];
    }

    // price range (?minPrice=99&maxPrice=9999)
    const minPrice = Number(q.minPrice);
    const maxPrice = Number(q.maxPrice);
    if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
      filter.price = {};
      if (!Number.isNaN(minPrice)) filter.price.$gte = minPrice;
      if (!Number.isNaN(maxPrice)) filter.price.$lte = maxPrice;
    }

    // multi-select: ?color=black,brown  ?material=wood,metal
    const csv = (v: any) =>
      String(v ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const colors = csv(q.color);
    const materials = csv(q.material);
    if (colors.length) filter.color = { $in: colors };
    if (materials.length) filter.material = { $in: materials };

    // sale-only toggle (?sale=true)
    if (String(q.sale) === "true") filter.discountPrice = { $ne: null };

    // ---- sort ----
    const sortObj: Record<string, 1 | -1> =
      q.sort === "price_asc"  ? { price: 1 } :
      q.sort === "price_desc" ? { price: -1 } :
      { createdAt: -1 }; // "latest" default

    // ---- facets: counts ignore the facet's own selection (standard e-commerce UX) ----
    const facetBase = { ...filter };
    delete facetBase.color;
    delete facetBase.material;

    const [total, data, colorFacets, materialFacets, categoryFacets] = await Promise.all([
      ProductModel.countDocuments(filter),
      ProductModel.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug")
        .lean(),
      ProductModel.aggregate([
        { $match: { ...facetBase, ...(materials.length ? { material: { $in: materials } } : {}) } },
        { $group: { _id: "$color", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $project: { _id: 0, value: "$_id", count: 1 } },
        { $sort: { value: 1 } },
      ]),
      ProductModel.aggregate([
        { $match: { ...facetBase, ...(colors.length ? { color: { $in: colors } } : {}) } },
        { $group: { _id: "$material", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $project: { _id: 0, value: "$_id", count: 1 } },
        { $sort: { value: 1 } },
      ]),
      ProductModel.aggregate([
        { $match: { deleted_at: null, status: "active" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
        { $unwind: "$cat" },
        { $project: { _id: 0, name: "$cat.name", slug: "$cat.slug", count: 1 } },
        { $sort: { name: 1 } },
      ]),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
      facets: { colors: colorFacets, materials: materialFacets, categories: categoryFacets },
    };
  }

  getPublicBySlug(slug: string) {
    return repo.findBySlug(slug);
  }
}
