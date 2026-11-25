import { escapeHtml } from "./html";

const BRAND = "#5B4CF5";

/** Shared, email-client-safe layout (tables + inline styles). */
function layout(heading: string, content: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f7;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1f2937">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <tr><td style="background:${BRAND};padding:20px 32px;color:#ffffff;font-size:18px;font-weight:700">Rapid Page Generator</td></tr>
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 16px;font-size:22px;color:#111827">${heading}</h1>
      ${content}
    </td></tr>
    <tr><td style="padding:16px 32px;background:#f9fafb;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb">
      You received this email because of activity on your Rapid Page Generator account. If this wasn't you, you can safely ignore it.
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px">${label}</a>`;
}

export function verificationEmail(name: string, code: string, minutes: number) {
  return {
    subject: `${code} is your verification code`,
    text: `Hi ${name}, your Rapid Page Generator verification code is ${code}. It expires in ${minutes} minutes.`,
    html: layout(
      "Verify your email",
      `<p style="margin:0 0 20px;line-height:1.6">Hi ${escapeHtml(name)}, welcome aboard! Enter this code to finish creating your account:</p>
       <div style="font-size:34px;font-weight:700;letter-spacing:10px;text-align:center;background:#f1f0ff;color:${BRAND};border-radius:12px;padding:18px 0;margin:0 0 20px">${code}</div>
       <p style="margin:0;color:#6b7280;font-size:14px">The code expires in ${minutes} minutes. Never share it with anyone.</p>`,
    ),
  };
}

export function passwordResetEmail(name: string, link: string, minutes: number) {
  return {
    subject: "Reset your password",
    text: `Hi ${name}, reset your password within ${minutes} minutes: ${link}`,
    html: layout(
      "Reset your password",
      `<p style="margin:0 0 24px;line-height:1.6">Hi ${escapeHtml(name)}, we received a request to reset your password. The link is valid for ${minutes} minutes.</p>
       <p style="margin:0 0 24px">${button(link, "Choose a new password")}</p>
       <p style="margin:0;color:#6b7280;font-size:13px;word-break:break-all">Or paste this link into your browser:<br>${link}</p>`,
    ),
  };
}

export function publishedEmail(title: string, link: string) {
  return {
    subject: "Your blog is now live",
    text: `"${title}" has been published: ${link}`,
    html: layout(
      "Your post is live 🎉",
      `<p style="margin:0 0 24px;line-height:1.6"><strong>${escapeHtml(title)}</strong> was published on schedule and is now visible to readers.</p>
       <p style="margin:0">${button(link, "View post")}</p>`,
    ),
  };
}
