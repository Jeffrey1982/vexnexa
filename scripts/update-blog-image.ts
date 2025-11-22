import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️  Updating blog post cover image...');

  try {
    const blogPost = await prisma.blogPost.updateMany({
      where: {
        slug: 'vexnexa-toekomst-web-toegankelijkheid-vexnexa'
      },
      data: {
        coverImage: '/heroImage.jpeg'
      }
    });

    console.log('✅ Blog post cover image updated successfully!');
    console.log(`   Updated ${blogPost.count} post(s)`);
  } catch (error) {
    console.error('❌ Error updating blog post:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
