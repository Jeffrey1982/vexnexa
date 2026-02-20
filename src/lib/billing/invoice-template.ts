/**
 * Invoice / receipt HTML template for VexNexa billing.
 *
 * Generates a professional invoice that displays:
 * - Company name, registration number, VAT ID (if provided)
 * - VAT rate and amount
 * - Reverse charge note when applicable
 *
 * Used for:
 * - Payment confirmation emails
 * - Downloadable receipt PDFs (via browser print)
 * - Admin invoice records
 */

export interface InvoiceData {
  // Invoice metadata
  invoiceNumber?: string;
  invoiceDate: string; // ISO date string
  paymentId?: string;

  // Merchant info (VexNexa)
  merchantName?: string;
  merchantAddress?: string;
  merchantVatId?: string;
  merchantKvk?: string;

  // Customer info
  customerName: string;
  customerEmail: string;
  customerType: "individual" | "company" | string;
  companyName?: string | null;
  registrationNumber?: string | null;
  vatId?: string | null;
  vatIdValid?: boolean;
  customerCountry: string;

  // Billing address (optional)
  addressLine1?: string | null;
  addressCity?: string | null;
  addressPostal?: string | null;
  addressRegion?: string | null;

  // Line items
  product: string;
  plan?: string | null;
  billingCycle?: string | null;
  description: string;

  // Amounts
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;

  // Tax info
  taxRatePercent: number;
  taxMode: string;
  taxNotes?: string | null;
}

const MERCHANT_DEFAULTS = {
  name: "VexNexa B.V.",
  address: "Netherlands",
  vatId: "", // Fill in when registered
  kvk: "", // Fill in when registered
};

/**
 * Format a number as EUR currency.
 */
function fmtEur(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string for display.
 */
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Generate the tax line label for the invoice.
 */
function taxLineLabel(data: InvoiceData): string {
  if (data.taxMode === "reverse_charge") {
    return "VAT (0%) – Reverse charge";
  }
  if (data.taxMode === "no_tax") {
    return "VAT (0%) – Outside EU";
  }
  return `VAT (${data.taxRatePercent}%)`;
}

/**
 * Generate a professional invoice/receipt HTML string.
 */
export function generateInvoiceHtml(data: InvoiceData): string {
  const merchant = {
    name: data.merchantName ?? MERCHANT_DEFAULTS.name,
    address: data.merchantAddress ?? MERCHANT_DEFAULTS.address,
    vatId: data.merchantVatId ?? MERCHANT_DEFAULTS.vatId,
    kvk: data.merchantKvk ?? MERCHANT_DEFAULTS.kvk,
  };

  const invoiceNum =
    data.invoiceNumber ?? `VNX-${data.invoiceDate.replace(/-/g, "").slice(0, 8)}-${(data.paymentId ?? "").slice(-6).toUpperCase()}`;

  const customerAddress = [
    data.addressLine1,
    [data.addressPostal, data.addressCity].filter(Boolean).join(" "),
    data.addressRegion,
    data.customerCountry,
  ]
    .filter(Boolean)
    .join("<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNum}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1E1E1E; margin: 0; padding: 0; background: #F8F9FA; }
    .invoice { max-width: 680px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: #0F5C5C; color: #fff; padding: 32px 40px; }
    .header h1 { margin: 0 0 4px; font-size: 24px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.85; font-size: 14px; }
    .body { padding: 32px 40px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .meta-col { font-size: 13px; line-height: 1.6; }
    .meta-col strong { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #5A5A5A; margin-bottom: 4px; }
    .meta-col .value { color: #1E1E1E; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #5A5A5A; padding: 8px 0; border-bottom: 2px solid #E5E7EB; }
    td { padding: 12px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; }
    td.amount { text-align: right; font-variant-numeric: tabular-nums; }
    th.amount { text-align: right; }
    .total-row td { border-bottom: none; font-weight: 700; font-size: 16px; padding-top: 16px; }
    .tax-note { font-size: 12px; color: #5A5A5A; margin-top: 16px; padding: 12px 16px; background: #F8F9FA; border-radius: 6px; border-left: 3px solid #0F5C5C; }
    .footer { padding: 24px 40px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #5A5A5A; text-align: center; }
    @media print { body { background: #fff; } .invoice { box-shadow: none; margin: 0; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>Invoice</h1>
      <p>${invoiceNum} &middot; ${fmtDate(data.invoiceDate)}</p>
    </div>

    <div class="body">
      <div class="meta">
        <div class="meta-col">
          <strong>From</strong>
          <div class="value">
            ${merchant.name}<br>
            ${merchant.address}
            ${merchant.vatId ? `<br>VAT: ${merchant.vatId}` : ""}
            ${merchant.kvk ? `<br>KvK: ${merchant.kvk}` : ""}
          </div>
        </div>
        <div class="meta-col" style="text-align: right;">
          <strong>Bill To</strong>
          <div class="value">
            ${data.companyName ? `<strong>${escHtml(data.companyName)}</strong><br>` : ""}
            ${escHtml(data.customerName)}<br>
            ${escHtml(data.customerEmail)}
            ${customerAddress ? `<br>${customerAddress}` : ""}
            ${data.vatId ? `<br>VAT ID: ${escHtml(data.vatId)}${data.vatIdValid ? " ✓" : ""}` : ""}
            ${data.registrationNumber ? `<br>Reg: ${escHtml(data.registrationNumber)}` : ""}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escHtml(data.description)}</td>
            <td class="amount">${fmtEur(data.baseAmount)}</td>
          </tr>
          <tr>
            <td>${taxLineLabel(data)}</td>
            <td class="amount">${data.vatAmount === 0 ? "—" : fmtEur(data.vatAmount)}</td>
          </tr>
          <tr class="total-row">
            <td>Total</td>
            <td class="amount">${fmtEur(data.totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      ${data.taxMode === "reverse_charge" ? `
      <div class="tax-note">
        <strong>Reverse Charge:</strong> VAT is to be accounted for by the recipient under the reverse charge mechanism (EU Directive 2006/112/EC, Article 196).
      </div>` : ""}

      ${data.taxNotes ? `
      <div class="tax-note">
        ${escHtml(data.taxNotes)}
      </div>` : ""}

      ${data.paymentId ? `
      <p style="font-size: 12px; color: #5A5A5A; margin-top: 24px;">
        Payment reference: ${escHtml(data.paymentId)}
      </p>` : ""}
    </div>

    <div class="footer">
      ${merchant.name} &middot; ${merchant.address}
      ${merchant.vatId ? ` &middot; VAT: ${merchant.vatId}` : ""}
      ${merchant.kvk ? ` &middot; KvK: ${merchant.kvk}` : ""}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a plain-text version of the invoice for email fallback.
 */
export function generateInvoicePlainText(data: InvoiceData): string {
  const lines: string[] = [
    "INVOICE",
    `Invoice: ${data.invoiceNumber ?? ""}`,
    `Date: ${fmtDate(data.invoiceDate)}`,
    "",
    `From: ${data.merchantName ?? MERCHANT_DEFAULTS.name}`,
    "",
    `Bill To: ${data.companyName ? data.companyName + " — " : ""}${data.customerName}`,
    `Email: ${data.customerEmail}`,
  ];

  if (data.vatId) lines.push(`VAT ID: ${data.vatId}${data.vatIdValid ? " (validated)" : ""}`);
  if (data.registrationNumber) lines.push(`Registration: ${data.registrationNumber}`);

  lines.push(
    "",
    "─".repeat(50),
    `${data.description}`,
    `  Subtotal:  ${fmtEur(data.baseAmount)}`,
    `  ${taxLineLabel(data)}:  ${data.vatAmount === 0 ? "—" : fmtEur(data.vatAmount)}`,
    "─".repeat(50),
    `  TOTAL:     ${fmtEur(data.totalAmount)}`,
    ""
  );

  if (data.taxMode === "reverse_charge") {
    lines.push(
      "Note: VAT reverse charge applies — you account for VAT.",
      ""
    );
  }

  if (data.paymentId) {
    lines.push(`Payment reference: ${data.paymentId}`);
  }

  return lines.join("\n");
}

/**
 * Build InvoiceData from a CheckoutQuote record + user info.
 */
export function buildInvoiceDataFromQuote(
  quote: {
    product: string;
    plan: string | null;
    billingCycle: string | null;
    baseAmount: number | { toNumber(): number };
    vatAmount: number | { toNumber(): number };
    totalAmount: number | { toNumber(): number };
    currency: string;
    taxRatePercent: number | { toNumber(): number };
    taxMode: string;
    taxNotes: string | null;
    customerType: string;
    customerCountry: string;
    companyName: string | null;
    vatId: string | null;
    vatIdValid: boolean;
    molliePaymentId: string | null;
    createdAt: Date | string;
  },
  user: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  },
  billingProfile?: {
    registrationNumber?: string | null;
    kvkNumber?: string | null;
    addressLine1?: string | null;
    addressCity?: string | null;
    addressPostal?: string | null;
    addressRegion?: string | null;
  } | null
): InvoiceData {
  const toNum = (v: number | { toNumber(): number }): number =>
    typeof v === "number" ? v : v.toNumber();

  const cycleName = quote.billingCycle === "yearly" ? "Annual" : "Monthly";
  const planName = quote.plan ?? "Subscription";
  const description =
    quote.product === "subscription"
      ? `VexNexa ${planName} Plan (${cycleName})`
      : quote.product === "assurance"
        ? `VexNexa Assurance (${cycleName})`
        : `VexNexa ${quote.product}`;

  const createdAt =
    typeof quote.createdAt === "string"
      ? quote.createdAt
      : quote.createdAt.toISOString();

  return {
    invoiceDate: createdAt.split("T")[0],
    paymentId: quote.molliePaymentId ?? undefined,
    customerName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
    customerEmail: user.email,
    customerType: quote.customerType,
    companyName: quote.companyName,
    registrationNumber: billingProfile?.registrationNumber ?? billingProfile?.kvkNumber,
    vatId: quote.vatId,
    vatIdValid: quote.vatIdValid,
    customerCountry: quote.customerCountry,
    addressLine1: billingProfile?.addressLine1,
    addressCity: billingProfile?.addressCity,
    addressPostal: billingProfile?.addressPostal,
    addressRegion: billingProfile?.addressRegion,
    product: quote.product,
    plan: quote.plan,
    billingCycle: quote.billingCycle,
    description,
    baseAmount: toNum(quote.baseAmount),
    vatAmount: toNum(quote.vatAmount),
    totalAmount: toNum(quote.totalAmount),
    currency: quote.currency,
    taxRatePercent: toNum(quote.taxRatePercent),
    taxMode: quote.taxMode,
    taxNotes: quote.taxNotes,
  };
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
