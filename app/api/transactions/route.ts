
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

type TransactionType = "INCOME" | "EXPENSE";

function parseTransaction(body: Record<string, unknown>) {
  const description = String(body.description ?? "").trim();
  const amount = Number(body.amount);
  const type = String(body.type ?? "");
  const accountId = String(body.accountId ?? "");
  const categoryId = String(body.categoryId ?? "");
  const dateText = String(body.date ?? "");

  if (
    !description ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !accountId ||
    !categoryId ||
    !["INCOME", "EXPENSE"].includes(type) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateText)
  ) {
    return null;
  }

  const date = new Date(`${dateText}T12:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateText
  ) {
    return null;
  }

  return {
    description,
    amount,
    type: type as TransactionType,
    accountId,
    categoryId,
    date,
  };
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email: session.user.email },
  });
}

// CREATE TRANSACTION
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const input = parseTransaction(body);

    if (!input) {
      return NextResponse.json(
        { error: "Data transaksi tidak valid." },
        { status: 400 },
      );
    }

    const [account, category] = await Promise.all([
      prisma.account.findFirst({
        where: {
          id: input.accountId,
          userId: user.id,
        },
      }),
      prisma.category.findUnique({
        where: { id: input.categoryId },
      }),
    ]);

    if (!account) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan." },
        { status: 404 },
      );
    }

    if (!category || category.type !== input.type) {
      return NextResponse.json(
        { error: "Kategori tidak sesuai dengan jenis transaksi." },
        { status: 400 },
      );
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          ...input,
          userId: user.id,
        },
        include: {
          category: true,
          account: true,
        },
      });

      await tx.account.update({
        where: { id: input.accountId },
        data: {
          balance:
            input.type === "INCOME"
              ? { increment: input.amount }
              : { decrement: input.amount },
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        message: "Transaksi berhasil ditambahkan.",
        transaction: {
          id: transaction.id,
          description: transaction.description,
          amount: Number(transaction.amount),
          type: transaction.type,
          date: transaction.date.toISOString(),
          category: {
            id: transaction.category.id,
            name: transaction.category.name,
          },
          account: {
            id: transaction.account.id,
            name: transaction.account.name,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create transaction error:", error);

    return NextResponse.json(
      { error: "Gagal menyimpan transaksi." },
      { status: 500 },
    );
  }
}

// UPDATE TRANSACTION
export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const id = String(body.id ?? "");
    const input = parseTransaction(body);

    if (!id || !input) {
      return NextResponse.json(
        { error: "Data transaksi tidak valid." },
        { status: 400 },
      );
    }

    const [existing, account, category] = await Promise.all([
      prisma.transaction.findFirst({
        where: {
          id,
          userId: user.id,
        },
      }),
      prisma.account.findFirst({
        where: {
          id: input.accountId,
          userId: user.id,
        },
      }),
      prisma.category.findUnique({
        where: { id: input.categoryId },
      }),
    ]);

    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan." },
        { status: 404 },
      );
    }

    if (!account) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan." },
        { status: 404 },
      );
    }

    if (!category || category.type !== input.type) {
      return NextResponse.json(
        { error: "Kategori tidak sesuai dengan jenis transaksi." },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Reverse dampak transaksi sebelumnya.
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance:
            existing.type === "INCOME"
              ? { decrement: existing.amount }
              : { increment: existing.amount },
        },
      });

      // Terapkan dampak transaksi yang baru.
      await tx.account.update({
        where: { id: input.accountId },
        data: {
          balance:
            input.type === "INCOME"
              ? { increment: input.amount }
              : { decrement: input.amount },
        },
      });

      return tx.transaction.update({
        where: { id },
        data: {
          description: input.description,
          amount: input.amount,
          type: input.type,
          date: input.date,
          accountId: input.accountId,
          categoryId: input.categoryId,
        },
        include: {
          category: true,
          account: true,
        },
      });
    });

    return NextResponse.json({
      message: "Transaksi berhasil diperbarui.",
      transaction: {
        id: updated.id,
        description: updated.description,
        amount: Number(updated.amount),
        type: updated.type,
        date: updated.date.toISOString(),
        category: {
          id: updated.category.id,
          name: updated.category.name,
        },
        account: {
          id: updated.account.id,
          name: updated.account.name,
        },
      },
    });
  } catch (error) {
    console.error("Update transaction error:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui transaksi." },
      { status: 500 },
    );
  }
}
