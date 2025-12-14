/**
 * VexNexa Accessibility Assurance - Report Generator
 *
 * Generates PDF reports and stores them in Vercel Blob storage
 *
 * NOTE: Requires @vercel/blob package
 * Install with: npm install @vercel/blob
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { AssurancePDFReport, type AssuranceReportData } from './pdf-report';
import { calculateTrend } from './trends';
import { prisma } from '@/lib/prisma';

// TODO: Install @vercel/blob package
// import { put } from '@vercel/blob';

/**
 * Generate PDF report for a domain and scan
 */
export async function generateReportPDF(opts: {
  domainId: string;
  scanId: string;
  language?: string;
}): Promise<Buffer> {
  const { domainId, scanId, language = 'en' } = opts;

  console.log('[Report Generator] Generating PDF:', { domainId, scanId, language });

  // Fetch domain with latest scan data
  const domain = await prisma.assuranceDomain.findUnique({
    where: { id: domainId },
  });

  if (!domain) {
    throw new Error(`Domain not found: ${domainId}`);
  }

  // Fetch scan data
  const scan = await prisma.assuranceScan.findUnique({
    where: { id: scanId },
    include: { scan: true },
  });

  if (!scan) {
    throw new Error(`Scan not found: ${scanId}`);
  }

  // Get trend data (last 8 scans)
  const trendData = await calculateTrend(domainId, 8);

  // Prepare report data
  const reportData: AssuranceReportData = {
    domain: domain.domain,
    label: domain.label || undefined,
    currentScore: scan.score,
    threshold: domain.scoreThreshold,
    wcagAACompliance: scan.wcagAACompliance || undefined,
    wcagAAACompliance: scan.wcagAAACompliance || undefined,
    trendData,
    issuesCount: scan.issuesCount,
    impactCritical: scan.impactCritical,
    impactSerious: scan.impactSerious,
    impactModerate: scan.impactModerate,
    impactMinor: scan.impactMinor,
    language: language || domain.language,
    generatedAt: new Date(),
  };

  // Render PDF to buffer
  console.log('[Report Generator] Rendering PDF...');
  const pdfBuffer = await renderToBuffer(<AssurancePDFReport {...reportData} />);

  console.log('[Report Generator] PDF rendered:', pdfBuffer.length, 'bytes');

  return pdfBuffer;
}

/**
 * Upload PDF to Vercel Blob storage
 */
export async function uploadReportToBlob(opts: {
  domainId: string;
  scanId: string;
  pdfBuffer: Buffer;
}): Promise<string> {
  const { domainId, scanId, pdfBuffer } = opts;

  console.log('[Report Generator] Uploading to Blob storage...');

  // Generate unique filename
  const timestamp = Date.now();
  const filename = `assurance-reports/${domainId}/${scanId}-${timestamp}.pdf`;

  // TODO: Uncomment when @vercel/blob is installed
  /*
  const blob = await put(filename, pdfBuffer, {
    access: 'public',
    contentType: 'application/pdf',
    addRandomSuffix: false,
  });

  console.log('[Report Generator] PDF uploaded:', blob.url);

  return blob.url;
  */

  // Temporary: Return placeholder URL
  const placeholderUrl = `/api/assurance/reports/${scanId}/pdf`;
  console.warn('[Report Generator] @vercel/blob not installed. Using placeholder URL:', placeholderUrl);
  console.warn('[Report Generator] Install with: npm install @vercel/blob');

  return placeholderUrl;
}

/**
 * Create report record in database
 */
export async function createReportRecord(opts: {
  domainId: string;
  scanId: string;
  pdfUrl: string;
  language: string;
  score: number;
  threshold: number;
  trendData: any;
  wcagAACompliance?: number;
  wcagAAACompliance?: number;
  emailRecipients?: string[];
}): Promise<any> {
  const {
    domainId,
    scanId,
    pdfUrl,
    language,
    score,
    threshold,
    trendData,
    wcagAACompliance,
    wcagAAACompliance,
    emailRecipients = [],
  } = opts;

  console.log('[Report Generator] Creating report record in database');

  const report = await prisma.assuranceReport.create({
    data: {
      domainId,
      scanId,
      pdfUrl,
      language,
      score,
      threshold,
      trendData,
      wcagAACompliance,
      wcagAAACompliance,
      emailSentTo: emailRecipients,
      sentAt: emailRecipients.length > 0 ? new Date() : null,
    },
  });

  console.log('[Report Generator] Report record created:', report.id);

  return report;
}

/**
 * Generate complete report (PDF + upload + database record)
 */
export async function generateAndStoreReport(opts: {
  domainId: string;
  scanId: string;
  language?: string;
  emailRecipients?: string[];
}): Promise<{
  reportId: string;
  pdfUrl: string;
}> {
  const { domainId, scanId, language, emailRecipients = [] } = opts;

  console.log('[Report Generator] Generating and storing report:', {
    domainId,
    scanId,
    language,
  });

  try {
    // Generate PDF
    const pdfBuffer = await generateReportPDF({ domainId, scanId, language });

    // Upload to Blob storage
    const pdfUrl = await uploadReportToBlob({ domainId, scanId, pdfBuffer });

    // Get scan data for report record
    const scan = await prisma.assuranceScan.findUnique({
      where: { id: scanId },
    });

    if (!scan) {
      throw new Error('Scan not found');
    }

    // Get domain for threshold
    const domain = await prisma.assuranceDomain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    // Get trend data
    const trendData = await calculateTrend(domainId, 8);

    // Create database record
    const report = await createReportRecord({
      domainId,
      scanId,
      pdfUrl,
      language: language || domain.language,
      score: scan.score,
      threshold: domain.scoreThreshold,
      trendData,
      wcagAACompliance: scan.wcagAACompliance || undefined,
      wcagAAACompliance: scan.wcagAAACompliance || undefined,
      emailRecipients,
    });

    console.log('[Report Generator] Report generation complete:', {
      reportId: report.id,
      pdfUrl,
    });

    return {
      reportId: report.id,
      pdfUrl,
    };
  } catch (error) {
    console.error('[Report Generator] Error generating report:', error);
    throw error;
  }
}

/**
 * Delete old reports (12-month retention policy)
 */
export async function deleteOldReports(): Promise<{
  deleted: number;
  errors: number;
}> {
  console.log('[Report Generator] Cleaning up old reports (>12 months)');

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Find old reports
  const oldReports = await prisma.assuranceReport.findMany({
    where: {
      createdAt: {
        lt: twelveMonthsAgo,
      },
    },
  });

  console.log(`[Report Generator] Found ${oldReports.length} old reports to delete`);

  let deleted = 0;
  let errors = 0;

  // Delete PDFs from storage and database records
  for (const report of oldReports) {
    try {
      // TODO: Delete from Vercel Blob when installed
      /*
      if (report.pdfUrl.includes('blob.vercel-storage.com')) {
        await del(report.pdfUrl);
      }
      */

      // Delete database record
      await prisma.assuranceReport.delete({
        where: { id: report.id },
      });

      deleted++;
    } catch (error) {
      console.error(`[Report Generator] Error deleting report ${report.id}:`, error);
      errors++;
    }
  }

  console.log(`[Report Generator] Cleanup complete: ${deleted} deleted, ${errors} errors`);

  return { deleted, errors };
}
