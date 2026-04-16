import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware";
import { settlementController } from "./settlement.controller";

const router = Router();

router.use(authenticate);

router.get("/", settlementController.getMySettlements);
router.post("/", settlementController.createSettlement);
router.patch("/:id/confirm", settlementController.confirmSettlement);

export default router;
