"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Download, Globe, AlertTriangle, CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";
import Link from "next/link";

interface ScanResult {
  scanId: string;
  url: string;
  score: number;
  issues: number;
  violations: Array<{
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    help: string;
    description: string;
    nodes: Array<{
      target: string[];
      html: string;
    }>;
  }>;
}

const impactColors = {
  critical: "bg-red-500",
  serious: "bg-orange-500",
  moderate: "bg-yellow-500",
  minor: "bg-blue-500",
};

const impactIcons = {
  critical: AlertTriangle,
  serious: AlertCircle,
  moderate: AlertCircle,
  minor: Info,
};

function ScanResultsContent() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const scanId = searchParams.get('scanId');

    if (scanId) {
      // Fetch real scan results
      fetch(`/api/scans/${scanId}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            setResult(data.result);
          } else {
            setError(data.error || 'Failed to load scan results');
          }
        })
        .catch(err => {
          setError('Failed to load scan results');
        })
        .finally(() => setLoading(false));
    } else {
      setError('No scan ID provided');
      setLoading(false);
    }
  }, [searchParams]);

  const handleExportPDF = async () => {
    console.log('🔄 Export PDF button clicked!', result);
    if (!result) {
      console.log('❌ No result data available');
      return;
    }

    setExportLoading(true);
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;

      // Create new PDF instance
      const pdf = new jsPDF();

      // Set up PDF styling
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }

        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * (fontSize * 0.4) + 5;

        // Check if we need a new page
        if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      const addSpace = (space: number = 10) => {
        yPosition += space;
      };

      // Title
      addText('WCAG Accessibility Report', 20, true);
      addText(result.url, 14, false);
      addText(`Generated on ${new Date().toLocaleDateString()}`, 10, false);
      addSpace(15);

      // Overview
      addText('Overview', 16, true);
      addText(`Accessibility Score: ${result.score}/100`, 12, false);
      addText(`Total Issues: ${result.issues}`, 12, false);
      addSpace(15);

      // Issues by severity
      const violationsByImpact = {
        critical: result.violations.filter(v => v.impact === 'critical'),
        serious: result.violations.filter(v => v.impact === 'serious'),
        moderate: result.violations.filter(v => v.impact === 'moderate'),
        minor: result.violations.filter(v => v.impact === 'minor'),
      };

      addText('Issues by Severity', 16, true);
      addText(`Critical: ${violationsByImpact.critical.length}`, 12, false);
      addText(`Serious: ${violationsByImpact.serious.length}`, 12, false);
      addText(`Moderate: ${violationsByImpact.moderate.length}`, 12, false);
      addText(`Minor: ${violationsByImpact.minor.length}`, 12, false);
      addSpace(15);

      // Detailed issues
      if (result.violations.length > 0) {
        addText('Detailed Issues', 16, true);

        result.violations.forEach((violation, index) => {
          addText(`${index + 1}. ${violation.help}`, 14, true);
          addText(`Impact: ${violation.impact.toUpperCase()}`, 11, false);
          addText(`Rule: ${violation.id}`, 11, false);
          addText(violation.description, 11, false);

          if (violation.nodes.length > 0) {
            addText('Affected Elements:', 12, true);
            violation.nodes.forEach((node, nodeIndex) => {
              addText(`Selector: ${node.target.join(', ')}`, 10, false);
              addText(`HTML: ${node.html}`, 10, false);
            });
          }
          addSpace(10);
        });
      } else {
        addText('🎉 No accessibility issues found!', 14, true);
        addText('This page meets WCAG 2.1 AA standards.', 12, false);
      }

      addSpace(20);
      addText('Generated by VexNexa - Professional Accessibility Testing Platform', 10, false);
      addText('Report based on WCAG 2.1 AA standards', 10, false);

      // Save the PDF
      const fileName = `accessibility-report-${result.url.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;
      pdf.save(fileName);

    } catch (err: any) {
      console.error('PDF generation error:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>No scan results found.</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const violationsByImpact = {
    critical: result.violations.filter(v => v.impact === 'critical'),
    serious: result.violations.filter(v => v.impact === 'serious'),
    moderate: result.violations.filter(v => v.impact === 'moderate'),
    minor: result.violations.filter(v => v.impact === 'minor'),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">WCAG Accessibility Report</h1>
              <div className="flex items-center gap-2 mt-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">{result.url}</span>
              </div>
            </div>
            <Button onClick={handleExportPDF} disabled={exportLoading}>
              {exportLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {exportLoading ? 'Generating PDF...' : 'Export PDF'}
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Accessibility Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                {result.score}/100
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {result.score >= 90 ? 'Excellent' : result.score >= 70 ? 'Good' : 'Needs Improvement'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{result.issues}</div>
              <p className="text-sm text-gray-500 mt-1">Issues found</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Scan Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString()}
              </div>
              <p className="text-sm text-gray-500 mt-1">Latest scan</p>
            </CardContent>
          </Card>
        </div>

        {/* Issues Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Issues by Severity</CardTitle>
            <CardDescription>
              WCAG 2.1 AA compliance violations found on this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(violationsByImpact).map(([impact, violations]) => {
                const Icon = impactIcons[impact as keyof typeof impactIcons];
                return (
                  <div key={impact} className="text-center">
                    <div className={`w-3 h-3 ${impactColors[impact as keyof typeof impactColors]} rounded-full mx-auto mb-2`}></div>
                    <div className="text-2xl font-bold">{violations.length}</div>
                    <div className="text-sm text-gray-600 capitalize">{impact}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Issues */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Detailed Issues</h2>

          {result.violations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No accessibility issues found!</h3>
                <p className="text-gray-600 dark:text-gray-400">This page meets WCAG 2.1 AA standards.</p>
              </CardContent>
            </Card>
          ) : (
            result.violations.map((violation, index) => {
              const Icon = impactIcons[violation.impact];
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${
                          violation.impact === 'critical' ? 'text-red-500' :
                          violation.impact === 'serious' ? 'text-orange-500' :
                          violation.impact === 'moderate' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                        <div>
                          <CardTitle className="text-lg">{violation.help}</CardTitle>
                          <CardDescription className="mt-1">
                            Rule: <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">{violation.id}</code>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={
                        violation.impact === 'critical' ? 'destructive' :
                        violation.impact === 'serious' ? 'destructive' :
                        violation.impact === 'moderate' ? 'default' :
                        'secondary'
                      }>
                        {violation.impact}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{violation.description}</p>

                    <div className="border-l-4 border-gray-200 dark:border-gray-700 pl-4">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Affected Elements:</h4>
                      {violation.nodes.map((node, nodeIndex) => (
                        <div key={nodeIndex} className="mb-3">
                          <div className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-1">
                            Selector: <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">{node.target.join(', ')}</code>
                          </div>
                          <div className="text-sm font-mono bg-gray-50 dark:bg-slate-800 p-2 rounded border dark:border-gray-700">
                            {node.html}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Action Items */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Recommended actions to improve accessibility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {violationsByImpact.critical.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Fix {violationsByImpact.critical.length} critical issue{violationsByImpact.critical.length !== 1 ? 's' : ''} immediately</span>
                </div>
              )}
              {violationsByImpact.serious.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Address {violationsByImpact.serious.length} serious issue{violationsByImpact.serious.length !== 1 ? 's' : ''} within 1 week</span>
                </div>
              )}
              {violationsByImpact.moderate.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Plan fixes for {violationsByImpact.moderate.length} moderate issue{violationsByImpact.moderate.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ScanResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading scan results...</p>
        </div>
      </div>
    }>
      <ScanResultsContent />
    </Suspense>
  );
}