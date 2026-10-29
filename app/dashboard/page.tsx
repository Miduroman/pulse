"use client";

import { useEffect, useMemo, useState } from "react";
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
category: {
id: string;
name: string;
type: string;
};
account: {
id: string;
name: string;
type: string;
};
};

type Budget = {
id: string;
amount: number;
month: number;
year: number;
category: {
id: string;
name: string;
type: string;
};
};

type DashboardData = {
user: {
name: string;
email: string;
};
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
topCategories: {
name: string;
amount: number;
}[];
};
const formatCurrency = (value: number) =>
new Intl.NumberFormat("id-ID", {
style: "currency",
currency: "IDR",
maximumFractionDigits: 0,
}).format(value);

const formatShortCurrency = (value: number) => {
if (value >= 1_000_000) {
return `Rp${(value / 1_000_000).toFixed(1)}M`;
}

if (value >= 1_000) {
return `Rp${Math.round(value / 1_000)}K`;
}

return `Rp${value}`;
};

const formatDate = (date: string) =>
new Intl.DateTimeFormat("en-US", {
month: "short",
day: "numeric",
}).format(new Date(date));

export default function DashboardPage() {
const [data, setData] = useState<DashboardData | null>(null);
const [insight, setInsight] = useState<string>("");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

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

const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);

const [selectedYear, selectedMonthNumber] = selectedMonth.split("-").map(Number);
const selectedMonthLabel = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
}).format(new Date(selectedYear, selectedMonthNumber - 1, 1));

const currentDateLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Jakarta",
}).format(new Date());

useEffect(() => {
  let cancelled = false;

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [year, month] = selectedMonth.split("-").map(Number);
      const response = await fetch(
        `/api/dashboard?month=${month}&year=${year}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }

      const result = await response.json();
      if (!cancelled) setData(result);
    } catch (err) {
      console.error(err);
      if (!cancelled) setError("Unable to load your financial data.");
    } finally {
      if (!cancelled) setLoading(false);
    }

    try {
      const insightResponse = await fetch("/api/insights", {
        cache: "no-store",
      });
      if (insightResponse.ok) {
        const insightResult = await insightResponse.json();
        if (!cancelled) setInsight(insightResult.insights?.[0] ?? "");
      }
    } catch (err) {
      console.error("Unable to load insights", err);
    }
  };

  void loadDashboard();
  return () => {
    cancelled = true;
  };
}, [selectedMonth]);

const chartData = useMemo(() => {
if (!data) return [];


const grouped = new Map<
  string,
  { income: number; expenses: number }
>();

data.periodTransactions.forEach((transaction) => {
  const date = new Date(transaction.date);

  const key = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
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
if (!data || data.income === 0) return 0;


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

const totalBudget = data?.budgets.reduce(
(sum, budget) => sum + budget.amount,
0,
) ?? 0;

const budgetSpent =
  data?.budgets.reduce((sum, budget) => {
    const spent = data.periodTransactions
      .filter(
        (transaction) =>
          transaction.type === "EXPENSE" &&
          transaction.category.id === budget.category.id,
      )
      .reduce(
        (categoryTotal, transaction) => categoryTotal + transaction.amount,
        0,
      );

    return sum + spent;
  }, 0) ?? 0;

const budgetRemaining = totalBudget - budgetSpent;

if (loading) {
return ( <main className="min-h-screen bg-[#08090b] text-white"> <div className="mx-auto max-w-7xl px-6 py-8"> <div className="animate-pulse space-y-8"> <div className="h-10 w-48 rounded-xl bg-white/10" /> <div className="grid gap-4 md:grid-cols-4">
{[1, 2, 3, 4].map((item) => ( <div
               key={item}
               className="h-32 rounded-2xl bg-white/5"
             />
))} </div> <div className="h-96 rounded-2xl bg-white/5" /> </div> </div> </main>
);
}

if (error || !data) {
return ( <main className="flex min-h-screen items-center justify-center bg-[#08090b] px-6 text-white"> <div className="max-w-md text-center"> <div className="mb-4 text-4xl">!</div> <h1 className="text-xl font-semibold">
Something went wrong </h1> <p className="mt-2 text-sm text-white/50">
{error || "No dashboard data available."} </p>
<button
onClick={() => window.location.reload()}
className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
>
Try again </button> </div> </main>
);
}

return ( <main className="min-h-screen bg-[#08090b] text-white"> <nav className="border-b border-white/[0.06] bg-[#08090b]/90 backdrop-blur"> <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"> <div className="flex items-center gap-3"> <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-black">
P </div> <span className="text-lg font-semibold tracking-tight">
Pulse </span> </div>


      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{data?.user.name ?? "User"}</p>
          <p className="text-xs text-white/40">Personal Finance</p>
        </div>
        <LogoutButton />

        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-medium">
          M
        </div>
      </div>
    </div>
  </nav>

  <div className="mx-auto max-w-7xl px-6 py-10">
    <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-sm text-white/40">
          {currentDateLabel}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Good afternoon, {data?.user.name ?? "User"}.
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Here&apos;s what&apos;s happening with your money.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href="/transactions"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <span aria-hidden="true">+</span>
          Tambah Transaksi
        </a>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70">
          <span>Periode</span>
          <input
            aria-label="Pilih bulan dashboard"
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="min-w-0 bg-transparent text-white outline-none [color-scheme:dark]"
          />
        </label>
      </div>
    </header>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-sm text-white/45">Total balance</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">
          {formatCurrency(data.totalBalance)}
        </p>
        <p className="mt-2 text-xs text-emerald-400">
          Across {data.accounts.length} accounts
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-sm text-white/45">Income</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">
          {formatCurrency(data.income)}
        </p>
        <p className="mt-2 text-xs text-white/35">
          This month
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-sm text-white/45">Spending</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">
          {formatCurrency(data.expenses)}
        </p>
        <p className="mt-2 text-xs text-amber-400">
          {data.income
            ? `${((data.expenses / data.income) * 100).toFixed(1)}% of income`
            : "0% of income"}
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-sm text-white/45">Savings</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">
          {formatCurrency(data.savings)}
        </p>
        <p className="mt-2 text-xs text-emerald-400">
          {savingsRate.toFixed(1)}% savings rate
        </p>
      </div>
    </section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-medium">Cash flow</h2>
            <p className="mt-1 text-xs text-white/40">
              Income vs spending
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-white/40">Net savings</p>
            <p className="mt-1 text-sm font-medium text-emerald-400">
              {formatShortCurrency(data.savings)}
            </p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="incomeGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopOpacity={0.25} />
                  <stop offset="100%" stopOpacity={0} />
                </linearGradient>

                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopOpacity={0.18} />
                  <stop offset="100%" stopOpacity={0} />
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
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                tickFormatter={(value) =>
                  value >= 1_000_000
                    ? `Rp${value / 1_000_000}M`
                    : `Rp${value / 1_000}K`
                }
              />

              <Tooltip
                contentStyle={{
                  background: "#111216",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "white",
                }}
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === "income" ? "Income" : "Spending",
                ]}
              />

              <Area
                type="monotone"
                dataKey="income"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={2}
                fill="url(#incomeGradient)"
              />

              <Area
                type="monotone"
                dataKey="expenses"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={2}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-medium">Financial health</h2>
            <p className="mt-1 text-xs text-white/40">
              Based on your current activity
            </p>
          </div>

          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">
            AI score
          </span>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[10px] border-white/10">
            <div
              className="absolute inset-[-10px] rounded-full border-[10px] border-transparent"
              style={{
                borderTopColor: "rgba(255,255,255,0.9)",
                borderRightColor:
                  healthScore >= 50
                    ? "rgba(255,255,255,0.9)"
                    : "transparent",
                borderBottomColor:
                  healthScore >= 75
                    ? "rgba(255,255,255,0.9)"
                    : "transparent",
                transform: "rotate(25deg)",
              }}
            />

            <div className="text-center">
              <p className="text-4xl font-semibold">{healthScore}</p>
              <p className="mt-1 text-xs text-white/40">out of 100</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <div className="flex justify-between text-xs">
              <span className="text-white/45">Savings rate</span>
              <span>{savingsRate.toFixed(1)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: `${Math.min(savingsRate, 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs">
              <span className="text-white/45">Budget utilization</span>
              <span>
                {totalBudget
                  ? `${Math.min(
                      (budgetSpent / totalBudget) * 100,
                      100,
                    ).toFixed(0)}%`
                  : "0%"}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/60"
                style={{
                  width: `${
                    totalBudget
                      ? Math.min(
                          (budgetSpent / totalBudget) * 100,
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Spending by category</h2>
            <p className="mt-1 text-xs text-white/40">
              Where your money is going
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {data.topCategories.map((category) => {
            const percentage =
              data.expenses > 0
                ? (category.amount / data.expenses) * 100
                : 0;

            return (
              <div key={category.name}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-white/70">
                    {category.name}
                  </span>
                  <span className="text-sm">
                    {formatCurrency(category.amount)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-white/70 transition-all"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                    }}
                  />
                </div>

                <p className="mt-1.5 text-[11px] text-white/30">
                  {percentage.toFixed(1)}% of spending
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Budget overview</h2>
            <p className="mt-1 text-xs text-white/40">
              {selectedMonthLabel}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-white/40">Remaining</p>
            <p
              className={`mt-1 text-sm font-medium ${
                budgetRemaining >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {formatCurrency(budgetRemaining)}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {data.budgets.map((budget) => {
            const spent = data.periodTransactions
              .filter(
                (transaction) =>
                  transaction.type === "EXPENSE" &&
                  transaction.category.id === budget.category.id,
              )
              .reduce(
                (categoryTotal, transaction) => categoryTotal + transaction.amount,
                0,
              );

            const percentage =
              budget.amount > 0
                ? (spent / budget.amount) * 100
                : 0;

            return (
              <div key={budget.id}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-white/70">
                    {budget.category.name}
                  </span>

                  <span className="text-xs text-white/40">
                    {formatCurrency(spent)} /{" "}
                    {formatCurrency(budget.amount)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentage > 100
                        ? "bg-red-400"
                        : percentage > 80
                          ? "bg-amber-400"
                          : "bg-white/70"
                    }`}
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                    }}
                  />
                </div>

                <p className="mt-1.5 text-[11px] text-white/30">
                  {percentage.toFixed(0)}% used
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Recent transactions</h2>
          <p className="mt-1 text-xs text-white/40">
            Your latest financial activity
          </p>
        </div>

        <span className="text-xs text-white/30">
          {data.transactions.length} transactions
        </span>
      </div>

      <div className="mt-5 divide-y divide-white/[0.06]">
        {data.transactions.slice(0, 6).map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-medium">
                {transaction.category.name
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div>
                <p className="text-sm font-medium">
                  {transaction.description}
                </p>
                <p className="mt-1 text-xs text-white/35">
                  {transaction.category.name} ·{" "}
                  {transaction.account.name} ·{" "}
                  {formatDate(transaction.date)}
                </p>
              </div>
            </div>

            <p
              className={`text-sm font-medium ${
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
    </section>

    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-black">
          ✦
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            Pulse insight
          </p>

          <h3 className="mt-2 text-lg font-medium">
            {insight || "Analyzing your spending patterns..."}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            You&apos;ve spent {formatCurrency(data.expenses)} from{" "}
            {formatCurrency(data.income)} of income this month.
            Your current savings rate is{" "}
            {savingsRate.toFixed(1)}%, giving you a strong
            financial buffer.
          </p>
        </div>
      </div>
    </section>

    <footer className="py-10 text-center text-xs text-white/20">
      Pulse · Personal financial intelligence
    </footer>
  </div>
</main>


);
}








