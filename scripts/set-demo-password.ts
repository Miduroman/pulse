import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const password = await bcrypt.hash("PulseDemo123!", 10);

  const user = await prisma.user.update({
    where: { email: "demo@pulse.local" },
    data: { password },
  });

  console.log(`Password updated for ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
