import "dotenv/config";

import {
  PrismaClient,
  CategoryType,
} from "../app/generated/prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = [
    { name: "Food", type: CategoryType.EXPENSE },
    { name: "Transport", type: CategoryType.EXPENSE },
    { name: "Shopping", type: CategoryType.EXPENSE },
    { name: "Entertainment", type: CategoryType.EXPENSE },
    { name: "Salary", type: CategoryType.INCOME },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });

    console.log(`Kategori tersedia: ${category.name}`);
  }

  console.log("Selesai. Tidak ada transaksi atau data pengguna yang dihapus.");
}

main()
  .catch((error) => {
    console.error("Gagal menambahkan kategori:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
