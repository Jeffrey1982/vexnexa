import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { redirect } from 'next/navigation';

export default async function AssuranceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuth();

  // Check if user has active Assurance subscription
  const subscription = await getActiveAssuranceSubscription(user.id);

  if (!subscription) {
    // Redirect to subscription page
    redirect('/dashboard/assurance/subscribe');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Assurance Branding Header */}
      <div className="border-b border-teal-200/30 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-600 text-white shadow-md">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-teal-900 dark:text-teal-100">
                Accessibility Assurance
              </h1>
              <p className="text-xs text-teal-700 dark:text-teal-300">
                Automated monitoring & compliance tracking
              </p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                Monitoring Only
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
