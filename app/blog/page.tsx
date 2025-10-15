"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Section } from "@/components/layout/Section"
import Link from "next/link"
import { Calendar, Clock, ArrowRight } from "lucide-react"

// Placeholder blog posts - replace with actual MDX content
const posts = [
  {
    slug: "modern-website-checklist-2024",
    title: "The 2024 Modern Website Checklist: Performance, Accessibility, and SEO",
    excerpt: "Essential requirements for shipping a website that ranks, converts, and complies with accessibility standards.",
    date: "2024-01-15",
    readTime: "8 min read",
    tags: ["Websites", "Performance", "Accessibility"],
  },
  {
    slug: "automation-roi-small-teams",
    title: "Calculating Automation ROI for Small Teams",
    excerpt: "How to determine if workflow automation is worth it—with real examples and ROI calculations.",
    date: "2024-01-10",
    readTime: "6 min read",
    tags: ["Automation", "ROI", "Strategy"],
  },
  {
    slug: "ai-chatbots-that-dont-suck",
    title: "Building AI Chatbots That Don't Suck",
    excerpt: "Why most AI chatbots fail and how to build one that actually helps your team.",
    date: "2024-01-05",
    readTime: "10 min read",
    tags: ["AI", "Integration", "Best Practices"],
  },
]

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <Section className="pt-12 md:pt-20 pb-16 text-center" background="gradient">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-display-lg md:text-display-xl text-charcoal mb-6">
            <span className="text-primary">Insights</span> on digital transformation
          </h1>
          <p className="text-xl text-steel-600 max-w-3xl mx-auto mb-8">
            Practical articles on web development, automation, AI, and building better digital products.
          </p>
        </motion.div>
      </Section>

      {/* Blog Posts Grid */}
      <Section background="white">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/blog/${post.slug}`}>
                <Card elevation="md" className="h-full hover:border-primary transition-all group">
                  {/* Featured Image Placeholder */}
                  <div className="bg-gradient-to-br from-primary/20 to-purple-100 h-48 flex items-center justify-center mb-6 rounded-lg">
                    <p className="text-steel-600">[Featured image]</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-steel-100 text-steel-700 text-xs font-medium rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Content */}
                  <h2 className="text-xl font-bold text-charcoal mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-steel-600 mb-4 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-steel-500 pt-4 border-t border-steel-200">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center text-primary font-medium group-hover:underline">
                    Read more <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Placeholder message */}
        <div className="text-center mt-12 p-8 bg-steel-50 rounded-lg">
          <p className="text-steel-600">
            More articles coming soon. Subscribe to our newsletter to get notified.
          </p>
        </div>
      </Section>
    </>
  )
}
