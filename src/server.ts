import "dotenv/config";
import app from "./app";
import { prisma } from "./config/prisma";
import { validateEnv } from "./config/env";

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  validateEnv();
  try {
    await prisma.$connect();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`ENV: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received — shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});
