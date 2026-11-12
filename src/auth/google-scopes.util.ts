/**
 * Extra Google OAuth scopes requested on top of Better Auth's defaults (openid, email, profile).
 * Empty by default so the starter asks only for the basics; add sensitive scopes explicitly
 * through GOOGLE_SCOPES (comma separated) when the product really needs them.
 */
export function parseGoogleScopes(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
}
