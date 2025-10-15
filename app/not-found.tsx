import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/layout/Section'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <Section className="py-32 text-center" background="gradient">
      <div className="max-w-2xl mx-auto">
        <div className="text-8xl font-bold text-primary mb-6">404</div>
        <h1 className="text-display-md text-charcoal mb-4">
          Page not found
        </h1>
        <p className="text-xl text-steel-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Go home
            </Link>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <Link href="/contact">
              <Search className="w-5 h-5 mr-2" />
              Get help
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  )
}
