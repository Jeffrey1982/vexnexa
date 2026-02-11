import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import TemplatesClient from "./TemplatesClient";

export const dynamic = "force-dynamic";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: unknown;
  created_at: string;
  updated_at: string;
}

const PAGE_SIZE = 25;

export default async function TemplatesPage() {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/email/templates"); }

  let templates: EmailTemplate[] = [];
  let total = 0;
  try {
    const { data, count, error } = await supabaseAdmin
      .from("email_templates")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (!error) {
      templates = (data as EmailTemplate[]) ?? [];
      total = count ?? 0;
    }
  } catch (e) {
    console.error("[admin/email/templates] fetch error:", e);
  }

  return (
    <TemplatesClient
      initialTemplates={templates}
      initialTotal={total}
      pageSize={PAGE_SIZE}
    />
  );
}
