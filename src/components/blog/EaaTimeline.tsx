'use client';

import { Calendar, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export function EaaTimeline() {
  return (
    <div className="my-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
      <h3 className="text-xl font-bold text-center mb-6 text-blue-900 dark:text-blue-100">
        European Accessibility Act Timeline
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200 dark:bg-blue-700 md:left-1/2 md:transform md:-translate-x-0.5"></div>
        
        {/* Timeline items */}
        <div className="space-y-6">
          {/* 2019 */}
          <div className="relative flex items-center md:justify-end md:pr-8">
            <div className="flex items-center gap-4 md:flex-row-reverse md:gap-4">
              <div className="relative z-10 w-16 h-16 bg-white dark:bg-gray-800 rounded-full border-4 border-blue-500 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700 shadow-md md:w-64">
                <h4 className="font-bold text-blue-900 dark:text-blue-100">2019</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">EAA directive adopted by EU</p>
              </div>
            </div>
          </div>

          {/* 2022 */}
          <div className="relative flex items-center md:justify-start md:pl-8">
            <div className="flex items-center gap-4">
              <div className="relative z-10 w-16 h-16 bg-white dark:bg-gray-800 rounded-full border-4 border-blue-500 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700 shadow-md md:w-64">
                <h4 className="font-bold text-blue-900 dark:text-blue-100">2022</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Member states transpose into national law</p>
              </div>
            </div>
          </div>

          {/* June 2025 */}
          <div className="relative flex items-center md:justify-end md:pr-8">
            <div className="flex items-center gap-4 md:flex-row-reverse md:gap-4">
              <div className="relative z-10 w-16 h-16 bg-white dark:bg-gray-800 rounded-full border-4 border-orange-500 flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-200 dark:border-orange-700 shadow-md md:w-64">
                <h4 className="font-bold text-orange-900 dark:text-orange-100">June 2025</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enforcement begins across all EU states</p>
              </div>
            </div>
          </div>

          {/* Now (2026) */}
          <div className="relative flex items-center md:justify-start md:pl-8">
            <div className="flex items-center gap-4">
              <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-4 border-red-600 flex items-center justify-center shadow-lg animate-pulse">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-700 shadow-md md:w-64">
                <h4 className="font-bold text-red-900 dark:text-red-100">Now (2026)</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Complaints & penalties active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
