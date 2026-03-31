import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../../config/prisma";
import { createError } from "./error.middleware";

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) throw createError("Token toh bhejo yaarr", 401)

    const token = authHeader.split(" ")[1]
    const payload = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId
      }
    })

    if (!user) throw createError("Humare DB mein app exist nhi karte bhai ji", 401)

    req.user = user
    next()
  } catch (err) {
    next(err);
  }
}
