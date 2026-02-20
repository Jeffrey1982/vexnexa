"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, DollarSign, TrendingUp, Shield, Users, Clock, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface ROIInputs {
  monthlyTraffic: number;
  conversionRate: number;
  averageOrderValue: number;
  industryType: 'ecommerce' | 'saas' | 'finance' | 'healthcare' | 'education' | 'government';
  currentScore: number;
  targetScore: number;
  developmentCost: number;
  maintenanceCost: number;
}

interface ROICalculatorProps {
  className?: string;
}

const industryMultipliers = {
  ecommerce: { legal: 0.8, brand: 1.2, conversion: 1.5 },
  saas: { legal: 1.0, brand: 1.5, conversion: 1.3 },
  finance: { legal: 2.0, brand: 1.8, conversion: 1.2 },
  healthcare: { legal: 1.8, brand: 1.4, conversion: 1.1 },
  education: { legal: 0.6, brand: 1.0, conversion: 0.9 },
  government: { legal: 0.4, brand: 0.8, conversion: 0.7 },
};

export function ROICalculator({ className }: ROICalculatorProps) {
  const [inputs, setInputs] = useState<ROIInputs>({
    monthlyTraffic: 50000,
    conversionRate: 2.5,
    averageOrderValue: 85,
    industryType: 'ecommerce',
    currentScore: 65,
    targetScore: 85,
    developmentCost: 15000,
    maintenanceCost: 2000,
  });

  const [timeframe, setTimeframe] = useState<'1y' | '2y' | '3y'>('2y');

  const calculations = useMemo(() => {
    const multiplier = industryMultipliers[inputs.industryType];
    const scoreImprovement = inputs.targetScore - inputs.currentScore;
    const improvementFactor = scoreImprovement / 100;

    // Revenue impact
    const currentMonthlyRevenue = (inputs.monthlyTraffic * inputs.conversionRate * inputs.averageOrderValue) / 100;
    const conversionLift = improvementFactor * 0.15 * multiplier.conversion; // 15% base lift per 100 point improvement
    const newConversionRate = inputs.conversionRate * (1 + conversionLift);
    const newMonthlyRevenue = (inputs.monthlyTraffic * newConversionRate * inputs.averageOrderValue) / 100;
    const monthlyRevenueIncrease = newMonthlyRevenue - currentMonthlyRevenue;

    // Legal risk reduction
    const baseLegalRisk = inputs.monthlyTraffic * 0.0001; // Base risk factor
    const currentLegalRisk = baseLegalRisk * (1 + (100 - inputs.currentScore) / 50);
    const newLegalRisk = baseLegalRisk * (1 + (100 - inputs.targetScore) / 50);
    const legalRiskReduction = (currentLegalRisk - newLegalRisk) * 50000 * multiplier.legal; // $50k average lawsuit cost

    // Brand value improvement
    const brandValueIncrease = currentMonthlyRevenue * 0.05 * improvementFactor * multiplier.brand;

    // SEO and traffic benefits
    const seoLift = improvementFactor * 0.08; // 8% traffic lift per 100 point improvement
    const seoTrafficIncrease = inputs.monthlyTraffic * seoLift;
    const seoRevenueIncrease = (seoTrafficIncrease * inputs.conversionRate * inputs.averageOrderValue) / 100;

    // Cost calculations
    const totalDevelopmentCost = inputs.developmentCost;
    const yearlyMaintenanceCost = inputs.maintenanceCost * 12;
    const years = parseInt(timeframe.replace('y', ''));

    // Annual benefits
    const annualRevenueIncrease = monthlyRevenueIncrease * 12;
    const annualSEORevenue = seoRevenueIncrease * 12;
    const annualBrandValue = brandValueIncrease * 12;
    const annualLegalSavings = legalRiskReduction;

    const totalAnnualBenefits = annualRevenueIncrease + annualSEORevenue + annualBrandValue + annualLegalSavings;
    const totalBenefits = totalAnnualBenefits * years;
    const totalCosts = totalDevelopmentCost + (yearlyMaintenanceCost * years);

    const roi = ((totalBenefits - totalCosts) / totalCosts) * 100;
    const paybackMonths = totalCosts / (totalAnnualBenefits / 12);

    return {
      currentMonthlyRevenue,
      newMonthlyRevenue,
      monthlyRevenueIncrease,
      annualRevenueIncrease,
      annualSEORevenue,
      annualBrandValue,
      annualLegalSavings,
      totalAnnualBenefits,
      totalBenefits,
      totalCosts,
      roi,
      paybackMonths,
      netPresentValue: totalBenefits - totalCosts,
      conversionLift: conversionLift * 100,
    };
  }, [inputs, timeframe]);

  const benefitsData = [
    { name: 'Revenue Increase', value: calculations.annualRevenueIncrease, color: '#3b82f6' },
    { name: 'SEO Benefits', value: calculations.annualSEORevenue, color: '#10b981' },
    { name: 'Brand Value', value: calculations.annualBrandValue, color: '#f59e0b' },
    { name: 'Legal Risk Reduction', value: calculations.annualLegalSavings, color: '#ef4444' },
  ];

  const yearlyProjection = Array.from({ length: parseInt(timeframe.replace('y', '')) }, (_, i) => ({
    year: `Year ${i + 1}`,
    benefits: calculations.totalAnnualBenefits,
    costs: i === 0 ? inputs.developmentCost + inputs.maintenanceCost * 12 : inputs.maintenanceCost * 12,
    cumulative: calculations.totalAnnualBenefits * (i + 1) - (inputs.developmentCost + inputs.maintenanceCost * 12 * (i + 1)),
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Accessibility ROI Calculator
        </CardTitle>
        <CardDescription>
          Calculate the financial impact and return on investment for accessibility improvements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="inputs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="results">ROI Results</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
          </TabsList>

          <TabsContent value="inputs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Business Metrics
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="traffic">Monthly Website Traffic</Label>
                    <Input
                      id="traffic"
                      type="number"
                      value={inputs.monthlyTraffic}
                      onChange={(e) => setInputs(prev => ({ ...prev, monthlyTraffic: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="conversion">Conversion Rate (%)</Label>
                    <Input
                      id="conversion"
                      type="number"
                      step="0.1"
                      value={inputs.conversionRate}
                      onChange={(e) => setInputs(prev => ({ ...prev, conversionRate: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="aov">Average Order Value ($)</Label>
                    <Input
                      id="aov"
                      type="number"
                      value={inputs.averageOrderValue}
                      onChange={(e) => setInputs(prev => ({ ...prev, averageOrderValue: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry Type</Label>
                    <Select
                      value={inputs.industryType}
                      onValueChange={(value: any) => setInputs(prev => ({ ...prev, industryType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Accessibility Goals
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label>Current Accessibility Score: {inputs.currentScore}</Label>
                    <Slider
                      value={[inputs.currentScore]}
                      onValueChange={([value]) => setInputs(prev => ({ ...prev, currentScore: value }))}
                      max={100}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Target Accessibility Score: {inputs.targetScore}</Label>
                    <Slider
                      value={[inputs.targetScore]}
                      onValueChange={([value]) => setInputs(prev => ({ ...prev, targetScore: value }))}
                      max={100}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="devCost">Development Cost ($)</Label>
                    <Input
                      id="devCost"
                      type="number"
                      value={inputs.developmentCost}
                      onChange={(e) => setInputs(prev => ({ ...prev, developmentCost: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maintenance">Monthly Maintenance Cost ($)</Label>
                    <Input
                      id="maintenance"
                      type="number"
                      value={inputs.maintenanceCost}
                      onChange={(e) => setInputs(prev => ({ ...prev, maintenanceCost: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex items-center gap-4">
              <Label>Projection Timeframe:</Label>
              <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="2y">2 Years</SelectItem>
                  <SelectItem value="3y">3 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    {calculations.roi.toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">ROI</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <div className="text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">
                    {calculations.paybackMonths.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Months to Payback</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-purple-50 rounded-lg border border-purple-200"
              >
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(calculations.netPresentValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Net Present Value</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-orange-50 rounded-lg border border-orange-200"
              >
                <div className="text-center">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">
                    +{calculations.conversionLift.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Conversion Lift</div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-4">Annual Benefits Breakdown</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={benefitsData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {benefitsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-4">Key Metrics</h4>
                <div className="space-y-4">
                  {[
                    {
                      label: 'Monthly Revenue Impact',
                      value: formatCurrency(calculations.monthlyRevenueIncrease),
                      change: `+${((calculations.monthlyRevenueIncrease / calculations.currentMonthlyRevenue) * 100).toFixed(1)}%`,
                      icon: <DollarSign className="h-4 w-4" />
                    },
                    {
                      label: 'Annual Legal Risk Savings',
                      value: formatCurrency(calculations.annualLegalSavings),
                      change: 'Risk Reduction',
                      icon: <Shield className="h-4 w-4" />
                    },
                    {
                      label: 'SEO & Traffic Benefits',
                      value: formatCurrency(calculations.annualSEORevenue),
                      change: 'Organic Growth',
                      icon: <TrendingUp className="h-4 w-4" />
                    }
                  ].map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                      <div className="flex items-center gap-2">
                        {metric.icon}
                        <div>
                          <div className="font-medium text-sm">{metric.label}</div>
                          <div className="text-xs text-muted-foreground">{metric.change}</div>
                        </div>
                      </div>
                      <div className="font-bold text-right">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">Investment Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(calculations.totalCosts)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Investment</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(calculations.totalBenefits)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Benefits</div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(calculations.totalBenefits - calculations.totalCosts)}
                  </div>
                  <div className="text-sm text-muted-foreground">Net Profit</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="projections" className="space-y-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyProjection}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="benefits" fill="#10b981" name="Annual Benefits" />
                  <Bar dataKey="costs" fill="#ef4444" name="Annual Costs" />
                  <Bar dataKey="cumulative" fill="#3b82f6" name="Cumulative Net" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Break-even Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Break-even point:</span>
                    <Badge variant="outline">Month {Math.ceil(calculations.paybackMonths)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit after Year 1:</span>
                    <span className="font-medium">
                      {formatCurrency(calculations.totalAnnualBenefits - inputs.developmentCost - (inputs.maintenanceCost * 12))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly profit (steady state):</span>
                    <span className="font-medium">
                      {formatCurrency((calculations.totalAnnualBenefits / 12) - inputs.maintenanceCost)}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3">Risk Assessment</h4>
                <div className="space-y-3">
                  {[
                    {
                      risk: 'Legal Compliance',
                      level: calculations.annualLegalSavings > 10000 ? 'Low' : 'Medium',
                      savings: formatCurrency(calculations.annualLegalSavings)
                    },
                    {
                      risk: 'Market Competition',
                      level: calculations.conversionLift > 10 ? 'Low' : 'High',
                      savings: `+${calculations.conversionLift.toFixed(1)}% conversion`
                    },
                    {
                      risk: 'Implementation',
                      level: inputs.developmentCost < 50000 ? 'Low' : 'Medium',
                      savings: `${calculations.paybackMonths.toFixed(1)} month payback`
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {item.level === 'Low' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="text-sm">{item.risk}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={item.level === 'Low' ? 'default' : 'secondary'} className="text-xs mb-1">
                          {item.level} Risk
                        </Badge>
                        <div className="text-xs text-muted-foreground">{item.savings}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}