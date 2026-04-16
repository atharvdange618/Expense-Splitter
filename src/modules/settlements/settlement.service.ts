import { prisma } from "../../config/prisma";
import { createError } from "../../shared/middleware/error.middleware";
import { CreateSettlementInput } from "./settlement.schema";
import { sanitizeOptionalString } from "../../shared/utils/sanitize";

export const settlementService = {
  async createSettlement(input: CreateSettlementInput, payerId: string) {
    if (input.payeeId === payerId) {
      throw createError("Cannot settle with yourself", 400);
    }

    const payee = await prisma.user.findUnique({
      where: { id: input.payeeId },
    });
    if (!payee) {
      throw createError("Payee not found", 404);
    }

    const settlement = await prisma.settlement.create({
      data: {
        payerId,
        payeeId: input.payeeId,
        amount: input.amount,
        note: sanitizeOptionalString(input.note, 500),
      },
      include: {
        payer: { select: { id: true, name: true, email: true } },
        payee: { select: { id: true, name: true, email: true } },
      },
    });

    return settlement;
  },

  async getMySettlements(userId: string) {
    const settlements = await prisma.settlement.findMany({
      where: {
        OR: [{ payerId: userId }, { payeeId: userId }],
      },
      include: {
        payer: { select: { id: true, name: true, email: true } },
        payee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return settlements;
  },

  async confirmSettlement(settlementId: string, userId: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw createError("Settlement not found", 404);
    }

    if (settlement.payeeId !== userId) {
      throw createError("Only the payee can confirm this settlement", 403);
    }

    if (settlement.status === "CONFIRMED") {
      throw createError("Settlement already confirmed", 400);
    }

    const updated = await prisma.settlement.update({
      where: { id: settlementId },
      data: { status: "CONFIRMED" },
      include: {
        payer: { select: { id: true, name: true, email: true } },
        payee: { select: { id: true, name: true, email: true } },
      },
    });

    return updated;
  },

  async getGroupBalances(groupId: string, requesterId: string) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: requesterId, groupId } },
    });

    if (!membership) {
      throw createError("Access denied", 403);
    }

    const expenses = await prisma.expense.findMany({
      where: {
        groupId,
        deletedAt: null,
      },
      include: {
        splits: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        paidBy: { select: { id: true, name: true } },
      },
    });

    const balances: Record<string, Record<string, number>> = {};

    for (const expense of expenses) {
      const paidById = expense.paidById;

      for (const split of expense.splits) {
        const userId = split.userId;
        const owedAmount = Number(split.resolvedAmount);

        if (userId !== paidById) {
          if (!balances[userId]) balances[userId] = {};
          if (!balances[userId][paidById]) balances[userId][paidById] = 0;
          balances[userId][paidById] += owedAmount;
        }
      }
    }

    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const memberIds = groupMembers.map((m) => m.userId);

    const settlements = await prisma.settlement.findMany({
      where: {
        status: "CONFIRMED",
        payerId: { in: memberIds },
        payeeId: { in: memberIds },
      },
    });

    for (const settlement of settlements) {
      const payerId = settlement.payerId;
      const payeeId = settlement.payeeId;
      const settledAmount = Number(settlement.amount);

      if (balances[payerId]?.[payeeId]) {
        balances[payerId][payeeId] -= settledAmount;
        if (balances[payerId][payeeId] <= 0) {
          delete balances[payerId][payeeId];
        }
      }
    }

    const allUserIds = new Set<string>();
    for (const [fromUserId, toBalances] of Object.entries(balances)) {
      allUserIds.add(fromUserId);
      for (const toUserId of Object.keys(toBalances)) {
        allUserIds.add(toUserId);
      }
    }

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(allUserIds) } },
      select: { id: true, name: true },
    });

    const userCache = new Map(users.map((u) => [u.id, u]));

    const result: Array<{
      from: { id: string; name: string };
      to: { id: string; name: string };
      amount: number;
    }> = [];

    for (const [fromUserId, toBalances] of Object.entries(balances)) {
      for (const [toUserId, amount] of Object.entries(toBalances)) {
        if (amount > 0) {
          const fromUser = userCache.get(fromUserId);
          const toUser = userCache.get(toUserId);

          if (fromUser && toUser) {
            result.push({
              from: fromUser,
              to: toUser,
              amount: Number(amount.toFixed(2)),
            });
          }
        }
      }
    }

    return result;
  },
};
