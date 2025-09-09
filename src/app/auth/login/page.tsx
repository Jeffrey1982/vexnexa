import AuthForm from '@/components/auth/AuthForm'

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <AuthForm mode="login" />
    </div>
  )
}