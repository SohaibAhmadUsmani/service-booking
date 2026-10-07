import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ValidationErrorDetail } from "@service-booking/shared";

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
    const formattedIssues: ValidationErrorDetail[] = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: formattedIssues,
    });
    return;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
    const anyErr = err as { keyValue?: Record<string, unknown>; keyPattern?: Record<string, unknown> };
    let field = "field";
    if (anyErr.keyValue && Object.keys(anyErr.keyValue).length > 0) {
      field = Object.keys(anyErr.keyValue)[0];
    } else if (anyErr.keyPattern && Object.keys(anyErr.keyPattern).length > 0) {
      field = Object.keys(anyErr.keyPattern)[0];
    }
    res.status(409).json({
      success: false,
      error: `An account with this ${field} already exists.`,
      details: [{ field, message: `This ${field} is already in use.` }],
    });
    return;
  }

  // Handle Mongoose Schema Validation Errors
  if (err && typeof err === "object" && err.name === "ValidationError" && "errors" in err) {
    const mongooseErrors = (err as { errors: Record<string, { path?: string; message: string }> }).errors;
    const formatted: ValidationErrorDetail[] = Object.values(mongooseErrors).map((e) => ({
      field: e.path || "unknown",
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      error: "Data validation error",
      details: formatted,
    });
    return;
  }

  // Handle Mongoose CastError (e.g. malformed ObjectId)
  if (err && typeof err === "object" && err.name === "CastError") {
    const castErr = err as { path?: string; value?: unknown };
    res.status(400).json({
      success: false,
      error: `Invalid resource identifier format for '${castErr.path || "id"}'`,
    });
    return;
  }

  // Handle JWT errors
  if (err && typeof err === "object" && err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      error: "Invalid authentication token",
    });
    return;
  }

  if (err && typeof err === "object" && err.name === "TokenExpiredError") {
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
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message || "Internal server error";

  console.error("Unhandled error:", err);

  res.status(status).json({
    success: false,
    error: status === 500 ? "Internal server error" : message,
  });
};
