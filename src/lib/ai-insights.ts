// AI-powered accessibility insights and recommendations
import { Violation } from '@/lib/axe-types';

export interface AIInsight {
  id: string;
  type: 'critical' | 'recommendation' | 'optimization' | 'trend';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'accessibility' | 'performance' | 'ux' | 'compliance';
  impact: string;
  effort: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  actionable: boolean;
  estimatedTimeToFix: string;
  businessValue: string;
  technicalDetails?: string;
  codeExample?: string;
}

export interface AIRecommendation {
  insight: AIInsight;
  relatedViolations: string[];
  suggestedActions: string[];
  estimatedImprovement: number; // score improvement
  dependencies: string[];
  resources: {
    title: string;
    url: string;
    type: 'documentation' | 'tutorial' | 'tool';
  }[];
}

// AI-powered analysis patterns
const analysisPatterns = {
  // Color contrast issues
  colorContrast: {
    keywords: ['color-contrast', 'contrast'],
    insights: [
      {
        title: 'Color Contrast Crisis',
        description: 'Multiple color contrast violations detected. This significantly impacts users with visual impairments and low vision.',
        priority: 'high' as const,
        category: 'accessibility' as const,
        impact: 'Affects 15-20% of users with visual impairments',
        effort: 'low' as const,
        businessValue: 'Improve user retention and legal compliance',
        actionable: true,
        estimatedTimeToFix: '2-4 hours',
        technicalDetails: 'WCAG 2.1 requires minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text',
        codeExample: `/* Fix contrast by adjusting colors */
.button-primary {
  background-color: #0056b3; /* Darker blue */
  color: #ffffff; /* White text */
  /* Contrast ratio: 7.2:1 ✓ */
}

.text-secondary {
  color: #495057; /* Darker gray */
  /* Contrast ratio: 6.1:1 ✓ */
}`
      }
    ]
  },

  // Form issues
  formLabels: {
    keywords: ['label', 'form-field-multiple-labels', 'input'],
    insights: [
      {
        title: 'Form Accessibility Gaps',
        description: 'Form elements are missing proper labels, making them inaccessible to screen reader users.',
        priority: 'high' as const,
        category: 'accessibility' as const,
        impact: 'Blocks 8-12% of users who rely on assistive technology',
        effort: 'medium' as const,
        businessValue: 'Increase form completion rates by 25-40%',
        actionable: true,
        estimatedTimeToFix: '1-2 days',
        technicalDetails: 'All form inputs must have accessible labels or aria-label attributes',
        codeExample: `<!-- Before: Inaccessible -->
<input type="email" placeholder="Email">

<!-- After: Accessible -->
<label for="email">Email Address</label>
<input type="email" id="email" placeholder="your@email.com">

<!-- Or with aria-label -->
<input type="email" aria-label="Email Address" placeholder="your@email.com">`
      }
    ]
  },

  // Navigation issues
  navigation: {
    keywords: ['link', 'button', 'menu', 'navigation'],
    insights: [
      {
        title: 'Navigation Structure Issues',
        description: 'Your navigation structure has accessibility barriers that prevent effective keyboard and screen reader navigation.',
        priority: 'medium' as const,
        category: 'accessibility' as const,
        impact: 'Affects navigation efficiency for 10-15% of users',
        effort: 'medium' as const,
        businessValue: 'Improve user engagement and site exploration',
        actionable: true,
        estimatedTimeToFix: '3-5 days',
        technicalDetails: 'Implement proper ARIA landmarks and keyboard navigation patterns',
        codeExample: `<!-- Semantic navigation structure -->
<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="none">
      <a href="/home" role="menuitem">Home</a>
    </li>
    <li role="none">
      <button aria-expanded="false" aria-haspopup="true" role="menuitem">
        Products
      </button>
    </li>
  </ul>
</nav>`
      }
    ]
  },

  // Image accessibility
  images: {
    keywords: ['image-alt', 'img', 'image'],
    insights: [
      {
        title: 'Image Accessibility Opportunities',
        description: 'Images are missing alt text or have non-descriptive alt attributes, creating barriers for screen reader users.',
        priority: 'medium' as const,
        category: 'accessibility' as const,
        impact: 'Reduces content comprehension for 5-8% of users',
        effort: 'low' as const,
        businessValue: 'Improve SEO and user experience',
        actionable: true,
        estimatedTimeToFix: '1-2 hours',
        technicalDetails: 'All informative images need descriptive alt text; decorative images should have empty alt=""',
        codeExample: `<!-- Informative image -->
<img src="chart.png" alt="Sales increased 40% from Q1 to Q2 2024">

<!-- Decorative image -->
<img src="decoration.png" alt="" role="presentation">

<!-- Complex image -->
<img src="complex-chart.png" alt="Quarterly sales data" longdesc="#chart-description">
<div id="chart-description">
  <p>Detailed description of the chart data...</p>
</div>`
      }
    ]
  }
};

// AI-powered business impact analysis
const businessImpactTemplates = {
  high: [
    'Could result in legal compliance issues under ADA/WCAG',
    'Directly impacts 15-25% of your user base',
    'May cause significant revenue loss from abandoned interactions',
    'Critical for enterprise customers and government contracts'
  ],
  medium: [
    'Affects user experience for a notable portion of users',
    'Improves brand reputation and inclusivity',
    'Enhances SEO and search engine visibility',
    'Reduces customer support burden'
  ],
  low: [
    'Nice-to-have improvement for edge cases',
    'Demonstrates commitment to accessibility',
    'Future-proofs your application',
    'Improves overall code quality'
  ]
};

export function generateAIInsights(violations: Violation[], currentScore: number, trend?: number): AIRecommendation[] {
  const insights: AIRecommendation[] = [];

  // Analyze violation patterns
  for (const [patternName, pattern] of Object.entries(analysisPatterns)) {
    const matchingViolations = violations.filter(violation =>
      pattern.keywords.some(keyword =>
        violation.id.toLowerCase().includes(keyword.toLowerCase()) ||
        violation.description.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (matchingViolations.length > 0) {
      const baseInsight = pattern.insights[0];
      const violationIds = matchingViolations.map(v => v.id);

      // Calculate estimated improvement based on violation severity and count
      const criticalCount = matchingViolations.filter(v => v.impact === 'critical').length;
      const seriousCount = matchingViolations.filter(v => v.impact === 'serious').length;
      const estimatedImprovement = Math.min(25, (criticalCount * 3 + seriousCount * 2 + matchingViolations.length));

      const insight: AIInsight = {
        id: `ai-${patternName}-${Date.now()}`,
        type: baseInsight.priority === 'high' ? 'critical' : 'recommendation',
        title: baseInsight.title,
        description: `${baseInsight.description} Found ${matchingViolations.length} related issues.`,
        priority: baseInsight.priority,
        category: baseInsight.category,
        impact: baseInsight.impact,
        effort: baseInsight.effort,
        confidence: Math.min(95, 70 + (matchingViolations.length * 5)),
        actionable: baseInsight.actionable,
        estimatedTimeToFix: baseInsight.estimatedTimeToFix,
        businessValue: baseInsight.businessValue,
        technicalDetails: baseInsight.technicalDetails,
        codeExample: baseInsight.codeExample
      };

      const recommendation: AIRecommendation = {
        insight,
        relatedViolations: violationIds,
        suggestedActions: generateActionSteps(patternName, matchingViolations.length),
        estimatedImprovement,
        dependencies: getDependencies(patternName),
        resources: getResources(patternName)
      };

      insights.push(recommendation);
    }
  }

  // Generate score-based insights
  if (currentScore < 70) {
    insights.push(generateScoreBasedInsight(currentScore, 'low-score'));
  } else if (currentScore >= 85) {
    insights.push(generateScoreBasedInsight(currentScore, 'high-score'));
  }

  // Generate trend-based insights
  if (trend !== undefined) {
    if (trend < -5) {
      insights.push(generateTrendInsight('declining', trend));
    } else if (trend > 10) {
      insights.push(generateTrendInsight('improving', trend));
    }
  }

  return insights.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return priorityWeight[b.insight.priority] - priorityWeight[a.insight.priority];
  });
}

function generateActionSteps(patternName: string, violationCount: number): string[] {
  const actionTemplates: Record<string, string[]> = {
    colorContrast: [
      'Audit all color combinations using a contrast checker tool',
      'Update CSS color values to meet WCAG contrast requirements',
      'Test with color blindness simulators',
      'Implement a design system with accessible color palettes'
    ],
    formLabels: [
      'Add proper label elements to all form inputs',
      'Implement aria-label attributes where visual labels aren\'t possible',
      'Add fieldset and legend elements for grouped inputs',
      'Test form navigation with screen readers'
    ],
    navigation: [
      'Implement skip navigation links',
      'Add proper ARIA landmarks and roles',
      'Ensure keyboard navigation works for all interactive elements',
      'Test with screen readers and keyboard-only navigation'
    ],
    images: [
      'Review all images and add descriptive alt text',
      'Mark decorative images with empty alt attributes',
      'Provide long descriptions for complex images',
      'Implement lazy loading with accessibility considerations'
    ]
  };

  return actionTemplates[patternName] || [
    'Review the related violations in detail',
    'Consult WCAG documentation for specific requirements',
    'Implement fixes and test with accessibility tools',
    'Validate improvements with automated and manual testing'
  ];
}

function getDependencies(patternName: string): string[] {
  const dependencyMap: Record<string, string[]> = {
    colorContrast: ['Design system update', 'CSS framework changes'],
    formLabels: ['HTML structure changes', 'JavaScript form handling'],
    navigation: ['ARIA implementation', 'Keyboard event handlers'],
    images: ['Content management system', 'Image optimization pipeline']
  };

  return dependencyMap[patternName] || [];
}

function getResources(patternName: string): AIRecommendation['resources'] {
  const resourceMap: Record<string, AIRecommendation['resources']> = {
    colorContrast: [
      { title: 'WCAG Color Contrast Guidelines', url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html', type: 'documentation' },
      { title: 'Contrast Checker Tool', url: 'https://webaim.org/resources/contrastchecker/', type: 'tool' },
      { title: 'Accessible Color Palette Generator', url: 'https://accessible-colors.com/', type: 'tool' }
    ],
    formLabels: [
      { title: 'Form Accessibility Tutorial', url: 'https://www.w3.org/WAI/tutorials/forms/', type: 'tutorial' },
      { title: 'ARIA Form Properties', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/forms', type: 'documentation' }
    ],
    navigation: [
      { title: 'Navigation Accessibility', url: 'https://www.w3.org/WAI/tutorials/menus/', type: 'tutorial' },
      { title: 'ARIA Landmarks', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/', type: 'documentation' }
    ],
    images: [
      { title: 'Alt Text Guidelines', url: 'https://webaim.org/articles/alternative/', type: 'tutorial' },
      { title: 'Image Accessibility Handbook', url: 'https://accessibility.huit.harvard.edu/describe-content-images', type: 'documentation' }
    ]
  };

  return resourceMap[patternName] || [
    { title: 'WCAG 2.1 Guidelines', url: 'https://www.w3.org/WAI/WCAG21/quickref/', type: 'documentation' }
  ];
}

function generateScoreBasedInsight(score: number, type: 'low-score' | 'high-score'): AIRecommendation {
  if (type === 'low-score') {
    return {
      insight: {
        id: `ai-score-low-${Date.now()}`,
        type: 'critical',
        title: 'Accessibility Foundation Needs Attention',
        description: `Your current score of ${score}/100 indicates fundamental accessibility issues that need immediate attention.`,
        priority: 'high',
        category: 'accessibility',
        impact: 'Significantly impacts user experience and legal compliance',
        effort: 'high',
        confidence: 90,
        actionable: true,
        estimatedTimeToFix: '2-4 weeks',
        businessValue: 'Critical for avoiding legal issues and improving user experience'
      },
      relatedViolations: [],
      suggestedActions: [
        'Focus on critical and serious violations first',
        'Implement an accessibility testing strategy',
        'Consider accessibility training for your team',
        'Establish accessibility guidelines and review processes'
      ],
      estimatedImprovement: 30,
      dependencies: ['Team training', 'Process improvements'],
      resources: [
        { title: 'Accessibility Quick Start Guide', url: 'https://www.w3.org/WAI/test-evaluate/preliminary/', type: 'tutorial' }
      ]
    };
  } else {
    return {
      insight: {
        id: `ai-score-high-${Date.now()}`,
        type: 'optimization',
        title: 'Excellence in Accessibility - Minor Optimizations',
        description: `Excellent work! Your score of ${score}/100 shows strong accessibility foundations. Focus on fine-tuning for perfection.`,
        priority: 'low',
        category: 'accessibility',
        impact: 'Enhances user experience for edge cases',
        effort: 'low',
        confidence: 85,
        actionable: true,
        estimatedTimeToFix: '1-2 days',
        businessValue: 'Demonstrates industry leadership in accessibility'
      },
      relatedViolations: [],
      suggestedActions: [
        'Address remaining minor violations',
        'Implement advanced ARIA patterns',
        'Conduct user testing with assistive technologies',
        'Share your accessibility practices as case studies'
      ],
      estimatedImprovement: 5,
      dependencies: [],
      resources: [
        { title: 'Advanced ARIA Patterns', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/', type: 'documentation' }
      ]
    };
  }
}

function generateTrendInsight(type: 'declining' | 'improving', trend: number): AIRecommendation {
  if (type === 'declining') {
    return {
      insight: {
        id: `ai-trend-declining-${Date.now()}`,
        type: 'critical',
        title: 'Accessibility Regression Detected',
        description: `Your accessibility score has declined by ${Math.abs(trend)} points. This suggests new accessibility issues were introduced recently.`,
        priority: 'high',
        category: 'accessibility',
        impact: 'Indicates process gaps in accessibility maintenance',
        effort: 'medium',
        confidence: 80,
        actionable: true,
        estimatedTimeToFix: '1 week',
        businessValue: 'Prevent further degradation and maintain compliance'
      },
      relatedViolations: [],
      suggestedActions: [
        'Review recent code changes for accessibility impact',
        'Implement automated accessibility testing in CI/CD',
        'Train developers on accessibility best practices',
        'Establish accessibility review checkpoints'
      ],
      estimatedImprovement: Math.abs(trend),
      dependencies: ['Process improvements', 'Tool integration'],
      resources: [
        { title: 'Accessibility Testing in CI/CD', url: 'https://web.dev/accessibility-testing/', type: 'tutorial' }
      ]
    };
  } else {
    return {
      insight: {
        id: `ai-trend-improving-${Date.now()}`,
        type: 'trend',
        title: 'Great Progress in Accessibility!',
        description: `Excellent! Your accessibility score has improved by ${trend} points, showing your commitment to inclusive design.`,
        priority: 'medium',
        category: 'accessibility',
        impact: 'Demonstrates positive accessibility momentum',
        effort: 'low',
        confidence: 90,
        actionable: true,
        estimatedTimeToFix: 'Ongoing',
        businessValue: 'Builds strong accessibility culture and compliance'
      },
      relatedViolations: [],
      suggestedActions: [
        'Continue current accessibility practices',
        'Share success stories with the team',
        'Document lessons learned and best practices',
        'Consider more advanced accessibility features'
      ],
      estimatedImprovement: 0,
      dependencies: [],
      resources: [
        { title: 'Accessibility Champions Guide', url: 'https://accessibility.digital.gov/', type: 'documentation' }
      ]
    };
  }
}