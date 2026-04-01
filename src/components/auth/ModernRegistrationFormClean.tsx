"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CountrySelect } from '@/components/ui/country-select'
import { createClient } from '@/lib/supabase/client-new'
import { getSiteUrl, buildAuthUrl } from '@/lib/urls'
import { useAuthCooldown, isRateLimitError } from '@/hooks/use-auth-cooldown'
import { 
  User, 
  Mail, 
  Lock, 
  Building, 
  Phone, 
  Globe, 
  MapPin,
  Briefcase,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import VexnexaLogo from '@/components/brand/VexnexaLogo'
import { useTranslations } from 'next-intl'

// OAuth provider icons as SVG components
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

interface RegistrationData {
  // Step 1: Account
  email: string
  password: string
  confirmPassword: string
  
  // Step 2: Personal
  firstName: string
  lastName: string
  company: string
  jobTitle: string
  
  // Step 3: Contact
  phoneNumber: string
  website: string
  country: string
  
  // Step 4: Preferences
  marketingEmails: boolean
  productUpdates: boolean
}

export default function ModernRegistrationForm() {
  const t = useTranslations('auth.register')
  
  const steps = [
    { 
      id: 1, 
      title: t('steps.account.title'), 
      description: t('steps.account.description'),
      icon: Shield
    },
    { 
      id: 2, 
      title: t('steps.personal.title'), 
      description: t('steps.personal.description'),
      icon: User
    },
    { 
      id: 3, 
      title: t('steps.contact.title'), 
      description: t('steps.contact.description'),
      icon: Phone
    },
    { 
      id: 4, 
      title: t('steps.preferences.title'), 
      description: t('steps.preferences.description'),
      icon: Sparkles
    }
  ]

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [signupEmail, setSignupEmail] = useState('')

  const router = useRouter()
  const supabase = createClient()
  const { isCoolingDown: isResendCooling, countdownLabel: resendCountdown, startCooldown: startResendCooldown } = useAuthCooldown('signup-resend', signupEmail)

  // Check if user is already logged in and redirect
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // User is already logged in, redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      }
    }

    checkAuthStatus()
  }, [supabase, router])

  const handleOAuthSignUp = async () => {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback?redirect=/dashboard`
        }
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    phoneNumber: '',
    website: '',
    country: '',
    marketingEmails: false,
    productUpdates: true
  })

  const updateFormData = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setError(t('validation.requiredFields'))
          return false
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          setError(t('validation.validEmail'))
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError(t('validation.passwordsMatch'))
          return false
        }
        // Enhanced password validation
        if (formData.password.length < 8) {
          setError(t('validation.passwordLength'))
          return false
        }
        if (!/[A-Z]/.test(formData.password)) {
          setError(t('validation.passwordUppercase'))
          return false
        }
        if (!/[a-z]/.test(formData.password)) {
          setError(t('validation.passwordLowercase'))
          return false
        }
        if (!/[0-9]/.test(formData.password)) {
          setError(t('validation.passwordNumber'))
          return false
        }
        break
      case 2:
        if (!formData.firstName || !formData.lastName) {
          setError(t('validation.namesRequired'))
          return false
        }
        // Name validation - no numbers or special chars
        const nameRegex = /^[a-zA-Z\s'-]+$/
        if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
          setError(t('validation.validName'))
          return false
        }
        break
      case 3:
        // Validate phone number if provided
        if (formData.phoneNumber) {
          const phoneRegex = /^[\d\s\+\-\(\)]+$/
          if (!phoneRegex.test(formData.phoneNumber)) {
            setError(t('validation.validPhone'))
            return false
          }
        }
        // Validate website URL if provided
        if (formData.website) {
          try {
            new URL(formData.website)
          } catch {
            setError(t('validation.validWebsite'))
            return false
          }
        }
        break
      // Step 4 is optional
    }
    setError('')
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - email configuration may need adjustment')), 25000)
      )

      const signUpPromise = supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: buildAuthUrl('/auth/callback?flow=signup'),
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company: formData.company,
            job_title: formData.jobTitle,
            phone_number: formData.phoneNumber,
            website: formData.website,
            country: formData.country,
            marketing_emails: formData.marketingEmails,
            product_updates: formData.productUpdates
          }
        }
      })

      const { error } = await Promise.race([signUpPromise, timeoutPromise]) as any

      if (error) {
        if (isRateLimitError(error)) {
          console.warn('[Signup] auth_signup_rate_limited')
          setError(t('errors.tooManyRequests'))
          return
        }
        throw error
      }

      setSignupEmail(formData.email)
      startResendCooldown()
      setMessage(t('success.accountCreated'))
      console.log('[Signup] Account created for:', formData.email, '— awaiting email confirmation')
    } catch (error: any) {
      if (error.message?.includes('timeout')) {
        setError(t('errors.timeout'))
      } else {
        console.error('[Signup] failure_reason=', error.message)
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
            currentStep >= step.id 
              ? "bg-primary border-primary text-primary-foreground shadow-lg" 
              : "border-muted-foreground/30 text-muted-foreground"
          )}>
            {currentStep > step.id ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <step.icon className="w-6 h-6" />
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "w-16 h-0.5 mx-2 transition-colors duration-300",
              currentStep > step.id ? "bg-primary" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4">
          <VexnexaLogo size={56} />
        </div>
        <h2 className="text-2xl font-bold">Create Your Account</h2>
        <p className="text-muted-foreground">Join VexNexa and start improving accessibility</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            placeholder="Enter your email address"
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Password *
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            placeholder="Create a strong password"
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Confirm Password *
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => updateFormData('confirmPassword', e.target.value)}
            placeholder="Confirm your password"
            className="h-12"
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mx-auto flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Personal Information</h2>
        <p className="text-muted-foreground">Help us personalize your experience</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            First Name *
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            placeholder="Enter your first name"
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Last Name *
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            placeholder="Enter your last name"
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Company
          </Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => updateFormData('company', e.target.value)}
            placeholder="Your company name"
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Job Title
          </Label>
          <Input
            id="jobTitle"
            value={formData.jobTitle}
            onChange={(e) => updateFormData('jobTitle', e.target.value)}
            placeholder="Your job title"
            className="h-12"
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-500">
          <Phone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Contact Information</h2>
        <p className="text-muted-foreground">Stay connected with us (optional)</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => updateFormData('phoneNumber', e.target.value)}
            placeholder="+31 6 12345678"
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website
          </Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => updateFormData('website', e.target.value)}
            placeholder="https://yourwebsite.com"
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Country
          </Label>
          <CountrySelect
            value={formData.country}
            onValueChange={(code) => updateFormData('country', code)}
            placeholder="Select your country"
          />
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Preferences</h2>
        <p className="text-muted-foreground">Customize your experience (optional)</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="marketingEmails"
              checked={formData.marketingEmails}
              onCheckedChange={(checked) => updateFormData('marketingEmails', checked)}
            />
            <Label htmlFor="marketingEmails" className="text-sm font-medium">
              I'd like to receive marketing emails about new features and updates
            </Label>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="productUpdates"
            checked={formData.productUpdates}
            onCheckedChange={(checked) => updateFormData('productUpdates', checked)}
          />
          <Label htmlFor="productUpdates" className="text-sm font-medium">
            I'd like to receive product updates and security notifications
          </Label>
        </div>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return null
    }
  }

  const renderStepButtons = () => (
    <div className="flex justify-between">
      {currentStep > 1 && (
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      )}
      
      <Button
        onClick={currentStep === 4 ? handleSubmit : nextStep}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-3 font-medium transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-blue-500/20"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2">
              {currentStep === 4 ? 'Creating...' : 'Next'}
            </span>
          </>
        ) : (
          <>
            {currentStep === 4 ? 'Create Account' : 'Next'}
            {currentStep < 4 && <ArrowRight className="ml-2 h-4 w-4" />}
          </>
        )}
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="container flex flex-col items-center justify-center max-w-4xl mx-auto">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Join VexNexa and start improving accessibility today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStepIndicator()}
            {renderCurrentStep()}
            {renderStepButtons()}
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {message && (
              <Alert className="mt-4">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {/* OAuth Sign Up */}
            <div className="mt-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
              <div className="relative border border-gray-200 rounded-lg p-0">
                <Button
                  onClick={handleOAuthSignUp}
                  disabled={loading}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 rounded-lg font-medium transition-colors duration-200"
                >
                  <GoogleIcon />
                  <span className="ml-2">Sign up with Google</span>
                </Button>
              </div>
            </div>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
    
