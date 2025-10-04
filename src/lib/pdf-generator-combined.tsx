import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    padding: 30,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 24,
    fontWeight: 800,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  reportSubtitle: {
    fontSize: 12,
    color: '#E5E7EB',
    fontWeight: 400,
  },
  websiteInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    border: '1pt solid #BFDBFE',
  },
  websiteUrl: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1E40AF',
    marginBottom: 3,
  },
  scanDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  coverageBanner: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    border: '2pt solid #86EFAC',
    alignItems: 'center',
  },
  coverageText: {
    fontSize: 14,
    fontWeight: 700,
    color: '#166534',
    marginBottom: 3,
  },
  coverageSubtext: {
    fontSize: 10,
    color: '#15803D',
  },
  scoreSection: {
    marginBottom: 30,
    padding: 25,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    border: '1pt solid #E2E8F0',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 800,
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1F2937',
    textAlign: 'center',
  },
  scoreDescription: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  metricCard: {
    width: '23%',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '1pt solid #E5E7EB',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 800,
    color: '#1F2937',
    marginBottom: 3,
  },
  metricLabel: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: 15,
    paddingLeft: 8,
    borderLeft: '3pt solid #3B82F6',
  },
  impactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  impactCard: {
    width: '23%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  impactValue: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 3,
  },
  impactLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  critical: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    color: '#DC2626',
  },
  serious: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    color: '#EA580C',
  },
  moderate: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    color: '#D97706',
  },
  minor: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    color: '#6B7280',
  },
  violationsContainer: {
    border: '1pt solid #E5E7EB',
    borderRadius: 8,
  },
  violationsHeader: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderBottom: '1pt solid #E5E7EB',
  },
  violationsTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1F2937',
  },
  violationItem: {
    padding: 12,
    borderBottom: '0.5pt solid #F1F5F9',
    flexDirection: 'row',
  },
  violationBadge: {
    padding: '3 6',
    borderRadius: 6,
    marginRight: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  violationBadgeText: {
    fontSize: 7,
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  violationContent: {
    flex: 1,
  },
  violationTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: 3,
  },
  violationDescription: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 5,
  },
  violationElements: {
    fontSize: 8,
    color: '#9CA3AF',
    backgroundColor: '#F9FAFB',
    padding: 4,
    borderRadius: 4,
    fontFamily: 'Courier',
  },
  manualSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    border: '1pt solid #BAE6FD',
  },
  manualHeader: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0C4A6E',
    marginBottom: 10,
  },
  manualItem: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    border: '1pt solid #E0F2FE',
  },
  manualItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  manualItemTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#1F2937',
  },
  manualResult: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  manualPass: {
    color: '#16A34A',
  },
  manualFail: {
    color: '#DC2626',
  },
  manualNotes: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 3,
  },
  wcagBadge: {
    fontSize: 8,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    padding: '2 4',
    borderRadius: 4,
    marginTop: 3,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1pt solid #E5E7EB',
    alignItems: 'center',
  },
  footerLogo: {
    fontSize: 12,
    fontWeight: 600,
    color: '#3B82F6',
    marginBottom: 3,
  },
  footerText: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 2,
  },
});

interface CombinedPDFReportProps {
  reportData: {
    site: {
      url: string;
      name: string | null;
    };
    scan: {
      score: number | null;
      violations: any[];
      createdAt: Date;
    } | null;
    audit: {
      name: string;
      totalCriteria: number;
      passedCriteria: number;
      failedCriteria: number;
      overallScore: number | null;
      template: {
        name: string;
        wcagLevel: string | null;
      } | null;
      items: Array<{
        category: string;
        title: string;
        wcagCriterion: string | null;
        wcagLevel: string | null;
        result: string | null;
        notes: string | null;
        priority: string;
      }>;
    } | null;
    combined: {
      overallScore: number;
      automatedScore: number | null;
      manualScore: number | null;
      totalIssues: number;
      criticalIssues: number;
      seriousIssues: number;
      moderateIssues: number;
      minorIssues: number;
      manualFailures: number;
      wcagAACompliance: number | null;
      wcagAAACompliance: number | null;
      fullyCoveredWCAG: boolean;
      coveragePercentage: number;
    };
  };
  brandName: string;
  primaryColor?: string;
}

export const CombinedPDFReport: React.FC<CombinedPDFReportProps> = ({
  reportData,
  brandName,
  primaryColor = '#3B82F6'
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 75) return '#84CC16';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  };

  const getScoreInfo = (score: number) => {
    if (score >= 90) return { label: 'Excellent', description: 'Your website meets accessibility standards with minimal issues.' };
    if (score >= 75) return { label: 'Good', description: 'Your website has good accessibility with some areas for improvement.' };
    if (score >= 60) return { label: 'Fair', description: 'Your website has moderate accessibility issues that should be addressed.' };
    if (score >= 40) return { label: 'Poor', description: 'Your website has significant accessibility barriers that need attention.' };
    return { label: 'Critical', description: 'Your website has serious accessibility issues requiring immediate action.' };
  };

  const scoreInfo = getScoreInfo(reportData.combined.overallScore);
  const failedManualItems = reportData.audit?.items.filter(item => item.result === 'fail') || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.brandName}>{brandName}</Text>
            <Text style={styles.reportTitle}>Complete Accessibility Compliance Report</Text>
            <Text style={styles.reportSubtitle}>Automated + Manual WCAG 2.1 Analysis</Text>
          </View>
        </View>

        {/* Website Info */}
        <View style={styles.websiteInfo}>
          <Text style={styles.websiteUrl}>
            {reportData.site.name || reportData.site.url}
          </Text>
          <Text style={styles.scanDate}>
            Generated on {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Coverage Banner */}
        {reportData.combined.fullyCoveredWCAG && (
          <View style={styles.coverageBanner}>
            <Text style={styles.coverageText}>
              ✓ Complete WCAG 2.1 Coverage ({reportData.combined.coveragePercentage}%)
            </Text>
            <Text style={styles.coverageSubtext}>
              This report combines automated testing (45%) and manual auditing (55%) for comprehensive accessibility assessment
            </Text>
          </View>
        )}

        {/* Score Section */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreRow}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(reportData.combined.overallScore), width: 100, height: 100, borderRadius: 50 }]}>
                <Text style={[styles.scoreText, { fontSize: 32 }]}>
                  {Math.round(reportData.combined.overallScore)}
                </Text>
              </View>
              <Text style={styles.scoreLabel}>Combined Score</Text>
            </View>
            {reportData.combined.automatedScore !== null && (
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(reportData.combined.automatedScore) }]}>
                  <Text style={styles.scoreText}>
                    {Math.round(reportData.combined.automatedScore)}
                  </Text>
                </View>
                <Text style={styles.scoreLabel}>Automated</Text>
              </View>
            )}
            {reportData.combined.manualScore !== null && (
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(reportData.combined.manualScore) }]}>
                  <Text style={styles.scoreText}>
                    {Math.round(reportData.combined.manualScore)}
                  </Text>
                </View>
                <Text style={styles.scoreLabel}>Manual Audit</Text>
              </View>
            )}
          </View>
          <Text style={styles.scoreDescription}>{scoreInfo.description}</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {reportData.combined.wcagAACompliance !== null
                ? `${Math.round(reportData.combined.wcagAACompliance)}%`
                : 'N/A'}
            </Text>
            <Text style={styles.metricLabel}>WCAG 2.1 AA</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {reportData.combined.wcagAAACompliance !== null
                ? `${Math.round(reportData.combined.wcagAAACompliance)}%`
                : 'N/A'}
            </Text>
            <Text style={styles.metricLabel}>WCAG 2.1 AAA</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{reportData.combined.totalIssues}</Text>
            <Text style={styles.metricLabel}>Total Issues</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{reportData.combined.coveragePercentage}%</Text>
            <Text style={styles.metricLabel}>WCAG Coverage</Text>
          </View>
        </View>

        {/* Impact Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Severity Breakdown</Text>
          <View style={styles.impactGrid}>
            <View style={[styles.impactCard, styles.critical]}>
              <Text style={[styles.impactValue, { color: '#DC2626' }]}>
                {reportData.combined.criticalIssues}
              </Text>
              <Text style={[styles.impactLabel, { color: '#DC2626' }]}>Critical</Text>
            </View>
            <View style={[styles.impactCard, styles.serious]}>
              <Text style={[styles.impactValue, { color: '#EA580C' }]}>
                {reportData.combined.seriousIssues}
              </Text>
              <Text style={[styles.impactLabel, { color: '#EA580C' }]}>Serious</Text>
            </View>
            <View style={[styles.impactCard, styles.moderate]}>
              <Text style={[styles.impactValue, { color: '#D97706' }]}>
                {reportData.combined.moderateIssues}
              </Text>
              <Text style={[styles.impactLabel, { color: '#D97706' }]}>Moderate</Text>
            </View>
            <View style={[styles.impactCard, styles.minor]}>
              <Text style={[styles.impactValue, { color: '#6B7280' }]}>
                {reportData.combined.minorIssues}
              </Text>
              <Text style={[styles.impactLabel, { color: '#6B7280' }]}>Minor</Text>
            </View>
          </View>
        </View>

        {/* Automated Violations */}
        {reportData.scan && Array.isArray(reportData.scan.violations) && reportData.scan.violations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Automated Test Results (Top Issues)</Text>
            <View style={styles.violationsContainer}>
              <View style={styles.violationsHeader}>
                <Text style={styles.violationsTitle}>
                  Top {Math.min(reportData.scan.violations.length, 10)} Critical Automated Issues
                </Text>
              </View>
              {reportData.scan.violations.slice(0, 10).map((violation, index) => (
                <View key={index} style={styles.violationItem}>
                  <View style={[
                    styles.violationBadge,
                    violation.impact === 'critical' ? styles.critical :
                    violation.impact === 'serious' ? styles.serious :
                    violation.impact === 'moderate' ? styles.moderate : styles.minor
                  ]}>
                    <Text style={[
                      styles.violationBadgeText,
                      { color:
                        violation.impact === 'critical' ? '#DC2626' :
                        violation.impact === 'serious' ? '#EA580C' :
                        violation.impact === 'moderate' ? '#D97706' : '#6B7280'
                      }
                    ]}>
                      {violation.impact?.toUpperCase() || 'MINOR'}
                    </Text>
                  </View>
                  <View style={styles.violationContent}>
                    <Text style={styles.violationTitle}>
                      {index + 1}. {violation.help || 'Accessibility Issue'}
                    </Text>
                    <Text style={styles.violationDescription}>
                      {violation.description || 'No description available.'}
                    </Text>
                    <Text style={styles.violationElements}>
                      Affects {violation.nodes?.length || 0} element{(violation.nodes?.length || 0) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Manual Audit Results */}
        {reportData.audit && failedManualItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manual Audit Failures</Text>
            <View style={styles.manualSection}>
              <Text style={styles.manualHeader}>
                Failed Manual Tests ({failedManualItems.length} of {reportData.audit.totalCriteria})
              </Text>
              {failedManualItems.slice(0, 15).map((item, index) => (
                <View key={index} style={styles.manualItem}>
                  <View style={styles.manualItemHeader}>
                    <Text style={styles.manualItemTitle}>{item.title}</Text>
                    <Text style={[styles.manualResult, styles.manualFail]}>FAIL</Text>
                  </View>
                  {item.wcagCriterion && (
                    <Text style={styles.wcagBadge}>
                      {item.wcagCriterion} ({item.wcagLevel})
                    </Text>
                  )}
                  {item.notes && (
                    <Text style={styles.manualNotes}>{item.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>{brandName} Accessibility Platform</Text>
          <Text style={styles.footerText}>
            This comprehensive report combines automated testing (axe-core) with manual WCAG 2.1 auditing.
          </Text>
          <Text style={styles.footerText}>
            {reportData.combined.fullyCoveredWCAG
              ? 'Complete WCAG coverage achieved through combined automated and manual testing.'
              : 'For complete WCAG coverage, consider adding manual auditing.'}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
