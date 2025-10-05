import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User, ArrowLeft } from 'lucide-react'
import { PrismaClient } from '@prisma/client'
import ReactMarkdown from 'react-markdown'
import { ShareButtons } from '@/components/blog/ShareButtons'

const prisma = new PrismaClient()

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug }
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
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
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
      {/* Hero Section */}
      <section className="py-12 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Terug naar Blog
              </Button>
            </Link>

            <div className="space-y-4">
              <Badge variant="secondary">{post.category}</Badge>

              <h1 className="font-display text-3xl lg:text-5xl font-bold leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl text-muted-foreground">
                  {post.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.author.firstName} {post.author.lastName}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <time>{new Date(post.publishedAt!).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</time>
                </div>
                <span>•</span>
                <span>{post.views} weergaven</span>
              </div>

              {Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {post.coverImage && (
        <section className="container mx-auto px-4 -mt-8">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video w-full overflow-hidden rounded-lg shadow-2xl">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <article className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg prose-slate max-w-none
              prose-headings:font-display prose-headings:font-bold
              prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
              prose-p:text-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-muted prose-pre:border
              prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1
              prose-ul:text-foreground prose-ol:text-foreground
              prose-li:text-foreground prose-li:marker:text-primary
              prose-img:rounded-lg prose-img:shadow-lg
            ">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </article>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="font-display text-3xl font-bold">
              Klaar om je website toegankelijk te maken?
            </h2>
            <p className="text-lg text-muted-foreground">
              Start vandaag nog met een gratis scan en ontdek hoe toegankelijk jouw website werkelijk is.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/auth/register">
                  Start Gratis Scan
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/features">
                  Bekijk Features
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Share Section */}
      <ShareButtons
        title={post.title}
        url={`https://www.tutusporta.com/blog/${post.slug}`}
      />
    </div>
  )
}
