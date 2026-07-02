import { afterEach, describe, expect, it } from "vitest";
import { recordFreeScanLeadCapture } from "./repository";

describe("recordFreeScanLeadCapture", () => {
  const originalWorkspaceId = process.env.LEAD_CAPTURE_WORKSPACE_ID;

  afterEach(() => {
    if (originalWorkspaceId === undefined) {
      delete process.env.LEAD_CAPTURE_WORKSPACE_ID;
    } else {
      process.env.LEAD_CAPTURE_WORKSPACE_ID = originalWorkspaceId;
    }
  });

  it("is a no-op when lead capture storage is not configured", async () => {
    delete process.env.LEAD_CAPTURE_WORKSPACE_ID;

    await expect(
      recordFreeScanLeadCapture({
        email: "lead@example.com",
        url: "https://example.com",
        phase: "done",
        locale: "en",
        clientIp: "127.0.0.1",
        result: {
          score: 88,
          totalIssues: 4,
          impactCritical: 0,
          impactSerious: 1,
          impactModerate: 2,
          impactMinor: 1,
        },
      }),
    ).resolves.toEqual({ stored: false, reason: "not_configured" });
  });
});
