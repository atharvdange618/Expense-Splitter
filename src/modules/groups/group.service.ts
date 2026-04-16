import { prisma } from "../../config/prisma";
import { createError } from "../../shared/middleware/error.middleware";
import { CreateGroupInput, AddMemberInput } from "./group.schema";
import {
  sanitizeString,
  sanitizeOptionalString,
} from "../../shared/utils/sanitize";

export const groupService = {
  async createGroup(input: CreateGroupInput, creatorId: string) {
    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          name: sanitizeString(input.name, 100),
          description: sanitizeOptionalString(input.description, 500),
        },
      });

      await tx.groupMember.create({
        data: {
          userId: creatorId,
          groupId: created.id,
        },
      });

      return tx.group.findUnique({
        where: { id: created.id },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });
    });

    return group;
  },

  async getMyGroups(userId: string) {
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return groups;
  },

  async getGroup(groupId: string, requesterId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        expenses: {
          include: {
            paidBy: {
              select: { id: true, name: true },
            },
            splits: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!group) {
      throw createError("Group not found", 404);
    }

    const isMember = group.members.some((m) => m.userId === requesterId);
    if (!isMember) {
      throw createError("Access denied", 403);
    }

    return group;
  },

  async addMember(groupId: string, input: AddMemberInput, requesterId: string) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: requesterId, groupId } },
    });

    if (!membership) {
      throw createError("Access denied", 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw createError("User not found", 404);
    }

    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: input.userId, groupId } },
    });

    if (existing) {
      throw createError("User is already a member", 400);
    }

    const newMember = await prisma.groupMember.create({
      data: {
        userId: input.userId,
        groupId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return newMember;
  },

  async removeMember(
    groupId: string,
    userIdToRemove: string,
    requesterId: string,
  ) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: requesterId, groupId } },
    });

    if (!membership) {
      throw createError("Access denied", 403);
    }

    if (userIdToRemove === requesterId) {
      const memberCount = await prisma.groupMember.count({
        where: { groupId },
      });

      if (memberCount === 1) {
        await prisma.group.delete({ where: { id: groupId } });
        return { message: "Group deleted (last member left)" };
      }
    }

    const removed = await prisma.groupMember.delete({
      where: { userId_groupId: { userId: userIdToRemove, groupId } },
    });

    return removed;
  },
};
