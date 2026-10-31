
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}

// GET: mengambil riwayat transfer milik pengguna
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const transfers = await prisma.transfer.findMany({
      where: { userId: user.id },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error("GET TRANSFERS ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data transfer." },
      { status: 500 }
    );
  }
}

// POST: membuat transfer baru
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const amount = Number(body.amount);
    const fromAccountId = body.fromAccountId;
    const toAccountId = body.toAccountId;

    const date = body.date ? new Date(body.date) : new Date();

    if (
      !description ||
      description.length > 100 ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      typeof fromAccountId !== "string" ||
      typeof toAccountId !== "string" ||
      fromAccountId === toAccountId ||
      Number.isNaN(date.getTime())
    ) {
      return NextResponse.json(
        { message: "Data transfer tidak valid." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const accounts = await tx.account.findMany({
        where: {
          id: { in: [fromAccountId, toAccountId] },
          userId: user.id,
        },
      });

      const fromAccount = accounts.find(
        (account) => account.id === fromAccountId
      );

      const toAccount = accounts.find(
        (account) => account.id === toAccountId
      );

      if (!fromAccount || !toAccount) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      if (fromAccount.currency !== toAccount.currency) {
        throw new Error("CURRENCY_MISMATCH");
      }

      // Untuk tahap awal, kartu kredit hanya boleh menjadi tujuan pembayaran.
      if (fromAccount.type === "CREDIT_CARD") {
        throw new Error("INVALID_SOURCE_ACCOUNT");
      }

      const transfer = await tx.transfer.create({
        data: {
          description,
          amount: new Prisma.Decimal(amount),
          date,
          userId: user.id,
          fromAccountId,
          toAccountId,
        },
        include: {
          fromAccount: true,
          toAccount: true,
        },
      });

      // Uang keluar dari rekening sumber.
      await tx.account.update({
        where: { id: fromAccountId },
        data: {
          balance: { decrement: new Prisma.Decimal(amount) },
        },
      });

      // Jika tujuan kartu kredit, pembayaran mengurangi utang.
      // Jika tujuan rekening biasa, saldo bertambah.
      await tx.account.update({
        where: { id: toAccountId },
        data:
          toAccount.type === "CREDIT_CARD"
            ? { balance: { decrement: new Prisma.Decimal(amount) } }
            : { balance: { increment: new Prisma.Decimal(amount) } },
      });

      return transfer;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ACCOUNT_NOT_FOUND") {
        return NextResponse.json(
          { message: "Rekening tidak ditemukan." },
          { status: 404 }
        );
      }

      if (error.message === "CURRENCY_MISMATCH") {
        return NextResponse.json(
          { message: "Mata uang kedua rekening harus sama." },
          { status: 400 }
        );
      }

      if (error.message === "INVALID_SOURCE_ACCOUNT") {
        return NextResponse.json(
          { message: "Kartu kredit tidak dapat menjadi sumber transfer." },
          { status: 400 }
        );
      }
    }

    console.error("POST TRANSFER ERROR:", error);

    return NextResponse.json(
      { message: "Gagal membuat transfer." },
      { status: 500 }
    );
  }
}
