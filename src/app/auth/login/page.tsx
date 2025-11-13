import { Suspense } from 'react'
import ModernLoginForm from '@/components/auth/ModernLoginForm'

function LoginFormFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1E1E1E] p-4">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-sm bg-white/80 dark:bg-[#1E1E1E]/80 shadow-2xl border border-[#C0C3C7]/20 rounded-lg p-6">
          <div className="text-center">
            <div className="w-16 h-16 gradient-primary rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
            <p className="text-[#1E1E1E] dark:text-[#F8F9FA]">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <ModernLoginForm />
    </Suspense>
  )
}