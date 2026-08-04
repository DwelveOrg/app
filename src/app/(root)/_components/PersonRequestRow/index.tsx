"use client";

import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Surface from "@/components/ui/Surface";
import { RelativeTime } from "@/components/Custom/RelativeTime";

/**
 * One pending request from a person, with approve and reject.
 *
 * `ClassJoinRequestRow` (students) and a local `RequestRow` inside `ClassTeacherRequestsList`
 * (teachers) were character-for-character identical apart from the field they read the person out
 * of and the i18n namespace they pulled labels from — so the two drifted apart every time either
 * was touched. The differing part is the *data shape*, which belongs to the caller, and the
 * differing labels are already-rendered strings, so neither needs to live in here.
 */
export type PersonRequestRowProps = {
  /** Already-narrowed person, so this component never has to know student from teacher. */
  person: { fullName: string; email?: string | null };
  /** Optional note the requester attached. */
  message?: string | null;
  requestedAt?: string | Date | null;
  approveLabel: string;
  rejectLabel: string;
  onApprove: () => void;
  onReject: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
};

export default function PersonRequestRow({
  person,
  message,
  requestedAt,
  approveLabel,
  rejectLabel,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: Readonly<PersonRequestRowProps>) {
  // Either action in flight locks both, so a request can't be approved and rejected in one pass.
  const busy = isApproving || isRejecting;

  return (
    <Surface as="li" padding="sm" className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar name={person.fullName} tint="seeded" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{person.fullName}</p>
        {person.email ? (
          <p className="truncate text-xs text-muted-foreground">{person.email}</p>
        ) : null}
        {message ? (
          <p className="mt-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-foreground">
            {message}
          </p>
        ) : null}
        {requestedAt ? (
          <p className="mt-1 text-2xs text-muted-foreground">
            <RelativeTime date={requestedAt} />
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button size="lg" disabled={busy} loading={isApproving} onClick={onApprove}>
          <Check />
          {approveLabel}
        </Button>
        <Button
          size="lg"
          variant="destructive"
          disabled={busy}
          loading={isRejecting}
          onClick={onReject}
        >
          <X />
          {rejectLabel}
        </Button>
      </div>
    </Surface>
  );
}

export { PersonRequestRow };
