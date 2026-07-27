import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { WishlistModel } from "../models/wishlist.model";
import { ProductModel } from "../models/product.model";

function mustUserId(req: AuthRequest) {
  const userId = req.user?.id;
  if (!userId) throw new HttpError(401, "Not authorized");
  return userId;
}

export class WishlistController {
  // GET /api/wishlist  -> full wishlist with populated products
  async getMyWishlist(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);

    const wishlist = await WishlistModel.findOne({ user: userId })
      .populate({
        path: "items.product",
        select: "name slug sku price discountPrice stock images color material isNewArrival category",
        populate: { path: "category", select: "name slug" },
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: wishlist ?? { user: userId, items: [] },
    });
  }

  // GET /api/wishlist/ids -> lightweight ["id1","id2"] for hydrating hearts on page load
  async getIds(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);
    const wishlist = await WishlistModel.findOne({ user: userId }).select("items.product").lean();
    const ids = (wishlist?.items ?? []).map((i: any) => String(i.product));
    return res.status(200).json({ success: true, data: ids });
  }

  // POST /api/wishlist/toggle  body: { productId }
  async toggle(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);
    const { productId } = req.body ?? {};

    if (!productId || !mongoose.isValidObjectId(productId)) {
      throw new HttpError(400, "Valid productId is required");
    }

    const product = await ProductModel.findOne({
      _id: productId,
      deleted_at: null,
      status: "active",
    }).lean();
    if (!product) throw new HttpError(404, "Product not found");

    const wishlist = await WishlistModel.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId } },
      { new: true, upsert: true }
    );

    const exists = wishlist.items.some((i: any) => String(i.product) === String(productId));

    const updated = exists
      ? await WishlistModel.findOneAndUpdate(
          { user: userId },
          { $pull: { items: { product: productId } } },
          { new: true }
        )
      : await WishlistModel.findOneAndUpdate(
          { user: userId },
          { $addToSet: { items: { product: productId, addedAt: new Date() } } },
          { new: true }
        );

    return res.status(200).json({
      success: true,
      data: { inWishlist: !exists, count: updated?.items.length ?? 0 },
    });
  }

  // DELETE /api/wishlist/items/:productId
  async remove(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) throw new HttpError(400, "Invalid productId");

    const updated = await WishlistModel.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { product: productId } } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: { count: updated?.items.length ?? 0 },
    });
  }

  // DELETE /api/wishlist
  async clear(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);
    await WishlistModel.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
    return res.status(200).json({ success: true, data: { count: 0 } });
  }
}