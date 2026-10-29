
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-zinc-950">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Pulse
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#about" className="transition hover:text-white">
              About
            </a>
            <Link
              href="/dashboard"
              className="rounded-full border border-zinc-800 px-4 py-2 text-zinc-200 transition hover:border-zinc-600"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="flex flex-1 items-center py-20">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-400">
              AI-powered financial intelligence
            </div>

            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
              Know where your money goes.
              <span className="block text-zinc-500">
                Know what to do next.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400">
              Pulse transforms everyday transactions into clear financial
              insights, helping you understand your spending, stay on budget,
              and make smarter decisions.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="rounded-full bg-white px-6 py-3 text-center text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
              >
                Explore Pulse
              </Link>

              <a
                href="#features"
                className="rounded-full border border-zinc-800 px-6 py-3 text-center text-sm font-medium text-zinc-200 transition hover:border-zinc-600"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>

        <section id="features" className="border-t border-zinc-900 py-16">
          <p className="text-sm font-medium text-zinc-500">
            WHAT YOU CAN DO
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Understand your finances.
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h3 className="font-semibold">Track transactions</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Keep your financial activity organized in one place.
              </p>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h3 className="font-semibold">Understand spending</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Review your spending patterns and financial summaries.
              </p>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h3 className="font-semibold">Explore insights</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Use financial insights to help guide your next decisions.
              </p>
            </article>
          </div>
        </section>

        <section id="about" className="border-t border-zinc-900 py-12">
          <h2 className="text-2xl font-semibold">About Pulse</h2>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
            Pulse is a personal finance application designed to make everyday
            financial activity easier to understand.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Open dashboard
          </Link>
        </section>

        <footer
          id="contact"
          className="flex items-center justify-between gap-4 border-t border-zinc-900 pt-6 text-xs text-zinc-600"
        >
          <span>Pulse &copy; 2026</span>
          <span>Built with Next.js</span>
        </footer>
      </section>
    </main>
  );
}
