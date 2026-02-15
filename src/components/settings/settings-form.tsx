"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Github,
  Key,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
  Loader2,
} from "lucide-react";

interface SettingsFormProps {
  email: string;
  githubUsername: string;
  hasAnthropicKey: boolean;
}

export function SettingsForm({
  email,
  githubUsername,
  hasAnthropicKey,
}: SettingsFormProps) {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveKey = async () => {
    if (!anthropicKey.trim()) return;

    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropic_api_key: anthropicKey }),
      });

      if (response.ok) {
        setSaved(true);
        setAnthropicKey("");
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Account */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-sm text-foreground mt-1">{email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Github className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-sm text-muted-foreground">GitHub</Label>
              <p className="text-sm text-foreground mt-0.5">
                {githubUsername ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Connected as <strong>@{githubUsername}</strong>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not connected</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* API Keys */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">API Keys</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" />
              Anthropic API Key
            </Label>
            {hasAnthropicKey && !anthropicKey && (
              <p className="text-xs text-emerald-400 flex items-center gap-1 mb-2">
                <CheckCircle2 className="h-3 w-3" />
                Key configured
              </p>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder={
                    hasAnthropicKey ? "Enter new key to update" : "sk-ant-..."
                  }
                  className="pr-10 bg-background border-border text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button
                onClick={handleSaveKey}
                disabled={!anthropicKey.trim() || saving}
                size="sm"
                className="gap-1.5 bg-violet-600 hover:bg-violet-700"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your API key is encrypted and stored securely. It&apos;s used for
              AI-powered generation.
            </p>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-900/30 bg-card p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Irreversible and destructive actions.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-red-800/50 text-red-400 hover:bg-red-950/30 hover:text-red-300"
        >
          Delete Account
        </Button>
      </section>
    </div>
  );
}
