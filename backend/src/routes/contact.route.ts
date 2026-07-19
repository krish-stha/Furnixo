import { Router } from "express";
import { ContactController } from "../controllers/contact.controller";
import { adminOnly } from "../middleware/admin.middleware";
import { protect } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/async.middleware";
 
const ctrl = new ContactController();
 
// ── Public router ─────────────────────────────────────────────────────────
// Mount at: app.use("/api/contact", contactPublicRouter)
export const contactPublicRouter = Router();
contactPublicRouter.post("/", asyncHandler(ctrl.submit.bind(ctrl)));
 
// ── Admin router ──────────────────────────────────────────────────────────
// Mount at: app.use("/api/admin/contact-messages", contactAdminRouter)
export const contactAdminRouter = Router();
contactAdminRouter.use(protect, adminOnly);
 
contactAdminRouter.get("/",              asyncHandler(ctrl.list.bind(ctrl)));
contactAdminRouter.get("/unread-count",  asyncHandler(ctrl.unreadCount.bind(ctrl)));
contactAdminRouter.get("/:id",           asyncHandler(ctrl.getById.bind(ctrl)));
contactAdminRouter.put("/:id/status",    asyncHandler(ctrl.updateStatus.bind(ctrl)));
contactAdminRouter.delete("/:id",        asyncHandler(ctrl.remove.bind(ctrl)));
 
// Default export = public router (so `import contactRoutes from "..."` works)
export default contactPublicRouter;
