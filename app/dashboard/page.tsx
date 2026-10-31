
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutButton from "../components/logout-button";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  category: { id: string; name: string; type: string };
  account: { id: string; name: string; type: string };
};

type Budget = {
  id: string;
  amount: number;
  month: number;
  year: number;
  category: { id: string; name: string; type: string };
};

type DashboardData = {
  user: { name: string; email: string };
  period: {
    month: number;
    year: number;
    start: string;
    end: string;
  };
  periodTransactions: Transaction[];
  totalBalance: number;
  income: number;
  expenses: number;
  savings: number;
  accounts: {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
  }[];
  transactions: Transaction[];
  budgets: Budget[];
  categories: { id: string; name: string; type: string }[];
  topCategories: { name: string; amount: number }[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatShortCurrency = (value: number) => {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rp${Math.round(value / 1_000)}K`;
  return `Rp${value}`;
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));

const getCurrentMonth = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";

  return `${year}-${month}`;
};

const accountTypeLabel = (type: string) => {
  switch (type) {
    case "BANK":
      return "Bank account";
    case "E_WALLET":
      return "E-Wallet";
    case "CREDIT_CARD":
      return "Credit card";
    default:
      return "Cash";
  }
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insight, setInsight] = useState("");

  // Pulse AI states
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Budget states
  const [budgetCategoryId, setBudgetCategoryId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState("");
  const [budgetError, setBudgetError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);

  const [selectedYear, selectedMonthNumber] = selectedMonth
    .split("-")
    .map(Number);

  const selectedMonthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(selectedYear, selectedMonthNumber - 1, 1));

  const currentDateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  // Load dashboard, insights, and saved AI analysis
  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      setAiLoading(true);
      setAiError("");
      setAiAnalysis("");

      try {
        const dashboardResponse = await fetch(
          `/api/dashboard?month=${selectedMonthNumber}&year=${selectedYear}`,
          { cache: "no-store" },
        );

        if (!dashboardResponse.ok) {
          throw new Error("Failed to load dashboard.");
        }

        const dashboardResult: DashboardData =
          await dashboardResponse.json();

        if (!cancelled) setData(dashboardResult);
      } catch (err) {
        console.error("Dashboard error:", err);

        if (!cancelled) {
          setError("Unable to load your financial data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      try {
        const insightResponse = await fetch(
          `/api/insights?month=${selectedMonthNumber}&year=${selectedYear}`,
          { cache: "no-store" },
        );

        if (insightResponse.ok) {
          const insightResult = await insightResponse.json();

          if (!cancelled) {
            setInsight(insightResult.insights?.[0] ?? "");
          }
        }
      } catch (err) {
        console.error("Unable to load insights:", err);
      }

      // Load saved AI analysis only. This does not call Gemini.
      try {
        const aiResponse = await fetch(
          `/api/ai-insights?month=${selectedMonthNumber}&year=${selectedYear}`,
          { cache: "no-store" },
        );

        const aiResult = await aiResponse.json();

        if (!aiResponse.ok) {
          throw new Error(
            aiResult.error ?? "Failed to load saved AI analysis.",
          );
        }

        if (!cancelled) {
          setAiAnalysis(aiResult.analysis ?? "");
          setAiError("");
        }
      } catch (err) {
        console.error("Saved AI analysis error:", err);

        if (!cancelled) {
          setAiError(
            err instanceof Error
              ? err.message
              : "Unable to load saved AI analysis.",
          );
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [selectedMonthNumber, selectedYear]);

  // Generate a new AI analysis only when the user clicks the button
const generateAiAnalysis = useCallback(async () => {
  setAiLoading(true);
  setAiError("");

  try {
    const response = await fetch(
      `/api/ai-insights?month=${selectedMonthNumber}&year=${selectedYear}`,
      {
        method: "POST",
        cache: "no-store",
      },
    );

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(
          "Kuota Gemini AI gratis sudah mencapai batas harian. Analisis baru belum bisa dibuat. Silakan coba kembali setelah kuota tersedia."
        );
      }

      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.detail || "Gagal membuat analisis AI.";

      throw new Error(errorMessage);
    }

    setAiAnalysis(result.analysis ?? "");
  } catch (err) {
    console.error("Generate AI analysis error:", err);

    setAiError(
      err instanceof Error
        ? err.message
        : "Tidak dapat membuat analisis AI."
    );
  } finally {
    setAiLoading(false);
  }
}, [selectedMonthNumber, selectedYear]);


  const refreshDashboard = useCallback(async () => {
    const response = await fetch(
      `/api/dashboard?month=${selectedMonthNumber}&year=${selectedYear}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error("Failed to refresh dashboard.");
    }

    const result: DashboardData = await response.json();
    setData(result);
  }, [selectedMonthNumber, selectedYear]);

  const chartData = useMemo(() => {
    if (!data) return [];

    const grouped = new Map<
      string,
      { income: number; expenses: number }
    >();

    data.periodTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);

      const key = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Jakarta",
      }).format(date);

      const current = grouped.get(key) ?? {
        income: 0,
        expenses: 0,
      };

      if (transaction.type === "INCOME") {
        current.income += transaction.amount;
      } else {
        current.expenses += transaction.amount;
      }

      grouped.set(key, current);
    });

    return Array.from(grouped.entries())
      .reverse()
      .map(([date, values]) => ({
        date,
        income: values.income,
        expenses: values.expenses,
      }));
  }, [data]);

  const healthScore = useMemo(() => {
    if (!data) return null;
    if (data.income === 0) return data.expenses > 0 ? 0 : null;

    const savingsRate = data.savings / data.income;
    const expenseRate = data.expenses / data.income;

    let score = 50;

    if (savingsRate >= 0.4) score += 30;
    else if (savingsRate >= 0.25) score += 20;
    else if (savingsRate >= 0.1) score += 10;

    if (expenseRate <= 0.3) score += 20;
    else if (expenseRate <= 0.5) score += 10;
    else if (expenseRate > 0.8) score -= 15;

    return Math.max(0, Math.min(100, score));
  }, [data]);

  const savingsRate = data?.income
    ? (data.savings / data.income) * 100
    : 0;

  const totalBudget =
    data?.budgets.reduce((sum, budget) => sum + budget.amount, 0) ?? 0;

  const budgetSpent =
    data?.budgets.reduce((sum, budget) => {
      const spent = data.periodTransactions
        .filter(
          (transaction) =>
            transaction.type === "EXPENSE" &&
            transaction.category.id === budget.category.id,
        )
        .reduce(
          (categoryTotal, transaction) =>
            categoryTotal + transaction.amount,
          0,
        );

      return sum + spent;
    }, 0) ?? 0;

  const budgetRemaining = totalBudget - budgetSpent;

  const budgetUtilization =
    totalBudget > 0 ? (budgetSpent / totalBudget) * 100 : 0;

  const budgetProgress = Math.max(
    0,
    Math.min(budgetUtilization, 100),
  );

  const expenseCategories =
    data?.categories.filter((category) => category.type === "EXPENSE") ??
    [];

  const handleBudgetSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setBudgetMessage("");
    setBudgetError("");

    if (
      !budgetCategoryId ||
      !budgetAmount ||
      Number(budgetAmount) <= 0
    ) {
      setBudgetError("Pilih kategori dan masukkan nominal yang valid.");
      return;
    }

    setBudgetSaving(true);

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: budgetCategoryId,
          amount: Number(budgetAmount),
          month: selectedMonthNumber,
          year: selectedYear,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menyimpan anggaran.");
      }

      await refreshDashboard();

      setBudgetAmount("");
      setBudgetMessage(result.message ?? "Anggaran berhasil disimpan.");
    } catch (err) {
      setBudgetError(
        err instanceof Error ? err.message : "Terjadi kesalahan.",
      );
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleBudgetDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus anggaran ini?")) return;

    setBudgetMessage("");
    setBudgetError("");

    try {
      const response = await fetch(
        `/api/budgets?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menghapus anggaran.");
      }

      await refreshDashboard();

      setBudgetMessage(result.message ?? "Anggaran berhasil dihapus.");
    } catch (err) {
      setBudgetError(
        err instanceof Error ? err.message : "Terjadi kesalahan.",
      );
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08090b] px-5 py-8 text-white">
        <div className="mx-auto max-w-7xl animate-pulse space-y-8">
          <div className="h-14 rounded-2xl bg-white/[0.05]" />
          <div className="h-32 rounded-2xl bg-white/[0.05]" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 rounded-2xl bg-white/[0.05]"
              />
            ))}
          </div>
          <div className="h-80 rounded-2xl bg-white/[0.05]" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090b] px-6 text-white">
        <div className="max-w-md text-center">
          <div className="mb-4 text-4xl">!</div>
          <h1 className="text-xl font-semibold">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {error || "No dashboard data available."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      {/* Top navigation */}
      <nav className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base font-black text-black">
              P
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">
                Pulse
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                Personal Finance
              </p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {data.user.name || "User"}
              </p>
              <p className="text-xs text-white/40">
                {data.user.email}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-sm font-semibold">
              {(data.user.name || "U").charAt(0).toUpperCase()}
            </div>

            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Navigation */}
        <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.025] p-1"
          >
            <a
              href="/dashboard"
              aria-current="page"
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black"
            >
              Dashboard
            </a>
            <a
              href="/transactions"
              className="rounded-lg px-4 py-2.5 text-sm text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            >
              Manage Transactions
            </a>
            <a
              href="/transfers"
              className="rounded-lg px-4 py-2.5 text-sm text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            >
              Transfers
            </a>
          </nav>
        </div>

        {/* Heading */}
        <header className="mb-9 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-sm text-white/40">
              {currentDateLabel}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Good afternoon, {data.user.name || "User"}.
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Here's what's happening with your money.
            </p>
          </div>

          <label className="flex w-full items-center justify-between gap-5 rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-3 sm:w-auto">
            <span className="text-xs font-medium uppercase tracking-wider text-white/40">
              Period
            </span>
            <input
              aria-label="Pilih bulan dashboard"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="min-w-0 bg-transparent text-sm font-medium text-white outline-none [color-scheme:dark]"
            />
          </label>
        </header>

        {/* Financial overview */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total balance",
              value: data.totalBalance,
              note: `Across ${data.accounts.length} accounts`,
              icon: "◈",
              color: "text-white",
            },
            {
              label: "Income",
              value: data.income,
              note: "This period",
              icon: "↗",
              color: "text-emerald-400",
            },
            {
              label: "Spending",
              value: data.expenses,
              note: data.income
                ? `${((data.expenses / data.income) * 100).toFixed(1)}% of income`
                : "0% of income",
              icon: "↘",
              color: "text-amber-400",
            },
            {
              label: "Savings",
              value: data.savings,
              note: `${savingsRate.toFixed(1)}% savings rate`,
              icon: "✧",
              color: "text-sky-400",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 transition hover:border-white/[0.16]"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/45">{item.label}</p>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] text-sm ${item.color}`}
                >
                  {item.icon}
                </span>
              </div>
              <p className="mt-5 text-2xl font-semibold tracking-tight sm:text-[27px]">
                {formatCurrency(item.value)}
              </p>
              <p className="mt-2 text-xs text-white/35">{item.note}</p>
            </div>
          ))}
        </section>

        {/* Accounts */}
        <section className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Your accounts</h2>
              <p className="mt-1 text-xs text-white/40">
                Your connected financial accounts
              </p>
            </div>
            <a
              href="/accounts"
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white"
            >
              Manage accounts ↗
            </a>
          </div>

          {data.accounts.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-white/[0.17]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-sm">
                        {account.type === "BANK"
                          ? "▤"
                          : account.type === "E_WALLET"
                            ? "◉"
                            : account.type === "CREDIT_CARD"
                              ? "▣"
                              : "◇"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {account.name}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          {accountTypeLabel(account.type)}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] text-white/45">
                      {account.currency}
                    </span>
                  </div>
                  <p className="mt-5 text-lg font-semibold tracking-tight">
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
              No accounts yet. Add your first account to get started.
            </p>
          )}
        </section>

        {/* Cash flow and financial health */}
        <section className="mt-7 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Cash flow</h2>
                <p className="mt-1 text-xs text-white/40">
                  Income vs spending over time
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40">Net savings</p>
                <p className="mt-1 text-sm font-semibold text-emerald-400">
                  {formatShortCurrency(data.savings)}
                </p>
              </div>
            </div>

            <div className="h-[280px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 5, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="incomeGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#34d399"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="#34d399"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="expenseGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#a1a1aa"
                          stopOpacity={0.18}
                        />
                        <stop
                          offset="100%"
                          stopColor="#a1a1aa"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.06)"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                      tickMargin={12}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                      tickFormatter={(value) =>
                        value >= 1_000_000
                          ? `Rp${value / 1_000_000}M`
                          : `Rp${value / 1_000}K`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#15161a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        color: "white",
                        fontSize: 12,
                      }}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === "income" ? "Income" : "Spending",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="income"
                      stroke="#34d399"
                      strokeWidth={2}
                      fill="url(#incomeGradient)"
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="expenses"
                      stroke="#a1a1aa"
                      strokeWidth={2}
                      fill="url(#expenseGradient)"
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/[0.08] text-sm text-white/35">
                  No cash flow data for this period.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-5 border-t border-white/[0.07] pt-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Income
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="h-2 w-2 rounded-full bg-zinc-400" />
                Spending
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Financial health</h2>
                <p className="mt-1 text-xs text-white/40">
                  Based on your current activity
                </p>
              </div>
              <span className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/40">
                Rule-based
              </span>
            </div>

            <div className="mt-8 flex justify-center">
              <div
                className="relative flex h-40 w-40 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#34d399 ${(healthScore ?? 0) * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                }}
              >
                <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-[#101114]">
                  <p className="text-4xl font-semibold tracking-tight">
                    {healthScore ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-white/40">out of 100</p>
                </div>
              </div>
            </div>

            <div className="mt-9 space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-white/45">Savings rate</span>
                  <span className="font-medium">
                    {savingsRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(savingsRate, 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-white/45">Budget utilization</span>
                  <span className="font-medium">
                    {budgetUtilization.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-white/70 transition-all"
                    style={{ width: `${budgetProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories and budgets */}
        <section className="mt-7 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-7">
              <h2 className="font-semibold">Spending by category</h2>
              <p className="mt-1 text-xs text-white/40">
                Where your money is going
              </p>
            </div>

            {data.topCategories.length > 0 ? (
              <div className="space-y-6">
                {data.topCategories.map((category) => {
                  const percentage =
                    data.expenses > 0
                      ? (category.amount / data.expenses) * 100
                      : 0;

                  return (
                    <div key={category.name}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm text-white/75">
                          {category.name}
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(category.amount)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-white/75 transition-all"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-white/35">
                        {percentage.toFixed(1)}% of total spending
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-white/35">
                No spending data for this period.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Budget overview</h2>
                <p className="mt-1 text-xs text-white/40">
                  {selectedMonthLabel}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40">Remaining</p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    budgetRemaining >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {formatCurrency(budgetRemaining)}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleBudgetSubmit}
              className="mt-6 grid gap-3 sm:grid-cols-2"
            >
              <select
                value={budgetCategoryId}
                onChange={(event) =>
                  setBudgetCategoryId(event.target.value)
                }
                required
                className="min-w-0 rounded-xl border border-white/10 bg-[#111318] px-3 py-3 text-sm text-white outline-none transition focus:border-white/30"
              >
                <option value="">Choose expense category</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={budgetAmount}
                onChange={(event) => setBudgetAmount(event.target.value)}
                placeholder="Budget amount (Rp)"
                required
                className="min-w-0 rounded-xl border border-white/10 bg-[#111318] px-3 py-3 text-sm text-white outline-none transition focus:border-white/30"
              />

              <button
                type="submit"
                disabled={budgetSaving || expenseCategories.length === 0}
                className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
              >
                {budgetSaving ? "Saving..." : "+ Set budget"}
              </button>
            </form>

            {budgetMessage && (
              <p className="mt-3 text-sm text-emerald-400">
                {budgetMessage}
              </p>
            )}
            {budgetError && (
              <p className="mt-3 text-sm text-red-400">
                {budgetError}
              </p>
            )}
            {expenseCategories.length === 0 && (
              <p className="mt-3 text-sm text-white/40">
                No expense categories available.
              </p>
            )}

            {data.budgets.length === 0 ? (
              <p className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/40">
                No budgets for this period yet.
              </p>
            ) : (
              <div className="mt-7 space-y-6">
                {data.budgets.map((budget) => {
                  const spent = data.periodTransactions
                    .filter(
                      (transaction) =>
                        transaction.type === "EXPENSE" &&
                        transaction.category.id === budget.category.id,
                    )
                    .reduce(
                      (categoryTotal, transaction) =>
                        categoryTotal + transaction.amount,
                      0,
                    );

                  const percentage =
                    budget.amount > 0
                      ? (spent / budget.amount) * 100
                      : 0;

                  return (
                    <div key={budget.id}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {budget.category.name}
                          </p>
                          <p className="mt-1 text-[11px] text-white/35">
                            {formatCurrency(spent)} of{" "}
                            {formatCurrency(budget.amount)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/50">
                            {percentage.toFixed(0)}%
                          </span>
                          <button
                            type="button"
                            onClick={() => handleBudgetDelete(budget.id)}
                            aria-label={`Delete ${budget.category.name} budget`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-red-400/10 hover:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percentage > 100
                              ? "bg-red-400"
                              : percentage > 80
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                          }`}
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        />
                      </div>

                      {percentage > 100 && (
                        <p className="mt-2 text-[11px] text-red-400">
                          Budget exceeded by{" "}
                          {formatCurrency(spent - budget.amount)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Recent transactions */}
        <section className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Recent transactions</h2>
              <p className="mt-1 text-xs text-white/40">
                Your latest financial activity
              </p>
            </div>
            <a
              href="/transactions"
              className="text-xs font-medium text-white/55 transition hover:text-white"
            >
              View all transactions →
            </a>
          </div>

          {data.transactions.length > 0 ? (
            <div className="divide-y divide-white/[0.06]">
              {data.transactions.slice(0, 6).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs font-semibold text-white/70">
                      {transaction.category.name
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {transaction.description}
                      </p>
                      <p className="mt-1 truncate text-xs text-white/35">
                        {transaction.category.name} ·{" "}
                        {transaction.account.name} ·{" "}
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      transaction.type === "INCOME"
                        ? "text-emerald-400"
                        : "text-white/80"
                    }`}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
              No transactions recorded yet.
            </p>
          )}
        </section>

        {/* Pulse AI */}
        <section className="mt-7 overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.10] via-white/[0.025] to-white/[0.015] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-xl text-violet-300">
              ✦
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                  Pulse AI
                </p>
                <span className="rounded-full border border-violet-300/20 bg-violet-400/[0.08] px-2.5 py-1 text-[10px] font-medium text-violet-200">
                  Gemini AI
                </span>
                {aiAnalysis && (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                    Saved analysis
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Your financial analysis
              </h2>
              <p className="mt-1 text-xs text-white/40">
                AI-powered insights for {selectedMonthLabel}
              </p>

              <div className="mt-6">
                {aiLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
                    <p className="pt-2 text-xs text-white/40">
                      Please wait...
                    </p>
                  </div>
                ) : aiError ? (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4">
                    <p className="text-sm text-red-300">{aiError}</p>
                  </div>
                ) : aiAnalysis ? (
                  <div className="whitespace-pre-wrap text-sm leading-7 text-white/75">
                    {aiAnalysis}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-violet-300/20 bg-violet-400/[0.035] p-5">
                    <p className="text-sm leading-6 text-white/65">
                      Belum ada analisis AI untuk {selectedMonthLabel}.
                      Tekan tombol di bawah untuk meminta Gemini menganalisis
                      ringkasan keuanganmu.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={generateAiAnalysis}
                  disabled={aiLoading}
                  className="rounded-xl bg-violet-400 px-5 py-3 text-sm font-semibold text-[#100b1b] transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aiLoading
                    ? "Generating..."
                    : aiAnalysis
                      ? "✦ Regenerate Analysis"
                      : "✦ Generate Analysis"}
                </button>

                {aiAnalysis && !aiLoading && (
                  <p className="text-xs text-white/35">
                    Analisis tersimpan otomatis.
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-white/[0.08] pt-4">
                <p className="text-[11px] leading-5 text-white/35">
                  AI-generated suggestions are for informational purposes
                  only. Review your financial decisions carefully.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/[0.06] py-7 text-center">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} Pulse · Personal financial intelligence
          </p>
        </footer>
      </div>
    </main>
  );
}
