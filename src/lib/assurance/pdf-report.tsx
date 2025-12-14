/**
 * VexNexa Accessibility Assurance - PDF Report Template
 *
 * Professional, accessible PDF reports using @react-pdf/renderer
 * Supports all 5 languages with automatic fallback
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import {
  getAssuranceTranslation,
  getReportDisclaimer,
  formatDate,
  getScoreStatus,
  getThresholdStatus,
} from './i18n';

// Register fonts (optional - using default fonts for now)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2pt solid #0F5C5C',
    paddingBottom: 15,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F5C5C',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginTop: 20,
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F5C5C',
    marginBottom: 10,
    borderBottom: '1pt solid #CCCCCC',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '40%',
    fontSize: 10,
    color: '#666666',
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
    fontSize: 10,
    color: '#1E1E1E',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0F5C5C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#10B981',
    borderRadius: 4,
    marginTop: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  complianceGrid: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 15,
  },
  complianceBox: {
    flex: 1,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 4,
    border: '1pt solid #E5E7EB',
  },
  complianceLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 5,
  },
  complianceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F5C5C',
  },
  disclaimer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#FEF3C7',
    border: '1pt solid #F59E0B',
    borderRadius: 4,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 9,
    color: '#78350F',
    lineHeight: 1.5,
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
    borderTop: '1pt solid #CCCCCC',
    paddingTop: 10,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '1pt solid #E5E7EB',
  },
  trendDate: {
    fontSize: 9,
    color: '#666666',
  },
  trendScore: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F5C5C',
  },
});

export interface AssuranceReportData {
  domain: string;
  label?: string;
  currentScore: number;
  threshold: number;
  wcagAACompliance?: number;
  wcagAAACompliance?: number;
  trendData: Array<{
    date: Date;
    score: number;
  }>;
  issuesCount?: number;
  impactCritical?: number;
  impactSerious?: number;
  impactModerate?: number;
  impactMinor?: number;
  language: string;
  generatedAt: Date;
}

/**
 * Accessibility Assurance PDF Report Component
 */
export function AssurancePDFReport(props: AssuranceReportData) {
  const {
    domain,
    label,
    currentScore,
    threshold,
    wcagAACompliance,
    wcagAAACompliance,
    trendData,
    issuesCount = 0,
    impactCritical = 0,
    impactSerious = 0,
    impactModerate = 0,
    impactMinor = 0,
    language,
    generatedAt,
  } = props;

  const t = (key: string, vars?: Record<string, any>) =>
    getAssuranceTranslation(language, key, vars);
  const disclaimer = getReportDisclaimer(language);
  const scoreStatusLabel = getScoreStatus(currentScore, language);
  const thresholdStatusLabel = getThresholdStatus(currentScore, threshold, language);

  // Determine score color
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 75) return '#3B82F6'; // Blue
    if (score >= 60) return '#F59E0B'; // Yellow
    if (score >= 40) return '#EF4444'; // Red
    return '#7F1D1D'; // Dark red
  };

  const scoreColor = getScoreColor(currentScore);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>VexNexa</Text>
          <Text style={styles.subtitle}>{t('report.monitoredBy')}</Text>
        </View>

        {/* Report Title */}
        <Text style={styles.reportTitle}>{t('report.title')}</Text>

        {/* Domain Information */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('report.domain')}:</Text>
            <Text style={styles.value}>{label || domain}</Text>
          </View>
          {label && (
            <View style={styles.row}>
              <Text style={styles.label}>URL:</Text>
              <Text style={styles.value}>{domain}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>{t('report.generatedAt')}:</Text>
            <Text style={styles.value}>{formatDate(generatedAt, language)}</Text>
          </View>
        </View>

        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreText}>{currentScore}</Text>
          </View>
          <Text style={styles.scoreLabel}>{t('report.currentScore')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.statusText}>{scoreStatusLabel}</Text>
          </View>
          <View style={[styles.statusBadge, {
            backgroundColor: currentScore >= threshold ? '#10B981' : '#EF4444',
            marginTop: 4,
          }]}>
            <Text style={styles.statusText}>{thresholdStatusLabel}</Text>
          </View>
        </View>

        {/* Threshold */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('report.threshold')}:</Text>
            <Text style={styles.value}>{threshold}</Text>
          </View>
        </View>

        {/* WCAG Compliance */}
        {(wcagAACompliance !== undefined || wcagAAACompliance !== undefined) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('report.wcagCompliance')}</Text>
            <View style={styles.complianceGrid}>
              {wcagAACompliance !== undefined && (
                <View style={styles.complianceBox}>
                  <Text style={styles.complianceLabel}>{t('report.wcagAA')}</Text>
                  <Text style={styles.complianceValue}>
                    {Math.round(wcagAACompliance)}%
                  </Text>
                </View>
              )}
              {wcagAAACompliance !== undefined && (
                <View style={styles.complianceBox}>
                  <Text style={styles.complianceLabel}>{t('report.wcagAAA')}</Text>
                  <Text style={styles.complianceValue}>
                    {Math.round(wcagAAACompliance)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Issues Summary */}
        {issuesCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('report.summary.title')}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>{t('report.summary.issuesFound')}:</Text>
              <Text style={styles.value}>{issuesCount}</Text>
            </View>
            {impactCritical > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('report.summary.critical')}:</Text>
                <Text style={styles.value}>{impactCritical}</Text>
              </View>
            )}
            {impactSerious > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('report.summary.serious')}:</Text>
                <Text style={styles.value}>{impactSerious}</Text>
              </View>
            )}
            {impactModerate > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('report.summary.moderate')}:</Text>
                <Text style={styles.value}>{impactModerate}</Text>
              </View>
            )}
            {impactMinor > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('report.summary.minor')}:</Text>
                <Text style={styles.value}>{impactMinor}</Text>
              </View>
            )}
          </View>
        )}

        {/* Score Trend */}
        {trendData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('report.trend')}</Text>
            {trendData.slice(-8).map((item, index) => (
              <View key={index} style={styles.trendItem}>
                <Text style={styles.trendDate}>
                  {formatDate(item.date, language)}
                </Text>
                <Text style={styles.trendScore}>{item.score}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>{disclaimer.title}</Text>
          <Text style={styles.disclaimerText}>{disclaimer.text}</Text>
          <Text style={styles.disclaimerText}>{disclaimer.limitation}</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {domain} • {formatDate(generatedAt, language)} • VexNexa Accessibility Assurance
        </Text>
      </Page>
    </Document>
  );
}
