
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
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

    const currentPeriod = getJakartaPeriod();
    const { searchParams } = new URL(request.url);

    const rawMonth = searchParams.get("month");
    const rawYear = searchParams.get("year");

    const month =
      rawMonth === null ? currentPeriod.month : Number(rawMonth);

    const year =
      rawYear === null ? currentPeriod.year : Number(rawYear);

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

    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 1));

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    const income = transactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0,
      );

    const expenses = transactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0,
      );

    const savings = income - expenses;

    const savingsRate =
      income > 0 ? (savings / income) * 100 : null;

    const categoryTotals = new Map<string, number>();

    for (const transaction of transactions) {
      if (transaction.type !== "EXPENSE") continue;

      const categoryName = transaction.category.name;
      const current = categoryTotals.get(categoryName) ?? 0;

      categoryTotals.set(
        categoryName,
        current + Number(transaction.amount),
      );
    }

    const topCategory = [...categoryTotals.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];

    const insights: string[] = [];

    if (transactions.length === 0) {
      insights.push(
        "Belum ada aktivitas keuangan pada periode ini. Tambahkan transaksi untuk mulai melihat pola keuanganmu.",
      );
    } else {
      if (topCategory) {
        insights.push(
          `${topCategory[0]} menjadi kategori pengeluaran terbesar dengan total ${formatCurrency(topCategory[1])}.`,
        );
      }

      if (income === 0 && expenses > 0) {
        insights.push(
          `Kamu mencatat pengeluaran ${formatCurrency(expenses)}, tetapi belum mencatat pemasukan pada periode ini.`,
        );
      } else if (income > 0 && savings > 0) {
        if (savingsRate !== null && savingsRate >= 30) {
          insights.push(
            `Savings rate kamu ${savingsRate.toFixed(1)}%. Pertahankan kebiasaan menyisihkan pemasukan.`,
          );
        } else if (savingsRate !== null && savingsRate >= 10) {
          insights.push(
            `Savings rate kamu ${savingsRate.toFixed(1)}%. Masih ada surplus, tetapi kamu bisa meningkatkan porsi tabungan.`,
          );
        } else {
          insights.push(
            `Savings rate kamu ${savingsRate?.toFixed(1)}%. Surplus masih relatif kecil, jadi evaluasi pengeluaran yang bisa dikurangi.`,
          );
        }
      } else if (income > 0 && savings === 0) {
        insights.push(
          "Pemasukan dan pengeluaranmu seimbang. Coba sisihkan sebagian pemasukan agar mulai memiliki tabungan.",
        );
      } else if (income > 0 && savings < 0) {
        insights.push(
          `Pengeluaran melebihi pemasukan sebesar ${formatCurrency(Math.abs(savings))}. Evaluasi pengeluaran dan prioritaskan kebutuhan utama.`,
        );
      }

      if (income > 0 && expenses > income * 0.5) {
        insights.push(
          `Pengeluaran sudah mencapai ${((expenses / income) * 100).toFixed(1)}% dari pemasukan periode ini.`,
        );
      }
    }

    return NextResponse.json({
      period: {
        month,
        year,
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      insights,
      summary: {
        income,
        expenses,
        savings,
        savingsRate:
          savingsRate === null
            ? null
            : Number(savingsRate.toFixed(1)),
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
      { error: "Gagal menghasilkan insight keuangan." },
      { status: 500 },
    );
  }
}
