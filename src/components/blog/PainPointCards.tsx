'use client';

import { HelpCircle, RefreshCw, DollarSign, Ban } from 'lucide-react';

export function PainPointCards() {
  const painPoints = [
    {
      icon: HelpCircle,
      title: '"No answer for clients"',
      description: 'You lack a repeatable process',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: RefreshCw,
      title: '"Audits go stale"',
      description: 'One-time scans are outdated after deploy',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-700',
      iconBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      icon: DollarSign,
      title: '"Tools too expensive"',
      description: 'Enterprise tools cost thousands per month',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-700',
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      icon: Ban,
      title: '"Overlays don\'t work"',
      description: 'Widgets fix appearance, not underlying code',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-700',
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <div className="my-8">
      <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
        The four pain points agencies face right now
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {painPoints.map((point, index) => {
          const Icon = point.icon;
          return (
            <div
              key={index}
              className={`${point.bgColor} ${point.borderColor} p-6 rounded-lg border hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-3 ${point.iconBg} rounded-lg`}>
                  <Icon className={`w-8 h-8 ${point.iconColor}`} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {point.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {point.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
