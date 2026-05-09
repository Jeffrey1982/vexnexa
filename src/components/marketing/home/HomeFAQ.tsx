"use client";

import { useTranslations } from "next-intl";
import { FAQ } from "@/components/marketing/FAQ";

export function HomeFAQ() {
  const t = useTranslations("home.faqSection");

  const faqItems = [
    { question: t("q1.question"), answer: t("q1.answer") },
    { question: t("q2.question"), answer: t("q2.answer") },
    { question: t("q3.question"), answer: t("q3.answer") },
    { question: t("q4.question"), answer: t("q4.answer") },
    { question: t("q5.question"), answer: t("q5.answer") },
    { question: t("q6.question"), answer: t("q6.answer") },
  ];

  return <FAQ items={faqItems} />;
}
