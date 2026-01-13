"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Github, Wand2, Code2, Rocket } from "lucide-react";

const SAMPLE_PROMPTS = [
  { label: "Portfolio", prompt: "A minimal portfolio for a photographer with a dark theme, image gallery, and contact form" },
  { label: "Landing Page", prompt: "A modern SaaS landing page with hero section, features grid, pricing table, and testimonials" },
  { label: "Restaurant", prompt: "An elegant restaurant website with menu, reservations, location map, and photo gallery" },
  { label: "Blog", prompt: "A clean personal blog with article cards, categories, search, and newsletter signup" },
  { label: "Agency", prompt: "A creative agency website with case studies, team section, services, and bold typography" },
  { label: "Startup", prompt: "A tech startup landing page with product demo, investor logos, and early access signup" },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  // Check for stored prompt after login
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

    // Generate a random project name to avoid collisions
    const randomId = Math.random().toString(36).substring(2, 8);
    const projectName = `site-${randomId}`;

    // Store prompt and redirect to create project
    sessionStorage.setItem("vibesites_initial_prompt", projectPrompt);
    router.push(`/create?name=${encodeURIComponent(projectName)}`);
  }

  function handleSubmit() {
    if (!prompt.trim()) return;

    if (!session) {
      // Store prompt and trigger login
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
    <main className="min-h-screen bg-[#030306] text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Aurora effect */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px] transition-all duration-1000 ease-out"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(236,72,153,0.4) 50%, transparent 70%)",
            left: `${mousePosition.x * 0.5}%`,
            top: `${mousePosition.y * 0.3}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] transition-all duration-1500 ease-out"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(139,92,246,0.3) 50%, transparent 70%)",
            right: `${100 - mousePosition.x * 0.3}%`,
            bottom: `${100 - mousePosition.y * 0.4}%`,
            transform: "translate(50%, 50%)",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "100px 100px",
          }}
        />
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight">Vibesites</span>
          </div>
          {session ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
            >
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => signIn("github")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
            >
              <Github className="h-4 w-4" />
              Sign in
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium backdrop-blur-sm">
              <Wand2 className="h-4 w-4" />
              AI-Powered Website Builder
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 leading-[1.1] tracking-tight">
            Describe it.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              We build it.
            </span>
          </h1>

          <p className="text-xl text-zinc-400 text-center max-w-2xl mx-auto mb-12 leading-relaxed">
            Tell us what you want. Our AI creates a beautiful, production-ready website in seconds.
          </p>

          {/* Prompt Input */}
          <div className="relative group mb-8">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" />

            <div className="relative bg-[#0a0a0f]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your dream website..."
                rows={3}
                className="w-full bg-transparent text-white placeholder:text-zinc-500 text-lg px-4 py-3 resize-none focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) {
                    handleSubmit();
                  }
                }}
              />
              <div className="flex items-center justify-between px-2 pb-2">
                <span className="text-xs text-zinc-600 px-2">
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Enter</kbd> to generate
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      {session ? "Create Website" : "Sign in & Create"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="flex flex-wrap justify-center gap-2 mb-16">
            <span className="text-sm text-zinc-500 mr-2 py-2">Try:</span>
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample.label}
                onClick={() => handleSampleClick(sample.prompt)}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                icon: <Wand2 className="h-6 w-6" />,
                title: "Describe",
                description: "Tell us what you want in plain English",
              },
              {
                icon: <Code2 className="h-6 w-6" />,
                title: "Generate",
                description: "AI creates production-ready code instantly",
              },
              {
                icon: <Rocket className="h-6 w-6" />,
                title: "Deploy",
                description: "One-click deploy to your own domain",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400">
                      {step.icon}
                    </div>
                    <span className="text-xs font-bold text-violet-400/60 tracking-widest">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-zinc-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span>Powered by Claude AI</span>
          </div>
          <p className="text-sm text-zinc-600">
            Built with Next.js & Tailwind
          </p>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  );
}
