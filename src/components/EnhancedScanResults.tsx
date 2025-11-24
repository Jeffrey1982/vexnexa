"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Keyboard,
  Eye,
  Smartphone,
  Brain,
  Zap,
  Palette,
  Timer,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react"
import { EnhancedScanResult } from "@/lib/scanner-enhanced"

interface EnhancedScanResultsProps {
  result: EnhancedScanResult
  url: string
}

export function EnhancedScanResults({ result, url }: EnhancedScanResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800"
    if (score >= 70) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive'
      case 'serious': return 'destructive'
      case 'moderate': return 'outline'
      case 'minor': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Enhanced Accessibility Score</span>
            <Badge className={getScoreBadgeColor(result.score)}>
              {result.score}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Accessibility</span>
                <span className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}%
                </span>
              </div>
              <Progress value={result.score} className="h-3" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-red-600 font-semibold">{result.impactCritical}</div>
                <div className="text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-orange-600 font-semibold">{result.impactSerious}</div>
                <div className="text-gray-600">Serious</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-600 font-semibold">{result.impactModerate}</div>
                <div className="text-gray-600">Moderate</div>
              </div>
              <div className="text-center">
                <div className="text-blue-600 font-semibold">{result.impactMinor}</div>
                <div className="text-gray-600">Minor</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Testing Categories */}
      <Tabs defaultValue="keyboard" className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          <TabsTrigger value="keyboard" className="flex items-center gap-1">
            <Keyboard className="h-4 w-4" />
            <span className="hidden sm:inline">Keyboard</span>
          </TabsTrigger>
          <TabsTrigger value="screen-reader" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Screen Reader</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-1">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Mobile</span>
          </TabsTrigger>
          <TabsTrigger value="cognitive" className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Cognitive</span>
          </TabsTrigger>
          <TabsTrigger value="motion" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Motion</span>
          </TabsTrigger>
          <TabsTrigger value="color" className="flex items-center gap-1">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Color</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Language</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keyboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Navigation
                <Badge className={getScoreBadgeColor(result.keyboardNavigation.score)}>
                  {result.keyboardNavigation.score}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{result.keyboardNavigation.focusableElements}</div>
                  <div className="text-sm text-gray-600">Focusable Elements</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.keyboardNavigation.skipLinks ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Skip Links</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.keyboardNavigation.focusVisible ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Focus Visible</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.keyboardNavigation.tabOrder ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Tab Order</div>
                </div>
              </div>

              {result.keyboardNavigation.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Issues Found:</h4>
                  {result.keyboardNavigation.issues.map((issue, index) => (
                    <Alert key={index} className="overflow-hidden">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <AlertTitle className="capitalize break-words">{issue.type.replace('-', ' ')}</AlertTitle>
                      <AlertDescription className="break-words">{issue.description}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screen-reader" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Screen Reader Compatibility
                <Badge className={getScoreBadgeColor(result.screenReaderCompatibility.score)}>
                  {result.screenReaderCompatibility.score}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{result.screenReaderCompatibility.ariaLabels}</div>
                  <div className="text-sm text-gray-600">ARIA Labels</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{result.screenReaderCompatibility.landmarks}</div>
                  <div className="text-sm text-gray-600">Landmarks</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{result.screenReaderCompatibility.altTexts}</div>
                  <div className="text-sm text-gray-600">Alt Texts</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.screenReaderCompatibility.headingStructure ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Heading Structure</div>
                </div>
              </div>

              {result.screenReaderCompatibility.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Issues Found:</h4>
                  {result.screenReaderCompatibility.issues.map((issue, index) => (
                    <Alert key={index} className="overflow-hidden">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <AlertTitle className="capitalize break-words">{issue.type.replace('-', ' ')}</AlertTitle>
                      <AlertDescription className="break-words">{issue.description}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile Accessibility
                <Badge className={getScoreBadgeColor(result.mobileAccessibility.score)}>
                  {result.mobileAccessibility.score}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{result.mobileAccessibility.touchTargets}</div>
                  <div className="text-sm text-gray-600">Adequate Touch Targets</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.mobileAccessibility.viewport ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Viewport</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.mobileAccessibility.orientation ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Orientation</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.mobileAccessibility.gestureAlternatives ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Gesture Alternatives</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Cognitive Accessibility
                <Badge className={getScoreBadgeColor(result.cognitiveAccessibility.score)}>
                  {result.cognitiveAccessibility.score}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.cognitiveAccessibility.timeouts ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">No Timeouts</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.cognitiveAccessibility.errorHandling ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Error Handling</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{Math.round(result.cognitiveAccessibility.simpleLanguage)}%</div>
                  <div className="text-sm text-gray-600">Simple Language</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.cognitiveAccessibility.consistentNavigation ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Consistent Navigation</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Motion & Animation
                <Badge className={getScoreBadgeColor(result.motionAndAnimation.score)}>
                  {result.motionAndAnimation.score}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.motionAndAnimation.reducedMotion ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Reduced Motion</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.motionAndAnimation.autoplay ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">No Autoplay</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.motionAndAnimation.parallax ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Parallax Safe</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.motionAndAnimation.vestibularDisorders ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Vestibular Safe</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="color" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Advanced Color Vision
                <Badge className={getScoreBadgeColor(result.advancedColorVision.score)}>
                  {result.advancedColorVision.score}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.advancedColorVision.deuteranopia ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Deuteranopia</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.advancedColorVision.protanopia ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Protanopia</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.advancedColorVision.tritanopia ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Tritanopia</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.advancedColorVision.achromatopsia ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Achromatopsia</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Performance Impact
                <Badge className={getScoreBadgeColor(result.performanceImpact.score)}>
                  {result.performanceImpact.score}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{result.performanceImpact.loadTime}ms</div>
                  <div className="text-sm text-gray-600">Load Time</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{result.performanceImpact.largeElements}</div>
                  <div className="text-sm text-gray-600">DOM Elements</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.performanceImpact.assistiveTechFriendly ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">AT Friendly</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language Support
                <Badge className={getScoreBadgeColor(result.languageSupport.score)}>
                  {result.languageSupport.score}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {result.languageSupport.languageDetected || 'None'}
                  </div>
                  <div className="text-sm text-gray-600">Language</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.languageSupport.directionality ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <XCircle className="h-6 w-6 text-red-600" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Directionality</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {result.languageSupport.multiLanguage ?
                      <CheckCircle className="h-6 w-6 text-green-600" /> :
                      <Info className="h-6 w-6 text-gray-400" />
                    }
                  </div>
                  <div className="text-sm text-gray-600">Multi-language</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Traditional axe-core Violations */}
      {result.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Traditional WCAG Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.violations.map((violation, index) => (
                <Alert key={index} className="overflow-hidden">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <AlertTitle className="flex items-center gap-2 flex-wrap">
                    {violation.help}
                    <Badge variant={getImpactColor(violation.impact || 'moderate')}>
                      {violation.impact}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="break-words">{violation.description}</p>
                    <p className="text-sm text-gray-600 mt-1 break-words">
                      Rule: {violation.id} • {violation.nodes?.length || 0} element(s) affected
                    </p>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}