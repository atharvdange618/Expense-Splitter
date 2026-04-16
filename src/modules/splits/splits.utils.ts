import { SplitInput } from "../expenses/expense.schema";
import { createError } from "../../shared/middleware/error.middleware";
import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function calculateSplits(
  split: SplitInput,
  totalAmount: number,
  memberIds: string[],
): Map<string, number> {
  const result = new Map<string, number>();
  const total = new Decimal(totalAmount);

  switch (split.type) {
    case "EQUAL": {
      const memberCount = memberIds.length;
      const perPerson = total.dividedBy(memberCount);

      const baseAmount = perPerson
        .toDecimalPlaces(2, Decimal.ROUND_DOWN)
        .toNumber();
      const baseTotal = new Decimal(baseAmount).times(memberCount);
      const remainder = total.minus(baseTotal).toNumber();

      memberIds.forEach((id, index) => {
        const extraCent = index < Math.round(remainder * 100) ? 0.01 : 0;
        result.set(id, baseAmount + extraCent);
      });
      break;
    }

    case "PERCENTAGE": {
      const shares = split.shares;
      const splitUserIds = Object.keys(shares);

      const nonMembers = splitUserIds.filter((id) => !memberIds.includes(id));
      if (nonMembers.length > 0) {
        throw createError(`Users not in group: ${nonMembers.join(", ")}`, 400);
      }

      const totalPercent = Object.values(shares).reduce((sum, p) => sum + p, 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        throw createError(
          `Percentages must sum to 100, got ${totalPercent}`,
          400,
        );
      }

      let accumulatedTotal = new Decimal(0);
      const sortedUserIds = splitUserIds.sort();

      sortedUserIds.forEach((id, index) => {
        if (index === sortedUserIds.length - 1) {
          const remaining = total.minus(accumulatedTotal).toNumber();
          result.set(id, remaining);
        } else {
          const percentage = new Decimal(shares[id]);
          const amount = total
            .times(percentage)
            .dividedBy(100)
            .toDecimalPlaces(2, Decimal.ROUND_DOWN)
            .toNumber();
          result.set(id, amount);
          accumulatedTotal = accumulatedTotal.plus(amount);
        }
      });
      break;
    }

    case "EXACT": {
      const amounts = split.amounts;
      const splitUserIds = Object.keys(amounts);

      const nonMembers = splitUserIds.filter((id) => !memberIds.includes(id));
      if (nonMembers.length > 0) {
        throw createError(`Users not in group: ${nonMembers.join(", ")}`, 400);
      }

      const totalExact = splitUserIds.reduce(
        (sum, id) => sum.plus(amounts[id]),
        new Decimal(0),
      );

      if (totalExact.minus(total).abs().greaterThan(0.01)) {
        throw createError(
          `Exact amounts (${totalExact.toString()}) must sum to total (${totalAmount})`,
          400,
        );
      }

      splitUserIds.forEach((id) => {
        result.set(
          id,
          new Decimal(amounts[id])
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toNumber(),
        );
      });
      break;
    }
  }

  return result;
}
