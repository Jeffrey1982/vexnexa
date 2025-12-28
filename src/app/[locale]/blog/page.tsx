import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowRight } from "lucide-react";
import { PrismaClient } from "@prisma/client";
import { SafeImage } from "@/components/SafeImage";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

const SUPPORTED_LOCALES = ["en", "nl", "de", "fr", "es", "pt"];
const CANONICAL_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.vexnexa.com";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: "Blog - VexNexa",
    nl: "Blog - VexNexa",
    de: "Blog - VexNexa",
    fr: "Blog - VexNexa",
    es: "Blog - VexNexa",
    pt: "Blog - VexNexa",
  };

  const descriptions: Record<string, string> = {
    en: "Latest news, tips and insights about web accessibility and WCAG compliance.",
    nl: "Laatste nieuws, tips en inzichten over web accessibility en WCAG compliance.",
    de: "Neueste Nachrichten, Tipps und Einblicke zu Web-Barrierefreiheit und WCAG-Konformität.",
    fr: "Dernières actualités, conseils et informations sur l'accessibilité Web et la conformité WCAG.",
    es: "Últimas noticias, consejos e información sobre accesibilidad web y cumplimiento de WCAG.",
    pt: "Últimas notícias, dicas e insights sobre acessibilidade web e conformidade WCAG.",
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: `${CANONICAL_BASE_URL}/${locale}/blog`,
      languages: {
        en: `${CANONICAL_BASE_URL}/en/blog`,
        nl: `${CANONICAL_BASE_URL}/nl/blog`,
        de: `${CANONICAL_BASE_URL}/de/blog`,
        fr: `${CANONICAL_BASE_URL}/fr/blog`,
        es: `${CANONICAL_BASE_URL}/es/blog`,
        pt: `${CANONICAL_BASE_URL}/pt/blog`,
      },
    },
  };
}

export const revalidate = 3600; // Revalidate every hour
export const dynamic = "force-dynamic";

export default async function LocaleBlogPage({ params }: PageProps) {
  const { locale } = await params;

  if (!SUPPORTED_LOCALES.includes(locale)) {
    notFound();
  }

  // Fetch published posts with localized content
  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      locales: {
        where: { locale: locale },
      },
    },
    orderBy: { publishedAt: "desc" },
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
              {locale === "nl"
                ? "Inzichten & Updates"
                : locale === "de"
                ? "Einblicke & Updates"
                : locale === "fr"
                ? "Perspectives & Mises à jour"
                : locale === "es"
                ? "Perspectivas y Actualizaciones"
                : locale === "pt"
                ? "Insights & Atualizações"
                : "Insights & Updates"}
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed">
              {locale === "nl"
                ? "Ontdek de laatste ontwikkelingen in web accessibility en WCAG compliance"
                : locale === "de"
                ? "Entdecken Sie die neuesten Entwicklungen in Web-Barrierefreiheit und WCAG-Konformität"
                : locale === "fr"
                ? "Découvrez les dernières évolutions en accessibilité web et conformité WCAG"
                : locale === "es"
                ? "Descubre los últimos avances en accesibilidad web y cumplimiento WCAG"
                : locale === "pt"
                ? "Descubra os últimos desenvolvimentos em acessibilidade web e conformidade WCAG"
                : "Discover the latest developments in web accessibility and WCAG compliance"}
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20 container mx-auto px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-20">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                {locale === "nl"
                  ? "Geen blog posts gevonden. Check later terug voor nieuwe content!"
                  : locale === "de"
                  ? "Keine Blogbeiträge gefunden. Schauen Sie später wieder vorbei!"
                  : locale === "fr"
                  ? "Aucun article de blog trouvé. Revenez plus tard pour du nouveau contenu!"
                  : locale === "es"
                  ? "No se encontraron publicaciones de blog. ¡Vuelve más tarde para nuevo contenido!"
                  : locale === "pt"
                  ? "Nenhuma postagem de blog encontrada. Volte mais tarde para novo conteúdo!"
                  : "No blog posts found. Check back later for new content!"}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <Link
                  href={`/${locale}/blog/${featuredPost.slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/20">
                    <div className="grid md:grid-cols-2 gap-0">
                      {featuredPost.coverImage && (
                        <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
                          <SafeImage
                            src={featuredPost.coverImage}
                            alt={
                              featuredPost.locales[0]?.title || featuredPost.title
                            }
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
                              {new Date(
                                featuredPost.publishedAt!
                              ).toLocaleDateString(locale, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight group-hover:text-primary transition-colors">
                            {featuredPost.locales[0]?.title || featuredPost.title}
                          </h2>

                          {(featuredPost.locales[0]?.excerpt ||
                            featuredPost.excerpt) && (
                            <p className="text-lg text-muted-foreground leading-relaxed line-clamp-3">
                              {featuredPost.locales[0]?.excerpt ||
                                featuredPost.excerpt}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-4">
                            <span className="text-sm text-muted-foreground">
                              {featuredPost.authorName ||
                                `${featuredPost.author.firstName} ${featuredPost.author.lastName}`}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
                  {otherPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/${locale}/blog/${post.slug}`}
                      className="group"
                    >
                      <article className="h-full space-y-4">
                        {post.coverImage && (
                          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted">
                            <SafeImage
                              src={post.coverImage}
                              alt={post.locales[0]?.title || post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-medium text-primary">
                              {post.category}
                            </span>
                            <span>•</span>
                            <time>
                              {new Date(post.publishedAt!).toLocaleDateString(
                                locale,
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </time>
                          </div>

                          <h3 className="font-display text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {post.locales[0]?.title || post.title}
                          </h3>

                          {(post.locales[0]?.excerpt || post.excerpt) && (
                            <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                              {post.locales[0]?.excerpt || post.excerpt}
                            </p>
                          )}

                          <p className="text-sm text-muted-foreground pt-2">
                            {post.authorName ||
                              `${post.author.firstName} ${post.author.lastName}`}
                          </p>
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
  );
}
