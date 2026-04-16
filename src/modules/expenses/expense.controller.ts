import { Response, NextFunction } from "express";
import { type } from "arktype";
import { AuthRequest } from "../../shared/types";
import { expenseService } from "./expense.service";
import { CreateExpenseSchema } from "./expense.schema";
import { sendSuccess } from "../../shared/utils/response";

export const expenseController = {
  async createExpense(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { groupId } = req.params;
      const validation = CreateExpenseSchema(req.body);

      if (validation instanceof type.errors) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.summary,
        });
        return;
      }

      const expense = await expenseService.createExpense(
        groupId,
        validation,
        req.user!.id,
      );
      sendSuccess(res, expense, "Expense created", 201);
    } catch (err) {
      next(err);
    }
  },

  async getGroupExpenses(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { groupId } = req.params;
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20;

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          message: "Limit must be between 1 and 100",
        });
        return;
      }

      const result = await expenseService.getGroupExpenses(
        groupId,
        req.user!.id,
        cursor,
        limit,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getExpense(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { expenseId } = req.params;
      const expense = await expenseService.getExpense(expenseId, req.user!.id);
      sendSuccess(res, expense);
    } catch (err) {
      next(err);
    }
  },

  async deleteExpense(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { expenseId } = req.params;
      await expenseService.deleteExpense(expenseId, req.user!.id);
      sendSuccess(res, null, "Expense deleted");
    } catch (err) {
      next(err);
    }
  },
};
