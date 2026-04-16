import { Response, NextFunction } from "express";
import { type } from "arktype";
import { AuthRequest } from "../../shared/types";
import { userService } from "./user.service";
import { UpdateProfileSchema } from "./user.schema";
import { sendSuccess } from "../../shared/utils/response";

export const userController = {
  async getMe(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await userService.getProfile(req.user!.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  async updateMe(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validation = UpdateProfileSchema(req.body);

      if (validation instanceof type.errors) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.summary,
        });
        return;
      }

      const updated = await userService.updateProfile(req.user!.id, validation);
      sendSuccess(res, updated, "Profile updated");
    } catch (err) {
      next(err);
    }
  },

  async searchUsers(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = req.query.q as string;

      if (!query || query.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: "Query parameter 'q' must be at least 2 characters",
        });
        return;
      }

      const users = await userService.searchUsers(query, req.user!.id);
      sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  },
};
