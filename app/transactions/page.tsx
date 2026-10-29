"use client";

import { useEffect, useState } from "react";

type Account = {
id: string;
name: string;
type: string;
balance: number;
};

type Category = {
id: string;
name: string;
type: string;
};

type Transaction = {
id: string;
description: string;
amount: number;
type: "INCOME" | "EXPENSE";
date: string;
category: {
id: string;
name: string;
};
account: {
id: string;
name: string;
};
};

const formatCurrency = (value: number) =>
new Intl.NumberFormat("id-ID", {
style: "currency",
currency: "IDR",
maximumFractionDigits: 0,
}).format(value);

const formatDate = (date: string) =>
new Intl.DateTimeFormat("id-ID", {
day: "numeric",
month: "short",
year: "numeric",
}).format(new Date(date));

export default function TransactionsPage() {
const [accounts, setAccounts] = useState<Account[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [transactions, setTransactions] = useState<Transaction[]>([]);

const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
const [description, setDescription] = useState("");
const [amount, setAmount] = useState("");
const [categoryId, setCategoryId] = useState("");
const [accountId, setAccountId] = useState("");
const [date, setDate] = useState("2026-09-08");

const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

const loadData = async () => {
try {
setLoading(true);


  const response = await fetch("/api/dashboard", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load transaction data");
  }

  const data = await response.json();

  setAccounts(data.accounts ?? []);
  setTransactions(data.transactions ?? []);
  setCategories(data.categories ?? []);

  const uniqueCategories: Category[] = [];

  data.transactions.forEach((transaction: Transaction) => {
    if (
      !uniqueCategories.some(
        (category) => category.id === transaction.category.id,
      )
    ) {
      uniqueCategories.push({
        id: transaction.category.id,
        name: transaction.category.name,
        type:
          transaction.type === "INCOME"
            ? "INCOME"
            : "EXPENSE",
      });
    }
  });

  setCategories(uniqueCategories);

  if (data.accounts.length > 0) {
    setAccountId(data.accounts[0].id);
  }

  const firstMatchingCategory = uniqueCategories.find(
    (category) =>
      category.type ===
      (type === "INCOME" ? "INCOME" : "EXPENSE"),
  );

  if (firstMatchingCategory) {
    setCategoryId(firstMatchingCategory.id);
  }
} catch (err) {
  console.error(err);
  setError("Unable to load transaction data.");
} finally {
  setLoading(false);
}


};

useEffect(() => {
loadData();
}, []);

useEffect(() => {
const matchingCategory = categories.find(
(category) =>
category.type ===
(type === "INCOME" ? "INCOME" : "EXPENSE"),
);


if (matchingCategory) {
  setCategoryId(matchingCategory.id);
}


}, [type, categories]);

const expenseCategories = categories.filter(
(category) => category.type === "EXPENSE",
);

const incomeCategories = categories.filter(
(category) => category.type === "INCOME",
);

const visibleCategories =
type === "INCOME" ? incomeCategories : expenseCategories;

const handleSubmit = async (event: React.FormEvent) => {
event.preventDefault();


setMessage("");
setError("");

if (!description.trim()) {
  setError("Please enter a description.");
  return;
}

if (!amount || Number(amount) <= 0) {
  setError("Please enter a valid amount.");
  return;
}

if (!accountId || !categoryId) {
  setError("Please select an account and category.");
  return;
}

try {
  setSaving(true);

  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description,
      amount: Number(amount),
      type,
      date,
      accountId,
      categoryId,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "Failed to create transaction",
    );
  }

  setMessage("Transaction added successfully.");
  setDescription("");
  setAmount("");

  await loadData();
} catch (err) {
  console.error(err);
  setError(
    err instanceof Error
      ? err.message
      : "Failed to create transaction.",
  );
} finally {
  setSaving(false);
}


};

return ( <main className="min-h-screen bg-[#08090b] text-white"> <nav className="border-b border-white/[0.06] bg-[#08090b]/90 backdrop-blur"> <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"> <a
         href="/dashboard"
         className="flex items-center gap-3"
       > <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-black">
P </div> <span className="text-lg font-semibold tracking-tight">
Pulse </span> </a>


      <a
        href="/dashboard"
        className="text-sm text-white/50 transition hover:text-white"
      >
        Back to dashboard
      </a>
    </div>
  </nav>

  <div className="mx-auto max-w-7xl px-6 py-10">
    <header className="mb-8">
      <p className="mb-2 text-sm text-white/40">
        Personal finance
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Transactions
      </h1>
      <p className="mt-2 text-sm text-white/45">
        Add and review your financial activity.
      </p>
    </header>

    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <section className="h-fit rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="mb-6">
          <h2 className="font-medium">Add transaction</h2>
          <p className="mt-1 text-xs text-white/40">
            Record income or spending.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`rounded-lg px-4 py-2.5 text-sm transition ${
              type === "EXPENSE"
                ? "bg-white text-black"
                : "text-white/45 hover:text-white"
            }`}
          >
            Expense
          </button>

          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`rounded-lg px-4 py-2.5 text-sm transition ${
              type === "INCOME"
                ? "bg-white text-black"
                : "text-white/45 hover:text-white"
            }`}
          >
            Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs text-white/45">
              Description
            </label>
            <input
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder={
                type === "EXPENSE"
                  ? "e.g. Lunch"
                  : "e.g. Freelance payment"
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-white/25"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-white/45">
              Amount
            </label>
            <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
              <span className="flex items-center border-r border-white/10 px-4 text-sm text-white/35">
                Rp
              </span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="0"
                className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-white/45">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(event) =>
                setCategoryId(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#111216] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">Select category</option>

              {visibleCategories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs text-white/45">
              Account
            </label>
            <select
              value={accountId}
              onChange={(event) =>
                setAccountId(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#111216] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">Select account</option>

              {accounts.map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs text-white/45">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || loading}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add transaction"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Transaction history</h2>
            <p className="mt-1 text-xs text-white/40">
              Your latest financial activity.
            </p>
          </div>

          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40">
            {transactions.length} records
          </span>
        </div>

        {loading ? (
          <div className="mt-8 space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-white/[0.04]"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-sm text-white/40">
              No transactions yet.
            </p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-white/[0.06]">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-medium">
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
                  className={`shrink-0 text-sm font-medium ${
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
        )}
      </section>
    </div>
  </div>
</main>


);
}

