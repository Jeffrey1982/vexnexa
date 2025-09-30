"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedScanResults } from '@/components/EnhancedScanResults'
import { Loader2, Scan } from 'lucide-react'
import { EnhancedScanResult } from '@/lib/scanner-enhanced'

export default function TestEnhancedScanPage() {
  const [url, setUrl] = useState('https://example.com')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EnhancedScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runScan = async () => {
    if (!url) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/scan-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Scan failed')
      }

      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            Enhanced Accessibility Scanner
          </h1>
          <p className="text-gray-600 mb-8">
            Test our 100% comprehensive accessibility scanning that goes beyond basic WCAG checks
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scan a Website</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                type="url"
                placeholder="Enter website URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={runScan}
                disabled={loading || !url}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4 mr-2" />
                    Scan
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                Scan Results for {new URL(url).hostname}
              </h2>
              <p className="text-gray-600">
                Comprehensive accessibility analysis with advanced testing
              </p>
            </div>

            <EnhancedScanResults result={result} url={url} />
          </div>
        )}

        {!result && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <Scan className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Ready to Scan
              </h3>
              <p className="text-gray-500">
                Enter a URL above and click &ldquo;Scan&rdquo; to run our enhanced accessibility analysis
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>What Makes This 100% Coverage?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Traditional Testing (60%)</h4>
                <ul className="space-y-2 text-sm">
                  <li>• 104 WCAG 2.1 AA rules via axe-core</li>
                  <li>• Color contrast analysis</li>
                  <li>• ARIA attribute validation</li>
                  <li>• Basic semantic structure</li>
                  <li>• Form accessibility</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Enhanced Testing (40%)</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Keyboard navigation flow testing</li>
                  <li>• Screen reader compatibility simulation</li>
                  <li>• Mobile accessibility verification</li>
                  <li>• Cognitive accessibility assessment</li>
                  <li>• Motion sensitivity analysis</li>
                  <li>• Advanced color vision testing</li>
                  <li>• Performance impact on assistive tech</li>
                  <li>• Language and internationalization</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}