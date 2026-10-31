
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  createdAt?: string;
};

const ACCOUNT_TYPES = [
  { value: "CASH", label: "Cash", description: "Physical cash" },
  { value: "BANK", label: "Bank", description: "Bank account" },
  { value: "E_WALLET", label: "E-Wallet", description: "Digital wallet" },
  {
    value: "CREDIT_CARD",
    label: "Credit Card",
    description: "Credit card account",
  },
];

const formatCurrency = (value: number, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const getAccountIcon = (type: string) => {
  switch (type) {
    case "BANK":
      return "▤";
    case "E_WALLET":
      return "◉";
    case "CREDIT_CARD":
      return "▣";
    default:
      return "◇";
  }
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");
  const [currency, setCurrency] = useState("IDR");
  const [balance, setBalance] = useState("");

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/accounts", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load accounts.");
      }

      setAccounts(result.accounts ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load accounts.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const resetForm = () => {
    setName("");
    setType("BANK");
    setCurrency("IDR");
    setBalance("");
    setEditingId(null);
    setError("");
    setMessage("");
  };

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setName(account.name);
    setType(account.type);
    setCurrency(account.currency);
    setBalance("");
    setMessage("");
    setError("");

    document
      .getElementById("account-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Account name is required.");
      return;
    }

    if (!editingId && Number(balance || 0) < 0) {
      setError("Initial balance cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      const payload = editingId
        ? {
            id: editingId,
            name: name.trim(),
            type,
            currency,
          }
        : {
            name: name.trim(),
            type,
            currency,
            balance: Number(balance || 0),
          };

      const response = await fetch("/api/accounts", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save account.");
      }

      setMessage(result.message || "Account saved successfully.");

      resetForm();
      setMessage(result.message || "Account saved successfully.");

      await loadAccounts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  };

  const totalAccounts = accounts.length;

  const totalAssets = accounts
    .filter((account) => account.type !== "CREDIT_CARD")
    .reduce((sum, account) => sum + account.balance, 0);

  const totalCredit = accounts
    .filter((account) => account.type === "CREDIT_CARD")
    .reduce((sum, account) => sum + account.balance, 0);

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base font-black text-black">
              P
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Pulse</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                Personal Finance
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/65 transition hover:bg-white/[0.06] hover:text-white"
          >
            ← Back to dashboard
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        {/* Heading */}
        <header className="mb-9">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-white/35">
            Financial management
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Manage accounts
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
            Manage your bank accounts, cash, e-wallets, and credit cards
            in one place.
          </p>
        </header>

        {/* Summary */}
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-sm text-white/45">Total accounts</p>
            <p className="mt-4 text-3xl font-semibold">{totalAccounts}</p>
            <p className="mt-2 text-xs text-white/35">
              Registered accounts
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-sm text-white/45">Total assets</p>
            <p className="mt-4 text-2xl font-semibold tracking-tight">
              {formatCurrency(totalAssets)}
            </p>
            <p className="mt-2 text-xs text-white/35">
              Cash, bank, and e-wallet
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-sm text-white/45">Credit card balance</p>
            <p className="mt-4 text-2xl font-semibold tracking-tight">
              {formatCurrency(totalCredit)}
            </p>
            <p className="mt-2 text-xs text-white/35">
              Recorded credit card balances
            </p>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          {/* Account list */}
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Your accounts</h2>
                <p className="mt-1 text-xs text-white/40">
                  {totalAccounts} accounts available
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white"
              >
                + New account
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-xl bg-white/[0.05]"
                  />
                ))}
              </div>
            ) : accounts.length > 0 ? (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-white/[0.16]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-lg">
                          {getAccountIcon(account.type)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {account.name}
                          </p>
                          <p className="mt-1 text-xs text-white/40">
                            {ACCOUNT_TYPES.find(
                              (item) => item.value === account.type,
                            )?.label ?? account.type}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEdit(account)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:bg-white/[0.07] hover:text-white"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mt-5 flex items-end justify-between border-t border-white/[0.06] pt-4">
                      <span className="text-xs text-white/35">
                        Current balance
                      </span>
                      <span className="text-base font-semibold">
                        {formatCurrency(account.balance, account.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
                <p className="text-sm text-white/60">No accounts yet.</p>
                <p className="mt-2 text-xs text-white/35">
                  Create your first account using the form.
                </p>
              </div>
            )}
          </section>

          {/* Account form */}
          <section
            id="account-form"
            className="scroll-mt-24 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6"
          >
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">
                Account settings
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {editingId ? "Edit account" : "Add new account"}
              </h2>
              <p className="mt-2 text-xs leading-5 text-white/40">
                {editingId
                  ? "Update your account information."
                  : "Add a financial account to track your money."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-white/55">
                  Account name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={60}
                  placeholder="Example: BCA Main Account"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-white/55">
                  Account type
                </label>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                >
                  {ACCOUNT_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label} — {item.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-white/55">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                >
                  <option value="IDR">IDR — Indonesian Rupiah</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="SGD">SGD — Singapore Dollar</option>
                  <option value="MYR">MYR — Malaysian Ringgit</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="JPY">JPY — Japanese Yen</option>
                </select>
              </div>

              {!editingId && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/55">
                    Initial balance
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="decimal"
                    value={balance}
                    onChange={(event) => setBalance(event.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
                  />
                  <p className="mt-2 text-[11px] text-white/35">
                    Enter the current balance when creating this account.
                  </p>
                </div>
              )}

              {editingId && (
                <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-3">
                  <p className="text-xs leading-5 text-amber-200/75">
                    Editing account details will not change its current
                    balance.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-xs text-emerald-300">
                  {message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create account"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65 transition hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>

        <footer className="mt-12 border-t border-white/[0.06] py-7 text-center">
          <p className="text-xs text-white/25">
            Pulse · Personal financial intelligence
          </p>
        </footer>
      </div>
    </main>
  );
}
