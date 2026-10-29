import "dotenv/config";
import bcrypt from "bcryptjs";

import {
  PrismaClient,
  AccountType,
  CategoryType,
  TransactionType,
} from "../app/generated/prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Pulse database...");

  const user = await prisma.user.upsert({
    where: {
      email: "demo@pulse.local",
    },
    update: {},
    create: {
      name: "Mikail",
      email: "demo@pulse.local",
      password: await bcrypt.hash("PulseDemo123!", 10),
    },
  });

  const bank = await prisma.account.upsert({
    where: {
      id: "demo-bank-account",
    },
    update: {},
    create: {
      id: "demo-bank-account",
      name: "Main Bank",
      type: AccountType.BANK,
      balance: 8420000,
      currency: "IDR",
      userId: user.id,
    },
  });

  const wallet = await prisma.account.upsert({
    where: {
      id: "demo-wallet-account",
    },
    update: {},
    create: {
      id: "demo-wallet-account",
      name: "Daily Wallet",
      type: AccountType.E_WALLET,
      balance: 1250000,
      currency: "IDR",
      userId: user.id,
    },
  });

  const food = await prisma.category.upsert({
    where: { name: "Food" },
    update: {},
    create: {
      name: "Food",
      type: CategoryType.EXPENSE,
    },
  });

  const transport = await prisma.category.upsert({
    where: { name: "Transport" },
    update: {},
    create: {
      name: "Transport",
      type: CategoryType.EXPENSE,
    },
  });

  const shopping = await prisma.category.upsert({
    where: { name: "Shopping" },
    update: {},
    create: {
      name: "Shopping",
      type: CategoryType.EXPENSE,
    },
  });

  const entertainment = await prisma.category.upsert({
    where: { name: "Entertainment" },
    update: {},
    create: {
      name: "Entertainment",
      type: CategoryType.EXPENSE,
    },
  });

  const salary = await prisma.category.upsert({
    where: { name: "Salary" },
    update: {},
    create: {
      name: "Salary",
      type: CategoryType.INCOME,
    },
  });

  await prisma.transaction.deleteMany({
    where: {
      userId: user.id,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        description: "September Salary",
        amount: 12000000,
        type: TransactionType.INCOME,
        userId: user.id,
        accountId: bank.id,
        categoryId: salary.id,
        date: new Date("2026-09-01"),
      },
      {
        description: "Starbucks",
        amount: 68000,
        type: TransactionType.EXPENSE,
        userId: user.id,
        accountId: wallet.id,
        categoryId: food.id,
        date: new Date("2026-09-02"),
      },
      {
        description: "Grab",
        amount: 32000,
        type: TransactionType.EXPENSE,
        userId: user.id,
        accountId: wallet.id,
        categoryId: transport.id,
        date: new Date("2026-09-02"),
      },
      {
        description: "Netflix",
        amount: 186000,
        type: TransactionType.EXPENSE,
        userId: user.id,
        accountId: bank.id,
        categoryId: entertainment.id,
        date: new Date("2026-09-03"),
      },
      {
        description: "New sneakers",
        amount: 850000,
        type: TransactionType.EXPENSE,
        userId: user.id,
        accountId: bank.id,
        categoryId: shopping.id,
        date: new Date("2026-09-03"),
      },
      {
        description: "Lunch",
        amount: 75000,
        type: TransactionType.EXPENSE,
        userId: user.id,
        accountId: wallet.id,
        categoryId: food.id,
        date: new Date("2026-09-03"),
      },
    ],
  });

  await prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId: user.id,
        categoryId: food.id,
        month: 9,
        year: 2026,
      },
    },
    update: {
      amount: 1500000,
    },
    create: {
      userId: user.id,
      categoryId: food.id,
      amount: 1500000,
      month: 9,
      year: 2026,
    },
  });

  await prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId: user.id,
        categoryId: transport.id,
        month: 9,
        year: 2026,
      },
    },
    update: {
      amount: 1000000,
    },
    create: {
      userId: user.id,
      categoryId: transport.id,
      amount: 1000000,
      month: 9,
      year: 2026,
    },
  });

  console.log("Pulse database seeded successfully.");
  console.log("Demo user: " + user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });