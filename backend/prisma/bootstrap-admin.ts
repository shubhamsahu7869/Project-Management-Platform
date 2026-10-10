import { SystemRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db.js";

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.INITIAL_ADMIN_NAME?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const resetExisting = process.env.INITIAL_ADMIN_RESET_EXISTING === "true";

  if (!email && !name && !password && !resetExisting) return;
  if (!email || !name || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
    throw new Error("Set a valid INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME, and INITIAL_ADMIN_PASSWORD (at least 12 characters).");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!resetExisting) {
      console.log("Initial administrator already exists; leaving the account unchanged.");
      return;
    }
    if (existing.role !== SystemRole.ADMIN || !existing.isActive) {
      throw new Error("The existing account must be an active administrator before its password can be reset.");
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash: await bcrypt.hash(password, 12) }
    });
    console.log("Initial administrator password reset.");
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      role: SystemRole.ADMIN
    }
  });
  console.log("Initial administrator created.");
}

main()
  .catch(error => {
    console.error("Initial administrator setup failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
