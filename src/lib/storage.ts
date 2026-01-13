const STORAGE_KEYS = {
  ANTHROPIC_API_KEY: "vibesites_anthropic_key",
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

export function clearAllApiKeys(): void {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function hasRequiredKeys(): boolean {
  return !!getAnthropicApiKey();
}
