/**
 * Support inbox for the "Contact support" row. Reports go to `POST /reports`
 * now; this address is for the conversations that belong in a real inbox the
 * user can follow. Override per environment with `NEXT_PUBLIC_SUPPORT_EMAIL`.
 */
export const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "abdulazizyusupaliev009@gmail.com";
