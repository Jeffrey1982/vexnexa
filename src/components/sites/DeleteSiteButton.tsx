'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteSiteButtonProps {
  siteId: string;
  siteName: string;
}

export function DeleteSiteButton({ siteId, siteName }: DeleteSiteButtonProps) {
  const [confirming, setConfirming] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/sites/${siteId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete site');
        setConfirming(false);
      }
    } catch {
      alert('Network error — please try again');
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div
        className="flex items-center gap-2"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <span className="text-xs text-destructive font-medium whitespace-nowrap">
          Delete {siteName}?
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1 rounded-lg bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Yes
        </button>
        <button
          onClick={handleCancel}
          disabled={deleting}
          className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      title="Delete site"
      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
