import { type } from "arktype";

export const CreateGroupSchema = type({
  name: "string >= 3",
  "description?": "string",
});

export const AddMemberSchema = type({
  userId: "string",
});

export type CreateGroupInput = typeof CreateGroupSchema.infer;
export type AddMemberInput = typeof AddMemberSchema.infer;
