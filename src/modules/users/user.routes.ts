import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware";
import { userController } from "./user.controller";

const router = Router();

router.use(authenticate);

router.get("/me", userController.getMe);
router.patch("/me", userController.updateMe);
router.get("/search", userController.searchUsers);

export default router;
