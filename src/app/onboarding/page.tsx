"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { CountrySelect } from '@/components/ui/country-select'
import { createClient } from '@/lib/supabase/client-new'
import { isEuCountry, isNlCountry } from '@/lib/billing/countries'
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
  CheckCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'

type BillingType = 'individual' | 'business'

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [vatValidating, setVatValidating] = useState(false)
  const [vatStatus, setVatStatus] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    phoneNumber: '',
    website: '',
    country: '',
    marketingEmails: false,
    productUpdates: true,
    billingType: 'individual' as BillingType,
    companyName: '',
    vatId: '',
    kvkNumber: '',
    taxId: '',
    addressLine1: '',
    addressCity: '',
    addressPostal: '',
    addressRegion: '',
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

      // Save billing profile if country is set
      if (formData.country) {
        await fetch('/api/billing/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            billingType: formData.billingType,
            fullName: `${formData.firstName} ${formData.lastName}`.trim() || undefined,
            companyName: formData.companyName || undefined,
            countryCode: formData.country,
            vatId: formData.vatId || undefined,
            kvkNumber: formData.kvkNumber || undefined,
            taxId: formData.taxId || undefined,
            addressLine1: formData.addressLine1 || undefined,
            addressCity: formData.addressCity || undefined,
            addressPostal: formData.addressPostal || undefined,
            addressRegion: formData.addressRegion || undefined,
          }),
        })
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
                      <CountrySelect
                        value={formData.country}
                        onValueChange={(code) => updateFormData('country', code)}
                        placeholder="Select your country"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F5C5C]">
                  <FileText className="w-4 h-4" />
                  Billing Identity (Optional)
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateFormData('billingType', 'individual')}
                    className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      formData.billingType === 'individual'
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData('billingType', 'business')}
                    className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      formData.billingType === 'business'
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    <Building className="w-4 h-4 inline mr-2" />
                    Business
                  </button>
                </div>

                {formData.billingType === 'business' && (
                  <div className="space-y-4 p-4 rounded-lg border bg-card animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">
                        Company Name *
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => updateFormData('companyName', e.target.value)}
                        placeholder="Your company name"
                        className="h-12"
                        required
                      />
                    </div>

                    {formData.country && isEuCountry(formData.country) && (
                      <div className="space-y-2">
                        <Label htmlFor="vatId">
                          VAT ID (optional)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="vatId"
                            value={formData.vatId}
                            onChange={(e) => {
                              updateFormData('vatId', e.target.value)
                              setVatStatus('idle')
                            }}
                            placeholder={formData.country === 'NL' ? 'NL123456789B01' : `${formData.country}...`}
                            className="h-12 flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!formData.vatId || vatValidating}
                            onClick={async () => {
                              setVatValidating(true)
                              setVatStatus('idle')
                              try {
                                const res = await fetch('/api/billing/validate-vat', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ countryCode: formData.country, vatId: formData.vatId }),
                                })
                                const data = await res.json()
                                setVatStatus(data.valid ? 'valid' : 'invalid')
                              } catch {
                                setVatStatus('error')
                              } finally {
                                setVatValidating(false)
                              }
                            }}
                            className="h-12 px-4"
                          >
                            {vatValidating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Validate'
                            )}
                          </Button>
                        </div>
                        {vatStatus === 'valid' && (
                          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Valid VAT ID
                          </p>
                        )}
                        {vatStatus === 'invalid' && (
                          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> Could not validate VAT ID
                          </p>
                        )}
                        {vatStatus === 'error' && (
                          <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> VIES service unavailable — you can continue
                          </p>
                        )}
                      </div>
                    )}

                    {formData.country && isNlCountry(formData.country) && (
                      <div className="space-y-2">
                        <Label htmlFor="kvkNumber">
                          KvK Number (optional)
                        </Label>
                        <Input
                          id="kvkNumber"
                          value={formData.kvkNumber}
                          onChange={(e) => updateFormData('kvkNumber', e.target.value)}
                          placeholder="12345678"
                          className="h-12"
                        />
                      </div>
                    )}

                    {formData.country && !isEuCountry(formData.country) && (
                      <div className="space-y-2">
                        <Label htmlFor="taxId">
                          Tax ID (optional)
                        </Label>
                        <Input
                          id="taxId"
                          value={formData.taxId}
                          onChange={(e) => updateFormData('taxId', e.target.value)}
                          placeholder="Tax identification number"
                          className="h-12"
                        />
                      </div>
                    )}

                    {/* Optional billing address */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Billing Address (optional)</Label>
                      <Input
                        value={formData.addressLine1}
                        onChange={(e) => updateFormData('addressLine1', e.target.value)}
                        placeholder="Street address"
                        className="h-10"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={formData.addressCity}
                          onChange={(e) => updateFormData('addressCity', e.target.value)}
                          placeholder="City"
                          className="h-10"
                        />
                        <Input
                          value={formData.addressPostal}
                          onChange={(e) => updateFormData('addressPostal', e.target.value)}
                          placeholder="Postal code"
                          className="h-10"
                        />
                      </div>
                      <Input
                        value={formData.addressRegion}
                        onChange={(e) => updateFormData('addressRegion', e.target.value)}
                        placeholder="State / Province / Region"
                        className="h-10"
                      />
                    </div>
                  </div>
                )}
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
