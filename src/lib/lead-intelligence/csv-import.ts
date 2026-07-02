import { z } from "zod";
import { normalizeDomain, normalizeEmail } from "./domain-normalization";

export const MAX_CSV_BYTES = Number(process.env.LEAD_IMPORT_MAX_BYTES ?? 512_000);
export const MAX_CSV_ROWS = Number(process.env.LEAD_IMPORT_MAX_ROWS ?? 1_000);

const requiredColumns = [
  "company_name",
  "website_url",
  "country_code",
  "industry",
  "source_url",
  "contact_email",
] as const;

const rowSchema = z.object({
  company_name: z.string().trim().min(1).max(200),
  website_url: z.string().trim().min(1).max(500),
  country_code: z
    .string()
    .trim()
    .max(2)
    .optional()
    .transform((value) => value?.toUpperCase() || null),
  industry: z.string().trim().max(120).optional().transform((value) => value || null),
  source_url: z.string().trim().max(500).optional().transform((value) => value || null),
  contact_email: z.string().trim().max(320).optional().transform((value) => value || null),
});

export type ValidCsvLeadRow = z.infer<typeof rowSchema> & {
  normalized_domain: string;
  normalized_email: string | null;
};

export type CsvLeadImportPlan = {
  rows: ValidCsvLeadRow[];
  invalidRows: Array<{ rowNumber: number; reason: string }>;
  summary: {
    created: number;
    updated: number;
    skipped: number;
    invalid: number;
  };
};

export type ExistingLeadImportState = {
  organizationDomains?: Set<string>;
  contactKeys?: Set<string>;
};

function rejectDangerousCell(value: string): boolean {
  return /^[=+\-@]/.test(value.trim());
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      cell = "";
      row = [];
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (quoted) throw new Error("CSV contains an unterminated quoted cell.");
  return rows;
}

export function planCsvLeadImport(
  text: string,
  existing: ExistingLeadImportState = {},
): CsvLeadImportPlan {
  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes > MAX_CSV_BYTES) {
    throw new Error(`CSV is too large. Maximum size is ${MAX_CSV_BYTES} bytes.`);
  }

  const parsed = parseCsv(text);
  const header = parsed[0]?.map((column) => column.trim());
  if (!header) throw new Error("CSV is empty.");
  const missing = requiredColumns.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    throw new Error(`CSV is missing required columns: ${missing.join(", ")}.`);
  }

  const dataRows = parsed.slice(1);
  if (dataRows.length > MAX_CSV_ROWS) {
    throw new Error(`CSV has too many rows. Maximum row count is ${MAX_CSV_ROWS}.`);
  }

  const organizationDomains = new Set(existing.organizationDomains ?? []);
  const contactKeys = new Set(existing.contactKeys ?? []);
  const rows: ValidCsvLeadRow[] = [];
  const invalidRows: CsvLeadImportPlan["invalidRows"] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  dataRows.forEach((values, index) => {
    const rowNumber = index + 2;
    const raw = Object.fromEntries(header.map((key, columnIndex) => [key, values[columnIndex] ?? ""]));
    if (Object.values(raw).some((value) => rejectDangerousCell(String(value)))) {
      invalidRows.push({ rowNumber, reason: "Cell starts with a dangerous spreadsheet formula prefix." });
      return;
    }

    const parsedRow = rowSchema.safeParse(raw);
    if (!parsedRow.success) {
      invalidRows.push({ rowNumber, reason: parsedRow.error.issues[0]?.message ?? "Invalid row." });
      return;
    }

    try {
      const normalized_domain = normalizeDomain(parsedRow.data.website_url);
      const normalized_email = parsedRow.data.contact_email
        ? normalizeEmail(parsedRow.data.contact_email)
        : null;
      const contactKey = normalized_email ? `${normalized_domain}:${normalized_email}` : null;
      const knownOrg = organizationDomains.has(normalized_domain);
      const knownContact = contactKey ? contactKeys.has(contactKey) : false;

      if (!knownOrg) {
        created += 1;
        organizationDomains.add(normalized_domain);
      } else {
        updated += 1;
      }

      if (contactKey && knownContact) {
        skipped += 1;
      } else if (contactKey) {
        contactKeys.add(contactKey);
      }

      rows.push({ ...parsedRow.data, normalized_domain, normalized_email });
    } catch (error) {
      invalidRows.push({
        rowNumber,
        reason: error instanceof Error ? error.message : "Invalid domain or email.",
      });
    }
  });

  return {
    rows,
    invalidRows,
    summary: {
      created,
      updated,
      skipped,
      invalid: invalidRows.length,
    },
  };
}
