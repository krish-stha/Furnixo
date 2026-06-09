import mongoose, { Schema, Document, Model } from "mongoose";

export interface UserDocument extends Document {
  fullName: string;
  email: string;
  countryCode?: string | null;
  phone?: string | null;
  address?: string | null;
  password: string;
  role: "user" | "admin";
  profile_picture?: string | null;

  reset_password_token?: string | null;
  reset_password_expires_at?: Date | null;

  deleted_at?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    countryCode: {
      type: String,
      default: null,
      trim: true,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    address: {
      type: String,
      default: null,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    profile_picture: {
      type: String,
      default: null,
    },

    // ✅ For forgot/reset password using 6-digit code
    reset_password_token: {
      type: String,
      default: null,
    },

    reset_password_expires_at: {
      type: Date,
      default: null,
    },

    // ✅ Soft delete support
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ deleted_at: 1 });
UserSchema.index({ reset_password_token: 1 });
UserSchema.index({ reset_password_expires_at: 1 });

export const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);