import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/async.middleware";
import { WishlistController } from "../controllers/wishlist.controller";

const router = Router();
const ctrl = new WishlistController();

// /api/wishlist
router.get("/", protect, asyncHandler(ctrl.getMyWishlist.bind(ctrl)));
router.get("/ids", protect, asyncHandler(ctrl.getIds.bind(ctrl)));
router.post("/toggle", protect, asyncHandler(ctrl.toggle.bind(ctrl)));
router.delete("/items/:productId", protect, asyncHandler(ctrl.remove.bind(ctrl)));
router.delete("/", protect, asyncHandler(ctrl.clear.bind(ctrl)));

export default router;