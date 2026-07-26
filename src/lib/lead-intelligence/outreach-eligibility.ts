import { normalizeDomain, normalizeEmail } from "./domain-normalization";

export type LeadStatus =
  | "discovered"
  | "researched"
  | "qualified"
  | "permission_required"
  | "opted_in"
  | "existing_customer"
  | "draft_ready"
  | "approved"
  | "sent"
  | "unsubscribed"
  | "do_not_contact";

export type ConsentEvent = {
  contactId?: string | null;
  consentType: "commercial_outreach" | "existing_customer_relationship" | string;
  status: "active" | "withdrawn" | "expired" | "revoked" | string;
  evidence?: unknown;
  expiresAt?: Date | string | null;
};

export type CommercialEmailDecisionInput = {
  contactId?: string;
  contactEmail: string;
  organizationDomain: string;
  leadStatus: LeadStatus;
  consentEvents: ConsentEvent[];
  suppressedEmails?: string[];
  suppressedDomains?: string[];
  now?: Date;
};

export type CommercialEmailDecision = {
  allowed: boolean;
  reason: string;
};

function hasEvidence(evidence: unknown): boolean {
  if (!evidence) return false;
  if (typeof evidence === "string") return evidence.trim().length > 0;
  if (Array.isArray(evidence)) return evidence.length > 0;
  if (typeof evidence === "object") return Object.keys(evidence).length > 0;
  return true;
}

export function canSendCommercialEmail(
  input: CommercialEmailDecisionInput,
): CommercialEmailDecision {
  const now = input.now ?? new Date();
  const contactEmail = normalizeEmail(input.contactEmail);
  const contactDomain = normalizeDomain(contactEmail.split("@")[1] ?? "");
  const organizationDomain = normalizeDomain(input.organizationDomain);
  const suppressedEmails = new Set((input.suppressedEmails ?? []).map(normalizeEmail));
  const suppressedDomains = new Set((input.suppressedDomains ?? []).map(normalizeDomain));

  if (suppressedEmails.has(contactEmail)) {
    return { allowed: false, reason: "Contact email is suppressed." };
  }
  if (suppressedDomains.has(contactDomain) || suppressedDomains.has(organizationDomain)) {
    return { allowed: false, reason: "Contact or organization domain is suppressed." };
  }
  if (input.leadStatus === "unsubscribed") {
    return { allowed: false, reason: "Lead is unsubscribed." };
  }
  if (input.leadStatus === "do_not_contact") {
    return { allowed: false, reason: "Lead is marked do not contact." };
  }

  const relevantEvents = input.consentEvents.filter((event) => {
    if (!input.contactId) return true;
    if (event.consentType === "commercial_outreach") {
      return event.contactId === input.contactId;
    }
    return event.contactId == null || event.contactId === input.contactId;
  });

  const withdrawn = relevantEvents.some(
    (event) =>
      (event.consentType === "commercial_outreach" ||
        event.consentType === "existing_customer_relationship") &&
      (event.status === "withdrawn" || event.status === "revoked"),
  );
  if (withdrawn) {
    return { allowed: false, reason: "Consent or customer outreach permission was withdrawn." };
  }

  const eligibleEvent = relevantEvents.find((event) => {
    const expiresAt = event.expiresAt ? new Date(event.expiresAt) : null;
    return (
      event.status === "active" &&
      (event.consentType === "commercial_outreach" ||
        event.consentType === "existing_customer_relationship") &&
      hasEvidence(event.evidence) &&
      (!expiresAt || expiresAt > now)
    );
  });

  if (!eligibleEvent) {
    return {
      allowed: false,
      reason:
        "No active commercial consent or qualifying existing-customer relationship with evidence.",
    };
  }

  return {
    allowed: true,
    reason:
      eligibleEvent.consentType === "existing_customer_relationship"
        ? "Qualifying existing-customer relationship is recorded with evidence."
        : "Active commercial outreach consent is recorded with evidence.",
  };
}
