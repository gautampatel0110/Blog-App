import nodemailer from "nodemailer";

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

export default async function sendMail({ to, subject, html }: SendMailInput): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.warn("Email not sent: SMTP settings are incomplete");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({ from: `"Blog App" <${SMTP_FROM}>`, to, subject, html });
  console.info(`Email sent to ${to}`);
}
