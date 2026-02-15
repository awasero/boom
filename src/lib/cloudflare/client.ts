const CF_API_BASE = "https://api.cloudflare.com/client/v4";

interface CloudflareResponse<T> {
  success: boolean;
  result: T;
  errors: Array<{ code: number; message: string }>;
}

export async function cfFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) throw new Error("Cloudflare credentials not configured");

  const url = `${CF_API_BASE}/accounts/${accountId}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudflare API error: ${response.status} ${text}`);
  }

  const data: CloudflareResponse<T> = await response.json();
  if (!data.success) {
    throw new Error(`Cloudflare error: ${data.errors.map(e => e.message).join(", ")}`);
  }

  return data.result;
}
