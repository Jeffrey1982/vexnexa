import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ShareButtons } from '@/components/blog/ShareButtons'
import { BlogContent } from '@/components/blog/BlogContent'
import { SafeImage } from '@/components/SafeImage'
import { cookies } from 'next/headers'
import type { Locale } from '@/i18n'
import { BlogLanguageSelector } from '@/components/blog/BlogLanguageSelector'

// Helper to extract base slug (remove language suffix)
function getBaseSlug(slug: string): string {
  const suffixes = ['-en', '-nl', '-fr', '-es', '-pt'];
  for (const suffix of suffixes) {
    if (slug.endsWith(suffix)) {
      return slug.slice(0, -suffix.length);
    }
  }
  return slug;
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Get user's locale from cookie
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || 'en';

  // Try to find post with locale first, fallback to any post with this slug
  let post = await prisma.blogPost.findFirst({
    where: {
      slug: slug,
      locale: locale
    }
  });

  // If not found with locale, try without locale (backward compatibility)
  if (!post) {
    post = await prisma.blogPost.findFirst({
      where: { slug: slug }
    });
  }

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    keywords: post.metaKeywords,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: ['Vexnexa Team'],
      images: post.coverImage ? [post.coverImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export const revalidate = 3600;

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  // Get user's locale from cookie
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || 'en';

  // Try to find post with locale first, fallback to any post with this slug
  let post = await prisma.blogPost.findFirst({
    where: {
      slug: slug,
      locale: locale
    },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  // If not found with locale, try without locale (backward compatibility)
  if (!post) {
    post = await prisma.blogPost.findFirst({
      where: { slug: slug },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });
  }

  if (!post || post.status !== 'published') {
    notFound();
  }

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } }
  });

  // Get base slug and find available language versions
  const baseSlug = getBaseSlug(slug);
  const allVersions = await prisma.blogPost.findMany({
    where: {
      status: 'published',
    },
    select: {
      locale: true,
      slug: true,
    }
  });

  // Find all available locales for this post (by matching base slug)
  const availableLocales = allVersions
    .filter((v) => getBaseSlug(v.slug) === baseSlug)
    .map((v) => v.locale || 'en') // Default to 'en' if locale not set
    .filter((loc, index, self) => self.indexOf(loc) === index); // Remove duplicates

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Terug
              </Button>
            </Link>
            <BlogLanguageSelector
              currentLocale={post.locale || locale}
              availableLocales={availableLocales}
              baseSlug={baseSlug}
            />
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-6">
              <h1 className="font-display text-4xl lg:text-6xl font-bold leading-tight tracking-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Written by: {post.authorName || (post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Vexnexa Team')}</span>
              <span>·</span>
              <time>{new Date(post.publishedAt!).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</time>
            </div>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {post.coverImage && (
        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <SafeImage
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <article className="pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <BlogContent content={post.content} />
          </div>
        </div>
      </article>

      {/* Share & Tags */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <ShareButtons
              title={post.title}
              url={`https://www.vexnexa.com/blog/${post.slug}`}
            />

            {/* Tags */}
            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple CTA */}
      <section className="py-16 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="font-display text-2xl font-bold">
              Klaar om je website toegankelijk te maken?
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/auth/register">
                  Start Gratis Scan
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/features">
                  Bekijk Features
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
