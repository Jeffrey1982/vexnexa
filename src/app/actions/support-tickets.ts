'use server';

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { TicketCategory, TicketPriority, TicketStatus, MessageSenderType } from "@prisma/client";

export async function createTicket(data: {
  subject: string;
  category: TicketCategory;
  priority?: TicketPriority;
  initialMessage: string;
}) {
  const user = await requireAuth();

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      subject: data.subject,
      category: data.category,
      priority: data.priority || 'MEDIUM',
      status: 'OPEN',
      messages: {
        create: {
          senderType: 'USER',
          senderUserId: user.id,
          message: data.initialMessage,
        },
      },
    },
    include: {
      messages: true,
    },
  });

  revalidatePath('/dashboard/support');
  return { success: true, ticketId: ticket.id };
}

export async function addMessageToTicket(ticketId: string, message: string, senderType: 'USER' | 'ADMIN' = 'USER') {
  const user = await requireAuth();

  // Verify user owns this ticket or is admin
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // Check if user is admin
  const isAdmin = user.isAdmin || user.email === 'jeffrey.aay@gmail.com' || user.email === 'admin@vexnexa.com';

  if (ticket.userId !== user.id && !isAdmin) {
    throw new Error("Not authorized to access this ticket");
  }

  const newMessage = await prisma.supportTicketMessage.create({
    data: {
      ticketId,
      senderType: senderType === 'ADMIN' && isAdmin ? 'ADMIN' : 'USER',
      senderUserId: user.id,
      message,
    },
  });

  // Update ticket's updatedAt timestamp
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath('/admin-interface');
  return { success: true, message: newMessage };
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const user = await requireAuth();

  // Only admins can change status
  const isAdmin = user.isAdmin || user.email === 'jeffrey.aay@gmail.com' || user.email === 'admin@vexnexa.com';

  if (!isAdmin) {
    throw new Error("Not authorized to update ticket status");
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });

  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath('/admin-interface');
  return { success: true };
}

export async function updateTicketPriority(ticketId: string, priority: TicketPriority) {
  const user = await requireAuth();

  // Only admins can change priority
  const isAdmin = user.isAdmin || user.email === 'jeffrey.aay@gmail.com' || user.email === 'admin@vexnexa.com';

  if (!isAdmin) {
    throw new Error("Not authorized to update ticket priority");
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { priority },
  });

  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath('/admin-interface');
  return { success: true };
}
