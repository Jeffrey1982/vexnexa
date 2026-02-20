'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Copy,
  Download,
  Loader2,
  Tag,
  Ticket,
  RefreshCw,
  Trash2,
  Eye,
  Power,
  PowerOff,
  Shuffle,
  Calendar,
  Users,
  Gift,
} from 'lucide-react';

// ── Types ──

interface Coupon {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  grantType: string;
  grantValue: string;
  maxRedemptions: number | null;
  redeemedCount: number;
  perUserLimit: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: { redemptions: number };
  redemptions?: Redemption[];
}

interface Redemption {
  id: string;
  couponId: string;
  userId: string;
  metadata: Record<string, unknown> | null;
  redeemedAt: string;
}

// ── Constants ──

const GRANT_TYPE_LABELS: Record<string, string> = {
  PLAN_TRIAL: 'Plan: Trial',
  PLAN_STARTER: 'Plan: Starter',
  PLAN_PRO: 'Plan: Pro',
  PLAN_BUSINESS: 'Plan: Business',
  FREE_SCANS: 'Free Scans',
};

const GRANT_TYPE_COLORS: Record<string, string> = {
  PLAN_TRIAL: 'border-gray-500 text-gray-600 dark:text-gray-400',
  PLAN_STARTER: 'border-blue-500 text-blue-600 dark:text-blue-400',
  PLAN_PRO: 'border-purple-500 text-purple-600 dark:text-purple-400',
  PLAN_BUSINESS: 'border-orange-500 text-orange-600 dark:text-orange-400',
  FREE_SCANS: 'border-green-500 text-green-600 dark:text-green-400',
};

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getCouponStatus(coupon: Coupon): { label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' } {
  if (!coupon.isActive) return { label: 'Disabled', variant: 'destructive' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { label: 'Expired', variant: 'secondary' };
  if (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions) return { label: 'Exhausted', variant: 'secondary' };
  return { label: 'Active', variant: 'default' };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Main Page ──

export default function AdminCouponsPage() {
  const { toast } = useToast();

  // State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);

  // Detail drawer
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Fetch coupons ──
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/coupons?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons);
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to load coupons',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // ── Open detail drawer ──
  const openDetail = async (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCoupon(data.coupon);
      }
    } catch {
      // Use existing data
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Toggle active ──
  const toggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({
        title: coupon.isActive ? 'Coupon disabled' : 'Coupon enabled',
        description: `Code: ${coupon.code}`,
      });
      fetchCoupons();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to update coupon',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // ── Delete coupon ──
  const deleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: 'Coupon deleted', description: `Code: ${coupon.code}` });
      setDetailOpen(false);
      fetchCoupons();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete coupon',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // ── Copy code ──
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: `Code "${code}" copied to clipboard` });
  };

  // ── Export CSV ──
  const exportCSV = () => {
    if (coupons.length === 0) return;
    const header = ['Code', 'Name', 'Grant Type', 'Grant Value', 'Status', 'Redeemed', 'Max', 'Expires', 'Created'];
    const rows = coupons.map((c) => [
      c.code,
      c.name || '',
      GRANT_TYPE_LABELS[c.grantType] || c.grantType,
      c.grantValue,
      getCouponStatus(c).label,
      String(c.redeemedCount),
      c.maxRedemptions !== null ? String(c.maxRedemptions) : 'Unlimited',
      c.expiresAt ? new Date(c.expiresAt).toISOString() : 'Never',
      new Date(c.createdAt).toISOString(),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupons-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${coupons.length} coupons exported to CSV` });
  };

  // ── Copy promo template ──
  const copyPromoTemplate = (coupon: Coupon) => {
    const template = `🎉 Special Offer!\n\nUse code ${coupon.code} to get ${GRANT_TYPE_LABELS[coupon.grantType] || coupon.grantType}${coupon.expiresAt ? ` — valid until ${formatDate(coupon.expiresAt)}` : ''}.\n\nRedeem at: ${typeof window !== 'undefined' ? window.location.origin : ''}/redeem?code=${coupon.code}`;
    navigator.clipboard.writeText(template);
    toast({ title: 'Copied!', description: 'Promo message template copied to clipboard' });
  };

  // ── Stats ──
  const activeCoupons = coupons.filter((c) => getCouponStatus(c).label === 'Active').length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.redeemedCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coupons & Promo Codes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage promotional codes that grant plan access or free scans.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={coupons.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{coupons.length}</p>
                <p className="text-xs text-muted-foreground">Total Coupons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                <Power className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeCoupons}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalRedemptions}</p>
                <p className="text-xs text-muted-foreground">Total Redemptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired / Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchCoupons} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Coupons
          </CardTitle>
          <CardDescription>
            {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No coupons found</p>
              <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first coupon
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Grant</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Redeemed</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <tr
                        key={coupon.id}
                        className="hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                              {coupon.code}
                            </code>
                            <button
                              onClick={() => copyCode(coupon.code)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Copy code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {coupon.name && (
                            <p className="text-xs text-muted-foreground mt-0.5">{coupon.name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={GRANT_TYPE_COLORS[coupon.grantType] || ''}>
                            {GRANT_TYPE_LABELS[coupon.grantType] || coupon.grantType}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-2">{coupon.grantValue}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {coupon.redeemedCount}
                          {coupon.maxRedemptions !== null ? ` / ${coupon.maxRedemptions}` : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(coupon.expiresAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(coupon.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDetail(coupon)}
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleActive(coupon)}
                              title={coupon.isActive ? 'Disable' : 'Enable'}
                            >
                              {coupon.isActive ? (
                                <PowerOff className="w-4 h-4 text-red-500" />
                              ) : (
                                <Power className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => deleteCoupon(coupon)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Coupon Dialog */}
      <CreateCouponDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          fetchCoupons();
          setCreateOpen(false);
        }}
      />

      {/* Detail Drawer */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedCoupon && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <code className="text-lg font-mono bg-muted px-2 py-0.5 rounded">
                    {selectedCoupon.code}
                  </code>
                  <Badge variant={getCouponStatus(selectedCoupon).variant}>
                    {getCouponStatus(selectedCoupon).label}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  {selectedCoupon.name || 'Unnamed coupon'}{' '}
                  {selectedCoupon.description && `— ${selectedCoupon.description}`}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Grant Type</p>
                    <Badge variant="outline" className={`mt-1 ${GRANT_TYPE_COLORS[selectedCoupon.grantType] || ''}`}>
                      {GRANT_TYPE_LABELS[selectedCoupon.grantType] || selectedCoupon.grantType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Grant Value</p>
                    <p className="font-medium text-foreground mt-1">{selectedCoupon.grantValue}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Redemptions</p>
                    <p className="font-medium text-foreground mt-1">
                      {selectedCoupon.redeemedCount}
                      {selectedCoupon.maxRedemptions !== null ? ` / ${selectedCoupon.maxRedemptions}` : ' (unlimited)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Per-User Limit</p>
                    <p className="font-medium text-foreground mt-1">{selectedCoupon.perUserLimit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Starts</p>
                    <p className="font-medium text-foreground mt-1">{formatDateTime(selectedCoupon.startsAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p className="font-medium text-foreground mt-1">{formatDateTime(selectedCoupon.expiresAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium text-foreground mt-1">{formatDateTime(selectedCoupon.createdAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyCode(selectedCoupon.code)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyPromoTemplate(selectedCoupon)}>
                    <Tag className="w-4 h-4 mr-2" />
                    Copy Promo Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(selectedCoupon)}
                  >
                    {selectedCoupon.isActive ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-2" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-2" />
                        Enable
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCoupon(selectedCoupon)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>

                {/* Redemption History */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Recent Redemptions
                  </h3>
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : selectedCoupon.redemptions && selectedCoupon.redemptions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCoupon.redemptions.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {(r.metadata as Record<string, string>)?.userEmail || r.userId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(r.metadata as Record<string, string>)?.grantDescription || ''}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(r.redeemedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No redemptions yet
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Create Coupon Dialog ──

interface CreateCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateCouponDialog({ open, onOpenChange, onSuccess }: CreateCouponDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [grantType, setGrantType] = useState('');
  const [grantValue, setGrantValue] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Reset on open
  useEffect(() => {
    if (open) {
      setCode('');
      setName('');
      setDescription('');
      setGrantType('');
      setGrantValue('');
      setMaxRedemptions('');
      setPerUserLimit('1');
      setExpiresAt('');
      setIsActive(true);
    }
  }, [open]);

  // Auto-set grantValue based on grantType
  useEffect(() => {
    if (grantType === 'PLAN_TRIAL') setGrantValue('14');
    else if (grantType === 'FREE_SCANS') setGrantValue('5');
    else if (grantType.startsWith('PLAN_')) setGrantValue(grantType.replace('PLAN_', ''));
  }, [grantType]);

  const handleGenerate = () => {
    setCode(generateRandomCode());
  };

  const handleSubmit = async () => {
    if (!grantType) {
      toast({ variant: 'destructive', title: 'Select a grant type' });
      return;
    }
    if (!grantValue) {
      toast({ variant: 'destructive', title: 'Grant value is required' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code || undefined,
          generateCodeFlag: !code,
          name: name || undefined,
          description: description || undefined,
          grantType,
          grantValue,
          maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : null,
          perUserLimit: parseInt(perUserLimit, 10) || 1,
          expiresAt: expiresAt || null,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create coupon');

      toast({
        title: 'Coupon created!',
        description: `Code: ${data.coupon.code}`,
      });
      onSuccess();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to create coupon',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Create Coupon
          </DialogTitle>
          <DialogDescription>
            Create a new promotional code that grants plan access or free scans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="coupon-code">Promo Code</Label>
            <div className="flex gap-2">
              <Input
                id="coupon-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Leave empty to auto-generate"
                className="font-mono uppercase"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleGenerate} title="Generate random code">
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Name + Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-name">Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="coupon-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Launch Promo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="coupon-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Internal note"
              />
            </div>
          </div>

          {/* Grant Type */}
          <div className="space-y-2">
            <Label>Grant Type</Label>
            <Select value={grantType} onValueChange={setGrantType}>
              <SelectTrigger>
                <SelectValue placeholder="What does this coupon grant?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLAN_TRIAL">Plan: Trial (extended)</SelectItem>
                <SelectItem value="PLAN_STARTER">Plan: Starter</SelectItem>
                <SelectItem value="PLAN_PRO">Plan: Pro</SelectItem>
                <SelectItem value="PLAN_BUSINESS">Plan: Business</SelectItem>
                <SelectItem value="FREE_SCANS">Free Scan Credits</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grant Value */}
          <div className="space-y-2">
            <Label htmlFor="grant-value">
              {grantType === 'PLAN_TRIAL' ? 'Trial Days' : grantType === 'FREE_SCANS' ? 'Number of Scans' : 'Grant Value'}
            </Label>
            <Input
              id="grant-value"
              value={grantValue}
              onChange={(e) => setGrantValue(e.target.value)}
              placeholder={grantType === 'PLAN_TRIAL' ? '14' : grantType === 'FREE_SCANS' ? '5' : 'Value'}
            />
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-redemptions">
                Max Redemptions <span className="text-muted-foreground">(empty = unlimited)</span>
              </Label>
              <Input
                id="max-redemptions"
                type="number"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                placeholder="Unlimited"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="per-user-limit">Per-User Limit</Label>
              <Input
                id="per-user-limit"
                type="number"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                min={1}
              />
            </div>
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label htmlFor="expires-at" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Expiry Date <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="expires-at"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is-active">Active</Label>
              <p className="text-xs text-muted-foreground">Coupon can be redeemed immediately</p>
            </div>
            <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !grantType}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Coupon
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
