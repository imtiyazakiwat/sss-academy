import "server-only";

/**
 * Outbound mail transport.
 *
 * There is no transport wired up yet. Every caller persists its message to
 * Firestore first and treats sending as a separate, fallible step, so replies
 * written in the dashboard are never lost to a mail failure — they are simply
 * marked `not-sent` until a real transport exists.
 *
 * Adding one means replacing `noopTransport` and nothing else. Note for later:
 * Gmail cannot send with an API key. It needs an OAuth2 refresh token with the
 * `gmail.send` scope, or a service account with domain-wide delegation on a
 * Workspace domain. SMTP with an app password is the shortest path.
 */

export interface MailMessage {
  to: string;
  subject: string;
  body: string;
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
      to: message.to,
      subject: message.subject,
      bytes: message.body.length,
    });
    return { ok: false, error: "No mail transport is configured." };
  },
};

let transport: MailTransport = noopTransport;

/** Swap the transport in. Called from a bootstrap module once one exists. */
export function setMailTransport(next: MailTransport): void {
  transport = next;
}

export function isMailConfigured(): boolean {
  return transport.name !== "noop";
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  try {
    return await transport.send(message);
  } catch (error) {
    console.error("[mail] transport threw", error);
    return { ok: false, error: "Mail transport failed." };
  }
}
