'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send } from "lucide-react";
import { addMessageToTicket } from "@/app/actions/support-tickets";

export function AdminReplyForm({ ticketId }: { ticketId: string }) {
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

      await addMessageToTicket(ticketId, message, 'ADMIN');
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
        <CardTitle>Reply as Admin</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Type your admin response here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="resize-none"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={isSubmitting || !message.trim()} className="bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Admin Reply
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
