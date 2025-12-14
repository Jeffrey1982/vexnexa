"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { ArrowLeft, ArrowRight, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreBadge } from '@/components/ScoreBadge';

interface ScanData {
  id: string;
  score: number;
  date: Date;
  issues: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  violations: Array<{
    id: string;
    impact: string;
    description: string;
    nodes: { target: string[] }[];
  }>;
}

interface BeforeAfterComparisonProps {
  beforeScan: ScanData;
  afterScan: ScanData;
  className?: string;
}

export function BeforeAfterComparison({ beforeScan, afterScan, className }: BeforeAfterComparisonProps) {
  const [currentView, setCurrentView] = useState<'side-by-side' | 'overlay' | 'diff'>('side-by-side');
  const [showDetails, setShowDetails] = useState(false);

  const scoreDifference = afterScan.score - beforeScan.score;
  const issuesDifference = afterScan.issues.total - beforeScan.issues.total;

  const getComparisonData = () => {
    return {
      scoreImprovement: scoreDifference,
      issuesReduced: -issuesDifference,
      criticalReduced: beforeScan.issues.critical - afterScan.issues.critical,
      seriousReduced: beforeScan.issues.serious - afterScan.issues.serious,
      moderateReduced: beforeScan.issues.moderate - afterScan.issues.moderate,
      minorReduced: beforeScan.issues.minor - afterScan.issues.minor,
    };
  };

  const comparison = getComparisonData();

  const getViolationsDiff = () => {
    const beforeViolations = beforeScan.violations.map(v => `${v.id}: ${v.description} (${v.nodes.length} elements)`).join('\n');
    const afterViolations = afterScan.violations.map(v => `${v.id}: ${v.description} (${v.nodes.length} elements)`).join('\n');
    return { before: beforeViolations, after: afterViolations };
  };

  const renderScoreComparison = () => (
    <div className="grid grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-center"
      >
        <div className="text-sm text-gray-600 mb-2">Before</div>
        <ScoreBadge score={beforeScan.score} size="lg" />
        <div className="text-xs text-gray-700 dark:text-gray-600 dark:text-gray-400 mt-2">
          {beforeScan.date.toLocaleDateString()}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-center"
      >
        <div className="text-sm text-gray-600 mb-2">After</div>
        <ScoreBadge score={afterScan.score} size="lg" />
        <div className="text-xs text-gray-700 dark:text-gray-600 dark:text-gray-400 mt-2">
          {afterScan.date.toLocaleDateString()}
        </div>
      </motion.div>
    </div>
  );

  const renderImpactBreakdown = () => (
    <div className="space-y-4">
      {[
        { label: 'Critical', before: beforeScan.issues.critical, after: afterScan.issues.critical, color: 'red' },
        { label: 'Serious', before: beforeScan.issues.serious, after: afterScan.issues.serious, color: 'orange' },
        { label: 'Moderate', before: beforeScan.issues.moderate, after: afterScan.issues.moderate, color: 'yellow' },
        { label: 'Minor', before: beforeScan.issues.minor, after: afterScan.issues.minor, color: 'gray' },
      ].map(({ label, before, after, color }) => {
        const diff = after - before;
        return (
          <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full bg-${color}-400`} />
              <span className="font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">{before} → {after}</div>
              <div className={`flex items-center gap-1 ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {diff < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : diff > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : null}
                <span className="text-sm font-medium">
                  {diff === 0 ? '0' : diff > 0 ? `+${diff}` : `${diff}`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderOverlayView = () => (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full h-64 bg-gradient-to-r from-red-100 to-green-100 rounded-lg overflow-hidden"
      >
        <div className="absolute inset-0 flex">
          <div className="w-1/2 bg-red-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-semibold text-red-700">Before</div>
              <div className="text-3xl font-bold text-red-800">{beforeScan.issues.total}</div>
              <div className="text-sm text-red-600">issues</div>
            </div>
          </div>
          <div className="w-1/2 bg-green-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-700">After</div>
              <div className="text-3xl font-bold text-green-800">{afterScan.issues.total}</div>
              <div className="text-sm text-green-600">issues</div>
            </div>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <RotateCcw className="w-6 h-6 text-gray-600" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );

  const violationsDiff = getViolationsDiff();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Before vs After Comparison
          <div className="flex items-center gap-2">
            <Badge variant={scoreDifference >= 0 ? 'default' : 'destructive'}>
              {scoreDifference >= 0 ? '+' : ''}{scoreDifference} points
            </Badge>
            <Badge variant={issuesDifference <= 0 ? 'default' : 'destructive'}>
              {issuesDifference <= 0 ? '' : '+'}{issuesDifference} issues
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Compare accessibility improvements between scans
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Button
            variant={currentView === 'side-by-side' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('side-by-side')}
          >
            Side by Side
          </Button>
          <Button
            variant={currentView === 'overlay' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('overlay')}
          >
            Overlay
          </Button>
          <Button
            variant={currentView === 'diff' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('diff')}
          >
            Text Diff
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'side-by-side' && (
              <Tabs defaultValue="scores" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="scores">Scores</TabsTrigger>
                  <TabsTrigger value="issues">Issue Breakdown</TabsTrigger>
                </TabsList>
                <TabsContent value="scores" className="mt-4">
                  {renderScoreComparison()}
                </TabsContent>
                <TabsContent value="issues" className="mt-4">
                  {renderImpactBreakdown()}
                </TabsContent>
              </Tabs>
            )}

            {currentView === 'overlay' && renderOverlayView()}

            {currentView === 'diff' && (
              <div className="rounded-lg overflow-hidden border">
                <ReactDiffViewer
                  oldValue={violationsDiff.before}
                  newValue={violationsDiff.after}
                  splitView={true}
                  showDiffOnly={false}
                  hideLineNumbers={false}
                  styles={{
                    contentText: {
                      fontSize: '12px',
                    },
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {comparison.scoreImprovement >= 0 ? '+' : ''}{comparison.scoreImprovement}
            </div>
            <div className="text-xs text-gray-600">Score Change</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {comparison.issuesReduced >= 0 ? '+' : ''}{comparison.issuesReduced}
            </div>
            <div className="text-xs text-gray-600">Issues Fixed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {comparison.criticalReduced >= 0 ? '+' : ''}{comparison.criticalReduced}
            </div>
            <div className="text-xs text-gray-600">Critical Fixed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {comparison.seriousReduced >= 0 ? '+' : ''}{comparison.seriousReduced}
            </div>
            <div className="text-xs text-gray-600">Serious Fixed</div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}