"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CountrySelect } from '@/components/ui/country-select'
import { createClient } from '@/lib/supabase/client-new'
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
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

const steps = [
  { 
    id: 1, 
    title: 'Account', 
    description: 'Create your secure account',
    icon: Shield
  },
  { 
    id: 2, 
    title: 'Personal', 
    description: 'Tell us about yourself',
    icon: User
  },
  { 
    id: 3, 
    title: 'Contact', 
    description: 'How can we reach you?',
    icon: Phone
  },
  { 
    id: 4, 
    title: 'Preferences', 
    description: 'Customize your experience',
    icon: Sparkles
  }
]

export default function ModernRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const router = useRouter()
  const supabase = createClient()

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
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      const origin = isLocalhost
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || 'https://vexnexa.com')

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?redirect=/dashboard`
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
          setError('Please fill in all required fields')
          return false
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          setError('Please enter a valid email address')
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          return false
        }
        // Enhanced password validation
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters')
          return false
        }
        if (!/[A-Z]/.test(formData.password)) {
          setError('Password must contain at least one uppercase letter')
          return false
        }
        if (!/[a-z]/.test(formData.password)) {
          setError('Password must contain at least one lowercase letter')
          return false
        }
        if (!/[0-9]/.test(formData.password)) {
          setError('Password must contain at least one number')
          return false
        }
        break
      case 2:
        if (!formData.firstName || !formData.lastName) {
          setError('First name and last name are required')
          return false
        }
        // Name validation - no numbers or special chars
        const nameRegex = /^[a-zA-Z\s'-]+$/
        if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
          setError('Names should only contain letters, spaces, hyphens, and apostrophes')
          return false
        }
        break
      case 3:
        // Validate phone number if provided
        if (formData.phoneNumber) {
          const phoneRegex = /^[\d\s\+\-\(\)]+$/
          if (!phoneRegex.test(formData.phoneNumber)) {
            setError('Please enter a valid phone number')
            return false
          }
        }
        // Validate website URL if provided
        if (formData.website) {
          try {
            new URL(formData.website)
          } catch {
            setError('Please enter a valid website URL (including http:// or https://)')
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

      const isLocalhost: boolean = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      const origin: string = isLocalhost
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin)

      const signUpPromise = supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
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

      if (error) throw error

      setMessage('🎉 Account created! Please check your email to confirm your account.')
    } catch (error: any) {
      if (error.message?.includes('timeout')) {
        setError('Registration is taking too long. This is likely due to email configuration. Please contact support or try again later.')
      } else {
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
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-white" />
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
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mx-auto flex items-center justify-center mb-4">
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
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Preferences</h2>
        <p className="text-muted-foreground">Customize your experience with us</p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
            <Checkbox
              id="marketingEmails"
              checked={formData.marketingEmails}
              onCheckedChange={(checked) => updateFormData('marketingEmails', checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="marketingEmails"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:text-[var(--vn-disabled-fg)] peer-disabled:opacity-100"
              >
                Marketing Emails
              </label>
              <p className="text-xs text-muted-foreground">
                Receive updates about new features, tips, and special offers
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
            <Checkbox
              id="productUpdates"
              checked={formData.productUpdates}
              onCheckedChange={(checked) => updateFormData('productUpdates', checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="productUpdates"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:text-[var(--vn-disabled-fg)] peer-disabled:opacity-100"
              >
                Product Updates
              </label>
              <p className="text-xs text-muted-foreground">
                Get notified about important product updates and accessibility insights
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 dark:from-blue-950 dark:to-purple-950 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Ready to get started?
            </h3>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You&apos;ll get a 14-day free trial with full access to all features. No credit card required!
          </p>
        </div>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      default: return renderStep1()
    }
  }

  if (message) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Almost there!</h3>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-2xl">Create Your Account</CardTitle>
        <CardDescription className="text-center">
          Join VexNexa and make the web more accessible
        </CardDescription>

        {/* OAuth Sign Up Options */}
        <div className="pt-6 space-y-4">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleOAuthSignUp}
            className="w-full h-12 border-2 gap-2"
          >
            <GoogleIcon />
            <span className="text-sm font-medium">Continue with Google</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 pt-4">
          <Badge variant="outline" className="text-xs">
            Step {currentStep} of {steps.length}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {steps.find(s => s.id === currentStep)?.description}
          </div>
        </div>
        {renderStepIndicator()}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderCurrentStep()}
        
        <div aria-live="assertive" aria-atomic="true">
          {error && (
            <Alert variant="destructive" id="register-error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          
          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <div className="text-center text-sm">
          Already have an account?{' '}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-semibold"
            onClick={() => router.push('/auth/login')}
          >
            Sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}