import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function RecentScans() {
  try {
    const scans = await prisma.scan.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { site: true, page: true },
    });
    if (!scans.length) return <div className="text-sm text-muted-foreground">No scans yet.</div>;
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Recent scans</h2>
        <div className="divide-y rounded-xl border">
          {scans.map((s) => (
            <div key={s.id} className="p-3 flex items-center justify-between">
              <div className="truncate">
                <div className="font-medium truncate">
                  {s.site?.url && new URL(s.site.url).hostname}
                </div>
                <div className="text-sm text-gray-700 truncate">
                  {s.page?.url ? new URL(s.page.url).pathname : "entire site / unknown page"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleString()} • {s.issues || 0} issues
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{s.score ?? "-"} / 100</span>
                <Link href={`/scans/${s.id}`} className="text-blue-600 underline text-sm">Details</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    return <div className="text-sm text-red-600">Kon recente scans niet laden. Run eerst de Prisma migratie.</div>;
  }
}