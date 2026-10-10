import { SystemRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db.js";

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.INITIAL_ADMIN_NAME?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email && !name && !password) return;
  if (!email || !name || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
    throw new Error("Set a valid INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME, and INITIAL_ADMIN_PASSWORD (at least 12 characters).");
  }

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      role: SystemRole.ADMIN
    }
  });
}

main()
  .catch(error => {
    console.error("Initial administrator setup failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
