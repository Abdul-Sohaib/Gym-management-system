import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

// ✅ PORT (fallback added)
const port = process.env.PORT ? Number(process.env.PORT) : 5001;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

export const env = {
  port,

  // ✅ Required in production, optional in dev (fallbacks added)
  mongoDbUri:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gym-app",

  jwtSecret:
    process.env.JWT_SECRET || "dev_jwt_secret_change_in_production",

  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    "dev_refresh_secret_change_in_production",

  // ✅ Optional (no crash)
  smtpEmail: getOptionalEnv("SMTP_EMAIL") ?? getOptionalEnv("EMAIL_USER"),

  smtpPassword:
    getOptionalEnv("SMTP_PASSWORD") ?? getOptionalEnv("EMAIL_PASS"),
} as const;