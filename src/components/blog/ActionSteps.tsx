'use client';

import React from 'react';
import { Search, Users, Repeat, Megaphone } from 'lucide-react';

export function ActionSteps() {
  const steps = [
    {
      icon: Search,
      number: '1',
      title: 'Scan your own website',
      description: 'Check your own house first. Run a WCAG scan on your agency\'s site.',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-700',
      numberBg: 'bg-orange-500',
      iconBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      icon: Users,
      number: '2',
      title: 'Scan your top 3 clients',
      description: 'Pick the three client sites most likely to be in EAA scope.',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      numberBg: 'bg-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Repeat,
      number: '3',
      title: 'Build repeatable workflow',
      description: 'Create a process: Scan → Prioritise → Report → Monitor → Repeat.',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-700',
      numberBg: 'bg-green-500',
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      icon: Megaphone,
      number: '4',
      title: 'Educate your clients',
      description: 'Don\'t wait for clients to ask. Proactively explain the EAA.',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-700',
      numberBg: 'bg-purple-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="my-8">
      <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
        What agencies should do now
      </h3>
      
      {/* Desktop: Horizontal layout */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={index}>
              <div className={`flex-1 ${step.bgColor} ${step.borderColor} p-6 rounded-lg border hover:shadow-lg transition-all duration-200`}>
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className={`w-12 h-12 ${step.numberBg} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                      {step.number}
                    </div>
                    <div className={`absolute -bottom-2 -right-2 p-2 ${step.iconBg} rounded-lg`}>
                      <Icon className={`w-4 h-4 ${step.iconColor}`} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 relative">
                    <div className="absolute right-0 top-1/2 transform translate-y-1/2 translate-x-1/2 w-2 h-2 bg-gray-400 dark:bg-gray-500 rotate-45"></div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile/Tablet: Vertical layout */}
      <div className="lg:hidden space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className={`flex items-center gap-4 ${step.bgColor} ${step.borderColor} p-4 rounded-lg border hover:shadow-lg transition-all duration-200`}>
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className={`w-12 h-12 ${step.numberBg} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {step.number}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 p-1.5 ${step.iconBg} rounded-lg`}>
                    <Icon className={`w-3 h-3 ${step.iconColor}`} />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {step.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
