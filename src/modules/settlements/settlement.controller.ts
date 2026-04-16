import { Response, NextFunction } from "express";
import { type } from "arktype";
import { AuthRequest } from "../../shared/types";
import { settlementService } from "./settlement.service";
import { CreateSettlementSchema } from "./settlement.schema";
import { sendSuccess } from "../../shared/utils/response";

export const settlementController = {
  async createSettlement(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validation = CreateSettlementSchema(req.body);

      if (validation instanceof type.errors) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.summary,
        });
        return;
      }

      const settlement = await settlementService.createSettlement(
        validation,
        req.user!.id,
      );
      sendSuccess(res, settlement, "Settlement created", 201);
    } catch (err) {
      next(err);
    }
  },

  async getMySettlements(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const settlements = await settlementService.getMySettlements(
        req.user!.id,
      );
      sendSuccess(res, settlements);
    } catch (err) {
      next(err);
    }
  },

  async confirmSettlement(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const settlement = await settlementService.confirmSettlement(
        id,
        req.user!.id,
      );
      sendSuccess(res, settlement, "Settlement confirmed");
    } catch (err) {
      next(err);
    }
  },

  async getGroupBalances(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { groupId } = req.params;
      const balances = await settlementService.getGroupBalances(
        groupId,
        req.user!.id,
      );
      sendSuccess(res, balances);
    } catch (err) {
      next(err);
    }
  },
};
