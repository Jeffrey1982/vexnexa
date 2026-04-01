"use client";

import { BarChart3, FileText, Monitor, Users } from "lucide-react";
import { useTranslations } from "next-intl";

const icons = [BarChart3, FileText, Monitor, Users] as const;

export function HomeFeaturesPremium() {
  const t = useTranslations("home.features");
  const keys = ["automation", "reports", "monitoring", "team"] as const;

  return (
    <section
      className="py-20 lg:py-28"
      aria-labelledby="features-premium-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2
            id="features-premium-heading"
            className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t("title")}
          </h2>
        </div>
        <ul className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {keys.map((key, i) => {
            const Icon = icons[i];
            return (
              <li key={key}>
                <article
                  className="h-full rounded-2xl border border-border/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-primary/30 hover:shadow-md dark:border-white/10 dark:bg-card/60"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/20 dark:to-white/5">
                    <Icon className="h-6 w-6 text-primary" aria-hidden />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {t(`${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`${key}.description`)}
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
