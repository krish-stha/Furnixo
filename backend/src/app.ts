import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route";
import adminUserRoutes from "./routes/admin.user.route";
import { errorHandler } from "./middleware/error.middleware";
import adminCategoryRoutes from "./routes/admin.category.route";
import adminProductRoutes from "./routes/admin.product.route";
import publicProductRoutes from "./routes/public.product.route";
import cartRoutes from "./routes/cart.route";
import publicCategoryRoutes from "./routes/public.category.route";
import paymentRoutes from "./routes/payment.route";
import adminPaymentRoutes from "./routes/admin.payment.route";
import adminInventoryRoutes from "./routes/admin.inventory.route";
import orderRoutes from "./routes/order.route";
import adminOrderRoutes from "./routes/admin.order.route";
import adminCartRoutes from "./routes/admin.cart.route";
import wishlistRoutes from "./routes/wishlist.route";
import adminDashboardRoutes from "./routes/admin.dashboard.route";
import adminSettingsRoutes from "./routes/admin.settings.route";
import settingsRoutes from "./routes/settings.route";
import adminAboutRoutes from "./routes/admin.about.route";
import aboutRoutes from "./routes/about.route";
import contactPublicRouter, { contactAdminRouter } from "./routes/contact.route";
import legalPublicRouter, { legalAdminRouter } from "./routes/legal.route";

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [FRONTEND_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Static
app.use("/public", express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/admin", adminUserRoutes);
app.use("/api/categories", publicCategoryRoutes);

app.use("/api/admin", adminCategoryRoutes);
app.use("/api/admin", adminProductRoutes);

app.use("/api", publicProductRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin/carts", adminCartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminOrderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminPaymentRoutes);
app.use("/api/admin", adminInventoryRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/admin", adminSettingsRoutes);
app.use("/api/settings", settingsRoutes); 
app.use("/api/admin", adminAboutRoutes);
app.use("/api", aboutRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.use("/api/contact", contactPublicRouter);
app.use("/api/admin/contact-messages", contactAdminRouter);

app.use("/api/legal",       legalPublicRouter);
app.use("/api/admin/legal", legalAdminRouter);

app.use(errorHandler);

export default app;