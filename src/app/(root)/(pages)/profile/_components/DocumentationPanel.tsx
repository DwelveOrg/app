"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccountGroup } from "./AccountGroup";

/**
 * The documentation half of the Support tab.
 *
 * This panel used to hold four paragraphs describing what Dwelve is — "a web
 * platform for creating, delivering and grading school assessments in one
 * place". That is the marketing site's copy, addressed to someone deciding
 * whether to adopt the product, shown to a teacher who is already signed in and
 * using it. It answered no question anyone arrives at Support with, offered
 * nothing to click, and read as an undifferentiated slab beside a column of
 * neat actionable rows.
 *
 * What replaces it is documentation in the ordinary sense: the questions people
 * actually ask, each with a short and *true* answer. Collapsed, the panel is a
 * table of contents — you can see at a glance whether the thing you came for is
 * here, which is the one job four paragraphs of prose cannot do.
 *
 * Same chrome as its neighbour on purpose (`AccountGroup`: a quiet label over a
 * single flat panel of hairline-separated rows). The two columns are
 * alternatives to each other — ask a person, or read the answer — so they
 * should read as peers rather than as a list next to a brochure.
 *
 * The first topic opens by default. A panel of seven closed rows reads as
 * something that failed to load; one open answer shows what a row contains.
 */
type DocTopic = {
  id: string;
  /** Literal key paths — never assembled, so `t("…")` stays greppable. */
  question: string;
  answer: string;
  /**
   * Where an answer implies somewhere to go. Only routes every role has in the
   * sidebar: `/tests` and `/assignments` split by role, so linking either one
   * would dead-end half the audience.
   */
  link?: { href: string; label: string };
};

const TOPICS: readonly DocTopic[] = [
  {
    id: "schools",
    question: "root.settings.documentation.topics.schools.question",
    answer: "root.settings.documentation.topics.schools.answer",
  },
  {
    id: "classes",
    question: "root.settings.documentation.topics.classes.question",
    answer: "root.settings.documentation.topics.classes.answer",
    link: { href: "/groups", label: "root.settings.documentation.topics.classes.link" },
  },
  {
    id: "authoring",
    question: "root.settings.documentation.topics.authoring.question",
    answer: "root.settings.documentation.topics.authoring.answer",
  },
  {
    id: "attempts",
    question: "root.settings.documentation.topics.attempts.question",
    answer: "root.settings.documentation.topics.attempts.answer",
  },
  {
    id: "results",
    question: "root.settings.documentation.topics.results.question",
    answer: "root.settings.documentation.topics.results.answer",
  },
  {
    id: "preferences",
    question: "root.settings.documentation.topics.preferences.question",
    answer: "root.settings.documentation.topics.preferences.answer",
    link: {
      href: "/profile?tab=preferences",
      label: "root.settings.documentation.topics.preferences.link",
    },
  },
  {
    id: "problems",
    question: "root.settings.documentation.topics.problems.question",
    answer: "root.settings.documentation.topics.problems.answer",
  },
];

export function DocumentationPanel() {
  const { t } = useTranslation();

  return (
    <AccountGroup label={t("root.settings.documentation.title")}>
      {/*
        `AccountGroup` renders a `Surface divided`, whose `divide-y` separates
        direct children — and an accordion is one child. The hairlines therefore
        come from `AccordionItem`'s own `border-b`, cleared on the last row so
        the list does not draw a rule against the panel's bottom edge.
      */}
      <Accordion type="single" collapsible defaultValue={TOPICS[0]?.id}>
        {TOPICS.map((topic) => (
          <AccordionItem key={topic.id} value={topic.id} className="last:border-b-0">
            {/* Inset rather than outset: the surface clips overflow, so a ring
                drawn outside the trigger loses its left and right edges. */}
            <AccordionTrigger className="rounded-none px-4 py-4 focus-visible:ring-inset sm:px-5 [&>svg]:text-muted-foreground">
              {/* The size lives on the child, not on the trigger, so the panel
                  matches `ListRow`'s title without fighting the primitive's own
                  `text-base` for specificity. */}
              <span className="type-label font-semibold">{t(topic.question)}</span>
            </AccordionTrigger>

            <AccordionContent className="px-4 pb-4 sm:px-5">
              <p className="max-w-[68ch] text-13 leading-5 text-muted-foreground">
                {t(topic.answer)}
              </p>

              {topic.link ? (
                <Button asChild variant="link" size="sm" className="mt-2 h-auto px-0">
                  <Link href={topic.link.href}>
                    {t(topic.link.label)}
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </AccountGroup>
  );
}
