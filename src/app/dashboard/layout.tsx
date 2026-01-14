import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";
import { Terminal, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-zinc-800/50 bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-lg blur opacity-50" />
              <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Terminal className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="font-bold text-lg text-white font-mono">
              boom<span className="text-cyan-400">.git</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
            <div className="h-6 w-px bg-zinc-800 mx-2" />
            <UserMenu />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
