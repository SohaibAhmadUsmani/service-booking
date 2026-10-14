import { Schema, model, Document, Model } from "mongoose";
import { PHONE_E164_REGEX, UserRole } from "@service-booking/shared";

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  tokenVersion: number;
  passwordChangedAt?: Date;
  lastLogin?: Date;
  failedLoginAttempts: number;
  lastFailedLoginAt?: Date | null;
  lockoutCount: number;
  passwordHistory: string[];
  lockedUntil?: Date | null;
  resetPasswordTokenHash?: string | null;
  resetPasswordExpires?: Date | null;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpires?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address format"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.Customer,
      required: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: 60,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: 60,
    },
    phone: {
      type: String,
      trim: true,
      match: [PHONE_E164_REGEX, "Invalid phone number"],
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      required: true,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLoginAt: {
      type: Date,
      default: null,
    },
    lockoutCount: {
      type: Number,
      default: 0,
    },
    passwordHistory: {
      type: [String],
      default: [],
      select: false,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    resetPasswordTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
    emailVerificationTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id ? (ret._id as object).toString() : undefined;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.resetPasswordTokenHash;
        delete ret.emailVerificationTokenHash;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id ? (ret._id as object).toString() : undefined;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.resetPasswordTokenHash;
        delete ret.emailVerificationTokenHash;
        return ret;
      },
    },
  }
);

// Collation-aware case-insensitive unique index on email
UserSchema.index(
  { email: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    name: "uniq_email_case_insensitive",
  }
);

// Partial filter unique index on phone: only enforce uniqueness when phone is a non-empty string
UserSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: "string", $gt: "" } },
    name: "uniq_phone_sparse",
  }
);

// High-performance index for active session and tokenVersion revocation checks
UserSchema.index({ _id: 1, tokenVersion: 1, isActive: 1 });

// Compound index for active role filtering and sorting
UserSchema.index({ role: 1, isActive: 1, createdAt: -1 });

// Virtual for full name with null safety
UserSchema.virtual("fullName").get(function (this: IUserDocument) {
  return [this.firstName, this.lastName].filter(Boolean).join(" ").trim();
});

export const UserModel: Model<IUserDocument> =
  model<IUserDocument>("User", UserSchema);
