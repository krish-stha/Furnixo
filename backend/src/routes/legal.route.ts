import { Router } from "express";
import { LegalController } from "../controllers/legal.controller";
import { adminOnly } from "../middleware/admin.middleware";
import { protect } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/async.middleware";
 
const ctrl = new LegalController();
 
// ── Public ─────────────────────────────────────────────────────────────────
export const legalPublicRouter = Router();
legalPublicRouter.get("/:slug", asyncHandler(ctrl.getPublic.bind(ctrl)));
 
// ── Admin ──────────────────────────────────────────────────────────────────
export const legalAdminRouter = Router();
legalAdminRouter.use(protect, adminOnly);
 
legalAdminRouter.get("/",        asyncHandler(ctrl.list.bind(ctrl)));
legalAdminRouter.get("/:slug",   asyncHandler(ctrl.getOne.bind(ctrl)));
legalAdminRouter.put("/:slug",   asyncHandler(ctrl.upsert.bind(ctrl)));
 
export default legalPublicRouter;
 