import Image from "next/image";

import { BRAND_NAME, BRAND_WORDMARK_CLASSES } from "@/constants/brand";

export type DwelveLogoVariant = "panel" | "form";

/**
 * New Dwelve brand mark — graduation cap over an open book (added in the latest logo set).
 * Navy version reads on light surfaces; white version reads on dark surfaces.
 */
const ICON_ON_LIGHT = "/logo/png/dwelve-logo-icon-512.png";
const ICON_ON_DARK = "/logo/png/dwelve-logo-icon-dark-512.png";

type DwelveLogoProps = {
  /**
   * "panel" — always on a dark surface (e.g. the auth left panel): white mark + white wordmark.
   * "form"  — adapts to theme: dark in light mode, white in dark mode. Use on nav, footer, sidebar, forms.
   */
  variant?: DwelveLogoVariant;
  className?: string;
};

export default function DwelveLogo({ variant = "panel", className = "" }: DwelveLogoProps) {
  const textClass =
    variant === "panel" ? "text-white" : "text-foreground";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Brand mark */}
      {variant === "panel" ? (
        <Image
          src={ICON_ON_DARK}
          alt=""
          aria-hidden
          width={36}
          height={36}
          className="h-9 w-9 shrink-0"
          priority
        />
      ) : (
        <>
          {/* Light mode → navy mark; dark mode → white mark. Pure CSS swap avoids hydration flicker. */}
          <Image
            src={ICON_ON_LIGHT}
            alt=""
            aria-hidden
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 dark:hidden"
          />
          <Image
            src={ICON_ON_DARK}
            alt=""
            aria-hidden
            width={36}
            height={36}
            className="hidden h-9 w-9 shrink-0 dark:block"
          />
        </>
      )}
      {/* Wordmark — Manrope 700 to match the delivered mark, independent of the UI face; style and size from brand constants. */}
      <span className={`${BRAND_WORDMARK_CLASSES} ${textClass}`}>
        {BRAND_NAME}
      </span>
    </div>
  );
}
