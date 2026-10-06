import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedIssues = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: formattedIssues,
    });
    return;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err && typeof err === "object" && "code" in err && err.code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : "field";
    res.status(409).json({
      success: false,
      error: `An account with this ${field} already exists.`,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      error: "Invalid authentication token",
    });
    return;
  }
  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      error: "Authentication token has expired",
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
    return;
  }

  // Standard or unhandled error
  const status = typeof err.status === "number" ? err.status : 500;
  const message = err.message || "Internal server error";

  console.error("Unhandled error:", err);

  res.status(status).json({
    success: false,
    error: status === 500 ? "Internal server error" : message,
  });
};
