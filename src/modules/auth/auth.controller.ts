import { Request, Response, NextFunction } from "express";
import { type } from "arktype";
import { LoginSchema, RegisterSchema } from "./auth.schema";
import { sendSuccess } from "../../shared/utils/response";
import { authService } from "./auth.service";

export const authController = {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validation = RegisterSchema(req.body);

      if (validation instanceof type.errors) {
        res.status(400).json({
          success: false,
          message: "Validation Failed",
          errors: validation.summary,
        });
        return;
      }

      const result = await authService.register(validation);

      sendSuccess(res, result, "Registration successful", 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = LoginSchema(req.body);

      if (validation instanceof type.errors) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.summary,
        });
        return;
      }

      const result = await authService.login(validation);
      sendSuccess(res, result, "Login successful");
    } catch (err) {
      next(err);
    }
  },
};
