import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/layout/Section'
import { CheckCircle2, Home } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thank You',
  description: 'Thank you for contacting VexNexa. We\'ll get back to you within 24 hours.',
}

export default function ThankYouPage() {
  return (
    <Section className="py-32 text-center" background="gradient">
      <div className="max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-display-md text-charcoal mb-4">
          Thank you!
        </h1>
        <p className="text-xl text-steel-600 mb-8">
          We've received your message and will get back to you within 24 hours.
          <br />
          Check your email for a confirmation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Back to home
            </Link>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <Link href="/blog">
              Browse our blog
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  )
}
