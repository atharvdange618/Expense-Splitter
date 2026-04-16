import { type } from "arktype";

const EqualSplit = type({
  type: '"EQUAL"',
});

const PercentageSplit = type({
  type: '"PERCENTAGE"',
  shares: type("Record<string, number>"),
});

const ExactSplit = type({
  type: '"EXACT"',
  amounts: type("Record<string, number>"),
});

export const CreateExpenseSchema = type({
  title: "string > 2",
  totalAmount: "number >= 0.01",
  paidById: "string",
  split: EqualSplit.or(PercentageSplit).or(ExactSplit),
});

export type CreateExpenseInput = typeof CreateExpenseSchema.infer;
export type SplitInput = CreateExpenseInput["split"];
