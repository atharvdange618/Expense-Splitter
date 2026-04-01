import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { signToken } from "../../shared/utils/jwt";
import { createError } from "../../shared/middleware/error.middleware";
import { RegisterInput, LoginInput } from "./auth.schema";

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existing) throw createError("Email already registered hai bhai", 400);

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    return { user, token };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw createError("Invalid credentials", 401);
    }

    const isValidPassword = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw createError("Invalid credentials", 401);
    }

    const token = signToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  },
};
