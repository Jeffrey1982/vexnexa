import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { prisma } from "@/lib/prisma";
import { isEuCountry } from "@/lib/billing/countries";
import { normalizeVatId, validateVatIdFormat } from "@/lib/billing/tax";

/** Result from the VIES REST API check */
interface ViesResult {
  valid: boolean;
  companyName?: string;
  address?: string;
}

/**
 * POST /api/billing/validate-vat
 *
 * Validates a EU VAT ID:
 *  1. Local format check
 *  2. VIES REST API check (EU only)
 *  3. Persists result + company info to BillingProfile
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

    // 2. VIES check (REST API with SOAP fallback)
    let viesResult: ViesResult = { valid: false };
    let viesError: string | null = null;

    try {
      viesResult = await checkViesRest(countryCode, vatId);
    } catch (restErr) {
      console.warn("[validate-vat] VIES REST failed, trying SOAP fallback:", restErr);
      try {
        viesResult = await checkViesSoap(countryCode, vatId);
      } catch (soapErr) {
        viesError =
          soapErr instanceof Error ? soapErr.message : "VIES service unavailable";
        console.warn("[validate-vat] VIES SOAP also failed:", viesError);
      }
    }

    // 3. Persist to BillingProfile (include company info from VIES if available)
    const now = new Date();
    const updateData: Record<string, unknown> = {
      vatId,
      vatValid: viesResult.valid,
      vatCheckedAt: now,
    };
    // Auto-fill company name from VIES if not already set
    if (viesResult.companyName) {
      updateData.companyName = viesResult.companyName;
    }

    await prisma.billingProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        countryCode,
        billingType: "business",
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      valid: viesResult.valid,
      vatId,
      countryCode,
      companyName: viesResult.companyName ?? null,
      address: viesResult.address ?? null,
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
 * Query the EU VIES REST API to validate a VAT number.
 *
 * Endpoint:
 *   POST https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number
 *
 * Returns validity, company name, and address.
 */
async function checkViesRest(
  countryCode: string,
  vatId: string
): Promise<ViesResult> {
  // Strip the country prefix if the VAT ID already includes it
  const vatNumber = vatId.startsWith(countryCode)
    ? vatId.slice(countryCode.length)
    : vatId;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode,
          vatNumber,
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`VIES REST returned ${response.status}`);
    }

    const data = await response.json();

    return {
      valid: data.valid === true,
      companyName: cleanViesString(data.name),
      address: cleanViesString(data.address),
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fallback: Query the EU VIES SOAP service.
 * Used when the REST API is down.
 */
async function checkViesSoap(
  countryCode: string,
  vatId: string
): Promise<ViesResult> {
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

    const validMatch = text.match(/<valid>(true|false)<\/valid>/i);
    if (!validMatch) {
      throw new Error("Could not parse VIES SOAP response");
    }

    const nameMatch = text.match(/<name>([^<]*)<\/name>/i);
    const addressMatch = text.match(/<address>([^<]*)<\/address>/i);

    return {
      valid: validMatch[1].toLowerCase() === "true",
      companyName: cleanViesString(nameMatch?.[1]),
      address: cleanViesString(addressMatch?.[1]),
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Clean VIES string: trim, collapse whitespace, return undefined if empty/dash */
function cleanViesString(str?: string | null): string | undefined {
  if (!str) return undefined;
  const cleaned = str.replace(/\s+/g, " ").trim();
  // VIES returns "---" for unavailable data
  if (!cleaned || cleaned === "---" || cleaned === "-") return undefined;
  return cleaned;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
