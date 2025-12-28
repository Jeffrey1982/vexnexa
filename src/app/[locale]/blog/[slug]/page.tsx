import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PrismaClient } from "@prisma/client";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { BlogContent } from "@/components/blog/BlogContent";
import { SafeImage } from "@/components/SafeImage";

const prisma = new PrismaClient();

const SUPPORTED_LOCALES = ["en", "nl", "de", "fr", "es", "pt"];
const CANONICAL_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.vexnexa.com";

interface BlogPostPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!SUPPORTED_LOCALES.includes(locale)) {
    return { title: "Not Found" };
  }

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      locales: {
        where: { locale },
      },
    },
  });

  if (!post || post.status !== "published") {
    return { title: "Post Not Found" };
  }

  const localeData = post.locales[0];
  const title = localeData?.metaTitle || localeData?.title || post.metaTitle || post.title;
  const description = localeData?.metaDescription || localeData?.excerpt || post.metaDescription || post.excerpt || undefined;

  return {
    title,
    description,
    keywords: post.metaKeywords,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: ["Vexnexa Team"],
      images: post.coverImage ? [post.coverImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImage ? [post.coverImage] : [],
    },
    alternates: {
      canonical: `${CANONICAL_BASE_URL}/${locale}/blog/${slug}`,
      languages: {
        en: `${CANONICAL_BASE_URL}/en/blog/${slug}`,
        nl: `${CANONICAL_BASE_URL}/nl/blog/${slug}`,
        de: `${CANONICAL_BASE_URL}/de/blog/${slug}`,
        fr: `${CANONICAL_BASE_URL}/fr/blog/${slug}`,
        es: `${CANONICAL_BASE_URL}/es/blog/${slug}`,
        pt: `${CANONICAL_BASE_URL}/pt/blog/${slug}`,
      },
    },
  };
}

export const revalidate = 3600;

export default async function LocaleBlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;

  if (!SUPPORTED_LOCALES.includes(locale)) {
    notFound();
  }

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      locales: {
        where: { locale },
      },
    },
  });

  if (!post || post.status !== "published") {
    notFound();
  }

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  });

  // Get localized content or fallback to default
  const localeData = post.locales[0];
  const title = localeData?.title || post.title;
  const content = localeData?.content || post.content;
  const excerpt = localeData?.excerpt || post.excerpt;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-8">
        <div className="container mx-auto px-6 lg:px-8">
          <Link href={`/${locale}/blog`}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              {locale === "nl"
                ? "Terug"
                : locale === "de"
                ? "Zurück"
                : locale === "fr"
                ? "Retour"
                : locale === "es"
                ? "Volver"
                : locale === "pt"
                ? "Voltar"
                : "Back"}
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
                {title}
              </h1>

              {excerpt && (
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {excerpt}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                {post.authorName ||
                  `${post.author.firstName} ${post.author.lastName}`}
              </span>
              <span>·</span>
              <time>
                {new Date(post.publishedAt!).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
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
                alt={title}
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
            <BlogContent content={content} />
          </div>
        </div>
      </article>

      {/* Share & Tags */}
      <div className="border-t">
        <div className="container mx-auto px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto space-y-8">
            <ShareButtons
              title={title}
              url={`${CANONICAL_BASE_URL}/${locale}/blog/${post.slug}`}
            />

            {/* Tags */}
            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded"
                  >
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
              {locale === "nl"
                ? "Klaar om je website toegankelijk te maken?"
                : locale === "de"
                ? "Bereit, Ihre Website barrierefrei zu machen?"
                : locale === "fr"
                ? "Prêt à rendre votre site web accessible?"
                : locale === "es"
                ? "¿Listo para hacer tu sitio web accesible?"
                : locale === "pt"
                ? "Pronto para tornar seu site acessível?"
                : "Ready to make your website accessible?"}
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/auth/register">
                  {locale === "nl"
                    ? "Start Gratis Scan"
                    : locale === "de"
                    ? "Kostenloser Scan starten"
                    : locale === "fr"
                    ? "Démarrer le scan gratuit"
                    : locale === "es"
                    ? "Iniciar escaneo gratuito"
                    : locale === "pt"
                    ? "Iniciar verificação gratuita"
                    : "Start Free Scan"}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/features">
                  {locale === "nl"
                    ? "Bekijk Features"
                    : locale === "de"
                    ? "Funktionen ansehen"
                    : locale === "fr"
                    ? "Voir les fonctionnalités"
                    : locale === "es"
                    ? "Ver características"
                    : locale === "pt"
                    ? "Ver recursos"
                    : "View Features"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
