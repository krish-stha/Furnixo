import nodemailer from "nodemailer";
import { SettingsModel } from "../models/settings.model";
 
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } =
  process.env;
 
let transporter: nodemailer.Transporter | null = null;
 
function isEmailConfigured() {
  return !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  );
}
 
function getTransporter() {
  if (transporter) return transporter;
 
  if (!isEmailConfigured()) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }
 
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST!,
    port: Number(process.env.EMAIL_PORT!),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  });
 
  return transporter;
}
 
/** Store name from admin Settings — cached for 60s so emails don't hit the DB every send */
let cachedStoreName: { value: string; at: number } | null = null;
async function getStoreName(): Promise<string> {
  const now = Date.now();
  if (cachedStoreName && now - cachedStoreName.at < 60_000) return cachedStoreName.value;
  try {
    const s = await SettingsModel.findOne({}).select("storeName").lean();
    const name = String(s?.storeName || "").trim() || "Furnixo";
    cachedStoreName = { value: name, at: now };
    return name;
  } catch {
    return cachedStoreName?.value || "Furnixo";
  }
}
 
export async function verifyEmailTransport(): Promise<boolean> {
  try {
    const t = getTransporter();
    if (!isEmailConfigured()) return true;
    await t.verify();
    console.log("✅ Email transporter verified");
    return true;
  } catch (err) {
    console.error("❌ Email transporter verify failed:", err);
    return false;
  }
}
 
async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const t = getTransporter();
  const from = EMAIL_FROM || EMAIL_USER || "no-reply@example.com";
 
  return t.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
 
/** Shared monochrome email shell */
function emailShell(storeName: string, body: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #171717;">
      <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">${storeName}</h2>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0 24px;" />
      ${body}
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 28px 0 12px;" />
      <p style="margin: 0; color: #a3a3a3; font-size: 11px;">
        © ${new Date().getFullYear()} ${storeName}
      </p>
    </div>
  `;
}
 
/** Password reset email — 6-digit code (verified by the backend) */
export async function sendResetEmail(to: string, code: string) {
  const storeName = await getStoreName();
 
  await sendEmail({
    to,
    subject: `${storeName} — your password reset code`,
    html: emailShell(
      storeName,
      `
      <h3 style="margin: 0 0 8px;">Reset your password</h3>
      <p style="margin: 0 0 20px; color: #525252; font-size: 14px; line-height: 1.6;">
        Enter this code on the reset password page:
      </p>
 
      <div style="background: #171717; color: #ffffff; text-align: center;
                  padding: 18px; font-size: 28px; font-weight: 700; letter-spacing: 8px;">
        ${code}
      </div>
 
      <p style="margin: 20px 0 0; color: #737373; font-size: 12px; line-height: 1.6;">
        This code expires in 15 minutes. If you didn't request a reset,
        you can safely ignore this email.
      </p>
      `
    ),
  });
 
  return true;
}
 
export async function sendPaymentReceiptEmail(params: {
  to: string;
  userName?: string;
  orderId: string;
  total: number;
  gateway: string;
  invoicePdf: Buffer;
}) {
  const t = getTransporter();
  const storeName = await getStoreName();
  const name = params.userName ? `<b>${params.userName}</b>` : "there";
 
  const html = emailShell(
    storeName,
    `
    <h3 style="margin: 0 0 8px;">Payment received</h3>
    <p style="margin: 0 0 16px; color: #525252; font-size: 14px;">
      Hello ${name}, we've received your payment.
    </p>
 
    <div style="border: 1px solid #e5e5e5; padding: 14px; font-size: 14px;">
      <p style="margin: 0 0 8px;"><b>Order ID:</b> ${params.orderId}</p>
      <p style="margin: 0 0 8px;"><b>Gateway:</b> ${params.gateway}</p>
      <p style="margin: 0;"><b>Total:</b> Rs. ${Number(params.total || 0)}</p>
    </div>
 
    <p style="margin: 16px 0 0; color: #737373; font-size: 12px;">
      Your invoice is attached as a PDF.
    </p>
    `
  );
 
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@example.com";
 
  return t.sendMail({
    from,
    to: params.to,
    subject: `${storeName} — payment receipt · Order ${String(params.orderId).slice(-6)}`,
    html,
    attachments: [
      {
        filename: `invoice-${String(params.orderId).slice(-8)}.pdf`,
        content: params.invoicePdf,
        contentType: "application/pdf",
      },
    ],
  });
}
 
export async function sendOrderStatusEmail(params: {
  to: string;
  userName?: string;
  orderId: string;
  status: string;
  total: number;
  address?: string;
}) {
  const storeName = await getStoreName();
  const statusPretty = String(params.status || "")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
 
  await sendEmail({
    to: params.to,
    subject: `${storeName} — order ${String(params.orderId).slice(-6)} is now ${statusPretty}`,
    html: emailShell(
      storeName,
      `
      <h3 style="margin: 0 0 8px;">Order status updated</h3>
      <p style="margin: 0 0 16px; color: #525252; font-size: 14px;">
        Hello ${params.userName ? `<b>${params.userName}</b>` : "there"},
        your order status has changed.
      </p>
 
      <div style="border: 1px solid #e5e5e5; padding: 14px; font-size: 14px;">
        <p style="margin: 0 0 8px;"><b>Order ID:</b> ${params.orderId}</p>
        <p style="margin: 0 0 8px;"><b>Status:</b> ${statusPretty}</p>
        <p style="margin: 0 0 8px;"><b>Total:</b> Rs. ${Number(params.total || 0)}</p>
        ${
          params.address
            ? `<p style="margin: 0;"><b>Delivery Address:</b> ${params.address}</p>`
            : ""
        }
      </div>
 
      <p style="margin: 16px 0 0; color: #737373; font-size: 12px;">
        Thank you for shopping with ${storeName}.
      </p>
      `
    ),
  });
 
  return true;
}
 

let cachedStoreEmail: { value: string; at: number } | null = null;
 
async function getStoreEmail(): Promise<string> {
  const now = Date.now();
  if (cachedStoreEmail && now - cachedStoreEmail.at < 60_000) return cachedStoreEmail.value;
  try {
    const s = await SettingsModel.findOne({}).select("storeEmail").lean();
    const email = String(s?.storeEmail || "").trim() || "admin@furnixo.com";
    cachedStoreEmail = { value: email, at: now };
    return email;
  } catch {
    return cachedStoreEmail?.value || "admin@furnixo.com";
  }
}
 
// ── 1. Notify ADMIN when a user submits a refund request ─────────────────────
export async function sendRefundRequestedEmail(params: {
  userName: string;
  userEmail: string;
  orderId: string;
  amountRs: number;
  reason?: string | null;
}) {
  const storeName = await getStoreName();
  const adminEmail = await getStoreEmail();
 
  await sendEmail({
    to: adminEmail,
    subject: `${storeName} — new refund request · Order ${params.orderId.slice(-6).toUpperCase()}`,
    html: emailShell(
      storeName,
      `
      <h3 style="margin: 0 0 8px;">New Refund Request</h3>
      <p style="margin: 0 0 16px; color: #525252; font-size: 14px;">
        A customer has submitted a refund request that needs your review.
      </p>
 
      <div style="border: 1px solid #e5e5e5; padding: 14px; font-size: 14px;">
        <p style="margin: 0 0 8px;"><b>Customer:</b> ${params.userName || "—"} (${params.userEmail})</p>
        <p style="margin: 0 0 8px;"><b>Order ID:</b> ${params.orderId}</p>
        <p style="margin: 0 0 8px;"><b>Amount Requested:</b> Rs. ${params.amountRs.toLocaleString("en-IN")}</p>
        ${params.reason ? `<p style="margin: 0;"><b>Reason:</b> ${params.reason}</p>` : ""}
      </div>
 
      <p style="margin: 16px 0 0; color: #737373; font-size: 12px;">
        Log in to the admin panel to review and take action.
      </p>
      `
    ),
  });
 
  return true;
}
 
// ── 2. Notify USER when admin updates refund status ──────────────────────────
export async function sendRefundStatusEmail(params: {
  to: string;
  userName?: string;
  status: "approved" | "rejected" | "processed";
  amountRs: number;
  orderId: string;
  adminNote?: string | null;
}) {
  const storeName = await getStoreName();
  const name = params.userName ? `<b>${params.userName}</b>` : "there";
 
  const subjects: Record<string, string> = {
    approved:  `${storeName} — refund approved · Order ${params.orderId.slice(-6).toUpperCase()}`,
    rejected:  `${storeName} — refund not approved · Order ${params.orderId.slice(-6).toUpperCase()}`,
    processed: `${storeName} — refund completed · Order ${params.orderId.slice(-6).toUpperCase()}`,
  };
 
  const headlines: Record<string, string> = {
    approved:  "Your refund has been approved",
    rejected:  "Refund request not approved",
    processed: "Refund has been processed",
  };
 
  const bodies: Record<string, string> = {
    approved:  `We have reviewed your request and approved a refund of <b>Rs. ${params.amountRs.toLocaleString("en-IN")}</b>. The amount will be returned to your original payment method within 5–7 business days.`,
    rejected:  `We were unable to approve your refund request for Rs. ${params.amountRs.toLocaleString("en-IN")}. Please contact our support team if you have questions.`,
    processed: `Your refund of <b>Rs. ${params.amountRs.toLocaleString("en-IN")}</b> has been successfully processed and sent back to your original payment method.`,
  };
 
  await sendEmail({
    to: params.to,
    subject: subjects[params.status],
    html: emailShell(
      storeName,
      `
      <h3 style="margin: 0 0 8px;">${headlines[params.status]}</h3>
      <p style="margin: 0 0 16px; color: #525252; font-size: 14px;">
        Hello ${name}, ${bodies[params.status]}
      </p>
 
      <div style="border: 1px solid #e5e5e5; padding: 14px; font-size: 14px;">
        <p style="margin: 0 0 8px;"><b>Order ID:</b> ${params.orderId}</p>
        <p style="margin: 0;"><b>Refund Amount:</b> Rs. ${params.amountRs.toLocaleString("en-IN")}</p>
        ${params.adminNote ? `<p style="margin: 8px 0 0;"><b>Note from our team:</b> ${params.adminNote}</p>` : ""}
      </div>
 
      <p style="margin: 16px 0 0; color: #737373; font-size: 12px;">
        If you have any questions, please reply to this email or contact ${storeName} support.
      </p>
      `
    ),
  });
 
  return true;
}
 