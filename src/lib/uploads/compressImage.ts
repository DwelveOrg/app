import { IMAGE_MAX_EDGE, UPLOAD_MAX_BYTES } from "./limits";

/**
 * Shrinks an image in the browser until it fits the upload budget.
 *
 * ## Why the client and not the server
 *
 * The server never sees an oversized file. `UPLOAD_MAX_BYTES` is enforced at
 * Vercel's edge, so an 8 MB screenshot is destroyed before any code we wrote
 * gets a chance to resize it. The only place with both the bytes and a decoder
 * is the tab the user is sitting in.
 *
 * ## Why it is not a quality regression
 *
 * A screenshot is a lossless PNG of mostly flat UI, which is the worst case for
 * PNG and the best case for WebP: a 2560×1440 capture routinely leaves an 8 MB
 * PNG and arrives as a 200 KB WebP that a maintainer cannot tell apart. The
 * function is a no-op for anything already inside the budget, so a small
 * screenshot is uploaded byte-for-byte as the user took it — nothing is
 * re-encoded that did not need to be.
 *
 * ## The search
 *
 * Quality first, then resolution. Dropping quality on a screenshot costs very
 * little (the text stays crisp long past the point where a photograph would
 * smear), while halving the resolution is what actually makes small print
 * unreadable. So each round tries the quality ladder at the current size and
 * only steps the size down when the whole ladder has failed.
 */

/** Encoders we will re-encode *into*, best first. WebP keeps alpha; JPEG is the universal floor. */
const ENCODE_TYPES = ["image/webp", "image/jpeg"] as const;
const QUALITY_LADDER = [0.85, 0.72, 0.6, 0.45] as const;
/** Each round halves the longest edge. Three rounds takes 2560px to 320px, well past useful. */
const MAX_ROUNDS = 4;

export type CompressedImage = {
  /** The file to upload. The input itself when it already fit. */
  file: File;
  /** Whether anything was re-encoded, so the UI can say so rather than imply it. */
  compressed: boolean;
  /** The input's size, for a "4.8 MB → 210 KB" line. */
  originalBytes: number;
};

/**
 * Thrown when no combination of quality and scale gets under budget — in
 * practice only for input this function could not decode at all, since the
 * ladder bottoms out at a 320px JPEG.
 */
export class ImageCompressionError extends Error {
  constructor(
    message: string,
    readonly code: "UNREADABLE" | "TOO_LARGE",
  ) {
    super(message);
    this.name = "ImageCompressionError";
  }
}

export async function compressImage(
  file: File,
  {
    maxBytes = UPLOAD_MAX_BYTES,
    maxEdge = IMAGE_MAX_EDGE,
  }: { maxBytes?: number; maxEdge?: number } = {},
): Promise<CompressedImage> {
  const originalBytes = file.size;
  const source = await decode(file);

  // Two ways to already be fine: small enough, and not absurdly large on screen.
  // Both have to hold — a 12000px-wide capture that happens to compress well is
  // still worth resizing, because the backend stores what we send.
  const withinEdge = Math.max(source.width, source.height) <= maxEdge;

  if (originalBytes <= maxBytes && withinEdge) {
    close(source);
    return { file, compressed: false, originalBytes };
  }

  try {
    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      const edge = maxEdge / 2 ** round;
      const canvas = draw(source, edge);

      for (const type of ENCODE_TYPES) {
        for (const quality of QUALITY_LADDER) {
          const blob = await encode(canvas, type, quality);

          // A browser without WebP encoding silently hands back a PNG, which
          // ignores `quality` entirely — trying the rest of the ladder would
          // just re-encode the same bytes four times. Fall through to JPEG.
          if (!blob || blob.type !== type) break;

          if (blob.size <= maxBytes) {
            return {
              file: toFile(file, blob, type),
              compressed: true,
              originalBytes,
            };
          }
        }
      }
    }
  } finally {
    close(source);
  }

  throw new ImageCompressionError("Could not shrink the image enough.", "TOO_LARGE");
}

/* -------------------------------------------------------------------------- */
/* Decoding                                                                    */
/* -------------------------------------------------------------------------- */

type Decoded = ImageBitmap | HTMLImageElement;

/**
 * `createImageBitmap` where it exists, an `<img>` where it does not.
 *
 * The fallback is not hypothetical: Safari only grew `createImageBitmap` for
 * Blobs in 15, and a failed decode here would take the *whole attachment* down
 * — the user would be told their screenshot was unreadable when the browser
 * simply preferred the older path.
 */
async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the element path rather than failing outright.
    }
  }

  const url = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new ImageCompressionError("The image could not be read.", "UNREADABLE"));
      image.src = url;
    });
  } finally {
    // Safe once `onload` has fired: the decoded frame is retained by the
    // element, so the object URL has no further readers.
    URL.revokeObjectURL(url);
  }
}

function close(source: Decoded) {
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    source.close();
  }
}

function dimensions(source: Decoded) {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

/* -------------------------------------------------------------------------- */
/* Encoding                                                                    */
/* -------------------------------------------------------------------------- */

function draw(source: Decoded, maxEdge: number) {
  const { width, height } = dimensions(source);

  if (!width || !height) {
    throw new ImageCompressionError("The image has no dimensions.", "UNREADABLE");
  }

  // Never upscale: a 400px avatar asked to fit 2560px would be redrawn six
  // times larger and re-encoded, producing a bigger file than it started as.
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    throw new ImageCompressionError("Canvas is unavailable.", "UNREADABLE");
  }

  // JPEG has no alpha, and an unpainted canvas is transparent black — a
  // screenshot of a light UI with rounded corners would gain black edges. White
  // is the correct backdrop for the one format that forces a choice, and is
  // invisible under WebP, which keeps the alpha channel anyway.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  return canvas;
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function toFile(original: File, blob: Blob, type: string) {
  const extension = type === "image/webp" ? "webp" : "jpg";
  const base = original.name.replace(/\.[^./\\]+$/, "") || "screenshot";

  return new File([blob], `${base}.${extension}`, {
    type,
    lastModified: original.lastModified,
  });
}
