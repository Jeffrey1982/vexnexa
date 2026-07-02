import Link from "next/link";
import { redirect } from "next/navigation";
import { Upload, FileText } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { importLeadCsvAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LeadImportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth/login?redirect=/dashboard/leads/import");
  }

  const params = await searchParams;
  const hasSummary = params.created !== undefined;

  return (
    <main id="main-content" tabIndex={-1}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Lead Intelligence</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">CSV import</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Import company domains and contacts without inferring outreach permission.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/leads">Back to leads</Link>
          </Button>
        </div>

        {params.error && (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Import failed. Check that the file is a valid CSV and that the lead database migration has been applied.
          </div>
        )}

        {hasSummary && (
          <div className="mb-5 grid gap-3 sm:grid-cols-4">
            {[
              ["Created", params.created],
              ["Updated", params.updated],
              ["Skipped", params.skipped],
              ["Invalid", params.invalid],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-card p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        )}

        <section className="rounded-lg border bg-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Upload CSV</h2>
              <p className="text-sm text-muted-foreground">
                Required columns: company_name, website_url, country_code, industry, source_url, contact_email.
              </p>
            </div>
          </div>

          <form action={importLeadCsvAction} className="space-y-4">
            <div>
              <label htmlFor="csv_file" className="block text-sm font-medium text-foreground">
                CSV file
              </label>
              <input
                id="csv_file"
                name="csv_file"
                type="file"
                accept=".csv,text/csv"
                required
                className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-sm file:font-medium file:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" className="gap-2">
              <FileText className="h-4 w-4" />
              Import leads
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
