import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { user: null, response: NextResponse.json(
      { error: "Silakan login terlebih dahulu." },
      { status: 401 },
    ) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return { user: null, response: NextResponse.json(
      { error: "Pengguna tidak ditemukan." },
      { status: 404 },
    ) };
  }

  return { user, response: null };
}

function validPeriod(month: number, year: number) {
  return (
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(year) &&
    year >= 2000 &&
    year <= 9999
  );
}

export async function POST(request: Request) {
  try {
    const { user, response } = await getAuthenticatedUser();

    if (response || !user) return response;

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format data tidak valid." },
        { status: 400 },
      );
    }

    const categoryId = String(body.categoryId ?? "").trim();
    const amount = Number(body.amount);
    const month = Number(body.month);
    const year = Number(body.year);

    if (
      !categoryId ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !validPeriod(month, year)
    ) {
      return NextResponse.json(
        { error: "Kategori, nominal, bulan, atau tahun tidak valid." },
        { status: 400 },
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, type: true },
    });

    if (!category || category.type !== "EXPENSE") {
      return NextResponse.json(
        { error: "Pilih kategori pengeluaran yang valid." },
        { status: 400 },
      );
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: user.id,
          categoryId,
          month,
          year,
        },
      },
      update: { amount },
      create: {
        amount,
        month,
        year,
        userId: user.id,
        categoryId,
      },
      include: { category: true },
    });

    return NextResponse.json(
      {
        message: "Anggaran berhasil disimpan.",
        budget: {
          id: budget.id,
          amount: Number(budget.amount),
          month: budget.month,
          year: budget.year,
          category: {
            id: budget.category.id,
            name: budget.category.name,
            type: budget.category.type,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Save budget error:", error);

    return NextResponse.json(
      { error: "Gagal menyimpan anggaran." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, response } = await getAuthenticatedUser();

    if (response || !user) return response;

    const id = new URL(request.url).searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "ID anggaran wajib diisi." },
        { status: 400 },
      );
    }

    const result = await prisma.budget.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Anggaran tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Anggaran berhasil dihapus.",
    });
  } catch (error) {
    console.error("Delete budget error:", error);

    return NextResponse.json(
      { error: "Gagal menghapus anggaran." },
      { status: 500 },
    );
  }
}
