"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, Clock3 } from "lucide-react";
import { useLocale } from "next-intl";
import { getBlogBaseSlug, getBlogPublicPath } from "@/lib/blog-seo";

type LatestPost = {
  slug: string;
  locale: string | null;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  category: string | null;
  coverImage: string | null;
  authorName: string | null;
};

type LatestBlogCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  viewAll: string;
  minRead: string;
  posts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    publishedAt: string;
    coverImage: string | null;
  }>;
};

const latestBlogCopy: Record<string, LatestBlogCopy> = {
  en: {
    eyebrow: "Latest from the journal",
    title: "Accessibility news, written for builders.",
    subtitle: "Field notes on WCAG, EAA, and the craft of inclusive interfaces. Updated weekly.",
    viewAll: "View all posts",
    minRead: "min read",
    posts: [
      {
        slug: "what-is-the-european-accessibility-act",
        title: "What Is the European Accessibility Act (EAA)? And Why Your Agency Should Care",
        excerpt: "If you build websites for clients in the EU, the European Accessibility Act already applies to them and to you. Here's what it means and what to do about it.",
        category: "Guide",
        publishedAt: "2026-03-25",
        coverImage: null,
      },
      {
        slug: "waarom-eenmalige-toegankelijkheidsaudits-2026",
        title: "Why One-Time Accessibility Audits Are Not Enough",
        excerpt: "A single accessibility audit gives you a snapshot, not a strategy. Learn why continuous WCAG monitoring is essential.",
        category: "Accessibility",
        publishedAt: "2026-02-09",
        coverImage: null,
      },
      {
        slug: "wcag-2-1-accessibility-guidelines",
        title: "WCAG 2.1 Accessibility Guidelines: What You Need to Know",
        excerpt: "An overview of the Web Content Accessibility Guidelines and how to implement them.",
        category: "Standards",
        publishedAt: "2025-12-05",
        coverImage: "/heroImage.webp",
      },
    ],
  },
  nl: {
    eyebrow: "Nieuw uit het journaal",
    title: "Toegankelijkheidsnieuws voor bouwers.",
    subtitle: "Praktijknotities over WCAG, EAA en inclusieve interfaces. Wekelijks bijgewerkt.",
    viewAll: "Bekijk alle artikelen",
    minRead: "min leestijd",
    posts: [
      {
        slug: "what-is-the-european-accessibility-act",
        title: "Wat is de European Accessibility Act (EAA)? En waarom je agency dit moet weten",
        excerpt: "Bouw je websites voor klanten in de EU, dan raakt de European Accessibility Act hen en jou. Dit betekent het, en dit kun je nu doen.",
        category: "Gids",
        publishedAt: "2026-03-25",
        coverImage: null,
      },
      {
        slug: "waarom-eenmalige-toegankelijkheidsaudits-2026",
        title: "Waarom eenmalige toegankelijkheidsaudits niet genoeg zijn",
        excerpt: "Een audit is een momentopname, geen strategie. Lees waarom continue WCAG-monitoring nodig is voor blijvende compliance.",
        category: "Toegankelijkheid",
        publishedAt: "2026-02-09",
        coverImage: null,
      },
      {
        slug: "wcag-2-1-accessibility-guidelines",
        title: "WCAG 2.1-richtlijnen: wat je moet weten",
        excerpt: "Een praktisch overzicht van WCAG en hoe je de richtlijnen toepast.",
        category: "Standaarden",
        publishedAt: "2025-12-05",
        coverImage: "/heroImage.webp",
      },
    ],
  },
  de: {
    eyebrow: "Neu aus dem Journal",
    title: "Accessibility-News fur Teams, die bauen.",
    subtitle: "Praxisnotizen zu WCAG, EAA und inklusiven Interfaces. Wochentlich aktualisiert.",
    viewAll: "Alle Beitrage ansehen",
    minRead: "Min. Lesezeit",
    posts: [
      {
        slug: "what-is-the-european-accessibility-act",
        title: "Was ist der European Accessibility Act (EAA)? Und warum Ihre Agentur ihn kennen sollte",
        excerpt: "Wenn Sie Websites fur EU-Kunden bauen, betrifft der European Accessibility Act Ihre Kunden und Ihre Arbeit.",
        category: "Leitfaden",
        publishedAt: "2026-03-25",
        coverImage: null,
      },
      {
        slug: "waarom-eenmalige-toegankelijkheidsaudits-2026",
        title: "Warum einmalige Accessibility-Audits nicht ausreichen",
        excerpt: "Ein Audit ist eine Momentaufnahme, keine Strategie. Kontinuierliches WCAG-Monitoring macht Fortschritt nachweisbar.",
        category: "Barrierefreiheit",
        publishedAt: "2026-02-09",
        coverImage: null,
      },
      {
        slug: "wcag-2-1-accessibility-guidelines",
        title: "WCAG 2.1-Richtlinien: was Sie wissen mussen",
        excerpt: "Ein Uberblick uber WCAG und die praktische Umsetzung.",
        category: "Standards",
        publishedAt: "2025-12-05",
        coverImage: "/heroImage.webp",
      },
    ],
  },
  fr: {
    eyebrow: "Dernieres notes du journal",
    title: "Actualites accessibilite pour les equipes produit.",
    subtitle: "Notes de terrain sur WCAG, EAA et interfaces inclusives. Mis a jour chaque semaine.",
    viewAll: "Voir tous les articles",
    minRead: "min de lecture",
    posts: [
      {
        slug: "what-is-the-european-accessibility-act",
        title: "Qu'est-ce que l'European Accessibility Act (EAA) ? Et pourquoi votre agence doit s'y interesser",
        excerpt: "Si vous creez des sites pour des clients dans l'UE, l'EAA les concerne deja. Voici ce que cela change.",
        category: "Guide",
        publishedAt: "2026-03-25",
        coverImage: null,
      },
      {
        slug: "waarom-eenmalige-toegankelijkheidsaudits-2026",
        title: "Pourquoi les audits d'accessibilite ponctuels ne suffisent pas",
        excerpt: "Un audit donne une photo a un instant donne, pas une strategie. Le monitoring WCAG continu rend les progres visibles.",
        category: "Accessibilite",
        publishedAt: "2026-02-09",
        coverImage: null,
      },
      {
        slug: "wcag-2-1-accessibility-guidelines",
        title: "Directives WCAG 2.1 : ce qu'il faut savoir",
        excerpt: "Un apercu pratique des WCAG et de leur mise en oeuvre.",
        category: "Standards",
        publishedAt: "2025-12-05",
        coverImage: "/heroImage.webp",
      },
    ],
  },
  es: {
    eyebrow: "Ultimo del diario",
    title: "Noticias de accesibilidad para equipos que construyen.",
    subtitle: "Notas practicas sobre WCAG, EAA e interfaces inclusivas. Actualizado cada semana.",
    viewAll: "Ver todos los articulos",
    minRead: "min de lectura",
    posts: [
      {
        slug: "what-is-the-european-accessibility-act",
        title: "Que es la European Accessibility Act (EAA) y por que tu agencia debe conocerla",
        excerpt: "Si construyes webs para clientes en la UE, la EAA ya les afecta a ellos y tambien a tu trabajo.",
        category: "Guia",
        publishedAt: "2026-03-25",
        coverImage: null,
      },
      {
        slug: "waarom-eenmalige-toegankelijkheidsaudits-2026",
        title: "Por que las auditorias puntuales de accesibilidad no bastan",
        excerpt: "Una auditoria es una foto, no una estrategia. El monitoreo WCAG continuo ayuda a sostener el cumplimiento.",
        category: "Accesibilidad",
        publishedAt: "2026-02-09",
        coverImage: null,
      },
      {
        slug: "wcag-2-1-accessibility-guidelines",
        title: "Pautas WCAG 2.1: lo que necesitas saber",
        excerpt: "Una vision practica de WCAG y como aplicarlo.",
        category: "Estandares",
        publishedAt: "2025-12-05",
        coverImage: "/heroImage.webp",
      },
    ],
  },
  pt: {
    eyebrow: "Ultimas do diario",
    title: "Noticias de acessibilidade para quem constroi.",
    subtitle: "Notas praticas sobre WCAG, EAA e interfaces inclusivas. Atualizado semanalmente.",
    viewAll: "Ver todos os artigos",
    minRead: "min de leitura",
    posts: [
      {
        slug: "what-is-the-european-accessibility-act",
        title: "O que e o European Accessibility Act (EAA)? E por que a sua agencia deve saber",
        excerpt: "Se voce cria sites para clientes na UE, a EAA ja afeta esses clientes e tambem o seu trabalho.",
        category: "Guia",
        publishedAt: "2026-03-25",
        coverImage: null,
      },
      {
        slug: "waarom-eenmalige-toegankelijkheidsaudits-2026",
        title: "Por que auditorias pontuais de acessibilidade nao bastam",
        excerpt: "Uma auditoria e um retrato, nao uma estrategia. O monitoramento WCAG continuo ajuda a sustentar conformidade.",
        category: "Acessibilidade",
        publishedAt: "2026-02-09",
        coverImage: null,
      },
      {
        slug: "wcag-2-1-accessibility-guidelines",
        title: "Diretrizes WCAG 2.1: o que voce precisa saber",
        excerpt: "Uma visao pratica das WCAG e de como implementa-las.",
        category: "Padroes",
        publishedAt: "2025-12-05",
        coverImage: "/heroImage.webp",
      },
    ],
  },
};

function formatDate(value: string | null, locale: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function readingMinutes(text: string | null) {
  if (!text) return 3;
  const words = text.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 220));
}

export function LatestBlogSection() {
  const locale = useLocale();
  const copy = latestBlogCopy[locale] ?? latestBlogCopy.en;
  const [posts, setPosts] = useState<LatestPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/blog/latest?locale=${locale}&limit=3`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setPosts(data.posts ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const visiblePosts =
    !loading && posts.some((post) => post.locale === locale)
      ? posts
      : copy.posts.map((post) => ({
          ...post,
          locale,
          authorName: "VexNexa",
        }));

  return (
    <section
      aria-labelledby="latest-blog-heading"
      className="border-y px-6 py-20 lg:py-28"
      style={{
        background: "var(--color-surface-warm)",
        borderColor: "var(--color-border-subtle)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <div
              className="mb-4 inline-flex items-center gap-2 font-mono text-xs uppercase"
              style={{
                color: "var(--color-brand-primary-dark)",
                letterSpacing: "0.12em",
              }}
            >
              <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.eyebrow}
            </div>
            <h2
              id="latest-blog-heading"
              className="font-display font-semibold"
              style={{
                color: "var(--color-ink-900)",
                fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
                letterSpacing: "-0.02em",
                lineHeight: "1.1",
              }}
            >
              {copy.title}
            </h2>
            <p
              className="mt-4 text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--color-ink-500)" }}
            >
              {copy.subtitle}
            </p>
          </div>

          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: "var(--color-brand-primary-dark)" }}
          >
            {copy.viewAll}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div
                    className="mb-5 aspect-[16/10] w-full rounded-lg"
                    style={{ background: "var(--color-surface-sunken)" }}
                  />
                  <div
                    className="mb-3 h-3 w-24 rounded"
                    style={{ background: "var(--color-surface-sunken)" }}
                  />
                  <div
                    className="mb-2 h-5 w-full rounded"
                    style={{ background: "var(--color-surface-sunken)" }}
                  />
                  <div
                    className="h-5 w-3/4 rounded"
                    style={{ background: "var(--color-surface-sunken)" }}
                  />
                </div>
              ))
            : visiblePosts.map((post) => (
                <article key={post.slug} className="group flex flex-col">
                  <Link
                    href={getBlogPublicPath(post.locale || locale, getBlogBaseSlug(post.slug))}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 rounded-lg"
                  >
                    <div
                      className="mb-5 aspect-[16/10] w-full overflow-hidden rounded-lg"
                      style={{
                        background: post.coverImage
                          ? `linear-gradient(135deg, var(--color-brand-primary-light) 0%, var(--color-surface-sunken) 100%)`
                          : "linear-gradient(135deg, var(--color-brand-primary-light) 0%, var(--color-surface-sunken) 100%)",
                        border: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      {post.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.coverImage}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span
                            className="font-display text-6xl font-semibold opacity-30"
                            style={{ color: "var(--color-brand-primary-dark)" }}
                          >
                            VN
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className="mb-3 flex items-center gap-3 font-mono text-xs uppercase"
                      style={{
                        color: "var(--color-ink-500)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {post.category && (
                        <span style={{ color: "var(--color-brand-primary-dark)" }}>
                          {post.category}
                        </span>
                      )}
                      {post.category && post.publishedAt && <span aria-hidden>·</span>}
                      {post.publishedAt && <time>{formatDate(post.publishedAt, locale)}</time>}
                    </div>

                    <h3
                      className="mb-3 font-display font-semibold transition-colors group-hover:[color:var(--color-brand-primary-dark)]"
                      style={{
                        color: "var(--color-ink-900)",
                        fontSize: "1.375rem",
                        lineHeight: "1.25",
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p
                        className="mb-4 text-sm leading-relaxed"
                        style={{ color: "var(--color-ink-500)" }}
                      >
                        {post.excerpt}
                      </p>
                    )}

                    <div
                      className="mt-auto flex items-center gap-1.5 text-xs"
                      style={{ color: "var(--color-ink-500)" }}
                    >
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {readingMinutes(post.excerpt)} {copy.minRead}
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
        </div>
      </div>
    </section>
  );
}
