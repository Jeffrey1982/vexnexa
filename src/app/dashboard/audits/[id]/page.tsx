import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AuditChecklist from "@/components/audits/AuditChecklist";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AuditDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  // Verify user has access to this audit
  const audit = await prisma.manualAudit.findFirst({
    where: {
      id,
      OR: [
        { createdById: user.id },
        { assignedToId: user.id },
        { reviewedById: user.id }
      ]
    }
  });

  if (!audit) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/audits"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Audits
        </Link>
      </div>

      <AuditChecklist auditId={id} />
    </div>
  );
}
