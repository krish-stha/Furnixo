import mongoose, { Schema, Document } from "mongoose";
 
export type MessageStatus = "new" | "read" | "replied" | "archived";
 
export interface IContactMessage extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  user?: mongoose.Types.ObjectId | null;  // null = guest
  status: MessageStatus;
  adminNote?: string | null;
  readAt?: Date | null;
  repliedAt?: Date | null;
  ipAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
 
const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name:    { type: String, required: true, trim: true, maxlength: 100 },
    email:   { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    user:    { type: Schema.Types.ObjectId, ref: "User", default: null },
    status:  { type: String, enum: ["new", "read", "replied", "archived"], default: "new", index: true },
    adminNote: { type: String, default: null, maxlength: 1000 },
    readAt:    { type: Date, default: null },
    repliedAt: { type: Date, default: null },
    ipAddress: { type: String, default: null },
  },
  { timestamps: true }
);
 
ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ status: 1, createdAt: -1 });
 
export const ContactMessageModel = mongoose.model<IContactMessage>(
  "ContactMessage",
  ContactMessageSchema
);