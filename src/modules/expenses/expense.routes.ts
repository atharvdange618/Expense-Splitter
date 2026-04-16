import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware";
import { expenseController } from "./expense.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", expenseController.getGroupExpenses);
router.post("/", expenseController.createExpense);
router.get("/:expenseId", expenseController.getExpense);
router.delete("/:expenseId", expenseController.deleteExpense);

export default router;
