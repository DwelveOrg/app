/**
 * Builds a `mailto:` href with an encoded subject and body.
 *
 * `URLSearchParams` encodes spaces as `+`, which mail clients render literally
 * inside a subject/body, so those are re-encoded as `%20`.
 */
export function buildMailtoHref({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${to}?${params.toString().replace(/\+/g, "%20")}`;
}

/**
 * Trailing context block appended to every support message so the team can
 * identify the account without a round-trip. Kept to data the user already
 * sees on this page — no tokens, ids or anything they cannot read themselves.
 */
export function buildAccountContext({
  fullName,
  email,
  schoolName,
  role,
}: {
  fullName?: string | null;
  email?: string | null;
  schoolName?: string | null;
  role?: string | null;
}) {
  const lines = [
    fullName ? `Name: ${fullName}` : null,
    email ? `Email: ${email}` : null,
    schoolName ? `School: ${schoolName}` : null,
    role ? `Role: ${role}` : null,
  ].filter(Boolean);

  return lines.length ? `\n\n---\n${lines.join("\n")}` : "";
}
