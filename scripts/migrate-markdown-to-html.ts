import { PrismaClient } from '@prisma/client';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const prisma = new PrismaClient();

// Setup DOMPurify with JSDOM for Node.js environment
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

interface MigrationResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ slug: string; error: string }>;
}

async function convertMarkdownToHTML(markdown: string): Promise<string> {
  // Configure marked options
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert \n to <br>
  });

  // Convert markdown to HTML
  const html = await marked(markdown);

  // Sanitize HTML
  const sanitized = purify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'strike',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote',
      'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'hr', 'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class',
      'target', 'rel'
    ],
  });

  return sanitized;
}

async function migratePost(postId: string, slug: string, markdownContent: string, dryRun: boolean = false): Promise<boolean> {
  try {
    console.log(`  Converting: ${slug}`);

    // Convert markdown to HTML
    const htmlContent = await convertMarkdownToHTML(markdownContent);

    // Preview first 100 characters
    console.log(`    Preview: ${htmlContent.substring(0, 100)}...`);

    if (!dryRun) {
      // Update the post in database
      await prisma.blogPost.update({
        where: { id: postId },
        data: { content: htmlContent }
      });
      console.log(`    ✅ Updated successfully`);
    } else {
      console.log(`    [DRY RUN] Would update post`);
    }

    return true;
  } catch (error: any) {
    console.error(`    ❌ Error: ${error.message}`);
    return false;
  }
}

async function runMigration(dryRun: boolean = false) {
  console.log('========================================');
  console.log('MARKDOWN TO HTML MIGRATION SCRIPT');
  console.log('========================================\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('⚠️  PRODUCTION MODE - Changes will be saved to database\n');
  }

  const result: MigrationResult = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    // Fetch all blog posts
    console.log('Fetching all blog posts...\n');
    const posts = await prisma.blogPost.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        status: true
      }
    });

    result.total = posts.length;
    console.log(`Found ${posts.length} blog posts to migrate\n`);

    if (posts.length === 0) {
      console.log('No posts to migrate. Exiting.\n');
      return result;
    }

    // Process each post
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n[${i + 1}/${posts.length}] Processing: "${post.title}" (${post.status})`);

      const success = await migratePost(post.id, post.slug, post.content, dryRun);

      if (success) {
        result.success++;
      } else {
        result.failed++;
        result.errors.push({
          slug: post.slug,
          error: 'Migration failed'
        });
      }
    }

    // Print summary
    console.log('\n========================================');
    console.log('MIGRATION SUMMARY');
    console.log('========================================');
    console.log(`Total posts: ${result.total}`);
    console.log(`✅ Successful: ${result.success}`);
    console.log(`❌ Failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(err => {
        console.log(`  - ${err.slug}: ${err.error}`);
      });
    }

    console.log('\n========================================\n');

    if (dryRun) {
      console.log('✅ Dry run completed. Run without --dry-run flag to apply changes.\n');
    } else {
      console.log('✅ Migration completed!\n');
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return result;
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

// Run migration
runMigration(dryRun)
  .then((result) => {
    if (result.failed > 0) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
