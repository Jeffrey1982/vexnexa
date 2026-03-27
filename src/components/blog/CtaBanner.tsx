'use client';

import { Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CtaBanner() {
  return (
    <div className="my-8 rounded-xl border border-border/60 bg-gradient-to-r from-primary to-[#3B82F6] p-8 shadow-lg">
      <div className="space-y-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
            <Search className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            Ready to check your clients' accessibility?
          </h3>
        </div>

        <div className="space-y-2">
          <p className="mx-auto max-w-2xl text-lg text-white/90">
            Scan any website against WCAG 2.2 in minutes.
          </p>
          <p className="mx-auto max-w-2xl text-white/80">
            Get a severity-ranked report with remediation guidance.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="border-0 bg-white text-primary hover:bg-white/95"
          >
            <Link href="/auth/register">
              Start your free scan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white bg-transparent text-white hover:bg-white hover:text-primary"
          >
            <Link href="/sample-report">View sample report</Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            No credit card required
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Business-level pilot available
          </span>
        </div>
      </div>
    </div>
  );
}
