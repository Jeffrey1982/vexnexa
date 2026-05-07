import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { redirect } from 'next/navigation';

export default async function AssuranceLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect('/auth/login?redirect=/dashboard/assurance');
  }

  // Check if user has active Assurance subscription
  const subscription = await getActiveAssuranceSubscription(user.id);

  if (!subscription) {
    // Redirect to subscription page
    redirect('/dashboard/subscribe-assurance');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Assurance Branding Header */}
      <div className="border-b border-primary-200/30 dark:border-primary-700/30 bg-gradient-to-r from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-950/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-600 text-white shadow-md">
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
              <h1 className="text-lg font-semibold text-primary-900 dark:text-primary-100">
                Accessibility Assurance
              </h1>
              <p className="text-xs text-primary-700 dark:text-primary-300">
                Automated monitoring & compliance tracking
              </p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200 border border-primary-300 dark:border-primary-700">
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
