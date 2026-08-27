# Vercel Upload Ceiling

## Context

Backend limits once advertised 8 MB screenshots and 20 MB PDFs, while browser uploads pass through a
Next.js Server Action deployed as a Vercel function.

## Knowledge

Vercel rejects the entire request above approximately 4.5 MB before Next.js or NestJS runs.
`next.config.ts` mirrors that limit locally. `src/lib/uploads/limits.ts` reserves multipart headroom
by limiting a file to 4,000,000 bytes; image workflows use `compressImage` before submission. A
higher backend Multer limit does not make a larger browser-to-Server-Action upload reachable.

## Relevant files

- `next.config.ts`
- `src/lib/uploads/limits.ts`
- `src/lib/uploads/compressImage.ts`

## Implications

Keep local and deployed behavior aligned. New browser uploads must fit the transport envelope or use
a different architecture such as a direct signed upload; simply raising Next/backend limits is not a
fix. Product problem reports are now text-only and no longer pass through this upload path.
