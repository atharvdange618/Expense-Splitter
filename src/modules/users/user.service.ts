import { prisma } from "../../config/prisma";
import { createError } from "../../shared/middleware/error.middleware";
import { UpdateProfileInput } from "./user.schema";

export const userService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw createError("User not found", 404);
    }

    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    if (input.email) {
      const existing = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existing && existing.id !== userId) {
        throw createError("Email already in use", 400);
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  },

  async searchUsers(query: string, requesterId: string) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
        NOT: { id: requesterId },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10,
    });

    return users;
  },
};
