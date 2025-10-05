import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const metadata: Metadata = {
  title: 'Blog - TutusPorta',
  description: 'Laatste nieuws, tips en inzichten over web accessibility en WCAG compliance.',
  openGraph: {
    title: 'Blog - TutusPorta',
    description: 'Laatste nieuws, tips en inzichten over web accessibility en WCAG compliance.',
    url: 'https://tutusporta.com/blog',
  },
  twitter: {
    card: 'summary',
    title: 'Blog - TutusPorta',
    description: 'Laatste nieuws, tips en inzichten over web accessibility en WCAG compliance.',
  },
  alternates: {
    canonical: 'https://tutusporta.com/blog',
  },
}

export const revalidate = 3600; // Revalidate every hour

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'published' },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    },
    orderBy: { publishedAt: 'desc' }
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="mb-4">
              📝 Blog
            </Badge>
            <h1 className="font-display text-4xl lg:text-5xl font-bold">
              Inzichten & Updates
            </h1>
            <p className="text-xl text-muted-foreground">
              Ontdek de laatste ontwikkelingen in web accessibility, WCAG compliance
              en hoe TutusPorta bedrijven helpt inclusiever te worden.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Geen blog posts gevonden. Check later terug voor nieuwe content!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    {post.coverImage && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">{post.category}</Badge>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <time>{new Date(post.publishedAt!).toLocaleDateString('nl-NL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</time>
                        </div>
                      </div>

                      <h2 className="font-display text-xl font-semibold line-clamp-2 hover:text-primary transition-colors">
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p className="text-muted-foreground line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{post.author.firstName} {post.author.lastName}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </div>

                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}