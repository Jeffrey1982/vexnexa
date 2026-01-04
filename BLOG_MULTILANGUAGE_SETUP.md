# Multi-Language Blog Implementation Guide

## Overview

Your blog system has been updated to support all 5 languages available on your site:
- 🇬🇧 English (en)
- 🇳🇱 Nederlands (nl)
- 🇫🇷 Français (fr)
- 🇪🇸 Español (es)
- 🇵🇹 Português (pt)

## What Changed

### 1. Database Schema

The `BlogPost` model now includes:
- **`locale`** field: Stores the language code (en, nl, fr, es, pt)
- **Updated unique constraint**: `slug + locale` combination must be unique (replaces single `slug` unique constraint)
- **Indexed locale**: For better query performance

### 2. Blog URLs

Blog posts now use language-specific slugs:
- English: `/blog/intro-to-wcag-en`
- Dutch: `/blog/intro-to-wcag-nl`
- French: `/blog/intro-to-wcag-fr`
- Spanish: `/blog/intro-to-wcag-es`
- Portuguese: `/blog/intro-to-wcag-pt`

### 3. Features Added

✅ **Automatic Language Filtering**: Blog listing shows posts in the user's selected language
✅ **Language Selector**: Users can switch between available translations on blog detail pages
✅ **Admin Support**: Blog editor includes language selection dropdown
✅ **Translation Script**: Automated tool to translate existing posts using Claude AI

## Setup Instructions

### Step 1: Run Database Migration

Execute the SQL migration to update your database schema:

```bash
# Option 1: Use the provided SQL file
psql -U your_username -d your_database -f migration-add-locale.sql

# Option 2: If you have Prisma CLI setup with environment variables
npx prisma migrate dev --name add_locale_to_blog_posts
```

**Important**: The migration will:
1. Add the `locale` column (defaults to 'en')
2. Drop the old unique constraint on `slug`
3. Add new unique constraint on `(slug, locale)`
4. Add index on `locale`
5. Update existing posts to add `-en` suffix to their slugs

### Step 2: Translate Existing Blog Posts

Use the automated translation script to create translated versions of your blog posts:

```bash
# Install required dependency if not already installed
npm install @anthropic-ai/sdk

# Add your Anthropic API key to .env
echo "ANTHROPIC_API_KEY=your_api_key_here" >> .env

# Run the translation script
npx tsx scripts/translate-blog-posts.ts
```

The script will:
- Fetch all English blog posts
- Translate them to nl, fr, es, pt using Claude AI
- Preserve all HTML/markdown formatting
- Create new blog post entries with appropriate slugs
- Skip translations that already exist

**Estimated time**: ~2-3 minutes per blog post (due to API rate limiting)

### Step 3: Verify Implementation

1. **Check Blog Listing**: Visit `/blog` and switch languages using the language selector in your site navigation
2. **Check Blog Details**: Open a blog post and use the language selector in the header to switch between translations
3. **Check Admin**: Go to the admin blog editor and verify the Language dropdown appears

## How It Works

### Frontend (User Experience)

1. **Blog Listing Page** (`/blog`)
   - Reads user's language preference from `NEXT_LOCALE` cookie
   - Queries only blog posts matching that locale
   - Displays posts in the user's language

2. **Blog Detail Page** (`/blog/[slug]`)
   - Reads user's language preference from cookie
   - Loads the post matching both slug AND locale
   - Shows language selector with available translations
   - Users can click to switch to other language versions

3. **Language Selector Component**
   - Shows current language with flag/name
   - Dropdown lists all available translations
   - Clicking updates cookie and redirects to translated version

### Backend (Admin)

1. **Blog Editor**
   - Language dropdown in Publishing section
   - Defaults to English for new posts
   - Can be changed when creating/editing posts

2. **Creating Translations**
   - Option 1: Use automated translation script
   - Option 2: Manually create post in admin with different locale
   - Remember to use base slug + language suffix (e.g., `my-post-nl`)

## Translation Script Details

The `scripts/translate-blog-posts.ts` script uses Claude Sonnet 4.5 to:

1. **Preserve Formatting**: Maintains all HTML tags and markdown
2. **Translate Content**: Title, content, excerpt, meta fields, category
3. **Skip Duplicates**: Won't re-translate existing posts
4. **Rate Limiting**: Includes 1-second delay between translations
5. **Error Handling**: Continues processing even if one translation fails

### Running Selective Translations

To translate specific posts or update the script, edit `translate-blog-posts.ts`:

```typescript
// Translate only specific posts
const englishPosts = await prisma.blogPost.findMany({
  where: {
    locale: 'en',
    status: 'published',
    slug: { in: ['post-1-en', 'post-2-en'] } // Add this line
  },
  // ...
});
```

## Best Practices

### Creating New Blog Posts

1. **Start with English**: Create the English version first with slug ending in `-en`
2. **Use Translation Script**: Run the script to auto-translate
3. **Review Translations**: Check translated posts for accuracy
4. **Adjust if Needed**: Edit translated versions in admin if necessary

### URL Structure

**✅ Good**:
- `intro-to-wcag-en`
- `intro-to-wcag-nl`
- `advanced-aria-en`

**❌ Avoid**:
- `intro-to-wcag` (missing language suffix)
- `intro-wcag-english` (use language code, not full name)
- `en-intro-to-wcag` (suffix, not prefix)

### SEO Considerations

Each language version is treated as a separate page, which is good for SEO:
- Each gets its own meta title/description (translated)
- Each has its own URL (better for language-specific searches)
- No duplicate content issues (different languages)

## Troubleshooting

### Issue: Blog posts not showing

**Solution**: Check that:
1. Posts have `status: 'published'`
2. Posts have the correct `locale` value
3. User's `NEXT_LOCALE` cookie matches existing post locales

### Issue: Language selector not appearing

**Causes**:
- Only one language version exists for that post
- The selector is hidden when `availableLocales.length <= 1`

**Solution**: Create translations for other languages

### Issue: Translation script fails

**Check**:
1. `ANTHROPIC_API_KEY` is set in `.env`
2. API key has sufficient credits
3. Database connection is working (`DATABASE_URL` is set)

### Issue: Slug conflicts

**Error**: "Unique constraint failed on slug_locale"

**Solution**: Each slug + locale combination must be unique. If you get this error:
1. Check if a post with that slug/locale already exists
2. Use a different base slug
3. Delete the conflicting post if it's a duplicate

## API Endpoints

The blog API routes automatically handle locale:

- `GET /api/blog` - List posts (supports `?locale=en` query param)
- `POST /api/blog` - Create post (include `locale` in body)
- `PATCH /api/blog/[slug]` - Update post (include `locale` in body)
- `DELETE /api/blog/[slug]` - Delete post

## File Reference

### Modified Files
- `prisma/schema.prisma` - Added locale field and updated constraints
- `src/app/blog/page.tsx` - Filter by locale
- `src/app/blog/[slug]/page.tsx` - Load post by slug + locale, show language selector
- `src/components/admin/BlogEditor.tsx` - Added language dropdown
- `src/components/admin/BlogManagement.tsx` - Updated interface for locale

### New Files
- `migration-add-locale.sql` - Database migration SQL
- `scripts/translate-blog-posts.ts` - Translation automation script
- `src/components/blog/BlogLanguageSelector.tsx` - Language switcher component
- `BLOG_MULTILANGUAGE_SETUP.md` - This guide

## Support

If you encounter any issues:

1. Check this guide for troubleshooting
2. Review the blog posts in your database (check `locale` values)
3. Test with a simple blog post first before translating all posts
4. Verify environment variables are set correctly

## Future Enhancements

Consider adding:
- Bulk translation UI in admin dashboard
- Translation status indicators (show which languages exist)
- Auto-detect missing translations
- Translation quality review workflow
- Language-specific analytics
