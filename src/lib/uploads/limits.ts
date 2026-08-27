/**
 * What a browser upload can actually weigh by the time it reaches Nest.
 *
 * ## The bug this file exists to prevent
 *
 * Every file the product uploads — such as a class picture, school logo, or
 * imported PDF — travels as `FormData` through a Next Server Action before a
 * server-side `fetch` hands it to the backend. On Vercel a Server Action is a
 * serverless function, and the platform refuses any request whose body exceeds
 * **4.5 MB** with a plain-text `413
 * FUNCTION_PAYLOAD_TOO_LARGE` produced at the edge, *before* Next runs.
 *
 * `experimental.serverActions.bodySizeLimit` does not move that ceiling. It
 * only relaxes Next's own check, which sits downstream of a request that was
 * already rejected. Raising it to `21mb` bought exactly nothing in production
 * and, worse, hid the problem locally: `next dev` has no edge, so an 8 MB
 * screenshot uploaded perfectly on a laptop and vanished on dwelve.uz. The
 * report dialog offered 8 MB, the importer offered 20 MB, and neither number
 * was reachable by any deployed user.
 *
 * The failure was also silent. The 413 body is not JSON, so the Server Action
 * response fails to deserialise and React rejects the promise inside
 * `startTransition`. With no error boundary around the dialog, nothing renders:
 * the user presses Send, the button un-busies, and the report never arrives —
 * "I can only send a message, never an image".
 *
 * So: treat this as a hard physical limit, keep every feature's cap below it,
 * and shrink images in the browser rather than discovering the ceiling in
 * production. `next.config.ts` pins `bodySizeLimit` to the same number so a
 * local run fails the same way a deployed one does.
 */

/** Vercel's serverless request-body ceiling. Measured, not guessed: 4,404,019 bytes passes, 4,500,000 returns 413. */
export const PLATFORM_REQUEST_MAX_BYTES = 4_500_000;

/**
 * The measured pass point, kept separate from the ceiling above.
 *
 * `PLATFORM_REQUEST_MAX_BYTES` is the documented limit; this is the largest
 * body that was actually observed getting through. Budgets below are derived
 * from the measurement rather than the round number, because the difference is
 * 100 KB a teacher would otherwise never get to use.
 */
const PLATFORM_REQUEST_MEASURED_PASS_BYTES = 4_404_019;

/**
 * The budget a single uploaded file may occupy.
 *
 * Below the platform ceiling because the file is not the whole request: the
 * multipart envelope, the boundary markers, the Server Action's own encoding,
 * and accompanying text fields (an import carries its page range and title)
 * all share the body.
 * 200 KB of headroom under the measured pass point covers those with room to
 * spare — the envelope for one file plus three short text fields is under a
 * kilobyte, and Next's own Server Action framing is a few hundred bytes more.
 *
 * The importer is the reason this is derived from the measurement rather than
 * a round 4,000,000: it uploads a slice of exactly the pages a teacher picked,
 * and every byte of budget is one more scanned page that fits before the slice
 * has to be downsampled.
 */
export const UPLOAD_MAX_BYTES = PLATFORM_REQUEST_MEASURED_PASS_BYTES - 200_000;

/**
 * The longest edge a stored image needs.
 *
 * 2560px is enough for the product's remaining image workflows and far past
 * what a class picture or school logo is rendered at. Anything larger is bytes
 * spent on pixels nobody displays.
 */
export const IMAGE_MAX_EDGE = 2560;

/**
 * Human-readable bytes, for a hint or an error that has to name the limit.
 *
 * Use this rather than dividing at the call site. `Math.floor(bytes / 1_048_576)`
 * is the obvious thing to write and it under-reports every limit that is not a
 * whole number of mebibytes: the importer's cap was advertised as "3 MB" for
 * months while the code accepted 3.8, and teachers sized their files to the
 * number they were shown.
 *
 * A trailing `.0` is dropped, so a round limit reads as "50 MB" rather than
 * "50.0 MB".
 */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}
