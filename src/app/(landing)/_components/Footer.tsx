"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";

import DwelveLogo from "@/components/Custom/DwelveLogo";
import { BRAND_NAME } from "@/constants/brand";
import { appHref } from "@/lib/hosts";

const SUPPORT_EMAIL = "support@dwelve.app";

/**
 * The site footer.
 *
 * It used to be two thin strips — a logo, three links, a copyright — while the
 * `landing.footer` catalog carried a dozen keys nobody rendered. That is the
 * shape a footer takes when it is treated as page furniture: it ends the
 * document without ending the argument, and it leaves someone who scrolled all
 * the way down with nowhere to go but back up.
 *
 * This one is a map. A brand column that says what Dwelve is and hands over a
 * real way to reach a human, then the page's own sections as columns, so the
 * footer is the second navigation for anyone who reached the bottom without
 * finding what they came for.
 *
 * **Every destination here exists.** The catalog also offers `pricing`,
 * `helpCenter`, `teacherDashboard` and `studentAccess`; those have no routes
 * yet, and a footer link to a 404 is worse than an absent one, so they stay
 * unrendered until the pages are real.
 */

type FooterLink = { key: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "landing.footer.product",
    links: [
      // Nav keys throughout, not the `footer.*` twins: `footer.howItWorks` is
      // title case ("How It Works") while every other label on this page is
      // sentence case, and a column that mixes the two reads as a typo.
      { key: "landing.nav.aiDrafting", href: "#ai-generation" },
      { key: "landing.nav.features", href: "#features" },
      { key: "landing.nav.howItWorks", href: "#how-it-works" },
      { key: "landing.nav.analytics", href: "#analytics" },
    ],
  },
  {
    title: "landing.footer.quickLinks",
    links: [
      { key: "landing.footer.home", href: "#home" },
      { key: "landing.nav.accordion", href: "#accordion" },
      { key: "landing.nav.login", href: appHref("/login") },
      { key: "landing.nav.signup", href: appHref("/signup") },
    ],
  },
  {
    title: "landing.footer.support",
    links: [
      { key: "landing.footer.contact", href: `mailto:${SUPPORT_EMAIL}`, external: true },
      {
        key: "landing.footer.privacy",
        href: `mailto:${SUPPORT_EMAIL}?subject=Privacy`,
        external: true,
      },
      {
        key: "landing.footer.terms",
        href: `mailto:${SUPPORT_EMAIL}?subject=Terms`,
        external: true,
      },
    ],
  },
];

const LINK_CLASS =
  "rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Brand column, then the page's own map. The brand column takes the
            wider track because it carries prose; the link columns are lists and
            want to stay narrow enough to scan in one glance. */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))] lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label={t("landing.footer.home")}
              className="inline-flex w-fit rounded-md outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <DwelveLogo variant="form" />
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("landing.footer.description")}
            </p>

            {/* A real address rather than a "Contact us" that opens a form: the
                product has no support desk yet, and a mailto is the honest
                version of the promise. */}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-5 inline-flex items-center gap-2 rounded-md text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Mail aria-hidden className="size-4" />
              {SUPPORT_EMAIL}
            </a>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={t(column.title)}>
              <h2 className="type-micro text-foreground">{t(column.title)}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.key}>
                    {link.external ? (
                      <a href={link.href} className={LINK_CLASS}>
                        {t(link.key)}
                      </a>
                    ) : (
                      <Link href={link.href} className={LINK_CLASS}>
                        {t(link.key)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-border/60 py-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {`© ${year} ${BRAND_NAME}. ${t("landing.footer.rights")}`}
          </span>
          <span className="text-xs text-muted-foreground">{t("landing.main.badge")}</span>
        </div>
      </div>
    </footer>
  );
}
