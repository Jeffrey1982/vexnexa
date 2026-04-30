import { Radar } from "lucide-react";
import { AdminScansClient } from "@/components/admin/AdminScansClient";

export const dynamic = "force-dynamic";

export default function AdminScansPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-foreground">
                <Radar className="text-teal-500" />
                Scan Performance
              </h1>
              <p className="mt-1 text-muted-foreground">
                Realtime scan status, VNI quality signals, and fast report access.
              </p>
            </div>
          </div>

          <AdminScansClient />
        </div>
      </div>
    </div>
  );
}
