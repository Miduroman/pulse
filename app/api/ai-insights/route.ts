
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getPeriod(month?: number, year?: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  const currentYear = Number(
    parts.find((part) => part.type === "year")?.value
  );
  const currentMonth = Number(
    parts.find((part) => part.type === "month")?.value
  );

  const selectedMonth = month ?? currentMonth;
  const selectedYear = year ?? currentYear;

  if (
    !Number.isInteger(selectedMonth) ||
    selectedMonth < 1 ||
    selectedMonth > 12 ||
    !Number.isInteger(selectedYear) ||
    selectedYear < 2000 ||
    selectedYear > 2100
  ) {
    throw new Error("Bulan atau tahun tidak valid.");
  }

  return {
    month: selectedMonth,
    year: selectedYear,
    start: new Date(Date.UTC(selectedYear, selectedMonth - 1, 1)),
    end: new Date(Date.UTC(selectedYear, selectedMonth, 1)),
  };
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
}

function getRequestedPeriod(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const monthParam = params.get("month");
  const yearParam = params.get("year");

  return getPeriod(
    monthParam ? Number(monthParam) : undefined,
    yearParam ? Number(yearParam) : undefined
  );
}

// GET: hanya mengambil analisis yang sudah tersimpan.
// Tidak memanggil Gemini.
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const period = getRequestedPeriod(request);

    const savedInsight = await prisma.aIInsight.findUnique({
      where: {
        userId_month_year: {
          userId: user.id,
          month: period.month,
          year: period.year,
        },
      },
    });

    if (!savedInsight) {
      return NextResponse.json({
        success: true,
        exists: false,
        analysis: null,
        summary: null,
      });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      analysis: savedInsight.analysis,
      summary: savedInsight.summary,
      createdAt: savedInsight.createdAt,
      updatedAt: savedInsight.updatedAt,
    });
  } catch (error) {
    console.error("GET AI Insights Error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil analisis AI." },
      { status: 500 }
    );
  }
}

// POST: membuat analisis baru dengan Gemini dan menyimpannya.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum dikonfigurasi di .env." },
        { status: 500 }
      );
    }

    const period = getRequestedPeriod(request);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: period.start,
          lt: period.end,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    let income = 0;
    let expenses = 0;
    const categoryTotals: Record<string, number> = {};

    for (const transaction of transactions) {
      const amount = Number(transaction.amount);

      if (transaction.type === "INCOME") {
        income += amount;
      }

      if (transaction.type === "EXPENSE") {
        expenses += amount;

        const categoryName =
          transaction.category?.name ?? "Tanpa kategori";

        categoryTotals[categoryName] =
          (categoryTotals[categoryName] ?? 0) + amount;
      }
    }

    const savings = income - expenses;
    const savingsRate =
      income > 0 ? (savings / income) * 100 : 0;

    const topCategories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const summary = {
      month: period.month,
      year: period.year,
      income,
      expenses,
      savings,
      savingsRate: Number(savingsRate.toFixed(1)),
      transactionCount: transactions.length,
      topCategories,
    };

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Kamu adalah Pulse AI, asisten analisis keuangan pribadi.

Analisis data keuangan berikut:
${JSON.stringify(summary, null, 2)}

Tulis hasil dalam bahasa Indonesia dengan format:

# Analisis Keuangan Pulse

## 1. Ringkasan Kondisi Keuangan
Jelaskan pemasukan, pengeluaran, sisa arus kas,
dan persentase tabungan berdasarkan data.

## 2. Tiga Insight Keuangan
Berikan tepat 3 insight berdasarkan angka yang tersedia.
Setiap insight memiliki judul dan penjelasan.

## 3. Analisis Kategori Pengeluaran
Jelaskan kategori pengeluaran terbesar jika tersedia.

## 4. Tiga Rekomendasi Penghematan
Berikan tepat 3 saran yang realistis dan mudah dilakukan.

## 5. Kesimpulan
Berikan kesimpulan singkat.

Ketentuan:
- Gunakan bahasa sederhana dan profesional.
- Jangan mengarang angka atau informasi.
- Jika data belum cukup, jelaskan keterbatasannya.
- Jangan menyamakan sisa arus kas dengan saldo rekening.
- Jangan memberikan nasihat investasi.
- Jangan menghakimi pengguna.
- Selesaikan semua bagian dan jangan berhenti di tengah kalimat.
`;

    // Retry hanya untuk gangguan sementara 503.
    // Error kuota 429 tidak diulang karena pengulangan tidak membantu.
    let response;

    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.4,
          maxOutputTokens: 3000,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      if (
        message.includes("503") ||
        message.includes("UNAVAILABLE")
      ) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            temperature: 0.4,
            maxOutputTokens: 3000,
          },
        });
      } else {
        throw error;
      }
    }

    const analysis = response.text?.trim() ?? "";
    const finishReason =
      response.candidates?.[0]?.finishReason ?? "UNKNOWN";

    if (!analysis) {
      throw new Error("Gemini tidak menghasilkan teks analisis.");
    }

    if (finishReason === "MAX_TOKENS") {
      throw new Error(
        "Jawaban AI terpotong karena mencapai batas token. Silakan coba lagi."
      );
    }

    // Simpan atau perbarui analisis untuk bulan tersebut.
    const savedInsight = await prisma.aIInsight.upsert({
      where: {
        userId_month_year: {
          userId: user.id,
          month: period.month,
          year: period.year,
        },
      },
      create: {
        userId: user.id,
        month: period.month,
        year: period.year,
        analysis,
        summary,
      },
      update: {
        analysis,
        summary,
      },
    });

    return NextResponse.json({
      success: true,
      exists: true,
      analysis: savedInsight.analysis,
      summary: savedInsight.summary,
      createdAt: savedInsight.createdAt,
      updatedAt: savedInsight.updatedAt,
      debug: {
        finishReason,
        characterCount: analysis.length,
      },
    });
  } catch (error) {
    console.error("POST AI Insights Error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan yang tidak diketahui.";

    const status = message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED")
      ? 429
      : 500;

    return NextResponse.json(
      {
        error: "Gagal membuat analisis AI.",
        detail: message,
      },
      { status }
    );
  }
}
