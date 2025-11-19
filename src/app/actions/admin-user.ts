'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMollieClient } from '@/lib/mollie';
import type { Plan, TicketCategory, TicketPriority } from '@prisma/client';

// Admin check helper
async function requireAdmin() {
  const user = await requireAuth();
  const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];

  if (!adminEmails.includes(user.email) && !user.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  return user;
}

// Change user plan
export async function changeUserPlan(userId: string, newPlan: Plan) {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, email: true }
  });

  if (!user) throw new Error('User not found');

  const oldPlan = user.plan;

  // Update user plan
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: newPlan,
      subscriptionStatus: newPlan === 'TRIAL' ? 'trialing' : 'active',
      trialEndsAt: newPlan === 'TRIAL' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null
    }
  });

  // Log event
  await prisma.userAdminEvent.create({
    data: {
      userId,
      adminId: admin.id,
      eventType: 'PLAN_CHANGE',
      description: `Plan changed from ${oldPlan} to ${newPlan}`,
      metadata: { oldPlan, newPlan }
    }
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

// Change subscription status
export async function changeUserStatus(userId: string, status: string) {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true }
  });

  if (!user) throw new Error('User not found');

  const oldStatus = user.subscriptionStatus;

  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionStatus: status }
  });

  await prisma.userAdminEvent.create({
    data: {
      userId,
      adminId: admin.id,
      eventType: 'STATUS_CHANGE',
      description: `Status changed from ${oldStatus} to ${status}`,
      metadata: { oldStatus, newStatus: status }
    }
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

// Add admin note
export async function addAdminNote(userId: string, note: string) {
  const admin = await requireAdmin();

  await prisma.adminUserNote.create({
    data: {
      userId,
      adminId: admin.id,
      note
    }
  });

  await prisma.userAdminEvent.create({
    data: {
      userId,
      adminId: admin.id,
      eventType: 'NOTE_ADDED',
      description: 'Admin added a note'
    }
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

// Create ticket on behalf of user
export async function createTicketForUser(
  userId: string,
  subject: string,
  message: string,
  category: TicketCategory,
  priority: TicketPriority
) {
  const admin = await requireAdmin();

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject,
      category,
      priority,
      status: 'OPEN',
      messages: {
        create: {
          senderType: 'ADMIN',
          senderUserId: admin.id,
          message: `[Created by admin on behalf of user]\n\n${message}`
        }
      }
    }
  });

  await prisma.userAdminEvent.create({
    data: {
      userId,
      adminId: admin.id,
      eventType: 'TICKET_CREATED',
      description: `Admin created ticket: ${subject}`,
      metadata: { ticketId: ticket.id, subject }
    }
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true, ticketId: ticket.id };
}

// Convert contact message to ticket
export async function convertContactToTicket(contactId: string) {
  const admin = await requireAdmin();

  const contact = await prisma.contactMessage.findUnique({
    where: { id: contactId }
  });

  if (!contact) throw new Error('Contact message not found');

  // Find or create user by email
  let user = await prisma.user.findUnique({
    where: { email: contact.email }
  });

  if (!user) {
    // Create new user from contact
    user = await prisma.user.create({
      data: {
        email: contact.email,
        firstName: contact.name.split(' ')[0],
        lastName: contact.name.split(' ').slice(1).join(' ') || undefined,
        plan: 'TRIAL',
        subscriptionStatus: 'inactive'
      }
    });
  }

  // Create ticket
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      subject: `Contact Form: ${contact.message.substring(0, 50)}...`,
      category: 'GENERAL',
      priority: 'MEDIUM',
      status: 'OPEN',
      messages: {
        create: {
          senderType: 'USER',
          senderUserId: user.id,
          message: contact.message
        }
      }
    }
  });

  // Mark contact as replied
  await prisma.contactMessage.update({
    where: { id: contactId },
    data: { status: 'replied', replied: true }
  });

  await prisma.userAdminEvent.create({
    data: {
      userId: user.id,
      adminId: admin.id,
      eventType: 'CONTACT_CONVERTED',
      description: 'Contact message converted to ticket',
      metadata: { contactId, ticketId: ticket.id }
    }
  });

  revalidatePath(`/admin/users/${user.id}`);
  return { success: true, ticketId: ticket.id, userId: user.id };
}

// Fetch Mollie payment history
export async function fetchMolliePayments(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mollieCustomerId: true }
  });

  if (!user?.mollieCustomerId) {
    return { payments: [] };
  }

  try {
    const mollie = getMollieClient();
    const payments = await mollie.customerPayments.page({ customerId: user.mollieCustomerId });

    return {
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        description: p.description,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        method: p.method
      }))
    };
  } catch (error) {
    console.error('Failed to fetch Mollie payments:', error);
    return { payments: [], error: 'Failed to fetch payment history' };
  }
}

// Send email to user (placeholder - implement with your email service)
export async function sendEmailToUser(userId: string, subject: string, message: string) {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) throw new Error('User not found');

  // TODO: Implement email sending with Resend or your email service
  console.log('Send email to:', user.email, 'Subject:', subject, 'Message:', message);

  await prisma.userAdminEvent.create({
    data: {
      userId,
      adminId: admin.id,
      eventType: 'EMAIL_SENT',
      description: `Email sent: ${subject}`,
      metadata: { subject }
    }
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true, message: 'Email sending not yet implemented. Event logged.' };
}

// Fetch Mollie subscription details
export async function fetchMollieSubscription(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mollieCustomerId: true, mollieSubscriptionId: true }
  });

  if (!user?.mollieCustomerId || !user?.mollieSubscriptionId) {
    return { subscription: null };
  }

  try {
    const mollie = getMollieClient();
    const subscription = await mollie.customerSubscriptions.get(
      user.mollieSubscriptionId,
      { customerId: user.mollieCustomerId }
    );

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        amount: subscription.amount,
        description: subscription.description,
        method: subscription.method,
        interval: subscription.interval,
        startDate: subscription.startDate,
        nextPaymentDate: subscription.nextPaymentDate,
        canceledAt: subscription.canceledAt,
        createdAt: subscription.createdAt
      }
    };
  } catch (error) {
    console.error('Failed to fetch Mollie subscription:', error);
    return { subscription: null, error: 'Failed to fetch subscription details' };
  }
}

// Cancel Mollie subscription
export async function cancelMollieSubscription(userId: string, reason?: string) {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mollieCustomerId: true,
      mollieSubscriptionId: true,
      email: true,
      plan: true
    }
  });

  if (!user?.mollieCustomerId || !user?.mollieSubscriptionId) {
    throw new Error('No active Mollie subscription found');
  }

  try {
    const mollie = getMollieClient();

    // Cancel the subscription in Mollie
    await mollie.customerSubscriptions.cancel(
      user.mollieSubscriptionId,
      { customerId: user.mollieCustomerId }
    );

    // Update user status in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'canceled',
        mollieSubscriptionId: null // Clear the subscription ID
      }
    });

    // Log admin event
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: admin.id,
        eventType: 'STATUS_CHANGE',
        description: `Subscription canceled${reason ? `: ${reason}` : ''}`,
        metadata: {
          oldSubscriptionId: user.mollieSubscriptionId,
          reason: reason || 'Admin cancellation'
        }
      }
    });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel Mollie subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

// Process refund for a payment
export async function processMollieRefund(
  userId: string,
  paymentId: string,
  amount: { value: string; currency: string },
  description?: string
) {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) throw new Error('User not found');

  try {
    const mollie = getMollieClient();

    // Create refund
    const refund = await mollie.paymentRefunds.create({
      paymentId,
      amount,
      description: description || 'Refund processed by admin'
    });

    // Log admin event
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: admin.id,
        eventType: 'PAYMENT_REFUND',
        description: `Refund processed: ${amount.currency} ${amount.value}`,
        metadata: {
          paymentId,
          refundId: refund.id,
          amount: amount,
          description: description || ''
        }
      }
    });

    revalidatePath(`/admin/users/${userId}`);
    return {
      success: true,
      refund: {
        id: refund.id,
        amount: amount,
        status: refund.status
      }
    };
  } catch (error) {
    console.error('Failed to process refund:', error);
    throw new Error('Failed to process refund: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}
