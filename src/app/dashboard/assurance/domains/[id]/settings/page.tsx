'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function DomainSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');

  const [formData, setFormData] = useState({
    label: '',
    scanFrequency: 'WEEKLY',
    scoreThreshold: 90,
    language: 'en',
    active: true,
  });

  useEffect(() => {
    fetchDomain();
  }, []);

  const fetchDomain = async () => {
    try {
      const response = await fetch(`/api/assurance/domains/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch domain');

      const data = await response.json();
      setFormData({
        label: data.label || '',
        scanFrequency: data.scanFrequency,
        scoreThreshold: data.scoreThreshold,
        language: data.language,
        active: data.active,
      });
      setEmailRecipients(data.emailRecipients || []);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load domain');
      setIsLoading(false);
    }
  };

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
      const response = await fetch(`/api/assurance/domains/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          emailRecipients,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update domain');
      }

      router.push(`/dashboard/assurance/domains/${params.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/assurance/domains/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete domain');
      }

      router.push('/dashboard/assurance/domains');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/assurance/domains/${params.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Domain
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Domain Settings</h2>
        <p className="text-muted-foreground">
          Configure monitoring schedule, thresholds, and notifications
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Update domain monitoring settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Monitoring</Label>
                <div className="text-sm text-muted-foreground">
                  Enable or disable automated scanning for this domain
                </div>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="My Website"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>

            {/* Scan Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Scan Frequency</Label>
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
            </div>

            {/* Score Threshold */}
            <div className="space-y-2">
              <Label htmlFor="threshold">Score Threshold</Label>
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
                Minimum acceptable score (60-100)
              </p>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Report Language</Label>
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href={`/dashboard/assurance/domains/${params.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="deleteConfirm" className="text-red-700">
              Type DELETE to confirm domain removal
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="deleteConfirm"
                placeholder="DELETE"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteConfirm !== 'DELETE' || isSubmitting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Domain
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This will permanently delete all scans, reports, and alerts for this domain.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
