'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMollieClient } from '@/lib/mollie';
import { sendAdminEmail } from '@/lib/email';
import { softDeleteUser } from '@/lib/soft-delete';
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
      subscriptionStatus: 'active',
      trialEndsAt: null
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

// Send email to user
export async function sendEmailToUser(userId: string, subject: string, message: string) {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true }
  });

  if (!user) throw new Error('User not found');

  try {
    // Get admin name for email signature
    const adminUser = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { firstName: true, lastName: true }
    });

    const adminName = adminUser?.firstName && adminUser?.lastName
      ? `${adminUser.firstName} ${adminUser.lastName}`
      : 'VexNexa Team';

    // Send email using Resend
    await sendAdminEmail({
      to: user.email,
      subject,
      message,
      adminName
    });

    // Log the event
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: admin.id,
        eventType: 'EMAIL_SENT',
        description: `Email sent: ${subject}`,
        metadata: { subject, preview: message.substring(0, 100) }
      }
    });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true, message: 'Email sent successfully!' };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
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

// Suspend/Ban user account
export async function suspendUser(userId: string, reason: string, duration?: 'temporary' | 'permanent') {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true }
  });

  if (!user) throw new Error('User not found');

  try {
    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'suspended'
      }
    });

    // Log admin event
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: admin.id,
        eventType: 'STATUS_CHANGE',
        description: `Account ${duration === 'permanent' ? 'banned' : 'suspended'}: ${reason}`,
        metadata: {
          previousStatus: 'active',
          newStatus: 'suspended',
          duration: duration || 'temporary',
          reason
        }
      }
    });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to suspend user:', error);
    throw new Error('Failed to suspend user');
  }
}

// Reactivate suspended user
export async function reactivateUser(userId: string, reason?: string) {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) throw new Error('User not found');

  try {
    // Update user status back to active
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'active'
      }
    });

    // Log admin event
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: admin.id,
        eventType: 'STATUS_CHANGE',
        description: `Account reactivated${reason ? `: ${reason}` : ''}`,
        metadata: {
          previousStatus: 'suspended',
          newStatus: 'active',
          reason: reason || 'Admin reactivation'
        }
      }
    });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to reactivate user:', error);
    throw new Error('Failed to reactivate user');
  }
}

// ============================================
// ADMIN: Update user settings (subscription, assurance, reporting)
// ============================================

export interface UpdateUserSettingsInput {
  // Subscription
  plan?: Plan;
  subscriptionStatus?: string;
  billingInterval?: string;
  trialEndsAt?: string | null;

  // Assurance
  hasAssurance?: boolean;
  assuranceTier?: 'BASIC' | 'PRO' | 'PUBLIC_SECTOR';

  // Reporting
  reportEmailEnabled?: boolean;
  reportEmailFrequency?: string;
  reportRecipientEmail?: string | null;
  reportFormat?: string;
  nextReportAt?: string | null;
}

const VALID_FREQUENCIES = ['weekly', 'biweekly', 'monthly'] as const;
const VALID_FORMATS = ['pdf', 'docx', 'both'] as const;
const VALID_STATUSES = ['active', 'canceled', 'past_due', 'inactive', 'trialing', 'suspended'] as const;
const VALID_INTERVALS = ['monthly', 'yearly'] as const;
const VALID_ASSURANCE_TIERS = ['BASIC', 'PRO', 'PUBLIC_SECTOR'] as const;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function updateUserSettings(userId: string, input: UpdateUserSettingsInput) {
  const admin = await requireAdmin();

  // ── Validation ──────────────────────────────────────
  if (input.subscriptionStatus && !(VALID_STATUSES as readonly string[]).includes(input.subscriptionStatus)) {
    throw new Error(`Invalid subscription status: ${input.subscriptionStatus}`);
  }
  if (input.billingInterval && !(VALID_INTERVALS as readonly string[]).includes(input.billingInterval)) {
    throw new Error(`Invalid billing interval: ${input.billingInterval}`);
  }
  if (input.reportEmailFrequency && !(VALID_FREQUENCIES as readonly string[]).includes(input.reportEmailFrequency)) {
    throw new Error(`Invalid report frequency: ${input.reportEmailFrequency}`);
  }
  if (input.reportFormat && !(VALID_FORMATS as readonly string[]).includes(input.reportFormat)) {
    throw new Error(`Invalid report format: ${input.reportFormat}`);
  }
  if (input.reportRecipientEmail && !isValidEmail(input.reportRecipientEmail)) {
    throw new Error('Invalid report recipient email address');
  }
  if (input.assuranceTier && !(VALID_ASSURANCE_TIERS as readonly string[]).includes(input.assuranceTier)) {
    throw new Error(`Invalid assurance tier: ${input.assuranceTier}`);
  }

  // If report email is enabled, ensure there is a valid destination
  if (input.reportEmailEnabled) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, reportRecipientEmail: true } });
    if (!user) throw new Error('User not found');
    const recipientEmail = input.reportRecipientEmail !== undefined ? input.reportRecipientEmail : user.reportRecipientEmail;
    if (!recipientEmail && !user.email) {
      throw new Error('Cannot enable report emails: no recipient email and no account email');
    }
  }

  // ── Fetch current state for audit log ──────────────
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      billingInterval: true,
      trialEndsAt: true,
      hasAssurance: true,
      reportEmailEnabled: true,
      reportEmailFrequency: true,
      reportRecipientEmail: true,
      reportFormat: true,
      nextReportAt: true,
    },
  });

  if (!currentUser) throw new Error('User not found');

  // ── Build update payload ───────────────────────────
  const data: Record<string, unknown> = {};
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  if (input.plan !== undefined && input.plan !== currentUser.plan) {
    data.plan = input.plan;
    changes.plan = { old: currentUser.plan, new: input.plan };
    // Auto-set subscription status for TRIAL
    if (input.plan === 'TRIAL' && !input.subscriptionStatus) {
      data.subscriptionStatus = 'trialing';
    }
  }
  if (input.subscriptionStatus !== undefined && input.subscriptionStatus !== currentUser.subscriptionStatus) {
    data.subscriptionStatus = input.subscriptionStatus;
    changes.subscriptionStatus = { old: currentUser.subscriptionStatus, new: input.subscriptionStatus };
  }
  if (input.billingInterval !== undefined && input.billingInterval !== currentUser.billingInterval) {
    data.billingInterval = input.billingInterval;
    changes.billingInterval = { old: currentUser.billingInterval, new: input.billingInterval };
  }
  if (input.trialEndsAt !== undefined) {
    const newVal = input.trialEndsAt ? new Date(input.trialEndsAt) : null;
    data.trialEndsAt = newVal;
    changes.trialEndsAt = { old: currentUser.trialEndsAt, new: newVal };
  }

  // Assurance
  if (input.hasAssurance !== undefined && input.hasAssurance !== currentUser.hasAssurance) {
    data.hasAssurance = input.hasAssurance;
    changes.hasAssurance = { old: currentUser.hasAssurance, new: input.hasAssurance };
  }

  // Reporting
  if (input.reportEmailEnabled !== undefined && input.reportEmailEnabled !== currentUser.reportEmailEnabled) {
    data.reportEmailEnabled = input.reportEmailEnabled;
    changes.reportEmailEnabled = { old: currentUser.reportEmailEnabled, new: input.reportEmailEnabled };
  }
  if (input.reportEmailFrequency !== undefined && input.reportEmailFrequency !== currentUser.reportEmailFrequency) {
    data.reportEmailFrequency = input.reportEmailFrequency;
    changes.reportEmailFrequency = { old: currentUser.reportEmailFrequency, new: input.reportEmailFrequency };
  }
  if (input.reportRecipientEmail !== undefined) {
    const newEmail = input.reportRecipientEmail || null;
    if (newEmail !== currentUser.reportRecipientEmail) {
      data.reportRecipientEmail = newEmail;
      changes.reportRecipientEmail = { old: currentUser.reportRecipientEmail, new: newEmail };
    }
  }
  if (input.reportFormat !== undefined && input.reportFormat !== currentUser.reportFormat) {
    data.reportFormat = input.reportFormat;
    changes.reportFormat = { old: currentUser.reportFormat, new: input.reportFormat };
  }
  if (input.nextReportAt !== undefined) {
    const newVal = input.nextReportAt ? new Date(input.nextReportAt) : null;
    data.nextReportAt = newVal;
    changes.nextReportAt = { old: currentUser.nextReportAt, new: newVal };
  }

  // Nothing changed
  if (Object.keys(data).length === 0) {
    return { success: true, changed: false };
  }

  // ── Persist ────────────────────────────────────────
  await prisma.user.update({ where: { id: userId }, data });

  // Handle assurance subscription if tier changed
  if (input.assuranceTier && input.hasAssurance) {
    const existingSub = await prisma.assuranceSubscription.findFirst({
      where: { userId, status: 'active' },
    });

    if (existingSub) {
      await prisma.assuranceSubscription.update({
        where: { id: existingSub.id },
        data: { tier: input.assuranceTier },
      });
      changes.assuranceTier = { old: existingSub.tier, new: input.assuranceTier };
    }
    // If no existing subscription and assurance was just enabled, we note it
    // but don't auto-create a paid subscription (that requires Mollie checkout)
  }

  // ── Audit log ──────────────────────────────────────
  const changeDesc = Object.entries(changes)
    .map(([k, v]) => `${k}: ${String(v.old)} → ${String(v.new)}`)
    .join(', ');

  await prisma.userAdminEvent.create({
    data: {
      userId,
      adminId: admin.id,
      eventType: 'STATUS_CHANGE',
      description: `Admin updated user settings: ${changeDesc}`,
      metadata: JSON.parse(JSON.stringify({ changes })),
    },
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true, changed: true, changes };
}

// Delete user account with cascade
export async function deleteUser(userId: string, reason: string) {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      mollieCustomerId: true,
      mollieSubscriptionId: true
    }
  });

  if (!user) throw new Error('User not found');

  try {
    // Cancel Mollie subscription if exists
    if (user.mollieCustomerId && user.mollieSubscriptionId) {
      try {
        const mollie = getMollieClient();
        await mollie.customerSubscriptions.cancel(
          user.mollieSubscriptionId,
          { customerId: user.mollieCustomerId }
        );
      } catch (error) {
        console.error('Failed to cancel Mollie subscription during deletion:', error);
        // Continue with deletion even if Mollie cancellation fails
      }
    }

    // Log the deletion event BEFORE deleting (so we can still reference the user)
    await prisma.userAdminEvent.create({
      data: {
        userId,
        adminId: admin.id,
        eventType: 'STATUS_CHANGE',
        description: `User account deleted: ${reason}`,
        metadata: {
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          deletedBy: admin.email,
          reason
        }
      }
    });

    // Soft delete user (sets deletedAt timestamp, recoverable for 30 days)
    await softDeleteUser(userId, { deletedBy: admin.id });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw new Error('Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}
