/**
 * VexNexa Invoice PDF — generated with @react-pdf/renderer.
 *
 * Always VexNexa-branded (never white-label).
 * Reuses the InvoiceData interface from invoice-template.ts.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import type { InvoiceData } from './invoice-template';

// ── Styles ─────────────────────────────────────────────

const ORANGE = '#FF6B35'; // Aurora Orange - VexNexa primary brand color
const DARK = '#1E1E1E';
const MUTED = '#5A5A5A';
const LIGHT_BG = '#F8F9FA';
const BORDER = '#E5E7EB';

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: DARK,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: ORANGE,
    paddingBottom: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: 'bold',
    color: ORANGE,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK,
  },
  invoiceMeta: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },

  // ── Address block ──
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  addressCol: {
    width: '48%',
  },
  addressLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: MUTED,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: DARK,
  },
  addressBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: DARK,
  },

  // ── Table ──
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: BORDER,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: MUTED,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: BORDER,
    marginTop: 4,
  },
  colDesc: { width: '60%' },
  colAmount: { width: '40%', textAlign: 'right' },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: DARK,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: ORANGE,
    textAlign: 'right',
  },

  // ── Notes ──
  noteBox: {
    backgroundColor: LIGHT_BG,
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
    padding: 10,
    marginTop: 12,
    borderRadius: 4,
  },
  noteTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.4,
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    fontSize: 8,
    color: MUTED,
    textAlign: 'center',
  },
});

// ── Helpers ─────────────────────────────────────────────

function fmtEur(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function taxLineLabel(data: InvoiceData): string {
  if (data.taxMode === 'reverse_charge') {
    return 'VAT (0%) — Reverse charge';
  }
  if (data.taxMode === 'no_tax') {
    return 'VAT (0%) — Outside EU';
  }
  return `VAT (${data.taxRatePercent}%)`;
}

const MERCHANT = {
  name: 'VexNexa B.V.',
  address: 'Netherlands',
  vatId: 'NL005113493B92',
  kvk: '94848262',
  email: 'support@vexnexa.com',
};

// ── Document Component ──────────────────────────────────

interface InvoicePdfProps {
  data: InvoiceData;
}

function InvoicePdfDocument({ data }: InvoicePdfProps): React.ReactElement {
  const invoiceNum =
    data.invoiceNumber ??
    `VNX-${data.invoiceDate.replace(/-/g, '').slice(0, 8)}-${(data.paymentId ?? '').slice(-6).toUpperCase()}`;

  const customerAddressLines: string[] = [
    data.addressLine1,
    [data.addressPostal, data.addressCity].filter(Boolean).join(' '),
    data.addressRegion,
    data.customerCountry,
  ].filter((l): l is string => Boolean(l));

  return (
    <Document title={`Invoice ${invoiceNum}`} author="VexNexa B.V.">
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.brand}>VexNexa</Text>
          <View style={s.headerRight}>
            <Text style={s.invoiceTitle}>Invoice</Text>
            <Text style={s.invoiceMeta}>{invoiceNum}</Text>
            <Text style={s.invoiceMeta}>{fmtDate(data.invoiceDate)}</Text>
          </View>
        </View>

        {/* ── Address Row ── */}
        <View style={s.addressRow}>
          {/* From */}
          <View style={s.addressCol}>
            <Text style={s.addressLabel}>From</Text>
            <Text style={s.addressBold}>{data.merchantName ?? MERCHANT.name}</Text>
            <Text style={s.addressText}>{MERCHANT.email}</Text>
            <Text style={s.addressText}>{data.merchantAddress ?? MERCHANT.address}</Text>
            {(data.merchantVatId ?? MERCHANT.vatId) ? (
              <Text style={s.addressText}>VAT: {data.merchantVatId ?? MERCHANT.vatId}</Text>
            ) : null}
            {(data.merchantKvk ?? MERCHANT.kvk) ? (
              <Text style={s.addressText}>KvK: {data.merchantKvk ?? MERCHANT.kvk}</Text>
            ) : null}
          </View>

          {/* Bill To */}
          <View style={[s.addressCol, { alignItems: 'flex-end' }]}>
            <Text style={s.addressLabel}>Bill To</Text>
            {data.companyName ? (
              <Text style={s.addressBold}>{data.companyName}</Text>
            ) : null}
            <Text style={s.addressText}>{data.customerName}</Text>
            <Text style={s.addressText}>{data.customerEmail}</Text>
            {customerAddressLines.map((line, i) => (
              <Text key={i} style={s.addressText}>{line}</Text>
            ))}
            {data.vatId ? (
              <Text style={s.addressText}>
                VAT ID: {data.vatId}{data.vatIdValid ? ' ✓' : ''}
              </Text>
            ) : null}
            {data.registrationNumber ? (
              <Text style={s.addressText}>KvK: {data.registrationNumber}</Text>
            ) : null}
          </View>
        </View>

        {/* ── Line Items Table ── */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.colDesc]}>Description</Text>
            <Text style={[s.tableHeaderCell, s.colAmount]}>Amount</Text>
          </View>

          {/* Line item */}
          <View style={s.tableRow}>
            <Text style={[s.addressText, s.colDesc]}>{data.description}</Text>
            <Text style={[s.addressText, s.colAmount]}>{fmtEur(data.baseAmount)}</Text>
          </View>

          {/* Tax line */}
          <View style={s.tableRow}>
            <Text style={[s.addressText, s.colDesc]}>{taxLineLabel(data)}</Text>
            <Text style={[s.addressText, s.colAmount]}>
              {data.vatAmount === 0 ? '—' : fmtEur(data.vatAmount)}
            </Text>
          </View>

          {/* Total */}
          <View style={s.totalRow}>
            <Text style={[s.totalLabel, s.colDesc]}>Total</Text>
            <Text style={[s.totalValue, s.colAmount]}>{fmtEur(data.totalAmount)}</Text>
          </View>
        </View>

        {/* ── Reverse Charge Note ── */}
        {data.taxMode === 'reverse_charge' ? (
          <View style={s.noteBox}>
            <Text style={s.noteTitle}>Reverse Charge</Text>
            <Text style={s.noteText}>
              VAT is to be accounted for by the recipient under the reverse charge mechanism
              (EU Directive 2006/112/EC, Article 196).
            </Text>
          </View>
        ) : null}

        {/* ── Extra Tax Notes ── */}
        {data.taxNotes ? (
          <View style={s.noteBox}>
            <Text style={s.noteText}>{data.taxNotes}</Text>
          </View>
        ) : null}

        {/* ── Payment Reference ── */}
        {data.paymentId ? (
          <Text style={[s.invoiceMeta, { marginTop: 20 }]}>
            Payment reference: {data.paymentId}
          </Text>
        ) : null}

        {/* ── Footer ── */}
        <Text style={s.footer}>
          {data.merchantName ?? MERCHANT.name} · {data.merchantAddress ?? MERCHANT.address}
          {(data.merchantVatId ?? MERCHANT.vatId) ? ` · VAT: ${data.merchantVatId ?? MERCHANT.vatId}` : ''}
          {(data.merchantKvk ?? MERCHANT.kvk) ? ` · KvK: ${data.merchantKvk ?? MERCHANT.kvk}` : ''}
        </Text>
      </Page>
    </Document>
  );
}

// ── Public API ──────────────────────────────────────────

/**
 * Generate a PDF buffer for a VexNexa invoice.
 * Uses @react-pdf/renderer — no browser/chromium needed.
 */
export async function generateInvoicePdfBuffer(data: InvoiceData): Promise<Buffer> {
  const doc = <InvoicePdfDocument data={data} />;
  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate an invoice number from a date and payment ID.
 * Format: VNX-YYYYMMDD-XXXXXX
 */
export function generateInvoiceNumber(invoiceDate: string, paymentId?: string | null): string {
  const datePart = invoiceDate.replace(/-/g, '').slice(0, 8);
  const idPart = paymentId ? paymentId.slice(-6).toUpperCase() : Math.random().toString(36).slice(-6).toUpperCase();
  return `VNX-${datePart}-${idPart}`;
}
