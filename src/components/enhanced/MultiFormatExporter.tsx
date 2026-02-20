"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  FileText,
  Table,
  FileSpreadsheet,
  Image,
  Mail,
  Calendar,
  Settings,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

interface ExportOptions {
  format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'json' | 'html';
  template: 'executive' | 'technical' | 'compliance' | 'custom';
  sections: string[];
  includeCharts: boolean;
  includScreenshots: boolean;
  brandingLevel: 'full' | 'minimal' | 'none';
  customTitle?: string;
  customDescription?: string;
  recipientEmail?: string;
  scheduledDate?: Date;
}

interface ScanData {
  id: string;
  url: string;
  score: number;
  issues: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    total: number;
  };
  violations: any[];
  createdAt: Date;
}

interface MultiFormatExporterProps {
  scanData: ScanData;
  className?: string;
  onExport?: (options: ExportOptions) => void;
}

export function MultiFormatExporter({ scanData, className, onExport }: MultiFormatExporterProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    template: 'executive',
    sections: ['summary', 'issues', 'recommendations'],
    includeCharts: true,
    includScreenshots: true,
    brandingLevel: 'full'
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report', icon: <FileText className="h-4 w-4" />, description: 'Professional formatted document' },
    { value: 'docx', label: 'Word Document', icon: <FileText className="h-4 w-4" />, description: 'Editable document format' },
    { value: 'xlsx', label: 'Excel Workbook', icon: <FileSpreadsheet className="h-4 w-4" />, description: 'Data analysis spreadsheet' },
    { value: 'csv', label: 'CSV Data', icon: <Table className="h-4 w-4" />, description: 'Raw data export' },
    { value: 'json', label: 'JSON Data', icon: <Table className="h-4 w-4" />, description: 'API-friendly format' },
    { value: 'html', label: 'HTML Report', icon: <FileText className="h-4 w-4" />, description: 'Web-ready format' }
  ];

  const templateOptions = [
    { value: 'executive', label: 'Executive Summary', description: 'High-level overview for stakeholders' },
    { value: 'technical', label: 'Technical Report', description: 'Detailed technical analysis' },
    { value: 'compliance', label: 'Compliance Report', description: 'WCAG compliance focused' },
    { value: 'custom', label: 'Custom Template', description: 'Customizable sections' }
  ];

  const availableSections = [
    { id: 'summary', label: 'Executive Summary', description: 'High-level overview and key metrics' },
    { id: 'issues', label: 'Issues Breakdown', description: 'Detailed accessibility violations' },
    { id: 'recommendations', label: 'Recommendations', description: 'Priority actions and next steps' },
    { id: 'trends', label: 'Trend Analysis', description: 'Historical performance data' },
    { id: 'compliance', label: 'WCAG Compliance', description: 'Standards compliance matrix' },
    { id: 'technical', label: 'Technical Details', description: 'Code-level implementation details' },
    { id: 'benchmarks', label: 'Industry Benchmarks', description: 'Competitive analysis' },
    { id: 'roi', label: 'ROI Analysis', description: 'Business impact calculations' }
  ];

  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      sections: checked
        ? [...prev.sections, sectionId]
        : prev.sections.filter(s => s !== sectionId)
    }));
  };

  const generateFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const siteName = new URL(scanData.url).hostname.replace(/[^a-zA-Z0-9]/g, '-');
    const title = exportOptions.customTitle ? exportOptions.customTitle.replace(/[^a-zA-Z0-9]/g, '-') : 'accessibility-report';

    return `${siteName}-${title}-${timestamp}.${exportOptions.format}`;
  };

  const generateCSVData = () => {
    const headers = ['Rule ID', 'Description', 'Impact', 'Elements Affected', 'WCAG Level'];
    const rows = scanData.violations.map((violation: any) => [
      violation.id || '',
      violation.description || '',
      violation.impact || 'minor',
      violation.nodes?.length || 0,
      violation.tags?.find((tag: string) => tag.includes('wcag'))?.toUpperCase() || 'N/A'
    ]);

    return [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const generateJSONData = () => {
    return JSON.stringify({
      report: {
        metadata: {
          generatedAt: new Date().toISOString(),
          scanId: scanData.id,
          url: scanData.url,
          score: scanData.score,
          exportOptions
        },
        summary: {
          overallScore: scanData.score,
          issues: scanData.issues,
          scanDate: scanData.createdAt.toISOString()
        },
        violations: scanData.violations,
        recommendations: [
          'Fix critical accessibility issues immediately',
          'Implement automated accessibility testing',
          'Train team on accessibility best practices'
        ]
      }
    }, null, 2);
  };

  const generateHTMLReport = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Report - ${new URL(scanData.url).hostname}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .score { font-size: 3em; font-weight: bold; text-align: center; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .issue { margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px; }
        .critical { border-left: 4px solid #ef4444; }
        .serious { border-left: 4px solid #f97316; }
        .moderate { border-left: 4px solid #eab308; }
        .minor { border-left: 4px solid #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Accessibility Report</h1>
        <p>${scanData.url}</p>
        <div class="score">${scanData.score}/100</div>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <p>Total issues found: ${scanData.issues.total}</p>
        <ul>
            <li>Critical: ${scanData.issues.critical}</li>
            <li>Serious: ${scanData.issues.serious}</li>
            <li>Moderate: ${scanData.issues.moderate}</li>
            <li>Minor: ${scanData.issues.minor}</li>
        </ul>
    </div>

    <div class="section">
        <h2>Top Violations</h2>
        ${scanData.violations.slice(0, 10).map((violation: any) => `
            <div class="issue ${violation.impact || 'minor'}">
                <h3>${violation.id}</h3>
                <p>${violation.description}</p>
                <small>${violation.nodes?.length || 0} elements affected</small>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ol>
            <li>Address critical issues immediately to reduce legal risk</li>
            <li>Implement automated accessibility testing in your development workflow</li>
            <li>Provide accessibility training for your development team</li>
            <li>Schedule regular accessibility audits</li>
        </ol>
    </div>
</body>
</html>`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('processing');

    try {
      let content = '';
      let blob: Blob;
      const fileName = generateFileName();

      switch (exportOptions.format) {
        case 'csv':
          content = generateCSVData();
          blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
          break;

        case 'json':
          content = generateJSONData();
          blob = new Blob([content], { type: 'application/json' });
          break;

        case 'html':
          content = generateHTMLReport();
          blob = new Blob([content], { type: 'text/html' });
          break;

        case 'pdf':
          // For PDF, we'd use a proper PDF generation library in production
          // Here we'll create a simple text version
          content = `Accessibility Report\n\nURL: ${scanData.url}\nScore: ${scanData.score}/100\n\nIssues:\nCritical: ${scanData.issues.critical}\nSerious: ${scanData.issues.serious}\nModerate: ${scanData.issues.moderate}\nMinor: ${scanData.issues.minor}\n\nTotal Violations: ${scanData.violations.length}`;
          blob = new Blob([content], { type: 'text/plain' });
          break;

        default:
          throw new Error(`Unsupported format: ${exportOptions.format}`);
      }

      saveAs(blob, fileName);
      setExportStatus('success');

      if (onExport) {
        onExport(exportOptions);
      }

      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleScheduledExport = () => {
    // Implementation for scheduling exports
    console.log('Scheduling export:', exportOptions);
  };

  const handleEmailExport = () => {
    if (!exportOptions.recipientEmail) {
      alert('Please enter recipient email address');
      return;
    }
    // Implementation for email export
    console.log('Emailing export to:', exportOptions.recipientEmail);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Multi-Format Export
        </CardTitle>
        <CardDescription>
          Export your accessibility report in various formats with custom options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Status */}
        <AnimatePresence>
          {exportStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className={
                exportStatus === 'success' ? 'border-green-200 bg-green-50' :
                exportStatus === 'error' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }>
                <div className="flex items-center gap-2">
                  {exportStatus === 'processing' && <Clock className="h-4 w-4 text-blue-600" />}
                  {exportStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {exportStatus === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  <AlertDescription>
                    {exportStatus === 'processing' && 'Generating export...'}
                    {exportStatus === 'success' && 'Export completed successfully!'}
                    {exportStatus === 'error' && 'Export failed. Please try again.'}
                  </AlertDescription>
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Format Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Export Format</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {formatOptions.map((format) => (
              <motion.div
                key={format.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  exportOptions.format === format.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
              >
                <div className="flex items-center gap-3 mb-2">
                  {format.icon}
                  <span className="font-medium">{format.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{format.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Report Template</Label>
          <Select
            value={exportOptions.template}
            onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, template: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templateOptions.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  <div>
                    <div className="font-medium">{template.label}</div>
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sections Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Include Sections</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableSections.map((section) => (
              <div key={section.id} className="flex items-start space-x-3">
                <Checkbox
                  id={section.id}
                  checked={exportOptions.sections.includes(section.id)}
                  onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={section.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:text-[var(--vn-disabled-fg)] peer-disabled:opacity-100"
                  >
                    {section.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Options</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="charts"
                checked={exportOptions.includeCharts}
                onCheckedChange={(checked) =>
                  setExportOptions(prev => ({ ...prev, includeCharts: checked as boolean }))
                }
              />
              <Label htmlFor="charts">Include charts and visualizations</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="screenshots"
                checked={exportOptions.includScreenshots}
                onCheckedChange={(checked) =>
                  setExportOptions(prev => ({ ...prev, includScreenshots: checked as boolean }))
                }
              />
              <Label htmlFor="screenshots">Include screenshots and images</Label>
            </div>
          </div>
        </div>

        {/* Custom Options */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Customization</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Custom Title</Label>
              <Input
                id="title"
                placeholder="Accessibility Audit Report"
                value={exportOptions.customTitle || ''}
                onChange={(e) =>
                  setExportOptions(prev => ({ ...prev, customTitle: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding">Branding Level</Label>
              <Select
                value={exportOptions.brandingLevel}
                onValueChange={(value: any) =>
                  setExportOptions(prev => ({ ...prev, brandingLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Branding</SelectItem>
                  <SelectItem value="minimal">Minimal Branding</SelectItem>
                  <SelectItem value="none">No Branding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Custom Description</Label>
            <Textarea
              id="description"
              placeholder="Add a custom description or notes for this report..."
              value={exportOptions.customDescription || ''}
              onChange={(e) =>
                setExportOptions(prev => ({ ...prev, customDescription: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <Button
            onClick={handleExport}
            disabled={isExporting || exportOptions.sections.length === 0}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Now'}
          </Button>

          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="email@example.com"
                value={exportOptions.recipientEmail || ''}
                onChange={(e) =>
                  setExportOptions(prev => ({ ...prev, recipientEmail: e.target.value }))
                }
                className="w-48"
              />
              <Button variant="outline" onClick={handleEmailExport}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>

            <Button variant="outline" onClick={handleScheduledExport}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </div>

        {/* File Preview */}
        <div className="text-sm text-muted-foreground">
          <strong>File name:</strong> {generateFileName()}
        </div>
      </CardContent>
    </Card>
  );
}