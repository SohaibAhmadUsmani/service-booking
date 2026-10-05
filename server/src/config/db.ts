import mongoose from "mongoose";
import dns from "dns";

// Ensure robust SRV DNS resolution on Windows environments
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {
  // Ignore if not supported in current environment
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in server/.env");
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}