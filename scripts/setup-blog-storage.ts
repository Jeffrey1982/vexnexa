import { supabaseAdmin } from '../src/lib/supabaseServer';

/**
 * This script creates the 'blog-images' storage bucket in Supabase for blog post images.
 *
 * Run this script once to set up the storage bucket:
 * npx tsx scripts/setup-blog-storage.ts
 *
 * Manual Setup via Supabase Dashboard (if script fails):
 * 1. Go to Storage in your Supabase dashboard
 * 2. Create a new bucket named 'blog-images'
 * 3. Set it to Public
 * 4. Configure the following RLS policies:
 *    - Allow authenticated users to upload (INSERT)
 *    - Allow everyone to read (SELECT)
 */

async function setupBlogStorage() {
  if (!supabaseAdmin) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in your environment variables.');
    console.log('\nPlease set up the storage bucket manually:');
    console.log('1. Go to your Supabase dashboard > Storage');
    console.log('2. Create a new bucket named "blog-images"');
    console.log('3. Set it to Public');
    console.log('4. Add RLS policy to allow authenticated users to upload');
    process.exit(1);
  }

  console.log('🚀 Setting up blog images storage bucket...\n');

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'blog-images');

    if (bucketExists) {
      console.log('✅ Bucket "blog-images" already exists');
    } else {
      // Create the bucket
      const { data, error } = await supabaseAdmin.storage.createBucket('blog-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      });

      if (error) {
        throw error;
      }

      console.log('✅ Successfully created "blog-images" bucket');
    }

    // Get the public URL pattern
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl('test.jpg');

    const baseUrl = publicUrl.replace('/test.jpg', '');

    console.log('\n📝 Storage Setup Complete!');
    console.log('\nBucket details:');
    console.log(`  Name: blog-images`);
    console.log(`  Public: Yes`);
    console.log(`  Max file size: 10MB`);
    console.log(`  Allowed types: JPEG, PNG, GIF, WebP, SVG`);
    console.log(`\n🔗 Public URL base: ${baseUrl}`);
    console.log('\n✨ You can now upload images through the blog editor!');

  } catch (error: any) {
    console.error('❌ Error setting up storage:', error.message);
    console.log('\n⚠️  Please set up the bucket manually via Supabase dashboard');
    process.exit(1);
  }
}

setupBlogStorage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
