/**
 * Outreach sending is intentionally disabled.
 *
 * Provider email has been removed from the admin dashboard, so campaign management can
 * remain visible without keeping a provider-specific send path alive.
 */
export interface SendBatchResult {
  sent: number;
  failed: number;
  skipped: number;
  done: boolean;
  error?: string;
}

export async function sendBatch(_campaignId: string): Promise<SendBatchResult> {
  return {
    sent: 0,
    failed: 0,
    skipped: 0,
    done: false,
    error: 'Provider email sending has been removed from this dashboard.',
  };
}
