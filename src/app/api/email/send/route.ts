import { NextRequest, NextResponse } from "next/server";
import { sendEmail, type SendEmailParams } from "@/lib/mailgun";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { assertAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" } as const;

interface SendRequestBody {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  tag?: string;
  user_id?: string;
  meta?: Record<string, string>;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  return NextResponse.json(
    { ok: true, hint: "POST to send", host: req.headers.get("host") ?? "unknown" },
    { headers: NO_STORE }
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  try {
    const body: SendRequestBody = await req.json();

    if (!body.to || !body.subject) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject" },
        { status: 400, headers: NO_STORE }
      );
    }

    if (!body.text && !body.html) {
      return NextResponse.json(
        { error: "At least one of text or html is required" },
        { status: 400, headers: NO_STORE }
      );
    }

    const params: SendEmailParams = {
      to: body.to,
      subject: body.subject,
      text: body.text,
      html: body.html,
      tag: body.tag,
      user_id: body.user_id,
      meta: body.meta,
    };

    const result = await sendEmail(params);

    // Strip angle brackets from message-id: "<abc@domain>" -> "abc@domain"
    const rawId: string = result.id ?? "";
    const messageId: string = rawId.replace(/^<|>$/g, "");

    // Determine primary recipient for logging
    const toEmail: string = Array.isArray(body.to)
      ? body.to[0]
      : body.to;

    // Log to email_logs
    const { error: dbError } = await supabaseAdmin.from("email_logs").insert({
      user_id: body.user_id ?? null,
      to_email: toEmail,
      subject: body.subject,
      tag: body.tag ?? null,
      mailgun_message_id: messageId || null,
      mailgun_api_id: rawId || null,
      status: "sent",
    });

    if (dbError) {
      console.error("[email/send] Failed to insert email_logs row:", dbError);
    }

    return NextResponse.json(
      {
        success: true,
        message_id: messageId,
        mailgun_response: result.message,
      },
      { headers: NO_STORE }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error sending email";
    console.error("[email/send] Error:", message);
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
