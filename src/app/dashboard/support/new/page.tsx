'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { createTicket } from "@/app/actions/support-tickets";
import { TicketCategory, TicketPriority } from "@prisma/client";

export default function NewTicketPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'GENERAL' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    initialMessage: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.subject.trim()) {
        throw new Error('Subject is required');
      }
      if (!formData.initialMessage.trim()) {
        throw new Error('Message is required');
      }

      const result = await createTicket(formData);

      if (result.success) {
        router.push(`/dashboard/support/${result.ticketId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/support" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Support Ticket</h1>
          <p className="text-gray-600 mt-1">We&apos;ll get back to you as soon as possible</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
            <CardDescription>
              Provide as much detail as possible to help us assist you better
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">
                  {formData.subject.length}/200 characters
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as TicketCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General Question</SelectItem>
                    <SelectItem value="BILLING">Billing & Payments</SelectItem>
                    <SelectItem value="TECHNICAL">Technical Support</SelectItem>
                    <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                    <SelectItem value="BUG_REPORT">Bug Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low - General inquiry</SelectItem>
                    <SelectItem value="MEDIUM">Medium - Issue affecting work</SelectItem>
                    <SelectItem value="HIGH">High - Critical issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Please describe your issue in detail..."
                  value={formData.initialMessage}
                  onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
                  required
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  {formData.initialMessage.length} characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
                <Link href="/dashboard/support">
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
