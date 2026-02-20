import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { prisma } from "@/lib/prisma";
import { isEuCountry } from "@/lib/billing/countries";
import { normalizeVatId, validateVatIdFormat } from "@/lib/billing/tax";

/**
 * POST /api/billing/validate-vat
 *
 * Validates a EU VAT ID:
 *  1. Local format check
 *  2. VIES SOAP check (EU only)
 *  3. Persists result to BillingProfile
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const countryCode: string = (body.countryCode ?? "").toUpperCase();
    const rawVatId: string = body.vatId ?? "";

    if (!countryCode || !rawVatId) {
      return NextResponse.json(
        { valid: false, error: "countryCode and vatId are required" },
        { status: 400 }
      );
    }

    const vatId = normalizeVatId(rawVatId);

    // 1. Local format check
    if (!isEuCountry(countryCode)) {
      return NextResponse.json({
        valid: false,
        error: "VAT validation is only available for EU countries",
      });
    }

    if (!validateVatIdFormat(countryCode, vatId)) {
      return NextResponse.json({
        valid: false,
        error: `Invalid VAT ID format for ${countryCode}`,
      });
    }

    // 2. VIES check
    let viesValid = false;
    let viesError: string | null = null;

    try {
      viesValid = await checkVies(countryCode, vatId);
    } catch (err) {
      viesError =
        err instanceof Error ? err.message : "VIES service unavailable";
      console.warn("[validate-vat] VIES check failed:", viesError);
    }

    // 3. Persist to BillingProfile
    const now = new Date();
    await prisma.billingProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        countryCode,
        vatId,
        vatValid: viesValid,
        vatCheckedAt: now,
        billingType: "business",
      },
      update: {
        vatId,
        vatValid: viesValid,
        vatCheckedAt: now,
      },
    });

    return NextResponse.json({
      valid: viesValid,
      vatId,
      countryCode,
      checkedAt: now.toISOString(),
      ...(viesError ? { warning: `VIES unavailable: ${viesError}` } : {}),
    });
  } catch (error) {
    console.error("[validate-vat] Error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Query the EU VIES SOAP service to validate a VAT number.
 *
 * The VIES service is at:
 *   https://ec.europa.eu/taxation_customs/vies/services/checkVatService
 *
 * We use a simple SOAP envelope rather than a full SOAP client.
 */
async function checkVies(
  countryCode: string,
  vatId: string
): Promise<boolean> {
  // Strip the country prefix if the VAT ID already includes it
  const vatNumber = vatId.startsWith(countryCode)
    ? vatId.slice(countryCode.length)
    : vatId;

  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${escapeXml(countryCode)}</urn:countryCode>
      <urn:vatNumber>${escapeXml(vatNumber)}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      "https://ec.europa.eu/taxation_customs/vies/services/checkVatService",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "",
        },
        body: soapEnvelope,
        signal: controller.signal,
      }
    );

    const text = await response.text();

    // Parse the <valid> element from the SOAP response
    const validMatch = text.match(/<valid>(true|false)<\/valid>/i);
    if (!validMatch) {
      throw new Error("Could not parse VIES response");
    }

    return validMatch[1].toLowerCase() === "true";
  } finally {
    clearTimeout(timeout);
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
