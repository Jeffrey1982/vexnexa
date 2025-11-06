import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('changelog')

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: {
      title: t('metadata.title'),
      description: t('metadata.description'),
      url: 'https://tutusporta.com/changelog',
    },
    twitter: {
      card: 'summary',
      title: t('metadata.title'),
      description: t('metadata.description'),
    },
    alternates: {
      canonical: 'https://tutusporta.com/changelog',
    },
  }
}

export default async function ChangelogPage() {
  const t = await getTranslations('changelog')

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-6 mb-12">
          <h1 className="font-display text-4xl font-bold">
            {t('title')}
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">{t('betaLaunch.title')}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{t('betaLaunch.version')}</Badge>
                  <span className="text-sm text-muted-foreground">{t('betaLaunch.date')}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-success mb-2">{t('betaLaunch.newFeatures')}</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    {(t.raw('betaLaunch.features') as string[]).map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-muted-foreground">{t('upcoming.crawling.title')}</CardTitle>
                <Badge variant="outline">{t('upcoming.crawling.badge')}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('upcoming.crawling.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-muted-foreground">{t('upcoming.teamFeatures.title')}</CardTitle>
                <Badge variant="outline">{t('upcoming.teamFeatures.badge')}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-muted-foreground">
                {(t.raw('upcoming.teamFeatures.features') as string[]).map((feature, index) => (
                  <p key={index}>• {feature}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center pt-12">
          <Button asChild>
            <Link href="/auth/register">
              {t('cta')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
