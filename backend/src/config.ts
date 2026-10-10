import "dotenv/config";
import { z } from "zod";
const parsed = z.object({ DATABASE_URL:z.string().url(), PORT:z.coerce.number().default(4000), NODE_ENV:z.enum(["development","test","production"]).default("development"), FRONTEND_URL:z.string().url(), JWT_SECRET:z.string().min(32) }).safeParse(process.env);
if (!parsed.success) { console.error(parsed.error.flatten().fieldErrors); throw new Error("Invalid environment configuration"); }
export const env = parsed.data;
