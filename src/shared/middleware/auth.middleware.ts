import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../../config/prisma";
import { createError } from "./error.middleware";

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    let payload;

    try {
      payload = verifyToken(token);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createError("Invalid token", 401);
      }

      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw createError("User not found", 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
