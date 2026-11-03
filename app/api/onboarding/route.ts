
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
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
      select: {
        onboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      onboardingCompleted: user.onboardingCompleted,
    });
  } catch (error) {
    console.error("Onboarding GET error:", error);

    return NextResponse.json(
      { error: "Gagal memeriksa status onboarding." },
      { status: 500 },
    );
  }
}

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        onboardingCompleted: true,
      },
      select: {
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      message: "Onboarding berhasil diselesaikan.",
      onboardingCompleted: user.onboardingCompleted,
    });
  } catch (error) {
    console.error("Onboarding PATCH error:", error);

    return NextResponse.json(
      { error: "Gagal menyimpan status onboarding." },
      { status: 500 },
    );
  }
}
