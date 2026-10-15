import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDb } from "../config/db";
import { UserModel } from "../modules/users/models/user.model";
import { UserRole } from "@service-booking/shared";

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding the admin user.");
  }

  await connectDb();

  const existing = await UserModel.findOne({ email });
  if (existing) {
    existing.role = UserRole.Admin;
    existing.isActive = true;
    existing.isEmailVerified = true;
    await existing.save();
    console.log(`Admin user already existed; role refreshed for ${email}`);
    process.exit(0);
  }

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
  const passwordHash = await bcrypt.hash(password, isNaN(saltRounds) ? 12 : saltRounds);

  await UserModel.create({
    email,
    passwordHash,
    role: UserRole.Admin,
    firstName: "Platform",
    lastName: "Admin",
    isActive: true,
    isEmailVerified: true,
    tokenVersion: 0,
  });

  console.log(`Seeded admin user ${email}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin user:", err);
  process.exit(1);
});
