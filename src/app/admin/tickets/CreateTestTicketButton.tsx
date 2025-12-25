'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateTestTicketDialog } from '@/components/admin/CreateTestTicketDialog';

/**
 * CreateTestTicketButton - Client component wrapper for the create ticket dialog
 */
export function CreateTestTicketButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Create Ticket
      </Button>
      <CreateTestTicketDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
