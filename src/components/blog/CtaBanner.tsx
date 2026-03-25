'use client';

import { Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CtaBanner() {
  return (
    <div className="my-8 p-8 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl shadow-xl">
      <div className="text-center space-y-6">
        {/* Icon and title */}
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <Search className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            Ready to check your clients' accessibility?
          </h3>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Scan any website against WCAG 2.2 in minutes.
          </p>
          <p className="text-white/80 max-w-2xl mx-auto">
            Get a severity-ranked report with remediation guidance.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-gray-100 border-0">
            <Link href="/auth/register">
              Start your free scan
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="bg-transparent text-white border-white hover:bg-white hover:text-orange-600">
            <Link href="/sample-report">
              View sample report
            </Link>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 text-sm text-white/70">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            No credit card required
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Business-level pilot available
          </span>
        </div>
      </div>
    </div>
  );
}
