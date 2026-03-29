import { Request } from "express";
import { User } from "@prisma/client";

export interface AuthRequst extends Request {
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
