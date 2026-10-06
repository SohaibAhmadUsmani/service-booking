import { Schema, model, Document, Model } from "mongoose";
import { UserRole } from "@service-booking/shared";

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  tokenVersion: number;
  passwordChangedAt?: Date;
  lastLogin?: Date;
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

// Partial filter unique index on phone (ignores documents where phone is undefined)
UserSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: "string" } },
    name: "uniq_phone_sparse",
  }
);

// Compound index for active role filtering and sorting
UserSchema.index({ role: 1, isActive: 1, createdAt: -1 });

// Virtual for full name with null safety
UserSchema.virtual("fullName").get(function (this: IUserDocument) {
  return [this.firstName, this.lastName].filter(Boolean).join(" ").trim();
});

export const UserModel: Model<IUserDocument> =
  model<IUserDocument>("User", UserSchema);
