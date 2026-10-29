import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "demo@pulse.local" },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Demo user not found" },
        { status: 404 },
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { category: true },
      orderBy: { date: "desc" },
    });

    const expenses = transactions.filter(
      (transaction) => transaction.type === "EXPENSE",
    );

    const income = transactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const totalExpenses = expenses.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );

    const categoryTotals = new Map<string, number>();

    for (const transaction of expenses) {
      const current = categoryTotals.get(transaction.category.name) ?? 0;

      categoryTotals.set(
        transaction.category.name,
        current + Number(transaction.amount),
      );
    }

    const topCategory = [...categoryTotals.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];

    const savingsRate =
      income > 0 ? ((income - totalExpenses) / income) * 100 : 0;

    const insights: string[] = [];

    if (topCategory) {
      insights.push(
        `${topCategory[0]} menjadi kategori pengeluaran terbesar dengan ${formatCurrency(topCategory[1])}.`,
      );
    }

    if (savingsRate >= 30) {
      insights.push(
        `Savings rate kamu ${savingsRate.toFixed(0)}%, cukup sehat untuk mempertahankan ruang finansial.`,
      );
    } else if (savingsRate >= 10) {
      insights.push(
        `Savings rate kamu ${savingsRate.toFixed(0)}%. Masih positif, tetapi ada ruang untuk meningkatkan tabungan.`,
      );
    } else {
      insights.push(
        `Savings rate kamu hanya ${savingsRate.toFixed(0)}%. Coba evaluasi pengeluaran terbesar bulan ini.`,
      );
    }

    if (totalExpenses > income * 0.5) {
      insights.push(
        `Pengeluaran sudah mencapai ${((totalExpenses / income) * 100).toFixed(0)}% dari pemasukan.`,
      );
    }

    return NextResponse.json({
      insights,
      summary: {
        income,
        expenses: totalExpenses,
        savingsRate: Number(savingsRate.toFixed(1)),
        topCategory: topCategory
          ? {
              name: topCategory[0],
              amount: topCategory[1],
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Insights API error:", error);

    return NextResponse.json(
      { error: "Failed to generate financial insights" },
      { status: 500 },
    );
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}