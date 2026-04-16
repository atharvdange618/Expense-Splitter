import { type } from "arktype";

export const CreateSettlementSchema = type({
  payeeId: "string",
  amount: "number >= 0.01",
  "note?": "string",
});

export type CreateSettlementInput = typeof CreateSettlementSchema.infer;
