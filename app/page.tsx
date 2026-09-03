export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-zinc-950">
              P
            </div>

            <span className="text-lg font-semibold tracking-tight">
              Pulse
            </span>
          </div>

          <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>

            <a href="#about" className="transition hover:text-white">
              About
            </a>

            <a
              href="#contact"
              className="rounded-full border border-zinc-800 px-4 py-2 text-zinc-200 transition hover:border-zinc-600"
            >
              Get Started
            </a>
          </div>
        </nav>

        <div className="flex flex-1 items-center">
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
              <a
                href="#dashboard"
                className="rounded-full bg-white px-6 py-3 text-center text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
              >
                Explore Pulse
              </a>

              <a
                href="#features"
                className="rounded-full border border-zinc-800 px-6 py-3 text-center text-sm font-medium text-zinc-200 transition hover:border-zinc-600"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-zinc-900 pt-6 text-xs text-zinc-600">
          <span>Pulse © 2026</span>
          <span>Built with Next.js</span>
        </footer>
      </section>
    </main>
  );
}