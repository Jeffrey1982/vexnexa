import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BrandedHeader from '@/components/white-label/BrandedHeader'
import BrandedFooter from '@/components/white-label/BrandedFooter'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAuth()
  } catch (error) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader />
      <main>
        {children}
      </main>
      <BrandedFooter />
    </div>
  )
}