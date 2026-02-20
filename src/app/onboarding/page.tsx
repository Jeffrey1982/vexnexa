"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client-new'
import {
  User,
  Building,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react'

const countries = [
  'Netherlands', 'Belgium', 'Germany', 'France', 'United Kingdom',
  'United States', 'Canada', 'Australia', 'Other'
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserEmail(user.email || '')

      // Pre-fill from OAuth metadata if available
      const metadata = user.user_metadata
      const fullName = metadata?.name || metadata?.full_name || ''
      const nameParts = fullName.split(' ')

      setUserName(fullName)
      setFormData(prev => ({
        ...prev,
        firstName: metadata?.first_name || metadata?.given_name || nameParts[0] || '',
        lastName: metadata?.last_name || metadata?.family_name || nameParts.slice(1).join(' ') || '',
        company: metadata?.company || '',
        phoneNumber: metadata?.phone_number || '',
        website: metadata?.website || '',
        country: metadata?.country || '',
      }))
    }

    loadUserData()
  }, [supabase, router])

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required')
      setLoading(false)
      return
    }

    // Name validation
    const nameRegex = /^[a-zA-Z\s'-]+$/
    if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
      setError('Names should only contain letters, spaces, hyphens, and apostrophes')
      setLoading(false)
      return
    }

    try {
      // Update user metadata in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          company: formData.company,
          job_title: formData.jobTitle,
          phone_number: formData.phoneNumber,
          website: formData.website,
          country: formData.country,
          marketing_emails: formData.marketingEmails,
          product_updates: formData.productUpdates,
        }
      })

      if (updateError) throw updateError

      // Update database via API
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company,
          jobTitle: formData.jobTitle,
          phoneNumber: formData.phoneNumber,
          website: formData.website,
          country: formData.country,
          marketingEmails: formData.marketingEmails,
          productUpdates: formData.productUpdates,
          profileCompleted: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      // Redirect to dashboard with welcome
      router.push('/dashboard?welcome=true')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Failed to complete profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#1E1E1E] p-4">
      <div className="w-full max-w-2xl">
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-[#D45A00] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-[#FFD166] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#0F5C5C] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 dark:bg-[#1E1E1E]/90 shadow-2xl border border-[#C0C3C7]/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 gradient-primary rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold font-display text-[#1E1E1E] dark:text-white">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-base text-[#5A5A5A] dark:text-[#C0C3C7]">
              {userName && `Welcome, ${userName.split(' ')[0]}! `}
              Help us personalize your VexNexa experience
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F5C5C]">
                  <User className="w-4 h-4" />
                  Personal Information
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      className="h-12"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F5C5C]">
                  <Building className="w-4 h-4" />
                  Professional Information
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">
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
                    <Label htmlFor="jobTitle">
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

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F5C5C]">
                  <Phone className="w-4 h-4" />
                  Contact Information (Optional)
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">
                        <Globe className="w-4 h-4 inline mr-1" />
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
                      <Label htmlFor="country">
                        <MapPin className="w-4 h-4 inline mr-1" />
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
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F5C5C]">
                  <Sparkles className="w-4 h-4" />
                  Communication Preferences
                </div>

                <div className="space-y-3">
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
              </div>

              <div aria-live="assertive" aria-atomic="true">
                {error && (
                  <Alert variant="destructive" className="animate-in slide-in-from-top-1">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Trial Info */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 dark:from-blue-950 dark:to-purple-950 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Your 14-Day Free Trial Starts Now!
                  </h3>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Full access to all features. No credit card required.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 gradient-primary hover:opacity-90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Complete Setup
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Trust indicators */}
            <div className="pt-4 border-t border-[#C0C3C7] dark:border-[#444]">
              <div className="flex items-center justify-center gap-6 text-xs text-[#5A5A5A] dark:text-[#C0C3C7]">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#0F5C5C]" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[#0F5C5C]" />
                  <span>GDPR Compliant</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#FFD166]" />
                  <span>Instant Access</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
