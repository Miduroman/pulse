
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACCOUNT_TYPES = [
  "CASH",
  "BANK",
  "E_WALLET",
  "CREDIT_CARD",
] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number];

function jsonResponse(
  data: unknown,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      user: null,
      response: jsonResponse(
        { error: "Silakan login terlebih dahulu." },
        401
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!user) {
    return {
      user: null,
      response: jsonResponse(
        { error: "Pengguna tidak ditemukan." },
        404
      ),
    };
  }

  return { user, response: null };
}

function validAccountType(
  value: unknown
): value is AccountType {
  return (
    typeof value === "string" &&
    ACCOUNT_TYPES.includes(value as AccountType)
  );
}

// GET ACCOUNTS
export async function GET() {
  try {
    const { user, response } = await getAuthenticatedUser();

    if (response || !user) return response;

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return jsonResponse({
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: Number(account.balance),
        currency: account.currency,
        createdAt: account.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get accounts error:", error);

    return jsonResponse(
      { error: "Gagal mengambil data akun." },
      500
    );
  }
}

// CREATE ACCOUNT
export async function POST(request: Request) {
  try {
    const { user, response } = await getAuthenticatedUser();

    if (response || !user) return response;

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        { error: "Format data tidak valid." },
        400
      );
    }

    const name = String(body.name ?? "").trim();
    const type = body.type;
    const currency = String(
      body.currency ?? "IDR"
    ).trim().toUpperCase();

    const balance =
      body.balance === undefined ||
      body.balance === null ||
      body.balance === ""
        ? 0
        : Number(body.balance);

    if (
      !name ||
      name.length > 60 ||
      !validAccountType(type) ||
      !/^[A-Z]{3}$/.test(currency) ||
      !Number.isFinite(balance) ||
      balance < 0
    ) {
      return jsonResponse(
        {
          error:
            "Nama, jenis, mata uang, atau saldo awal tidak valid.",
        },
        400
      );
    }

    const account = await prisma.account.create({
      data: {
        name,
        type,
        currency,
        balance,
        userId: user.id,
      },
    });

    return jsonResponse(
      {
        message: "Akun berhasil ditambahkan.",
        account: {
          id: account.id,
          name: account.name,
          type: account.type,
          balance: Number(account.balance),
          currency: account.currency,
        },
      },
      201
    );
  } catch (error) {
    console.error("Create account error:", error);

    return jsonResponse(
      { error: "Gagal menambahkan akun." },
      500
    );
  }
}

// UPDATE ACCOUNT
export async function PUT(request: Request) {
  try {
    const { user, response } = await getAuthenticatedUser();

    if (response || !user) return response;

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        { error: "Format data tidak valid." },
        400
      );
    }

    const id = String(body.id ?? "").trim();
    const name = String(body.name ?? "").trim();
    const type = body.type;
    const currency = String(
      body.currency ?? "IDR"
    ).trim().toUpperCase();

    if (
      !id ||
      !name ||
      name.length > 60 ||
      !validAccountType(type) ||
      !/^[A-Z]{3}$/.test(currency)
    ) {
      return jsonResponse(
        { error: "Data akun tidak valid." },
        400
      );
    }

    const existing = await prisma.account.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return jsonResponse(
        { error: "Akun tidak ditemukan." },
        404
      );
    }

    const account = await prisma.account.update({
      where: { id: existing.id },
      data: {
        name,
        type,
        currency,
      },
    });

    return jsonResponse({
      message: "Akun berhasil diperbarui.",
      account: {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: Number(account.balance),
        currency: account.currency,
      },
    });
  } catch (error) {
    console.error("Update account error:", error);

    return jsonResponse(
      { error: "Gagal memperbarui akun." },
      500
    );
  }
}
