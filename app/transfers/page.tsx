
"use client";

import { notifyOnboardingTour } from "@/lib/onboarding-tour-events";
import { useEffect, useState } from "react";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number | string;
  currency?: string;
};

type Transfer = {
  id: string;
  description: string;
  amount: number | string;
  date: string;
  fromAccount: {
    id: string;
    name: string;
    type: string;
  };
  toAccount: {
    id: string;
    name: string;
    type: string;
  };
};

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));

const getAccountType = (type: string) => {
  const types: Record<string, string> = {
    BANK: "Bank",
    E_WALLET: "E-Wallet",
    CASH: "Cash",
    CREDIT_CARD: "Credit Card",
  };

  return types[type] ?? type;
};

export default function TransfersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(getTodayDate);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sourceAccounts = accounts.filter(
    (account) => account.type !== "CREDIT_CARD"
  );

  const destinationAccounts = accounts.filter(
    (account) => account.id !== fromAccountId
  );

  const selectedSource = accounts.find(
    (account) => account.id === fromAccountId
  );

  const selectedDestination = accounts.find(
    (account) => account.id === toAccountId
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [accountsResponse, transfersResponse] = await Promise.all([
        fetch("/api/accounts", { cache: "no-store" }),
        fetch("/api/transfers", { cache: "no-store" }),
      ]);

      if (!accountsResponse.ok || !transfersResponse.ok) {
        throw new Error("Gagal memuat data transfer.");
      }

      const accountsData = await accountsResponse.json();
      const transfersData = await transfersResponse.json();

      const accountList: Account[] = accountsData.accounts ?? [];
      const transferList: Transfer[] = Array.isArray(transfersData)
        ? transfersData
        : [];

      setAccounts(accountList);
      setTransfers(transferList);

      setFromAccountId((current) => {
        if (current && accountList.some((a) => a.id === current && a.type !== "CREDIT_CARD")) {
          return current;
        }

        return accountList.find((a) => a.type !== "CREDIT_CARD")?.id ?? "";
      });

      setToAccountId((current) => {
        if (current && accountList.some((a) => a.id === current)) {
          return current;
        }

        return "";
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Tidak dapat memuat data transfer."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSourceChange = (newId: string) => {
    setFromAccountId(newId);

    if (newId === toAccountId) {
      setToAccountId("");
    }

    setMessage("");
    setError("");
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setFromAccountId(
      sourceAccounts[0]?.id ?? ""
    );
    setToAccountId("");
    setDate(getTodayDate());
    setMessage("");
    setError("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!description.trim()) {
      setError("Masukkan deskripsi transfer.");
      return;
    }

    if (description.trim().length > 100) {
      setError("Deskripsi maksimal 100 karakter.");
      return;
    }

    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError("Masukkan nominal transfer yang valid.");
      return;
    }

    if (!fromAccountId || !toAccountId || !date) {
      setError("Lengkapi semua data transfer.");
      return;
    }

    if (fromAccountId === toAccountId) {
      setError("Akun sumber dan tujuan tidak boleh sama.");
      return;
    }

    if (
      selectedSource?.currency &&
      selectedDestination?.currency &&
      selectedSource.currency !== selectedDestination.currency
    ) {
      setError("Mata uang kedua akun harus sama.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description.trim(),
          amount: Number(amount),
          fromAccountId,
          toAccountId,
          date,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Gagal membuat transfer."
        );
      }

      resetForm();
      notifyOnboardingTour("transfer-created");
      setMessage("Transfer berhasil disimpan.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan transfer."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      <nav className="border-b border-white/[0.06] bg-[#08090b]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-black">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Pulse
            </span>
          </a>

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
            Transfers
          </h1>

          <p className="mt-2 text-sm text-white/45">
            Move money between your accounts and manage credit card payments.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section
            data-tour="transfer-form"
            className="h-fit rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
          >
            <div className="mb-6">
              <h2 className="font-medium">
                New transfer
              </h2>

              <p className="mt-1 text-xs text-white/40">
                Transfer money between your accounts.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs text-white/45">
                  Description
                </label>

                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={100}
                  placeholder="e.g. Monthly savings"
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
                    step="1"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/45">
                  From account
                </label>

                <select
                  value={fromAccountId}
                  onChange={(event) => handleSourceChange(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#111216] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Select source account</option>

                  {sourceAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {getAccountType(account.type)}
                    </option>
                  ))}
                </select>

                {selectedSource && (
                  <p className="mt-2 text-xs text-white/35">
                    Available balance: {formatCurrency(selectedSource.balance)}
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50">
                  ↓
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/45">
                  To account
                </label>

                <select
                  value={toAccountId}
                  onChange={(event) => {
                    setToAccountId(event.target.value);
                    setMessage("");
                    setError("");
                  }}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#111216] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Select destination account</option>

                  {destinationAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {getAccountType(account.type)}
                    </option>
                  ))}
                </select>

                {selectedDestination?.type === "CREDIT_CARD" && (
                  <p className="mt-2 text-xs text-emerald-400">
                    Credit card payment: this transfer will reduce your outstanding debt.
                  </p>
                )}

                {selectedDestination && selectedDestination.type !== "CREDIT_CARD" && (
                  <p className="mt-2 text-xs text-white/35">
                    Current balance: {formatCurrency(selectedDestination.balance)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/45">
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
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
                disabled={saving || loading || accounts.length < 2}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Processing..." : "Transfer money"}
              </button>

              {accounts.length < 2 && !loading && (
                <p className="text-center text-xs text-white/40">
                  You need at least two accounts to make a transfer.
                </p>
              )}
            </form>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium">
                  Transfer history
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  Your latest account movements.
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40">
                {transfers.length} records
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
            ) : transfers.length === 0 ? (
              <div className="mt-12 text-center">
                <p className="text-sm text-white/40">
                  No transfers yet.
                </p>

                <p className="mt-2 text-xs text-white/25">
                  Your transfer history will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-white/[0.06]">
                {transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/60">
                        ↗
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {transfer.description}
                        </p>

                        <p className="mt-1 truncate text-xs text-white/35">
                          {transfer.fromAccount.name}
                          {" → "}
                          {transfer.toAccount.name}
                        </p>

                        <p className="mt-1 text-xs text-white/25">
                          {formatDate(transfer.date)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-white/80">
                        {formatCurrency(transfer.amount)}
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        {transfer.toAccount.type === "CREDIT_CARD"
                          ? "Card payment"
                          : "Transfer"}
                      </p>
                    </div>
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
