"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type TourAction =
  | "account-created"
  | "transaction-created"
  | "transfer-created"
  | "budget-created"
  | "ai-generated";

type TourStep = {
  title: string;
  description: string;
  route: string;
  target: string;
  action?: TourAction;
};

const steps: TourStep[] = [
  {
    title: "Dashboard Pulse",
    description: "Pantau saldo, pemasukan, dan pengeluaranmu di sini.",
    route: "/dashboard",
    target: "dashboard-overview",
  },
  {
    title: "Buat akun",
    description: "Akun Cash sudah tersedia secara otomatis. Tambahkan satu rekening bank atau e-wallet untuk mulai mengelola keuanganmu.",
    route: "/accounts",
    target: "account-create",
    action: "account-created",
  },
  {
    title: "Catat transaksi",
    description: "Coba catat satu pemasukan atau pengeluaran pertamamu.",
    route: "/transactions",
    target: "transaction-form",
    action: "transaction-created",
  },
  {
    title: "Transfer antar akun",
    description:
      "Coba transfer saldo antara akun Cash dan rekening atau e-wallet milikmu.",
    route: "/transfers",
    target: "transfer-form",
    action: "transfer-created",
  },
  {
    title: "Anggaran bulanan",
    description: "Tentukan batas pengeluaran untuk mengatur keuanganmu.",
    route: "/dashboard",
    target: "budget-form",
    action: "budget-created",
  },
  {
    title: "Pulse AI",
    description: "Coba dapatkan insight dari data keuanganmu.",
    route: "/dashboard",
    target: "pulse-ai",
    action: "ai-generated",
  },
];

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export default function PulseGuidedTour() {
  const router = useRouter();
  const pathname = usePathname();

  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [accountPhase, setAccountPhase] = useState(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [accountCount, setAccountCount] = useState<number | null>(null);

  const step = steps[currentStep];

  useEffect(() => {
  if (!visible || currentStep !== 3) return;

  let cancelled = false;

  async function checkAccounts() {
    try {
      const response = await fetch("/api/accounts", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const result = await response.json();

      if (!cancelled) {
        setAccountCount(
          Array.isArray(result.accounts) ? result.accounts.length : 0,
        );
      }
    } catch {
      if (!cancelled) {
        setAccountCount(null);
      }
    }
  }

  setAccountCount(null);
  void checkAccounts();

  return () => {
    cancelled = true;
  };
}, [visible, currentStep]);

  const finishTour = useCallback(async (hideImmediately = false) => {
    if (saving) return;

    setSaving(true);
    setError("");

    if (hideImmediately) {
      setVisible(false);
    }

    try {
      const response = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Status tutorial gagal disimpan.");
      }

      sessionStorage.removeItem("pulse-tour-step");
      setVisible(false);
    } catch {
      if (hideImmediately) {
        setVisible(true);
      }

      setError("Tidak dapat menyimpan status tutorial. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }, [saving]);

  const goToStep = useCallback(
    (nextStep: number) => {
      if (nextStep >= steps.length) {
        void finishTour(true);
        return;
      }

      if (nextStep < 0) return;

      setCurrentStep(nextStep);
      setAccountPhase(false);
      setTargetRect(null);
      setError("");

      sessionStorage.setItem("pulse-tour-step", String(nextStep));

      const nextRoute = steps[nextStep].route;
      if (pathname !== nextRoute) {
        router.push(nextRoute);
      }
    },
    [finishTour, pathname, router],
  );

  useEffect(() => {
    let cancelled = false;

    async function checkOnboarding() {
      try {
        const response = await fetch("/api/onboarding", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = await response.json();

        if (cancelled || result.onboardingCompleted !== false) return;

        const savedStep = Number(
          sessionStorage.getItem("pulse-tour-step") ?? "0",
        );

        const safeStep =
          Number.isInteger(savedStep) &&
          savedStep >= 0 &&
          savedStep < steps.length
            ? savedStep
            : 0;

        setCurrentStep(safeStep);
        setVisible(true);

        if (pathname !== steps[safeStep].route) {
          router.push(steps[safeStep].route);
        }
      } catch {
        // Jangan menghalangi pengguna memakai aplikasi jika tutorial gagal dimuat.
      }
    }

    void checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!visible || !step) return;

    let attempts = 0;
    let interval: ReturnType<typeof setInterval>;

    function locateTarget() {
      const targetName =
        currentStep === 1 && accountPhase
          ? "account-form"
          : step.target;

      const element = document.querySelector<HTMLElement>(
        `[data-tour="${targetName}"]`,
      );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        const rect = element.getBoundingClientRect();

        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        return true;
      }

      return false;
    }

    if (pathname !== step.route) {
      setTargetRect(null);
      return;
    }

    if (locateTarget()) return;

    interval = setInterval(() => {
      attempts += 1;

      if (locateTarget() || attempts >= 40) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [visible, pathname, step, currentStep, accountPhase]);

  useEffect(() => {
    if (!visible || !targetRect) return;

    const updatePosition = () => {
      const targetName =
        currentStep === 1 && accountPhase
          ? "account-form"
          : step.target;

      const element = document.querySelector<HTMLElement>(
        `[data-tour="${targetName}"]`,
      );

      if (!element) return;

      const rect = element.getBoundingClientRect();

      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible, targetRect, currentStep, accountPhase, step]);

  useEffect(() => {
    if (!visible || currentStep !== 1 || accountPhase) return;

    const handleAccountButton = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      if (target.closest('[data-tour="account-create"]')) {
        setAccountPhase(true);
        setTargetRect(null);
      }
    };

    document.addEventListener("click", handleAccountButton, true);

    return () => {
      document.removeEventListener("click", handleAccountButton, true);
    };
  }, [visible, currentStep, accountPhase]);

  useEffect(() => {
    if (!visible || !step.action) return;

    const handleTourAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ action: TourAction }>;

      if (customEvent.detail?.action !== step.action) return;

      // Transfer membutuhkan minimal dua akun.
      if (currentStep === 3) {
        if (accountCount === null) {
          setError("Sedang memeriksa akun. Coba lagi sebentar.");
          return;
        }

        if (accountCount < 2) {
          setError(
            "Transfer membutuhkan minimal dua akun. Tambahkan akun kedua atau lewati langkah ini.",
          );
          return;
        }
      }

      setError("");
      goToStep(currentStep + 1);
    };

    window.addEventListener("pulse-tour-action", handleTourAction);

    return () => {
      window.removeEventListener("pulse-tour-action", handleTourAction);
    };
  }, [visible, step, currentStep, accountCount, goToStep]);

  if (!visible || !step) return null;

  const waitingForAction = Boolean(step.action);
  const tooltipStyle: React.CSSProperties = (() => {
    if (!targetRect || typeof window === "undefined") {
      return {
        bottom: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }

    const tooltipWidth = Math.min(448, window.innerWidth - 32);
    const tooltipHeight = 230;
    const gap = 18;

    const spaceLeft = targetRect.left - 16;
    const spaceRight =
      window.innerWidth - (targetRect.left + targetRect.width) - 16;

    const preferRight = targetRect.left + targetRect.width / 2 <
      window.innerWidth / 2;

    let showOnRight = preferRight;

    if (
      (preferRight ? spaceRight : spaceLeft) < tooltipWidth + gap
    ) {
      showOnRight = !preferRight;
    }

    const availableSpace = showOnRight ? spaceRight : spaceLeft;

    // Jika ruang samping tidak cukup, gunakan posisi vertikal sebagai fallback.
    if (availableSpace < Math.min(tooltipWidth, window.innerWidth - 32) + gap) {
      const spaceBelow =
        window.innerHeight - targetRect.top - targetRect.height;

      const showBelow = spaceBelow >= tooltipHeight + gap;

      return {
        top: showBelow
          ? targetRect.top + targetRect.height + gap
          : Math.max(16, targetRect.top - tooltipHeight - gap),
        left: Math.max(
          16,
          Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - 16,
          ),
        ),
        width: tooltipWidth,
      };
    }

    const left = showOnRight
      ? targetRect.left + targetRect.width + gap
      : targetRect.left - tooltipWidth - gap;

    const top = Math.max(
      16,
      Math.min(
        targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
        window.innerHeight - tooltipHeight - 16,
      ),
    );

    return {
      top,
      left,
      width: tooltipWidth,
    };
  })();

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {targetRect && (
        <div
          aria-hidden="true"
          className="fixed rounded-xl border-2 border-violet-400"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.76)",
            transition: "all 180ms ease",
          }}
        />
      )}

      {!targetRect && (
        <div className="fixed inset-0 bg-black/75" />
      )}

      <section
        role="dialog"
        aria-modal="false"
        aria-labelledby="pulse-tour-title"
        className="pointer-events-auto fixed z-[202] max-h-[45vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111318] p-4 text-white shadow-2xl sm:p-5"
        style={tooltipStyle}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold tracking-[0.18em] text-violet-400">
            PULSE GUIDED TOUR
          </span>
          <span className="text-xs text-gray-400">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

        <h2
          id="pulse-tour-title"
          className="mb-2 text-xl font-bold"
        >
          {step.title}
        </h2>

        <p className="text-sm leading-6 text-gray-400">
          {step.description}
        </p>

        {waitingForAction && (
          <p className="mt-3 rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-300">
            {currentStep === 1 && !accountPhase
              ? "Klik tombol New account yang disorot."
              : currentStep === 3 && accountCount === null
                ? "Memeriksa akunmu..."
                : currentStep === 3 && accountCount !== null && accountCount < 2
                  ? "Transfer butuh 2 akun. Tambahkan akun kedua atau lewati dulu, ya!"
                  : "Selesaikan aksi pada formulir untuk melanjutkan."}
          </p>
        )}

        {!targetRect && (
          <p className="mt-3 text-xs text-gray-500">
            Mencari bagian halaman...
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => goToStep(currentStep - 1)}
            className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 disabled:opacity-40"
          >
            Kembali
          </button>

          <div className="flex flex-wrap gap-2">
            {waitingForAction && (
              <button
                type="button"
                disabled={saving}
                onClick={() => goToStep(currentStep + 1)}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                {currentStep === 3 ? "Lewati transfer" : "Lewati langkah"}
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => void finishTour()}
              className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5"
            >
              Lewati tutorial
            </button>

            {!waitingForAction && (
              <button
                type="button"
                onClick={() => goToStep(currentStep + 1)}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
              >
                {currentStep === steps.length - 1
                  ? "Selesai"
                  : "Lanjut"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
