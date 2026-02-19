'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send } from "lucide-react";
import { addMessageToTicket } from "@/app/actions/support-tickets";

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!message.trim()) {
        throw new Error('Message cannot be empty');
      }

      await addMessageToTicket(ticketId, message, 'USER');
      setMessage('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reply to Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <div aria-live="assertive" aria-atomic="true">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Type your reply here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="resize-none"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={isSubmitting || !message.trim()}>
            {isSubmitting ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Reply
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
