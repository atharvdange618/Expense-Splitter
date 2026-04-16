import { prisma } from "../../config/prisma";
import { createError } from "../../shared/middleware/error.middleware";
import { CreateExpenseInput } from "./expense.schema";
import { calculateSplits } from "../splits/splits.utils";
import { sanitizeString } from "../../shared/utils/sanitize";

export const expenseService = {
  async createExpense(
    groupId: string,
    input: CreateExpenseInput,
    requesterId: string,
  ) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) throw createError("Group not found", 404);

    const memberIds = group.members.map((m) => m.userId);
    const isMember = memberIds.includes(requesterId);
    if (!isMember) throw createError("Access denied", 403);

    if (!memberIds.includes(input.paidById)) {
      throw createError("Payer is not a group member", 400);
    }

    const resolvedSplits = calculateSplits(
      input.split,
      input.totalAmount,
      memberIds,
    );

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          title: sanitizeString(input.title, 200),
          totalAmount: input.totalAmount,
          splitType: input.split.type,
          splitInput: input.split as object,
          paidById: input.paidById,
          groupId,
        },
      });

      const splitRecords = Array.from(resolvedSplits.entries()).map(
        ([userId, resolvedAmount]) => ({
          expenseId: created.id,
          userId,
          resolvedAmount,
        }),
      );

      await tx.expenseSplit.createMany({ data: splitRecords });

      return tx.expense.findUnique({
        where: { id: created.id },
        include: {
          splits: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          paidBy: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return expense;
  },

  async getGroupExpenses(
    groupId: string,
    requesterId: string,
    cursor?: string,
    limit: number = 20,
  ) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: requesterId, groupId } },
    });
    if (!membership) throw createError("Access denied", 403);

    const expenses = await prisma.expense.findMany({
      where: {
        groupId,
        deletedAt: null,
      },
      include: {
        splits: { include: { user: { select: { id: true, name: true } } } },
        paidBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = expenses.length > limit;
    const results = hasMore ? expenses.slice(0, limit) : expenses;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    return {
      data: results,
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    };
  },

  async getExpense(expenseId: string, requesterId: string) {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        splits: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        paidBy: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
    });
    if (!expense || expense.deletedAt) {
      throw createError("Expense not found", 404);
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId: requesterId, groupId: expense.groupId },
      },
    });
    if (!membership) throw createError("Access denied", 403);

    return expense;
  },

  async deleteExpense(expenseId: string, requesterId: string) {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });
    if (!expense || expense.deletedAt) {
      throw createError("Expense not found", 404);
    }

    if (expense.paidById !== requesterId) {
      throw createError("Only the payer can delete this expense", 403);
    }

    try {
      await prisma.expense.update({
        where: { id: expenseId },
        data: { deletedAt: new Date() },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw createError("Expense not found", 404);
      }
      throw error;
    }
  },
};
