import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { sendEmail } from "@/lib/mailgun";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);

    const contentType = req.headers.get("content-type") ?? "";
    let to: string;
    let subject: string;
    let html: string | undefined;
    let text: string | undefined;
    let tag: string | undefined;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      to = formData.get("to") as string;
      subject = formData.get("subject") as string;
      html = (formData.get("html") as string) || undefined;
      text = (formData.get("text") as string) || undefined;
      tag = (formData.get("tag") as string) || undefined;
    } else {
      const body = await req.json();
      to = body.to;
      subject = body.subject;
      html = body.html;
      text = body.text;
      tag = body.tag;
    }

    if (!to || !subject) {
      return NextResponse.json({ error: "to and subject are required" }, { status: 400, headers: NO_STORE });
    }

    if (!html && !text) {
      text = "(empty test email)";
    }

    const result = await sendEmail({ to, subject, html, text, tag });
    const rawId: string = result.id ?? "";
    const messageId: string = rawId.replace(/^<|>$/g, "");

    // Redirect back to send-test page with success
    const redirectUrl = new URL("/admin/email/send-test", req.url);
    redirectUrl.searchParams.set("sent", messageId);
    return NextResponse.redirect(redirectUrl, 303);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
    }
    console.error("[admin/email/send-test] Error:", message);
    // Redirect back with error
    const redirectUrl = new URL("/admin/email/send-test", req.url);
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl, 303);
  }
}
