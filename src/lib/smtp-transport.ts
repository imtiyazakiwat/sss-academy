import "server-only";

import nodemailer from "nodemailer";
import type { MailMessage, MailResult, MailTransport } from "@/lib/mail";

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number.parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: user.trim(),
      pass: pass.replace(/\s+/g, ""),
    },
  });
}

export const smtpTransport: MailTransport = {
  name: "smtp",
  async send(message: MailMessage): Promise<MailResult> {
    const transporter = getTransporter();

    if (!transporter) {
      console.warn("[smtp] SMTP credentials missing (SMTP_USER or SMTP_PASS not set)");
      return { ok: false, error: "SMTP credentials are not configured." };
    }

    const defaultFrom = process.env.SMTP_FROM || `SSS Academy <${process.env.SMTP_USER}>`;

    try {
      const info = await transporter.sendMail({
        from: message.from || defaultFrom,
        to: message.to,
        subject: message.subject,
        text: message.body,
        html: message.html || undefined,
        replyTo: message.replyTo || undefined,
      });

      console.info("[smtp] Mail sent successfully", { messageId: info.messageId, to: message.to });
      return { ok: true, id: info.messageId };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      console.error("[smtp] Failed to send mail", error);
      return { ok: false, error: errMessage };
    }
  },
};
