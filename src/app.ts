import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware } from "./shared/middleware/error.middleware";
import authRoutes from "./modules/auth/auth.routes";

const app = express();

// core middlewares
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// health check route
app.get("/health", (_, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// routes
app.use("/api/auth", authRoutes);

app.use((_, res) => {
  res.status(404).json({
    success: false,
    message: "Ye route exist nhi karta bhai, path acche se check karo",
  });
});

// global error handler
app.use(errorMiddleware);

export default app;
