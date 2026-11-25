import nodemailer from "nodemailer";

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export function isMailConfigured(): boolean {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
}

/** Sends an email. Returns false (instead of throwing) when SMTP is missing or the send fails. */
export default async function sendMail({ to, subject, html, text }: SendMailInput): Promise<boolean> {
  if (!isMailConfigured()) {
    console.warn(`Email to ${to} not sent: SMTP settings are incomplete`);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({ from: `"Rapid Page Generator" <${process.env.SMTP_FROM}>`, to, subject, html, text });
    console.info(`Email "${subject}" sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`Email "${subject}" to ${to} failed:`, error);
    return false;
  }
}
