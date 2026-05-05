import Link from 'next/link'
import { ArrowRight, CheckCircle2, Code2, Gauge, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { BlogSeoLocale } from '@/lib/blog-seo'
import {
  DIGITAL_ACCESSIBILITY_PIVOT_SLUG,
  getStaticBlogPost,
  staticBlogSourceLinks,
} from '@/lib/static-blog-posts'

type DigitalAccessibilityPivotArticleProps = {
  locale?: BlogSeoLocale
}

export function DigitalAccessibilityPivotArticle({
  locale = 'nl',
}: DigitalAccessibilityPivotArticleProps) {
  const post = getStaticBlogPost(DIGITAL_ACCESSIBILITY_PIVOT_SLUG, locale)

  if (!post) return null

  return (
    <main className="bg-background">
      <section className="border-b border-border/60 bg-[linear-gradient(180deg,hsl(var(--muted))_0%,hsl(var(--background))_100%)]">
        <div className="container mx-auto px-4 py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-4xl">
              <Badge variant="outline" className="bg-background/80">
                {post.badge}
              </Badge>
              <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {post.h1}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {post.intro}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/contact?subject=white-label-demo">
                    {post.primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href="/white-label-accessibility-reports">{post.secondaryCta}</Link>
                </Button>
              </div>
            </div>

            <aside className="rounded-lg border border-border bg-background p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{post.riskTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.riskText}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <article className="container mx-auto px-4 py-14 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-14">
            {post.sections.slice(0, 2).map((section) => (
              <section key={section.heading} className="space-y-5">
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  {section.heading}
                </h2>
                <div className="space-y-4 text-base leading-8 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section className="space-y-6" aria-labelledby="comparison-table">
              <div>
                <Badge variant="secondary">{post.comparisonBadge}</Badge>
                <h2 id="comparison-table" className="mt-3 font-display text-3xl font-bold tracking-tight">
                  {post.comparisonTitle}
                </h2>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="grid grid-cols-[1fr_1.25fr_1.25fr] border-b border-border bg-muted/50 text-sm font-semibold text-foreground">
                  <div className="p-4">{post.comparisonHeaders.dimension}</div>
                  <div className="border-l border-border p-4">{post.comparisonHeaders.overlays}</div>
                  <div className="border-l border-border p-4">{post.comparisonHeaders.vexnexa}</div>
                </div>
                {post.comparisonRows.map((row) => (
                  <div key={row.dimension} className="grid grid-cols-1 border-b border-border last:border-b-0 md:grid-cols-[1fr_1.25fr_1.25fr]">
                    <div className="bg-muted/25 p-4 text-sm font-semibold text-foreground md:bg-transparent">
                      {row.dimension}
                    </div>
                    <div className="flex gap-3 border-t border-border p-4 text-sm leading-6 text-muted-foreground md:border-l md:border-t-0">
                      <XCircle className="mt-0.5 h-4 w-4 flex-none text-destructive" aria-hidden="true" />
                      <span>{row.overlays}</span>
                    </div>
                    <div className="flex gap-3 border-t border-border p-4 text-sm leading-6 text-muted-foreground md:border-l md:border-t-0">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-teal-600" aria-hidden="true" />
                      <span>{row.vexnexa}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {post.sections.slice(2).map((section) => (
              <section key={section.heading} className="space-y-5">
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  {section.heading}
                </h2>
                <div className="space-y-4 text-base leading-8 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-lg border border-border bg-card p-6 shadow-sm lg:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-bold">{post.advantageTitle}</h3>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                    {post.advantageText}
                  </p>
                </div>
                <Button asChild className="flex-none">
                  <Link href="/contact?subject=white-label-demo">
                    {post.primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="font-semibold text-foreground">{post.sidebarTitle}</h2>
              <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
                {post.sidebarItems.map((item, index) => {
                  const Icon = index === 0 ? Code2 : index === 1 ? Gauge : ShieldCheck
                  return (
                    <div key={item} className="flex gap-3">
                      <Icon className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-5">
              <h2 className="font-semibold text-foreground">{post.sourcesTitle}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6">
                {staticBlogSourceLinks.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground underline underline-offset-4 hover:text-primary"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </article>
    </main>
  )
}
