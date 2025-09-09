import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  convertInchesToTwip
} from "docx";
import { Violation, computeIssueStats, getTopViolations } from "@/lib/axe-types";
import { formatDate } from "@/lib/format";
import { requireAuth } from "@/lib/auth";
import { assertWithinLimits, addPageUsage } from "@/lib/billing/entitlements";

export async function POST(req: NextRequest) {
  try {
    // Check authentication and limits
    const user = await requireAuth();
    
    await assertWithinLimits({
      userId: user.id,
      action: "export_word",
      pages: 1
    });

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

    // Create Word document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title Page
            new Paragraph({
              children: [
                new TextRun({
                  text: "Accessibility Report",
                  size: 48,
                  bold: true,
                  color: "1F2937",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: new URL(siteUrl).hostname,
                  size: 32,
                  color: "4B5563",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: siteUrl,
                  size: 24,
                  color: "3B82F6",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),

            // Summary Information
            new Paragraph({
              children: [
                new TextRun({
                  text: "Summary",
                  size: 28,
                  bold: true,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),

            // Summary Table
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Scan Date", bold: true })],
                      })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: formatDate(scan.createdAt) })],
                      })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Score", bold: true })],
                      })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: `${scan.score || 0}/100`, bold: true, size: 24 })],
                      })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Status", bold: true })],
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: scan.status.toUpperCase() })],
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Total Issues", bold: true })],
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: stats.total.toString(), bold: true })],
                      })],
                    }),
                  ],
                }),
              ],
            }),

            // Issues by Impact
            new Paragraph({
              children: [
                new TextRun({
                  text: "Issues by Impact Level",
                  size: 24,
                  bold: true,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),

            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Critical", bold: true, color: "DC2626" })],
                        alignment: AlignmentType.CENTER,
                      })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Serious", bold: true, color: "EA580C" })],
                        alignment: AlignmentType.CENTER,
                      })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Moderate", bold: true, color: "D97706" })],
                        alignment: AlignmentType.CENTER,
                      })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Minor", bold: true, color: "64748B" })],
                        alignment: AlignmentType.CENTER,
                      })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: stats.critical.toString(), size: 28, bold: true })],
                        alignment: AlignmentType.CENTER,
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: stats.serious.toString(), size: 28, bold: true })],
                        alignment: AlignmentType.CENTER,
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: stats.moderate.toString(), size: 28, bold: true })],
                        alignment: AlignmentType.CENTER,
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: stats.minor.toString(), size: 28, bold: true })],
                        alignment: AlignmentType.CENTER,
                      })],
                    }),
                  ],
                }),
              ],
            }),

            // Top Violations
            ...(topViolations.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Top ${Math.min(topViolations.length, 20)} Violations`,
                    size: 24,
                    bold: true,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
              }),

              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                },
                rows: [
                  // Header row
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Rule", bold: true })],
                        })],
                        width: { size: 30, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Impact", bold: true })],
                        })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Elements", bold: true })],
                        })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Description", bold: true })],
                        })],
                        width: { size: 40, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  // Violation rows
                  ...topViolations.slice(0, 15).map((violation) => 
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: violation.id, bold: true, size: 18 }),
                                new TextRun({ text: "\n", size: 10 }),
                                new TextRun({ text: violation.help, size: 16 }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [new Paragraph({
                            children: [new TextRun({ 
                              text: violation.impact || 'minor',
                              color: violation.impact === 'critical' ? 'DC2626' :
                                     violation.impact === 'serious' ? 'EA580C' :
                                     violation.impact === 'moderate' ? 'D97706' : '64748B',
                              bold: true,
                            })],
                          })],
                        }),
                        new TableCell({
                          children: [new Paragraph({
                            children: [new TextRun({ text: violation.nodes.length.toString() })],
                          })],
                        }),
                        new TableCell({
                          children: [new Paragraph({
                            children: [new TextRun({ 
                              text: violation.description.length > 150 
                                ? violation.description.substring(0, 150) + "..."
                                : violation.description,
                              size: 16,
                            })],
                          })],
                        }),
                      ],
                    })
                  ),
                ],
              }),
            ] : []),

            // Detailed Violations
            ...(topViolations.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Detailed Violations",
                    size: 24,
                    bold: true,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
              }),
              
              ...topViolations.slice(0, 10).flatMap((violation, index) => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${index + 1}. ${violation.help}`,
                      size: 20,
                      bold: true,
                    }),
                  ],
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 300, after: 100 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({ text: "Rule ID: ", bold: true }),
                    new TextRun({ text: violation.id, italics: true }),
                    new TextRun({ text: " | Impact: ", bold: true }),
                    new TextRun({ 
                      text: violation.impact || 'minor',
                      color: violation.impact === 'critical' ? 'DC2626' :
                             violation.impact === 'serious' ? 'EA580C' :
                             violation.impact === 'moderate' ? 'D97706' : '64748B',
                      bold: true,
                    }),
                    new TextRun({ text: ` | ${violation.nodes.length} element(s) affected` }),
                  ],
                  spacing: { after: 100 },
                }),

                new Paragraph({
                  children: [new TextRun({ text: violation.description })],
                  spacing: { after: 200 },
                }),

                ...(violation.nodes.length > 0 ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Sample Affected Elements:", bold: true }),
                    ],
                    spacing: { after: 100 },
                  }),
                  ...violation.nodes.slice(0, 5).map((node: any) => 
                    new Paragraph({
                      children: [
                        new TextRun({ text: "• " }),
                        new TextRun({ text: node.target.join(", "), font: "Courier New" }),
                      ],
                      indent: { left: convertInchesToTwip(0.25) },
                    })
                  ),
                  ...(violation.nodes.length > 5 ? [
                    new Paragraph({
                      children: [
                        new TextRun({ 
                          text: `... and ${violation.nodes.length - 5} more elements`,
                          italics: true,
                          color: "6B7280",
                        }),
                      ],
                      indent: { left: convertInchesToTwip(0.25) },
                    }),
                  ] : []),
                ] : []),
              ]),
            ] : []),

            // Footer
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated by TutusPorta on ${formatDate(new Date())}`,
                  size: 16,
                  color: "6B7280",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 600 },
            }),
          ],
        },
      ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Track usage
    await addPageUsage(user.id, 1);

    return new NextResponse(buffer as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="tutusporta-${scanId}.docx"`,
      },
    });

  } catch (error) {
    console.error("Word export failed:", error);
    
    // Handle billing errors
    if (error instanceof Error) {
      if ((error as any).code === "UPGRADE_REQUIRED") {
        return NextResponse.json(
          { 
            error: error.message,
            code: "UPGRADE_REQUIRED",
            feature: (error as any).feature
          },
          { status: 402 }
        );
      }
      
      if ((error as any).code === "LIMIT_REACHED") {
        return NextResponse.json(
          { 
            error: error.message,
            code: "LIMIT_REACHED",
            limit: (error as any).limit,
            current: (error as any).current
          },
          { status: 429 }
        );
      }
      
      if ((error as any).code === "TRIAL_EXPIRED") {
        return NextResponse.json(
          { 
            error: error.message,
            code: "TRIAL_EXPIRED"
          },
          { status: 402 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to generate Word document" },
      { status: 500 }
    );
  }
}