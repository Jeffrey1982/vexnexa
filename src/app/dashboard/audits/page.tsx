import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AuditDashboard from "@/components/audits/AuditDashboard";
import AuditManager from "@/components/audits/AuditManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AuditsPage() {
  const user = await requireAuth();

  // Fetch user's sites
  const sites = await prisma.site.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      url: true,
      name: true
    },
    orderBy: { createdAt: "desc" }
  });

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
