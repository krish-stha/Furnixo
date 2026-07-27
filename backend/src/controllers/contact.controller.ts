import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { ContactMessageModel } from "../models/contact_message.model";
 
function clean(s: any, max: number) {
  return String(s ?? "").trim().slice(0, max);
}
 
function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
 
export class ContactController {
  // ── PUBLIC: POST /api/contact ────────────────────────────────────────────
  // Anyone (logged-in or guest) can submit. Auth middleware should be optional.
  async submit(req: AuthRequest, res: Response) {
    const name    = clean(req.body?.name,    100);
    const email   = clean(req.body?.email,   200).toLowerCase();
    const subject = clean(req.body?.subject, 200);
    const message = clean(req.body?.message, 5000);
 
    if (!name)    throw new HttpError(400, "Name is required");
    if (!email)   throw new HttpError(400, "Email is required");
    if (!isEmail(email)) throw new HttpError(400, "Invalid email address");
    if (!subject) throw new HttpError(400, "Subject is required");
    if (!message || message.length < 10)
      throw new HttpError(400, "Message must be at least 10 characters");
 
    // Optional: capture user id if logged in
    const userId = req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)
      ? new mongoose.Types.ObjectId(req.user.id)
      : null;
 
    // Optional: capture IP for spam tracing
    const ip = String(
      req.headers["x-forwarded-for"] ||
      (req as any).ip ||
      ""
    ).split(",")[0].trim() || null;
 
    const doc = await ContactMessageModel.create({
      name, email, subject, message,
      user: userId,
      status: "new",
      ipAddress: ip,
    });
 
    return res.status(201).json({
      success: true,
      data: { _id: doc._id, createdAt: doc.createdAt },
    });
  }
 
  // ── ADMIN: GET /api/admin/contact-messages?status=&page=&limit=&search= ─
  async list(req: AuthRequest, res: Response) {
    const page   = Math.max(1, Number(req.query.page  ?? 1));
    const limit  = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const skip   = (page - 1) * limit;
    const status = String(req.query.status ?? "").trim();
    const search = String(req.query.search ?? "").trim();
 
    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name:    { $regex: search, $options: "i" } },
        { email:   { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }
 
    const [rows, total, unreadCount] = await Promise.all([
      ContactMessageModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "user", select: "fullName email" })
        .lean(),
      ContactMessageModel.countDocuments(filter),
      ContactMessageModel.countDocuments({ status: "new" }),
    ]);
 
    return res.status(200).json({
      success: true,
      data: rows,
      meta: { total, page, limit, unreadCount },
    });
  }
 
  // GET /api/admin/contact-messages/unread-count
  async unreadCount(_req: AuthRequest, res: Response) {
    const count = await ContactMessageModel.countDocuments({ status: "new" });
    return res.status(200).json({ success: true, data: { count } });
  }
 
  // GET /api/admin/contact-messages/:id
  async getById(req: AuthRequest, res: Response) {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid id");
 
    const doc = await ContactMessageModel.findById(id)
      .populate({ path: "user", select: "fullName email" })
      .lean();
    if (!doc) throw new HttpError(404, "Message not found");
 
    return res.status(200).json({ success: true, data: doc });
  }
 
  // PUT /api/admin/contact-messages/:id/status   { status: "read"|"replied"|"archived"|"new", adminNote? }
  async updateStatus(req: AuthRequest, res: Response) {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid id");
 
    const status = String(req.body?.status || "").trim();
    if (!["new", "read", "replied", "archived"].includes(status))
      throw new HttpError(400, "Invalid status");
 
    const doc = await ContactMessageModel.findById(id);
    if (!doc) throw new HttpError(404, "Message not found");
 
    doc.status = status as any;
    if (status === "read" && !doc.readAt) doc.readAt = new Date();
    if (status === "replied") doc.repliedAt = new Date();
    if (typeof req.body?.adminNote === "string")
      doc.adminNote = clean(req.body.adminNote, 1000) || null;
 
    await doc.save();
 
    return res.status(200).json({ success: true, data: doc.toObject() });
  }
 
  // DELETE /api/admin/contact-messages/:id
  async remove(req: AuthRequest, res: Response) {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid id");
    const r = await ContactMessageModel.findByIdAndDelete(id);
    if (!r) throw new HttpError(404, "Message not found");
    return res.status(200).json({ success: true });
  }
}