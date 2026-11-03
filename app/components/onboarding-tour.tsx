
"use client";

import { useEffect, useState } from "react";

const steps = [
  {
    eyebrow: "WELCOME TO PULSE",
    title: "Selamat datang di Pulse!",
    description:
      "Pulse membantu kamu memahami kondisi keuangan, mencatat transaksi, mengatur anggaran, dan memantau perkembangan keuangan dalam satu tempat.",
    icon: "✦",
  },
  {
    eyebrow: "STEP 1 — DASHBOARD",
    title: "Kenali kondisi keuanganmu",
    description:
      "Dashboard adalah pusat informasi keuanganmu. Di sini kamu bisa melihat saldo, pemasukan, pengeluaran, tabungan, dan ringkasan aktivitas keuangan.",
    icon: "◫",
  },
  {
    eyebrow: "STEP 2 — ACCOUNTS",
    title: "Kelola akun keuangan",
    description:
      "Tambahkan akun seperti rekening bank, dompet digital, uang tunai, atau kartu kredit. Setiap akun membantu memantau saldo yang kamu miliki.",
    icon: "▤",
  },
  {
    eyebrow: "STEP 3 — TRANSACTIONS",
    title: "Catat setiap transaksi",
    description:
      "Catat pemasukan dan pengeluaran, tentukan kategori, pilih akun, serta masukkan tanggal transaksi agar aktivitas keuanganmu tercatat.",
    icon: "↔",
  },
  {
    eyebrow: "STEP 4 — TRANSFERS",
    title: "Pindahkan uang antar akun",
    description:
      "Gunakan fitur Transfers untuk mencatat perpindahan uang, misalnya dari rekening bank ke dompet digital.",
    icon: "⇄",
  },
  {
    eyebrow: "STEP 5 — CATEGORIES",
    title: "Pahami ke mana uangmu pergi",
    description:
      "Kategori membantu mengelompokkan pengeluaran seperti makanan, transportasi, belanja, dan hiburan sehingga kamu lebih mudah memahami pola pengeluaran.",
    icon: "▦",
  },
  {
    eyebrow: "STEP 6 — MONTHLY BUDGET",
    title: "Atur anggaran bulanan",
    description:
      "Gunakan anggaran untuk menentukan batas pengeluaran setiap kategori. Pantau penggunaannya agar pengeluaran tetap sesuai rencana.",
    icon: "◷",
  },
  {
    eyebrow: "STEP 7 — PULSE AI",
    title: "Dapatkan insight keuangan",
    description:
      "Pulse AI membantu memberikan analisis dan insight berdasarkan informasi keuangan yang tersedia untuk membantumu memahami kondisi keuangan.",
    icon: "✧",
  },
];

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkOnboarding() {
      try {
        const response = await fetch("/api/onboarding", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Gagal memeriksa status onboarding.");
        }

        const result = await response.json();

        if (!cancelled) {
          setVisible(result.onboardingCompleted === false);
        }
      } catch {
        if (!cancelled) {
          setError("Tutorial belum dapat dimuat. Silakan refresh halaman.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, []);

  async function finishOnboarding() {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan status tutorial.");
      }

      setVisible(false);
    } catch {
      setError(
        "Status tutorial gagal disimpan. Periksa koneksi lalu coba lagi."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || !visible) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#111318] shadow-2xl"
      >
        <div className="h-1 w-full bg-white/10">
          <div
            className="h-full bg-violet-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-7 sm:p-9">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-lg text-violet-400">
                ✦
              </div>
              <span className="text-sm font-bold tracking-wide text-white">
                PULSE
              </span>
            </div>

            <span className="text-xs font-medium text-gray-500">
              {currentStep + 1} / {steps.length}
            </span>
          </div>

          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-3xl text-violet-400">
            {step.icon}
          </div>

          <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-violet-400">
            {step.eyebrow}
          </p>

          <h2
            id="onboarding-title"
            className="mb-4 text-2xl font-bold leading-tight text-white sm:text-3xl"
          >
            {step.title}
          </h2>

          <p className="min-h-20 text-sm leading-7 text-gray-400">
            {step.description}
          </p>

          <div className="mt-8 flex gap-1.5">
            {steps.map((item, index) => (
              <div
                key={item.eyebrow}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index <= currentStep
                    ? "bg-violet-500"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (currentStep === 0) {
                  finishOnboarding();
                } else {
                  setCurrentStep((previous) => previous - 1);
                }
              }}
              className="rounded-xl px-4 py-3 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              {currentStep === 0 ? "Lewati" : "Kembali"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (isLastStep) {
                  finishOnboarding();
                } else {
                  setCurrentStep((previous) => previous + 1);
                }
              }}
              className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {saving
                ? "Menyimpan..."
                : isLastStep
                  ? "Mulai Gunakan Pulse"
                  : "Lanjut"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
