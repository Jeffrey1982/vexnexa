"use client";

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

interface ProgressAnimationsProps {
  score: number;
  issues: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  isLoading?: boolean;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: number;
  maxValue: number;
  color: string;
  icon: React.ReactNode;
  delay?: number;
}

function MetricCard({ title, value, maxValue, color, icon, delay = 0 }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayValue((prev) => {
          if (prev >= value) {
            clearInterval(interval);
            return value;
          }
          return Math.min(prev + Math.ceil((value - prev) * 0.1), value);
        });
      }, 50);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const percentage = maxValue > 0 ? (displayValue / maxValue) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className={`p-4 rounded-lg border-l-4 bg-white shadow-sm`}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {displayValue}/{maxValue}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="relative">
          <motion.div
            className="h-2 rounded-full bg-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay / 1000 }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, delay: delay / 1000, ease: "easeOut" }}
            />
          </motion.div>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>{percentage.toFixed(0)}%</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (delay / 1000) + 0.5 }}
          >
            {displayValue} {title.toLowerCase()}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

function CircularProgress({ value, maxValue, color, size = 120 }: {
  value: number;
  maxValue: number;
  color: string;
  size?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayValue((prev) => {
          if (prev >= value) {
            clearInterval(interval);
            return value;
          }
          return Math.min(prev + 1, value);
        });
      }, 30);

      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const percentage = maxValue > 0 ? (displayValue / maxValue) * 100 : 0;
  const circumference = 2 * Math.PI * ((size - 20) / 2);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 20) / 2}
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 20) / 2}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="text-2xl font-bold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {displayValue}
          </motion.div>
          <div className="text-xs text-gray-600">/{maxValue}</div>
        </div>
      </div>
    </div>
  );
}

function LoadingPulse() {
  return (
    <div className="flex items-center justify-center space-x-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-primary rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export function ProgressAnimations({ score, issues, isLoading = false, className }: ProgressAnimationsProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowDetails(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Analyzing Accessibility...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <LoadingPulse />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-20 bg-gray-200 rounded-lg"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Accessibility Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <CircularProgress
            value={score}
            maxValue={100}
            color={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
            size={150}
          />
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard
                  title="Critical Issues"
                  value={issues.critical}
                  maxValue={issues.total}
                  color="#ef4444"
                  icon={<AlertCircle className="w-4 h-4 text-red-500" />}
                  delay={200}
                />
                <MetricCard
                  title="Serious Issues"
                  value={issues.serious}
                  maxValue={issues.total}
                  color="#f97316"
                  icon={<AlertCircle className="w-4 h-4 text-orange-500" />}
                  delay={400}
                />
                <MetricCard
                  title="Moderate Issues"
                  value={issues.moderate}
                  maxValue={issues.total}
                  color="#eab308"
                  icon={<AlertCircle className="w-4 h-4 text-yellow-500" />}
                  delay={600}
                />
                <MetricCard
                  title="Minor Issues"
                  value={issues.minor}
                  maxValue={issues.total}
                  color="#6b7280"
                  icon={<CheckCircle className="w-4 h-4 text-gray-500" />}
                  delay={800}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">Overall Assessment</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {score >= 80 && "Excellent accessibility! Your site meets most WCAG guidelines."}
                      {score >= 60 && score < 80 && "Good progress! Focus on fixing critical and serious issues."}
                      {score < 60 && "Needs improvement. Address critical issues first for better accessibility."}
                    </p>
                  </div>
                  <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}>
                    {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Work"}
                  </Badge>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}