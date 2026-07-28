import { getProfile } from "@/app/(root)/_utils/getProfile";
import { getUser } from "@/app/(root)/_utils/getUser";
import SettingsClient from "./settings.client";

export default async function Settings() {
  // `GET /profile` carries the avatar, school and role the session cookie does
  // not; it fails soft to `null`, so the client falls back to session identity.
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  return <SettingsClient user={user} profile={profile} />;
}
