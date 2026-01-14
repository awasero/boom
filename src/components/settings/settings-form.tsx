"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getAnthropicApiKey,
  setAnthropicApiKey,
  clearAllApiKeys,
} from "@/lib/storage";
import { validateApiKey } from "@/lib/claude";
import {
  Check,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Trash2,
  ExternalLink,
  Sparkles,
  Github,
  Rocket,
} from "lucide-react";

export function SettingsForm() {
  const [anthropicKey, setAnthropicKeyState] = useState("");
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [anthropicValid, setAnthropicValid] = useState<boolean | null>(null);
  const [savingAnthropic, setSavingAnthropic] = useState(false);

  useEffect(() => {
    const existingAnthropic = getAnthropicApiKey();
    if (existingAnthropic) {
      setAnthropicKeyState(existingAnthropic);
      setAnthropicValid(true);
    }
  }, []);

  async function handleSaveAnthropic() {
    if (!anthropicKey.trim()) return;

    setSavingAnthropic(true);

    const isValid = validateApiKey(anthropicKey.trim());

    if (isValid) {
      setAnthropicApiKey(anthropicKey.trim());
      setAnthropicValid(true);
    } else {
      setAnthropicValid(false);
    }

    setSavingAnthropic(false);
  }

  function handleClearAll() {
    if (confirm("Are you sure you want to clear your API key?")) {
      clearAllApiKeys();
      setAnthropicKeyState("");
      setAnthropicValid(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Anthropic API Key */}
      <Card className="bg-[#111113] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                <Key className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-white">Anthropic API Key</CardTitle>
                <CardDescription className="text-zinc-400">
                  Powers the AI website generation
                </CardDescription>
              </div>
            </div>
            {anthropicValid !== null && (
              <Badge
                variant={anthropicValid ? "default" : "destructive"}
                className={
                  anthropicValid
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }
              >
                {anthropicValid ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Valid
                  </>
                ) : (
                  "Invalid"
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anthropic-key" className="text-zinc-300">
              API Key
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="anthropic-key"
                  type={showAnthropicKey ? "text" : "password"}
                  placeholder="sk-ant-..."
                  value={anthropicKey}
                  onChange={(e) => {
                    setAnthropicKeyState(e.target.value);
                    setAnthropicValid(null);
                  }}
                  className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showAnthropicKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button
                onClick={handleSaveAnthropic}
                disabled={savingAnthropic || !anthropicKey.trim()}
                className="bg-violet-500 hover:bg-violet-400 text-white"
              >
                {savingAnthropic ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          <p className="text-sm text-zinc-500">
            Get your API key from{" "}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
            >
              console.anthropic.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-zinc-800/20 border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            How boom.git Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium">AI Generation</p>
                <p className="text-xs text-zinc-500">
                  Your API key is used to call Claude Opus directly from your browser
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                  <Github className="h-3.5 w-3.5" />
                  Auto-Save to GitHub
                </p>
                <p className="text-xs text-zinc-500">
                  Code is automatically committed to your repository
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                  <Rocket className="h-3.5 w-3.5" />
                  One-Click Deploy
                </p>
                <p className="text-xs text-zinc-500">
                  Deploy free to GitHub Pages — no extra accounts needed
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Note */}
      <Card className="bg-zinc-800/20 border-zinc-800/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
              <Check className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-300 font-medium mb-1">Your Data Stays Private</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Your API key is stored locally in your browser and calls Anthropic directly.
                We never see or store your key on any server.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {anthropicValid && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-400 text-base">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear API Key
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
