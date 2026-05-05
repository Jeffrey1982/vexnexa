import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BlogPostPage, { generateMetadata as generateBlogPostMetadata } from '@/app/blog/[slug]/page'
import { AuditMonitoringArticle } from '@/components/blog/AuditMonitoringArticle'
import { DigitalAccessibilityPivotArticle } from '@/components/blog/DigitalAccessibilityPivotArticle'
import { isBlogSeoLocale } from '@/lib/blog-seo'
import {
  AUDIT_MONITORING_2026_SLUG,
  getAuditMonitoringMetadata,
} from '@/lib/audit-monitoring-static-post'
import { getStaticBlogMetadata, isStaticBlogSlug } from '@/lib/static-blog-posts'

type LocalizedBlogPageProps = {
  params: Promise<{
    locale: string
    slug: string
  }>
}

export const revalidate = 3600

export async function generateMetadata({ params }: LocalizedBlogPageProps): Promise<Metadata> {
  const { locale, slug } = await params

  if (!isBlogSeoLocale(locale)) {
    return generateBlogPostMetadata({ params })
  }

  if (isStaticBlogSlug(slug)) {
    return getStaticBlogMetadata(slug, locale)
  }

  if (slug === AUDIT_MONITORING_2026_SLUG) {
    return getAuditMonitoringMetadata(locale)
  }

  return generateBlogPostMetadata({ params })
}

export default async function LocalizedBlogPage({ params }: LocalizedBlogPageProps) {
  const resolvedParams = await params

  if (!isBlogSeoLocale(resolvedParams.locale)) {
    notFound()
  }

  if (isStaticBlogSlug(resolvedParams.slug)) {
    return <DigitalAccessibilityPivotArticle locale={resolvedParams.locale} />
  }

  if (resolvedParams.slug === AUDIT_MONITORING_2026_SLUG) {
    return <AuditMonitoringArticle locale={resolvedParams.locale} />
  }

  return <BlogPostPage params={Promise.resolve(resolvedParams)} />
}
