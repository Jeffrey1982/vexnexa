"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getOrCreateLeadWorkspace } from "@/lib/lead-intelligence/repository";
import { importLeadCsv } from "@/lib/lead-intelligence/import-service";

export async function importLeadCsvAction(formData: FormData) {
  const user = await requireAdmin();
  const file = formData.get("csv_file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/dashboard/leads/import?error=missing-file");
  }

  let redirectTarget = "/dashboard/leads/import";
  try {
    const workspace = await getOrCreateLeadWorkspace(user);
    const csvText = await file.text();
    const result = await importLeadCsv({
      csvText,
      workspaceId: workspace.id,
      actor: { id: user.id },
    });
    const params = new URLSearchParams({
      created: String(result.summary.created),
      updated: String(result.summary.updated),
      skipped: String(result.summary.skipped),
      invalid: String(result.summary.invalid),
    });
    redirectTarget = `/dashboard/leads/import?${params.toString()}`;
  } catch (error) {
    console.error("Lead CSV import failed:", error);
    redirectTarget = "/dashboard/leads/import?error=import-failed";
  }

  redirect(redirectTarget);
}
