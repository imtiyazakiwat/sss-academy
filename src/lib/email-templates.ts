import { site } from "@/content/site";

interface EnquiryNotificationInput {
  id: string;
  name: string;
  email: string;
  phone: string;
  course?: string;
  message: string;
  dashboardUrl?: string;
}

/**
 * Branded HTML template for internal notifications when a new contact form enquiry is received.
 */
export function enquiryNotificationTemplate(data: EnquiryNotificationInput): {
  subject: string;
  text: string;
  html: string;
} {
  const courseDisplay = data.course || "General Enquiry / Not Specified";
  const subject = `[New Enquiry] ${data.name} - ${courseDisplay}`;

  const text = `
New enquiry received on ${site.name}:

Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email}
Course of Interest: ${courseDisplay}

Message:
${data.message}

Reference ID: ${data.id}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px 32px; border-bottom: 3px solid #3b82f6;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">${site.name}</h1>
      <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">New Enquiry Notification</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <span style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">New Contact Submission</span>
        <h2 style="margin: 0; font-size: 18px; color: #0f172a;">Enquiry Details</h2>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">Name:</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Phone:</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">
            <a href="tel:+91${data.phone}" style="color: #2563eb; text-decoration: none;">+91 ${data.phone}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email:</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">
            <a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none;">${data.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Course:</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">${courseDisplay}</td>
        </tr>
      </table>

      <!-- Message box -->
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 4px; margin-bottom: 28px;">
        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Message Body</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${data.message}</p>
      </div>

      ${
        data.dashboardUrl
          ? `
      <div style="text-align: center; margin-top: 28px;">
        <a href="${data.dashboardUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Open in Admin Dashboard &rarr;</a>
      </div>
      `
          : ""
      }
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      Reference ID: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #475569;">${data.id}</code>
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, text, html };
}

interface AdminReplyInput {
  userName: string;
  replyBody: string;
  adminName?: string;
  courseName?: string;
}

/**
 * Branded HTML template for admin replies sent directly to the enquirer.
 */
export function adminReplyTemplate(data: AdminReplyInput): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Re: Your enquiry to ${site.name}`;
  const senderName = data.adminName || `${site.name} Team`;

  const text = `
Dear ${data.userName},

${data.replyBody}

Best regards,
${senderName}
${site.name}
Phone: +91 6360304019
Website: ${site.url}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 28px 32px; border-bottom: 3px solid #10b981;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">${site.name}</h1>
      <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">${site.tagline}</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="font-size: 15px; color: #334155; margin-top: 0; margin-bottom: 20px;">Dear <strong>${data.userName}</strong>,</p>

      <div style="font-size: 15px; line-height: 1.7; color: #1e293b; margin-bottom: 28px; white-space: pre-wrap; background-color: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid #f1f5f9;">${data.replyBody}</div>

      <p style="font-size: 14px; color: #475569; margin-bottom: 4px;">Best regards,</p>
      <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">${senderName}</p>
      <p style="font-size: 13px; color: #64748b; margin: 2px 0 0 0;">${site.name}</p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">${site.name} — Above IDBI Bank, B.K. College Road, Chikkodi, Karnataka 591201</p>
      <p style="margin: 0;">
        Call us: <a href="tel:+916360304019" style="color: #2563eb; text-decoration: none;">+91 6360304019</a> | 
        Visit: <a href="${site.url}" style="color: #2563eb; text-decoration: none;">sssacademy.in</a>
      </p>
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, text, html };
}
