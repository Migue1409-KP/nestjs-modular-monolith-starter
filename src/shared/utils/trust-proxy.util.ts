/**
 * Parses TRUST_PROXY into the value Express' `trust proxy` setting expects:
 * "true"/"false" -> boolean, "2" -> hop count, anything else (e.g. "loopback", an IP/CIDR list) -> as is.
 */
export function parseTrustProxy(raw?: string): boolean | number | string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}
