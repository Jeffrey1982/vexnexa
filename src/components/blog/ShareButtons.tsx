'use client';

import { Button } from '@/components/ui/button';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-sm text-muted-foreground">Delen:</span>
      <Button
        variant="ghost"
        size="sm"
        className="text-sm h-8"
        onClick={() => {
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
            '_blank'
          );
        }}
      >
        Twitter
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-sm h-8"
        onClick={() => {
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            '_blank'
          );
        }}
      >
        LinkedIn
      </Button>
    </div>
  );
}
