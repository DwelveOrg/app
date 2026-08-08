import {
  Blocks,
  BookOpenText,
  FileText,
  ListChecks,
  Sigma,
  type LucideIcon,
} from "lucide-react";

import type { TestStatus } from "@/app/(root)/_lib/tests.schemas";
import type { BadgeVariant } from "@/components/ui/badge";

/**
 * Constants shared by the two surfaces a test appears on: the class-scoped list
 * (`/groups/[classId]/tests`) and the authoring studio (`/studio/tests/…`).
 *
 * They live here rather than in either route because a value that both read is
 * a value that will drift the moment it is copied — the status tint in
 * particular is drawn by a badge on the list, a badge in the studio top bar,
 * and a dot in the outline rail.
 */

/** Status tabs on the test list, in the order a teacher works through them. */
export const TEST_STATUS_TABS: TestStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const DEFAULT_TEST_STATUS: TestStatus = "DRAFT";

export const TESTS_PAGE_SIZE = 20;

/**
 * Tab order for the question picker. Presentation only — the families
 * themselves come from the catalogue, and anything the backend adds later is
 * appended alphabetically rather than dropped.
 */
export const QUESTION_FAMILY_ORDER = ["BASIC", "IELTS", "SAT"] as const;

/**
 * Section kinds a teacher can pick when a format allows custom sections.
 * `LISTENING` and `SPEAKING` exist in the backend enum but no blueprint enables
 * them this pass (no audio), so offering them would only produce dead sections.
 */
export const SECTION_KINDS = ["GENERAL", "READING", "WRITING", "MATH"] as const;

/**
 * Status tint. Each pairs a colour with its own label text, so status is never
 * signalled by colour alone (`docs/design/design-system.md`).
 */
export const TEST_STATUS_TONE: Record<TestStatus, BadgeVariant> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

/**
 * The mark on a test's identity tile and its format card.
 *
 * Presentation only, and deliberately keyed with a fallback: formats come from
 * `GET /tests/formats`, so one the backend adds tomorrow must still render —
 * with the generic document mark rather than a hole in the header.
 */
const FORMAT_ICONS: Record<string, LucideIcon> = {
  SIMPLE_QUIZ: ListChecks,
  IELTS: BookOpenText,
  SAT: Sigma,
  CUSTOM: Blocks,
};

export function formatIcon(format: string): LucideIcon {
  return FORMAT_ICONS[format] ?? FileText;
}

/* -------------------------------------------------------------------------- */
/* Deep-link anchors                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The publish wizard links each readiness issue to the row it belongs to. The
 * ids derive from backend ids, which every saved row has — validation runs
 * against saved data, so an issue can always resolve to an anchor.
 */
export const sectionAnchorId = (id: string) => `test-section-${id}`;
export const groupAnchorId = (id: string) => `test-group-${id}`;
export const questionAnchorId = (id: string) => `test-question-${id}`;

/* -------------------------------------------------------------------------- */
/* Studio routes                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Authoring lives outside the dashboard shell, so every link into it is built
 * here rather than interpolated at a dozen call sites.
 */
export const studioRoutes = {
  newTest: (classId: string) => `/studio/tests/new?class=${encodeURIComponent(classId)}`,
  builder: (testId: string) => `/studio/tests/${testId}`,
  publish: (testId: string) => `/studio/tests/${testId}/publish`,
  classTests: (classId: string) => `/groups/${classId}/tests`,
} as const;
