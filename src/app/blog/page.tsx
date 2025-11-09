import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { PrismaClient } from '@prisma/client'
import { SafeImage } from '@/components/SafeImage'

const prisma = new PrismaClient()

export const metadata: Metadata = {
  title: 'Blog - VexNexa',
  description: 'Laatste nieuws, tips en inzichten over web accessibility en WCAG compliance.',
  openGraph: {
    title: 'Blog - VexNexa',
    description: 'Laatste nieuws, tips en inzichten over web accessibility en WCAG compliance.',
    url: 'https://vexnexa.com/blog',
  },
  twitter: {
    card: 'summary',
    title: 'Blog - VexNexa',
    description: 'Laatste nieuws, tips en inzichten over web accessibility en WCAG compliance.',
  },
  alternates: {
    canonical: 'https://vexnexa.com/blog',
  },
}

export const revalidate = 3600; // Revalidate every hour
export const dynamic = 'force-dynamic'; // Skip build-time prerendering

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

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-display text-5xl lg:text-6xl font-bold tracking-tight">
              Inzichten & Updates
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed">
              Ontdek de laatste ontwikkelingen in web accessibility en WCAG compliance
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-16">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Geen blog posts gevonden. Check later terug voor nieuwe content!
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <Link href={`/blog/${featuredPost.slug}`} className="group block">
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/20">
                    <div className="grid md:grid-cols-2 gap-0">
                      {featuredPost.coverImage && (
                        <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
                          <SafeImage
                            src={featuredPost.coverImage}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <CardContent className="p-8 lg:p-12 flex flex-col justify-center">
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 text-sm">
                            <Badge variant="default" className="font-medium">
                              {featuredPost.category}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(featuredPost.publishedAt!).toLocaleDateString('nl-NL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>

                          <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight group-hover:text-primary transition-colors">
                            {featuredPost.title}
                          </h2>

                          {featuredPost.excerpt && (
                            <p className="text-lg text-muted-foreground leading-relaxed line-clamp-3">
                              {featuredPost.excerpt}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-4">
                            <span className="text-sm text-muted-foreground">
                              {featuredPost.author.firstName} {featuredPost.author.lastName}
                            </span>
                            <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              )}

              {/* Other Posts Grid */}
              {otherPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {otherPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                      <article className="h-full space-y-4">
                        {post.coverImage && (
                          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted">
                            <SafeImage
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-medium text-primary">{post.category}</span>
                            <span>•</span>
                            <time>
                              {new Date(post.publishedAt!).toLocaleDateString('nl-NL', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </time>
                          </div>

                          <h3 className="font-display text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {post.title}
                          </h3>

                          {post.excerpt && (
                            <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}