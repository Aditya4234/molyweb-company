import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<{ sent: boolean; mode: "smtp" | "log" }> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@molyweb.com";
  const mailer = getTransporter();

  if (mailer) {
    await mailer.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, "<br>"),
    });
    return { sent: true, mode: "smtp" };
  }

  console.log(`[Email] To: ${options.to} | Subject: ${options.subject}\n${options.text}`);
  return { sent: true, mode: "log" };
}

export async function sendInvoiceEmail(to: string, invoiceId: string, amount: number, clientName: string) {
  return sendEmail({
    to,
    subject: `Invoice ${invoiceId} from MolyWeb`,
    text: `Dear ${clientName},\n\nPlease find your invoice ${invoiceId} for $${amount.toLocaleString()}.\n\nThank you for your business.\n\nMolyWeb Team`,
  });
}

export async function sendInvoiceReminder(to: string, invoiceId: string, amount: number, dueDate: string) {
  return sendEmail({
    to,
    subject: `Payment Reminder: Invoice ${invoiceId}`,
    text: `This is a friendly reminder that invoice ${invoiceId} for $${amount.toLocaleString()} is due on ${dueDate}.\n\nPlease arrange payment at your earliest convenience.\n\nMolyWeb Team`,
  });
}
