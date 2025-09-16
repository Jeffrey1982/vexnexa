"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { TrendData } from "@/lib/analytics";
import { Calendar, TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";

interface EnhancedScoreTrendsProps {
  data: TrendData[];
  className?: string;
}

type TimePeriod = "7d" | "30d" | "90d";

export function EnhancedScoreTrends({ data, className = "" }: EnhancedScoreTrendsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30d");
  const [showPrediction, setShowPrediction] = useState(true);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[selectedPeriod];

    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, selectedPeriod]);

  // Simple linear regression for score prediction
  const predictionData = useMemo(() => {
    if (!showPrediction || filteredData.length < 3) return [];

    const scores = filteredData.map(d => d.score);
    const n = scores.length;

    // Calculate linear regression
    const sumX = scores.reduce((sum, _, i) => sum + i, 0);
    const sumY = scores.reduce((sum, score) => sum + score, 0);
    const sumXY = scores.reduce((sum, score, i) => sum + i * score, 0);
    const sumXX = scores.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate prediction points
    const predictions = [];
    const lastDate = new Date(filteredData[filteredData.length - 1].date);

    for (let i = 1; i <= 7; i++) {
      const predDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
      const predScore = Math.max(0, Math.min(100, intercept + slope * (n + i - 1)));

      predictions.push({
        date: predDate.toISOString().split('T')[0],
        score: Math.round(predScore),
        isPrediction: true,
        issues: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      });
    }

    return [...filteredData, ...predictions];
  }, [filteredData, showPrediction]);

  const displayData = showPrediction ? predictionData : filteredData;

  // Calculate trend analytics
  const analytics = useMemo(() => {
    if (filteredData.length < 2) return null;

    const firstScore = filteredData[0].score;
    const lastScore = filteredData[filteredData.length - 1].score;
    const scoreDiff = lastScore - firstScore;
    const percentChange = ((scoreDiff / firstScore) * 100);

    const avgScore = filteredData.reduce((sum, d) => sum + d.score, 0) / filteredData.length;
    const peakScore = Math.max(...filteredData.map(d => d.score));
    const lowestScore = Math.min(...filteredData.map(d => d.score));

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = 1; i < filteredData.length; i++) {
      if (filteredData[i].score >= filteredData[i-1].score) {
        tempStreak++;
        if (i === filteredData.length - 1) currentStreak = tempStreak;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);

    return {
      scoreDiff,
      percentChange,
      avgScore: Math.round(avgScore),
      peakScore,
      lowestScore,
      currentStreak,
      bestStreak,
      isImproving: scoreDiff > 0,
      volatility: Math.round(peakScore - lowestScore)
    };
  }, [filteredData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPred = data.isPrediction;

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">
            {formatDate(label)}
            {isPred && <span className="text-blue-600 ml-1">(Predicted)</span>}
          </p>
          <p className="text-lg font-bold text-blue-600">
            Score: {payload[0].value}/100
          </p>
          {!isPred && (
            <p className="text-sm text-gray-600">
              Issues: {data.issues}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <div className="text-lg font-semibold">No trend data available</div>
          <div className="text-sm">Run more scans to see trends</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Time Period:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: "7d", label: "7 Days" },
              { key: "30d", label: "30 Days" },
              { key: "90d", label: "90 Days" }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as TimePeriod)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPrediction}
            onChange={(e) => setShowPrediction(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show 7-day prediction
        </label>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Trend</div>
                <div className={`text-2xl font-bold ${analytics.isImproving ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.isImproving ? '+' : ''}{analytics.scoreDiff}
                </div>
                <div className="text-xs text-gray-500">
                  {analytics.percentChange >= 0 ? '+' : ''}{analytics.percentChange.toFixed(1)}%
                </div>
              </div>
              {analytics.isImproving ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Average</div>
            <div className="text-2xl font-bold text-blue-600">{analytics.avgScore}</div>
            <div className="text-xs text-gray-500">out of 100</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Peak Score</div>
            <div className="text-2xl font-bold text-green-600">{analytics.peakScore}</div>
            <div className="text-xs text-gray-500">best performance</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Current Streak</div>
                <div className="text-2xl font-bold text-purple-600">{analytics.currentStreak}</div>
                <div className="text-xs text-gray-500">improving scans</div>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Accessibility Score Trend</h3>
          <p className="text-sm text-gray-600">
            Track your accessibility performance over time
            {showPrediction && " with predictive forecasting"}
          </p>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: '#000000', fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#000000', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Historical data */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={(props) => {
                const { payload } = props;
                if (payload?.isPrediction) return <></>;
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill="#3B82F6"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                );
              }}
              name="Accessibility Score"
              connectNulls={false}
            />

            {/* Prediction line */}
            {showPrediction && (
              <Line
                type="monotone"
                dataKey="score"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={(props) => {
                  const { payload } = props;
                  if (!payload?.isPrediction) return <></>;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      fill="#94A3B8"
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                  );
                }}
                name="Predicted Score"
                connectNulls={false}
              />
            )}

            {/* Target line */}
            <ReferenceLine
              y={85}
              stroke="#10B981"
              strokeDasharray="3 3"
              label={{ value: "Target (85)", position: "top" }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Performance Alerts */}
        {analytics && analytics.scoreDiff < -10 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">Performance Alert</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Accessibility score has dropped by {Math.abs(analytics.scoreDiff)} points.
              Consider reviewing recent changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}