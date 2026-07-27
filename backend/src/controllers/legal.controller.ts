import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { LegalDocModel, LegalSlug } from "../models/legal_doc.model";
 
const VALID_SLUGS: LegalSlug[] = ["privacy", "terms", "refund", "shipping", "cookies"];
 
function trim(v: any) {
  return String(v ?? "").trim();
}
 
export class LegalController {
  // ── PUBLIC: GET /api/legal/:slug ─────────────────────────────────────────
  async getPublic(req: AuthRequest, res: Response) {
    const slug = trim(req.params.slug) as LegalSlug;
    if (!VALID_SLUGS.includes(slug)) throw new HttpError(400, "Invalid document slug");
 
    const doc = await LegalDocModel.findOne({ slug }).lean();
    if (!doc) throw new HttpError(404, "Document not published yet");
 
    return res.status(200).json({ success: true, data: doc });
  }
 
  // ── ADMIN: GET /api/admin/legal ──────────────────────────────────────────
  async list(_req: AuthRequest, res: Response) {
    const rows = await LegalDocModel.find({}).sort({ slug: 1 }).lean();
    return res.status(200).json({ success: true, data: rows });
  }
 
  // ── ADMIN: GET /api/admin/legal/:slug ────────────────────────────────────
  async getOne(req: AuthRequest, res: Response) {
    const slug = trim(req.params.slug) as LegalSlug;
    if (!VALID_SLUGS.includes(slug)) throw new HttpError(400, "Invalid slug");
 
    const doc = await LegalDocModel.findOne({ slug }).lean();
    if (!doc) throw new HttpError(404, "Document not found");
    return res.status(200).json({ success: true, data: doc });
  }
 
  // ── ADMIN: PUT /api/admin/legal/:slug ────────────────────────────────────
  async upsert(req: AuthRequest, res: Response) {
    const slug = trim(req.params.slug) as LegalSlug;
    if (!VALID_SLUGS.includes(slug)) throw new HttpError(400, "Invalid slug");
 
    const title = trim(req.body?.title);
    const intro = trim(req.body?.intro);
 
    if (!title) throw new HttpError(400, "Title is required");
    if (title.length > 200) throw new HttpError(400, "Title cannot exceed 200 characters");
    if (!intro) throw new HttpError(400, "Intro is required");
    if (intro.length > 2000) throw new HttpError(400, "Intro cannot exceed 2000 characters");
 
    const rawSections = Array.isArray(req.body?.sections) ? req.body.sections : [];
    const sections = rawSections.map((s: any, i: number) => {
      const heading = trim(s?.heading);
      const body    = trim(s?.body);
      if (!heading) throw new HttpError(400, `Section ${i + 1}: heading is required`);
      if (!body)    throw new HttpError(400, `Section ${i + 1}: body is required`);
      if (heading.length > 200)  throw new HttpError(400, `Section ${i + 1}: heading too long`);
      if (body.length > 10000)   throw new HttpError(400, `Section ${i + 1}: body too long`);
      return { heading, body };
    });
 
    if (sections.length === 0)
      throw new HttpError(400, "At least one section is required");
 
    const effectiveDate = req.body?.effectiveDate
      ? new Date(req.body.effectiveDate)
      : new Date();
 
    const userId = req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)
      ? new mongoose.Types.ObjectId(req.user.id)
      : null;
 
    const doc = await LegalDocModel.findOneAndUpdate(
      { slug },
      {
        $set: {
          slug, title, intro, sections, effectiveDate,
          updatedBy: userId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();
 
    return res.status(200).json({ success: true, data: doc });
  }
}