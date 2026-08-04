"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { Building2, GraduationCap, Smartphone, type LucideIcon } from "lucide-react";

import SectionHeading from "../_components/SectionHeading";
import { surfaceVariants } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

type Role = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** The teacher card is the primary user — highlighted to break grid uniformity. */
  featured?: boolean;
};

export default function Roles() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const roles: Role[] = [
    {
      icon: Building2,
      title: t("landing.roles.adminTitle"),
      description: t("landing.roles.adminDesc"),
    },
    {
      icon: GraduationCap,
      title: t("landing.roles.teacherTitle"),
      description: t("landing.roles.teacherDesc"),
      featured: true,
    },
    {
      icon: Smartphone,
      title: t("landing.roles.studentTitle"),
      description: t("landing.roles.studentDesc"),
    },
  ];

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1, delayChildren: 0.05 } },
  };
  const card = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section
      id="roles"
      className="w-full scroll-mt-24 border-y border-border/70 bg-muted/45 py-20 md:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeading
          title={t("landing.roles.title")}
          subtitle={t("landing.roles.subtitle")}
        />

        <motion.div
          className="mt-14 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.article
                key={role.title}
                variants={card}
                className={
                  role.featured
                    ? "relative overflow-hidden rounded-2xl bg-gradient-to-b from-brand-violet-300 to-brand-violet-600 p-7 text-white shadow-elev-brand lg:-translate-y-3"
                    : cn(
                        surfaceVariants({ padding: "none" }),
                        "p-7 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-elev-3",
                      )
                }
              >
                {role.featured ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
                  />
                ) : null}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
 role.featured
 ?"bg-white/15 text-white"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3
                  className={`mt-5 text-lg font-bold ${role.featured ?"text-white" : "text-foreground"}`}
                >
                  {role.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
 role.featured ?"text-white/85" : "text-muted-foreground"
                  }`}
                >
                  {role.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
