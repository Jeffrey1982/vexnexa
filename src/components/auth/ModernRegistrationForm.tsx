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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
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

const countries = [
  'Netherlands', 'Belgium', 'Germany', 'France', 'United Kingdom', 
  'United States', 'Canada', 'Australia', 'Other'
]

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
        // User is already logged in, redirect to new dashboard
        router.push('/app-dashboard')
        router.refresh()
      }
    }

    checkAuthStatus()
  }, [supabase, router])

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
    marketingEmails: true,
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
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          return false
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters')
          return false
        }
        break
      case 2:
        if (!formData.firstName || !formData.lastName) {
          setError('First name and last name are required')
          return false
        }
        break
      // Steps 3 and 4 are optional
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
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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

      if (error) throw error

      setMessage('🎉 Account created! Please check your email to confirm your account.')
    } catch (error: any) {
      setError(error.message)
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
        <p className="text-muted-foreground">Join TutusPorta by Vexnexa and start improving accessibility</p>
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
          <Select value={formData.country} onValueChange={(value) => updateFormData('country', value)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
        <div className="flex items-center justify-between mb-4">
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
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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