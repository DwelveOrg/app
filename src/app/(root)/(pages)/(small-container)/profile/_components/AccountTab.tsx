"use client";

import type { ProfileResponse } from "@/app/(root)/_lib/profile.schemas";
import { AccountDetailsForm } from "./AccountDetailsForm";
import { MembershipsPanel } from "./MembershipsPanel";
import { ProfileSummaryCard } from "./ProfileSummaryCard";
import { SchoolProfileForm } from "./SchoolProfileForm";
import { SelectedSchoolCard } from "./SelectedSchoolCard";

/**
 * Who you are: avatar, name, the active school, the role profile for that
 * school, and every membership the account holds.
 *
 * Role fields come only from `selectedSchool.roleProfile` and only for
 * teachers and students — an admin membership has no editable role profile, so
 * the form is not rendered at all rather than rendered empty.
 */
export function AccountTab({ profile }: Readonly<{ profile: ProfileResponse }>) {
  const { account, selectedSchool, memberships } = profile;
  const showSchoolProfile = selectedSchool && selectedSchool.roleProfile.type !== "ADMIN";

  return (
    <div className="space-y-6">
      <ProfileSummaryCard account={account} />

      <SelectedSchoolCard selectedSchool={selectedSchool} />

      <AccountDetailsForm account={account} />

      {showSchoolProfile ? <SchoolProfileForm selectedSchool={selectedSchool} /> : null}

      <MembershipsPanel memberships={memberships} selectedSchool={selectedSchool} />
    </div>
  );
}
