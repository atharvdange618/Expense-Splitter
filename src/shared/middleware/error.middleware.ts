import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export function createError(
  message: string,
  statusCode: number = 400,
): AppError {
  return new AppError(message, statusCode);
}

export function errorMiddleware(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "Internal server error";

  if (statusCode === 500) {
    console.error("Internal error:", err);
  } else if (process.env.NODE_ENV === "development") {
    console.error(`Error [${statusCode}]:`, err);
  }

  const isDevMode = process.env.NODE_ENV === "development";

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevMode && { stack: err.stack }),
  });
}
