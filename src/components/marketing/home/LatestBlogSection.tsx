"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, Clock3 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

type LatestPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  category: string | null;
  coverImage: string | null;
  authorName: string | null;
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
  const t = useTranslations("home.latestBlog");
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

  if (!loading && posts.length === 0) return null;

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
              {t("eyebrow")}
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
              {t("title")}
            </h2>
            <p
              className="mt-4 text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--color-ink-500)" }}
            >
              {t("subtitle")}
            </p>
          </div>

          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: "var(--color-brand-primary-dark)" }}
          >
            {t("viewAll")}
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
            : posts.map((post) => (
                <article key={post.slug} className="group flex flex-col">
                  <Link
                    href={`/blog/${post.slug}`}
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
                        {readingMinutes(post.excerpt)} {t("minRead")}
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
