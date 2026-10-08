import type { Server } from "http";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Booking } from "../src/modules/bookings/model";

process.env.JWT_SECRET = process.env.JWT_SECRET || "service-booking-test-jwt-secret-32-chars-minimum!";
process.env.NODE_ENV = "test";

export interface TestContext {
  baseUrl: string;
  close(): Promise<void>;
}

export interface TestUser {
  id: string;
  token: string;
  role: string;
  email: string;
}

export interface ApiResult {
  status: number;
  body: any;
}

export async function startTestServer(): Promise<TestContext> {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());

  const { createApp } = await import("../src/app");
  const server: Server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const addr = server.address();
  const port = typeof addr === "object" && addr !== null ? addr.port : 0;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      server.close();
      if (typeof (server as any).closeAllConnections === "function") {
        (server as any).closeAllConnections();
      }
      await mongoose.disconnect();
      await mongod.stop();
    },
  };
}

export async function api(
  baseUrl: string,
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {}
): Promise<ApiResult> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

let userCounter = 0;

export async function registerUser(baseUrl: string, role: "customer" | "provider"): Promise<TestUser> {
  userCounter += 1;
  const email = `namra.test.${role}.${userCounter}.${Date.now()}@example.com`;
  const res = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email,
      password: "Passw0rd!",
      firstName: "Namra",
      lastName: `Test${userCounter}`,
      role,
    },
  });
  if (res.status !== 201) {
    throw new Error(`Registration failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return {
    id: res.body.data.user.id,
    token: res.body.data.token,
    role,
    email,
  };
}

export async function createBookingFixture(options: {
  customerId: string;
  providerId: string;
  status?: string;
  price?: number;
  date?: string;
  startTime?: string;
}) {
  return Booking.create({
    bookingId: `BK-TEST-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    customerId: options.customerId,
    providerId: options.providerId,
    serviceId: new mongoose.Types.ObjectId(),
    date: options.date ?? "2026-10-15",
    startTime: options.startTime ?? "10:00",
    endTime: "10:30",
    price: options.price ?? 50,
    status: options.status ?? "completed",
  });
}

let passed = 0;
let failed = 0;
const failures: string[] = [];

export async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    failures.push(name);
    console.error(`  FAIL - ${name}`);
    console.error(`         ${(err as Error).message}`);
  }
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
}

export function reportAndExit(): void {
  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    failures.forEach((f) => console.log(`  failed: ${f}`));
    process.exit(1);
  }
  process.exit(0);
}
