import mongoose from "mongoose";
import dns from "dns";

// Ensure robust SRV DNS resolution on Windows / restricted network environments
try {
  const customDns = process.env.DNS_SERVERS;
  if (customDns) {
    dns.setServers(customDns.split(",").map((s) => s.trim()));
  } else {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  }
} catch {
  // Ignore if custom DNS manipulation is not supported in the current container/environment
}

export async function connectDb(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in server/.env");
  }

  // Attach connection lifecycle monitoring
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection lost. Reconnecting...");
  });

  await mongoose.connect(uri, {
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  console.log("MongoDB connected successfully");
}