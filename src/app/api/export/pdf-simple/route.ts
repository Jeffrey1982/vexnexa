import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Violation, computeIssueStats, getTopViolations } from "@/lib/axe-types";
import { formatDate } from "@/lib/format";

export async function POST(req: NextRequest) {
  try {
    const { scanId } = await req.json();

    if (!scanId) {
      return NextResponse.json({ error: "Scan ID is required" }, { status: 400 });
    }

    // Fetch scan data
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        site: {
          include: {
            user: true,
          },
        },
        page: true,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Extract violations
    let violations: Violation[] = [];
    if (scan.raw && typeof scan.raw === 'object' && 'violations' in scan.raw) {
      violations = (scan.raw as any).violations || [];
    }

    const stats = computeIssueStats(violations);
    const topViolations = getTopViolations(violations, 20);
    const siteUrl = scan.page?.url || scan.site.url;

    // Generate HTML for PDF conversion
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Accessibility Report - ${new URL(siteUrl).hostname}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 40px;
                line-height: 1.6;
                color: #1f2937;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
            }
            .title {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .subtitle {
                font-size: 16px;
                color: #6b7280;
            }
            .meta-info {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 30px;
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 8px;
            }
            .meta-item {
                text-align: center;
            }
            .meta-label {
                font-size: 12px;
                color: #6b7280;
                text-transform: uppercase;
                margin-bottom: 5px;
            }
            .meta-value {
                font-size: 18px;
                font-weight: bold;
            }
            .section {
                margin-bottom: 30px;
            }
            .section-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 15px;
                color: #1f2937;
            }
            .impact-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            .impact-card {
                text-align: center;
                padding: 15px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
            }
            .impact-label {
                font-size: 12px;
                text-transform: uppercase;
                margin-bottom: 5px;
            }
            .impact-value {
                font-size: 24px;
                font-weight: bold;
            }
            .critical { color: #dc2626; }
            .serious { color: #ea580c; }
            .moderate { color: #d97706; }
            .minor { color: #64748b; }
            .violations-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .violations-table th,
            .violations-table td {
                border: 1px solid #e5e7eb;
                padding: 12px;
                text-align: left;
                vertical-align: top;
            }
            .violations-table th {
                background-color: #f9fafb;
                font-weight: bold;
                font-size: 14px;
            }
            .violations-table td {
                font-size: 12px;
            }
            .rule-id {
                font-family: 'Courier New', monospace;
                background-color: #f3f4f6;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">Accessibility Report</div>
            <div class="subtitle">${new URL(siteUrl).hostname}</div>
            <div class="subtitle">${siteUrl}</div>
        </div>

        <div class="meta-info">
            <div class="meta-item">
                <div class="meta-label">Generated</div>
                <div class="meta-value">${formatDate(new Date())}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Scan Date</div>
                <div class="meta-value">${formatDate(scan.createdAt)}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Score</div>
                <div class="meta-value">${scan.score || 0}/100</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Status</div>
                <div class="meta-value">${scan.status.toUpperCase()}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Issues by Impact Level</div>
            <div class="impact-grid">
                <div class="impact-card">
                    <div class="impact-label critical">Critical</div>
                    <div class="impact-value critical">${stats.critical}</div>
                </div>
                <div class="impact-card">
                    <div class="impact-label serious">Serious</div>
                    <div class="impact-value serious">${stats.serious}</div>
                </div>
                <div class="impact-card">
                    <div class="impact-label moderate">Moderate</div>
                    <div class="impact-value moderate">${stats.moderate}</div>
                </div>
                <div class="impact-card">
                    <div class="impact-label minor">Minor</div>
                    <div class="impact-value minor">${stats.minor}</div>
                </div>
            </div>
        </div>

        ${topViolations.length > 0 ? `
        <div class="section">
            <div class="section-title">Top ${Math.min(topViolations.length, 20)} Violations Summary</div>
            <table class="violations-table">
                <thead>
                    <tr>
                        <th style="width: 30%">Rule</th>
                        <th style="width: 12%">Impact</th>
                        <th style="width: 8%">Elements</th>
                        <th style="width: 50%">Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${topViolations.slice(0, 15).map(violation => `
                    <tr>
                        <td>
                            <span class="rule-id">${violation.id}</span><br>
                            <strong>${violation.help}</strong>
                        </td>
                        <td class="${violation.impact || 'minor'}">${violation.impact || 'minor'}</td>
                        <td>${violation.nodes.length}</td>
                        <td>${violation.description.length > 150 ? violation.description.substring(0, 150) + '...' : violation.description}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="footer">
            Generated by TutusPorta on ${formatDate(new Date())}<br>
            Report ID: ${scan.id.slice(-8)}
        </div>
    </body>
    </html>
    `;

    // Return HTML content that can be converted to PDF by the browser
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="tutusporta-${scanId}-report.html"`,
      },
    });

  } catch (error) {
    console.error("Report generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}