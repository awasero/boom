"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Github,
  Wand2,
  Code2,
  Rocket,
  Zap,
  DollarSign,
  Clock,
  Heart,
  Terminal,
  Globe,
  Layers,
  ExternalLink,
  Check,
  X,
} from "lucide-react";

const SAMPLE_PROMPTS = [
  { label: "Portfolio", prompt: "A minimal portfolio for a photographer with a dark theme, image gallery, and contact form" },
  { label: "Landing Page", prompt: "A modern SaaS landing page with hero section, features grid, pricing table, and testimonials" },
  { label: "Restaurant", prompt: "An elegant restaurant website with menu, reservations, location map, and photo gallery" },
  { label: "Blog", prompt: "A clean personal blog with article cards, categories, search, and newsletter signup" },
];

const FEATURES = [
  {
    icon: <Wand2 className="h-5 w-5" />,
    title: "Vibe Coding",
    description: "Just describe what you want. No coding skills needed. Claude AI understands your vision.",
  },
  {
    icon: <Github className="h-5 w-5" />,
    title: "Auto-Save to GitHub",
    description: "Every change is automatically committed to your repository. Full version control built-in.",
  },
  {
    icon: <Rocket className="h-5 w-5" />,
    title: "One-Click Deploy",
    description: "Deploy instantly to GitHub Pages. Your site goes live in seconds, not hours.",
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Free Hosting Forever",
    description: "GitHub Pages hosting is 100% free. No monthly fees, no hidden costs, no limits.",
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: "Real Code You Own",
    description: "Clean HTML, CSS, and JavaScript. Export anytime. No vendor lock-in.",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Lightning Fast",
    description: "Static sites load instantly. Perfect Lighthouse scores out of the box.",
  },
];

const COMPARISON = [
  { feature: "Monthly cost", boom: "$0 forever", others: "$12-50/month" },
  { feature: "Coding required", boom: "Never", others: "Sometimes" },
  { feature: "Own your code", boom: "Always", others: "Rarely" },
  { feature: "Custom domain", boom: "Free", others: "$10-20/year extra" },
  { feature: "AI generation", boom: "Unlimited*", others: "Limited or extra $" },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  const tagline = "Build websites with words, not code.";

  useEffect(() => {
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < tagline.length) {
        setTypedText(tagline.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (session && status === "authenticated") {
      const storedPrompt = sessionStorage.getItem("vibesites_prompt");
      if (storedPrompt) {
        sessionStorage.removeItem("vibesites_prompt");
        handleCreateProject(storedPrompt);
      }
    }
  }, [session, status]);

  async function handleCreateProject(projectPrompt: string) {
    if (!projectPrompt.trim()) return;
    setIsLoading(true);
    const randomId = Math.random().toString(36).substring(2, 8);
    const projectName = `site-${randomId}`;
    sessionStorage.setItem("vibesites_initial_prompt", projectPrompt);
    router.push(`/create?name=${encodeURIComponent(projectName)}`);
  }

  function handleSubmit() {
    if (!prompt.trim()) return;
    if (!session) {
      sessionStorage.setItem("vibesites_prompt", prompt);
      signIn("github");
      return;
    }
    handleCreateProject(prompt);
  }

  function handleSampleClick(samplePrompt: string) {
    setPrompt(samplePrompt);
  }

  return (
    <main className="min-h-screen bg-[#030306] text-white overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[1000px] h-[1000px] rounded-full opacity-20 blur-[150px] transition-all duration-[2000ms] ease-out"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(139,92,246,0.3) 40%, transparent 70%)",
            left: `${mousePosition.x * 0.3}%`,
            top: `${mousePosition.y * 0.2}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-15 blur-[120px] transition-all duration-[2500ms] ease-out"
          style={{
            background: "radial-gradient(circle, rgba(236,72,153,0.5) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)",
            right: `${100 - mousePosition.x * 0.2}%`,
            bottom: `${100 - mousePosition.y * 0.3}%`,
            transform: "translate(50%, 50%)",
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 backdrop-blur-2xl bg-[#030306]/50 sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Terminal className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight font-mono">
              boom<span className="text-cyan-400">.git</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => signIn("github")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
              >
                <Github className="h-4 w-4" />
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 pt-16 md:pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Free Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="h-3 w-3" />
              100% Free Forever
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-center mb-4 leading-[1.1] tracking-tight">
            <span className="font-mono text-cyan-400">$</span> describe website
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              &amp;&amp; watch it build
            </span>
          </h1>

          {/* Typed tagline */}
          <p className="text-lg md:text-xl text-zinc-400 text-center max-w-2xl mx-auto mb-10 font-mono">
            <span className="text-cyan-400/70">&gt;</span> {typedText}
            <span className={`inline-block w-2 h-5 ml-1 bg-cyan-400 align-middle ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
          </p>

          {/* Prompt Input */}
          <div className="relative group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-violet-600 to-fuchsia-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-35 transition-opacity duration-500" />

            <div className="relative bg-[#0a0a0f]/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-zinc-500 font-mono ml-2">boom.git — describe your website</span>
              </div>

              <div className="p-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A portfolio website for a creative designer with dark mode, project gallery, and contact form..."
                  rows={3}
                  className="w-full bg-transparent text-white placeholder:text-zinc-600 text-base md:text-lg px-4 py-3 resize-none focus:outline-none font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) {
                      handleSubmit();
                    }
                  }}
                />
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="text-xs text-zinc-600 px-2 font-mono hidden sm:inline">
                    <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-500 border border-zinc-700/50">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-500 border border-zinc-700/50">Enter</kbd>
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!prompt.trim() || isLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/25 hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Building...
                      </>
                    ) : (
                      <>
                        {session ? "Build Website" : "Sign in & Build"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="flex flex-wrap justify-center gap-2 mb-16">
            <span className="text-sm text-zinc-500 mr-1 py-2">Try:</span>
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample.label}
                onClick={() => handleSampleClick(sample.prompt)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-200"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white font-mono">$0</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Forever</div>
            </div>
            <div className="w-px h-12 bg-zinc-800 hidden md:block" />
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white font-mono">&lt;60s</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">To Build</div>
            </div>
            <div className="w-px h-12 bg-zinc-800 hidden md:block" />
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white font-mono">1-Click</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Deploy</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Three steps. <span className="text-cyan-400">Zero friction.</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              From idea to live website in under a minute. No tutorials, no learning curve.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: <Terminal className="h-6 w-6" />,
                title: "Describe",
                description: "Tell the AI what you want in plain English. Be as detailed or simple as you like.",
                color: "cyan",
              },
              {
                step: "02",
                icon: <Sparkles className="h-6 w-6" />,
                title: "Watch",
                description: "Claude AI writes real code in real-time. Watch your website come to life.",
                color: "violet",
              },
              {
                step: "03",
                icon: <Rocket className="h-6 w-6" />,
                title: "Deploy",
                description: "One click to go live on GitHub Pages. Free hosting, forever.",
                color: "fuchsia",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-b from-${item.color}-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative p-6 rounded-2xl border border-white/5 hover:border-white/10 bg-white/[0.01] transition-all h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-${item.color}-500/10 text-${item.color}-400`}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-mono text-zinc-600">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 px-6 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need. <span className="text-violet-400">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              No bloat, no complexity. Just the features that matter.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-5 rounded-xl border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.02] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Free Section */}
      <section className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                <DollarSign className="h-3 w-3" />
                Actually Free
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why is boom.git <span className="text-emerald-400">free?</span>
              </h2>
              <div className="space-y-4 text-zinc-400">
                <p>
                  Website builders charge $12-50/month because they host your site, store your data, and lock you into their platform.
                </p>
                <p>
                  <span className="text-white font-medium">boom.git is different.</span> Your code lives on GitHub (free). Your site runs on GitHub Pages (free). You bring your own Claude API key (pay only for what you use).
                </p>
                <p>
                  We don&apos;t store anything. We don&apos;t host anything. We just connect the dots between you, AI, and GitHub.
                </p>
              </div>
              <div className="mt-6 text-sm text-zinc-600">
                * Uses your own Anthropic API key. ~$0.01-0.05 per website generation.
              </div>
            </div>

            {/* Comparison table */}
            <div className="bg-[#0a0a0f]/50 rounded-2xl border border-white/5 overflow-hidden">
              <div className="grid grid-cols-3 gap-4 p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="text-sm text-zinc-500">Feature</div>
                <div className="text-sm font-semibold text-cyan-400 text-center">boom.git</div>
                <div className="text-sm text-zinc-500 text-center">Others</div>
              </div>
              {COMPARISON.map((row, i) => (
                <div key={row.feature} className={`grid grid-cols-3 gap-4 p-4 ${i !== COMPARISON.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="text-sm text-zinc-400">{row.feature}</div>
                  <div className="text-sm text-emerald-400 font-medium text-center flex items-center justify-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    {row.boom}
                  </div>
                  <div className="text-sm text-zinc-500 text-center flex items-center justify-center gap-1.5">
                    <X className="h-3.5 w-3.5 text-zinc-600" />
                    {row.others}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="relative z-10 py-20 px-6 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Tired of the old way?
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {[
              { icon: <DollarSign className="h-5 w-5" />, problem: "Website builders cost $150-600/year" },
              { icon: <Code2 className="h-5 w-5" />, problem: "Learning to code takes months" },
              { icon: <Clock className="h-5 w-5" />, problem: "Hiring a developer takes weeks" },
              { icon: <Layers className="h-5 w-5" />, problem: "Too many tools to learn and manage" },
            ].map((item) => (
              <div
                key={item.problem}
                className="flex items-center gap-4 p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-left"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 text-red-400 shrink-0">
                  {item.icon}
                </div>
                <span className="text-zinc-300 text-sm">{item.problem}</span>
              </div>
            ))}
          </div>

          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <span className="text-lg">
              <span className="text-white font-semibold">boom.git:</span>
              <span className="text-zinc-300"> Describe → Build → Deploy. Done.</span>
            </span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to build your website?
          </h2>
          <p className="text-xl text-zinc-400 mb-10">
            No credit card. No signup fee. Just you, your words, and AI.
          </p>
          <button
            onClick={() => {
              if (!session) {
                signIn("github");
              } else {
                router.push("/dashboard");
              }
            }}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold text-lg transition-all duration-200 shadow-xl shadow-cyan-500/20 hover:shadow-2xl hover:shadow-cyan-500/25 hover:-translate-y-1"
          >
            <Github className="h-5 w-5" />
            {session ? "Go to Dashboard" : "Start Building — It's Free"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6 bg-[#030306]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Terminal className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight font-mono">
                boom<span className="text-cyan-400">.git</span>
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Powered by Claude AI
              </span>
              <span className="hidden sm:inline">•</span>
              <a
                href="https://awasero.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                Built by <span className="text-cyan-400 font-medium">awasero</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com/awasero/boom"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">View on GitHub</span>
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center text-xs text-zinc-600">
            <p className="flex items-center justify-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for the indie hacker community
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
