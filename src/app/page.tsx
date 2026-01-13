import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/auth/login-button";
import { Sparkles, Github, Cloud, Zap } from "lucide-react";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">BooVibe</span>
          </div>
          <LoginButton />
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            AI-Powered Website Builder
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Build websites with
            <span className="text-primary"> AI</span>
            <br />
            Deploy in minutes
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Describe your website in plain English. BooVibe uses Claude AI to generate
            production-ready code, commits to your GitHub, and deploys to Cloudflare Pages.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <LoginButton />
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-6 rounded-xl bg-white border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Github className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">GitHub Connected</h3>
              <p className="text-sm text-muted-foreground text-center">
                Your code lives in your repos. Full ownership, version control included.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-xl bg-white border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Claude AI</h3>
              <p className="text-sm text-muted-foreground text-center">
                Chat naturally. Get production-ready Astro sites with perfect SEO.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-xl bg-white border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Cloud className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Cloudflare Deploy</h3>
              <p className="text-sm text-muted-foreground text-center">
                One-click deploy. Custom domains. SSL included. Blazing fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>

          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Sign in with GitHub",
                description: "Connect your GitHub account to create and manage repositories.",
              },
              {
                step: "2",
                title: "Describe your website",
                description: "Tell Claude what you want. 'Build a landing page for my coffee shop with a menu section.'",
              },
              {
                step: "3",
                title: "Review and iterate",
                description: "See a live preview. Ask for changes. 'Make the colors warmer. Add a contact form.'",
              },
              {
                step: "4",
                title: "Deploy to Cloudflare",
                description: "One click to go live. Add your custom domain. You're done.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Zap className="h-5 w-5" />
            <span className="font-semibold">Ready to build?</span>
          </div>
          <h2 className="text-3xl font-bold mb-6">
            From idea to live website in 5 minutes
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            No coding required. No hosting fees. Your code, your repos, your domains.
          </p>
          <LoginButton />
        </div>
      </section>

      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">BooVibe</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Claude AI, and Cloudflare Pages
          </p>
        </div>
      </footer>
    </main>
  );
}
