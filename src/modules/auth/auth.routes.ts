import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "./auth.controller";

const router = Router();

// Rate limiter for authentication endpoints to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);

export default router;
