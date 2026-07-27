import { api } from "@/lib/api/axios";
 
export type ContactStatus = "new" | "read" | "replied" | "archived";
 
export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  user?: { _id: string; fullName?: string; email: string } | null;
  status: ContactStatus;
  adminNote?: string | null;
  readAt?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
 
// ── PUBLIC ────────────────────────────────────────────────────────────────
export async function submitContactMessage(payload: {
  name: string; email: string; subject: string; message: string;
}) {
  const res = await api.post("/contact", payload);
  return res.data;
}
 
// ── ADMIN ─────────────────────────────────────────────────────────────────
export async function adminListContactMessages(params?: {
  page?: number; limit?: number; status?: string; search?: string;
}) {
  const res = await api.get("/admin/contact-messages", { params });
  return res.data;
}
 
export async function adminContactUnreadCount() {
  const res = await api.get("/admin/contact-messages/unread-count");
  return res.data;
}
 
export async function adminGetContactMessage(id: string) {
  const res = await api.get(`/admin/contact-messages/${id}`);
  return res.data;
}
 
export async function adminUpdateContactStatus(
  id: string,
  status: ContactStatus,
  adminNote?: string,
) {
  const res = await api.put(`/admin/contact-messages/${id}/status`, { status, adminNote });
  return res.data;
}
 
export async function adminDeleteContactMessage(id: string) {
  const res = await api.delete(`/admin/contact-messages/${id}`);
  return res.data;
}