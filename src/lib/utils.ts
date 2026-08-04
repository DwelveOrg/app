import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Up to two leading letters of a person's or organization's name, for avatars.
 *
 * Uses `Array.from` rather than `[0]` so it takes a whole code point: a name starting with a
 * surrogate pair or a combining mark would otherwise be sliced into a broken glyph. Falls back to
 * "?" so an avatar is never empty.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .slice(0, 2)

  return initials.toUpperCase() || "?"
}
