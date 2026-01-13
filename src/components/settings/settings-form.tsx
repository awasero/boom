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
  getCloudflareToken,
  setCloudflareToken,
  getCloudflareAccountId,
  setCloudflareAccountId,
  clearAllApiKeys,
} from "@/lib/storage";
import { validateApiKey } from "@/lib/claude";
import { validateCredentials } from "@/lib/cloudflare";
import {
  Check,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Cloud,
  Trash2,
  ExternalLink,
} from "lucide-react";

export function SettingsForm() {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [cfToken, setCfToken] = useState("");
  const [cfAccountId, setCfAccountId] = useState("");

  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showCfToken, setShowCfToken] = useState(false);

  const [anthropicValid, setAnthropicValid] = useState<boolean | null>(null);
  const [cfValid, setCfValid] = useState<boolean | null>(null);

  const [savingAnthropic, setSavingAnthropic] = useState(false);
  const [savingCf, setSavingCf] = useState(false);

  useEffect(() => {
    // Load existing keys
    const existingAnthropic = getAnthropicApiKey();
    const existingCfToken = getCloudflareToken();
    const existingCfAccountId = getCloudflareAccountId();

    if (existingAnthropic) {
      setAnthropicKey(existingAnthropic);
      setAnthropicValid(true);
    }
    if (existingCfToken) setCfToken(existingCfToken);
    if (existingCfAccountId) setCfAccountId(existingCfAccountId);
    if (existingCfToken && existingCfAccountId) {
      setCfValid(true);
    }
  }, []);

  async function handleSaveAnthropic() {
    if (!anthropicKey.trim()) return;

    setSavingAnthropic(true);

    // Validate the key format
    const isValid = validateApiKey(anthropicKey.trim());

    if (isValid) {
      setAnthropicApiKey(anthropicKey.trim());
      setAnthropicValid(true);
    } else {
      setAnthropicValid(false);
    }

    setSavingAnthropic(false);
  }

  async function handleSaveCloudflare() {
    if (!cfToken.trim() || !cfAccountId.trim()) return;

    setSavingCf(true);

    try {
      const isValid = await validateCredentials(cfToken.trim(), cfAccountId.trim());

      if (isValid) {
        setCloudflareToken(cfToken.trim());
        setCloudflareAccountId(cfAccountId.trim());
        setCfValid(true);
      } else {
        setCfValid(false);
      }
    } catch {
      setCfValid(false);
    }

    setSavingCf(false);
  }

  function handleClearAll() {
    if (confirm("Are you sure you want to clear all API keys?")) {
      clearAllApiKeys();
      setAnthropicKey("");
      setCfToken("");
      setCfAccountId("");
      setAnthropicValid(null);
      setCfValid(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Anthropic API Key */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>Anthropic API Key</CardTitle>
            </div>
            {anthropicValid !== null && (
              <Badge variant={anthropicValid ? "default" : "destructive"}>
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
          <CardDescription>
            Required for AI website generation with Claude
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anthropic-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="anthropic-key"
                  type={showAnthropicKey ? "text" : "password"}
                  placeholder="sk-ant-..."
                  value={anthropicKey}
                  onChange={(e) => {
                    setAnthropicKey(e.target.value);
                    setAnthropicValid(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              >
                {savingAnthropic ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Get your API key from{" "}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              console.anthropic.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Cloudflare Credentials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              <CardTitle>Cloudflare Pages</CardTitle>
            </div>
            {cfValid !== null && (
              <Badge variant={cfValid ? "default" : "destructive"}>
                {cfValid ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  "Invalid"
                )}
              </Badge>
            )}
          </div>
          <CardDescription>
            Required for deploying your websites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cf-token">API Token</Label>
            <div className="relative">
              <Input
                id="cf-token"
                type={showCfToken ? "text" : "password"}
                placeholder="Your Cloudflare API token"
                value={cfToken}
                onChange={(e) => {
                  setCfToken(e.target.value);
                  setCfValid(null);
                }}
              />
              <button
                type="button"
                onClick={() => setShowCfToken(!showCfToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCfToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Create a token with &quot;Cloudflare Pages: Edit&quot; permission
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cf-account">Account ID</Label>
            <Input
              id="cf-account"
              placeholder="Your Cloudflare Account ID"
              value={cfAccountId}
              onChange={(e) => {
                setCfAccountId(e.target.value);
                setCfValid(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Find this in your Cloudflare dashboard URL or account settings
            </p>
          </div>

          <Button
            onClick={handleSaveCloudflare}
            disabled={savingCf || !cfToken.trim() || !cfAccountId.trim()}
            className="w-full"
          >
            {savingCf ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              "Save & Validate"
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            Get your credentials from{" "}
            <a
              href="https://dash.cloudflare.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              dash.cloudflare.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            These actions cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleClearAll}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All API Keys
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
