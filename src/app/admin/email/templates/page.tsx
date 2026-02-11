import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { adminFetch, hasAdminSecret } from "@/lib/adminFetch";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
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

interface TemplatesResponse {
  templates: EmailTemplate[];
  total: number;
}

const PAGE_SIZE = 25;

export default async function TemplatesPage() {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/email/templates"); }

  if (!hasAdminSecret()) {
    return (
      <div className="p-8 flex justify-center">
        <Card className="rounded-2xl max-w-md">
          <CardContent className="pt-6 pb-6 px-6 text-center">
            <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ADMIN_DASH_SECRET is not configured.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let templates: EmailTemplate[] = [];
  let total = 0;
  try {
    const data = await adminFetch<TemplatesResponse>(`/api/admin/email/templates?limit=${PAGE_SIZE}&offset=0`);
    templates = data.templates;
    total = data.total;
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
