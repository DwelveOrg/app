import type { Metadata } from "next";
import { Manrope, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import "@/components/ui/toast.css";
import Providers from "./providers";
import Toaster from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

// Design-system fonts (docs/design-system.md §2–3):
// UI/body uses Manrope — the design system's sanctioned fallback when DM Sans Cyrillic is not
// confirmed by the build (Next's DM Sans ships no `cyrillic` subset, so it cannot render Russian).
// Manrope covers latin, latin-ext, and cyrillic for the trilingual UI.
// DM Serif Display is reserved for the Dwelve wordmark / controlled Latin-only marketing display.
const dwelveSans = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dwelve-sans",
  display: "swap",
});

const dwelveSerif = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-dwelve-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dwelve",
  description: "Dwelve is a digital academic testing and performance management platform built for schools and learning centers. It streamlines the entire assessment workflow — from test creation and submission to automated grading and performance analytics.",
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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", dwelveSans.variable, dwelveSerif.variable)}>
      <body
        className="bg-background text-foreground antialiased min-h-screen transition-colors"
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
