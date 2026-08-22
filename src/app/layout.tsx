import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif, Manrope } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import "@/components/ui/toast.css";
import Providers from "./providers";
import Toaster from "@/components/ui/toaster";
import { BRAND_NAME } from "@/constants/brand";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";

/*
 * One family, three voices — IBM Plex.
 *
 * The product previously ran Manrope for everything plus DM Serif Display for a single headline.
 * Manrope is a soft geometric grotesque with rounded terminals and near-circular bowls; it is
 * pleasant, it is everywhere, and it is the default warmth that makes an interface read as
 * template rather than as product. A trilingual assessment platform used by teachers under time
 * pressure is not a friendly-startup object.
 *
 * Plex is the opposite premise: it was drawn for technical and institutional contexts, its
 * letterforms carry visible engineering (the flat-sided bowls, the clipped `a`, the true italic),
 * and — the part that decides it — Sans, Mono and Serif are one design, so the UI, the numerals
 * and the display face agree with each other instead of being three unrelated picks. A complete
 * type system is itself the signal that someone chose, rather than assembled.
 *
 * All three carry `cyrillic`, which is not optional here: the UI ships in en / ru / uz.
 *
 *   Sans   — every interface surface.
 *   Mono   — scores, durations, codes, counts, timestamps, the `type-micro` label. See the
 *            `--font-mono` mapping and the `numeric` utility in globals.css. Tabular figures in a
 *            grading product are correctness, not decoration: a column of marks that shifts width
 *            per digit is harder to scan and easier to misread.
 *   Serif  — the auth panel headline and controlled marketing display, the one place the page is
 *            addressing a person rather than presenting data.
 */
const dwelveSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dwelve-sans",
  display: "swap",
});

const dwelveMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-dwelve-mono",
  display: "swap",
});

const dwelveSerif = IBM_Plex_Serif({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-dwelve-serif",
  display: "swap",
});

/*
 * Manrope 700, kept for ONE word.
 *
 * The wordmark in `DwelveLogo` is live text set beside a raster cube, and the delivered artwork's
 * lettering is a bold geometric sans. So the wordmark is not a typographic choice that follows the
 * UI face — it is part of the lockup, and it has to keep matching a mark that CSS cannot restyle.
 * Moving the UI to Plex silently redrew the logo until this was pinned.
 *
 * Costs almost nothing: one weight, `latin` only, and the only string it ever renders is "Dwelve".
 */
const dwelveWordmark = Manrope({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-dwelve-wordmark",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: BRAND_NAME,
  title: {
    default: HOME_TITLE,
    template: `%s | ${BRAND_NAME}`,
  },
  description: HOME_DESCRIPTION,
  category: "education",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/logo/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/logo/app-icons/apple-touch-icon.png",
  },
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans",
        dwelveSans.variable,
        dwelveMono.variable,
        dwelveSerif.variable,
        dwelveWordmark.variable,
      )}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* Toaster lives inside Providers so it can read the resolved theme. */}
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
