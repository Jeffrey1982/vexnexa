import ModernRegistrationForm from '@/components/auth/ModernRegistrationForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="container flex flex-col items-center justify-center max-w-4xl mx-auto">
        <ModernRegistrationForm />
      </div>
    </div>
  )
}