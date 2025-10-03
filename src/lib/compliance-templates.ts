// Compliance reporting templates for different standards and use cases

export interface ComplianceTemplate {
  id: string;
  name: string;
  description: string;
  standard: string;
  version: string;
  sections: ComplianceSection[];
  requiredFields: string[];
  outputFormats: string[];
}

export interface ComplianceSection {
  id: string;
  title: string;
  description?: string;
  criteria: ComplianceCriteria[];
  weight: number;
}

export interface ComplianceCriteria {
  id: string;
  title: string;
  description: string;
  level: "A" | "AA" | "AAA";
  principle: "perceivable" | "operable" | "understandable" | "robust";
  testMethod: "automated" | "manual" | "hybrid";
  requiredForCompliance: boolean;
}

export const COMPLIANCE_TEMPLATES: Record<string, ComplianceTemplate> = {
  wcag21_aa: {
    id: "wcag21_aa",
    name: "WCAG 2.1 AA Compliance Report",
    description: "Complete Web Content Accessibility Guidelines 2.1 Level AA compliance assessment",
    standard: "WCAG",
    version: "2.1",
    requiredFields: ["score", "violations", "wcagAACompliance", "testResults"],
    outputFormats: ["pdf", "html", "json"],
    sections: [
      {
        id: "perceivable",
        title: "1. Perceivable",
        description: "Information and user interface components must be presentable to users in ways they can perceive",
        weight: 25,
        criteria: [
          {
            id: "1.1.1",
            title: "Non-text Content",
            description: "All non-text content has text alternatives",
            level: "A",
            principle: "perceivable",
            testMethod: "automated",
            requiredForCompliance: true
          },
          {
            id: "1.4.3",
            title: "Contrast (Minimum)",
            description: "Text has contrast ratio of at least 4.5:1",
            level: "AA",
            principle: "perceivable",
            testMethod: "automated",
            requiredForCompliance: true
          },
          {
            id: "1.4.5",
            title: "Images of Text",
            description: "Images of text are avoided unless customizable",
            level: "AA",
            principle: "perceivable",
            testMethod: "manual",
            requiredForCompliance: true
          }
        ]
      },
      {
        id: "operable",
        title: "2. Operable",
        description: "User interface components and navigation must be operable",
        weight: 25,
        criteria: [
          {
            id: "2.1.1",
            title: "Keyboard",
            description: "All functionality available via keyboard",
            level: "A",
            principle: "operable",
            testMethod: "manual",
            requiredForCompliance: true
          },
          {
            id: "2.4.1",
            title: "Bypass Blocks",
            description: "Skip links or other bypass mechanisms available",
            level: "A",
            principle: "operable",
            testMethod: "automated",
            requiredForCompliance: true
          },
          {
            id: "2.4.3",
            title: "Focus Order",
            description: "Focus order is logical and meaningful",
            level: "A",
            principle: "operable",
            testMethod: "manual",
            requiredForCompliance: true
          }
        ]
      },
      {
        id: "understandable",
        title: "3. Understandable",
        description: "Information and operation of user interface must be understandable",
        weight: 25,
        criteria: [
          {
            id: "3.1.1",
            title: "Language of Page",
            description: "Primary language of page is programmatically determinable",
            level: "A",
            principle: "understandable",
            testMethod: "automated",
            requiredForCompliance: true
          },
          {
            id: "3.2.1",
            title: "On Focus",
            description: "No unexpected context changes on focus",
            level: "A",
            principle: "understandable",
            testMethod: "manual",
            requiredForCompliance: true
          },
          {
            id: "3.3.1",
            title: "Error Identification",
            description: "Input errors are clearly identified",
            level: "A",
            principle: "understandable",
            testMethod: "manual",
            requiredForCompliance: true
          }
        ]
      },
      {
        id: "robust",
        title: "4. Robust",
        description: "Content must be robust enough for interpretation by assistive technologies",
        weight: 25,
        criteria: [
          {
            id: "4.1.1",
            title: "Parsing",
            description: "Markup is valid and properly structured",
            level: "A",
            principle: "robust",
            testMethod: "automated",
            requiredForCompliance: true
          },
          {
            id: "4.1.2",
            title: "Name, Role, Value",
            description: "UI components have accessible names and roles",
            level: "A",
            principle: "robust",
            testMethod: "automated",
            requiredForCompliance: true
          }
        ]
      }
    ]
  },

  ada_compliance: {
    id: "ada_compliance",
    name: "ADA Compliance Assessment",
    description: "Americans with Disabilities Act digital accessibility compliance report",
    standard: "ADA",
    version: "2010",
    requiredFields: ["score", "violations", "adaRiskLevel", "legalRiskScore"],
    outputFormats: ["pdf", "html"],
    sections: [
      {
        id: "title_iii_compliance",
        title: "Title III Compliance",
        description: "Public accommodations digital accessibility requirements",
        weight: 40,
        criteria: [
          {
            id: "effective_communication",
            title: "Effective Communication",
            description: "Digital content is accessible to people with disabilities",
            level: "AA",
            principle: "perceivable",
            testMethod: "hybrid",
            requiredForCompliance: true
          },
          {
            id: "auxiliary_aids",
            title: "Auxiliary Aids and Services",
            description: "Alternative formats and assistive technology compatibility",
            level: "AA",
            principle: "operable",
            testMethod: "manual",
            requiredForCompliance: true
          }
        ]
      },
      {
        id: "risk_assessment",
        title: "Legal Risk Assessment",
        description: "Evaluation of potential ADA lawsuit risk",
        weight: 30,
        criteria: [
          {
            id: "barrier_severity",
            title: "Barrier Severity",
            description: "Assessment of access barriers for disabled users",
            level: "AA",
            principle: "perceivable",
            testMethod: "automated",
            requiredForCompliance: true
          }
        ]
      },
      {
        id: "remediation",
        title: "Remediation Recommendations",
        description: "Specific steps to achieve compliance",
        weight: 30,
        criteria: [
          {
            id: "priority_fixes",
            title: "Priority Fixes",
            description: "Critical issues requiring immediate attention",
            level: "AA",
            principle: "operable",
            testMethod: "hybrid",
            requiredForCompliance: true
          }
        ]
      }
    ]
  },

  en301549: {
    id: "en301549",
    name: "EN 301 549 Compliance Report",
    description: "European Standard for ICT accessibility requirements",
    standard: "EN 301 549",
    version: "3.2.1",
    requiredFields: ["score", "violations", "wcagAACompliance", "testResults"],
    outputFormats: ["pdf", "html", "xml"],
    sections: [
      {
        id: "web_content",
        title: "9. Web Content",
        description: "Web content accessibility requirements based on WCAG 2.1",
        weight: 60,
        criteria: [
          {
            id: "9.1.1.1",
            title: "Non-text content",
            description: "Conformance to WCAG 2.1 Success Criterion 1.1.1",
            level: "A",
            principle: "perceivable",
            testMethod: "automated",
            requiredForCompliance: true
          }
        ]
      },
      {
        id: "documentation",
        title: "12. Documentation and support services",
        description: "Accessibility documentation requirements",
        weight: 20,
        criteria: [
          {
            id: "12.1.1",
            title: "Accessibility and compatibility features",
            description: "Documentation of accessibility features",
            level: "AA",
            principle: "understandable",
            testMethod: "manual",
            requiredForCompliance: true
          }
        ]
      },
      {
        id: "ict_procurement",
        title: "11. ICT procurement",
        description: "Procurement accessibility requirements",
        weight: 20,
        criteria: [
          {
            id: "11.8.2",
            title: "Accessibility services",
            description: "Platform accessibility service requirements",
            level: "AA",
            principle: "robust",
            testMethod: "manual",
            requiredForCompliance: false
          }
        ]
      }
    ]
  },

  section508: {
    id: "section508",
    name: "Section 508 Compliance Report",
    description: "US Federal Section 508 accessibility compliance assessment",
    standard: "Section 508",
    version: "2018",
    requiredFields: ["score", "violations", "wcagAACompliance"],
    outputFormats: ["pdf", "html"],
    sections: [
      {
        id: "web_electronic_content",
        title: "E205 Electronic Content",
        description: "Web and electronic content accessibility requirements",
        weight: 50,
        criteria: [
          {
            id: "E205.4",
            title: "Accessibility Standard",
            description: "Conformance to WCAG 2.0 Level AA",
            level: "AA",
            principle: "perceivable",
            testMethod: "automated",
            requiredForCompliance: true
          }
        ]
      },
      {
        id: "software",
        title: "E207 Software",
        description: "Software accessibility requirements",
        weight: 30,
        criteria: [
          {
            id: "E207.2",
            title: "WCAG Conformance",
            description: "Software user interface WCAG conformance",
            level: "AA",
            principle: "operable",
            testMethod: "manual",
            requiredForCompliance: true
          }
        ]
      },
      {
        id: "support_documentation",
        title: "E208 Support Documentation",
        description: "Accessibility of support documentation",
        weight: 20,
        criteria: [
          {
            id: "E208.1",
            title: "General",
            description: "Support documentation accessibility",
            level: "AA",
            principle: "understandable",
            testMethod: "manual",
            requiredForCompliance: true
          }
        ]
      }
    ]
  }
};

export function getTemplate(templateId: string): ComplianceTemplate | null {
  return COMPLIANCE_TEMPLATES[templateId] || null;
}

export function getAvailableTemplates(): ComplianceTemplate[] {
  return Object.values(COMPLIANCE_TEMPLATES);
}

export function calculateComplianceScore(
  scanData: any,
  template: ComplianceTemplate
): ComplianceResult {
  const sectionResults: SectionResult[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  for (const section of template.sections) {
    const sectionScore = calculateSectionScore(scanData, section);
    sectionResults.push({
      sectionId: section.id,
      title: section.title,
      score: sectionScore.score,
      passedCriteria: sectionScore.passed,
      totalCriteria: sectionScore.total,
      criticalIssues: sectionScore.criticalIssues,
      weight: section.weight
    });

    totalScore += sectionScore.score * section.weight;
    totalWeight += section.weight;
  }

  const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  return {
    templateId: template.id,
    templateName: template.name,
    standard: template.standard,
    version: template.version,
    overallScore: Math.round(overallScore),
    complianceLevel: determineComplianceLevel(overallScore, template),
    sectionResults,
    recommendations: generateRecommendations(sectionResults, template),
    generatedAt: new Date().toISOString()
  };
}

function calculateSectionScore(scanData: any, section: ComplianceSection) {
  let passed = 0;
  let total = section.criteria.length;
  let criticalIssues = 0;

  // This would analyze the actual scan data against each criterion
  // For now, using simplified logic based on available scan data

  for (const criterion of section.criteria) {
    if (criterion.testMethod === "automated") {
      // Check against automated test results
      if (scanData.score >= 70) {
        passed++;
      } else if (scanData.score < 50) {
        criticalIssues++;
      }
    } else {
      // Manual/hybrid tests would need additional data
      // For now, assume partial compliance
      if (scanData.score >= 80) {
        passed++;
      }
    }
  }

  const score = total > 0 ? (passed / total) * 100 : 0;

  return {
    score: Math.round(score),
    passed,
    total,
    criticalIssues
  };
}

function determineComplianceLevel(score: number, template: ComplianceTemplate): string {
  if (template.standard === "WCAG") {
    if (score >= 95) return "Full Compliance";
    if (score >= 80) return "Substantial Compliance";
    if (score >= 60) return "Partial Compliance";
    return "Non-Compliant";
  }

  if (template.standard === "ADA") {
    if (score >= 90) return "Low Risk";
    if (score >= 70) return "Medium Risk";
    if (score >= 50) return "High Risk";
    return "Critical Risk";
  }

  // Default levels
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  return "Poor";
}

function generateRecommendations(
  sectionResults: SectionResult[],
  template: ComplianceTemplate
): string[] {
  const recommendations: string[] = [];

  for (const result of sectionResults) {
    if (result.score < 80) {
      const section = template.sections.find(s => s.id === result.sectionId);
      if (section) {
        recommendations.push(
          `Improve ${section.title}: ${result.passedCriteria}/${result.totalCriteria} criteria met`
        );
      }
    }

    if (result.criticalIssues > 0) {
      recommendations.push(
        `Address ${result.criticalIssues} critical issues in ${result.title}`
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Excellent compliance! Continue monitoring and testing.");
  }

  return recommendations;
}

export interface ComplianceResult {
  templateId: string;
  templateName: string;
  standard: string;
  version: string;
  overallScore: number;
  complianceLevel: string;
  sectionResults: SectionResult[];
  recommendations: string[];
  generatedAt: string;
}

export interface SectionResult {
  sectionId: string;
  title: string;
  score: number;
  passedCriteria: number;
  totalCriteria: number;
  criticalIssues: number;
  weight: number;
}