# Blog Image Upload Setup Guide

This guide explains how to set up image uploads for your blog posts using Supabase Storage.

## Features

✅ **Cover Image Upload** - Upload cover images directly from the blog editor
✅ **Inline Image Insertion** - Insert images anywhere in your blog content
✅ **Alt Text & SEO** - Required alt text and optional title attributes for accessibility
✅ **Markdown Support** - Automatically generates markdown syntax
✅ **File Validation** - Max 10MB, supports JPEG, PNG, GIF, WebP, SVG

## Setup Steps

### 1. Create Supabase Storage Bucket

You need to create a storage bucket in your Supabase project:

**Via Supabase Dashboard (Recommended):**

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name:** `blog-images`
   - **Public:** ✅ **Yes** (Enable public access)
   - **File size limit:** `10485760` (10MB)
   - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
6. Click **"Create bucket"**

### 2. Configure RLS Policies (Optional but Recommended)

For better security, set up Row Level Security policies:

1. Go to **Storage > Policies** in your Supabase dashboard
2. Select the `blog-images` bucket
3. Add the following policies:

**Upload Policy (INSERT):**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');
```

**Read Policy (SELECT):**
```sql
-- Allow public read access
CREATE POLICY "Allow public read access to blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');
```

**Delete Policy (DELETE):**
```sql
-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated users to delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');
```

### 3. Verify Environment Variables

Ensure these environment variables are set in your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional, for server-side operations)
```

### 4. Test the Setup

1. Log in to your admin dashboard
2. Go to **Admin > Blog Management**
3. Create or edit a blog post
4. Try uploading a cover image using the **"Upload"** button
5. Try inserting an inline image using the **"Insert Image"** button in the content editor

## How to Use

### Uploading Cover Images

1. In the blog editor, find the **"Cover Image"** section in the right sidebar
2. Click the **"Upload"** button
3. Select an image file (JPEG, PNG, GIF, WebP, or SVG up to 10MB)
4. The image will be uploaded and automatically set as the cover image
5. Alternatively, you can paste a direct URL in the input field

### Inserting Inline Images

1. Position your cursor where you want the image in the content textarea
2. Click the **"Insert Image"** button above the content area
3. Select an image file
4. Enter the **Alt Text** (required for accessibility and SEO)
5. Optionally enter a **Title** (shown as tooltip on hover)
6. Click **"Insert"**
7. The markdown will be inserted at your cursor position:
   ```markdown
   ![Alt text](image-url "Optional title")
   ```

### Image Markdown Syntax

The editor supports standard markdown image syntax:

```markdown
![Alt text description](https://your-url.com/image.jpg)
![Alt text](https://your-url.com/image.jpg "Optional title/tooltip")
```

## File Specifications

- **Maximum file size:** 10MB
- **Supported formats:**
  - JPEG/JPG (`.jpg`, `.jpeg`)
  - PNG (`.png`)
  - GIF (`.gif`)
  - WebP (`.webp`)
  - SVG (`.svg`)
- **Storage location:** `blog-images/blog/` in Supabase Storage
- **File naming:** `timestamp-random.ext` (e.g., `1704067200000-abc123.jpg`)

## Troubleshooting

### "Failed to upload image" Error

1. **Check bucket exists:** Ensure the `blog-images` bucket is created in Supabase
2. **Verify it's public:** The bucket must have public access enabled
3. **Check file size:** Files must be under 10MB
4. **Check file type:** Only JPEG, PNG, GIF, WebP, and SVG are allowed
5. **Verify authentication:** You must be logged in as an authenticated user

### Images Not Displaying

1. **Check URL:** Verify the image URL is accessible in your browser
2. **Check CORS:** Supabase storage should handle CORS automatically for public buckets
3. **Check bucket permissions:** Ensure the bucket has public read access
4. **Clear cache:** Try clearing your browser cache

### "Unauthorized" Error

1. **Check session:** Ensure you're logged in to the admin dashboard
2. **Verify API route:** The `/api/blog/upload-image` endpoint requires authentication
3. **Check NextAuth configuration:** Ensure NextAuth is properly configured

## Manual Bucket Creation (via SQL)

If you prefer to create the bucket via SQL:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Add RLS policies (run the policy SQL from step 2 above)
```

## Security Considerations

- The bucket is public to allow images to be displayed on your blog
- Only authenticated users can upload images (enforced via API authentication)
- File size and type validation happens both client-side and server-side
- Each file gets a unique name to prevent overwrites
- Consider implementing rate limiting for production use

## Storage Costs

Supabase offers:
- **Free tier:** 1GB storage, 2GB bandwidth/month
- **Pro tier:** 100GB storage, 200GB bandwidth/month
- **Additional:** $0.021/GB/month for storage, $0.09/GB for bandwidth

Monitor your usage in the Supabase dashboard under **Storage > Usage**.

## Support

If you encounter issues:
1. Check the Supabase Storage logs in your dashboard
2. Check the browser console for error messages
3. Verify all environment variables are set correctly
4. Ensure the Next.js API route is accessible at `/api/blog/upload-image`
