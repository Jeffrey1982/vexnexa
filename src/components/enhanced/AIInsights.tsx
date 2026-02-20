"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  ExternalLink,
  Code,
  Users,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { generateAIInsights, AIRecommendation } from '@/lib/ai-insights';
import { Violation } from '@/lib/axe-types';

interface AIInsightsProps {
  violations: Violation[];
  currentScore: number;
  trend?: number;
  className?: string;
}

export function AIInsights({ violations, currentScore, trend, className }: AIInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<AIRecommendation | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'recommendation' | 'optimization'>('all');

  const insights = useMemo(() => {
    return generateAIInsights(violations, currentScore, trend);
  }, [violations, currentScore, trend]);

  const filteredInsights = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter(insight => insight.insight.type === filter);
  }, [insights, filter]);

  const priorityStats = useMemo(() => {
    return {
      high: insights.filter(i => i.insight.priority === 'high').length,
      medium: insights.filter(i => i.insight.priority === 'medium').length,
      low: insights.filter(i => i.insight.priority === 'low').length,
      totalImprovement: insights.reduce((sum, i) => sum + i.estimatedImprovement, 0)
    };
  }, [insights]);

  const getInsightIcon = useCallback((type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
      case 'optimization':
        return <Zap className="h-5 w-5 text-green-600" />;
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      default:
        return <Brain className="h-5 w-5 text-muted-foreground" />;
    }
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30';
      default:
        return 'border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03]';
    }
  }, []);

  const getEffortBadge = useCallback((effort: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800 dark:text-red-300'
    };
    return colors[effort as keyof typeof colors] || colors.medium;
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          AI-Powered Accessibility Insights
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
        <CardDescription>
          Smart recommendations powered by accessibility expertise and pattern recognition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-purple-50 rounded-lg"
          >
            <Brain className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-800">{insights.length}</div>
            <div className="text-sm text-purple-600">AI Insights</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg"
          >
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-800 dark:text-red-300">{priorityStats.high}</div>
            <div className="text-sm text-red-600">Critical Issues</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg"
          >
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">+{priorityStats.totalImprovement}</div>
            <div className="text-sm text-blue-600">Potential Score Gain</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg"
          >
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-800 dark:text-green-300">
              {Math.round(insights.reduce((sum, i) => sum + i.insight.confidence, 0) / insights.length)}%
            </div>
            <div className="text-sm text-green-600">Avg Confidence</div>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({insights.length})</TabsTrigger>
            <TabsTrigger value="critical">Critical ({insights.filter(i => i.insight.type === 'critical').length})</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendations ({insights.filter(i => i.insight.type === 'recommendation').length})</TabsTrigger>
            <TabsTrigger value="optimization">Optimizations ({insights.filter(i => i.insight.type === 'optimization').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4">
            <AnimatePresence mode="wait">
              {filteredInsights.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 text-muted-foreground"
                >
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No insights available for this category.</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {filteredInsights.map((recommendation, index) => (
                    <motion.div
                      key={recommendation.insight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border rounded-lg p-4 ${getPriorityColor(recommendation.insight.priority)} hover:shadow-md transition-shadow cursor-pointer`}
                      onClick={() => setSelectedInsight(recommendation)}
                    >
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getInsightIcon(recommendation.insight.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg truncate">{recommendation.insight.title}</h3>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge variant="outline" className={`${getEffortBadge(recommendation.insight.effort)} text-xs`}>
                                    {recommendation.insight.effort} effort
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {recommendation.insight.confidence}% confidence
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-gray-700 mb-3 text-sm sm:text-base">{recommendation.insight.description}</p>
                            </div>
                          </div>
                          <Badge variant={recommendation.insight.priority === 'high' ? 'destructive' : 'secondary'} className="ml-2">
                            {recommendation.insight.priority}
                          </Badge>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs sm:text-sm">{recommendation.insight.estimatedTimeToFix}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-xs sm:text-sm">+{recommendation.estimatedImprovement} points</span>
                          </div>
                          <div className="flex items-center gap-1 min-w-0">
                            <DollarSign className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="text-blue-600 text-xs sm:text-sm truncate">{recommendation.insight.businessValue}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        {/* Detailed Insight Modal */}
        {selectedInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedInsight(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {getInsightIcon(selectedInsight.insight.type)}
                    <div>
                      <h2 className="text-2xl font-bold">{selectedInsight.insight.title}</h2>
                      <p className="text-muted-foreground">{selectedInsight.insight.category} • {selectedInsight.insight.priority} priority</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedInsight(null)}>
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-gray-700">{selectedInsight.insight.description}</p>
                    </div>

                    {/* Impact */}
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Impact
                      </h3>
                      <p className="text-gray-700">{selectedInsight.insight.impact}</p>
                    </div>

                    {/* Action Steps */}
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Recommended Actions
                      </h3>
                      <ol className="list-decimal list-inside space-y-2">
                        {selectedInsight.suggestedActions.map((action, index) => (
                          <li key={index} className="text-gray-700">{action}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Technical Details */}
                    {selectedInsight.insight.technicalDetails && (
                      <div>
                        <h3 className="font-semibold mb-2">Technical Details</h3>
                        <p className="text-gray-700">{selectedInsight.insight.technicalDetails}</p>
                      </div>
                    )}

                    {/* Code Example */}
                    {selectedInsight.insight.codeExample && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Code Example
                        </h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{selectedInsight.insight.codeExample}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Confidence</span>
                          <span className="font-medium">{selectedInsight.insight.confidence}%</span>
                        </div>
                        <Progress value={selectedInsight.insight.confidence} className="h-2" />

                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Effort Required</span>
                          <Badge className={getEffortBadge(selectedInsight.insight.effort)}>
                            {selectedInsight.insight.effort}
                          </Badge>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Score Improvement</span>
                          <span className="font-medium text-green-600">+{selectedInsight.estimatedImprovement}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Time to Fix</span>
                          <span className="font-medium">{selectedInsight.insight.estimatedTimeToFix}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Resources */}
                    {selectedInsight.resources.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Helpful Resources</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedInsight.resources.map((resource, index) => (
                              <a
                                key={index}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{resource.title}</div>
                                  <div className="text-xs text-muted-foreground capitalize">{resource.type}</div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Dependencies */}
                    {selectedInsight.dependencies.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Dependencies</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {selectedInsight.dependencies.map((dep, index) => (
                              <div key={index} className="text-sm text-gray-700 flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                {dep}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}