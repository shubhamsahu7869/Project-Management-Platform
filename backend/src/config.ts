import "dotenv/config";
import { z } from "zod";

const parsed = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32)
}).safeParse(process.env);

if (!parsed.success) {
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

const frontendUrls = [...new Set(parsed.data.FRONTEND_URL.split(",").map(value => value.trim()).filter(Boolean).map(value => value.replace(/\/$/, "")))];

if (!frontendUrls.length) {
  throw new Error("FRONTEND_URL must include at least one valid frontend origin");
}

export const env = { ...parsed.data, FRONTEND_URLS: frontendUrls };
