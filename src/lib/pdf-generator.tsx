import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, PDFDownloadLink } from '@react-pdf/renderer';

// Register fonts for better typography (commented out to avoid server-side issues)
// Font.register({
//   family: 'Inter',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
//   ]
// });

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
  scoreSection: {
    marginBottom: 30,
    padding: 25,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    border: '1pt solid #E2E8F0',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 800,
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: 5,
  },
  scoreDescription: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 300,
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

interface PDFReportProps {
  scanData: {
    id: string;
    url: string;
    score: number;
    violations: any[];
    createdAt: Date;
  };
  brandName: string;
  brandLogo?: string;
  primaryColor?: string;
}

export const PDFReport: React.FC<PDFReportProps> = ({
  scanData,
  brandName,
  brandLogo,
  primaryColor = '#3B82F6'
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 75) return '#84CC16'; // Lime
    if (score >= 60) return '#F59E0B'; // Yellow
    if (score >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getScoreInfo = (score: number) => {
    if (score >= 90) return { label: 'Excellent', description: 'Your website meets most accessibility standards with minimal issues.' };
    if (score >= 75) return { label: 'Good', description: 'Your website has good accessibility with some areas for improvement.' };
    if (score >= 60) return { label: 'Fair', description: 'Your website has moderate accessibility issues that should be addressed.' };
    if (score >= 40) return { label: 'Poor', description: 'Your website has significant accessibility barriers that need attention.' };
    return { label: 'Critical', description: 'Your website has serious accessibility issues requiring immediate action.' };
  };

  const computeStats = (violations: any[]) => {
    if (!Array.isArray(violations) || violations.length === 0) {
      return { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 };
    }

    return violations.reduce(
      (acc, violation) => {
        const impact = violation.impact?.toLowerCase() || 'minor';
        acc.total++;
        if (impact === 'critical') acc.critical++;
        else if (impact === 'serious') acc.serious++;
        else if (impact === 'moderate') acc.moderate++;
        else acc.minor++;
        return acc;
      },
      { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 }
    );
  };

  const scoreInfo = getScoreInfo(scanData.score);
  const stats = computeStats(scanData.violations);
  const wcagCompliance = Math.max(0, 100 - (stats.total * 2)); // Simple calculation

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.brandName}>{brandName}</Text>
            <Text style={styles.reportTitle}>Accessibility Compliance Report</Text>
            <Text style={styles.reportSubtitle}>Professional WCAG Analysis & Assessment</Text>
          </View>
        </View>

        {/* Website Info */}
        <View style={styles.websiteInfo}>
          <Text style={styles.websiteUrl}>{scanData.url}</Text>
          <Text style={styles.scanDate}>
            Generated on {scanData.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Score Section */}
        <View style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(scanData.score) }]}>
            <Text style={styles.scoreText}>{scanData.score}</Text>
          </View>
          <Text style={styles.scoreLabel}>{scoreInfo.label} Accessibility Score</Text>
          <Text style={styles.scoreDescription}>{scoreInfo.description}</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{wcagCompliance}%</Text>
            <Text style={styles.metricLabel}>WCAG 2.1 AA</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>N/A</Text>
            <Text style={styles.metricLabel}>Performance</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>N/A</Text>
            <Text style={styles.metricLabel}>SEO Score</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.total}</Text>
            <Text style={styles.metricLabel}>Total Issues</Text>
          </View>
        </View>

        {/* Impact Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Severity Breakdown</Text>
          <View style={styles.impactGrid}>
            <View style={[styles.impactCard, styles.critical]}>
              <Text style={[styles.impactValue, { color: '#DC2626' }]}>{stats.critical}</Text>
              <Text style={[styles.impactLabel, { color: '#DC2626' }]}>Critical</Text>
            </View>
            <View style={[styles.impactCard, styles.serious]}>
              <Text style={[styles.impactValue, { color: '#EA580C' }]}>{stats.serious}</Text>
              <Text style={[styles.impactLabel, { color: '#EA580C' }]}>Serious</Text>
            </View>
            <View style={[styles.impactCard, styles.moderate]}>
              <Text style={[styles.impactValue, { color: '#D97706' }]}>{stats.moderate}</Text>
              <Text style={[styles.impactLabel, { color: '#D97706' }]}>Moderate</Text>
            </View>
            <View style={[styles.impactCard, styles.minor]}>
              <Text style={[styles.impactValue, { color: '#6B7280' }]}>{stats.minor}</Text>
              <Text style={[styles.impactLabel, { color: '#6B7280' }]}>Minor</Text>
            </View>
          </View>
        </View>

        {/* Top Violations */}
        {Array.isArray(scanData.violations) && scanData.violations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority Issues Requiring Attention</Text>
            <View style={styles.violationsContainer}>
              <View style={styles.violationsHeader}>
                <Text style={styles.violationsTitle}>Top {Math.min(scanData.violations.length, 10)} Most Critical Issues</Text>
              </View>
              {scanData.violations.slice(0, 10).map((violation, index) => (
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
                      {violation.nodes?.length > 0 && ': ' + violation.nodes.slice(0, 2).map((node: any) =>
                        Array.isArray(node.target) ? node.target.join(' > ') : 'Element'
                      ).join(', ')}
                      {(violation.nodes?.length || 0) > 2 && `... and ${(violation.nodes?.length || 0) - 2} more`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>{brandName} Accessibility Platform</Text>
          <Text style={styles.footerText}>This report was generated automatically using axe-core accessibility testing engine.</Text>
          <Text style={styles.footerText}>For detailed remediation guidance, visit your dashboard or contact support.</Text>
        </View>
      </Page>
    </Document>
  );
};