import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "demo@pulse.local" },
  });

  console.log("User:", !!user);
  console.log("Has password:", !!user?.password);
  console.log(
    "Password valid:",
    user ? await bcrypt.compare("PulseDemo123!", user.password) : false,
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
