import { createHmac, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendLeadNurtureEmail } from "@/lib/email";
import { hashConsentToken } from "./consent-tokens";
import { buildNurtureMessage, selectDueNurtureStep } from "./nurture";

function issueCount(scan: any): number {
  return (scan?.critical_issues ?? 0) + (scan?.serious_issues ?? 0) +
    (scan?.moderate_issues ?? 0) + (scan?.minor_issues ?? 0);
}

function nurtureUnsubscribeToken(deliveryId: string): string {
  const secret = process.env.CRON_SECRET ?? process.env.CRON_TOKEN;
  if (!secret) throw new Error("Cron secret is required for nurture unsubscribe tokens");
  return createHmac("sha256", secret).update(`lead-nurture:${deliveryId}`).digest("base64url");
}

export async function runLeadNurtureBatch({ limit = 25 }: { limit?: number } = {}) {
  const staleBefore = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from("lead_nurture_deliveries")
    .update({ status: "failed", error_message: "stale reservation recovered", updated_at: new Date().toISOString() })
    .eq("status", "reserved")
    .lt("reserved_at", staleBefore);

  const { data: consents, error: consentError } = await supabaseAdmin
    .from("consent_events")
    .select("id, workspace_id, organization_id, contact_id, occurred_at, evidence")
    .eq("consent_type", "commercial_outreach")
    .eq("status", "active")
    .not("contact_id", "is", null)
    .order("occurred_at", { ascending: true })
    .limit(limit * 3);
  if (consentError) throw consentError;

  const results: Array<{ contactId: string; status: string; step?: number }> = [];
  for (const consent of consents ?? []) {
    if (results.length >= limit) break;
    const [contactResult, leadResult, orgResult, scanResult, deliveriesResult] = await Promise.all([
      supabaseAdmin.from("contacts").select("id, email").eq("id", consent.contact_id).single(),
      supabaseAdmin.from("leads").select("id, status").eq("workspace_id", consent.workspace_id).eq("organization_id", consent.organization_id).single(),
      supabaseAdmin.from("organizations").select("normalized_domain").eq("id", consent.organization_id).single(),
      supabaseAdmin.from("website_scans").select("accessibility_score, critical_issues, serious_issues, moderate_issues, minor_issues").eq("workspace_id", consent.workspace_id).eq("organization_id", consent.organization_id).eq("status", "completed").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from("lead_nurture_deliveries").select("sequence_step, status").eq("workspace_id", consent.workspace_id).eq("contact_id", consent.contact_id),
    ]);
    const failed = [contactResult, leadResult, orgResult, scanResult, deliveriesResult].find((item) => item.error);
    if (failed?.error) {
      results.push({ contactId: consent.contact_id, status: "lookup_failed" });
      continue;
    }
    const contact = contactResult.data;
    const lead = leadResult.data;
    const organization = orgResult.data;
    if (!contact || !lead || !organization) {
      results.push({ contactId: consent.contact_id, status: "lookup_failed" });
      continue;
    }

    const sentSteps = (deliveriesResult.data ?? [])
      .filter((delivery: any) => delivery.status === "sent")
      .map((delivery: any) => delivery.sequence_step);
    const step = selectDueNurtureStep({ consentedAt: consent.occurred_at, sentSteps });
    if (!step) continue;

    const { data: allowed, error: eligibilityError } = await supabaseAdmin.rpc(
      "can_send_commercial_email",
      {
        target_workspace_id: consent.workspace_id,
        target_lead_id: lead.id,
        target_contact_id: consent.contact_id,
      },
    );
    if (eligibilityError || allowed !== true) {
      results.push({ contactId: consent.contact_id, status: "blocked", step });
      continue;
    }

    const locale = typeof consent.evidence?.locale === "string" ? consent.evidence.locale : "en";
    const message = buildNurtureMessage({
      step,
      locale,
      domain: organization.normalized_domain,
      score: scanResult.data?.accessibility_score ?? null,
      totalIssues: scanResult.data ? issueCount(scanResult.data) : null,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://vexnexa.com",
    });
    const placeholderToken = randomBytes(32).toString("base64url");
    const deliveryData = {
      workspace_id: consent.workspace_id,
      organization_id: consent.organization_id,
      lead_id: lead.id,
      contact_id: consent.contact_id,
      sequence_step: step,
      status: "reserved",
      subject: message.subject,
      body_text: message.body,
      unsubscribe_token_hash: hashConsentToken(placeholderToken),
      error_message: null,
      updated_at: new Date().toISOString(),
    };

    let reservation = await supabaseAdmin
      .from("lead_nurture_deliveries")
      .insert(deliveryData)
      .select("id")
      .maybeSingle();
    if (reservation.error?.code === "23505") {
      reservation = await supabaseAdmin
        .from("lead_nurture_deliveries")
        .update(deliveryData)
        .eq("workspace_id", consent.workspace_id)
        .eq("contact_id", consent.contact_id)
        .eq("sequence_step", step)
        .eq("status", "failed")
        .select("id")
        .maybeSingle();
    }
    if (reservation.error || !reservation.data) continue;

    const unsubscribeToken = nurtureUnsubscribeToken(reservation.data.id);
    const tokenUpdate = await supabaseAdmin
      .from("lead_nurture_deliveries")
      .update({ unsubscribe_token_hash: hashConsentToken(unsubscribeToken), updated_at: new Date().toISOString() })
      .eq("id", reservation.data.id);
    if (tokenUpdate.error) {
      results.push({ contactId: consent.contact_id, status: "reservation_failed", step });
      continue;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vexnexa.com";
    const unsubscribeUrl = `${appUrl}/api/lead-intelligence/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
    try {
      const sendResult = await sendLeadNurtureEmail({
        to: contact.email,
        subject: message.subject,
        body: message.body,
        unsubscribeUrl,
        idempotencyKey: `lead-nurture/${reservation.data.id}`,
      });
      if (sendResult.error) throw new Error(sendResult.error.message);
      const sentAt = new Date().toISOString();
      const sentUpdate = await supabaseAdmin.from("lead_nurture_deliveries").update({ status: "sent", sent_at: sentAt, provider_message_id: sendResult.data?.id ?? null, updated_at: sentAt }).eq("id", reservation.data.id);
      if (sentUpdate.error) throw sentUpdate.error;
      await Promise.all([
        supabaseAdmin.from("email_drafts").insert({ workspace_id: consent.workspace_id, organization_id: consent.organization_id, contact_id: consent.contact_id, lead_id: lead.id, subject: message.subject, body_text: message.body, status: "sent", sent_at: sentAt }),
        supabaseAdmin.from("audit_events").insert({ workspace_id: consent.workspace_id, actor_user_id: null, event_type: "lead_nurture_email_sent", entity_type: "lead", entity_id: lead.id, metadata: { contact_id: consent.contact_id, sequence_step: step, provider_message_id: sendResult.data?.id ?? null } }),
      ]);
      results.push({ contactId: consent.contact_id, status: "sent", step });
    } catch (error) {
      await supabaseAdmin.from("lead_nurture_deliveries").update({ status: "failed", error_message: error instanceof Error ? error.message.slice(0, 500) : "send failed", updated_at: new Date().toISOString() }).eq("id", reservation.data.id);
      results.push({ contactId: consent.contact_id, status: "failed", step });
    }
  }
  return results;
}

export async function unsubscribeLeadNurture(token: string) {
  const { data: delivery, error } = await supabaseAdmin
    .from("lead_nurture_deliveries")
    .select("workspace_id, organization_id, lead_id, contact_id")
    .eq("unsubscribe_token_hash", hashConsentToken(token))
    .maybeSingle();
  if (error) throw error;
  if (!delivery) return false;

  const { data: contact, error: contactError } = await supabaseAdmin
    .from("contacts").select("email").eq("id", delivery.contact_id).single();
  if (contactError) throw contactError;
  const now = new Date().toISOString();
  const updates = await Promise.all([
    supabaseAdmin.from("suppression_entries").upsert({ workspace_id: delivery.workspace_id, normalized_email: contact.email, reason: "unsubscribe", source: "lead_nurture_unsubscribe" }, { onConflict: "workspace_id,normalized_email" }),
    supabaseAdmin.from("consent_events").insert({ workspace_id: delivery.workspace_id, organization_id: delivery.organization_id, contact_id: delivery.contact_id, consent_type: "commercial_outreach", status: "withdrawn", lawful_basis: "consent_withdrawn", source: "lead_nurture_unsubscribe", evidence: { delivery_lead_id: delivery.lead_id }, occurred_at: now }),
    supabaseAdmin.from("leads").update({ status: "unsubscribed", updated_at: now }).eq("id", delivery.lead_id),
    supabaseAdmin.from("lead_nurture_deliveries").update({ status: "cancelled", updated_at: now }).eq("workspace_id", delivery.workspace_id).eq("contact_id", delivery.contact_id).in("status", ["reserved", "failed"]),
    supabaseAdmin.from("audit_events").insert({ workspace_id: delivery.workspace_id, actor_user_id: null, event_type: "lead_unsubscribed", entity_type: "lead", entity_id: delivery.lead_id, metadata: { contact_id: delivery.contact_id, source: "one_click" } }),
  ]);
  // Supabase resolves failed writes with { error }, rather than rejecting.
  // Never acknowledge an unsubscribe that failed to persist its blocking state.
  for (const update of updates) {
    if (update.error) throw update.error;
  }
  return true;
}
