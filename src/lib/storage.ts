const STORAGE_KEYS = {
  ANTHROPIC_API_KEY: "boovibe_anthropic_key",
  CLOUDFLARE_API_TOKEN: "boovibe_cf_token",
  CLOUDFLARE_ACCOUNT_ID: "boovibe_cf_account_id",
} as const;

function encode(value: string): string {
  return btoa(value);
}

function decode(value: string): string {
  try {
    return atob(value);
  } catch {
    return "";
  }
}

export function getAnthropicApiKey(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.ANTHROPIC_API_KEY);
  return stored ? decode(stored) : null;
}

export function setAnthropicApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ANTHROPIC_API_KEY, encode(key));
}

export function getCloudflareToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.CLOUDFLARE_API_TOKEN);
  return stored ? decode(stored) : null;
}

export function setCloudflareToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CLOUDFLARE_API_TOKEN, encode(token));
}

export function getCloudflareAccountId(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.CLOUDFLARE_ACCOUNT_ID);
  return stored ? decode(stored) : null;
}

export function setCloudflareAccountId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CLOUDFLARE_ACCOUNT_ID, encode(id));
}

export function clearAllApiKeys(): void {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function hasRequiredKeys(): boolean {
  return !!getAnthropicApiKey();
}

export function hasDeploymentKeys(): boolean {
  return !!getCloudflareToken() && !!getCloudflareAccountId();
}
