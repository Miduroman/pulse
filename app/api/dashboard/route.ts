
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

function getJakartaPeriod() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  const year = Number(
    parts.find((part) => part.type === "year")?.value,
  );
  const month = Number(
    parts.find((part) => part.type === "month")?.value,
  );

  return { month, year };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    // Periode default mengikuti bulan berjalan di Jakarta.
    const currentPeriod = getJakartaPeriod();
    const { searchParams } = new URL(request.url);

    const rawMonth = searchParams.get("month");
    const rawYear = searchParams.get("year");

    const month = rawMonth === null
      ? currentPeriod.month
      : Number(rawMonth);

    const year = rawYear === null
      ? currentPeriod.year
      : Number(rawYear);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 9999
    ) {
      return NextResponse.json(
        { error: "Periode bulan atau tahun tidak valid." },
        { status: 400 },
      );
    }

    // Gunakan rentang tanggal [awal bulan, awal bulan berikutnya).
    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 1));

    const [
      accounts,
      transactions,
      periodTransactions,
      budgets,
    ] = await Promise.all([
      prisma.account.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      }),

      // Riwayat transaksi tetap tersedia untuk daftar terbaru.
      prisma.transaction.findMany({
        where: { userId: user.id },
        include: {
          category: true,
          account: true,
        },
        orderBy: [
          { date: "desc" },
          { createdAt: "desc" },
        ],
      }),

      // Hanya transaksi dalam periode yang dipilih untuk laporan.
      prisma.transaction.findMany({
        where: {
          userId: user.id,
          date: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        include: {
          category: true,
          account: true,
        },
        orderBy: { date: "desc" },
      }),

      prisma.budget.findMany({
        where: {
          userId: user.id,
          month,
          year,
        },
        include: {
          category: true,
        },
      }),
    ]);

    const totalBalance = accounts.reduce(
      (sum, account) => sum + Number(account.balance),
      0,
    );

    const income = periodTransactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0,
      );

    const expenses = periodTransactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0,
      );

    const savings = income - expenses;

    const categoryTotals = periodTransactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce<Record<string, number>>((result, transaction) => {
        const name = transaction.category.name;

        result[name] =
          (result[name] ?? 0) + Number(transaction.amount);

        return result;
      }, {});

    const topCategories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const serializeTransaction = (transaction: (typeof transactions)[number]) => ({
      id: transaction.id,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      date: transaction.date.toISOString(),
      category: {
        id: transaction.category.id,
        name: transaction.category.name,
        type: transaction.category.type,
      },
      account: {
        id: transaction.account.id,
        name: transaction.account.name,
        type: transaction.account.type,
      },
    });

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
      },

      period: {
        month,
        year,
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },

      totalBalance,
      income,
      expenses,
      savings,

      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: Number(account.balance),
        currency: account.currency,
      })),

      transactions: transactions.map(serializeTransaction),
      periodTransactions: periodTransactions.map(serializeTransaction),

      budgets: budgets.map((budget) => ({
        id: budget.id,
        amount: Number(budget.amount),
        month: budget.month,
        year: budget.year,
        category: {
          id: budget.category.id,
          name: budget.category.name,
          type: budget.category.type,
        },
      })),

      categories: await prisma.category.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
        },
      }),

      topCategories,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { error: "Gagal memuat data dashboard." },
      { status: 500 },
    );
  }
}
