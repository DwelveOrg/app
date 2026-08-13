import { z } from "zod";

/**
 * Input schemas for the PDF-import server actions.
 *
 * A plain module (not `"use server"`, which may only export async functions) so
 * both the actions and the client components can import it — the same split as
 * `tests.actions.schemas.ts`.
 */

const PDF_MIME_TYPE = "application/pdf";

/**
 * The uploaded PDF.
 *
 * MIME type is caller-controlled, so this check is a courtesy to the teacher,
 * not a security boundary. The backend validates the `%PDF-` magic bytes.
 * Size is deliberately not repeated in this static schema: the picker uses the
 * served limit and the backend is authoritative. Next's transport ceiling is a
 * separate deployment setting in `next.config.ts`.
 */
export const pdfFileSchema = z
  .instanceof(File, { message: "Please choose a PDF file." })
  .refine((file) => file.size > 0, "Please choose a PDF file.")
  .refine((file) => file.type === PDF_MIME_TYPE, "Only PDF files can be imported.");

/**
 * A page selection as the teacher typed or clicked it: 1-indexed, inclusive,
 * comma-separated, with optional ranges — `"3"`, `"3-9"`, `"1-4, 7, 11-13"`.
 *
 * The same expression guards the backend DTO. Validating the shape on both
 * sides means a malformed range is a form error here and a 400 there, never an
 * expensive extraction over the wrong pages.
 */
export const PAGE_RANGE_PATTERN = /^\d+(-\d+)?(\s*,\s*\d+(-\d+)?)*$/;

export const pageRangeSchema = z
  .string()
  .trim()
  .min(1, "Choose at least one page.")
  .max(200)
  .regex(PAGE_RANGE_PATTERN, 'Pages must look like "3", "3-9", or "1-4, 7, 11-13".');

/** `POST /classes/:classId/tests/imports` — the upload plus its page selection. */
export const createTestImportSchema = z.object({
  classId: z.string().min(1),
  file: pdfFileSchema,
  pages: pageRangeSchema,
  /**
   * Optional cap the teacher may lower. Never raised past the server's ceiling —
   * `@Max(IMPORT_MAX_QUESTIONS)` on the DTO rejects a hand-crafted request that
   * tries.
   */
  // The screen clamps to the live served limit; the backend owns the hard cap.
  // Repeating today's maximum here would make a backend cap increase unusable.
  maxQuestions: z.number().int().min(1).optional(),
  title: z.string().trim().max(200).optional(),
  format: z.string().min(1).optional(),
});
export type CreateTestImportInput = z.infer<typeof createTestImportSchema>;

/** Every single-job action shares this shape. */
export const testImportJobIdSchema = z.object({ jobId: z.string().min(1) });
export type TestImportJobIdInput = z.infer<typeof testImportJobIdSchema>;

/* -------------------------------------------------------------------------- */
/* Page-range helpers — shared by the picker and the form                       */
/* -------------------------------------------------------------------------- */

/**
 * `"1-4, 7, 11-13"` → `[1,2,3,4,7,11,12,13]`.
 *
 * Ascending, de-duplicated, and clamped to `totalPages`. Returns `[]` for
 * anything it cannot parse rather than throwing, because it runs on every
 * keystroke while the teacher is still typing — a half-written `"3-"` is a
 * normal intermediate state, not an error worth surfacing.
 *
 * The backend re-parses the same string with its own implementation; this one
 * exists so the grid and the text field can stay in sync locally.
 */
export function parsePageRange(input: string, totalPages: number): number[] {
  const pages = new Set<number>();

  for (const chunk of input.split(",")) {
    const part = chunk.trim();
    if (!part) continue;

    const [rawStart, rawEnd] = part.split("-", 2);
    const start = Number.parseInt(rawStart, 10);
    if (!Number.isInteger(start)) continue;

    const end = rawEnd === undefined ? start : Number.parseInt(rawEnd, 10);
    if (!Number.isInteger(end) || end < start) continue;

    for (let page = Math.max(1, start); page <= Math.min(end, totalPages); page += 1) {
      pages.add(page);
    }
  }

  return [...pages].sort((left, right) => left - right);
}

/**
 * `[1,2,3,4,7,11,12,13]` → `"1-4, 7, 11-13"`.
 *
 * The inverse of `parsePageRange`, so clicking thumbnails writes the same
 * notation a teacher would type. Runs of three or more collapse into a range;
 * a pair stays as two numbers, since `"7-8"` is no shorter than `"7, 8"` and
 * reads as a span the teacher did not draw.
 */
export function formatPageRange(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((left, right) => left - right);
  const parts: string[] = [];

  let index = 0;
  while (index < sorted.length) {
    const start = sorted[index];
    let end = start;
    while (index + 1 < sorted.length && sorted[index + 1] === end + 1) {
      index += 1;
      end = sorted[index];
    }
    parts.push(end - start >= 2 ? `${start}-${end}` : [...new Set([start, end])].join(", "));
    index += 1;
  }

  return parts.join(", ");
}
