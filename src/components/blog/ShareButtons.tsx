'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  return (
    <section className="py-8 border-t">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Deel dit artikel</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
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
                variant="outline"
                size="sm"
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
          </div>
        </div>
      </div>
    </section>
  );
}
