import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { PrismaClient } from '@prisma/client'
import { ShareButtons } from '@/components/blog/ShareButtons'
import { BlogContent } from '@/components/blog/BlogContent'
import { SafeImage } from '@/components/SafeImage'

const prisma = new PrismaClient()

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug }
  });

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
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  if (!post || post.status !== 'published') {
    notFound();
  }

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } }
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-8">
        <div className="container mx-auto px-6 lg:px-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Terug
            </Button>
          </Link>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
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
              <span>Written by: {post.authorName || `${post.author.firstName} ${post.author.lastName}`}</span>
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
        <section className="container mx-auto px-6 lg:px-8 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="aspect-video w-full overflow-hidden rounded-xl">
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
      <article className="pb-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <BlogContent content={post.content} />
          </div>
        </div>
      </article>

      {/* Share & Tags */}
      <div className="border-t">
        <div className="container mx-auto px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto space-y-8">
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
      <section className="py-20 border-t bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
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
