"use client";

import { useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Trophy, TrendingUp, Target, Crown, Award, ArrowUp, ArrowDown } from "lucide-react";

interface CompetitorData {
  name: string;
  score: number;
  industry: string;
  marketPosition: "leader" | "challenger" | "follower" | "niche";
  strengths: string[];
  weaknesses: string[];
  issues: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  isYou?: boolean;
}

interface CompetitiveAnalysisProps {
  userScore: number;
  userIssues: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  industry?: string;
  className?: string;
}

export function CompetitiveAnalysis({
  userScore,
  userIssues,
  industry = "ecommerce",
  className = ""
}: CompetitiveAnalysisProps) {
  const [viewMode, setViewMode] = useState<"positioning" | "comparison" | "radar">("positioning");

  // Simulated competitive data (in a real app, this would come from your database/API)
  const competitorData: CompetitorData[] = useMemo(() => {
    const competitors: CompetitorData[] = [
      {
        name: "Your Site",
        score: userScore,
        industry,
        marketPosition: userScore >= 85 ? "leader" : userScore >= 70 ? "challenger" : userScore >= 55 ? "follower" : "niche",
        strengths: userScore >= 75 ? ["Good overall performance"] : ["Room for improvement"],
        weaknesses: userScore < 75 ? ["Multiple accessibility issues"] : [],
        issues: userIssues,
        isYou: true
      }
    ];

    // Add simulated competitors based on industry
    const industryCompetitors = {
      ecommerce: [
        { name: "Amazon", score: 78, position: "leader" as const },
        { name: "Shopify Store", score: 82, position: "leader" as const },
        { name: "Etsy", score: 76, position: "challenger" as const },
        { name: "Generic Store", score: 65, position: "follower" as const },
        { name: "Small Business", score: 58, position: "niche" as const },
      ],
      healthcare: [
        { name: "Major Hospital", score: 85, position: "leader" as const },
        { name: "Clinic Network", score: 79, position: "challenger" as const },
        { name: "Health Portal", score: 72, position: "follower" as const },
        { name: "Private Practice", score: 61, position: "niche" as const },
      ],
      education: [
        { name: "Top University", score: 88, position: "leader" as const },
        { name: "State College", score: 74, position: "challenger" as const },
        { name: "Online Learning", score: 69, position: "follower" as const },
        { name: "Local School", score: 62, position: "niche" as const },
      ],
      general: [
        { name: "Industry Leader", score: 84, position: "leader" as const },
        { name: "Major Competitor", score: 77, position: "challenger" as const },
        { name: "Mid-size Player", score: 68, position: "follower" as const },
        { name: "Small Player", score: 59, position: "niche" as const },
      ]
    };

    const industryData = industryCompetitors[industry as keyof typeof industryCompetitors] || industryCompetitors.general;

    industryData.forEach(comp => {
      // Generate realistic issue distributions based on score
      const totalIssues = Math.max(0, Math.round((100 - comp.score) / 2));
      const critical = Math.round(totalIssues * 0.1);
      const serious = Math.round(totalIssues * 0.2);
      const moderate = Math.round(totalIssues * 0.3);
      const minor = totalIssues - critical - serious - moderate;

      competitors.push({
        name: comp.name,
        score: comp.score,
        industry,
        marketPosition: comp.position,
        strengths: getStrengths(comp.score),
        weaknesses: getWeaknesses(comp.score),
        issues: { critical, serious, moderate, minor }
      });
    });

    return competitors.sort((a, b) => b.score - a.score);
  }, [userScore, userIssues, industry]);

  function getStrengths(score: number): string[] {
    if (score >= 85) return ["Excellent accessibility", "Strong WCAG compliance", "Great user experience"];
    if (score >= 75) return ["Good accessibility practices", "Most issues addressed", "Above average performance"];
    if (score >= 65) return ["Basic accessibility covered", "Some good practices"];
    return ["Potential for improvement"];
  }

  function getWeaknesses(score: number): string[] {
    if (score >= 85) return ["Minor optimization opportunities"];
    if (score >= 75) return ["Some accessibility gaps", "Room for improvement"];
    if (score >= 65) return ["Multiple accessibility issues", "Below best practices"];
    return ["Significant accessibility challenges", "High violation count", "Poor user experience"];
  }

  const marketPosition = useMemo(() => {
    const userRank = competitorData.findIndex(c => c.isYou) + 1;
    const totalCompetitors = competitorData.length;
    const percentile = Math.round(((totalCompetitors - userRank) / (totalCompetitors - 1)) * 100);

    return {
      rank: userRank,
      total: totalCompetitors,
      percentile,
      category: competitorData.find(c => c.isYou)?.marketPosition || "follower"
    };
  }, [competitorData]);

  // Prepare data for different chart types
  const scatterData = competitorData.map(comp => ({
    name: comp.name,
    score: comp.score,
    issues: comp.issues.critical + comp.issues.serious + comp.issues.moderate + comp.issues.minor,
    isYou: comp.isYou || false
  }));

  const comparisonData = competitorData.map(comp => ({
    name: comp.name.length > 12 ? comp.name.substring(0, 12) + "..." : comp.name,
    fullName: comp.name,
    score: comp.score,
    critical: comp.issues.critical,
    serious: comp.issues.serious,
    moderate: comp.issues.moderate,
    minor: comp.issues.minor,
    isYou: comp.isYou || false
  }));

  const radarData = [
    { metric: "Overall Score", yourSite: userScore, industryAvg: 72, leader: Math.max(...competitorData.filter(c => !c.isYou).map(c => c.score)) },
    { metric: "Critical Issues", yourSite: Math.max(0, 10 - userIssues.critical), industryAvg: 7, leader: 9 },
    { metric: "Serious Issues", yourSite: Math.max(0, 10 - userIssues.serious), industryAvg: 6, leader: 8 },
    { metric: "WCAG Compliance", yourSite: Math.round(userScore * 0.8), industryAvg: 58, leader: 76 },
    { metric: "User Experience", yourSite: Math.round(userScore * 0.9), industryAvg: 65, leader: 81 },
  ];

  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p>Score: {data.score}/100</p>
          <p>Total Issues: {data.issues}</p>
          {data.isYou && <p className="text-blue-600 font-medium">← This is you!</p>}
        </div>
      );
    }
    return null;
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case "leader": return <Crown className="w-5 h-5 text-yellow-500" />;
      case "challenger": return <Trophy className="w-5 h-5 text-blue-500" />;
      case "follower": return <Target className="w-5 h-5 text-green-500" />;
      case "niche": return <Award className="w-5 h-5 text-purple-500" />;
      default: return <Award className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "leader": return "text-yellow-700 bg-yellow-100";
      case "challenger": return "text-blue-700 bg-blue-100";
      case "follower": return "text-green-700 bg-green-100";
      case "niche": return "text-purple-700 bg-purple-100";
      default: return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-blue-600" />
              Competitive Analysis
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              See how you compare against industry competitors
            </p>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: "positioning", label: "Positioning" },
              { key: "comparison", label: "Comparison" },
              { key: "radar", label: "Radar" }
            ].map(mode => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Market Position Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">#{marketPosition.rank}</div>
            <div className="text-sm text-gray-600">Market Rank</div>
          </div>
          <div className="text-center p-3 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{marketPosition.percentile}%</div>
            <div className="text-sm text-gray-600">Percentile</div>
          </div>
          <div className="text-center p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              {getPositionIcon(marketPosition.category)}
            </div>
            <div className="text-sm font-medium capitalize">{marketPosition.category}</div>
          </div>
          <div className="text-center p-3 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{industry}</div>
            <div className="text-sm text-gray-600">Industry</div>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {viewMode === "positioning" && (
          <div>
            <h4 className="text-lg font-semibold mb-4">Market Positioning</h4>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  type="number"
                  dataKey="issues"
                  name="Total Issues"
                  tick={{ fill: '#000000', fontSize: 12 }}
                  label={{ value: 'Total Issues (fewer is better)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="score"
                  name="Score"
                  domain={[0, 100]}
                  tick={{ fill: '#000000', fontSize: 12 }}
                  label={{ value: 'Accessibility Score', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomScatterTooltip />} />
                <Scatter
                  data={scatterData}
                  fill="#8884d8"
                >
                  {scatterData.map((entry, index) => (
                    <Scatter
                      key={index}
                      data={[entry]}
                      fill={entry.isYou ? "#3B82F6" : "#94A3B8"}
                      r={entry.isYou ? 8 : 5}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === "comparison" && (
          <div>
            <h4 className="text-lg font-semibold mb-4">Score Comparison</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#000000', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#000000', fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => {
                    const item = comparisonData.find(d => d.name === label);
                    return item?.fullName || label;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="score"
                  name="Accessibility Score"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                >
                  {comparisonData.map((entry, index) => (
                    <Bar key={index} fill={entry.isYou ? "#3B82F6" : "#94A3B8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === "radar" && (
          <div>
            <h4 className="text-lg font-semibold mb-4">Performance Radar</h4>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Your Site"
                  dataKey="yourSite"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Radar
                  name="Industry Average"
                  dataKey="industryAvg"
                  stroke="#94A3B8"
                  fill="#94A3B8"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Radar
                  name="Industry Leader"
                  dataKey="leader"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Competitor Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitorData.slice(0, 6).map((competitor, index) => (
          <div
            key={competitor.name}
            className={`border-2 rounded-lg p-4 ${
              competitor.isYou
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">#{index + 1}</span>
                {getPositionIcon(competitor.marketPosition)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(competitor.marketPosition)}`}>
                  {competitor.marketPosition}
                </span>
              </div>
              {competitor.isYou && (
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">
                  YOU
                </span>
              )}
            </div>

            <h4 className="font-semibold text-gray-900 mb-2">{competitor.name}</h4>
            <div className="text-2xl font-bold text-blue-600 mb-2">{competitor.score}/100</div>

            <div className="grid grid-cols-4 gap-2 mb-3 text-center">
              <div>
                <div className="text-sm font-bold text-red-600">{competitor.issues.critical}</div>
                <div className="text-xs text-gray-500">Critical</div>
              </div>
              <div>
                <div className="text-sm font-bold text-orange-600">{competitor.issues.serious}</div>
                <div className="text-xs text-gray-500">Serious</div>
              </div>
              <div>
                <div className="text-sm font-bold text-yellow-600">{competitor.issues.moderate}</div>
                <div className="text-xs text-gray-500">Moderate</div>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-600">{competitor.issues.minor}</div>
                <div className="text-xs text-gray-500">Minor</div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-green-700 mb-1">Strengths:</div>
                <div className="text-xs text-gray-600">
                  {competitor.strengths.slice(0, 2).join(", ")}
                </div>
              </div>
              {competitor.weaknesses.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-red-700 mb-1">Areas for improvement:</div>
                  <div className="text-xs text-gray-600">
                    {competitor.weaknesses.slice(0, 2).join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Strategic Insights
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Growth Opportunities:</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              {marketPosition.rank > 2 && (
                <li>• Improve score by {Math.ceil((competitorData[0].score - userScore) / 2)} points to move up rankings</li>
              )}
              <li>• Focus on critical and serious issues for maximum impact</li>
              <li>• Target {Math.max(85, competitorData[0].score + 5)} score to become industry leader</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Competitive Advantages:</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              {marketPosition.percentile > 50 && (
                <li>• You&apos;re performing better than {marketPosition.percentile}% of competitors</li>
              )}
              <li>• Strong foundation for accessibility improvements</li>
              <li>• Potential to differentiate through superior accessibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}