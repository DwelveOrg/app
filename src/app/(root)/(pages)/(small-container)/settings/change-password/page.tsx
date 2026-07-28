import { getProfile } from "@/app/(root)/_utils/getProfile";
import { ChangePasswordForm } from "@/app/(root)/_components/account/ChangePasswordForm";

/**
 * Password management lives under Settings only — `/profile` is identity, this
 * route group is account security. `ChangePasswordForm` renders a "Set password"
 * or "Change password" flow from the backend `account.authMethods.password`
 * signal (see `docs/features/password-auth-settings.md`). Defaults to the change
 * flow if the profile bootstrap is unavailable so an existing-password user is
 * never shown the passwordless setup form by mistake.
 */
export default async function ChangePasswordPage() {
  const profile = await getProfile();
  const hasPassword = profile?.account.authMethods?.password ?? true;

  return (
    <div className="space-y-5">
      <ChangePasswordForm hasPassword={hasPassword} />
    </div>
  );
}
