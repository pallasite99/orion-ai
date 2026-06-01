import Link from "next/link";

const features = [
  {
    title: "Persistent memory",
    description: "Capture context automatically and surface the right details when you need them.",
  },
  {
    title: "Command center",
    description: "Track chats, tasks, files, and priorities from one focused workspace.",
  },
  {
    title: "Voice ready",
    description: "Move between typing and speaking without breaking your workflow.",
  },
];

const stats = [
  { value: "01", label: "Unified interface" },
  { value: "24/7", label: "Context awareness" },
  { value: "∞", label: "Expandable workflows" },
];

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(0,217,255,0.16),_transparent_34%),linear-gradient(180deg,_#050505_0%,_#0a0a0a_45%,_#050505_100%)] text-white">
      <div className="absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
      <div className="absolute left-[-8rem] top-20 -z-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute right-[-6rem] top-1/3 -z-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200/90 backdrop-blur">
              ORION Personal AI Operating System
            </div>

            <div className="space-y-6">
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                A focused control layer for your work, memory, and decisions.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">
                ORION combines chat, memory, tasks, files, and briefing tools into one
                command-center interface so the important context stays close at hand.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/today"
                className="inline-flex h-12 items-center justify-center rounded-full bg-cyan-400 px-6 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cyan-300"
              >
                Open dashboard
              </Link>
              <Link
                href="/chat"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:border-cyan-300/50 hover:bg-white/10"
              >
                Start a chat
              </Link>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <div className="text-2xl font-semibold text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/55">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-cyan-400/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.35em] text-white/45">
                    Live status
                  </div>
                  <div className="mt-2 text-lg font-medium text-white">ORION Core</div>
                </div>
                <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Ready
                </div>
              </div>

              <div className="grid gap-4 py-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>Briefing</span>
                    <span>Today</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/75">
                    Summaries, priorities, and active context in a single place.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.3em] text-white/45">
                      Tasks
                    </div>
                    <div className="mt-3 text-3xl font-semibold">0</div>
                    <div className="mt-1 text-sm text-white/55">Due today</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
                      Memory
                    </div>
                    <div className="mt-3 text-3xl font-semibold">24/7</div>
                    <div className="mt-1 text-sm text-white/55">Context capture</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/45">
                    Quick access
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Chat", "Today", "Tasks", "Files", "Search"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <h2 className="text-base font-semibold text-white">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
