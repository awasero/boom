import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-14 border-b bg-white flex items-center px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">Settings</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <SettingsForm />
      </main>
    </div>
  );
}
