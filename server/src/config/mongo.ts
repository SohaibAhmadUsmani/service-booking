import mongoose from "mongoose";
import dns from "dns";

// Ensure robust SRV DNS resolution on Windows environments
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {
  // Ignore if not supported in current context
}

const MONGO_URI = process.env.MONGODB_URI;

let isConnected = false;

export async function connectMongo(): Promise<typeof mongoose> {
  if (!MONGO_URI) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Please configure it in your server/.env file."
    );
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      autoIndex: process.env.NODE_ENV !== "production",
    });

    isConnected = conn.connection.readyState === 1;
    console.log("Connected to MongoDB Atlas (Identity & Access Module)");
    return conn;
  } catch (error) {
    console.error("MongoDB Atlas connection error:", error);
    throw error;
  }
}

export async function disconnectMongo(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log("Disconnected from MongoDB Atlas");
}
