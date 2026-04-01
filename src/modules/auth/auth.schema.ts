import { type } from "arktype";

export const RegisterSchema = type({
  name: "string >= 2",
  email: "string.email",
  password: "string >= 8",
});

export const LoginSchema = type({
  email: "string.email",
  password: "string",
});

export type RegisterInput = typeof RegisterSchema.infer;
export type LoginInput = typeof LoginSchema.infer;
