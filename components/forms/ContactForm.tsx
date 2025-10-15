"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ContactFormProps {
  className?: string
}

export function ContactForm({ className }: ContactFormProps) {
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormState("loading")
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      company: formData.get("company") as string,
      message: formData.get("message") as string,
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors)
        }
        setFormState("error")
        return
      }

      setFormState("success")
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      setFormState("error")
      setErrors({ form: "An unexpected error occurred. Please try again." })
    }
  }

  if (formState === "success") {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-charcoal mb-2">Message sent!</h3>
        <p className="text-steel-600 mb-6">
          We'll get back to you within 24 hours.
        </p>
        <Button onClick={() => setFormState("idle")} variant="ghost">
          Send another message
        </Button>
      </Card>
    )
  }

  return (
    <Card className={cn("p-8", className)}>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className={cn(
              "w-full px-4 py-3 rounded-lg border bg-white transition-colors",
              errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-steel-300 focus:ring-primary focus:border-primary"
            )}
            aria-describedby={errors.name ? "name-error" : undefined}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
            Work Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className={cn(
              "w-full px-4 py-3 rounded-lg border bg-white transition-colors",
              errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-steel-300 focus:ring-primary focus:border-primary"
            )}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-charcoal mb-2">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            className="w-full px-4 py-3 rounded-lg border border-steel-300 bg-white focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-charcoal mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className={cn(
              "w-full px-4 py-3 rounded-lg border bg-white transition-colors resize-none",
              errors.message
                ? "border-red-500 focus:ring-red-500"
                : "border-steel-300 focus:ring-primary focus:border-primary"
            )}
            aria-describedby={errors.message ? "message-error" : undefined}
            aria-invalid={errors.message ? "true" : "false"}
          />
          {errors.message && (
            <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.message}
            </p>
          )}
        </div>

        {errors.form && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-sm text-red-600">{errors.form}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={formState === "loading"}
        >
          {formState === "loading" ? "Sending..." : "Send message"}
        </Button>
      </form>
    </Card>
  )
}
