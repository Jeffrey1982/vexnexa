# Blog Translation & SEO Workflow

VexNexa blog posts are stored as `BlogPost` CMS records. Each translated article gets its own record, preserving:

- `authorId` and `authorName`
- `publishedAt`
- `coverImage`
- `tags`
- `metaKeywords`
- `status`

## URL Structure

Use one shared base slug per article:

- Dutch original: `/blog/{base-slug}`
- English: `/en/{base-slug}`
- French: `/fr/{base-slug}`
- Spanish: `/es/{base-slug}`
- Portuguese: `/pt/{base-slug}`

The stored CMS slug is still language-specific, for example:

- `ai-generated-code-accessibility-debt-nl`
- `ai-generated-code-accessibility-debt-en`
- `ai-generated-code-accessibility-debt-fr`
- `ai-generated-code-accessibility-debt-es`
- `ai-generated-code-accessibility-debt-pt`

## Canonical and Hreflang

Blog detail pages generate:

- `canonical` pointing to the Dutch version when available
- fallback canonical pointing to the earliest/original publication version
- `alternates.languages` for all available translated versions

The static resource article `the-digital-accessibility-pivot` follows the same public URL pattern and ships with built-in Dutch, English, French, Spanish, and Portuguese content.

## Translation Script

Run:

```bash
OPENAI_API_KEY=... npx tsx scripts/translate-blog-posts.ts
```

Optional:

```bash
SOURCE_LOCALE=nl TARGET_LOCALES=en,fr,es,pt npx tsx scripts/translate-blog-posts.ts
```

The script translates missing versions only. Existing translations are skipped so manually edited articles are not overwritten.

## New Article Checklist

1. Create or publish the original CMS blog post.
2. Use a clean base slug.
3. Run `scripts/translate-blog-posts.ts`.
4. Verify `/blog/{base-slug}`, `/en/{base-slug}`, `/fr/{base-slug}`, `/es/{base-slug}`, and `/pt/{base-slug}`.
5. Confirm canonical points to the Dutch/original URL and alternate links are present.
