import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { adminFetch, hasAdminSecret } from "@/lib/adminFetch";
import { Card, CardContent } from "@/components/ui/card";
import {
  HeartPulse,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  AlertTriangle,
  UserMinus,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface HealthData {
  range: string;
  total_sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  complained: number;
}

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function DeliveryHealthPage({ searchParams }: PageProps) {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/email/health"); }

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

  const params = await searchParams;
  const rangeParam: string = params.range ?? "24h";

  let metrics: HealthData = { range: rangeParam, total_sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, unsubscribed: 0, complained: 0 };
  try {
    metrics = await adminFetch<HealthData>(`/api/admin/email/health?range=${rangeParam}`);
  } catch (e) {
    console.error("[admin/email/health] fetch error:", e);
  }

  const kpis = [
    { label: "Sent", value: metrics.total_sent, icon: <Send className="h-5 w-5" />, color: "text-blue-500" },
    { label: "Delivered", value: metrics.delivered, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-green-500" },
    { label: "Failed", value: metrics.failed, icon: <XCircle className="h-5 w-5" />, color: "text-red-500" },
    { label: "Opened", value: metrics.opened, icon: <Eye className="h-5 w-5" />, color: "text-purple-500" },
    { label: "Clicked", value: metrics.clicked, icon: <MousePointerClick className="h-5 w-5" />, color: "text-indigo-500" },
    { label: "Complained", value: metrics.complained, icon: <AlertTriangle className="h-5 w-5" />, color: "text-orange-500" },
    { label: "Unsubscribed", value: metrics.unsubscribed, icon: <UserMinus className="h-5 w-5" />, color: "text-yellow-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <HeartPulse className="h-7 w-7 text-[var(--vn-primary)]" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Delivery Health</h1>
          <p className="text-muted-foreground text-sm">Mailgun delivery metrics</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["24h", "7d", "30d"] as const).map((r) => (
          <a key={r} href={`/admin/email/health?range=${r}`}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
              rangeParam === r
                ? "bg-[var(--vn-primary-aaa-btn)] text-[var(--vn-on-primary-aaa-btn)] shadow-sm"
                : "bg-muted hover:bg-muted/80"
            }`}>
            {r === "24h" ? "Last 24h" : r === "7d" ? "Last 7 days" : "Last 30 days"}
          </a>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-2xl">
            <CardContent className="pt-5 pb-4 px-4 flex flex-col items-center text-center gap-1">
              <span className={kpi.color}>{kpi.icon}</span>
              <span className="text-2xl font-bold font-display">{kpi.value}</span>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
