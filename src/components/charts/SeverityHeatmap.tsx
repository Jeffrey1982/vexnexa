"use client";

import { useState, useMemo } from "react";
import { TrendData } from "@/lib/analytics";
import { Calendar, Flame, Shield, TrendingUp, Award } from "lucide-react";

interface SeverityHeatmapProps {
  data: TrendData[];
  className?: string;
}

interface HeatmapDay {
  date: string;
  score: number | null;
  issues: number;
  severity: "excellent" | "good" | "fair" | "poor" | "critical" | null;
  dayOfWeek: number;
  dayOfMonth: number;
  isToday: boolean;
  isThisMonth: boolean;
}

export function SeverityHeatmap({ data, className = "" }: SeverityHeatmapProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Generate calendar data for the selected month
  const calendarData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    // Get first day of month and calculate starting position
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start on Sunday

    const days: HeatmapDay[] = [];
    const today = new Date();
    const currentDate = new Date(startDate);

    // Create data map for quick lookup
    const dataMap = new Map();
    data.forEach(item => {
      dataMap.set(item.date, item);
    });

    // Generate 42 days (6 weeks) to fill calendar grid
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const scanData = dataMap.get(dateStr);

      const severity = scanData ? getSeverityLevel(scanData.score) : null;

      days.push({
        date: dateStr,
        score: scanData?.score || null,
        issues: scanData?.issues || 0,
        severity,
        dayOfWeek: currentDate.getDay(),
        dayOfMonth: currentDate.getDate(),
        isToday: currentDate.toDateString() === today.toDateString(),
        isThisMonth: currentDate.getMonth() === month
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [selectedMonth, data]);

  // Calculate streak and analytics
  const analytics = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate current streak
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = sortedData.length - 1; i >= 0; i--) {
      const score = sortedData[i].score;
      if (score >= 75) { // Good threshold
        if (i === sortedData.length - 1) currentStreak++;
        else if (currentStreak > 0) currentStreak++;
        tempStreak++;
      } else {
        if (currentStreak === 0) tempStreak = 0;
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 0;
        break;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);

    // Calculate monthly averages
    const monthlyData = new Map();
    sortedData.forEach(item => {
      const monthKey = item.date.substring(0, 7); // YYYY-MM
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }
      monthlyData.get(monthKey).push(item.score);
    });

    const monthlyAverages = Array.from(monthlyData.entries()).map(([month, scores]) => ({
      month,
      average: Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length),
      scans: scores.length
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Recent performance
    const last7Days = sortedData.slice(-7);
    const recentAverage = last7Days.length > 0
      ? Math.round(last7Days.reduce((sum, item) => sum + item.score, 0) / last7Days.length)
      : 0;

    return {
      currentStreak,
      bestStreak,
      totalScans: sortedData.length,
      recentAverage,
      monthlyAverages,
      isOnStreak: currentStreak > 0
    };
  }, [data]);

  function getSeverityLevel(score: number): "excellent" | "good" | "fair" | "poor" | "critical" {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 60) return "fair";
    if (score >= 40) return "poor";
    return "critical";
  }

  function getSeverityColor(severity: string | null): string {
    switch (severity) {
      case "excellent": return "bg-green-500";
      case "good": return "bg-green-400";
      case "fair": return "bg-yellow-400";
      case "poor": return "bg-orange-500";
      case "critical": return "bg-red-500";
      default: return "bg-gray-100";
    }
  }

  function getSeverityTextColor(severity: string | null): string {
    switch (severity) {
      case "excellent": return "text-white";
      case "good": return "text-white";
      case "fair": return "text-black";
      case "poor": return "text-white";
      case "critical": return "text-white";
      default: return "text-gray-400";
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigateMonth = (direction: 1 | -1) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <div className="text-lg font-semibold">No scan data available</div>
          <div className="text-sm">Run some scans to see your activity heatmap</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Current Streak</div>
                <div className={`text-2xl font-bold ${analytics.isOnStreak ? 'text-green-600' : 'text-gray-600'}`}>
                  {analytics.currentStreak}
                </div>
                <div className="text-xs text-gray-500">good days</div>
              </div>
              {analytics.isOnStreak ? (
                <Flame className="w-8 h-8 text-orange-500" />
              ) : (
                <Shield className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Best Streak</div>
                <div className="text-2xl font-bold text-purple-600">{analytics.bestStreak}</div>
                <div className="text-xs text-gray-500">consecutive good days</div>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Total Scans</div>
            <div className="text-2xl font-bold text-blue-600">{analytics.totalScans}</div>
            <div className="text-xs text-gray-500">all time</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Recent Average</div>
                <div className={`text-2xl font-bold ${
                  analytics.recentAverage >= 75 ? 'text-green-600' :
                  analytics.recentAverage >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analytics.recentAverage}
                </div>
                <div className="text-xs text-gray-500">last 7 days</div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Calendar Heatmap */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Activity Heatmap</h3>
            <p className="text-sm text-gray-600">Accessibility scan activity and performance</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <span className="font-medium min-w-[140px] text-center">
                {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 text-center py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((day, index) => (
              <div
                key={index}
                className={`
                  relative h-10 w-full rounded-lg border-2 transition-all duration-200 cursor-pointer
                  ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                  ${!day.isThisMonth ? 'opacity-30' : ''}
                  ${day.score !== null ? 'hover:scale-105 hover:z-10' : ''}
                  ${getSeverityColor(day.severity)}
                  ${day.score !== null ? 'border-white' : 'border-gray-200'}
                `}
                title={day.score !== null
                  ? `${new Date(day.date).toLocaleDateString()}: Score ${day.score}/100 (${day.issues} issues)`
                  : `${new Date(day.date).toLocaleDateString()}: No scan`
                }
              >
                <div className={`
                  absolute inset-0 flex flex-col items-center justify-center
                  ${getSeverityTextColor(day.severity)}
                `}>
                  <span className="text-xs font-medium">
                    {day.dayOfMonth}
                  </span>
                  {day.score !== null && (
                    <span className="text-xs font-bold">
                      {day.score}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Fewer scans
          </div>

          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          </div>

          <div className="text-sm text-gray-600">
            More scans
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-2 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            Critical (&lt;40)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            Poor (40-59)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
            Fair (60-74)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            Good (75-89)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            Excellent (90+)
          </span>
        </div>
      </div>
    </div>
  );
}