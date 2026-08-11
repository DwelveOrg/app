import ProfileClient from "./profile.client";
import { getUser } from "@/app/(root)/_utils/getUser";
import { getProfile } from "@/app/(root)/_utils/getProfile";
import { isAccountTab } from "./_types";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The one account route. `GET /profile` is the single bootstrap for every panel
 * on it — identity, memberships, role profile, and the `authMethods.password`
 * signal the password panel reads. Nothing below this fetches it again.
 */
export default async function Page({ searchParams }: PageProps) {
  const [profile, params] = await Promise.all([getProfile(), searchParams]);
  // `GET /profile` already supplies every rendered identity field. Decrypt the
  // session separately only for the failure fallback instead of doing duplicate
  // work on every successful request.
  const user = profile ? null : await getUser();
  const tab = isAccountTab(params.tab) ? params.tab : "account";

  return (
    <ProfileClient
      key={`${profile?.account.id ?? user?.id ?? "guest"}:${tab}`}
      user={user}
      profile={profile}
      initialTab={tab}
    />
  );
}
