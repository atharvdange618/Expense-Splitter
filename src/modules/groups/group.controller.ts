import { Response, NextFunction } from "express";
import { type } from "arktype";
import { AuthRequest } from "../../shared/types";
import { groupService } from "./group.service";
import { CreateGroupSchema, AddMemberSchema } from "./group.schema";
import { sendSuccess } from "../../shared/utils/response";

export const groupController = {
  async createGroup(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validation = CreateGroupSchema(req.body);

      if (validation instanceof type.errors) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.summary,
        });
        return;
      }

      const group = await groupService.createGroup(validation, req.user!.id);
      sendSuccess(res, group, "Group created", 201);
    } catch (err) {
      next(err);
    }
  },

  async getMyGroups(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const groups = await groupService.getMyGroups(req.user!.id);
      sendSuccess(res, groups);
    } catch (err) {
      next(err);
    }
  },

  async getGroup(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { groupId } = req.params;
      const group = await groupService.getGroup(groupId, req.user!.id);
      sendSuccess(res, group);
    } catch (err) {
      next(err);
    }
  },

  async addMember(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { groupId } = req.params;
      const validation = AddMemberSchema(req.body);

      if (validation instanceof type.errors) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.summary,
        });
        return;
      }

      const member = await groupService.addMember(
        groupId,
        validation,
        req.user!.id,
      );
      sendSuccess(res, member, "Member added", 201);
    } catch (err) {
      next(err);
    }
  },

  async removeMember(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { groupId, userId } = req.params;
      const result = await groupService.removeMember(
        groupId,
        userId,
        req.user!.id,
      );
      sendSuccess(res, result, "Member removed");
    } catch (err) {
      next(err);
    }
  },
};
