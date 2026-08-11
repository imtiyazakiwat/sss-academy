import "server-only";

import { smtpTransport } from "@/lib/smtp-transport";

export interface MailMessage {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export type MailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export interface MailTransport {
  readonly name: string;
  send(message: MailMessage): Promise<MailResult>;
}

const noopTransport: MailTransport = {
  name: "noop",
  async send(message) {
    console.info("[mail] no transport configured; message not sent", {
      subject: message.subject,
      bytes: message.body.length,
    });
    return { ok: false, error: "No mail transport is configured." };
  },
};

let transport: MailTransport = noopTransport;

/** Swap the transport in. */
export function setMailTransport(next: MailTransport): void {
  transport = next;
}

export function isMailConfigured(): boolean {
  if (transport.name !== "noop") return true;
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    setMailTransport(smtpTransport);
    return true;
  }
  return false;
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  if (transport.name === "noop" && process.env.SMTP_USER && process.env.SMTP_PASS) {
    setMailTransport(smtpTransport);
  }

  try {
    return await transport.send(message);
  } catch (error) {
    console.error("[mail] transport threw", error);
    return { ok: false, error: "Mail transport failed." };
  }
}
