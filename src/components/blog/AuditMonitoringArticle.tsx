import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { BlogSeoLocale } from '@/lib/blog-seo'
import { AUDIT_MONITORING_2026_SLUG, auditMonitoringSources, getAuditMonitoringPost } from '@/lib/audit-monitoring-static-post'

type AuditMonitoringArticleProps = {
  locale?: BlogSeoLocale
}

export function AuditMonitoringArticle({ locale = 'nl' }: AuditMonitoringArticleProps) {
  const post = getAuditMonitoringPost(locale)

  return (
    <main className="bg-background">
      <section className="border-b border-border/60 bg-[linear-gradient(180deg,hsl(var(--muted))_0%,hsl(var(--background))_100%)]">
        <div className="container mx-auto px-4 py-14 lg:py-20">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-8 gap-2 text-muted-foreground">
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Blog
            </Link>
          </Button>
          <div className="max-w-4xl">
            <Badge variant="outline" className="bg-background/80">{post.badge}</Badge>
            <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{post.intro}</p>
            <p className="mt-5 text-sm font-medium text-primary">{post.readTime}</p>
          </div>
        </div>
      </section>

      <article className="container mx-auto px-4 py-14 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-14">
            {post.sections.map((section) => (
              <section key={section.heading} className="space-y-5">
                <h2 className="font-display text-3xl font-bold tracking-tight">{section.heading}</h2>
                <div className="space-y-4 text-base leading-8 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets && (
                  <ul className="grid gap-3 rounded-lg border border-border bg-muted/30 p-5 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.image && (
                  <figure className="rounded-lg border border-border bg-card p-5 shadow-sm">
                    <div className="flex gap-3">
                      <ImageIcon className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
                      <div>
                        <figcaption className="font-medium text-foreground">Beeldsuggestie</figcaption>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.image.prompt}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          Alt-tekst: {section.image.alt}
                        </p>
                      </div>
                    </div>
                  </figure>
                )}
              </section>
            ))}

            <section className="space-y-6" aria-labelledby="twelve-month-plan">
              <h2 id="twelve-month-plan" className="font-display text-3xl font-bold tracking-tight">
                {post.checklistTitle}
              </h2>
              <div className="grid gap-4">
                {post.checklist.map((phase) => (
                  <div key={phase.phase} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                    <h3 className="font-semibold text-foreground">{phase.phase}</h3>
                    <ul className="mt-4 grid gap-2 text-sm leading-6 text-muted-foreground">
                      {phase.items.map((item) => (
                        <li key={item} className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <figure className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex gap-3">
                  <ImageIcon className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
                  <div>
                    <figcaption className="font-medium text-foreground">Beeldsuggestie</figcaption>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Simpele roadmap-infographic met drie fases: 0-3 maanden, 3-6 maanden en 6-12 maanden, elk met een eigen icoon en checklist.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Alt-tekst: Roadmap met drie fases voor audit, monitoring en governance.
                    </p>
                  </div>
                </div>
              </figure>
            </section>

            <section className="rounded-lg border border-border bg-card p-6 shadow-sm lg:p-8">
              <h2 className="font-display text-2xl font-bold">{post.ctaTitle}</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{post.ctaText}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/features">
                    Bekijk monitoringmogelijkheden
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/sample-report">Bekijk voorbeeldrapport</Link>
                </Button>
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="font-semibold text-foreground">{post.sourcesTitle}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6">
                {auditMonitoringSources.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex gap-1.5 text-muted-foreground underline underline-offset-4 hover:text-primary"
                    >
                      {source.label}
                      <ExternalLink className="mt-1 h-3.5 w-3.5 flex-none" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.metaDescription,
            author: {
              '@type': 'Organization',
              name: 'VexNexa',
            },
            publisher: {
              '@type': 'Organization',
              name: 'VexNexa',
              logo: {
                '@type': 'ImageObject',
                url: 'https://vexnexa.com/brand/vexnexa-v-mark.png',
              },
            },
            mainEntityOfPage: `https://vexnexa.com/blog/${AUDIT_MONITORING_2026_SLUG}`,
          }),
        }}
      />
    </main>
  )
}
