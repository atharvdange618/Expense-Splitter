import { type } from "arktype";

export const UpdateProfileSchema = type({
  "name?": "string >= 2",
  "email?": "string.email",
});

export type UpdateProfileInput = typeof UpdateProfileSchema.infer;
