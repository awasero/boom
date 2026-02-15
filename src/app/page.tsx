import Link from "next/link";
import {
  Zap,
  Globe,
  Presentation,
  Sparkles,
  Github,
  ArrowRight,
} from "lucide-react";

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6 transition-colors hover:bg-card">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/10">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-bold gradient-text">boom</span>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-800/40 bg-violet-950/30 px-3 py-1 text-xs text-violet-300 mb-6">
          <Sparkles className="h-3 w-3" />
          AI-powered builder
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          <span className="gradient-text">Describe it.</span>
          <br />
          <span className="text-foreground">Watch it build.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
          Create websites and presentation decks with AI. Just describe what you
          want, iterate with natural language, and deploy instantly to the edge.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-violet-500 active:scale-[0.98]"
          >
            <Github className="h-4 w-4" />
            Get started with GitHub
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<Sparkles className="h-5 w-5 text-violet-400" />}
            title="AI Chat Builder"
            description="Describe what you want in plain language. Claude builds multi-file websites with Tailwind CSS."
          />
          <Feature
            icon={<Zap className="h-5 w-5 text-amber-400" />}
            title="Smart Commands"
            description="Use /text, /tweak, /seo, /mobile, and /design for targeted edits powered by the right model."
          />
          <Feature
            icon={<Presentation className="h-5 w-5 text-cyan-400" />}
            title="Deck Builder"
            description="Create animated presentation decks with slide transitions, keyboard navigation, and PDF export."
          />
          <Feature
            icon={<Globe className="h-5 w-5 text-emerald-400" />}
            title="Edge Deploy"
            description="Deploy to Cloudflare Pages with one click. Preview and production URLs, zero configuration."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-foreground mb-12">
          How it works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Describe",
              text: "Tell boom what you want to build. A landing page, a portfolio, a pitch deck.",
            },
            {
              step: "2",
              title: "Iterate",
              text: "Chat naturally to refine. Select elements to tweak. Use commands for targeted edits.",
            },
            {
              step: "3",
              title: "Deploy",
              text: "One click to deploy to Cloudflare's global edge. Your project is live in seconds.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                {item.step}
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-border bg-card/50 px-8 py-12">
          <h2 className="text-2xl font-bold text-foreground">
            Ready to build?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Start building your next website or deck in seconds.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-violet-500 active:scale-[0.98]"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-5xl px-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            boom &mdash; AI website & deck builder
          </span>
          <span className="text-xs text-muted-foreground">
            Built with Claude & Next.js
          </span>
        </div>
      </footer>
    </div>
  );
}
