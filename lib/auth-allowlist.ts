export function parseAllowedEmails(raw: string): Set<string> {
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isEmailAllowed(
  email: string | null | undefined,
  raw = process.env.ALLOWED_USERS ?? ""
): boolean {
  if (!email) return false;
  return parseAllowedEmails(raw).has(email.trim().toLowerCase());
}
