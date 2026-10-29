
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const description = String(body.description ?? "").trim();
    const amount = Number(body.amount);
    const type = String(body.type ?? "");
    const accountId = String(body.accountId ?? "");
    const categoryId = String(body.categoryId ?? "");
    const date = new Date(`${body.date}T12:00:00.000Z`);

    if (
      !description ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !accountId ||
      !categoryId ||
      !["INCOME", "EXPENSE"].includes(type) ||
      !body.date ||
      Number.isNaN(date.getTime())
    ) {
      return NextResponse.json(
        { error: "Data transaksi tidak valid." },
        { status: 400 },
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

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan." },
        { status: 404 },
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.type !== type) {
      return NextResponse.json(
        { error: "Kategori tidak sesuai dengan jenis transaksi." },
        { status: 400 },
      );
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          description,
          amount,
          type: type as "INCOME" | "EXPENSE",
          date,
          userId: user.id,
          accountId,
          categoryId,
        },
        include: {
          category: true,
          account: true,
        },
      });

      await tx.account.update({
        where: { id: accountId },
        data: {
          balance:
            type === "INCOME"
              ? { increment: amount }
              : { decrement: amount },
        },
      });

      return created;
    });

    return NextResponse.json(
      {
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
      { error: "Gagal menyimpan transaksi. Periksa kembali data dan database." },
      { status: 500 },
    );
  }
}
