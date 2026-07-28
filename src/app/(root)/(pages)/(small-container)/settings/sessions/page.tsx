import { SessionsPanel } from "@/app/(root)/_components/account/SessionsPanel";

/**
 * Active sessions — the real replacement for the old mocked "login history"
 * page. Backed by `GET /profile/sessions` (live Redis refresh sessions) with
 * per-device revoke through `DELETE /profile/sessions/:sessionId`. The backend
 * keeps no sign-in audit trail, so this shows what is currently signed in
 * rather than a history of attempts.
 */
export default function SessionsPage() {
  return (
    <div className="space-y-5">
      <SessionsPanel />
    </div>
  );
}
