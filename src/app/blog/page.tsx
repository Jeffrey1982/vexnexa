import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Clock3,
  Layers3,
  PenLine,
  Sparkles,
} from 'lucide-react'
import type { BlogPost } from '@prisma/client'
import { SafeImage } from '@/components/SafeImage'
import { cookies } from 'next/headers'
import type { Locale } from '@/i18n'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'

type BlogPostWithAuthor = BlogPost & {
  author: {
    firstName: string | null
    lastName: string | null
  }
}

function getAuthorName(post: BlogPostWithAuthor) {
  if (post.authorName) return post.authorName

  const fullName = [post.author?.firstName, post.author?.lastName]
    .filter(Boolean)
    .join(' ')

  return fullName || 'VexNexa Team'
}

function getReadingMinutes(content: string | null) {
  if (!content) return 1

  const plainText = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!plainText) return 1

  return Math.max(1, Math.ceil(plainText.split(' ').length / 220))
}

function formatDate(value: Date | null, locale: Locale, options: Intl.DateTimeFormatOptions) {
  if (!value) return ''

  return new Intl.DateTimeFormat(locale, options).format(value)
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog')

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: {
      title: t('metadata.title'),
      description: t('metadata.description'),
      url: 'https://vexnexa.com/blog',
    },
    twitter: {
      card: 'summary',
      title: t('metadata.title'),
      description: t('metadata.description'),
    },
    alternates: {
      canonical: 'https://vexnexa.com/blog',
    },
  }
}

export const revalidate = 3600
export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || 'en'
  const t = await getTranslations('blog')

  let posts = await prisma.blogPost.findMany({
    where: {
      status: 'published',
      locale,
    },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
  })

  if (posts.length === 0) {
    posts = await prisma.blogPost.findMany({
      where: {
        status: 'published',
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    })
  }

  const featuredPost = posts[0]
  const otherPosts = posts.slice(1)
  const categories = Array.from(
    new Set(posts.map((post) => post.category).filter(Boolean))
  )

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border/60 bg-[linear-gradient(180deg,hsl(var(--muted))_0%,hsl(var(--background))_100%)]">
        <div className="container mx-auto px-4 py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-4xl">
              <Badge variant="outline" className="bg-background/80">
                {t('badge')}
              </Badge>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {t('title')}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                {t('subtitle')}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/auth/register">
                    {t('heroCtaPrimary')}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/sample-report">{t('heroCtaSecondary')}</Link>
                </Button>
              </div>
            </div>

            <aside className="rounded-lg border border-border bg-background p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t('editorialCard.title')}</p>
                  <p className="text-sm text-muted-foreground">{t('editorialCard.subtitle')}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-2xl font-bold text-foreground">{posts.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('postsPublished')}</p>
                </div>
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-2xl font-bold text-foreground">{categories.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('categoriesTracked')}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl space-y-14">
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm lg:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <Badge variant="secondary">{t('resourceSpotlight.badge')}</Badge>
                <h2 className="mt-4 max-w-3xl font-display text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  The Digital Accessibility Pivot: Why Overlays are Failing in 2026
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground lg:text-base lg:leading-7">
                  {t('resourceSpotlight.description')}
                </p>
              </div>
              <Button asChild>
                <Link href="/blog/the-digital-accessibility-pivot">
                  {t('resourceSpotlight.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </section>

          {posts.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-8 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpenText className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">{t('emptyTitle')}</h2>
              <p className="mt-3 text-muted-foreground">{t('empty')}</p>
            </div>
          ) : (
            <>
              {featuredPost && (
                <section aria-labelledby="featured-blog-post">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-primary">{t('featuredLabel')}</p>
                      <h2 id="featured-blog-post" className="mt-1 font-display text-2xl font-bold">
                        {t('latestArticle')}
                      </h2>
                    </div>
                    <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                      <Link href={`/blog/${featuredPost.slug}`}>
                        {t('readArticle')}
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="group grid overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-[1.08fr_0.92fr]"
                  >
                    <div className="relative min-h-[280px] overflow-hidden bg-muted sm:min-h-[360px] lg:min-h-[460px]">
                      {featuredPost.coverImage ? (
                        <>
                          <SafeImage
                            src={featuredPost.coverImage}
                            alt={featuredPost.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 via-transparent to-transparent" />
                        </>
                      ) : (
                        <div className="flex h-full min-h-[280px] items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.16),transparent_34%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]">
                          <BookOpenText className="h-16 w-16 text-primary/70" aria-hidden="true" />
                        </div>
                      )}
                      <Badge className="absolute left-5 top-5 bg-background text-foreground hover:bg-background">
                        {featuredPost.category || t('fallbackCategory')}
                      </Badge>
                    </div>

                    <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                          {formatDate(featuredPost.publishedAt, locale, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="h-4 w-4" aria-hidden="true" />
                          {getReadingMinutes(featuredPost.content)} {t('minRead')}
                        </span>
                      </div>

                      <h3 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight transition-colors group-hover:text-primary lg:text-4xl">
                        {featuredPost.title}
                      </h3>

                      {featuredPost.excerpt && (
                        <p className="mt-5 text-base leading-7 text-muted-foreground line-clamp-3 lg:text-lg">
                          {featuredPost.excerpt}
                        </p>
                      )}

                      <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-5">
                        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <PenLine className="h-4 w-4" aria-hidden="true" />
                          {t('writtenBy')} {getAuthorName(featuredPost)}
                        </span>
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:translate-x-1">
                          <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </section>
              )}

              {otherPosts.length > 0 && (
                <section aria-labelledby="all-blog-posts">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary">{t('browseAll')}</p>
                      <h2 id="all-blog-posts" className="mt-1 font-display text-2xl font-bold">
                        {t('allArticles')}
                      </h2>
                    </div>

                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {categories.slice(0, 4).map((category) => (
                          <Badge key={category} variant="secondary" className="gap-1.5">
                            <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {otherPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                          {post.coverImage ? (
                            <SafeImage
                              src={post.coverImage}
                              alt={post.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]">
                              <BookOpenText className="h-10 w-10 text-primary/70" aria-hidden="true" />
                            </div>
                          )}
                          <Badge variant="secondary" className="absolute left-4 top-4 bg-background/95">
                            {post.category || t('fallbackCategory')}
                          </Badge>
                        </div>

                        <article className="flex flex-1 flex-col p-5">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              {formatDate(post.publishedAt, locale, {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                            <span aria-hidden="true">-</span>
                            <span>
                              {getReadingMinutes(post.content)} {t('minRead')}
                            </span>
                          </div>

                          <h3 className="mt-3 font-display text-xl font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary">
                            {post.title}
                          </h3>

                          {post.excerpt && (
                            <p className="mt-3 text-sm leading-6 text-muted-foreground line-clamp-3">
                              {post.excerpt}
                            </p>
                          )}

                          <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                            <span className="text-xs text-muted-foreground">
                              {getAuthorName(post)}
                            </span>
                            <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}
