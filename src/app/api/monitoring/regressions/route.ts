import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RegressionEvent {
  id: string;
  siteId: string;
  siteUrl: string;
  type: 'score_drop' | 'new_violations' | 'compliance_breach' | 'performance_impact';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  detectedAt: Date;
  confirmedAt?: Date;
  resolvedAt?: Date;
  status: 'detected' | 'confirmed' | 'investigating' | 'resolved' | 'false_positive';

  // Regression details
  scoreChange?: number;
  previousScore?: number;
  currentScore?: number;
  newViolations?: number;
  affectedElements?: number;

  // Context
  scanId: string;
  previousScanId?: string;
  possibleCauses?: string[];
  automatedAnalysis?: string;

  // Actions
  investigationNotes?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Get user's sites (including team sites)
    const sites = await prisma.site.findMany({
      where: {
        OR: [
          { userId: user.id },
          {
            teams: {
              some: {
                members: {
                  some: {
                    userId: user.id
                  }
                }
              }
            }
          }
        ]
      }
    });

    const regressions: RegressionEvent[] = [];

    // Analyze each site for regressions
    for (const site of sites) {
      // Get the last two scans for comparison
      const recentScans = await prisma.scan.findMany({
        where: {
          siteId: site.id,
          status: 'done',
          score: { not: null }
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
        include: {
          site: true
        }
      });

      if (recentScans.length >= 2) {
        const [currentScan, previousScan] = recentScans;

        // Score drop detection
        if (currentScan.score && previousScan.score) {
          const scoreDrop = previousScan.score - currentScan.score;

          if (scoreDrop >= 10) { // Threshold for score drop
            const severity = scoreDrop >= 30 ? 'critical' :
                           scoreDrop >= 20 ? 'major' :
                           scoreDrop >= 15 ? 'moderate' : 'minor';

            const priority = severity === 'critical' ? 'urgent' :
                           severity === 'major' ? 'high' :
                           severity === 'moderate' ? 'medium' : 'low';

            // Generate automated analysis
            let automatedAnalysis = `Score dropped by ${scoreDrop} points`;
            const possibleCauses = [];

            if (scoreDrop >= 25) {
              possibleCauses.push('Major website update or redesign');
              possibleCauses.push('New content management system');
              automatedAnalysis += ' - likely major site changes';
            } else if (scoreDrop >= 15) {
              possibleCauses.push('Content updates affecting accessibility');
              possibleCauses.push('Changes to navigation or forms');
              automatedAnalysis += ' - moderate accessibility impact';
            } else {
              possibleCauses.push('Minor content or styling changes');
              possibleCauses.push('Third-party widget updates');
              automatedAnalysis += ' - minor regression detected';
            }

            regressions.push({
              id: `score_drop_${currentScan.id}`,
              siteId: site.id,
              siteUrl: site.url,
              type: 'score_drop',
              severity,
              detectedAt: currentScan.createdAt,
              status: 'detected',
              scoreChange: -scoreDrop,
              previousScore: previousScan.score,
              currentScore: currentScan.score,
              scanId: currentScan.id,
              previousScanId: previousScan.id,
              possibleCauses,
              automatedAnalysis,
              priority
            });
          }
        }

        // New violations detection
        if (currentScan.issues && previousScan.issues) {
          const newViolations = currentScan.issues - previousScan.issues;

          if (newViolations >= 5) { // Threshold for new violations
            const severity = newViolations >= 50 ? 'critical' :
                           newViolations >= 20 ? 'major' :
                           newViolations >= 10 ? 'moderate' : 'minor';

            const priority = severity === 'critical' ? 'urgent' :
                           severity === 'major' ? 'high' : 'medium';

            regressions.push({
              id: `new_violations_${currentScan.id}`,
              siteId: site.id,
              siteUrl: site.url,
              type: 'new_violations',
              severity,
              detectedAt: currentScan.createdAt,
              status: 'detected',
              newViolations,
              scanId: currentScan.id,
              previousScanId: previousScan.id,
              automatedAnalysis: `${newViolations} new accessibility violations detected`,
              possibleCauses: [
                'New content added without accessibility review',
                'Updated components with accessibility issues',
                'Third-party integrations with violations'
              ],
              priority
            });
          }
        }

        // WCAG compliance breach detection
        if (currentScan.wcagAACompliance !== null && currentScan.wcagAACompliance < 70) {
          const severity = currentScan.wcagAACompliance < 40 ? 'critical' :
                         currentScan.wcagAACompliance < 55 ? 'major' : 'moderate';

          regressions.push({
            id: `compliance_${currentScan.id}`,
            siteId: site.id,
            siteUrl: site.url,
            type: 'compliance_breach',
            severity,
            detectedAt: currentScan.createdAt,
            status: 'detected',
            scanId: currentScan.id,
            automatedAnalysis: `WCAG AA compliance dropped to ${currentScan.wcagAACompliance?.toFixed(1)}%`,
            possibleCauses: [
              'Critical accessibility barriers introduced',
              'Form accessibility issues',
              'Navigation or heading structure problems'
            ],
            priority: severity === 'critical' ? 'urgent' : 'high'
          });
        }

        // Performance impact detection (affects accessibility)
        if (currentScan.performanceScore !== null &&
            previousScan.performanceScore !== null &&
            currentScan.performanceScore < previousScan.performanceScore - 20) {

          regressions.push({
            id: `performance_${currentScan.id}`,
            siteId: site.id,
            siteUrl: site.url,
            type: 'performance_impact',
            severity: 'moderate',
            detectedAt: currentScan.createdAt,
            status: 'detected',
            scanId: currentScan.id,
            previousScanId: previousScan.id,
            automatedAnalysis: `Performance degradation may impact accessibility users`,
            possibleCauses: [
              'Slow page load affecting screen readers',
              'Heavy JavaScript impacting keyboard navigation',
              'Large images without optimization'
            ],
            priority: 'medium'
          });
        }
      }
    }

    // Sort by severity and detection time
    const severityOrder = { critical: 4, major: 3, moderate: 2, minor: 1 };
    regressions.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
    });

    return NextResponse.json({
      regressions: regressions.slice(0, 50) // Limit to 50 most recent/important
    });

  } catch (error) {
    console.error("Regression detection error:", error);
    return NextResponse.json(
      { error: "Failed to detect regressions" },
      { status: 500 }
    );
  }
}