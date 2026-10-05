import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in server/.env");
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}