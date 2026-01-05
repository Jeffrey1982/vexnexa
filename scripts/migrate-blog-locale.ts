/**
 * Migration script to add locale support to BlogPost table
 * This adds the locale field and updates the unique constraint
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('Starting blog locale migration...\n');

  try {
    // Step 1: Check if locale column already exists
    console.log('Checking if locale column exists...');
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'BlogPost'
      AND column_name = 'locale';
    `;

    if (result.length > 0) {
      console.log('✅ Locale column already exists. Migration may have already been run.');
      console.log('Checking data...\n');

      const posts = await prisma.blogPost.findMany({
        select: { id: true, slug: true, locale: true }
      });

      console.log(`Found ${posts.length} blog posts`);
      const postsWithLocale = posts.filter(p => p.locale);
      const postsWithoutLocale = posts.filter(p => !p.locale);

      console.log(`- ${postsWithLocale.length} posts have locale set`);
      console.log(`- ${postsWithoutLocale.length} posts missing locale\n`);

      if (postsWithoutLocale.length > 0) {
        console.log('Updating posts without locale to default "en"...');
        for (const post of postsWithoutLocale) {
          await prisma.blogPost.update({
            where: { id: post.id },
            data: { locale: 'en' }
          });
          console.log(`✓ Updated: ${post.slug}`);
        }
        console.log(`\n✅ Updated ${postsWithoutLocale.length} posts to locale "en"`);
      }

      return;
    }

    console.log('Locale column does not exist. Running migration...\n');

    // Step 2: Add locale column with default value
    console.log('1. Adding locale column...');
    await prisma.$executeRaw`
      ALTER TABLE "BlogPost"
      ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';
    `;
    console.log('✓ Locale column added\n');

    // Step 3: Drop the old unique constraint on slug
    console.log('2. Dropping old unique constraint on slug...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "BlogPost"
        DROP CONSTRAINT IF EXISTS "BlogPost_slug_key";
      `;
      console.log('✓ Old constraint dropped\n');
    } catch (error) {
      console.log('⚠ Constraint may not exist, continuing...\n');
    }

    // Step 4: Add new unique constraint on (slug, locale)
    console.log('3. Adding new unique constraint on (slug, locale)...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "BlogPost"
        ADD CONSTRAINT "BlogPost_slug_locale_key" UNIQUE ("slug", "locale");
      `;
      console.log('✓ New constraint added\n');
    } catch (error) {
      console.log('⚠ Constraint may already exist, continuing...\n');
    }

    // Step 5: Add index on locale
    console.log('4. Adding index on locale...');
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "BlogPost_locale_idx" ON "BlogPost"("locale");
      `;
      console.log('✓ Index created\n');
    } catch (error) {
      console.log('⚠ Index may already exist, continuing...\n');
    }

    // Step 6: Verify the migration
    console.log('5. Verifying migration...');
    const posts = await prisma.blogPost.findMany({
      select: { id: true, slug: true, locale: true },
      take: 5
    });

    console.log(`✓ Successfully queried ${posts.length} posts with locale field\n`);

    if (posts.length > 0) {
      console.log('Sample posts:');
      posts.forEach(post => {
        console.log(`  - ${post.slug} (locale: ${post.locale})`);
      });
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. All existing posts have been set to locale "en"');
    console.log('2. You can now create translations using the translation script');
    console.log('3. Run: npx tsx scripts/translate-blog-posts.ts');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
