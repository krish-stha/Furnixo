import { api } from "@/lib/api/axios";
 
export type LegalSlug = "privacy" | "terms" | "refund" | "shipping" | "cookies";
 
export interface LegalSection {
  heading: string;
  body: string;
}
 
export interface LegalDoc {
  _id: string;
  slug: LegalSlug;
  title: string;
  intro: string;
  sections: LegalSection[];
  effectiveDate: string;
  updatedAt: string;
}
 
// ── PUBLIC ────────────────────────────────────────────────────────────────
export async function getLegalDoc(slug: LegalSlug) {
  const res = await api.get(`/legal/${slug}`);
  return res.data;
}
 
// ── ADMIN ─────────────────────────────────────────────────────────────────
export async function adminListLegalDocs() {
  const res = await api.get("/admin/legal");
  return res.data;
}
 
export async function adminGetLegalDoc(slug: LegalSlug) {
  const res = await api.get(`/admin/legal/${slug}`);
  return res.data;
}
 
export async function adminUpdateLegalDoc(
  slug: LegalSlug,
  payload: { title: string; intro: string; sections: LegalSection[]; effectiveDate?: string },
) {
  const res = await api.put(`/admin/legal/${slug}`, payload);
  return res.data;
}
 