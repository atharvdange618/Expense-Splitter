import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import groupRoutes from "./modules/groups/group.routes";
import expenseRoutes from "./modules/expenses/expense.routes";
import settlementRoutes from "./modules/settlements/settlement.routes";
import { authenticate } from "./shared/middleware/auth.middleware";
import { settlementController } from "./modules/settlements/settlement.controller";
import { errorMiddleware } from "./shared/middleware/error.middleware";
import { prisma } from "./config/prisma";

const app = express();

app.use((req, res, next) => {
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();
  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

const apiV1 = express.Router();

apiV1.use("/auth", authRoutes);
apiV1.use("/users", userRoutes);
apiV1.use("/groups", groupRoutes);

apiV1.use("/groups/:groupId/expenses", expenseRoutes);

apiV1.get(
  "/groups/:groupId/balances",
  authenticate,
  settlementController.getGroupBalances,
);

apiV1.use("/settlements", settlementRoutes);

app.use("/api/v1", apiV1);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorMiddleware);

export default app;
