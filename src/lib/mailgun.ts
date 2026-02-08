import Mailgun from "mailgun.js";
import FormData from "form-data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _mgClient: any = null;
let _domain: string | undefined;

function getMgClient(): { client: any; domain: string } {
  if (!_mgClient) {
    const apiKey: string | undefined = process.env.MAILGUN_API_KEY;
    _domain = process.env.MAILGUN_DOMAIN;
    const region: string | undefined = process.env.MAILGUN_REGION; // "EU" | "US"

    if (!apiKey) {
      throw new Error("Missing MAILGUN_API_KEY environment variable.");
    }
    if (!_domain) {
      throw new Error("Missing MAILGUN_DOMAIN environment variable.");
    }

    const mailgun = new Mailgun(FormData);
    _mgClient = mailgun.client({
      username: "api",
      key: apiKey,
      url: region === "EU" ? "https://api.eu.mailgun.net" : undefined,
    });
  }
  return { client: _mgClient, domain: _domain! };
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  tag?: string;
  user_id?: string;
  meta?: Record<string, string>;
}

export interface SendEmailResult {
  id: string;
  message: string;
}

/**
 * Send an email via Mailgun.
 * Server-only – never import this in client components.
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const { client, domain } = getMgClient();
  const { to, subject, text, html, tag, user_id, meta } = params;

  const toArray: string[] = Array.isArray(to) ? to : [to];

  const messageData: Record<string, unknown> = {
    from: `VexNexa <noreply@${domain}>`,
    to: toArray,
    subject,
  };

  if (text) messageData.text = text;
  if (html) messageData.html = html;
  if (tag) messageData["o:tag"] = tag;
  if (user_id) messageData["v:user_id"] = user_id;

  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      messageData[`v:${key}`] = value;
    }
  }

  // mailgun.js types don't account for custom variables (v:*) and options (o:*)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await client.messages.create(domain, messageData as any);

  return {
    id: result.id ?? "",
    message: result.message ?? "",
  };
}

export function getMailgunDomain(): string {
  return getMgClient().domain;
}
