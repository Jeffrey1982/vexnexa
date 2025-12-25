import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  title: 'Unauthorized Access - VexNexa',
  description: 'You do not have permission to access this resource',
};

export default async function UnauthorizedPage() {
  let user = null;

  try {
    user = await getCurrentUser();
  } catch (error) {
    // User not authenticated
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-2">
            You don't have permission to access this resource.
          </p>

          {user ? (
            <p className="text-sm text-gray-500 mb-8">
              Logged in as <span className="font-medium">{user.email}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-8">
              Please sign in with an authorized account.
            </p>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {user ? (
              <>
                <Link href="/dashboard" className="block">
                  <Button className="w-full" size="lg">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block">
                  <Button className="w-full" size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need admin access?{' '}
              <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-medium">
                Contact support
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Error Code: 403 - Forbidden
        </p>
      </div>
    </div>
  );
}
