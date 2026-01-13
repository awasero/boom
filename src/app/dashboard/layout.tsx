import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";
import { Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">BooVibe</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
            <UserMenu />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
