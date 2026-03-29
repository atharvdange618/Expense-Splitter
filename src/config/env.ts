const REQUIRED_ENV_VARS = ["DATABASE_URL", "JWT_SECRET"] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required env vars brahhh: \n ${missing.join("\n ")}`,
    );
    console.error(
      "First copy the .env.example to the .env file and then fill the values, directly kaise server run karte ho bhai?",
    );
    process.exit(1);
  }
}
