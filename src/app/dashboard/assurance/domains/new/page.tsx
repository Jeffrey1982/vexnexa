'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function NewDomainPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');

  const [formData, setFormData] = useState({
    domain: '',
    label: '',
    scanFrequency: 'WEEKLY',
    scoreThreshold: 90,
    language: 'en',
  });

  const handleAddEmail = () => {
    if (!currentEmail) return;
    if (emailRecipients.length >= 5) {
      setError('Maximum 5 email recipients allowed');
      return;
    }
    if (!currentEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (emailRecipients.includes(currentEmail)) {
      setError('Email already added');
      return;
    }
    setEmailRecipients([...emailRecipients, currentEmail]);
    setCurrentEmail('');
    setError('');
  };

  const handleRemoveEmail = (email: string) => {
    setEmailRecipients(emailRecipients.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/assurance/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          emailRecipients,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add domain');
      }

      router.push('/dashboard/assurance/domains');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/assurance/domains"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Domains
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Add Domain</h2>
        <p className="text-muted-foreground">
          Configure automated accessibility monitoring for a new domain
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Domain Configuration</CardTitle>
            <CardDescription>
              Set up monitoring schedule, thresholds, and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Domain URL */}
            <div className="space-y-2">
              <Label htmlFor="domain">Domain URL *</Label>
              <Input
                id="domain"
                type="url"
                placeholder="https://example.com"
                required
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The full URL of the website to monitor
              </p>
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                placeholder="My Website"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Friendly name for this domain
              </p>
            </div>

            {/* Scan Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Scan Frequency *</Label>
              <Select
                value={formData.scanFrequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, scanFrequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often to run automated scans
              </p>
            </div>

            {/* Score Threshold */}
            <div className="space-y-2">
              <Label htmlFor="threshold">Score Threshold *</Label>
              <Input
                id="threshold"
                type="number"
                min="60"
                max="100"
                required
                value={formData.scoreThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, scoreThreshold: parseInt(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Minimum acceptable score (60-100). Alerts triggered when score drops below this.
              </p>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Report Language *</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Language for reports and emails
              </p>
            </div>

            {/* Email Recipients */}
            <div className="space-y-2">
              <Label>Email Recipients (max 5)</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddEmail}
                  disabled={emailRecipients.length >= 5}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {emailRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {emailRecipients.map((email) => (
                    <div
                      key={email}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:text-teal-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Recipients will receive automated reports and alerts
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isSubmitting ? 'Adding...' : 'Add Domain'}
              </Button>
              <Link href="/dashboard/assurance/domains">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
