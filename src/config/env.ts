const REQUIRED_ENV_VARS = ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}`,
    );
    console.error("Copy .env.example to .env and fill in the values.");
    process.exit(1);
  }
}
