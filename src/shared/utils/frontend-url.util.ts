/**
 * FRONTEND_URL supports either a single origin or a comma-separated list,
 * e.g. `http://localhost:3001` or `http://localhost:3001,https://app.example.com`.
 */

export function parseFrontendUrls(raw: string | undefined | null): string[] {
  if (!raw) return [];

  return raw
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

export function getPrimaryFrontendUrl(raw: string | undefined | null): string {
  return parseFrontendUrls(raw)[0] ?? '';
}
