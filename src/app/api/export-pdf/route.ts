import { NextRequest, NextResponse } from "next/server";
import puppeteer from 'puppeteer';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

function generateReportHTML(result: ScanResult): string {
  const violationsByImpact = {
    critical: result.violations.filter(v => v.impact === 'critical'),
    serious: result.violations.filter(v => v.impact === 'serious'),
    moderate: result.violations.filter(v => v.impact === 'moderate'),
    minor: result.violations.filter(v => v.impact === 'minor'),
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#16a34a"; // green
    if (score >= 70) return "#eab308"; // yellow
    return "#dc2626"; // red
  };

  const impactColors = {
    critical: "#dc2626",
    serious: "#ea580c",
    moderate: "#eab308",
    minor: "#3b82f6",
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>WCAG Accessibility Report - ${result.url}</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.6;
          color: #374151;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #111827;
          margin: 0;
          font-size: 2.5rem;
          font-weight: bold;
        }
        .header .url {
          color: #6b7280;
          margin: 10px 0;
          font-size: 1.1rem;
        }
        .header .date {
          color: #9ca3af;
          font-size: 0.9rem;
        }
        .overview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .metric-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .metric-value {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 10px 0;
        }
        .metric-label {
          color: #6b7280;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .severity-breakdown {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 40px;
        }
        .severity-breakdown h2 {
          margin-top: 0;
          color: #111827;
        }
        .severity-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-top: 20px;
        }
        .severity-item {
          text-align: center;
        }
        .severity-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin: 0 auto 8px;
        }
        .severity-count {
          font-size: 1.5rem;
          font-weight: bold;
          color: #111827;
        }
        .severity-label {
          color: #6b7280;
          font-size: 0.8rem;
          text-transform: capitalize;
        }
        .violations-section h2 {
          color: #111827;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }
        .violation-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .violation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        .violation-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .violation-rule {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 5px 0;
        }
        .violation-rule code {
          background: #f3f4f6;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
        }
        .impact-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: white;
        }
        .violation-description {
          color: #4b5563;
          margin-bottom: 15px;
        }
        .affected-elements {
          border-left: 4px solid #e5e7eb;
          padding-left: 15px;
        }
        .affected-elements h4 {
          margin: 0 0 10px 0;
          color: #111827;
          font-size: 1rem;
        }
        .element-item {
          margin-bottom: 10px;
        }
        .element-selector {
          font-family: monospace;
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .element-html {
          font-family: monospace;
          font-size: 0.8rem;
          background: #f3f4f6;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          overflow-wrap: break-word;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
        }
        @media print {
          body { margin: 0; padding: 20px; }
          .violation-card { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>WCAG Accessibility Report</h1>
        <div class="url">${result.url}</div>
        <div class="date">Generated on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
      </div>

      <div class="overview">
        <div class="metric-card">
          <div class="metric-label">Accessibility Score</div>
          <div class="metric-value" style="color: ${getScoreColor(result.score)}">${result.score}/100</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Issues</div>
          <div class="metric-value" style="color: #111827">${result.issues}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Scan Date</div>
          <div class="metric-value" style="color: #111827; font-size: 1.2rem">${new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div class="severity-breakdown">
        <h2>Issues by Severity</h2>
        <div class="severity-grid">
          <div class="severity-item">
            <div class="severity-dot" style="background-color: ${impactColors.critical}"></div>
            <div class="severity-count">${violationsByImpact.critical.length}</div>
            <div class="severity-label">Critical</div>
          </div>
          <div class="severity-item">
            <div class="severity-dot" style="background-color: ${impactColors.serious}"></div>
            <div class="severity-count">${violationsByImpact.serious.length}</div>
            <div class="severity-label">Serious</div>
          </div>
          <div class="severity-item">
            <div class="severity-dot" style="background-color: ${impactColors.moderate}"></div>
            <div class="severity-count">${violationsByImpact.moderate.length}</div>
            <div class="severity-label">Moderate</div>
          </div>
          <div class="severity-item">
            <div class="severity-dot" style="background-color: ${impactColors.minor}"></div>
            <div class="severity-count">${violationsByImpact.minor.length}</div>
            <div class="severity-label">Minor</div>
          </div>
        </div>
      </div>

      <div class="violations-section">
        <h2>Detailed Issues</h2>
        ${result.violations.length === 0 ?
          '<div style="text-align: center; padding: 40px; color: #16a34a;"><h3>🎉 No accessibility issues found!</h3><p>This page meets WCAG 2.1 AA standards.</p></div>' :
          result.violations.map(violation => `
            <div class="violation-card">
              <div class="violation-header">
                <div>
                  <h3 class="violation-title">${violation.help}</h3>
                  <div class="violation-rule">Rule: <code>${violation.id}</code></div>
                </div>
                <div class="impact-badge" style="background-color: ${impactColors[violation.impact]}">${violation.impact}</div>
              </div>
              <div class="violation-description">${violation.description}</div>
              <div class="affected-elements">
                <h4>Affected Elements:</h4>
                ${violation.nodes.map(node => `
                  <div class="element-item">
                    <div class="element-selector">Selector: <code>${node.target.join(', ')}</code></div>
                    <div class="element-html">${node.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')
        }
      </div>

      <div class="footer">
        <p>Generated by VexNexa - Professional Accessibility Testing Platform</p>
        <p>Report based on WCAG 2.1 AA standards</p>
      </div>
    </body>
    </html>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { result } = body as { result: ScanResult };

    if (!result) {
      return NextResponse.json({
        ok: false,
        error: 'No scan result provided'
      }, { status: 400 });
    }

    console.log('🔄 Generating PDF for scan:', result.scanId);

    // Generate HTML content
    const htmlContent = generateReportHTML(result);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set content and generate PDF
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      printBackground: true
    });

    await browser.close();

    console.log('✅ PDF generated successfully');

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="accessibility-report-${result.url.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('❌ PDF generation failed:', error);

    return NextResponse.json({
      ok: false,
      error: error.message || 'PDF generation failed'
    }, { status: 500 });
  }
}