// Creates (or rotates the password for) an admin-portal account. Separate
// from the regular User table entirely -- this is the only way to get
// admin credentials, since the assistant should never choose/know them.
// Run with: npx tsx scripts/create-admin.ts <email> <password>
import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Admin user ready: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
