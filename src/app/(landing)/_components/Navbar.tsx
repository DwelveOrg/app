"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";

import DwelveLogo from "@/components/Custom/DwelveLogo";
import Button from "@/components/ui/Button";
import { appHref } from "@/lib/hosts";
import { cn } from "@/lib/utils";

/** In-page anchors the nav scrolls to, in document order. `target` matches the `id` on each landing section. */
const NAV_ITEMS = [
  { key: "landing.nav.aiDrafting", target: "ai-generation" },
  { key: "landing.nav.features", target: "features" },
  { key: "landing.nav.howItWorks", target: "how-it-works" },
  { key: "landing.nav.analytics", target: "analytics" },
  { key: "landing.nav.accordion", target: "accordion" },
] as const;

/** Stable reference for the scroll-spy observer (must not be re-created each render). */
const SECTION_IDS = NAV_ITEMS.map((item) => item.target);

/** True once the page leaves the hero edge — fades in a hairline divider under the bar. */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

/** Scroll-spy: returns the id of the section currently crossing the viewport's centre band, or null. */
function useActiveSection(targets: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // First visible section in document order, so the indicator never flickers
        // between two sections that briefly share the band.
        setActive(targets.find((id) => visible.has(id)) ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );

    const els = targets
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [targets]);

  return active;
}

export default function Navbar() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const scrolled = useScrolled();
  const active = useActiveSection(SECTION_IDS);

  const scrollToSection = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    },
    [reduceMotion],
  );

  const underlineTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 38 };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className={cn(
          "border-b transition-colors duration-300",
          scrolled
            ? "border-border/60 bg-background/70 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          {/* Brand mark */}
          <div className="flex items-center justify-self-start">
            <Link
              href="/"
              aria-label={t("landing.footer.home")}
              className="rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <DwelveLogo variant="form" />
            </Link>
          </div>

          {/* Section links — hidden on narrow screens (no menu fallback, by design) */}
          <nav className="hidden lg:flex lg:justify-center" aria-label={t("landing.footer.quickLinks")}>
            <LayoutGroup>
              <ul className="flex items-center gap-7">
                {NAV_ITEMS.map((item) => {
                  const isActive = active === item.target;
                  return (
                    <li key={item.target}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(item.target)}
                        aria-current={isActive ? "true" : undefined}
                        className={cn(
                          "relative cursor-pointer py-1 text-sm font-medium tracking-tight outline-none transition-colors focus-visible:text-foreground",
                          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t(item.key)}
                        {isActive && (
                          <motion.span
                            layoutId="landing-nav-underline"
                            transition={underlineTransition}
                            className="absolute -bottom-1 left-0 right-0 h-px bg-foreground"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </LayoutGroup>
          </nav>

          {/* Actions */}
          <div className="flex items-center justify-self-end gap-2 sm:gap-3">
            <Button asChild variant="outline" size="lg">
            <Link href={appHref("/login")}>
              {t("landing.nav.login")}
            </Link>
          </Button>
            <Button asChild variant="brand" size="lg">
            <Link href={appHref("/signup")}>
              {t("landing.nav.signup")}
            </Link>
          </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
