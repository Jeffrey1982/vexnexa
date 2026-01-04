import { prisma } from '../src/lib/prisma'

async function createSampleBlogs() {
  // Find an admin user to be the author
  const adminUser = await prisma.user.findFirst({
    where: { isAdmin: true }
  })

  if (!adminUser) {
    console.log('No admin user found. Trying to use first user.')
    const firstUser = await prisma.user.findFirst()
    if (!firstUser) {
      console.log('No users found in database.')
      return
    }
    console.log(`Using user: ${firstUser.email}`)
  }

  const authorId = adminUser?.id || (await prisma.user.findFirst())!.id

  const blogPosts = [
    {
      title: 'Understanding Web Accessibility: A Comprehensive Guide',
      slug: 'understanding-web-accessibility',
      category: 'Guide',
      excerpt: 'Learn the fundamentals of web accessibility and why it matters for your business and users.',
      content: `# Understanding Web Accessibility

Web accessibility ensures that websites, tools, and technologies are designed and developed so that people with disabilities can use them. More specifically, people can perceive, understand, navigate, and interact with the Web.

## Why Accessibility Matters

1. **Legal Compliance**: Many countries have laws requiring digital accessibility
2. **Expanded Audience**: 15% of the world's population has some form of disability
3. **Better SEO**: Accessible sites often rank better in search engines
4. **Improved UX**: Accessibility improvements benefit all users

## Getting Started

Start by running automated scans to identify common issues, then work with manual testing to catch nuanced problems.

Visit our platform to scan your website and get detailed accessibility reports.`,
      status: 'published',
      publishedAt: new Date(),
      authorId,
      coverImage: '/images/blog/accessibility-guide.jpg'
    },
    {
      title: 'WCAG 2.1: What You Need to Know',
      slug: 'wcag-2-1-what-you-need-to-know',
      category: 'Standards',
      excerpt: 'An overview of the Web Content Accessibility Guidelines (WCAG) 2.1 and how to implement them.',
      content: `# WCAG 2.1: What You Need to Know

The Web Content Accessibility Guidelines (WCAG) 2.1 provides a comprehensive framework for making web content more accessible.

## The Four Principles

- **Perceivable**: Information must be presentable to users in ways they can perceive
- **Operable**: User interface components must be operable
- **Understandable**: Information and operation must be understandable
- **Robust**: Content must be robust enough for various assistive technologies

## Conformance Levels

- **Level A**: Basic accessibility features
- **Level AA**: Addresses major barriers (recommended minimum)
- **Level AAA**: Highest level of accessibility

## Implementation Tips

Use automated tools like our platform to catch common issues, then supplement with manual testing for complex interactions.`,
      status: 'published',
      publishedAt: new Date(),
      authorId,
      coverImage: '/images/blog/wcag-guide.jpg'
    },
    {
      title: '10 Common Accessibility Mistakes and How to Fix Them',
      slug: '10-common-accessibility-mistakes',
      category: 'Tutorial',
      excerpt: 'Discover the most common accessibility issues found in websites and learn practical solutions.',
      content: `# 10 Common Accessibility Mistakes

Here are the most frequent accessibility issues we find during scans:

1. **Missing Alt Text**: Always provide descriptive alt attributes for images
2. **Low Color Contrast**: Ensure text has sufficient contrast against backgrounds (4.5:1 for normal text)
3. **Missing Form Labels**: Every form input needs a proper label element
4. **Keyboard Navigation**: All interactive elements must be keyboard accessible
5. **Missing Skip Links**: Provide a way to skip repetitive navigation
6. **Poor Heading Structure**: Use headings in logical order (h1, h2, h3...)
7. **Non-descriptive Link Text**: Avoid "click here" - describe the destination
8. **Missing ARIA Labels**: Use ARIA to enhance semantics when needed
9. **Auto-playing Media**: Don't auto-play audio or video
10. **Time Limits**: Provide options to extend or disable time limits

Each of these issues can significantly impact users with disabilities. Our platform helps identify and fix these problems automatically.

## Get Started Today

Run a free scan on your website to see how accessible it really is.`,
      status: 'published',
      publishedAt: new Date(),
      authorId,
      coverImage: '/images/blog/common-mistakes.jpg'
    },
    {
      title: 'The Business Case for Web Accessibility',
      slug: 'business-case-for-web-accessibility',
      category: 'Business',
      excerpt: 'Why web accessibility is not just about compliance, but good business sense.',
      content: `# The Business Case for Web Accessibility

Many organizations view accessibility as a compliance checkbox. In reality, it's a business opportunity.

## Financial Benefits

- **Larger Market**: The disability market represents $490 billion in disposable income in the US alone
- **Better SEO**: Accessible sites rank better in search engines
- **Reduced Legal Risk**: Avoid costly lawsuits and settlements
- **Lower Support Costs**: Accessible sites are easier for everyone to use

## Real-World Examples

Companies like Microsoft, Apple, and Target have all benefited from strong accessibility programs. Target famously paid $6 million in a settlement and then invested heavily in accessibility - and saw increased revenue as a result.

## Getting Started

1. Run an accessibility audit
2. Prioritize critical issues
3. Train your team
4. Make it part of your process

Our platform makes steps 1 and 2 easy. Get started today.`,
      status: 'published',
      publishedAt: new Date(),
      authorId,
      coverImage: '/images/blog/business-case.jpg'
    }
  ]

  for (const post of blogPosts) {
    // Add locale field if not present (default to English)
    const postData = {
      ...post,
      locale: post.locale || 'en'
    };

    await prisma.blogPost.upsert({
      where: {
        slug_locale: {
          slug: postData.slug,
          locale: postData.locale
        }
      },
      update: {},
      create: postData
    })
    console.log(`✓ Created blog post: ${postData.title}`)
  }

  console.log('\n✨ Sample blog posts created successfully!')
}

createSampleBlogs()
  .catch((error) => {
    console.error('Error creating blog posts:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
