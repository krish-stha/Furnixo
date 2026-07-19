import mongoose, { Schema, Document } from "mongoose";
 
export type LegalSlug = "privacy" | "terms" | "refund" | "shipping" | "cookies";
 
export interface ILegalSection {
  heading: string;
  body: string;
}
 
export interface ILegalDoc extends Document {
  slug: LegalSlug;
  title: string;
  intro: string;
  sections: ILegalSection[];
  effectiveDate: Date;
  updatedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
 
const LegalSectionSchema = new Schema<ILegalSection>(
  {
    heading: { type: String, required: true, trim: true, maxlength: 200 },
    body:    { type: String, required: true, trim: true, maxlength: 10000 },
  },
  { _id: false }
);
 
const LegalDocSchema = new Schema<ILegalDoc>(
  {
    slug:  {
      type: String,
      required: true,
      unique: true,
      enum: ["privacy", "terms", "refund", "shipping", "cookies"],
      index: true,
    },
    title:         { type: String,  required: true, trim: true, maxlength: 200 },
    intro:         { type: String,  required: true, trim: true, maxlength: 2000 },
    sections:      { type: [LegalSectionSchema], default: [] },
    effectiveDate: { type: Date,    default: Date.now },
    updatedBy:     { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);
 
export const LegalDocModel = mongoose.model<ILegalDoc>(
  "LegalDoc",
  LegalDocSchema
);