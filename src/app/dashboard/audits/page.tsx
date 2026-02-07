import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AuditDashboard from "@/components/audits/AuditDashboard";
import AuditManager from "@/components/audits/AuditManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AuditsPage() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/dashboard/audits");
  }

  // Fetch user's sites
  const sitesData = await prisma.site.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      url: true
    },
    orderBy: { createdAt: "desc" }
  });

  // Map sites to include name field (null since Site model doesn't have it)
  const sites = sitesData.map(site => ({
    ...site,
    name: null
  }));

  // Fetch available templates
  const templates = await prisma.auditTemplate.findMany({
    where: {
      OR: [{ isPublic: true }, { isDefault: true }]
    },
    select: {
      id: true,
      name: true,
      description: true,
      wcagLevel: true,
      category: true
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manual Accessibility Audits</h1>
        <p className="text-gray-600 mt-2">
          Conduct comprehensive manual accessibility testing to supplement automated scans and
          achieve full WCAG 2.1 compliance.
        </p>
      </div>

      <AuditManager sites={sites} templates={templates} />

      <AuditDashboard />
    </div>
  );
}
