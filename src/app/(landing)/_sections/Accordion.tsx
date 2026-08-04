"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LANDING_HEADING } from "../_components/SectionHeading";
import { surfaceVariants } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

export default function LandingAccordion() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const items = [
    {
      key: "item1",
      question: t("landing.accordion.item1.question"),
      answer: t("landing.accordion.item1.answer"),
    },
    {
      key: "item2",
      question: t("landing.accordion.item2.question"),
      answer: t("landing.accordion.item2.answer"),
    },
    {
      key: "item3",
      question: t("landing.accordion.item3.question"),
      answer: t("landing.accordion.item3.answer"),
    },
    {
      key: "item4",
      question: t("landing.accordion.item4.question"),
      answer: t("landing.accordion.item4.answer"),
    },
    {
      key: "item5",
      question: t("landing.accordion.item5.question"),
      answer: t("landing.accordion.item5.answer"),
    },
    {
      key: "item6",
      question: t("landing.accordion.item6.question"),
      answer: t("landing.accordion.item6.answer"),
    },
    {
      key: "item7",
      question: t("landing.accordion.item7.question"),
      answer: t("landing.accordion.item7.answer"),
    },
    {
      key: "item8",
      question: t("landing.accordion.item8.question"),
      answer: t("landing.accordion.item8.answer"),
    },
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <section id="accordion" className="w-full scroll-mt-24 py-20">
      <motion.div
        className="mx-auto w-full max-w-5xl px-4"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div className="mb-10 text-center" variants={itemVariants}>
          <h2 className={LANDING_HEADING}>
            {t("landing.accordion.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            {t("landing.accordion.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className={cn(surfaceVariants({ padding: "none", elevation: 3 }), "px-5 py-2")}
          variants={itemVariants}
        >
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
              <motion.div
                key={item.key}
                variants={{
                  hidden: { opacity: 0, x: shouldReduceMotion ? 0 : index % 2 === 0 ? -10 : 10 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.3, delay: shouldReduceMotion ? 0 : index * 0.04 } },
                }}
              >
                <AccordionItem value={item.key}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </motion.div>
    </section>
  );
}
