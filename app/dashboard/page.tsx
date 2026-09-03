"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const spendingData = [
  { day: "Mon", amount: 320000 },
  { day: "Tue", amount: 450000 },
  { day: "Wed", amount: 280000 },
  { day: "Thu", amount: 610000 },
  { day: "Fri", amount: 520000 },
  { day: "Sat", amount: 780000 },
  { day: "Sun", amount: 430000 },
];

const transactions = [
  {
    name: "Salary",
    category: "Income",
    amount: "+ Rp12.000.000",
    type: "income",
  },
  {
    name: "Starbucks",
    category: "Food",
    amount: "- Rp68.000",
    type: "expense",
  },
  {
    name: "Grab",
    category: "Transport",
    amount: "- Rp32.000",
    type: "expense",
  },
  {
    name: "Netflix",
    category: "Entertainment",
    amount: "- Rp186.000",
    type: "expense",
  },
];

const categories = [
  {
    name: "Food",
    amount: "Rp1.240.000",
    percentage: 72,
  },
  {
    name: "Transport",
    amount: "Rp680.000",
    percentage: 48,
  },
  {
    name: "Shopping",
    amount: "Rp520.000",
    percentage: 36,
  },
  {
    name: "Entertainment",
    amount: "Rp380.000",
    percentage: 28,
  },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-zinc-950">
              P
            </div>

            <span className="text-lg font-semibold">
              Pulse
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-400">
              September 2026
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm">
              M
            </div>
          </div>
        </nav>

        <section className="mt-14">
          <p className="text-sm text-zinc-500">
            Thursday, September 3
          </p>

          <h1 className="mt-2 text-4xl font-semibold">
            Good afternoon.
          </h1>

          <p className="mt-2 text-zinc-500">
            Here&apos;s your financial overview.
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-500">
              Total balance
            </p>

            <p className="mt-4 text-3xl font-semibold">
              Rp8.42M
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              +12.4%
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-500">
              Spent this month
            </p>

            <p className="mt-4 text-3xl font-semibold">
              Rp4.82M
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              -8.2%
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-500">
              Savings
            </p>

            <p className="mt-4 text-3xl font-semibold">
              Rp2.35M
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              +18.1%
            </p>
          </div>

        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">
                  Spending overview
                </p>

                <h2 className="mt-1 text-xl font-medium">
                  Rp4.82M
                </h2>
              </div>

              <span className="text-sm text-zinc-500">
                Last 7 days
              </span>
            </div>

            <div className="mt-8 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#27272a"
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="amount"
                    fill="#a1a1aa"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

            <p className="text-sm text-zinc-500">
              Financial health
            </p>

            <div className="mt-8 flex justify-center">
              <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-[12px] border-zinc-700">
                <span className="text-4xl font-semibold">
                  82
                </span>

                <span className="text-xs text-zinc-500">
                  out of 100
                </span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="font-medium">
                Looking good
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Your spending and savings habits are healthier
                than your recent average.
              </p>
            </div>

          </div>

        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

            <p className="text-sm text-zinc-500">
              Top categories
            </p>

            <h2 className="mt-1 text-xl font-medium">
              Where your money goes
            </h2>

            <div className="mt-6 space-y-5">

              {categories.map((category) => (
                <div key={category.name}>

                  <div className="flex justify-between text-sm">
                    <span>
                      {category.name}
                    </span>

                    <span className="text-zinc-500">
                      {category.amount}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-zinc-400"
                      style={{
                        width: category.percentage + "%",
                      }}
                    />
                  </div>

                </div>
              ))}

            </div>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

            <p className="text-sm text-zinc-500">
              Activity
            </p>

            <h2 className="mt-1 text-xl font-medium">
              Recent transactions
            </h2>

            <div className="mt-6 divide-y divide-zinc-800">

              {transactions.map((transaction) => (
                <div
                  key={transaction.name}
                  className="flex items-center justify-between py-4"
                >

                  <div>
                    <p className="text-sm font-medium">
                      {transaction.name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      {transaction.category}
                    </p>
                  </div>

                  <span
                    className={
                      transaction.type === "income"
                        ? "text-sm text-white"
                        : "text-sm text-zinc-400"
                    }
                  >
                    {transaction.amount}
                  </span>

                </div>
              ))}

            </div>

          </div>

        </section>

        <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-sm">
              AI
            </div>

            <div>

              <p className="text-sm text-zinc-500">
                Pulse insight
              </p>

              <h2 className="mt-2 text-lg font-medium">
                Your food spending is trending higher.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                You&apos;ve spent 18% more on food compared
                with your recent monthly average. At your
                current pace, you may exceed your food budget
                by approximately Rp240.000.
              </p>

              <button className="mt-4 text-sm font-medium underline underline-offset-4">
                View spending analysis
              </button>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

